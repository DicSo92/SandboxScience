<template>
    <div flex-1 relative>
        <canvas ref="canvas" id="canvas" @contextmenu.prevent></canvas>
        <canvas ref="overlayCanvas" absolute top-0 id="overlayCanvas" @contextmenu.prevent></canvas>
    </div>
</template>

<script lang="ts">
import { aliveNeighbours, initAliveNeighboursFunc, pixelToCell } from "~/helpers/utils/naiveLife";
import { generateColorRange, hexToBgr, bgrToHex, themes } from "~/helpers/utils/themes";

export default defineComponent({
    setup() {
        const game = useGameStore()
        const canvas: Ref<HTMLCanvasElement | undefined> = ref()
        const overlayCanvas: Ref<HTMLCanvasElement | undefined> = ref()
        let ctx: CanvasRenderingContext2D | undefined
        let overlayCtx: CanvasRenderingContext2D | undefined

        let imageData: ImageData | undefined
        let imageDataArray: Int32Array | number[]
        let rowx: number = 0 // starting row
        let colx: number = 0 // starting column
        let pop: number = 0

        let cellsArray: Int32Array[]
        let cellsArrayNext: Int32Array[]
        let canvasWidth: number = 0
        let canvasHeight: number = 0
        let cellSize: number = Math.max(1, game.size.valueOf())

        const zoom = ref(0)
        const prevChangedCell = ref<{ x: number, y: number } | null>(null)

        let aliveSteps = 0
        let deadSteps = 0
        let themeColors = {
            background: <number | null>null,
            alive: <number | null>null,
            aliveRamp: <number | null>null,
            dead: <number | null>null,
            deadRamp: <number | null>null,
            aliveColors: <number[] | null>null,
            deadColors: <number[] | null>null
        }

        onMounted(() => {
            ctx = canvas.value?.getContext('2d') || undefined
            overlayCtx = overlayCanvas.value?.getContext('2d') || undefined
            initCanvas()
        })
        watch(() => game.EDGEMODE, () => {
            console.log('EDGEMODE changed', game.EDGEMODE)
            initAliveNeighboursFunc(game.EDGEMODE)
        })
        watch(() => game.themeId, (newValue, prevValue) => {
            initThemeAndRules(prevValue)
        })
        // -------------------------------------------------------------------------------------------------------------
        function toggleCell(cursorX: number, cursorY: number, type?: "draw" | "erase" | "toggle") {
            const cell: { x: number, y: number } = pixelToCell(cursorX, cursorY, colx, rowx, game.size) // get the cell x and y from the cursor position

            if (cell.x < 0 || cell.x > game.cols - 1 || cell.y < 0 || cell.y > game.rows - 1) return // return if cell is outside the grid
            if (prevChangedCell.value && prevChangedCell.value.x === cell.x && prevChangedCell.value.y === cell.y) return // return if same cell as last time

            if (type === "draw") {
                cellsArray[cell.x][cell.y] = 1 // makeAlive(true)
                cellsArrayNext[cell.x][cell.y] = 1
            } else if (type === "erase") {
                cellsArray[cell.x][cell.y] = 0 // kill(true)
                cellsArrayNext[cell.x][cell.y] = 0
            } else {
                // toggle()
                const newState = cellsArray[cell.x][cell.y] === 1 ? 0 : 1
                cellsArray[cell.x][cell.y] = newState
                cellsArrayNext[cell.x][cell.y] = newState
            }
            prevChangedCell.value = cell
            drawCellsFromCellsArray()
        }
        function handleZoom(zoomFactor: number, cursorX?: number, cursorY?: number) {
            if (zoom.value + zoomFactor > 4 || zoom.value + zoomFactor < -8) return // Limit zoom
            cursorX = cursorX || canvasWidth / 2 // if no x is provided, use the center of the canvas
            cursorY = cursorY || canvasHeight / 2 // if no y is provided, use the center of the canvas

            zoom.value += zoomFactor // Increase or decrease zoom
            game.size *= Math.pow(2, zoomFactor) // Divide or multiply size by 2
            cellSize = Math.max(1, game.size.valueOf()) // Set the new cellSize (non-reactive), but keep it at least 1 pixel
            // Adjust colx and rowx to keep the zoom centered on the pointer
            colx = cursorX - (cursorX - colx) * Math.pow(2, zoomFactor)
            rowx = cursorY - (cursorY - rowx) * Math.pow(2, zoomFactor)

            if (!game.isRunning) requestAnimationFrame(drawCellsFromCellsArray) // redraw

        }
        function handleMove(e: { movementY: number; movementX: number; }) {
            rowx += e.movementY
            colx += e.movementX
            if (!game.isRunning) requestAnimationFrame(drawCellsFromCellsArray) // redraw
        }
        function handleResize() {
            canvasWidth = canvas.value!.width = overlayCanvas.value!.width = canvas.value!.clientWidth
            canvasHeight = canvas.value!.height = overlayCanvas.value!.height = canvas.value!.clientHeight

            if (!game.isRunning) requestAnimationFrame(drawCellsFromCellsArray) // redraw
        }
        function handleSideHover(pointerX: number, pointerY: number) {
            let activeRange = Math.max(16, cellSize)

            if (pointerY > (rowx - activeRange) && pointerY < (rowx + activeRange)) {
                game.hoveredSide = 1
            } else if (pointerY > (rowx + game.rows * game.size - activeRange) && pointerY < (rowx + game.rows * game.size + activeRange)) {
                game.hoveredSide = 2
            } else if (pointerX > (colx - activeRange) && pointerX < (colx + activeRange)) {
                game.hoveredSide = 3
            } else if (pointerX > (colx + game.cols * game.size - activeRange) && pointerX < (colx + game.cols * game.size + activeRange)) {
                game.hoveredSide = 4
            } else {
                game.hoveredSide = null
            }
        }
        function handleGridResize(pointerX: number, pointerY: number) {
            const cell: { x: number, y: number } = pixelToCell(pointerX, pointerY, colx, rowx, game.size) // get the cell x and y from the cursor position

            if (game.hoveredSide === null) return
            if (game.hoveredSide === 1 && cell.y !== 0 && cell.y < game.rows) {
                expandGrid("top", -cell.y)
            } else if (game.hoveredSide === 2 && cell.y !== game.rows - 1 && cell.y >= 0) {
                expandGrid("bottom", -(game.rows - 1 - cell.y))
            } else if (game.hoveredSide === 3 && cell.x !== 0 && cell.x < game.cols) {
                expandGrid("left", -cell.x)
            } else if (game.hoveredSide === 4 && cell.x !== game.cols - 1 && cell.x >= 0) {
                expandGrid("right", -(game.cols - 1 - cell.x))
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        function initCanvas() {
            initThemeAndRules(undefined, true)
            cellsArrayNext = Array(game.cols).fill(null).map(() => new Int32Array(game.rows).fill(0))
            cellsArray = Array(game.cols).fill(null).map(() => new Int32Array(game.rows).fill(0))

            console.log(cellsArray)
            console.table(cellsArray)

            initAliveNeighboursFunc(game.EDGEMODE)
            handleResize() // resize and draw the grid
            center() // center the grid on the canvas view
        }
        function newCycle() {
            ctx!.clearRect(0, 0, canvasWidth, canvasHeight)
            drawCellsWithRules()
            game.generation++
        }
        function drawCellsWithRules() {
            imageData = ctx!.createImageData(canvasWidth, canvasHeight)
            imageDataArray = new Int32Array(imageData.data.buffer)

            const maxNeighbours = game.maxNeighbours.valueOf()
            const rows = game.rows.valueOf()
            const cols = game.cols.valueOf()
            const BORN = game.BORN.valueOf()
            const SURVIVES = game.SURVIVES.valueOf()
            const size = game.size.valueOf()

            // logic to draw cells
            // cellsArrayNext = Array(cols).fill(null).map(() => new Int32Array(rows).fill(0)) // old way, garbage collection is slow
            pop = 0
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const cellState = processRules(x, y, SURVIVES, BORN, aliveNeighbours(x, y, maxNeighbours, cellsArray, rows, cols))
                    cellsArrayNext[x][y] = cellState
                    processCell(cellState, x, y, size)
                }
            }
            game.population = pop

            // copy cellsArrayNext to cellsArray
            // Optimize by not creating a new array (cellsArrayNext) on each cycle (see above)
            // Garbage collection is slow, so we should avoid creating big arrays on each cycle
            for (let i = 0; i < cellsArrayNext.length; i++) {
                for (let j = 0; j < cellsArrayNext[i].length; j++) {
                    cellsArray[i][j] = cellsArrayNext[i][j]
                }
            }
            // cellsArray = cellsArrayNext // old way

            ctx!.putImageData(imageData, 0, 0)
            drawGrid(cols, rows, size)
        }
        function drawCellsFromCellsArray() {
            ctx!.clearRect(0, 0, canvasWidth, canvasHeight)

            imageData = ctx!.createImageData(canvasWidth, canvasHeight)
            imageDataArray = new Int32Array(imageData.data.buffer)
            const cols = game.cols.valueOf()
            const rows = game.rows.valueOf()
            const size = game.size.valueOf()

            pop = 0
            for (let y = 0; y < rows; y++) { // create cells array
                for (let x = 0; x < cols; x++) {
                    processCell(cellsArray[x][y], x, y, size)
                }
            }
            game.population = pop

            ctx!.putImageData(imageData, 0, 0)
            drawGrid(cols, rows, size)
        }
        function initThemeAndRules(prevTheme?: number, isInit: boolean = false) {
            aliveSteps = game.aliveSteps.valueOf()
            deadSteps = game.deadSteps.valueOf()

            const theme = themes[game.themeId]
            setTheme(theme)
            if (theme.type === 'simple') { // Dead Mode
                processRules = processRulesClassic
                processCell = processCellClassic
                if (prevTheme !== undefined && themes[prevTheme].type === 'history') {
                    cellsArray = cellsArray.map(row => row.map(cell => cell < 0 ? -1 : cell > 0 ? 1 : 0))
                }
            } else if (theme.type === 'history') { // Alive Mode
                processRules = processRulesColors
                processCell = processCellColors
                if (prevTheme !== undefined && themes[prevTheme].type === 'simple') {
                    cellsArray = cellsArray.map(row => row.map(cell => cell < 0 ? -deadSteps : cell))
                }
            } else {
                console.log('EDGEMODE not found')
            }
            if (!isInit) drawCellsFromCellsArray()
        }

        let processRules: (x: number, y: number, SURVIVES: any, BORN: any, aliveNeighbours: number) => number
        function processRulesClassic(x: number, y: number, SURVIVES: any, BORN: any, aliveNeighbours: number): number { // return if cell has changed
            const cell = cellsArray[x][y]
            if (cell === 1 && SURVIVES.includes(aliveNeighbours)) { // Survives
                return 1
            } else if (cell !== 1 && BORN.includes(aliveNeighbours)) { // Born
                return 1
            } else { // Dies
                if (cell === 0) return 0
                else return -1 // cell was alive and dies
            }
        }
        function processRulesColors(x: number, y: number, SURVIVES: any, BORN: any, aliveNeighbours: number): number { // return if cell has changed
            const cell = cellsArray[x][y]
            if (cell > 0 && SURVIVES.includes(aliveNeighbours)) { // Survives
                return Math.min(aliveSteps, cell + 1)
            } else if (cell <= 0 && BORN.includes(aliveNeighbours)) { // Born
                return 1
            } else { // Dies or stays dead
                if (cell > 0) return -1
                else if (cell < 0) {
                    return Math.max(-deadSteps, cell - 1)
                } else {
                    return 0
                }
            }
        }
        let processCell: (cellState: number, x: number, y: number, size: number) => void
        function processCellClassic(cellState: number, x: number, y: number, size: number) {
            if (cellState > 0) {
                pop++
                fillSquare(x, y, size, colx, rowx, themeColors.alive!)
            }
        }
        function processCellColors(cellState: number, x: number, y: number, size: number) {
            if (cellState > 0) {
                pop++
                // console.log('Applying alive color:', themeColors.aliveColors![cellState - 1]);
                fillSquare(x, y, size, colx, rowx, themeColors.aliveColors![cellState - 1])
            } else if (cellState < 0) {
                // console.log('Applying dead color:', themeColors.deadColors![Math.abs(cellState) - 1])
                fillSquare(x, y, size, colx, rowx, themeColors.deadColors![Math.abs(cellState) - 1])
            }
        }
        function fillSquare(x: number, y: number, floatCellSize: number, colx: number, rowx: number, cellColor: number) { // fill a square by changing the imageDataArray values directly (faster than fillRect)
            x = x * floatCellSize
            y = y * floatCellSize
            let width = cellSize
            let height = cellSize

            if ((x + colx) < 0) { // if cell is outside the canvas on the left
                width += (x + Math.floor(colx))
                x = -Math.floor(colx)
            }
            else if ((x + colx) + width > canvasWidth) { // if cell is outside the canvas on the right
                width = canvasWidth - (x + Math.floor(colx))
            }
            if (width < 0) return // if cell is outside the canvas horizontally (or too small)

            if ((y + rowx) < 0) { // if cell is outside the canvas on the top
                height += (y + Math.floor(rowx))
                y = -Math.floor(rowx)
            }
            else if ((y + rowx) + height > canvasHeight) { // if cell is outside the canvas on the bottom
                height = canvasHeight - (y + Math.floor(rowx))
            }
            if (height < 0) return // if cell is outside the canvas vertically (or too small)

            let imageDataIndex = ((Math.floor(rowx) + Math.floor(y)) * canvasWidth) + (Math.floor(colx) + Math.floor(x)) // Get the index of the first pixel of the cell
            width = Math.floor(width) // Make sure width is an integer
            height = Math.floor(height) // Make sure height is an integer
            const widthOffset = canvasWidth - width  // Offset to jump to the next row
            for (let i = 0; i < height; i++) {
                for (let j = 0; j < width; j++) { // fill a row
                    imageDataArray![imageDataIndex++] = cellColor
                }
                imageDataIndex += widthOffset // jump to next row
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        function drawGrid(cols: number, rows: number, size: number) {
            ctx!.beginPath()
            if (size < 8) { // draw a simple grid if size is too small
                drawHorizontalLine(0, cols, size, ctx)
                drawHorizontalLine(rows, cols, size, ctx)
                drawVerticalLine(0, rows, size, ctx)
                drawVerticalLine(cols, rows, size, ctx)
            } else {
                for (let row = 0; row <= rows; row++) {
                    drawHorizontalLine(row, cols, size, ctx)
                }
                for (let col = 0; col <= cols; col++) {
                    drawVerticalLine(col, rows, size, ctx)
                }
            }
            ctx!.strokeStyle = '#707070'
            ctx!.stroke()
        }
        function drawOverlayGrid(cols: number, rows: number, size: number) {
            overlayCtx!.clearRect(0, 0, canvasWidth, canvasHeight)
            const hoveredSide = game.hoveredSide
            if (hoveredSide !== null) {
                overlayCtx!.beginPath()
                if (hoveredSide === 1) {
                    drawHorizontalLine(0, cols, size, overlayCtx)
                } else if (hoveredSide === 2) {
                    drawHorizontalLine(rows, cols, size, overlayCtx)
                } else if (hoveredSide === 3) {
                    drawVerticalLine(0, rows, size, overlayCtx)
                } else if (hoveredSide === 4) {
                    drawVerticalLine(cols, rows, size, overlayCtx)
                }
                overlayCtx!.strokeStyle = '#c31313'
                overlayCtx!.lineWidth = 2
                overlayCtx!.stroke()
            }
        }
        function drawHorizontalLine(row: number, cols: number, size: number, ctx: CanvasRenderingContext2D | undefined) {
            const x = colx + (cols * size)
            const y = rowx + (size * row)

            ctx!.moveTo(colx, y)
            ctx!.lineTo(x, y)
        }
        function drawVerticalLine(col: number, rows: number, size: number, ctx: CanvasRenderingContext2D | undefined) {
            const x = colx + (size * col)
            const y = rowx + (rows * size)

            ctx!.moveTo(x, rowx)
            ctx!.lineTo(x, y)
        }
        function expandGrid(side:  string, factor: number = 1) {
            const newCols = side === "left" || side === "right" ? game.cols.valueOf() + factor : game.cols.valueOf()
            const newRows = side === "top" || side === "bottom" ? game.rows.valueOf() + factor : game.rows.valueOf()

            const newCellsArray = Array(newCols).fill(null).map(() => new Int32Array(newRows).fill(0))
            cellsArrayNext = Array(newCols).fill(null).map(() => new Int32Array(newRows).fill(0))

            if (side === "top") {
                for (let i = 0; i < game.cols.valueOf(); i++) {
                    for (let j = 0; j < game.rows.valueOf(); j++) {
                        newCellsArray[i][j + factor] = cellsArray[i][j]
                    }
                }
            } else if (side === "bottom") {
                for (let i = 0; i < game.cols.valueOf(); i++) {
                    for (let j = 0; j < game.rows.valueOf(); j++) {
                        newCellsArray[i][j] = cellsArray[i][j]
                    }
                }
            } else if (side === "left") {
                for (let i = 0; i < game.cols.valueOf(); i++) {
                    if (i + factor < 0) continue
                    for (let j = 0; j < game.rows.valueOf(); j++) {
                        newCellsArray[i + factor][j] = cellsArray[i][j]
                    }
                }
            } else if (side === "right") {
                for (let i = 0; i < game.cols.valueOf(); i++) {
                    if (i >= newCols) continue
                    for (let j = 0; j < game.rows.valueOf(); j++) {
                        newCellsArray[i][j] = cellsArray[i][j]
                    }
                }
            }
            cellsArray = newCellsArray
            game.cols = newCols
            game.rows = newRows
            colx += side === "left" ? -factor * game.size.valueOf() : 0
            rowx += side === "top" ? -factor * game.size.valueOf() : 0
            if (!game.isRunning) requestAnimationFrame(drawCellsFromCellsArray) // redraw
            drawOverlayGrid(game.cols, game.rows, game.size) // redraw overlay grid
        }
        // -------------------------------------------------------------------------------------------------------------
        function center() {
            rowx = (canvasHeight - (game.size * game.rows)) / 2
            colx = (canvasWidth - (game.size * game.cols)) / 2
        }
        function getCellsArray() {
            return cellsArray
        }
        function setCell(x: number, y: number, value: number) {
            cellsArray[x][y] = value
        }
        function setTheme(theme: any) {
            themeColors.background = theme.BACKGROUND
            themeColors.alive = bgrToHex(hexToBgr(theme.ALIVE)!)
            themeColors.dead = bgrToHex(hexToBgr(theme.DEAD)!)
            if (theme.ALIVERAMP) {
                themeColors.aliveRamp = theme.ALIVERAMP || null
                themeColors.aliveColors = theme.ALIVERAMP ? generateColorRange(theme.ALIVE, theme.ALIVERAMP, aliveSteps) : null
            }
            if (theme.DEADRAMP) {
                themeColors.deadRamp = theme.DEADRAMP || null
                themeColors.deadColors = theme.DEADRAMP ? generateColorRange(theme.DEAD, theme.DEADRAMP, deadSteps) : null
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        return { canvas, ctx, prevChangedCell, overlayCanvas, handleSideHover, drawOverlayGrid,
            newCycle, drawCellsFromCellsArray, handleZoom, handleResize, toggleCell,
            handleMove, getCellsArray, setCell, expandGrid, handleGridResize
        }
    }
})
</script>

<style scoped>
#canvas {
    background: #303030;
    width: 100%;
    height: 100%;
    cursor: crosshair;
}
#overlayCanvas {
    @apply bg-transparent;
    width: 100%;
    height: 100%;
    cursor: crosshair;
}
</style>
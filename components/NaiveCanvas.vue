<template>
    <div flex-1>
        <canvas ref="canvas" @contextmenu.prevent></canvas>
        <p absolute text-center transform top-0 class="-translate-x-1/2 left-1/2">x: {{ pointerX }} - y: {{ pointerY }}</p>
    </div>
</template>

<script lang="ts">
import { Cell } from "~/models/classes/Cell";
import type { ICell } from "~/models/interfaces/ICell.interface";
import { aliveNeighbours, pixelToCell, XYToIndex } from "~/helpers/utils/naiveLife";

export default defineComponent({
    setup() {
        const game = useGameStore()
        const canvas: Ref<HTMLCanvasElement | undefined> = ref()
        const ctx: Ref<CanvasRenderingContext2D | undefined> = ref()

        const imageData = ref()
        const imageDataArray = ref<Int32Array | number[]>()

        const pointerX = ref(0)
        const pointerY = ref(0)
        const zoom = ref(0)

        const isDragging = ref(false)
        const prevChangedCell = ref<{ x: number, y: number } | null>(null)

        const cellWidth = computed(() => {
            return Math.max(1, game.size)
        })

        onMounted(() => {
            ctx.value = canvas.value?.getContext('2d') || undefined
            initCanvas()

            useEventListener('resize', handleResize)
            useEventListener(canvas.value, ['mousemove'], (e) => {
                pointerX.value = e.x - canvas.value!.offsetLeft
                pointerY.value = e.y - canvas.value!.offsetTop

                if (e.buttons > 0) { // if mouse is pressed
                    isDragging.value = true
                    if (e.buttons === 1) { // if primary button is pressed (left click)
                        if (game.wasRunning === null) game.wasRunning = game.isRunning // store the running state
                        game.isRunning = false // pause the game
                        toggleCell(e.x - canvas.value!.offsetLeft, e.y - canvas.value!.offsetTop, 'draw') // add cell at cursor position
                    } else if (e.buttons === 2) { // if secondary button is pressed (right click)
                        game.rowx += e.movementY
                        game.colx += e.movementX
                        drawCellsFromCellsArray()
                    }
                } else {
                    isDragging.value = false
                    prevChangedCell.value = null
                    if (game.wasRunning !== null) {
                        game.isRunning = game.wasRunning
                        game.wasRunning = null
                    }
                }
            })
            useEventListener(canvas.value, 'click', (e) => {
                if (!isDragging.value) {
                    prevChangedCell.value = null
                    toggleCell(e.x - canvas.value!.offsetLeft, e.y - canvas.value!.offsetTop)
                }
            })
            useEventListener(canvas.value, 'wheel', (e) => {
                if (e.deltaY < 0) { // Zoom in
                    handleZoom(1, e.x - canvas.value!.offsetLeft, e.y - canvas.value!.offsetTop)
                } else { // Zoom out
                    handleZoom(-1, e.x - canvas.value!.offsetLeft, e.y - canvas.value!.offsetTop)
                }
            })
        })
        // -------------------------------------------------------------------------------------------------------------
        function toggleCell(cursorX: number, cursorY: number, type?: "draw" | "erase" | "toggle") {
            const cell: { x: number, y: number } = pixelToCell(cursorX, cursorY) // get the cell x and y from the cursor position

            if (cell.x < 0 || cell.x > game.cols - 1 || cell.y < 0 || cell.y > game.rows - 1) return // return if cell is outside the grid
            if (prevChangedCell.value && prevChangedCell.value.x === cell.x && prevChangedCell.value.y === cell.y) return // return if same cell as last time

            if (type === "draw") {
                game.cellsArray[XYToIndex(cell.x, cell.y, game.cols)].makeAlive(true)
            } else if (type === "erase") {
                game.cellsArray[XYToIndex(cell.x, cell.y, game.cols)].kill(true)
            } else {
                game.cellsArray[XYToIndex(cell.x, cell.y, game.cols)].toggle()
            }
            prevChangedCell.value = cell
            drawCellsFromCellsArray()
        }
        function handleZoom(zoomFactor: number, cursorX?: number, cursorY?: number) {
            if (zoom.value + zoomFactor > 4 || zoom.value + zoomFactor < -4) return // Limit zoom
            cursorX = cursorX || game.canvasWidth / 2 // if no x is provided, use the center of the canvas
            cursorY = cursorY || game.canvasHeight / 2 // if no y is provided, use the center of the canvas

            zoom.value += zoomFactor // Increase or decrease zoom
            game.size *= Math.pow(2, zoomFactor) // Divide or multiply size by 2
            // Adjust colx and rowx to keep the zoom centered on the pointer
            game.colx = cursorX - (cursorX - game.colx) * Math.pow(2, zoomFactor)
            game.rowx = cursorY - (cursorY - game.rowx) * Math.pow(2, zoomFactor)

            drawCellsFromCellsArray() // redraw
        }
        function handleResize() {
            console.log(canvas.value!)
            game.canvasWidth = canvas.value!.width = canvas.value!.clientWidth
            game.canvasHeight = canvas.value!.height = canvas.value!.clientHeight
            drawCellsFromCellsArray()
        }
        function center() {
            game.rowx = (game.canvasHeight - (game.size * game.rows)) / 2
            game.colx = (game.canvasWidth - (game.size * game.cols)) / 2
        }
        // -------------------------------------------------------------------------------------------------------------
        function initCanvas() {
            for (let y = 0; y < game.rows; y++) { // create cells array
                for (let x = 0; x < game.cols; x++) {
                    let index = x + y * game.cols
                    game.cellsArray[index] = reactive(new Cell(x, y, game.size, ctx.value))
                }
            }
            console.log(game.cellsArray)

            game.canvasWidth = canvas.value!.width = canvas.value!.clientWidth
            game.canvasHeight = canvas.value!.height = canvas.value!.clientHeight
            center() // center the grid on the canvas view
            handleResize() // resize and draw the grid
        }
        function newCycle() {
            ctx.value!.clearRect(0, 0, game.canvasWidth, game.canvasHeight)
            drawCellsWithRules()
            drawGrid()
        }
        function drawGrid() {
            ctx.value!.beginPath()
            if (game.size < 8) { // draw a simple grid if size is too small
                drawHorizontalLine(0)
                drawHorizontalLine(game.rows)
                drawVerticalLine(0)
                drawVerticalLine(game.cols)
            } else {
                for (let row = 0; row < game.rows + 1; row++) {
                    drawHorizontalLine(row)
                }
                for (let col = 0; col < game.cols + 1; col++) {
                    drawVerticalLine(col)
                }
            }
            ctx.value!.strokeStyle = '#707070'
            ctx.value!.stroke()
        }
        function drawCellsWithRules() {
            imageData.value = ctx.value!.createImageData(game.canvasWidth, game.canvasHeight)
            imageDataArray.value = new Int32Array(imageData.value.data.buffer)

            // logic to draw cells
            console.log(game.cellsArray)
            let changedCells = [] as ICell[]
            game.cellsArray.forEach((cell, index) => {
                const hasChanged = processRules(cell, aliveNeighbours(cell.x, cell.y))
                if (hasChanged) changedCells.push(cell)
                if (cell.nextAlive) fillSquare(cell.x, cell.y, game.size)
            })
            changedCells.forEach((cell, index) => {
                cell.isAlive = cell.nextAlive
            })

            ctx.value!.putImageData(imageData.value, 0, 0)
        }
        // function drawCellsWithRules() {
        //     const ctxValue = ctx.value!;
        //     const canvasWidth = game.canvasWidth;
        //     const canvasHeight = game.canvasHeight;
        //     const cellSize = game.size;
        //     const cellsArray = game.cellsArray;
        //     const imageData = ctxValue.createImageData(canvasWidth, canvasHeight);
        //     imageDataArray.value = new Int32Array(imageData.data.buffer);
        //
        //     let changedCells = [] as ICell[]
        //     for (let i = 0; i < cellsArray.length; i++) {
        //         const cell = cellsArray[i];
        //         const hasChanged = processRules(cell, aliveNeighbours(cell.x, cell.y))
        //         if (hasChanged) changedCells.push(cell)
        //         if (cell.nextAlive) fillSquare(cell.x, cell.y, cellSize)
        //     }
        //     for (let i = 0; i < changedCells.length; i++) {
        //         const cell = changedCells[i];
        //         cell.isAlive = cell.nextAlive
        //     }
        //
        //     ctxValue.putImageData(imageData, 0, 0);
        // }
        function drawCellsFromCellsArray() {
            ctx.value!.clearRect(0, 0, game.canvasWidth, game.canvasHeight)

            imageData.value = ctx.value!.createImageData(game.canvasWidth, game.canvasHeight)
            imageDataArray.value = new Int32Array(imageData.value.data.buffer)
            game.cellsArray.forEach((cell, index) => {
                if (cell.isAlive) fillSquare(cell.x, cell.y, game.size)
            })
            ctx.value!.putImageData(imageData.value, 0, 0)
            drawGrid()
        }
        function fillSquare(x: number, y: number, cellSize: number) { // fill a square by changing the imageDataArray values directly (faster than fillRect)
            x = x * cellSize
            y = y * cellSize
            let width = cellWidth.value
            let height = cellWidth.value

            if ((x + game.colx) < 0) { // if cell is outside the canvas on the left
                width += (x + Math.floor(game.colx))
                x = -Math.floor(game.colx)
            }
            if ((x + game.colx) + width > game.canvasWidth) { // if cell is outside the canvas on the right
                width = game.canvasWidth - (x + Math.floor(game.colx))
            }
            if ((y + game.rowx) < 0) { // if cell is outside the canvas on the top
                height += (y + Math.floor(game.rowx))
                y = -Math.floor(game.rowx)
            }
            if ((y + game.rowx) + height > game.canvasHeight) { // if cell is outside the canvas on the bottom
                height = game.canvasHeight - (y + Math.floor(game.rowx))
            }

            let imageDataIndex = ((Math.floor(game.rowx) + Math.floor(y)) * game.canvasWidth) + (Math.floor(game.colx) + Math.floor(x)) // Get the index of the first pixel of the cell
            for (let i = 0; i < Math.floor(height); i++) {
                for (let j = 0; j < Math.floor(width); j++) { // fill a row
                    imageDataArray.value![imageDataIndex++] = 0xff000000
                }
                imageDataIndex += game.canvasWidth - Math.floor(width) // jump to next row
            }
        }
        function processRules(cell: ICell, aliveNeighbours: number): boolean { // return if cell has changed
            if (cell.isAlive && game.SURVIVES.includes(aliveNeighbours)) { // Survives
                return false
            } else if (!cell.isAlive && game.BORN.includes(aliveNeighbours)) { // Born
                cell.makeAlive()
                return true
            } else { // Dies
                if (cell.isAlive) cell.kill()
                return true
            }
        }
        function drawHorizontalLine(row: number) {
            const x = game.colx + (game.cols * game.size)
            const y = game.rowx + (game.size * row)
            ctx.value!.moveTo(game.colx, y)
            ctx.value!.lineTo(x, y)
        }
        function drawVerticalLine(col: number) {
            const x = game.colx + (game.size * col)
            const y = game.rowx + (game.rows * game.size)
            ctx.value!.moveTo(x, game.rowx)
            ctx.value!.lineTo(x, y)
        }

        return { canvas, ctx, pointerX, pointerY, newCycle, drawCellsFromCellsArray, handleZoom }
    }
})
</script>

<style scoped>
canvas {
    @apply bg-gray-700;
    width: 100%;
    height: 100%;
}
</style>
<template>
    <div flex-1>
        <canvas ref="canvas" @contextmenu.prevent></canvas>
    </div>
</template>

<script lang="ts">
import { aliveNeighbours, pixelToCell } from "~/helpers/utils/naiveLife";

export default defineComponent({
    setup() {
        const game = useGameStore()
        const canvas: Ref<HTMLCanvasElement | undefined> = ref()
        const ctx: Ref<CanvasRenderingContext2D | undefined> = ref()

        const imageData = ref()
        const imageDataArray = ref<Int32Array | number[]>()

        const zoom = ref(0)

        const prevChangedCell = ref<{ x: number, y: number } | null>(null)

        const cellWidth = computed(() => {
            return Math.max(1, game.size)
        })

        onMounted(() => {
            ctx.value = canvas.value?.getContext('2d') || undefined
            initCanvas()
        })
        // -------------------------------------------------------------------------------------------------------------
        function toggleCell(cursorX: number, cursorY: number, type?: "draw" | "erase" | "toggle") {
            const cell: { x: number, y: number } = pixelToCell(cursorX, cursorY) // get the cell x and y from the cursor position

            if (cell.x < 0 || cell.x > game.cols - 1 || cell.y < 0 || cell.y > game.rows - 1) return // return if cell is outside the grid
            if (prevChangedCell.value && prevChangedCell.value.x === cell.x && prevChangedCell.value.y === cell.y) return // return if same cell as last time

            if (type === "draw") {
                game.cellsArray[cell.x][cell.y] = 1 // makeAlive(true)
                game.cellsArrayNext[cell.x][cell.y] = 1
            } else if (type === "erase") {
                game.cellsArray[cell.x][cell.y] = 0 // kill(true)
                game.cellsArrayNext[cell.x][cell.y] = 0
            } else {
                // toggle()
                const newState = game.cellsArray[cell.x][cell.y] === 1 ? 0 : 1
                game.cellsArray[cell.x][cell.y] = newState
                game.cellsArrayNext[cell.x][cell.y] = newState
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
            game.cellsArrayNext = Array(game.cols).fill(null).map(() => new Int32Array(game.rows).fill(0))
            game.cellsArray = Array(game.cols).fill(null).map(() => new Int32Array(game.rows).fill(0))

            console.log(game.cellsArray)
            console.table(game.cellsArray)

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
        function drawCellsWithRules() {
            imageData.value = ctx.value!.createImageData(game.canvasWidth, game.canvasHeight)
            imageDataArray.value = new Int32Array(imageData.value.data.buffer)

            // logic to draw cells
            game.cellsArrayNext = Array(game.cols).fill(null).map(() => new Int32Array(game.rows).fill(0))
            for (let y = 0; y < game.rows; y++) {
                for (let x = 0; x < game.cols; x++) {
                    const cellState = processRules(x, y, aliveNeighbours(x, y))
                    if (cellState === 1) fillSquare(x, y, game.size)
                }
            }
            game.cellsArray = game.cellsArrayNext
            ctx.value!.putImageData(imageData.value, 0, 0)
        }
        function processRules(x: number, y: number, aliveNeighbours: number): number { // return if cell has changed
            const cell = game.cellsArray[x][y]
            if (cell === 1 && game.SURVIVES.includes(aliveNeighbours)) { // Survives
                game.cellsArrayNext[x][y] = game.cellsArray[x][y]
                return game.cellsArrayNext[x][y]
            } else if (cell !== 1 && game.BORN.includes(aliveNeighbours)) { // Born
                // cell.makeAlive()
                game.cellsArrayNext[x][y] = 1
                return 1
            } else { // Dies
                // if (cell.isAlive) cell.kill()
                game.cellsArrayNext[x][y] = 0
                return 0
            }
        }
        function drawCellsFromCellsArray() {
            ctx.value!.clearRect(0, 0, game.canvasWidth, game.canvasHeight)

            imageData.value = ctx.value!.createImageData(game.canvasWidth, game.canvasHeight)
            imageDataArray.value = new Int32Array(imageData.value.data.buffer)

            for (let y = 0; y < game.rows; y++) { // create cells array
                for (let x = 0; x < game.cols; x++) {
                    if (game.cellsArray[x][y] === 1) fillSquare(x, y, game.size)
                }
            }
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
        // -------------------------------------------------------------------------------------------------------------
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

        return { canvas, ctx, prevChangedCell, newCycle, drawCellsFromCellsArray, handleZoom, handleResize, toggleCell }
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
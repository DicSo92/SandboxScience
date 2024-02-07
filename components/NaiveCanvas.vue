<template>
    <canvas ref="canvas"></canvas>
</template>

<script lang="ts">
import { Cell } from "~/models/classes/Cell";
import type { ICell } from "~/models/interfaces/ICell.interface";
import { aliveNeighbours } from "~/helpers/utils/neighbours";

export default defineComponent({
    setup() {
        const game = useGameStore()
        const canvas: Ref<HTMLCanvasElement | undefined> = ref()
        const ctx: Ref<CanvasRenderingContext2D | undefined> = ref()

        const imageData = ref()
        const imageDataArray = ref<Int32Array | number[]>()

        onMounted(() => {
            ctx.value = canvas.value?.getContext('2d') || undefined
            window.addEventListener('resize', handleResize)
            handleResize()
            center()
            initCanvas()
        })

        const cellWidth = computed(() => {
            return Math.max(1, game.size)
        })

        function center() {
            game.rowx = (game.canvasHeight - (game.size * game.rows)) / 2
            game.colx = (game.canvasWidth - (game.size * game.cols)) / 2
        }

        function handleResize() {
            console.log(canvas.value!)
            game.canvasWidth = canvas.value!.width = canvas.value!.clientWidth
            game.canvasHeight = canvas.value!.height = canvas.value!.clientHeight
            center()
            drawCellsFromCellsArray()
        }

        function initCanvas() {
            drawGrid()

            for (let y = 0; y < game.rows; y++) {
                for (let x = 0; x < game.cols; x++) {
                    let index = x + y * game.cols
                    game.cellsArray[index] = reactive(new Cell(x, y, game.size, ctx.value))
                }
            }
            console.log(game.cellsArray)
        }
        function newCycle() {
            ctx.value!.clearRect(0, 0, game.canvasWidth, game.canvasHeight)
            drawCellsWithRules()
            drawGrid()
        }

        function drawGrid() {
            ctx.value!.beginPath()
            for (let row = 0; row < game.rows + 1; row++) {
                const x = game.colx + (game.cols * game.size)
                const y = game.rowx + (game.size * row)
                ctx.value!.moveTo(game.colx, y)
                ctx.value!.lineTo(x, y)
            }
            for (let col = 0; col < game.cols + 1; col++) {
                const x = game.colx + (game.size * col)
                const y = game.rowx + (game.rows * game.size)
                ctx.value!.moveTo(x, game.rowx)
                ctx.value!.lineTo(x, y)
            }
            ctx.value!.strokeStyle = '#a8a8a8'
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

        function processRules(cell: ICell, aliveNeighbours: number): boolean { // return if cell has changed
            if (cell.isAlive && (aliveNeighbours === 2 || aliveNeighbours === 3)) { // Survives
                return false
            } else if (!cell.isAlive && aliveNeighbours === 3) { // Born
                cell.makeAlive()
                return true
            } else { // Dies
                if (cell.isAlive) cell.kill()
                return true
            }
        }
        function fillSquare(x: number, y: number, cellSize: number) { // fill a square by changing the imageDataArray values directly (faster than fillRect)
            x = x * cellSize
            y = y * cellSize
            let width = cellSize
            let height = cellSize

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

            let imageDataIndex = ((Math.floor(game.rowx) + y) * game.canvasWidth) + (Math.floor(game.colx) + x) // Get the index of the first pixel of the cell
            for (let i = 0; i < height; i++) {
                for (let j = 0; j < width; j++) { // fill a row
                    imageDataArray.value![imageDataIndex++] = 0xff000000
                }
                imageDataIndex += game.canvasWidth - width // jump to next row
            }
        }

        return { canvas, ctx, newCycle, drawCellsFromCellsArray }
    }
})
</script>

<style scoped>
canvas {
    background-color: midnightblue;
    width: 100%;
    height: 100%;
}
</style>
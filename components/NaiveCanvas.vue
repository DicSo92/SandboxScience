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
            initCanvas()
        })

        function initCanvas() {
            canvas.value!.width = game.canvasWidth
            canvas.value!.height = game.canvasHeight

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
            for (let row = 0; row < game.rows; row++) {
                const y = game.size * row
                ctx.value!.moveTo(0, y)
                ctx.value!.lineTo(game.canvasWidth, y)
            }
            for (let col = 0; col < game.cols; col++) {
                const xo = game.size * col
                ctx.value!.moveTo(xo, 0)
                ctx.value!.lineTo(xo, game.canvasHeight)
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
                if (cell.nextAlive) fillSquare(cell.x * game.size, cell.y * game.size, game.size)
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
                if (cell.isAlive) fillSquare(cell.x * game.size, cell.y * game.size, game.size)
            })
            ctx.value!.putImageData(imageData.value, 0, 0)
            drawGrid()
        }

        function processRules(cell: ICell, aliveNeighbours: number): boolean { // return if cell has changed
            if (cell.isAlive && (aliveNeighbours === 2 || aliveNeighbours === 3)) {
                // Survives
                return false
            } else if (!cell.isAlive && aliveNeighbours === 3) {
                // Born
                cell.makeAlive()
                return true
            } else {
                // Dies
                if (cell.isAlive) cell.kill()
                return true
            }
        }
        function fillSquare(x: number, y: number, cellSize: number) {
            let width = cellSize
            let height = cellSize
            if (x < 0) { // if cell is outside the canvas on the left
                width += x
                x = 0
            }
            if (x + width > game.canvasWidth) { // if cell is outside the canvas on the right
                width = game.canvasWidth - x
            }
            if (y < 0) { // if cell is outside the canvas on the top
                height += y
                y = 0
            }
            if (y + height > game.canvasHeight) { // if cell is outside the canvas on the bottom
                height = game.canvasHeight - y
            }
            let imageDataIndex = x + (y * game.canvasWidth) // position in the array
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
}
</style>
<template>
    <section flex flex-col justify-center>
        <canvas ref="canvas"></canvas>
        <div flex flex-col>
            <div flex justify-between>
                <div flex>
                    <div mx-2>Rows: {{game.rows}}</div>
                    <div mx-2>Cols: {{game.cols}}</div>
                    <div mx-2>Cell Size: {{game.size}}</div>
                    <div mx-2>Speed: {{game.SPEED}}</div>
                </div>
                <div mx-2>Execution Time: {{ Math.round(executionTime) }} ms</div>
            </div>
            <div flex>
                <div btn p2 mx-1 bg="orange-700 hover:orange-800" @click="randomCells(((game.rows * game.cols) * 20) / 100)">Random Cells</div>
                <div btn p2 mx-1 bg="red-700 hover:red-900" @click="killRandom(20)">Random Kills</div>
                <div btn p2 mx-1 bg="green-900 hover:green-800" @click="newCycle">Step</div>
                <div btn flex items-center mx-1
                     bg="green-700 hover:green-900"
                     @click="startLoop">
                    <div i-carbon-play mr-1></div>
                    Start
                </div>
                <div btn flex items-center mx-1
                     bg="blue-700 hover:blue-900"
                     @click="pause">
                    <div i-carbon-pause mr-1></div>
                    Pause
                </div>
            </div>
            <ToggleSwitch />
            <SelectMenu label="Edge Mode :"
                        :options="[
                            { name: 'Mirror Edges', icon: 'i-carbon-compare', id: 'mirror'},
                            { name: 'Dead Edges', icon: 'i-carbon-compare', id: 'dead'},
                            { name: 'Alive Edges', icon: 'i-carbon-compare', id: 'alive'}]"
                        :selected="game.edgeMode"
                        @selected="(id) => game.edgeMode = id"
            />
            <RangeInputMinMax :min="100" :max="10000" :step="100" v-model:min-value="sliderMin" v-model:max-value="sliderMax"/>
            <RangeInput v-if="SPEED" :min="50" :max="2000" :step="10" v-model="SPEED"/>
        </div>
    </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { aliveNeighbours } from '~/helpers/utils/neighbours'
import { Cell } from '~/models/classes/Cell'
import type { ICell } from '~/models/interfaces/ICell.interface'

export default defineComponent({
    setup() {
        const game = useGameStore()
        const canvas: Ref<HTMLCanvasElement | undefined> = ref()
        const ctx: Ref<CanvasRenderingContext2D | undefined> = ref()

        const executionTime = ref<number>(0) // cycle execution time
        let startExecutionTime: number // for calculating execution time
        let lastTime: number | null // for calculating elapsed time

        const { SPEED, sliderMin, sliderMax } = storeToRefs(useGameStore())

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

        const randomCells = (num: number) => {
            for (let i = 0; i < num; i++) {
                const random = Math.floor(Math.random() * game.cellsArray.length)
                if (!game.cellsArray[random].isAlive) {
                    game.cellsArray[random].makeAlive(true)
                }
            }
            console.log(game.cellsArray)
        }
        const killRandom = (num: number) => {
            const shuffled = [...game.cellsArray].sort(() => 0.5 - Math.random())
            const rCells = shuffled.slice(0, num)
            rCells.forEach((cell) => {
                if (cell.isAlive) {
                    cell.kill(true)
                }
            })
        }

        function startLoop() {
            lastTime = Number(document.timeline.currentTime) || null
            if (!lastTime) {
                console.log("Can't get document.timeline.currentTime")
                return
            }

            lastTime = lastTime - game.SPEED // to start a cycle immediately
            startExecutionTime = performance.now()

            game.isRunning = true
            requestAnimationFrame(animate)
        }
        function pause() {
            game.isRunning = false
        }


        function animate(currentTime: number) {
            const elapsedTime = currentTime - lastTime!

            if (elapsedTime >= game.SPEED && game.isRunning) {
                newCycle()

                lastTime = currentTime - (elapsedTime % game.SPEED)
                executionTime.value = performance.now() - startExecutionTime
                console.log(`Execution Time : ${executionTime.value} ms`)
            }

            startExecutionTime = performance.now()
            requestAnimationFrame(animate);
        }

        function newCycle() {
            ctx.value!.clearRect(0, 0, game.canvasWidth, game.canvasHeight)
            drawCells()
            drawGrid()
        }

        function drawCells() {
            const imageData = ctx.value!.createImageData(game.canvasWidth, game.canvasHeight)
            const imageDataArray = new Int32Array(imageData.data.buffer)

            // logic to draw cells
            console.log(game.cellsArray)
            let changedCells = [] as ICell[]
            game.cellsArray.forEach((cell, index) => {
                const hasChanged = processRules(cell, aliveNeighbours(cell.x, cell.y))
                if (hasChanged) changedCells.push(cell)
                if (cell.nextAlive) {
                    fillSquare(imageDataArray, cell.x * game.size, cell.y * game.size, game.size)
                }
            })
            changedCells.forEach((cell, index) => {
                cell.isAlive = cell.nextAlive
            })

            ctx.value!.putImageData(imageData, 0, 0)
        }

        function fillSquare(imageData: Int32Array | number[], x: number, y: number, cellSize: number) {
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
                    imageData[imageDataIndex++] = 0xff000000
                }
                imageDataIndex += game.canvasWidth - width // jump to next row
            }
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

        return {
            game, ctx, canvas, newCycle, randomCells, killRandom, startLoop, pause, executionTime, SPEED, sliderMin, sliderMax
        }
    }
})

</script>

<style scoped>
    canvas {
        background-color: midnightblue;
    }
</style>

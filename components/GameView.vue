<template>
    <section flex flex-col justify-center h-full>
        <NaiveCanvas ref="naiveCanvas" />
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
                <div btn p2 mx-1 bg="red-700 hover:red-900" @click="killRandom(((game.rows * game.cols) * 20) / 100)">Random Kills</div>
                <div btn p2 mx-1 bg="green-900 hover:green-800" @click="naiveCanvas.newCycle()">Step</div>
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
                <div btn p2 mx-1 bg="green-900 hover:green-800" @click="naiveCanvas.handleZoom(1)">Zoom+</div>
                <div btn p2 mx-1 bg="green-900 hover:green-800" @click="naiveCanvas.handleZoom(-1)">Zoom-</div>

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
<!--            <RangeInputMinMax :min="100" :max="10000" :step="100" v-model:min-value="sliderMin" v-model:max-value="sliderMax"/>-->
            <RangeInput v-if="SPEED" :min="50" :max="2000" :step="10" v-model="SPEED"/>
        </div>
    </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    setup() {
        const game = useGameStore()
        const naiveCanvas = ref( )

        const executionTime = ref<number>(0) // cycle execution time
        let startExecutionTime: number // for calculating execution time
        let lastTime: number | null // for calculating elapsed time

        const { SPEED, sliderMin, sliderMax } = storeToRefs(useGameStore())

        const randomCells = (num: number) => {
            for (let i = 0; i < num; i++) {
                const random = Math.floor(Math.random() * game.cellsArray.length)
                if (!game.cellsArray[random].isAlive) {
                    game.cellsArray[random].makeAlive(true)
                }
            }
            console.log(game.cellsArray)
            naiveCanvas.value.drawCellsFromCellsArray()
        }
        const killRandom = (num: number) => {
            const shuffled = [...game.cellsArray].sort(() => 0.5 - Math.random())
            const rCells = shuffled.slice(0, num)
            rCells.forEach((cell) => {
                if (cell.isAlive) {
                    cell.kill(true)
                }
            })
            naiveCanvas.value.drawCellsFromCellsArray()
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
                naiveCanvas.value.newCycle()

                lastTime = currentTime - (elapsedTime % game.SPEED)
                executionTime.value = performance.now() - startExecutionTime
                console.log(`Execution Time : ${executionTime.value} ms`)
            }

            startExecutionTime = performance.now()
            requestAnimationFrame(animate);
        }

        return {
            game, randomCells, killRandom, startLoop, pause, executionTime, SPEED, sliderMin, sliderMax, naiveCanvas
        }
    }
})

</script>

<style scoped>
    canvas {
        background-color: midnightblue;
    }
</style>

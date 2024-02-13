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

            <div flex items-start justify-between mt-1>
                <div flex items-center>
                    <SelectMenu label="Edge Mode :"
                                :options="[
                            { name: 'Mirror Edges', icon: 'i-carbon-compare', id: 'mirror'},
                            { name: 'Dead Edges', icon: 'i-carbon-compare', id: 'dead'},
                            { name: 'Alive Edges', icon: 'i-carbon-compare', id: 'alive'}]"
                                :selected="game.EDGEMODE"
                                @selected="(id) => game.EDGEMODE = id"
                    />
                    <ToggleSwitch />
                </div>
                <div flex items-start>
                    <div btn p1 mx-1 flex items-center bg="gray-700 hover:gray-800">
                        <div i-game-icons-perspective-dice-six-faces-random text-2xl></div>
                    </div>
                    <div btn p1 mx-1 flex items-center bg="orange-700 hover:orange-800" @click="randomCells(((game.rows * game.cols) * 20) / 100)">
                        <div i-fad-arprandom text-2xl></div>
                    </div>
                    <div btn p1 mx-1 flex items-center bg="red-700 hover:red-900" @click="killRandom(((game.rows * game.cols) * 20) / 100)">
                        <div i-tabler-skull text-2xl></div>
                    </div>
                    <div btn p2 mx-1 flex items-center bg="green-900 hover:green-800" disabled @click="naiveCanvas.newCycle()">
                        <div i-tabler-player-track-prev-filled text-xl></div>
                    </div>
                    <div btn p2 mx-1 flex items-center bg="green-900 hover:green-800" @click="naiveCanvas.newCycle()">
                        <div i-tabler-player-track-next-filled text-xl></div>
                    </div>
                    <div btn p2 flex items-center mx-1 bg="green-700 hover:green-900" @click="toggleIsRunning">
                        <div text-xl :class="game.isRunning ? 'i-tabler-player-pause-filled' : 'i-tabler-player-play-filled'"></div>
                    </div>
                    <div btn p2 mx-1 flex items-center bg="green-900 hover:green-800" @click="naiveCanvas.handleZoom(1)">
                        <div i-tabler-zoom-in text-xl></div>
                    </div>
                    <div btn p2 mx-1 flex items-center bg="green-900 hover:green-800" @click="naiveCanvas.handleZoom(-1)">
                        <div i-tabler-zoom-out text-xl></div>
                    </div>
                </div>
                <RangeInput v-if="SPEED" :min="1" :max="1000" :step="1" v-model="SPEED" />
            </div>
<!--            <RangeInputMinMax :min="100" :max="10000" :step="100" v-model:min-value="sliderMin" v-model:max-value="sliderMax"/>-->
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

        const timer = ref()

        const randomCells = (num: number) => {
            const allCellsAlive = game.cellsArray.every(row => row.every(cell => cell === 1))
            if (allCellsAlive) {
                console.log("All cells are already alive.")
                return
            }
            let count = 0
            let attempts = 0
            while (count < num) {
                if (attempts > game.cols * game.rows * 10) {
                    console.log("Too many attempts to find dead cells. Stopping...")
                    break
                }
                const randomX = Math.floor(Math.random() * game.cols)
                const randomY = Math.floor(Math.random() * game.rows)
                if (game.cellsArray[randomX][randomY] === 0) {
                    game.cellsArray[randomX][randomY] = 1
                    count++
                }
                attempts++
            }
            naiveCanvas.value.drawCellsFromCellsArray()
        }
        const killRandom = (num: number) => {
            const allCellsAlive = game.cellsArray.every(row => row.every(cell => cell !== 1))
            if (allCellsAlive) {
                console.log("All cells are already dead.")
                return
            }
            let count = 0
            let attempts = 0
            while (count < num) {
                if (attempts > game.cols * game.rows * 10) {
                    console.log("Too many attempts to find alive cells. Stopping...")
                    break
                }
                const randomX = Math.floor(Math.random() * game.cols)
                const randomY = Math.floor(Math.random() * game.rows)
                if (game.cellsArray[randomX][randomY] === 1) {
                    game.cellsArray[randomX][randomY] = 0
                    count++
                }
                attempts++
            }
            naiveCanvas.value.drawCellsFromCellsArray()
        }

        const toggleIsRunning = () => game.isRunning ? pause() : startLoop()
        function startLoop() {
            console.log('start loop')
            lastTime = Number(document.timeline.currentTime) || null
            if (!lastTime) {
                console.log("Can't get document.timeline.currentTime")
                return
            }

            lastTime = lastTime - game.SPEED // to start a cycle immediately
            startExecutionTime = performance.now()

            game.isRunning = true
            requestAnimationFrame(animate)
            // animate(startExecutionTime)
        }
        function pause() {
            console.log('pause')
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
            // timer.value = setTimeout(() => animate(startExecutionTime), game.SPEED)
            requestAnimationFrame(animate);
        }

        return {
            game, randomCells, killRandom, toggleIsRunning, startLoop, pause, executionTime, SPEED, sliderMin, sliderMax, naiveCanvas
        }
    }
})

</script>

<style scoped>
    canvas {
        background-color: midnightblue;
    }
</style>

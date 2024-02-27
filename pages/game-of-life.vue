<template>
    <section flex flex-col justify-center h-full overflow-hidden relative>
        <SidebarRight v-model="sidebarRightOpen">
            <PatternList />
        </SidebarRight>

        <NaiveCanvas ref="naiveCanvas" />

        <div flex flex-col absolute top-0 left-0>
            <div flex>
                <div mx-2>Rows: {{game.rows}}</div>
                <div mx-2>Cols: {{game.cols}}</div>
                <div mx-2>Cell Size: {{game.size}}</div>
                <div mx-2>Speed: {{game.SPEED}}</div>
            </div>
            <div mx-2>Execution Time: {{ Math.round(executionTime) }} ms ({{ averageExecutionTime }}ms)</div>
        </div>
        <div absolute w-full text-center transform top-0 class="-translate-x-1/2 left-1/2">x: {{ pointerX }} - y: {{ pointerY }}</div>

        <Controls class="absolute bottom-0 mb-2"
                  :naiveCanvas="naiveCanvas"
                  @getExecutionAverage="getExecutionAverage"
                  @randomCells="randomCells"
                  @killRandom="killRandom"
                  @toggleIsRunning="toggleIsRunning"
        />

<!--        <div flex flex-col absolute bottom-0>-->
<!--            <div flex items-start justify-between my-1>-->
<!--                <div flex items-center>-->
<!--                    <SelectMenu label="Edge Mode :"-->
<!--                                :options="[-->
<!--                                    { name: 'Mirror Edges', icon: 'i-carbon-compare', id: 2},-->
<!--                                    { name: 'Dead Edges', icon: 'i-carbon-compare', id: 0},-->
<!--                                    { name: 'Alive Edges', icon: 'i-carbon-compare', id: 1}]"-->
<!--                                :selected="game.EDGEMODE"-->
<!--                                @selected="(id) => game.EDGEMODE = id"-->
<!--                    />-->
<!--                    <ToggleSwitch />-->
<!--                </div>-->

<!--                <RangeInput v-if="SPEED" :min="1" :max="1000" :step="1" v-model="SPEED" />-->
<!--            </div>-->
<!--&lt;!&ndash;            <RangeInputMinMax :min="100" :max="10000" :step="100" v-model:min-value="sliderMin" v-model:max-value="sliderMax"/>&ndash;&gt;-->
<!--        </div>-->
    </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PatternList from "~/components/game-of-life/PatternList.vue";
import Controls from "~/components/game-of-life/Controls.vue";

export default defineComponent({
    components: {Controls, PatternList },
    setup() {
        definePageMeta({ layout: 'life' })
        const game = useGameStore()
        const naiveCanvas = ref( )

        const pointerX = ref(0)
        const pointerY = ref(0)
        const isDragging = ref(false)

        const averageExecutionTime = ref(0)
        const executionTime = ref<number>(0) // cycle execution time
        let totalExecutionTime: number = 0 // for calculating total execution time
        let totalCycles: number = 0 // for calculating total cycles
        let startExecutionTime: number // for calculating execution time
        let lastTime: number | null // for calculating elapsed time

        const { SPEED, sliderMin, sliderMax, sidebarRightOpen } = storeToRefs(useGameStore())
        const timer = ref()

        const keys = useMagicKeys()
        const ctrlKey = keys['Ctrl']
        const wheelClick = ref(false)
        const cursor = computed(() => ctrlKey.value ? 'all-scroll' : wheelClick.value ? 'grabbing' : 'crosshair')

        watch(ctrlKey, (isPressed) => {
            if (!isPressed) game.hoveredSide = null
            else naiveCanvas.value!.handleSideHover(pointerX.value, pointerY.value)
        })
        watch(cursor, (value) => {
            naiveCanvas.value!.overlayCanvas.style.cursor = value
        })
        watch(() => game.hoveredSide, (val) => {
            if (val === null) naiveCanvas.value.overlayCanvas.style.cursor = ctrlKey.value ? "all-scroll" : "crosshair"
            else if (val === 1 || val === 2) naiveCanvas.value.overlayCanvas.style.cursor = "row-resize"
            else if (val === 3 || val === 4) naiveCanvas.value.overlayCanvas.style.cursor = "col-resize"
            naiveCanvas.value!.drawOverlayGrid(game.cols, game.rows, game.size)
        })

        onBeforeRouteLeave(() => {
            game.$reset()
        })
        onMounted(() => {
            useEventListener('resize', naiveCanvas.value.handleResize)
            useEventListener(naiveCanvas, ['mousemove'], (e) => {
                pointerX.value = e.x - naiveCanvas.value!.canvas.parentNode.getBoundingClientRect().left
                pointerY.value = e.y - naiveCanvas.value!.canvas.parentNode.getBoundingClientRect().top

                // Ctrl + button actions
                if (ctrlKey.value) {
                    if (!isDragging.value) naiveCanvas.value.handleSideHover(pointerX.value, pointerY.value)

                    if (e.buttons === 1) { // if primary button is pressed (left click)
                        isDragging.value = true
                        if (!game.wasRunning) game.wasRunning = game.isRunning // store the running state
                        game.isRunning = false // pause the game
                        naiveCanvas.value.handleGridResize(pointerX.value, pointerY.value)
                    }
                }
                // Single button actions
                else if (e.buttons > 0) { // if mouse is pressed
                    isDragging.value = true
                    if (e.buttons === 1) { // if primary button is pressed (left click)
                        if (!game.wasRunning) game.wasRunning = game.isRunning // store the running state
                        game.isRunning = false // pause the game
                        naiveCanvas.value.toggleCell(pointerX.value, pointerY.value, 'draw') // add cell at cursor position
                    } else if (e.buttons === 4) { // if wheel button is pressed
                        naiveCanvas.value.handleMove(e)
                    }
                }
                // Reset the dragging state and resume the game if it was running when all buttons are released
                if (e.buttons === 0 && !ctrlKey.value) {
                    isDragging.value = false
                    naiveCanvas.value.prevChangedCell = null
                    game.hoveredSide = null
                    if (game.wasRunning) {
                        game.isRunning = game.wasRunning
                        game.wasRunning = false
                    }
                }
            })
            useEventListener(naiveCanvas, 'click', () => {
                if (!isDragging.value && !game.hoveredSide) {
                    naiveCanvas.value.prevChangedCell = null
                    naiveCanvas.value.toggleCell(pointerX.value, pointerY.value)
                }
            })
            useEventListener(naiveCanvas, 'wheel', (e) => {
                if (e.deltaY < 0) { // Zoom in
                    naiveCanvas.value.handleZoom(1, pointerX.value, pointerY.value)
                } else { // Zoom out
                    naiveCanvas.value.handleZoom(-1, pointerX.value, pointerY.value)
                }
            })
            useEventListener(naiveCanvas, 'mousedown', (e) => {
                if (e.button === 1) { // if wheel button is pressed
                    wheelClick.value = true
                }
            })
            useEventListener(naiveCanvas, 'mouseup', (e) => {
                if (e.button === 1) { // if wheel button is pressed
                    wheelClick.value = false
                }
                if (e.button === 0 && game.hoveredSide && isDragging.value) { // if primary button is released
                    isDragging.value = false
                    naiveCanvas.value.handleSideHover(pointerX.value, pointerY.value)
                }
            })
        })
        // -------------------------------------------------------------------------------------------------------------
        const toggleIsRunning = () => game.isRunning ? pause() : startLoop()
        function pause() {
            console.log('pause')
            game.isRunning = false
        }
        function startLoop() {
            console.log('start loop')
            lastTime = Number(document.timeline.currentTime) || null
            if (!lastTime) {
                console.log("Can't get document.timeline.currentTime")
                return
            }
            lastTime = lastTime - game.SPEED // to start a cycle immediately
            totalExecutionTime = 0
            totalCycles = 0
            game.isRunning = true

            requestAnimationFrame(animate)
            // animate(startExecutionTime)
        }
        function animate(currentTime: number) {
            const elapsedTime = currentTime - lastTime!

            if (elapsedTime >= game.SPEED && game.isRunning) {
                startExecutionTime = performance.now()
                naiveCanvas.value.newCycle()
                executionTime.value = performance.now() - startExecutionTime

                lastTime = currentTime - (elapsedTime % game.SPEED)
                totalExecutionTime += executionTime.value
                totalCycles++
                console.log(`Execution Time : ${executionTime.value} ms`)
            }

            // timer.value = setTimeout(() => animate(startExecutionTime), game.SPEED)
            requestAnimationFrame(animate)
        }
        // -------------------------------------------------------------------------------------------------------------
        const randomCells = (num: number) => {
            const cellsArray = naiveCanvas.value.getCellsArray()
            const isAllCellsAlive = cellsArray.every((row: any[]) => row.every(cell => cell === 1))
            if (isAllCellsAlive) {
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
                if (cellsArray[randomX][randomY] === 0) {
                    naiveCanvas.value.setCell(randomX, randomY, 1)
                    count++
                }
                attempts++
            }
            if (!game.isRunning) naiveCanvas.value.drawCellsFromCellsArray()
        }
        const killRandom = (num: number) => {
            const cellsArray = naiveCanvas.value.getCellsArray()
            const isAllCellsAlive = cellsArray.every((row: any[]) => row.every(cell => cell !== 1))
            if (isAllCellsAlive) {
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
                if (cellsArray[randomX][randomY] === 1) {
                    naiveCanvas.value.setCell(randomX, randomY, 0)
                    count++
                }
                attempts++
            }
            if (!game.isRunning) naiveCanvas.value.drawCellsFromCellsArray()
        }
        const getExecutionAverage = () => {
            averageExecutionTime.value = Math.floor(totalExecutionTime / totalCycles)
        }
        // -------------------------------------------------------------------------------------------------------------
        return {
            game, averageExecutionTime, executionTime, SPEED, sliderMin, sliderMax, naiveCanvas, pointerX, pointerY, sidebarRightOpen,
            randomCells, killRandom, toggleIsRunning, startLoop, pause, getExecutionAverage
        }
    }
})

</script>

<style scoped>
canvas {
    background-color: midnightblue;
}
</style>

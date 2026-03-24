<template>
    <section h-screen flex flex-col justify-center overflow-hidden relative ref="mainContainer" id="mainContainer">
<!--        <SidebarRight v-model="sidebarRightOpen">-->
<!--            <template #controls>&lt;!&ndash; Some other controls &ndash;&gt;</template>-->
<!--            <template #default>-->
<!--                <GameOfLifePatternList />-->
<!--            </template>-->
<!--        </SidebarRight>-->
        <SidebarLeft v-model="sidebarLeftOpen">
            <template #controls>
            </template>
            <template #default>
                <div h-full px-2 flex flex-col>
                    <div flex justify-between items-end mb-2 px-1>
                        <div flex items-center class="-mb-0.5">
                            <div i-tabler-grid-dots text-2xl mr-2 class="text-emerald-400 -mt-0.5"></div>
                            <h1 font-800 text-lg tracking-widest class="text-[#dff6f3] drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">Game of Life</h1>
                        </div>
                    </div>
                    <hr border-slate-500>
                    <div overflow-auto flex-1 flex flex-col gap-2 mt-2 pb-12 class="scrollableArea">
                        <Collapse label="World Settings" icon="i-tabler-world-cog text-cyan-500" opened>
                            <SelectInput name="edge-mode" v-model="game.EDGEMODE" :options="[
                                { name: 'Mirror Edges', icon: 'tabler-arrows-right-left', id: 2},
                                { name: 'Dead Edges', icon: 'tabler-border-none', id: 0},
                                { name: 'Alive Edges', icon: 'tabler-border-all', id: 1}]">
                            </SelectInput>
                            <RangeInput input label="Speed (ms)" v-model="game.SPEED" tooltip="Delay in milliseconds between each generation." :min="1" :max="1000" :step="1" mt-2></RangeInput>
                        </Collapse>
                        <Collapse label="Theme" icon="i-tabler-palette text-amber-500" opened>
                            <SelectInput name="theme" v-model="game.themeId" :options="themes.map((theme, index) => ({ name: theme.name, icon: 'tabler-paint', id: index }))"></SelectInput>
                        </Collapse>
                    </div>
                    <div absolute bottom-2 right-0 z-100 class="-mr-px">
                        <button rounded-l-lg border border-slate-600 flex items-center p-1 bg="slate-900/85 hover:slate-950/85" @click="sidebarLeftOpen = false">
                            <span i-tabler-chevron-left text-2xl></span>
                        </button>
                    </div>
                </div>
            </template>
            <template #bottom-actions>
                <button type="button" name="Toggle Grid" aria-label="Toggle Grid" title="Toggle Grid"
                        btn rounded-full flex items-center justify-center p-2 pointer-events-auto
                        backdrop-blur-sm bg="slate-800/80 hover:slate-700/80"
                        @click="naiveCanvas.toggleGrid">
                    <span :class="game.grid ? 'i-tabler-grid-4x4' : 'i-tabler-square'"></span>
                </button>
                <button type="button" name="Clear" aria-label="Clear" title="Clear all cells"
                        btn rounded-full flex items-center justify-center p-2 pointer-events-auto
                        backdrop-blur-sm bg="rose-800/80 hover:rose-700/80"
                        @click="clearCells">
                    <span i-tabler-trash></span>
                </button>
                <button type="button" name="Randomize" aria-label="Randomize" title="Randomize 10% of dead cells"
                        btn rounded-full flex items-center justify-center p-2 pointer-events-auto
                        class="backdrop-blur-sm bg-[#094F5D]/90 hover:bg-[#0B5F6F]/90"
                        @click="randomCells(10)">
                    <span i-game-icons-perspective-dice-six-faces-random text-2xl></span>
                </button>
                <div class="flex items-center pointer-events-auto rounded-full py-1.5 px-3 backdrop-blur-sm bg-slate-800/80 min-w-44">
                    <span i-tabler-clock-play text-sm class="text-slate-300 shrink-0 mr-1.5"></span>
                    <RangeInput v-if="SPEED" :min="1" :max="1000" :step="1" v-model="SPEED" flex-1 />
                    <span class="text-xs font-mono text-slate-400 min-w-8 text-right shrink-0 -ml-1">{{ game.SPEED }}ms</span>
                </div>
            </template>
        </SidebarLeft>

        <GameOfLifeNaiveCanvas ref="naiveCanvas" />

        <div absolute top-0 right-0 flex flex-col items-end text-right pointer-events-none z-3>
            <div flex items-center text-start text-xs pl-3.5 pr-2 py-0.5 bg-slate-800 rounded-bl-xl style="opacity: 75%" gap-3>
                <div flex>Pop: <div ml-1 min-w-10 font-mono>{{ game.population }}</div></div>
                <div flex>Gen: <div ml-1 min-w-10 font-mono>{{ game.generation }}</div></div>
                <div flex>Time: <div ml-1 min-w-12 font-mono>{{ Math.round(executionTime) }}ms</div></div>
            </div>
            <div flex items-center text-start text-xs pl-3 pr-2 py-0.5 rounded-bl-xl mt-px gap-3.5 class="bg-slate-800/60" style="opacity: 65%">
                <div flex>{{ game.cols }}×{{ game.rows }}</div>
<!--                <div flex>Cell: <div ml-1 font-mono>{{ game.size }}px</div></div>-->
            </div>
        </div>

        <GameOfLifeControls :naiveCanvas="naiveCanvas"
                            :isFullscreen="isFullscreen"
                            @toggleIsRunning="toggleIsRunning"
                            @toggleFullscreen="toggleFullscreen">
        </GameOfLifeControls>

        <SocialLinks />
    </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { themes } from "~/helpers/utils/themes";

export default defineComponent({
    setup() {
        definePageMeta({
            layout: 'life',
            hideNavBar: true
        })
        useSeoMeta({
            title: 'Game of Life',
            description: 'Explore the classic Game of Life, a fascinating cellular automata simulation to understand patterns, evolution, and emergent behavior in complex systems.',
            ogTitle: 'Game of Life • Cellular Automata',
            ogDescription: 'Explore the classic Game of Life, a fascinating cellular automata simulation to understand patterns, evolution, and emergent behavior in complex systems.',
            twitterTitle: 'Game of Life • Cellular Automata',
            twitterDescription: 'Explore the classic Game of Life, a fascinating cellular automata simulation to understand patterns, evolution, and emergent behavior in complex systems.',
        })

        const game = useGameStore()
        const naiveCanvas = ref( )
        const mainContainer = ref<HTMLElement | null>(null)
        const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(mainContainer)

        const pointerX = ref(0)
        const pointerY = ref(0)
        const isDragging = ref(false)

        const averageExecutionTime = ref(0)
        const executionTime = ref<number>(0) // cycle execution time
        let totalExecutionTime: number = 0 // for calculating total execution time
        let totalCycles: number = 0 // for calculating total cycles
        let startExecutionTime: number // for calculating execution time
        let lastTime: number | null // for calculating elapsed time

        const { SPEED, sliderMin, sliderMax, sidebarLeftOpen, sidebarRightOpen } = storeToRefs(useGameStore())
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

        const randomCells = (percentage: number) => {
            const cellsArray = naiveCanvas.value.getCellsArray()
            let totalDeadCells = 0
            for (let i = 0; i < game.cols; i++) {
                for (let j = 0; j < game.rows; j++) {
                    if (cellsArray[i][j] <= 0) {
                        totalDeadCells++
                    }
                }
            }
            console.log('totalDeadCells', totalDeadCells)
            const cellsToLive = Math.floor(totalDeadCells * (percentage / 100))
            let count = 0
            while (count < cellsToLive) {
                const randomX = Math.floor(Math.random() * game.cols)
                const randomY = Math.floor(Math.random() * game.rows)
                if (cellsArray[randomX][randomY] <= 0) {
                    naiveCanvas.value.setCell(randomX, randomY, 1)
                    count++
                }
            }
            if (!game.isRunning) naiveCanvas.value.drawCellsFromCellsArray()
        }
        const clearCells = () => {
            const cellsArray = naiveCanvas.value.getCellsArray()
            for (let i = 0; i < game.cols; i++) {
                for (let j = 0; j < game.rows; j++) {
                    if (cellsArray[i][j] !== 0) {
                        naiveCanvas.value.setCell(i, j, 0)
                    }
                }
            }
            if (!game.isRunning) naiveCanvas.value.drawCellsFromCellsArray()
        }
        const getExecutionAverage = () => {
            averageExecutionTime.value = Math.floor(totalExecutionTime / totalCycles)
        }
        // -------------------------------------------------------------------------------------------------------------
        return {
            game, averageExecutionTime, executionTime, SPEED, sliderMin, sliderMax,
            naiveCanvas, mainContainer, isFullscreen, toggleFullscreen,
            pointerX, pointerY, sidebarLeftOpen, sidebarRightOpen, themes,
            randomCells, clearCells, toggleIsRunning, startLoop, pause, getExecutionAverage
        }
    }
})

</script>

<style scoped>

</style>

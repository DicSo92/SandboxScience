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
                        <Collapse label="Rules" icon="i-tabler-dna text-rose-400" opened tooltip="Configure the birth and survival rules.">
                            <div class="flex gap-2">
                                <SelectInput name="rule-preset" :modelValue="currentPresetId" @change="applyPreset" :options="rulePresetOptions" />
                                <div grid grid-cols-2 gap-1 class="w-4/12">
                                    <button @click="undoRules" type="button" title="Undo rules" aria-label="Undo rules" :disabled="!rulesHistory.length" btn px-3 rounded-full flex justify-center items-center bg="slate-800/80 hover:slate-800/50">
                                        <span i-tabler-arrow-back-up></span>
                                    </button>
                                    <button @click="randomizeRules" type="button" title="Randomize rules" aria-label="Randomize rules" btn px-3 rounded-full flex justify-center items-center bg="cyan-900/80 hover:cyan-900/50">
                                        <span i-game-icons-perspective-dice-six-faces-random></span>
                                    </button>
                                </div>
                            </div>

                            <p class="text-2sm text-slate-300 mt-2 mb-1">
                                Born - <span font-mono text-white>B{{ game.BORN.join('') }}</span>
                                <TooltipInfo ml-1 container="#mainContainer" tooltip="A dead cell becomes alive if it has exactly this many alive neighbors." />
                            </p>
                            <div class="grid grid-cols-9 gap-1">
                                <button v-for="n in 9" :key="'born-'+(n-1)" type="button" @click="toggleBorn(n-1)" class="py-1.5 rounded-lg text-xs font-mono font-medium border"
                                    :class="game.BORN.includes(n-1) ? 'border-sky-600 bg-sky-600/20 text-sky-100' : 'border-slate-600 bg-slate-800/80 text-slate-300 hover:bg-slate-900/50'">
                                    {{ n-1 }}
                                </button>
                            </div>

                            <p class="text-2sm text-slate-300 mt-2 mb-1">
                                Survives - <span font-mono text-white>S{{ game.SURVIVES.join('') }}</span>
                                <TooltipInfo ml-1 container="#mainContainer" tooltip="A living cell stays alive if it has exactly this many alive neighbors." />
                            </p>
                            <div class="grid grid-cols-9 gap-1">
                                <button v-for="n in 9" :key="'survives-'+(n-1)" type="button" @click="toggleSurvives(n-1)" class="py-1.5 rounded-lg text-xs font-mono font-medium border"
                                    :class="game.SURVIVES.includes(n-1) ? 'border-sky-600 bg-sky-600/20 text-sky-100' : 'border-slate-600 bg-slate-800/80 text-slate-300 hover:bg-slate-900/50'">
                                    {{ n-1 }}
                                </button>
                            </div>
                        </Collapse>
                        <Collapse label="World Settings" icon="i-tabler-world-cog text-cyan-500" opened>
                            <div flex items-center>
                                <p class="w-2/3 text-2sm">
                                    World Size
                                    <TooltipInfo ml-1 container="#mainContainer" tooltip="Number of columns and rows in the grid." />
                                </p>
                                <Input label="x" :modelValue="game.cols" @change="onColsChange" mr-2 />
                                <Input label="y" :modelValue="game.rows" @change="onRowsChange" />
                                <button type="button" btn rounded-full p-1.5 mx-1 flex items-center bg="slate-950/90 hover:slate-950/50" @click="game.linkProportions = !game.linkProportions">
                                    <span :class="game.linkProportions ? 'i-tabler-link' : 'i-tabler-unlink'" text-sm></span>
                                </button>
                            </div>
                            <RangeInput input label="Speed (ms)" v-model="game.SPEED" tooltip="Delay in milliseconds between each generation." :min="1" :max="1000" :step="1" mt-1.5></RangeInput>
                            <hr border-gray-500 mt-1 mb-1.5>
                            <p underline text-gray-300 mb-2>Edge Behavior :</p>
                            <OptionBar name="edge-mode" v-model="game.EDGEMODE" :options="[
                                { id: 0, label: 'Dead' },
                                { id: 1, label: 'Alive' },
                                { id: 2, label: 'Mirror' }]">
                            </OptionBar>
                            <ToggleSwitch label="Show Grid" :modelValue="game.grid" @update:modelValue="naiveCanvas.toggleGrid()" mt-2 />
                        </Collapse>
                        <Collapse label="Theme" icon="i-tabler-palette text-amber-500" opened>
                            <div class="flex gap-2">
                                <SelectInput name="theme" v-model="game.themeId" :options="themes.map((t, i) => ({ id: i, name: t.name, icon: t.icon, category: t.category }))" max-w-full />
                                <button @click="randomizeTheme" type="button" title="Random theme" aria-label="Random theme" btn px-3 rounded-full flex justify-center items-center bg="cyan-900/80 hover:cyan-900/50">
                                    <span i-game-icons-perspective-dice-six-faces-random></span>
                                </button>
                            </div>
                            <div class="mt-2">
                                <div flex h-4 rounded-lg overflow-hidden border border-slate-700>
                                    <div flex-1 :style="{ background: isHistoryTheme
                                        ? `linear-gradient(to right, ${themes[game.themeId].DEADRAMP}, ${themes[game.themeId].DEAD})`
                                        : themes[game.themeId].DEAD }">
                                    </div>
                                    <div w-4 border-x border-slate-700 :style="{ background: themes[game.themeId].BACKGROUND }"></div>
                                    <div flex-1 :style="{ background: isHistoryTheme
                                        ? `linear-gradient(to right, ${themes[game.themeId].ALIVE}, ${themes[game.themeId].ALIVERAMP})`
                                        : themes[game.themeId].ALIVE }">
                                    </div>
                                </div>
                                <div flex justify-between text-xs text-slate-500 mt-0.5 px-0.5>
                                    <span>Dead</span>
                                    <span>Alive</span>
                                </div>
                            </div>
                            <template v-if="isHistoryTheme">
                                <RangeInput input label="Alive Steps" tooltip="Number of color gradient steps for alive cells aging." :min="2" :max="128" :step="1" v-model="game.aliveSteps" mt-2 />
                                <RangeInput input label="Dead Steps" tooltip="Number of color gradient steps for dead cells fading." :min="2" :max="128" :step="1" v-model="game.deadSteps" mt-2 />
                            </template>
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
                    <span :class="game.grid ? 'i-tabler-border-all' : 'i-tabler-border-none'"></span>
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
// Themes Icons:
// i-tabler-contrast | i-tabler-contrast-filled | i-tabler-droplet-filled | i-tabler-flame | i-tabler-skull | i-tabler-wand
// i-tabler-binary-tree | i-tabler-ruler-2 | i-tabler-lamp | i-tabler-sunset-2 | i-tabler-wave-sine | i-tabler-tree
// i-tabler-rosette | i-tabler-snowflake | i-tabler-diamond | i-tabler-bolt | i-tabler-mountain | i-tabler-moon-stars | i-tabler-seeding

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

        const rulesHistory = ref<{ born: number[], survives: number[] }[]>([])

        const averageExecutionTime = ref(0)
        const executionTime = ref<number>(0) // cycle execution time
        let totalExecutionTime: number = 0 // for calculating total execution time
        let totalCycles: number = 0 // for calculating total cycles
        let startExecutionTime: number // for calculating execution time
        let lastTime: number | null // for calculating elapsed time
        let animationFrameId: number | null = null // for cancelling the animation loop

        const { SPEED, sliderMin, sliderMax, sidebarLeftOpen, sidebarRightOpen } = storeToRefs(useGameStore())
        const timer = ref()

        const keys = useMagicKeys()
        const ctrlKey = keys['Ctrl']
        const rightClick = ref(false)
        const cursor = computed(() => ctrlKey.value ? 'all-scroll' : rightClick.value ? 'grabbing' : 'crosshair')
        
        const rulePresets = [
            { id: 'life',       name: "Conway's Life (B3/S23)",       icon: 'i-tabler-heart',            born: [3],             survives: [2, 3],          category: 'Classic' },
            { id: 'highlife',   name: 'HighLife (B36/S23)',           icon: 'i-tabler-star',             born: [3, 6],          survives: [2, 3],          category: 'Classic' },
            { id: 'seeds',      name: 'Seeds (B2/S)',                 icon: 'i-tabler-plant',            born: [2],             survives: [],              category: 'Chaotic' },
            { id: 'replicator', name: 'Replicator (B1357/S1357)',     icon: 'i-tabler-copy',             born: [1, 3, 5, 7],    survives: [1, 3, 5, 7],    category: 'Chaotic' },
            { id: 'daynight',   name: 'Day & Night (B3678/S34678)',   icon: 'i-tabler-sun-moon',         born: [3, 6, 7, 8],    survives: [3, 4, 6, 7, 8], category: 'Exotic' },
            { id: 'diamoeba',   name: 'Diamoeba (B35678/S5678)',      icon: 'i-tabler-diamond',          born: [3, 5, 6, 7, 8], survives: [5, 6, 7, 8],    category: 'Exotic' },
            { id: 'morley',     name: 'Morley (B368/S245)',           icon: 'i-tabler-arrows-shuffle',   born: [3, 6, 8],       survives: [2, 4, 5],       category: 'Exotic' },
            { id: 'anneal',     name: 'Anneal (B4678/S35678)',        icon: 'i-tabler-flame',            born: [4, 6, 7, 8],    survives: [3, 5, 6, 7, 8], category: 'Exotic' },
        ]
        // -------------------------------------------------------------------------------------------------------------
        const isHistoryTheme = computed(() => themes[game.themeId]?.type === 'history')

        const currentPresetId = computed(() => {
            return rulePresets.find(preset =>
                preset.born.length === game.BORN.length && preset.born.every((v, i) => v === game.BORN[i]) &&
                preset.survives.length === game.SURVIVES.length && preset.survives.every((v, i) => v === game.SURVIVES[i])
            )?.id || 'custom'
        })
        const rulePresetOptions = computed(() => {
            const options = rulePresets.map(p => ({ id: p.id, name: p.name, icon: p.icon, category: p.category }))
            if (currentPresetId.value === 'custom') {
                options.unshift({ id: 'custom', name: `Custom (B${game.BORN.join('')}/S${game.SURVIVES.join('')})`, icon: 'i-tabler-settings', category: 'Custom' })
            }
            return options
        })
        // -------------------------------------------------------------------------------------------------------------
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
                    } else if (e.buttons === 2) { // if right button is pressed
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
                if (e.button === 2) { // if right button is pressed
                    rightClick.value = true
                }
            })
            useEventListener(naiveCanvas, 'mouseup', (e) => {
                if (e.button === 2) { // if right button is released
                    rightClick.value = false
                }
                if (e.button === 0 && game.hoveredSide && isDragging.value) { // if primary button is released
                    isDragging.value = false
                    naiveCanvas.value.handleSideHover(pointerX.value, pointerY.value)
                }
            })

            placeInitialPattern()
            startLoop()
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

            animationFrameId = requestAnimationFrame(animate)
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
                // console.log(`Execution Time : ${executionTime.value} ms`)
            }

            // timer.value = setTimeout(() => animate(startExecutionTime), game.SPEED)
            animationFrameId = requestAnimationFrame(animate)
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
        function applyPreset(id: string) {
            const preset = rulePresets.find(p => p.id === id)
            if (!preset) return
            saveRulesToHistory()
            game.BORN = [...preset.born]
            game.SURVIVES = [...preset.survives]
        }
        function toggleBorn(value: number) {
            saveRulesToHistory()
            if (game.BORN.includes(value)) game.BORN = game.BORN.filter(v => v !== value)
            else game.BORN = [...game.BORN, value].sort((a, b) => a - b)
        }
        function toggleSurvives(value: number) {
            saveRulesToHistory()
            if (game.SURVIVES.includes(value)) game.SURVIVES = game.SURVIVES.filter(v => v !== value)
            else game.SURVIVES = [...game.SURVIVES, value].sort((a, b) => a - b)
        }
        function randomizeRules() {
            saveRulesToHistory()
            const newBorn: number[] = []
            const newSurvives: number[] = []
            for (let i = 0; i < 9; i++) {
                if (Math.random() < 0.3) newBorn.push(i)
                if (Math.random() < 0.3) newSurvives.push(i)
            }
            game.BORN = newBorn
            game.SURVIVES = newSurvives
        }
        function saveRulesToHistory() {
            rulesHistory.value.push({ born: [...game.BORN], survives: [...game.SURVIVES] })
            if (rulesHistory.value.length > 50) rulesHistory.value.shift()
        }
        function undoRules() {
            const prevRule = rulesHistory.value.pop()
            if (!prevRule) return
            game.BORN = prevRule.born
            game.SURVIVES = prevRule.survives
        }
        function randomizeTheme() {
            const offset = 1 + Math.floor(Math.random() * (themes.length - 1))
            game.themeId = (game.themeId + offset) % themes.length
        }
        // -------------------------------------------------------------------------------------------------------------
        function onColsChange(value: number) {
            naiveCanvas.value.updateCols(value)
            if (game.linkProportions) naiveCanvas.value.updateRows(value)
        }
        function onRowsChange(value: number) {
            naiveCanvas.value.updateRows(value)
            if (game.linkProportions) naiveCanvas.value.updateCols(value)
        }
        // -------------------------------------------------------------------------------------------------------------
        function placeInitialPattern() {
            const acorn: [number, number][] = [
                [1, 0],
                [3, 1],
                [0, 2], [1, 2], [4, 2], [5, 2], [6, 2]
            ]
            // Place at grid center
            const cx = Math.floor(game.cols / 2) - 3
            const cy = Math.floor(game.rows / 2) - 1
            for (const [x, y] of acorn) {
                naiveCanvas.value.setCell(cx + x, cy + y, 1)
            }
            naiveCanvas.value.drawCellsFromCellsArray()
        }
        // -------------------------------------------------------------------------------------------------------------
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

        onBeforeUnmount(() => {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId)
                animationFrameId = null
            }
        })

        onBeforeRouteLeave(() => {
            game.$reset()
        })
        // -------------------------------------------------------------------------------------------------------------
        return {
            game, averageExecutionTime, executionTime, SPEED, sliderMin, sliderMax,
            naiveCanvas, mainContainer, isFullscreen, toggleFullscreen,
            pointerX, pointerY, sidebarLeftOpen, sidebarRightOpen, themes,
            randomCells, clearCells, toggleIsRunning, startLoop, pause, getExecutionAverage,
            currentPresetId, rulePresetOptions, applyPreset, toggleBorn, toggleSurvives, randomizeRules, undoRules, rulesHistory, isHistoryTheme, randomizeTheme,
            onColsChange, onRowsChange,
        }
    }
})

</script>

<style scoped>

</style>

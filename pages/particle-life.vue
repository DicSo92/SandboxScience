<template>
    <section h-screen flex flex-col justify-center overflow-hidden relative ref="mainContainer" id="mainContainer">
        <SidebarLeft v-model="particleLife.sidebarLeftOpen">
            <template #controls>
            </template>
            <template #default>
                <div h-full px-2 flex flex-col>
                    <div flex justify-between items-end mb-2 px-1>
                        <div flex items-center class="-mb-0.5">
                            <div i-lets-icons-bubble text-2xl mr-2 class="text-[#2a9d8f] -mt-0.5"></div>
                            <h1 font-800 text-lg tracking-widest class="text-[#dff6f3] drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">Particle Life</h1>
                        </div>
<!--                        <div rounded-lg border-2 border-white style="width: 72px;">-->
<!--                            <div i-tabler-badge-3d style="font-size: 30px" class="-my-1"></div>-->
<!--                        </div>-->
                        <ToggleSwitch inactive-label="2D" label="3D" colorful-label v-model="particleLife.is3D" />
                    </div>
                    <hr>
                    <div overflow-auto flex-1 mt-2 class="scrollableArea">
                        <Collapse label="Matrix Settings" icon="i-tabler-grid-4x4"
                                  tooltip="Modify matrix values by clicking on cells in the grid. <br>
                                  Adjust individual cell values with the slider, or click and drag to change them directly. <br>
                                  Use Ctrl + Click to select multiple cells for group adjustments. <br>
                                  If no cells are selected, the slider will adjust all values.">
                            <MatrixSettings :store="particleLife"
                                @updateRulesMatrix="updateRulesMatrixValue"
                                @randomRulesMatrix="newRandomRulesMatrix"
                                @updateMinMatrix="updateMinMatrixValue"
                                @updateMaxMatrix="updateMaxMatrixValue">
                            </MatrixSettings>
                        </Collapse>
                        <Collapse label="World Settings" icon="i-tabler-world-cog" opened mt-2>
                            <RangeInput input label="Particle Number"
                                        tooltip="Adjust the total number of particles. <br> More particles may reveal complex interactions but can increase computational demand."
                                        :min="0" :max="20000" :step="10" v-model="particleLife.numParticles">
                            </RangeInput>
                            <RangeInput input label="Color Number"
                                        tooltip="Specify the number of particle colors. <br> Each color interacts with all others, with distinct forces and interaction ranges."
                                        :min="1" :max="20" :step="1" v-model="particleLife.numColors" mt-2>
                            </RangeInput>
                            <RangeInput input label="Depth Limit"
                                        tooltip="Set the maximum depth for particles. <br> In 3D, particles will bounce back if they exceed this limit."
                                        :min="0" :max="1000" :step="1" v-model="particleLife.depthLimit" mt-2>
                            </RangeInput>

                            <div flex items-start justify-between mt-3 mb-2>
                                <p underline text-gray-300>Walls Settings :</p>
                                <div flex>
                                    <SelectButton :id="0" label="Rectangle" v-model="particleLife.wallShape" mr-2 />
                                    <SelectButton :id="1" label="Circle" v-model="particleLife.wallShape" :disabled="particleLife.isWallWrap" />
                                </div>
                            </div>
                            <div mb-2>
                                <WallStateSelection :store="particleLife" />
                            </div>
                            <div flex mb-1>
                                <SelectButton :id="1" label="Screen" v-model="particleLife.screenMultiplierForGridSize" mr-1.5 />
                                <SelectButton :id="1.5" label="x1.5" v-model="particleLife.screenMultiplierForGridSize" mr-1.5 />
                                <SelectButton :id="2" label="x2" v-model="particleLife.screenMultiplierForGridSize" mr-1.5 />
                                <SelectButton :id="2.5" label="x2.5" v-model="particleLife.screenMultiplierForGridSize" mr-1.5 />
                                <SelectButton :id="3" label="x3" v-model="particleLife.screenMultiplierForGridSize" mr-1.5 />
                                <SelectButton :id="3.5" label="x3.5" v-model="particleLife.screenMultiplierForGridSize" mr-1.5 />
                                <SelectButton :id="4" label="x4" v-model="particleLife.screenMultiplierForGridSize" mr-1.5 />
                                <SelectButton :id="5" label="x5" v-model="particleLife.screenMultiplierForGridSize" />
                            </div>
                            <div flex items-center v-if="particleLife.wallShape === 0">
                                <p class="w-2/3 text-2sm mt-1">
                                    Rectangle Size
                                    <TooltipInfo container="#mainContainer" tooltip="Adjust the size of the rectangular area where particles are contained." />
                                </p>
                                <Input label="x" v-model="particleLife.gridWidth" @change="updateGridWidth" mr-2 />
                                <Input label="y" v-model="particleLife.gridHeight" @change="updateGridHeight" mr-2 />
                                <button type="button" btn rounded-full p2 flex items-center bg="zinc-900 hover:#212121" @click="particleLife.linkProportions = !particleLife.linkProportions">
                                    <span :class="particleLife.linkProportions ? 'i-tabler-link' : 'i-tabler-unlink'" text-sm></span>
                                </button>
                            </div>
                            <div flex items-center justify-between mt-2 v-else>
                                <p class="w-2/3 text-2sm mt-0.5">
                                    Circle Size
                                    <TooltipInfo container="#mainContainer" tooltip="Adjust the size of the circular area where particles are contained." />
                                </p>
                                <Input label="Diameter" v-model="particleLife.gridHeight" @change="updateGridHeight" mr-2 />
                            </div>
                        </Collapse>
                        <Collapse label="Force Settings" icon="i-tabler-atom" opened mt-2>
                            <RangeInput input label="Repel Force"
                                        tooltip="Adjust the force that repels particles from each other. <br> Higher values increase the separation distance."
                                        :min="0.01" :max="4" :step="0.01" v-model="particleLife.repel">
                            </RangeInput>
                            <RangeInput input label="Force Factor"
                                        tooltip="Adjust the force scaling factor. <br> Increase it to reduce particle speed, prevent explosive behavior, and manage overly rapid interactions."
                                        :min="0.01" :max="2" :step="0.01" v-model="particleLife.forceFactor" mt-2>
                            </RangeInput>
                            <RangeInput input label="Friction Factor"
                                        tooltip="Adjust the friction level. <br> Lowering it slows down particles, reducing chaotic movement and stabilizing the system."
                                        :min="0" :max="1" :step="0.01" v-model="particleLife.frictionFactor" mt-2>
                            </RangeInput>
                        </Collapse>
                        <Collapse label="Randomizer Settings" icon="i-game-icons-perspective-dice-six-faces-random" mt-2
                                  tooltip="Adjust the parameters for randomizing particle attributes. <br> Configure the ranges for minimum and maximum interaction radii, and set the range for generating Z positions for particle spawning.">
                            <RangeInputMinMax input label="Min. Radius"
                                              tooltip="Set the range for generating minimum interaction radii. <br> This determines the range of possible values for the minimum distance at which particles begin to interact."
                                              :min="0" :max="100" :step="1" v-model="particleLife.minRadiusRange">
                            </RangeInputMinMax>
                            <RangeInputMinMax input label="Max. Radius"
                                              tooltip="Set the range for generating maximum interaction radii. <br> This determines the range of possible values for the maximum interaction distance between particles."
                                              :min="particleLife.minRadiusRange[1]" :max="300" :step="1" v-model="particleLife.maxRadiusRange">
                            </RangeInputMinMax>
                        </Collapse>
                        <Collapse label="Graphics Settings" icon="i-tabler-photo-cog" mt-2>
                            <div flex items-center justify-between mb-2>
                                <p underline text-gray-300 class="-mt-0.5">General Settings :</p>
                                <ToggleSwitch inactive-label="Circle Shape" v-model="particleLife.isCircle"
                                              tooltip="Toggle between circular and square particle shapes. <br> Circular particles may slightly impact performance compared to square ones.">
                                </ToggleSwitch>
                            </div>

                            <RangeInput input label="Particle Size"
                                        tooltip="Controls the overall size of the particles in the simulation, allowing you to make them larger or smaller depending on your preference. This setting does not impact performance."
                                        :min="1" :max="20" :step="1" v-model="particleLife.particleSize" mt-2>
                            </RangeInput>
                            <hr border-gray-500 my-2>
                            <p underline text-gray-300 mb-2 >3D Settings :</p>
                            <div grid grid-cols-2 gap-4>
                                <ToggleSwitch label="Depth Size" v-model="particleLife.hasDepthSize"
                                              tooltip="Toggles the effect where particle size changes based on their position along the Z-axis, enhancing 3D depth perception.">
                                </ToggleSwitch>
                                <ToggleSwitch label="Depth Opacity" v-model="particleLife.hasDepthOpacity"
                                              tooltip="Toggles the effect where particle opacity changes based on their position along the Z-axis, enhancing 3D depth perception.">
                                </ToggleSwitch>
                            </div>
                            <RangeInput input label="Min. Opacity"
                                        tooltip="Set the minimum opacity for depth effect. <br> Lower values enhance perspective, creating a stronger depth effect when depth opacity is enabled."
                                        :min="0" :max="Math.min(1, particleLife.maxOpacity)" :step="0.01" v-model="particleLife.minOpacity" mt-2>
                            </RangeInput>
                            <RangeInput input label="Max. Opacity"
                                        tooltip="Set the maximum opacity for depth effects. <br> Higher values reduce perspective, creating a subtler depth effect when depth opacity is enabled."
                                        :min="particleLife.minOpacity" :max="2" :step="0.01" v-model="particleLife.maxOpacity" mt-2>
                            </RangeInput>
                        </Collapse>
                        <Collapse label="Debug Tools" icon="i-tabler-bug" mt-2
                                  tooltip="Access debugging tools to visualize and refine the simulation. <br> Manage cell boundaries, adjust cell sizes, and control particle groupings to troubleshoot and optimize performance.">
                            <div flex items-center justify-between>
                                <div flex>
                                    <ToggleSwitch label="Show Cells" v-model="particleLife.hasCells" mr-4
                                                  tooltip="Toggle the visibility of cells in the spatial partitioning system. <br> When enabled, cells will be displayed to help visualize particle grouping.">
                                    </ToggleSwitch>
                                    <ToggleSwitch label="Follow" v-model="particleLife.isCellFollow" :disabled="!particleLife.hasCells"
                                                  tooltip="Toggle to display cells based on their center relative to all particles within the cell. <br> This helps track groups of particles as you adjust the cell group size.">
                                    </ToggleSwitch>
                                </div>
                                <div flex>
                                    <SelectButton :id="0" icon="i-tabler-square" v-model="particleLife.cellShape" mr-2 />
                                    <SelectButton :id="1" icon="i-tabler-circle" v-model="particleLife.cellShape" />
                                </div>
                            </div>

                            <RangeInput input label="Cell Group Size"
                                        tooltip="Set the minimum number of particles required for a cell to be displayed. <br> At 0, all cells are shown; higher values filter out smaller groups."
                                        :min="0" :max="100" :step="1" v-model="particleLife.cellGroupSize" mt-2>
                            </RangeInput>
                            <RangeInput input label="Cell Size Factor"
                                        tooltip="Adjust the size of the cells used in the algorithm. <br> At 1, cells match the current max radius; higher values increase cell size. Values below 1 may prevent interactions between neighboring particles."
                                        :min="1" :max="2" :step="0.01" v-model="particleLife.cellSizeFactor" mt-2>
                            </RangeInput>
                        </Collapse>
                    </div>
                    <div absolute bottom-2 right-0 z-100 class="-mr-px">
                        <button rounded-l-lg border border-gray-400 flex items-center p-1 bg="gray-800 hover:gray-900" @click="particleLife.sidebarLeftOpen = false">
                            <span i-tabler-chevron-left text-2xl></span>
                        </button>
                    </div>
                </div>
            </template>
        </SidebarLeft>
        <canvas ref="lifeCanvas" id="lifeCanvas" @contextmenu.prevent w-full h-full cursor-crosshair></canvas>
        <div absolute top-0 right-0 flex flex-col items-end text-right pointer-events-none>
            <div flex items-center text-start text-xs pl-4 pr-1 bg-gray-800 rounded-bl-xl style="padding-bottom: 1px; opacity: 75%">
                <div flex>Fps: <div ml-1 min-w-8>{{ fps }}</div></div>
                <div flex ml-3>Cells: <div ml-1 min-w-8>{{ cellCount }}</div></div>
                <div flex ml-3>Process: <div ml-1 min-w-7>{{ Math.round(executionTime) }}</div></div>
            </div>
<!--            <Memory mr-1 />-->
            <BrushSettings :store="particleLife" pointer-events-auto mt-2 mr-1 />

            <div class="faded-hover-effect" pointer-events-auto mr-1>
                <button type="button" title="Debugger" aria-label="Debugger" btn w-8 aspect-square rounded-full p1 flex items-center justify-center bg="#D62839 hover:#DC4151" mt-2
                        @click="particleLife.hasCells = !particleLife.hasCells">
                    <span text-sm :class="particleLife.hasCells ? 'i-tabler-bug-filled' : 'i-tabler-bug'"></span>
                </button>
                <button type="button" title="Grid" aria-label="Grid" btn w-8 aspect-square rounded-full p1 flex items-center justify-center bg="#212121 hover:#333333" mt-2
                        @click="particleLife.hasGrid = !particleLife.hasGrid" :disabled="!particleLife.isWallRepel && !particleLife.isWallWrap" class="disabled:cursor-not-allowed">
                    <span text-sm :class="particleLife.hasGrid ? 'i-tabler-bread' : 'i-tabler-bread-off'"></span>
                </button>
            </div>

        </div>
        <div fixed z-10 bottom-2 flex justify-center items-end class="faded-hover-effect left-1/2 transform -translate-x-1/2">
            <button type="button" name="Randomize" aria-label="Randomize" btn p2 rounded-full mx-1 flex items-center bg="#094F5D hover:#0B5F6F" @click="regenerateLife">
                <span i-game-icons-perspective-dice-six-faces-random></span>
            </button>
            <button type="button" name="Toggle 3D" aria-label="Toggle 3D" btn p2 rounded-full mx-1 flex items-center bg="#E45C3A hover:#E76F51" @click="particleLife.is3D = !particleLife.is3D">
                <span text-sm font-700 style="line-height: normal">{{ particleLife.is3D ? '2D' : '3D' }}</span>
            </button>
            <button type="button" name="Zoom Out" aria-label="Zoom Out" btn p2 rounded-full mx-1 flex items-center bg="#212121 hover:#333333" @click="handleZoom(-1, lifeCanvas!.clientWidth / 2, lifeCanvas!.clientHeight / 2)">
                <span i-tabler-zoom-out></span>
            </button>
            <button type="button" name="Play/Pause" aria-label="Play/Pause" btn p3 rounded-full mx-1 flex items-center bg="#212121 hover:#333333" @click="particleLife.isRunning = !particleLife.isRunning">
                <span text-xl :class="particleLife.isRunning ? 'i-tabler-player-pause-filled' : 'i-tabler-player-play-filled'"></span>
            </button>
            <button type="button" name="Step" aria-label="Step" btn p2 rounded-full mx-1 flex items-center bg="#212121 hover:#333333" :disabled="particleLife.isRunning" @click="step">
                <span i-tabler-player-skip-forward-filled></span>
            </button>
            <button type="button" name="Zoom In" aria-label="Zoom In" btn p2 rounded-full mx-1 flex items-center bg="#212121 hover:#333333" @click="handleZoom(1, lifeCanvas!.clientWidth / 2, lifeCanvas!.clientHeight / 2)">
                <span i-tabler-zoom-in></span>
            </button>
            <button type="button" name="Toggle Fullscreen" aria-label="Toggle Fullscreen" btn p2 rounded-full mx-1 flex items-center bg="#212121 hover:#333333" @click="toggleFullscreen">
                <span :class="isFullscreen ? 'i-tabler-maximize-off' : 'i-tabler-maximize'"></span>
            </button>
        </div>
    </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import MatrixSettings from "~/components/particle-life/MatrixSettings.vue";
import RulesMatrix from "~/components/particle-life/RulesMatrix.vue";
import Memory from "~/components/particle-life/Memory.vue";
import BrushSettings from "~/components/particle-life/BrushSettings.vue";
import WallStateSelection from "~/components/particle-life/WallStateSelection.vue";
import SidebarLeft from "~/components/SidebarLeft.vue";
export default defineComponent({
    components: { MatrixSettings, RulesMatrix, Memory, BrushSettings, WallStateSelection },
    setup() {
        definePageMeta({
            layout: 'life',
            hideNavBar: true
        })
        useSeoMeta({
            title: 'Particle Life',
            description: 'Discover Particle Life, an interactive and educational particle simulator to understand physical phenomena and particle system dynamics.',
            ogTitle: 'Particle Life • Particle Simulation',
            ogDescription: 'Discover Particle Life, an interactive and educational particle simulator to understand physical phenomena and particle system dynamics.',
            twitterTitle: 'Particle Life • Particle Simulation',
            twitterDescription: 'Discover Particle Life, an interactive and educational particle simulator to understand physical phenomena and particle system dynamics.',
        })

        const particleLife = useParticleLifeStore()
        const mainContainer = ref<HTMLElement | null>(null)
        const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(mainContainer)

        let customRulesMatrix: number[][] = [[0,1,0,1,0,0,0,0,0],[0,0,1,0,1,0,0,0,0],[1,0,0,0,0,1,0,0,0],[0,0,0,0,1,0,1,0,0],[0,0,0,0,0,1,0,1,0],[0,0,0,1,0,0,0,0,1],[1,0,0,0,0,0,0,1,0],[0,1,0,0,0,0,0,0,1],[0,0,1,0,0,0,1,0,0]]

        // Define canvas and context for drawing
        let lifeCanvas: HTMLCanvasElement | undefined
        let ctx: CanvasRenderingContext2D | undefined
        let canvasWidth: number = 0
        let canvasHeight: number = 0
        let animationFrameId: number | null = null

        // Define the reactive variables for the game state
        const fps = useFps()
        const cellCount = ref<number>(0)
        const executionTime = ref<number>(0)
        let isRunning = particleLife.isRunning
        let isBrushActive: boolean = particleLife.isBrushActive
        let brushes: number[] = particleLife.brushes
        let brushRadius: number = particleLife.brushRadius
        let brushIntensity: number = particleLife.brushIntensity
        let brushType: number = particleLife.brushType // 0: Erase, 1: Draw
        let attractForce: number = particleLife.attractForce
        let repulseForce: number = -Math.abs(particleLife.repulseForce)
        let isMagnetActive: boolean = false
        let wallRepelForce: number = particleLife.wallRepelForce // Repulse force for the walls (velocity will be multiplied by this value negative)

        // Define color list and rules matrix for the particles
        let currentColors: number[] = [] // Current colors for the particles
        let rulesMatrix: number[][] = [] // Rules matrix for each color
        let maxRadiusMatrix: number[][] = [] // Max radius matrix for each color
        let minRadiusMatrix: number[][] = [] // Min radius matrix for each color

        // Define world properties
        let numParticles: number = particleLife.numParticles // Number of particles
        let numColors: number = particleLife.numColors // Number of colors to be used
        let particleSize: number = particleLife.particleSize // Size of the particles at zoomFactor = 1
        let depthLimit: number = particleLife.depthLimit // Maximum Z axis depth (0 means almost 2D because there is friction with the walls && can be negative)
        let isCircle: boolean = particleLife.isCircle // Enable circular shape for the particles
        let hasGrid: boolean = particleLife.hasGrid // Enable grid
        let hasCells: boolean = particleLife.hasCells // Enable cells
        let isCellFollow: boolean = particleLife.isCellFollow // Enable cell follow
        let isWallRepel: boolean = particleLife.isWallRepel // Enable walls X and Y for the particles
        let isWallWrap: boolean = particleLife.isWallWrap // Enable wrapping for the particles
        let hasDepthSize: boolean = particleLife.hasDepthSize // Enable depth size effect
        let hasDepthOpacity: boolean = particleLife.hasDepthOpacity // Enable depth opacity effect
        let maxOpacity: number = particleLife.maxOpacity // Maximum opacity when hasDepthOpacity is enabled
        let minOpacity: number = particleLife.minOpacity // Depth effect will be stronger with lower opacity
        let cellGroupSize: number = particleLife.cellGroupSize // Minimum number of particles to be considered a group (0 to visualize all cells)
        let cellShape: number = particleLife.cellShape // 0: Rectangle, 1: Circle
        let wallShape: number = particleLife.wallShape // 0: Rectangle, 1: Circle
        let screenMultiplierForGridSize: number = particleLife.screenMultiplierForGridSize // Multiplier for the grid size based on the screen size

        // Define force properties
        let repel: number = particleLife.repel // repel force for particles that are too close to each other (can't be 0)
        let forceFactor: number = particleLife.forceFactor // Decrease will increase the impact of the force on the velocity (the higher the value, the slower the particles will move) (can't be 0)
        let frictionFactor: number = particleLife.frictionFactor // Slow down the particles (0 to 1, where 1 is no friction)
        let zoomFactor: number = 1 // Zoom level
        let cellSizeFactor: number = particleLife.cellSizeFactor // Adjust the cell size based on the particle size
        let cellSize: number = 0 // Cell size based on the current max radius && cellSizeFactor

        let currentMinRadius: number = 0 // Max value between all colors min radius
        let currentMaxRadius: number = particleLife.currentMaxRadius // Max value between all colors max radius (for cell size)

        // Define grid properties
        let gridOffsetX: number = 0 // Grid offset X
        let gridOffsetY: number = 0 // Grid offset Y
        let gridWidth: number = 0 // Grid width
        let gridHeight: number = 0 // Grid height
        let startGridX: number = 0 // Position X of the start of the rectangle grid
        let startGridY: number = 0 // Position Y of the start of the rectangle grid
        let endGridX: number = 0 // Position X of the end of the rectangle grid
        let endGridY: number = 0 // Position Y of the end of the rectangle grid
        let halfParticleSize: number = 0 // Half of the particle size with zoom factor
        let circleRadius: number = 0 // Radius of the grid circle
        let circleCenterX: number = 0 // Center X of the grid circle
        let circleCenterY: number = 0 // Center Y of the grid circle

        // Define the properties for dragging and zooming
        let isDragging: boolean = false // Flag to check if the mouse is being dragged
        let lastPointerX: number = 0 // For dragging
        let lastPointerY: number = 0 // For dragging
        let pointerX: number = 0 // Pointer X
        let pointerY: number = 0 // Pointer Y

        // Define the arrays for storing the properties of each particle
        let cells: Map<string, number[]> // Map to store the particles in each cell
        let colors = new Int32Array(numParticles) // Color of each particle
        let positionX = new Float32Array(numParticles) // X position of each particle
        let positionY = new Float32Array(numParticles) // Y position of each particle
        let positionZ = new Float32Array(numParticles) // Z position of each particle
        let velocityX = new Float32Array(numParticles).fill(0) // X velocity of each particle
        let velocityY = new Float32Array(numParticles).fill(0) // Y velocity of each particle
        let velocityZ = new Float32Array(numParticles).fill(0) // Z velocity of each particle

        onMounted(() => {
            lifeCanvas = document.getElementById('lifeCanvas') as HTMLCanvasElement
            ctx = lifeCanvas?.getContext('2d') || undefined
            handleResize()
            setAlgorithms()
            initLife()
            if (!isRunning) simpleDrawParticles()
            animationFrameId = requestAnimationFrame(update) // Start the game loop

            onKeyStroke(' ', () => { // Space bar pressed
                console.log('Key Space pressed')
                particleLife.isRunning = !particleLife.isRunning
            })
            onKeyStroke('c', () => { // Space bar pressed
                console.log('Key C pressed')
                centerView()
                if (!isRunning) simpleDrawParticles()
            })
            useEventListener('resize', handleResize)
            useEventListener(lifeCanvas, ['mousedown'], (e) => {
                lastPointerX = e.x - lifeCanvas!.getBoundingClientRect().left
                lastPointerY = e.y - lifeCanvas!.getBoundingClientRect().top
                if (e.buttons > 0) {
                    if (e.buttons === 2 && isBrushActive) { // if secondary button is pressed (right click)
                        if (brushType === 0) eraseWithBrush()
                        else if (brushType === 1) drawWithBrush()
                        else if (brushType === 2 || brushType === 3) {
                            isMagnetActive = true
                        }
                    }
                }
            })
            useEventListener(lifeCanvas, ['mousemove'], (e) => {
                pointerX = e.x - lifeCanvas!.getBoundingClientRect().left
                pointerY = e.y - lifeCanvas!.getBoundingClientRect().top

                if (e.buttons > 0) { // if mouse is pressed
                    if (particleLife.isLockedPointer) return // Prevent canvas dragging if the pointer is locked
                    isDragging = true
                    if (e.buttons === 1) { // if primary button is pressed (left click)
                        handleMove()
                    }
                    if (e.buttons === 2 && isBrushActive) { // if secondary button is pressed (right click)
                        if (brushType === 0) eraseWithBrush()
                        else if (brushType === 1) drawWithBrush()
                    }
                }
                else if (e.buttons === 0) {
                    isDragging = false
                    isMagnetActive = false
                }
            })
            useEventListener(lifeCanvas, ['mouseup'], (e) => {
                isDragging = false
                if (e.button === 2 && isBrushActive) { // if secondary button is pressed (right click)
                    if (brushType === 2 || brushType === 3) { // Magnet
                        isMagnetActive = false
                    }
                }
            })
            useEventListener(lifeCanvas, ['touchstart'], (e) => {
                e.preventDefault()
                lastPointerX = e.touches[0].clientX - lifeCanvas!.getBoundingClientRect().left
                lastPointerY = e.touches[0].clientY - lifeCanvas!.getBoundingClientRect().top
            })
            useEventListener(lifeCanvas, ['touchmove'], (e) => {
                e.preventDefault()
                pointerX = e.touches[0].clientX - lifeCanvas!.getBoundingClientRect().left
                pointerY = e.touches[0].clientY - lifeCanvas!.getBoundingClientRect().top

                if (particleLife.isLockedPointer) return // Prevent canvas dragging if the pointer is locked
                isDragging = true
                handleMove()
            })
            useEventListener(lifeCanvas, ['touchend'], (e) => {
                e.preventDefault()
                console.log('end touch')
                isDragging = false
            })

            useEventListener(lifeCanvas, 'wheel', (e) => {
                if (e.deltaY < 0) { // Zoom in
                    handleZoom(1, pointerX, pointerY)
                } else { // Zoom out
                    handleZoom(-1, pointerX, pointerY)
                }
            })
        })
        // -------------------------------------------------------------------------------------------------------------
        function handleResize() {
            canvasWidth = lifeCanvas!.width = lifeCanvas!.clientWidth
            canvasHeight = lifeCanvas!.height = lifeCanvas!.clientHeight
            setShapesProperties()
            if (!isRunning) simpleDrawParticles()
        }
        function handleMove() {
            if (isDragging) {
                gridOffsetX += (pointerX - lastPointerX) / zoomFactor
                gridOffsetY += (pointerY - lastPointerY) / zoomFactor
                lastPointerX = pointerX
                lastPointerY = pointerY
                setShapesProperties()
            }
        }
        function handleZoom(delta: number, x: number, y: number) {
            const oldZoomFactor = zoomFactor
            const zoomIntensity = 0.1
            const zoomDelta = delta * zoomIntensity
            zoomFactor = Math.max(0.1, Math.min(3.2, zoomFactor + zoomDelta))

            // Adjust grid offsets by scaling the cursor position with the ratio of the new and old zoom factors
            // This maintains the cursor's position on the grid during zoom operations
            gridOffsetX -= (x / zoomFactor) * ((zoomFactor / oldZoomFactor) - 1)
            gridOffsetY -= (y / zoomFactor) * ((zoomFactor / oldZoomFactor) - 1)

            setShapesProperties()
            if (!isRunning) simpleDrawParticles()
        }
        // -------------------------------------------------------------------------------------------------------------
        function setAlgorithms() {
            if (particleLife.is3D) {
                processRules = particleLife.isWallWrap ? processRules3DWrapped : processRules3D
                updateParticles = updateParticles3D
                drawParticle = drawParticle3D
            } else {
                processRules = particleLife.isWallWrap ? processRules2DWrapped : processRules2D
                updateParticles = updateParticles2D
                drawParticle = drawParticle2D
            }
        }
        function initLife() {
            // Set the grid size and zoom factor based on the screen size
            setGridSizeBasedOnScreen()
            zoomFactor /= screenMultiplierForGridSize

            initColors()
            centerView()
            initParticles()
            setRulesMatrix(makeRandomRulesMatrix())
            setMinRadiusMatrix(makeRandomMinRadiusMatrix())
            setMaxRadiusMatrix(makeRandomMaxRadiusMatrix())

            console.table(minRadiusMatrix)
            console.table(maxRadiusMatrix)
            console.table(rulesMatrix)
        }
        function regenerateLife() {
            if (animationFrameId) cancelAnimationFrame(animationFrameId)

            initColors()
            initParticles()
            setRulesMatrix(makeRandomRulesMatrix())
            setMinRadiusMatrix(makeRandomMinRadiusMatrix())
            setMaxRadiusMatrix(makeRandomMaxRadiusMatrix())

            if (!isRunning) simpleDrawParticles()
            animationFrameId = requestAnimationFrame(update) // Start the game loop
        }
        function initColors() {
            currentColors = [];
            for (let i = 0; i < numColors; ++i) {
                // currentColors.push(i)
                currentColors.push(i * 360 / numColors) // HSL color (precalculated)
            }
            particleLife.currentColors = currentColors
            particleLife.brushes = []
        }
        function initParticles() {
            for (let i = 0; i < numParticles; ++i) {
                colors[i] = Math.floor(Math.random() * numColors)
                const newPositions = getRandomPositions()
                positionX[i] = newPositions.x
                positionY[i] = newPositions.y
                positionZ[i] = newPositions.z
            }
        }
        function newRandomRulesMatrix() {
            setRulesMatrix(makeRandomRulesMatrix())
            if (!isRunning) simpleDrawParticles()
        }
        function makeRandomRulesMatrix() {
            let matrix: number[][] = []
            for (let i = 0; i < numColors; i++) {
                matrix.push([])
                for (let j = 0; j < numColors; j++) {
                    matrix[i].push(Number((Math.random() * 2 - 1).toFixed(4)))
                }
            }
            return matrix
        }
        function makeRandomMinRadiusMatrix() {
            let matrix: number[][] = []
            const min: number = particleLife.minRadiusRange[0]
            const max: number = particleLife.minRadiusRange[1]
            let maxRandom: number = min
            for (let i = 0; i < numColors; i++) {
                matrix.push([])
                for (let j = 0; j < numColors; j++) {
                    const random = Math.floor(Math.random() * (max - min + 1) + min)
                    matrix[i].push(random)
                    if (random > maxRandom) {
                        maxRandom = random
                    }
                }
            }
            currentMinRadius = maxRandom
            return matrix
        }
        function makeRandomMaxRadiusMatrix() {
            let matrix: number[][] = []
            const min: number = particleLife.maxRadiusRange[0]
            const max: number = particleLife.maxRadiusRange[1]
            let maxRandom: number = min
            for (let i = 0; i < numColors; i++) {
                matrix.push([])
                for (let j = 0; j < numColors; j++) {
                    const random = Math.floor(Math.random() * (max - min + 1) + min)
                    matrix[i].push(random)
                    if (random > maxRandom) {
                        maxRandom = random
                    }
                }
            }
            particleLife.currentMaxRadius = maxRandom
            return matrix
        }
        function getRandomPositions() {
            const minZDepthRandomParticle = depthLimit * 0.2 // The minimum Z-depth for randomly placed particles, in percentage of the depthLimit
            const maxZDepthRandomParticle = depthLimit * 0.45 // The maximum Z-depth for randomly placed particles, in percentage of the depthLimit

            if (wallShape === 0) { // Rectangle
                return {
                    x: Math.random() * gridWidth,
                    y: Math.random() * gridHeight,
                    z: Math.random() * (maxZDepthRandomParticle - minZDepthRandomParticle) + minZDepthRandomParticle
                }
            } else { // Circle
                while (true) {
                    const x = Math.random() * 2 * circleRadius - circleRadius;
                    const y = Math.random() * 2 * circleRadius - circleRadius;
                    if (x * x + y * y <= circleRadius * circleRadius) {
                        return {
                            x: circleCenterX + x,
                            y: circleCenterY + y,
                            z: Math.random() * (maxZDepthRandomParticle - minZDepthRandomParticle) + minZDepthRandomParticle
                        }
                    }
                }
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        function update() {
            const startExecutionTime = performance.now()
            if (isRunning) {
                processRules()
                updateParticles()
                if (hasGrid) drawGrid()
                if (hasCells) drawCells()
                if (isMagnetActive) {
                    if (brushType === 2) magnetWithBrush(repulseForce)
                    else if (brushType === 3) magnetWithBrush(attractForce)
                }
            } else {
                if (isDragging || isBrushActive) simpleDrawParticles()
            }
            if (isBrushActive) drawBrush()

            executionTime.value = performance.now() - startExecutionTime
            animationFrameId = requestAnimationFrame(update)
        }
        function step() {
            if (!isRunning) {
                processRules()
                updateParticles()
                if (hasGrid) drawGrid()
                if (hasCells) drawCells()
            }
        }
        function drawCells() {
            cells.forEach((particles, cell) => {
                if (particles.length <= cellGroupSize) return // Detect groups of particles

                let centerX = 0, centerY = 0
                if (isCellFollow) { // Follow the particles in the cell
                    for (let p = 0; p < particles.length; p++) {
                        centerX += positionX[particles[p]]
                        centerY += positionY[particles[p]]
                    }
                    centerX /= particles.length
                    centerY /= particles.length
                } else { // Static cell position
                    const [cellX, cellY] = cell.split(',').map(Number)
                    centerX = cellX * cellSize + cellSize / 2
                    centerY = cellY * cellSize + cellSize / 2
                }

                // Adjust the position based on the grid offset and zoom factor
                const drawX = (centerX + gridOffsetX) * zoomFactor
                const drawY = (centerY + gridOffsetY) * zoomFactor
                const radius = cellSize / 2 * zoomFactor

                // Skip if the cell is outside the canvas
                if (drawX < -radius || drawX > canvasWidth + radius || drawY < -radius || drawY > canvasHeight + radius) return

                // Draw the cell
                ctx!.beginPath()
                if (cellShape === 0) { // Rectangle
                    ctx!.roundRect(drawX - radius, drawY - radius, radius * 2, radius * 2, radius / 4)
                } else { // Circle
                    ctx!.arc(drawX, drawY, radius, 0, Math.PI * 2)
                }
                ctx!.strokeStyle = `hsl(${0}, 100%, 50%, 0.55)`
                ctx!.stroke()
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        let drawParticle: (x: number, y: number, z: number, color: number, size: number) => void
        function drawParticle2D(x: number, y: number, z: number, color: number, size: number) {
            const newSize = size * zoomFactor // Adjust the size based on the depth factor and zoom factor
            if (newSize <= 0) return // Skip if the particle is too small
            const drawX = (x + gridOffsetX) * zoomFactor // Adjust the position X based on the grid offset and zoom factor
            const drawY = (y + gridOffsetY) * zoomFactor // Adjust the position Y based on the grid offset and zoom factor
            if (drawX < 0 || drawX > canvasWidth || drawY < 0 || drawY > canvasHeight) return // Skip if the particle is outside the canvas

            ctx!.fillStyle = `hsl(${color}, 100%, 50%, 1)`

            // Handle particle drawing
            if (newSize < 2 || !isCircle) { // Draw squares for small particles
                ctx!.fillRect(drawX - newSize / 2, drawY - newSize / 2, newSize, newSize)
            } else { // Draw circles for larger particles
                ctx!.beginPath()
                ctx!.arc(drawX, drawY, newSize / 2, 0, Math.PI * 2)
                ctx!.fill()
            }
        }
        function drawParticle3D(x: number, y: number, z: number, color: number, size: number) {
            let depthFactor = 1
            if (hasDepthSize) {
                depthFactor = 1 - z / gridHeight / zoomFactor // Adjust this factor to control the depth effect
            }
            const newSize = size * depthFactor * zoomFactor // Adjust the size based on the depth factor and zoom factor
            if (newSize <= 0) return // Skip if the particle is too small
            const drawX = (x + gridOffsetX) * zoomFactor // Adjust the position X based on the grid offset and zoom factor
            const drawY = (y + gridOffsetY) * zoomFactor // Adjust the position Y based on the grid offset and zoom factor
            if (drawX < 0 || drawX > canvasWidth || drawY < 0 || drawY > canvasHeight) return // Skip if the particle is outside the canvas

            // Handle depth opacity effect
            if (hasDepthOpacity) {
                // Opacity depth effect
                const opacity = depthLimit !== 0 ? maxOpacity - (z / depthLimit) * (maxOpacity - minOpacity) : 1
                ctx!.fillStyle = `hsl(${color}, 100%, 50%, ${opacity})`
            } else {
                // No opacity depth effect
                ctx!.fillStyle = `hsl(${color}, 100%, 50%, 1)`
            }

            // Handle particle drawing
            if (newSize < 2 || !isCircle) { // Draw squares for small particles
                ctx!.fillRect(drawX - newSize / 2, drawY - newSize / 2, newSize, newSize)
            } else { // Draw circles for larger particles
                ctx!.beginPath()
                ctx!.arc(drawX, drawY, newSize / 2, 0, Math.PI * 2)
                ctx!.fill()
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        function getForce(ruleFactor: number, colorMinRadius: number, colorMaxRadius: number, distance: number) {
            if (distance < colorMinRadius) {
                return (repel / colorMinRadius) * distance - repel
            } else if (distance > colorMaxRadius) {
                return 0
            } else {
                let mid = (colorMinRadius + colorMaxRadius) / 2
                let slope = ruleFactor / (mid - colorMinRadius)
                return -(slope * Math.abs(distance - mid)) + ruleFactor
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        let processRules: () => void
        function processRules2D() {
            cells = new Map<string, number[]>()

            // Assign each particle to a cell
            for (let i = 0; i < numParticles; i++) {
                const cellX = Math.floor(positionX[i] / cellSize)
                const cellY = Math.floor(positionY[i] / cellSize)
                const cellKey = `${cellX},${cellY}`
                if (!cells.has(cellKey)) {
                    cells.set(cellKey, [])
                }
                cells.get(cellKey)!.push(i)
            }

            const cellKeys = Array.from(cells.keys())
            const cellNeighbors = new Map()

            // Precompute neighboring cells for each cell
            for (let i = 0; i < cellKeys.length; i++) {
                const cellKey = cellKeys[i]
                const [cellX, cellY] = cellKey.split(',').map(Number)
                const neighbors = []
                for (let offsetY = -1; offsetY <= 1; offsetY++) {
                    for (let offsetX = -1; offsetX <= 1; offsetX++) {
                        const neighborX = cellX + offsetX
                        const neighborY = cellY + offsetY
                        const neighborKey = `${neighborX},${neighborY}`
                        if (cells.has(neighborKey)) {
                            neighbors.push(neighborKey)
                        }
                    }
                }
                cellNeighbors.set(cellKey, neighbors)
            }

            // Process each cell
            for (let i = 0; i < cellKeys.length; i++) {
                const cellKey = cellKeys[i]
                const particles = cells.get(cellKey)
                const neighbors = cellNeighbors.get(cellKey)

                // Process each particle in the cell
                for (let j = 0; j < particles!.length; j++) {
                    const indexA = particles![j]
                    const posXA = positionX[indexA]
                    const posYA = positionY[indexA]

                    let velocityXSum = 0, velocityYSum = 0

                    // Process each neighboring cell
                    for (let k = 0; k < neighbors.length; k++) {
                        const neighborKey = neighbors[k]
                        const neighborParticles = cells.get(neighborKey)

                        // Process each particle in the neighboring cell
                        for (let l = 0; l < neighborParticles!.length; l++) {
                            const indexB = neighborParticles![l]
                            if (indexA === indexB) continue

                            const dx = positionX[indexB] - posXA
                            const dy = positionY[indexB] - posYA
                            const distance = Math.sqrt(dx * dx + dy * dy)

                            const colorA = colors[indexA]
                            const colorB = colors[indexB]
                            const colorMaxRadius = maxRadiusMatrix[colorA][colorB]

                            // Apply force if the particles are close enough
                            if (distance < colorMaxRadius) {
                                const force = getForce(rulesMatrix[colorA][colorB], minRadiusMatrix[colorA][colorB], colorMaxRadius, distance)

                                velocityXSum += dx / distance * force
                                velocityYSum += dy / distance * force
                            }
                        }
                    }
                    // Update the velocity of the particle
                    velocityX[indexA] += velocityXSum / forceFactor
                    velocityY[indexA] += velocityYSum / forceFactor
                }
            }
            cellCount.value = cells.size
        }
        function processRules2DWrapped() {
            cells = new Map<string, number[]>()

            // Assign each particle to a cell
            for (let i = 0; i < numParticles; i++) {
                const cellX = Math.floor(positionX[i] / cellSize)
                const cellY = Math.floor(positionY[i] / cellSize)
                const cellKey = `${cellX},${cellY}`
                if (!cells.has(cellKey)) {
                    cells.set(cellKey, [])
                }
                cells.get(cellKey)!.push(i)
            }

            const cellKeys = Array.from(cells.keys())
            const cellNeighbors = new Map()

            // Precompute neighboring cells for each cell
            const lastCellsX = Math.floor(gridWidth / cellSize)
            const lastCellsY = Math.floor(gridHeight / cellSize)
            for (let i = 0; i < cellKeys.length; i++) {
                const cellKey = cellKeys[i]
                const [cellX, cellY] = cellKey.split(',').map(Number)
                const neighbors = []

                for (let offsetY = -1; offsetY <= 1; offsetY++) {
                    for (let offsetX = -1; offsetX <= 1; offsetX++) {
                        let neighborX = cellX + offsetX
                        let neighborY = cellY + offsetY

                        if (neighborX < 0) neighborX = lastCellsX
                        else if (neighborX > lastCellsX) neighborX = 0
                        if (neighborY < 0) neighborY = lastCellsY
                        else if (neighborY > lastCellsY) neighborY = 0

                        const neighborKey = `${neighborX},${neighborY}`
                        if (cells.has(neighborKey)) {
                            neighbors.push(neighborKey)
                        }
                    }
                }
                cellNeighbors.set(cellKey, neighbors)
            }

            // Process each cell
            for (let i = 0; i < cellKeys.length; i++) {
                const cellKey = cellKeys[i]
                const particles = cells.get(cellKey)
                const neighbors = cellNeighbors.get(cellKey)

                // Process each particle in the cell
                for (let j = 0; j < particles!.length; j++) {
                    const indexA = particles![j]
                    const posXA = positionX[indexA]
                    const posYA = positionY[indexA]

                    let velocityXSum = 0, velocityYSum = 0

                    // Process each neighboring cell
                    for (let k = 0; k < neighbors.length; k++) {
                        const neighborKey = neighbors[k]
                        const neighborParticles = cells.get(neighborKey)

                        // Process each particle in the neighboring cell
                        for (let l = 0; l < neighborParticles!.length; l++) {
                            const indexB = neighborParticles![l]
                            if (indexA === indexB) continue

                            let dx = positionX[indexB] - posXA
                            let dy = positionY[indexB] - posYA

                            // Apply wrapping for X direction
                            if (dx > gridWidth / 2) dx -= gridWidth
                            else if (dx < -gridWidth / 2) dx += gridWidth
                            // Apply wrapping for Y direction
                            if (dy > gridHeight / 2) dy -= gridHeight
                            else if (dy < -gridHeight / 2) dy += gridHeight

                            const distance = Math.sqrt(dx * dx + dy * dy)

                            const colorA = colors[indexA]
                            const colorB = colors[indexB]
                            const colorMaxRadius = maxRadiusMatrix[colorA][colorB]

                            // Apply force if the particles are close enough
                            if (distance < colorMaxRadius) {
                                const force = getForce(rulesMatrix[colorA][colorB], minRadiusMatrix[colorA][colorB], colorMaxRadius, distance)

                                velocityXSum += dx / distance * force
                                velocityYSum += dy / distance * force
                            }
                        }
                    }
                    // Update the velocity of the particle
                    velocityX[indexA] += velocityXSum / forceFactor
                    velocityY[indexA] += velocityYSum / forceFactor
                }
            }
            cellCount.value = cells.size
        }

        function processRules3D() {
            cells = new Map<string, number[]>()

            // Assign each particle to a cell
            for (let i = 0; i < numParticles; i++) {
                const cellX = Math.floor(positionX[i] / cellSize)
                const cellY = Math.floor(positionY[i] / cellSize)
                const cellKey = `${cellX},${cellY}`
                if (!cells.has(cellKey)) {
                    cells.set(cellKey, [])
                }
                cells.get(cellKey)!.push(i)
            }

            const cellKeys = Array.from(cells.keys())
            const cellNeighbors = new Map()

            // Precompute neighboring cells for each cell
            for (let i = 0; i < cellKeys.length; i++) {
                const cellKey = cellKeys[i]
                const [cellX, cellY] = cellKey.split(',').map(Number)
                const neighbors = []
                for (let offsetY = -1; offsetY <= 1; offsetY++) {
                    for (let offsetX = -1; offsetX <= 1; offsetX++) {
                        const neighborX = cellX + offsetX
                        const neighborY = cellY + offsetY
                        const neighborKey = `${neighborX},${neighborY}`
                        if (cells.has(neighborKey)) {
                            neighbors.push(neighborKey)
                        }
                    }
                }
                cellNeighbors.set(cellKey, neighbors)
            }

            // Process each cell
            for (let i = 0; i < cellKeys.length; i++) {
                const cellKey = cellKeys[i]
                const particles = cells.get(cellKey)
                const neighbors = cellNeighbors.get(cellKey)

                // Process each particle in the cell
                for (let j = 0; j < particles!.length; j++) {
                    const indexA = particles![j]
                    const posXA = positionX[indexA]
                    const posYA = positionY[indexA]
                    const posZA = positionZ[indexA]

                    let velocityXSum = 0, velocityYSum = 0, velocityZSum = 0

                    // Process each neighboring cell
                    for (let k = 0; k < neighbors.length; k++) {
                        const neighborKey = neighbors[k]
                        const neighborParticles = cells.get(neighborKey)

                        // Process each particle in the neighboring cell
                        for (let l = 0; l < neighborParticles!.length; l++) {
                            const indexB = neighborParticles![l]
                            if (indexA === indexB) continue

                            const dx = positionX[indexB] - posXA
                            const dy = positionY[indexB] - posYA
                            const dz = positionZ[indexB] - posZA
                            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

                            const colorA = colors[indexA]
                            const colorB = colors[indexB]
                            const colorMaxRadius = maxRadiusMatrix[colorA][colorB]

                            // Apply force if the particles are close enough
                            if (distance < colorMaxRadius) {
                                const force = getForce(rulesMatrix[colorA][colorB], minRadiusMatrix[colorA][colorB], colorMaxRadius, distance)

                                velocityXSum += dx / distance * force
                                velocityYSum += dy / distance * force
                                velocityZSum += dz / distance * force
                            }
                        }
                    }
                    // Update the velocity of the particle
                    velocityX[indexA] += velocityXSum / forceFactor
                    velocityY[indexA] += velocityYSum / forceFactor
                    velocityZ[indexA] += velocityZSum / forceFactor
                }
            }
            cellCount.value = cells.size
        }
        function processRules3DWrapped() {
            cells = new Map<string, number[]>()

            // Assign each particle to a cell
            for (let i = 0; i < numParticles; i++) {
                const cellX = Math.floor(positionX[i] / cellSize)
                const cellY = Math.floor(positionY[i] / cellSize)
                const cellKey = `${cellX},${cellY}`
                if (!cells.has(cellKey)) {
                    cells.set(cellKey, [])
                }
                cells.get(cellKey)!.push(i)
            }

            const cellKeys = Array.from(cells.keys())
            const cellNeighbors = new Map()

            // Precompute neighboring cells for each cell
            const lastCellsX = Math.floor(gridWidth / cellSize)
            const lastCellsY = Math.floor(gridHeight / cellSize)
            for (let i = 0; i < cellKeys.length; i++) {
                const cellKey = cellKeys[i]
                const [cellX, cellY] = cellKey.split(',').map(Number)
                const neighbors = []

                for (let offsetY = -1; offsetY <= 1; offsetY++) {
                    for (let offsetX = -1; offsetX <= 1; offsetX++) {
                        let neighborX = cellX + offsetX
                        let neighborY = cellY + offsetY

                        if (neighborX < 0) neighborX = lastCellsX
                        else if (neighborX > lastCellsX) neighborX = 0
                        if (neighborY < 0) neighborY = lastCellsY
                        else if (neighborY > lastCellsY) neighborY = 0

                        const neighborKey = `${neighborX},${neighborY}`
                        if (cells.has(neighborKey)) {
                            neighbors.push(neighborKey)
                        }
                    }
                }
                cellNeighbors.set(cellKey, neighbors)
            }

            // Process each cell
            for (let i = 0; i < cellKeys.length; i++) {
                const cellKey = cellKeys[i]
                const particles = cells.get(cellKey)
                const neighbors = cellNeighbors.get(cellKey)

                // Process each particle in the cell
                for (let j = 0; j < particles!.length; j++) {
                    const indexA = particles![j]
                    const posXA = positionX[indexA]
                    const posYA = positionY[indexA]
                    const posZA = positionZ[indexA]

                    let velocityXSum = 0, velocityYSum = 0, velocityZSum = 0

                    // Process each neighboring cell
                    for (let k = 0; k < neighbors.length; k++) {
                        const neighborKey = neighbors[k]
                        const neighborParticles = cells.get(neighborKey)

                        // Process each particle in the neighboring cell
                        for (let l = 0; l < neighborParticles!.length; l++) {
                            const indexB = neighborParticles![l]
                            if (indexA === indexB) continue

                            let dx = positionX[indexB] - posXA
                            let dy = positionY[indexB] - posYA
                            let dz = positionZ[indexB] - posZA

                            // Apply wrapping for X direction
                            if (dx > gridWidth / 2) dx -= gridWidth
                            else if (dx < -gridWidth / 2) dx += gridWidth
                            // Apply wrapping for Y direction
                            if (dy > gridHeight / 2) dy -= gridHeight
                            else if (dy < -gridHeight / 2) dy += gridHeight

                            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

                            const colorA = colors[indexA]
                            const colorB = colors[indexB]
                            const colorMaxRadius = maxRadiusMatrix[colorA][colorB]

                            // Apply force if the particles are close enough
                            if (distance < colorMaxRadius) {
                                const force = getForce(rulesMatrix[colorA][colorB], minRadiusMatrix[colorA][colorB], colorMaxRadius, distance)

                                velocityXSum += dx / distance * force
                                velocityYSum += dy / distance * force
                                velocityZSum += dz / distance * force
                            }
                        }
                    }
                    // Update the velocity of the particle
                    velocityX[indexA] += velocityXSum / forceFactor
                    velocityY[indexA] += velocityYSum / forceFactor
                    velocityZ[indexA] += velocityZSum / forceFactor
                }
            }
            cellCount.value = cells.size
        }
        // -------------------------------------------------------------------------------------------------------------
        let updateParticles: () => void
        function updateParticles2D() {
            ctx!.clearRect(0, 0, canvasWidth, canvasHeight)
            for (let i = 0; i < numParticles; i++) {
                velocityX[i] *= frictionFactor
                velocityY[i] *= frictionFactor
                positionX[i] += velocityX[i]
                positionY[i] += velocityY[i]

                // Bounce off the walls
                if (isWallRepel) {
                    if (wallShape === 0) { // Rectangle Shape
                        if (positionX[i] > gridWidth || positionX[i] < 0) {
                            positionX[i] -= velocityX[i]
                            velocityX[i] *= -wallRepelForce
                        }
                        if (positionY[i] > gridHeight || positionY[i] < 0) {
                            positionY[i] -= velocityY[i]
                            velocityY[i] *= -wallRepelForce
                        }
                    }
                    else { // Circle Shape
                        const dx = positionX[i] - circleCenterX // X distance between the particle and the center of the circle
                        const dy = positionY[i] - circleCenterY // Y distance between the particle and the center of the circle
                        const distanceSquared = dx * dx + dy * dy // Square of the distance between the particle and the center of the circle

                        if (distanceSquared > circleRadius * circleRadius) {
                            positionX[i] -= velocityX[i]
                            positionY[i] -= velocityY[i]
                            velocityX[i] *= -wallRepelForce
                            velocityY[i] *= -wallRepelForce
                        }
                    }
                }
                // Apply wrapping for the walls
                else if (isWallWrap) {
                    if (positionX[i] > gridWidth) positionX[i] -= gridWidth
                    else if (positionX[i] < 0) positionX[i] += gridWidth
                    if (positionY[i] > gridHeight) positionY[i] -= gridHeight
                    else if (positionY[i] < 0) positionY[i] += gridHeight
                }

                drawParticle(positionX[i], positionY[i], 0, currentColors[colors[i]], particleSize)
            }
        }
        function updateParticles3D() {
            ctx!.clearRect(0, 0, canvasWidth, canvasHeight)
            for (let i = 0; i < numParticles; i++) {
                velocityX[i] *= frictionFactor
                velocityY[i] *= frictionFactor
                velocityZ[i] *= frictionFactor
                positionX[i] += velocityX[i]
                positionY[i] += velocityY[i]
                positionZ[i] += velocityZ[i]

                // Bounce off the walls
                if (isWallRepel) {
                    if (wallShape === 0) { // Rectangle Shape
                        if (positionX[i] > gridWidth || positionX[i] < 0) {
                            positionX[i] -= velocityX[i]
                            velocityX[i] *= -wallRepelForce
                        }
                        if (positionY[i] > gridHeight || positionY[i] < 0) {
                            positionY[i] -= velocityY[i]
                            velocityY[i] *= -wallRepelForce
                        }
                    }
                    else { // Circle Shape
                        const dx = positionX[i] - circleCenterX // X distance between the particle and the center of the circle
                        const dy = positionY[i] - circleCenterY // Y distance between the particle and the center of the circle
                        const distanceSquared = dx * dx + dy * dy // Square of the distance between the particle and the center of the circle

                        if (distanceSquared > circleRadius * circleRadius) {
                            positionX[i] -= velocityX[i]
                            positionY[i] -= velocityY[i]
                            velocityX[i] *= -wallRepelForce
                            velocityY[i] *= -wallRepelForce
                        }
                    }
                }
                // Apply wrapping for the walls
                else if (isWallWrap) {
                    if (positionX[i] > gridWidth) positionX[i] -= gridWidth
                    else if (positionX[i] < 0) positionX[i] += gridWidth
                    if (positionY[i] > gridHeight) positionY[i] -= gridHeight
                    else if (positionY[i] < 0) positionY[i] += gridHeight
                }

                // Bounce off the depth limit
                if (positionZ[i] > depthLimit) {
                    positionZ[i] = depthLimit
                } else if (positionZ[i] < 0) {
                    positionZ[i] -= velocityZ[i] // or positionZ[i] = 0
                    velocityZ[i] *= -wallRepelForce
                }

                drawParticle(positionX[i], positionY[i], positionZ[i], currentColors[colors[i]], particleSize)
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function centerView() {
            const centerX = canvasWidth / 2 / zoomFactor - gridOffsetX
            const centerY = canvasHeight / 2 / zoomFactor - gridOffsetY
            const offsetX = gridWidth / 2 - centerX
            const offsetY = gridHeight / 2 - centerY
            gridOffsetX -= offsetX
            gridOffsetY -= offsetY
            setShapesProperties()
        }
        function simpleDrawParticles() {
            ctx!.clearRect(0, 0, canvasWidth, canvasHeight)
            for (let i = 0; i < numParticles; i++) {
                drawParticle(positionX[i], positionY[i], positionZ[i], currentColors[colors[i]], particleSize)
            }
            if (hasGrid) drawGrid()
            if (hasCells || isBrushActive) assignParticlesToCells()
            if (hasCells) drawCells()
        }
        function drawGrid() {
            ctx!.beginPath()
            if (wallShape === 0) { // Rectangle Shape
                drawHorizontalLine(endGridX, startGridY) // Draw top line
                drawHorizontalLine(endGridX, endGridY) // Draw bottom line
                drawVerticalLine(startGridX, endGridY) // Draw left line
                drawVerticalLine(endGridX, endGridY) // Draw right line
            } else { // Circle Shape
                ctx!.arc((gridOffsetX + circleCenterX) * zoomFactor, (gridOffsetY + circleCenterY) * zoomFactor, circleRadius * zoomFactor + halfParticleSize, 0, Math.PI * 2)
            }
            ctx!.strokeStyle = 'rgba(32,32,38,1)'
            ctx!.lineWidth = 1
            ctx!.stroke()
        }
        function drawHorizontalLine(x: number, y: number) {
            ctx!.moveTo(startGridX, y)
            ctx!.lineTo(x, y)
        }
        function drawVerticalLine(x: number, y: number) {
            ctx!.moveTo(x, startGridY)
            ctx!.lineTo(x, y)
        }
        function drawBrush() {
            ctx!.beginPath()
            ctx!.arc(pointerX, pointerY, brushRadius * zoomFactor, 0, Math.PI * 2)
            ctx!.strokeStyle = 'rgb(23,37,84,0.4)'
            ctx!.lineWidth = 3
            ctx!.stroke()
        }
        function getParticlesInBrush() : number[] {
            // Detect cells within the brush radius
            const posX = (pointerX / zoomFactor) - gridOffsetX
            const posY = (pointerY / zoomFactor) - gridOffsetY
            const startCellX = Math.floor((posX - brushRadius) / cellSize)
            const startCellY = Math.floor((posY - brushRadius) / cellSize)
            const endCellX = Math.floor((posX + brushRadius) / cellSize)
            const endCellY = Math.floor((posY + brushRadius) / cellSize)

            const cellsInRadius = []
            for (let cellY = startCellY; cellY <= endCellY; cellY++) {
                for (let cellX = startCellX; cellX <= endCellX; cellX++) {
                    const cellKey = `${cellX},${cellY}`
                    if (cells.has(cellKey)) {
                        cellsInRadius.push(cellKey)
                    }
                }
            }
            // Detect particles within the brush radius
            const particlesInRadius: number[] = []
            for (let i = 0; i < cellsInRadius.length; i++) {
                const cellKey = cellsInRadius[i]
                const particles = cells.get(cellKey)

                for (let j = 0; j < particles!.length; j++) {
                    const index = particles![j]
                    const dx = positionX[index] - posX
                    const dy = positionY[index] - posY
                    if (dx * dx + dy * dy <= brushRadius * brushRadius) {
                        if (brushes.length > 0 && !brushes.includes(colors[index])) continue
                        particlesInRadius.push(index)
                    }
                }
            }
            return particlesInRadius
        }
        function eraseWithBrush() {
            // Skip if brush is outside walls
            if (isBrushOutsideWalls()) return

            // Remove particles within the brush radius
            removeParticleGroup(getParticlesInBrush())
        }
        function magnetWithBrush(magnetForce: number) {
            // Skip if brush is outside walls
            if (isBrushOutsideWalls()) return

            const posX = (pointerX / zoomFactor) - gridOffsetX
            const posY = (pointerY / zoomFactor) - gridOffsetY

            const particlesInRadius = getParticlesInBrush()
            // Attract particles within the brush radius
            for (let i = 0; i < particlesInRadius.length; i++) {
                const index = particlesInRadius[i]
                const dx = posX - positionX[index]
                const dy = posY - positionY[index]
                const distance = Math.sqrt(dx * dx + dy * dy)

                const force = getForce(magnetForce, 0, brushRadius, distance)

                velocityX[index] += dx / distance * force / forceFactor
                velocityY[index] += dy / distance * force / forceFactor
            }
        }
        function drawWithBrush() {
            // Skip if brush is outside walls
            if (isBrushOutsideWalls()) return

            const minZDepthRandomParticle = depthLimit * 0.2 // The minimum Z-depth for randomly placed particles, in percentage of the depthLimit
            const maxZDepthRandomParticle = depthLimit * 0.45 // The maximum Z-depth for randomly placed particles, in percentage of the depthLimit

            const newColors = new Int32Array(numParticles + brushIntensity)
            const newPositionX = new Float32Array(numParticles + brushIntensity)
            const newPositionY = new Float32Array(numParticles + brushIntensity)
            const newPositionZ = new Float32Array(numParticles + brushIntensity)
            const newVelocityX = new Float32Array(numParticles + brushIntensity).fill(0)
            const newVelocityY = new Float32Array(numParticles + brushIntensity).fill(0)
            const newVelocityZ = new Float32Array(numParticles + brushIntensity).fill(0)

            newColors.set(colors, 0)
            newPositionX.set(positionX, 0)
            newPositionY.set(positionY, 0)
            newPositionZ.set(positionZ, 0)
            newVelocityX.set(velocityX, 0)
            newVelocityY.set(velocityY, 0)
            newVelocityZ.set(velocityZ, 0)

            for (let i = 0; i < brushIntensity; i++) {
                while (true) {
                    const x = Math.random() * 2 * brushRadius - brushRadius // Random X position within the brush radius
                    const y = Math.random() * 2 * brushRadius - brushRadius // Random Y position within the brush radius

                    if (x * x + y * y <= brushRadius * brushRadius) {
                        const posX = (pointerX / zoomFactor) - gridOffsetX + x // Adjust the X position based on the grid offset and the random X position
                        const posY = (pointerY / zoomFactor) - gridOffsetY + y // Adjust the Y position based on the grid offset and the random Y position
                        if (isWallRepel || isWallWrap) {
                            if (wallShape === 0) { // Rectangle Shape
                                if (posX > gridWidth || posX < 0 || posY > gridHeight || posY < 0) {
                                    continue // Skip if the particle is outside the rectangle
                                }
                            } else { // Circle Shape
                                const dx = posX - circleCenterX // X distance between the particle and the center of the circle
                                const dy = posY - circleCenterY // Y distance between the particle and the center of the circle
                                const distanceSquared = dx * dx + dy * dy // Square of the distance between the particle and the center of the circle
                                if (distanceSquared > circleRadius * circleRadius) {
                                    continue // Skip if the particle is outside the circle
                                }
                            }
                        }
                        newPositionX[numParticles + i] = posX
                        newPositionY[numParticles + i] = posY
                        newPositionZ[numParticles + i] = Math.random() * (maxZDepthRandomParticle - minZDepthRandomParticle) + minZDepthRandomParticle

                        if (brushes.length > 0) newColors[numParticles + i] = brushes[Math.floor(Math.random() * brushes.length)]
                        else newColors[numParticles + i] = Math.floor(Math.random() * numColors)

                        break // Exit the loop if the particle is placed successfully and move to the next particle
                    }
                }
            }

            colors = newColors
            positionX = newPositionX
            positionY = newPositionY
            positionZ = newPositionZ
            velocityX = newVelocityX
            velocityY = newVelocityY
            velocityZ = newVelocityZ

            numParticles += brushIntensity
            particleLife.numParticles = numParticles
        }
        function isBrushOutsideWalls() {
            if (isWallRepel || isWallWrap) {
                const posX = (pointerX / zoomFactor) - gridOffsetX
                const posY = (pointerY / zoomFactor) - gridOffsetY
                if (wallShape === 0) { // Rectangle Shape
                    if (posX > gridWidth || posX < 0 || posY > gridHeight || posY < 0) {
                        return true
                    }
                } else { // Circle Shape
                    const dx = posX - circleCenterX // X distance between the particle and the center of the circle
                    const dy = posY - circleCenterY // Y distance between the particle and the center of the circle
                    const distanceSquared = dx * dx + dy * dy // Square of the distance between the particle and the center of the circle
                    if (distanceSquared > circleRadius * circleRadius) {
                        return true
                    }
                }
            }
            return false // Within the walls or no walls
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function setGridSizeWhenWrapped() { // Set the grid size when the walls are wrapped
            particleLife.gridWidth = gridWidth = cellSize * Math.round(gridWidth / cellSize) - 4
            particleLife.gridHeight = gridHeight = cellSize * Math.round(gridHeight / cellSize) - 4
        }
        function setShapesProperties() {
            // Set the half particle size
            halfParticleSize = particleSize * zoomFactor / 2

            // Set the rectangle grid properties
            startGridX = gridOffsetX * zoomFactor - halfParticleSize // Start X position of the grid minus half particle size
            startGridY = gridOffsetY * zoomFactor - halfParticleSize // Start Y position of the grid minus half particle size
            endGridX = gridOffsetX * zoomFactor + gridWidth * zoomFactor + halfParticleSize // End X position of the grid plus half particle size
            endGridY = gridOffsetY * zoomFactor + gridHeight * zoomFactor + halfParticleSize // End Y position of the grid plus half particle size

            // Set the circle grid properties
            circleRadius = gridHeight / 2
            circleCenterX = gridWidth / 2
            circleCenterY = circleRadius
        }
        function updateGridWidth(newWidth: number | Event) {
            if (typeof(newWidth) !== 'number') return // Prevent input event like unfocus
            if (particleLife.linkProportions) particleLife.gridHeight = gridHeight = Math.round(gridHeight * (newWidth / gridWidth))
            particleLife.gridWidth = gridWidth = newWidth
            if (isWallWrap) setGridSizeWhenWrapped()
            setShapesProperties()
            initParticles()
            if (!isRunning) simpleDrawParticles()
        }
        function updateGridHeight(newHeight: number | Event) {
            if (typeof(newHeight) !== 'number') return // Prevent input event like unfocus
            if (particleLife.linkProportions) particleLife.gridWidth = gridWidth = Math.round(gridWidth * (newHeight / gridHeight))
            particleLife.gridHeight = gridHeight = newHeight
            if (isWallWrap) setGridSizeWhenWrapped()
            setShapesProperties()
            initParticles()
            if (!isRunning) simpleDrawParticles()
        }
        function setGridSizeBasedOnScreen() {
            particleLife.gridWidth = gridWidth = Math.floor(canvasWidth * screenMultiplierForGridSize)
            particleLife.gridHeight = gridHeight = Math.floor(canvasHeight * screenMultiplierForGridSize)
            // zoomFactor = 1 / screenMultiplierForGridSize
            centerView()
        }
        function updateScreenMultiplier(multiplier: number) {
            screenMultiplierForGridSize = multiplier
            setGridSizeBasedOnScreen()
            if (isWallWrap) setGridSizeWhenWrapped()
            setShapesProperties()
            initParticles()
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function assignParticlesToCells() {
            cells = new Map<string, number[]>()
            for (let i = 0; i < numParticles; i++) {
                const cellX = Math.floor(positionX[i] / cellSize)
                const cellY = Math.floor(positionY[i] / cellSize)
                const cellKey = `${cellX},${cellY}`
                if (!cells.has(cellKey)) {
                    cells.set(cellKey, [])
                }
                cells.get(cellKey)!.push(i)
            }
        }
        function removeParticleGroup(particles: number[]) {
            const newSize = numParticles - particles.length
            const newColors = new Int32Array(newSize)
            const newPositionX = new Float32Array(newSize)
            const newPositionY = new Float32Array(newSize)
            const newPositionZ = new Float32Array(newSize)
            const newVelocityX = new Float32Array(newSize)
            const newVelocityY = new Float32Array(newSize)
            const newVelocityZ = new Float32Array(newSize)

            particles.sort((a: any, b: any) => a - b) // Sort the indexes in ascending order
            for (let i = 0, j = 0, k = 0; i < numParticles; i++) {
                if (k < particles.length && i === particles[k]) {
                    k++ // Skip the particle if it is within the brush radius
                } else {
                    newColors[j] = colors[i]
                    newPositionX[j] = positionX[i]
                    newPositionY[j] = positionY[i]
                    newPositionZ[j] = positionZ[i]
                    newVelocityX[j] = velocityX[i]
                    newVelocityY[j] = velocityY[i]
                    newVelocityZ[j] = velocityZ[i]
                    j++
                }
            }

            colors = newColors
            positionX = newPositionX
            positionY = newPositionY
            positionZ = newPositionZ
            velocityX = newVelocityX
            velocityY = newVelocityY
            velocityZ = newVelocityZ

            numParticles = newSize
            particleLife.numParticles = numParticles
        }
        function updateNumParticles(newNumParticles: number) {
            if (newNumParticles === numParticles) return // Skip if the number of particles is the same
            if (newNumParticles < numParticles) { // Remove particles
                colors = colors.slice(0, newNumParticles)
                positionX = positionX.slice(0, newNumParticles)
                positionY = positionY.slice(0, newNumParticles)
                positionZ = positionZ.slice(0, newNumParticles)
                velocityX = velocityX.slice(0, newNumParticles)
                velocityY = velocityY.slice(0, newNumParticles)
                velocityZ = velocityZ.slice(0, newNumParticles)
            } else { // Add particles
                const newColors = new Int32Array(newNumParticles)
                const newPositionX = new Float32Array(newNumParticles)
                const newPositionY = new Float32Array(newNumParticles)
                const newPositionZ = new Float32Array(newNumParticles)
                const newVelocityX = new Float32Array(newNumParticles).fill(0)
                const newVelocityY = new Float32Array(newNumParticles).fill(0)
                const newVelocityZ = new Float32Array(newNumParticles).fill(0)
                for (let i = 0; i < newNumParticles; i++) {
                    if (i < numParticles) {
                        newColors[i] = colors[i]
                        newPositionX[i] = positionX[i]
                        newPositionY[i] = positionY[i]
                        newPositionZ[i] = positionZ[i]
                        newVelocityX[i] = velocityX[i]
                        newVelocityY[i] = velocityY[i]
                        newVelocityZ[i] = velocityZ[i]
                    } else {
                        newColors[i] = Math.floor(Math.random() * numColors)
                        const newPositions = getRandomPositions()
                        newPositionX[i] = newPositions.x
                        newPositionY[i] = newPositions.y
                        newPositionZ[i] = newPositions.z
                    }
                }
                colors = newColors
                positionX = newPositionX
                positionY = newPositionY
                positionZ = newPositionZ
                velocityX = newVelocityX
                velocityY = newVelocityY
                velocityZ = newVelocityZ
            }
            numParticles = newNumParticles // Update the number of particles
            if (!isRunning) simpleDrawParticles() // Redraw the particles if the game is not running
        }
        function updateNumColors(newNumColors: number) {
            if (newNumColors === numColors) return // Skip if the number of colors is the same
            if (newNumColors < numColors) { // Remove colors
                removeFromMatrix(newNumColors)
                colors = colors.map((color) => color % newNumColors)
            } else { // Add colors
                addToMatrix(newNumColors)
                for (let i = 0; i < numParticles; i++) {
                    colors[i] = Math.floor(Math.random() * newNumColors)
                }
            }
            particleLife.currentMaxRadius = maxRadiusMatrix.reduce((max, row) => Math.max(max, ...row), -Infinity)

            numColors = newNumColors // Update the number of colors
            initColors() // Reinitialize the colors (currentColors)
            if (!isRunning) simpleDrawParticles() // Redraw the particles if the game is not running
        }
        function addToMatrix(newNumColors: number) {
            const newRulesMatrix: number[][] = []
            const newMinRadiusMatrix: number[][] = []
            const newMaxRadiusMatrix: number[][] = []

            for (let i = 0; i < newNumColors; i++) {
                if (i < numColors) { // Copy the existing rules for the existing colors
                    newRulesMatrix.push(rulesMatrix[i])
                    newMinRadiusMatrix.push(minRadiusMatrix[i])
                    newMaxRadiusMatrix.push(maxRadiusMatrix[i])
                } else { // Set new rules for the new colors
                    newRulesMatrix.push([])
                    newMinRadiusMatrix.push([])
                    newMaxRadiusMatrix.push([])
                }
                for (let j = 0; j < newNumColors; j++) {
                    if (i < numColors && j < numColors) { // Copy the existing rules for the existing colors
                        newRulesMatrix[i][j] = rulesMatrix[i][j]
                        newMinRadiusMatrix[i][j] = minRadiusMatrix[i][j]
                        newMaxRadiusMatrix[i][j] = maxRadiusMatrix[i][j]
                    } else { // Set new rules for the new colors
                        newRulesMatrix[i][j] = Number((Math.random() * 2 - 1).toFixed(4)) // Set a random rule between -1 and 1

                        // Set a random min radius between the range
                        const minRandom = Math.floor(Math.random() * (particleLife.minRadiusRange[1] - particleLife.minRadiusRange[0] + 1) + particleLife.minRadiusRange[0])
                        newMinRadiusMatrix[i][j] = minRandom
                        if (minRandom > currentMinRadius) currentMinRadius = minRandom

                        // Set a random max radius between the range
                        const min = particleLife.maxRadiusRange[0]
                        const max = particleLife.maxRadiusRange[1]
                        const maxRandom = Math.floor(Math.random() * (max - min + 1) + min)
                        newMaxRadiusMatrix[i][j] = maxRandom
                    }
                }
            }
            setRulesMatrix(newRulesMatrix)
            setMinRadiusMatrix(newMinRadiusMatrix)
            setMaxRadiusMatrix(newMaxRadiusMatrix)

            console.table(maxRadiusMatrix)
        }
        function removeFromMatrix(newNumColors: number) {
            const newRulesMatrix: number[][] = []
            const newMinRadiusMatrix: number[][] = []
            const newMaxRadiusMatrix: number[][] = []

            for (let i = 0; i < newNumColors; i++) {
                newRulesMatrix.push(rulesMatrix[i].slice(0, newNumColors)) // Truncate the row to the new size
                newMinRadiusMatrix.push(minRadiusMatrix[i].slice(0, newNumColors)) // Truncate the row to the new size
                newMaxRadiusMatrix.push(maxRadiusMatrix[i].slice(0, newNumColors)) // Truncate the row to the new size
            }

            setRulesMatrix(newRulesMatrix)
            setMinRadiusMatrix(newMinRadiusMatrix)
            setMaxRadiusMatrix(newMaxRadiusMatrix)

            console.table(maxRadiusMatrix)
        }
        function setRulesMatrix(newRules: number[][]) {
            rulesMatrix = newRules
            particleLife.rulesMatrix = rulesMatrix
        }
        function setMaxRadiusMatrix(newMaxRadius: number[][]) {
            maxRadiusMatrix = newMaxRadius
            particleLife.maxRadiusMatrix = maxRadiusMatrix
        }
        function setMinRadiusMatrix(newMinRadius: number[][]) {
            minRadiusMatrix = newMinRadius
            particleLife.minRadiusMatrix = minRadiusMatrix
        }
        function updateRulesMatrixValue(x: number, y: number, value: number) {
            particleLife.rulesMatrix[x][y] = value
            rulesMatrix[x][y] = value
        }
        function updateMinMatrixValue(x: number, y: number, value: number) {
            particleLife.minRadiusMatrix[x][y] = value
            minRadiusMatrix[x][y] = value
            if (value > particleLife.maxRadiusMatrix[x][y]) {
                particleLife.maxRadiusMatrix[x][y] = value
                maxRadiusMatrix[x][y] = value
                particleLife.currentMaxRadius = maxRadiusMatrix.reduce((max, row) => Math.max(max, ...row), -Infinity)
            }
            currentMinRadius = minRadiusMatrix.reduce((min, row) => Math.min(min, ...row), Infinity)
        }
        function updateMaxMatrixValue(x: number, y: number, value: number) {
            particleLife.maxRadiusMatrix[x][y] = value
            maxRadiusMatrix[x][y] = value
            if (value < particleLife.minRadiusMatrix[x][y]) {
                particleLife.minRadiusMatrix[x][y] = value
                minRadiusMatrix[x][y] = value
                currentMinRadius = minRadiusMatrix.reduce((min, row) => Math.min(min, ...row), Infinity)
            }
            particleLife.currentMaxRadius = maxRadiusMatrix.reduce((max, row) => Math.max(max, ...row), -Infinity)
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function watchAndDraw(effect: any, callback: any) {
            watch(effect, (value) => {
                callback(value);
                if (!isRunning) simpleDrawParticles();
            });
        }
        watch(() => particleLife.numParticles, (value) => updateNumParticles(value))
        watch(() => particleLife.numColors, (value) => updateNumColors(value))
        watch(() => particleLife.depthLimit, (value: number) => depthLimit = value)
        watch(() => particleLife.brushes, (value: number[]) => brushes = value)
        watch(() => particleLife.brushRadius, (value) => brushRadius = value)
        watch(() => particleLife.brushIntensity, (value) => brushIntensity = value)
        watch(() => particleLife.brushType, (value: number) => brushType = value)
        watch(() => particleLife.attractForce, (value: number) => attractForce = value)
        watch(() => particleLife.repulseForce, (value: number) => repulseForce = -Math.abs(value))
        watchAndDraw(() => particleLife.is3D, () => setAlgorithms())
        watchAndDraw(() => particleLife.isRunning, (value: boolean) => isRunning = value)
        watchAndDraw(() => particleLife.isBrushActive, (value: boolean) => isBrushActive = value)
        watchAndDraw(() => particleLife.particleSize, (value: number) => particleSize = value)
        watchAndDraw(() => particleLife.isWallRepel, (value: boolean) => {
            isWallRepel = value
            if (isWallRepel) particleLife.isWallWrap = false
            particleLife.hasGrid = isWallRepel || isWallWrap
        })
        watchAndDraw(() => particleLife.isWallWrap, (value: boolean) => {
            isWallWrap = value
            if (isWallWrap) {
                particleLife.isWallRepel = false
                particleLife.wallShape = 0
                setGridSizeWhenWrapped()
                setShapesProperties()
            }
            particleLife.hasGrid = isWallRepel || isWallWrap
            setAlgorithms()
        })
        watchAndDraw(() => particleLife.wallShape, (value: number) => {
            wallShape = value
            initParticles()
        })
        watchAndDraw(() => particleLife.cellShape, (value: number) => cellShape = value)
        watchAndDraw(() => particleLife.screenMultiplierForGridSize, (value: number) => updateScreenMultiplier(value))
        watchAndDraw(() => particleLife.hasGrid, (value: boolean) => hasGrid = value)
        watchAndDraw(() => particleLife.hasCells, (value: boolean) => hasCells = value)
        watchAndDraw(() => particleLife.isCellFollow, (value: boolean) => isCellFollow = value)
        watchAndDraw(() => particleLife.isCircle, (value: boolean) => isCircle = value)
        watchAndDraw(() => particleLife.hasDepthSize, (value: boolean) => hasDepthSize = value)
        watchAndDraw(() => particleLife.hasDepthOpacity, (value: boolean) => hasDepthOpacity = value)
        watchAndDraw(() => particleLife.minOpacity, (value: number) => minOpacity = value)
        watchAndDraw(() => particleLife.maxOpacity, (value: number) => maxOpacity = value)
        watchAndDraw(() => particleLife.cellGroupSize, (value: number) => cellGroupSize = value)
        watchAndDraw(() => particleLife.repel, (value: number) => repel = value)
        watchAndDraw(() => particleLife.forceFactor, (value: number) => forceFactor = value)
        watchAndDraw(() => particleLife.frictionFactor, (value: number) => frictionFactor = value)
        watchAndDraw(() => particleLife.cellSizeFactor, (value: number) => {
            cellSizeFactor = value
            cellSize = currentMaxRadius * cellSizeFactor // Update the cell size
        })
        watchAndDraw(() => particleLife.currentMaxRadius, (value: number) => {
            currentMaxRadius = value
            cellSize = currentMaxRadius * cellSizeFactor // Update the cell size
            if (isWallWrap) {
                setGridSizeWhenWrapped()
                setShapesProperties()
            }
        })
        watch(() => particleLife.isLockedPointer, (value) => {
            const sidebarLeftElement = document.getElementById('sidebarLeft');
            if (sidebarLeftElement) {
                if (value) {
                    sidebarLeftElement.classList.add('force-hover-effect');
                } else {
                    sidebarLeftElement.classList.remove('force-hover-effect');
                }
            }
        })
        // -------------------------------------------------------------------------------------------------------------
        onUnmounted(() => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
                animationFrameId = null
            }
            particleLife.$reset()
        })

        return {
            lifeCanvas, particleLife, toggleFullscreen, isFullscreen,
            fps, cellCount, executionTime, step, newRandomRulesMatrix, handleZoom, updateGridWidth, updateGridHeight,
            updateRulesMatrixValue, updateMinMatrixValue, updateMaxMatrixValue, regenerateLife
        }
    }
})
</script>

<style scoped>
canvas {
    background: black;
}
.scrollableArea {
    scrollbar-color: #a5a5a5 transparent;
    scrollbar-width: none;
}
/*
.scrollableArea::-webkit-scrollbar {
    width: 8px;
}

.scrollableArea::-webkit-scrollbar-track {
    background-color: #e4e4e4;
    border-radius: 100px;
}

.scrollableArea::-webkit-scrollbar-thumb {
    background-color: #d4aa70;
    border-radius: 100px;
}
*/

</style>

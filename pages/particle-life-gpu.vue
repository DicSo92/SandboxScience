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
                            <h1 font-800 text-lg tracking-widest class="text-[#dff6f3] drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">Particle Life (GPU)</h1>
                        </div>
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
                                        :min="16" :max="1048576" :step="16" v-model="particleLife.numParticles">
                            </RangeInput>
                            <RangeInput input label="Color Number"
                                        tooltip="Specify the number of particle colors. <br> Each color interacts with all others, with distinct forces and interaction ranges."
                                        :min="1" :max="16" :step="1" v-model="particleLife.numColors" mt-2>
                            </RangeInput>
                            <div mb-2>
                                <WallStateSelection :store="particleLife" />
                            </div>
                            <div flex items-center>
                                <p class="w-2/3 text-2sm mt-1">
                                    Rectangle Size
                                    <TooltipInfo container="#mainContainer" tooltip="Adjust the size of the rectangular area where particles are contained." />
                                </p>
                                <Input label="x" v-model="particleLife.simWidth" @change="updateSimWidth" mr-2 />
                                <Input label="y" v-model="particleLife.simHeight" @change="updateSimHeight" mr-2 />
                                <button type="button" btn rounded-full p2 flex items-center bg="zinc-900 hover:#212121" @click="particleLife.linkProportions = !particleLife.linkProportions">
                                    <span :class="particleLife.linkProportions ? 'i-tabler-link' : 'i-tabler-unlink'" text-sm></span>
                                </button>
                            </div>
                            <ToggleSwitch inactive-label="BruteForce" label="SpatialHash" colorful-label v-model="particleLife.useSpatialHash" />
                            <ToggleSwitch label="Show Edges Mirrors" colorful-label v-model="particleLife.isMirrorWrap" />
                            <ToggleSwitch label="Show Infinite Mirrors" colorful-label v-model="particleLife.isInfiniteMirrorWrap" />
                            <div flex>
                                <SelectButton :id="5" label="Cross 5" v-model="particleLife.mirrorWrapCount" :disabled="!particleLife.isMirrorWrap" mr-2 />
                                <SelectButton :id="9" label="3x3" v-model="particleLife.mirrorWrapCount" :disabled="!particleLife.isMirrorWrap" />
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
                                              :min="0" :max="200" :step="1" v-model="particleLife.minRadiusRange">
                            </RangeInputMinMax>
                            <RangeInputMinMax input label="Max. Radius"
                                              tooltip="Set the range for generating maximum interaction radii. <br> This determines the range of possible values for the maximum interaction distance between particles."
                                              :min="particleLife.minRadiusRange[1]" :max="400" :step="1" v-model="particleLife.maxRadiusRange">
                            </RangeInputMinMax>
                        </Collapse>
                        <Collapse label="Graphics Settings" icon="i-tabler-photo-cog" mt-2>
                            <RangeInput input label="Particle Size"
                                        tooltip="Controls the overall size of the particles in the simulation, allowing you to make them larger or smaller depending on your preference. This setting does not impact performance."
                                        :min="1" :max="20" :step="1" v-model="particleLife.particleSize" mt-2>
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
        <canvas ref="canvasRef" id="canvasRef" w-full h-full></canvas>
        <div absolute top-0 right-0 flex flex-col items-end text-right pointer-events-none>
            <div flex items-center text-start text-xs pl-4 pr-1 bg-gray-800 rounded-bl-xl style="padding-bottom: 1px; opacity: 75%">
                <div flex>Fps: <div ml-1 min-w-8>{{ fps }}</div></div>
                <div flex ml-3>Process: <div ml-1 min-w-7>{{ Math.round(executionTime) }}</div></div>
            </div>
            <BrushSettings :store="particleLife" pointer-events-auto mt-2 mr-1 />
        </div>
        <div fixed z-10 bottom-2 flex justify-center items-end class="faded-hover-effect left-1/2 transform -translate-x-1/2">
            <button type="button" name="Randomize" aria-label="Randomize" btn p2 rounded-full mx-1 flex items-center bg="#094F5D hover:#0B5F6F" @click="regenerateLife">
                <span i-game-icons-perspective-dice-six-faces-random></span>
            </button>
<!--            3D-->
            <button type="button" name="Zoom Out" aria-label="Zoom Out" btn p2 rounded-full mx-1 flex items-center bg="#212121 hover:#333333" @click="handleZoom(-1, canvasRef!.clientWidth / 2, canvasRef!.clientHeight / 2)">
                <span i-tabler-zoom-out></span>
            </button>
            <button type="button" name="Play/Pause" aria-label="Play/Pause" btn p3 rounded-full mx-1 flex items-center bg="#212121 hover:#333333" @click="particleLife.isRunning = !particleLife.isRunning">
                <span text-xl :class="particleLife.isRunning ? 'i-tabler-player-pause-filled' : 'i-tabler-player-play-filled'"></span>
            </button>
            <button type="button" name="Step" aria-label="Step" btn p2 rounded-full mx-1 flex items-center bg="#212121 hover:#333333" :disabled="particleLife.isRunning" @click="step">
                <span i-tabler-player-skip-forward-filled></span>
            </button>
            <button type="button" name="Zoom In" aria-label="Zoom In" btn p2 rounded-full mx-1 flex items-center bg="#212121 hover:#333333" @click="handleZoom(1, canvasRef!.clientWidth / 2, canvasRef!.clientHeight / 2)">
                <span i-tabler-zoom-in></span>
            </button>
            <button type="button" name="Toggle Fullscreen" aria-label="Toggle Fullscreen" btn p2 rounded-full mx-1 flex items-center bg="#212121 hover:#333333" @click="toggleFullscreen">
                <span :class="isFullscreen ? 'i-tabler-maximize-off' : 'i-tabler-maximize'"></span>
            </button>
        </div>
    </section>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import WallStateSelection from "~/components/particle-life/WallStateSelection.vue";
import MatrixSettings from "~/components/particle-life/MatrixSettings.vue";
import BrushSettings from "~/components/particle-life/BrushSettings.vue";

import binFillSizeShaderCode from 'assets/particle-life-gpu/shaders/binFillSize.wgsl?raw';
import binPrefixSumShaderCode from 'assets/particle-life-gpu/shaders/binPrefixSum.wgsl?raw';
import particleSortShaderCode from 'assets/particle-life-gpu/shaders/particleSort.wgsl?raw';
import particleComputeForcesShaderCode from 'assets/particle-life-gpu/shaders/particleComputeForces.wgsl?raw';
import particleAdvanceShaderCode from 'assets/particle-life-gpu/shaders/particleAdvance.wgsl?raw';

import vertexShaderCode from 'assets/particle-life-gpu/shaders/render_vertex.wgsl?raw';
import fragmentShaderCode from 'assets/particle-life-gpu/shaders/render_fragment.wgsl?raw';
import offscreenShaderCode from 'assets/particle-life-gpu/shaders/offscreen_render_vertex.wgsl?raw';
import infiniteVertexShaderCode from 'assets/particle-life-gpu/shaders/infinite_compositor_vertex.wgsl?raw';
import infiniteFragmentShaderCode from 'assets/particle-life-gpu/shaders/infinite_compositor_fragment.wgsl?raw';
import mirrorVertexShaderCode from 'assets/particle-life-gpu/shaders/mirror_compositor_vertex.wgsl?raw';
import mirrorFragmentShaderCode from 'assets/particle-life-gpu/shaders/mirror_compositor_fragment.wgsl?raw';

export default defineComponent({
    name: 'ParticleLifeGpu',
    components: {BrushSettings, MatrixSettings, WallStateSelection},
    setup() {
        definePageMeta({
            layout: 'life',
            hideNavBar: true
        })
        // Define refs and variables
        const mainContainer = ref<HTMLElement | null>(null)
        const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(mainContainer)
        const particleLife = useParticleLifeGPUStore()
        const fps = useFps()
        const executionTime = ref<number>(0)
        const canvasRef = ref<HTMLCanvasElement | null>(null)
        let ctx: GPUCanvasContext
        let animationFrameId: number | null = null
        let lastFrameTime: number = performance.now()
        let isRunning: boolean = particleLife.isRunning
        let isUpdatingParticles: boolean = false // Flag to prevent multiple additions at once
        let smoothedDeltaTime: number = 0.016 // Initial value (1/60s)
        let CANVAS_WIDTH: number = 0
        let CANVAS_HEIGHT: number = 0
        let SIM_WIDTH: number = 0
        let SIM_HEIGHT: number = 0
        let CELL_SIZE: number = 0
        let SPATIAL_HASH_TABLE_SIZE: number = 0
        let baseSimWidth: number = 0
        let baseSimHeight: number = 0

        // Define color list and rules matrix for the particles
        let rulesMatrix: number[][] = [] // Rules matrix for each color
        let maxRadiusMatrix: number[][] = [] // Max radius matrix for each color
        let minRadiusMatrix: number[][] = [] // Min radius matrix for each color
        let currentMaxRadius: number = 0 // Max value between all colors max radius (for cell size)

        // Define the simulation properties
        let positions: Float32Array // Particle positions
        let velocities: Float32Array // Particle velocities
        let types: Uint32Array // Particle types (colors)
        let colors: Float32Array // Particle colors

        // Define the properties for dragging and zooming
        let zoomFactor: number = 1.0
        let cameraCenter = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
        let cameraScaleX: number = 1.0 // Scale factor for X axis
        let cameraScaleY: number = 1.0 // Scale factor for Y axis
        let isDragging: boolean = false // Flag to check if the mouse is being dragged
        let lastPointerX: number = 0 // For dragging
        let lastPointerY: number = 0 // For dragging
        let pointerX: number = 0 // Pointer X
        let pointerY: number = 0 // Pointer Y
        let cameraChanged: boolean = true

        // Define variables for the simulation
        let repel: number = particleLife.repel // Repel force between particles
        let forceFactor: number = particleLife.forceFactor // Decrease will increase the impact of the force on the velocity (the higher the value, the slower the particles will move) (can't be 0)
        let frictionFactor: number = particleLife.frictionFactor // Slow down the particles (0 to 1, where 1 is no friction)
        let NUM_PARTICLES: number = particleLife.numParticles
        let PARTICLE_SIZE: number = particleLife.particleSize
        let NUM_TYPES: number = particleLife.numColors
        let isWallRepel: boolean = particleLife.isWallRepel // Enable walls X and Y for the particles
        let isWallWrap: boolean = particleLife.isWallWrap // Enable wrapping for the particles
        let isMirrorWrap: boolean = particleLife.isMirrorWrap // Enable mirroring for the particles (only if isWallWrap is true)
        let isInfiniteMirrorWrap: boolean = particleLife.isInfiniteMirrorWrap // Enable infinite wrapping for the particles (only if isWallWrap is true)
        let mirrorWrapCount: number = particleLife.mirrorWrapCount // Number of mirrors to render if isMirrorWrap is true (5 or 9)
        let useSpatialHash: boolean = particleLife.useSpatialHash // Use spatial hash or brute force

        // Define the GPU device, pipelines, and bind groups
        let device: GPUDevice
        // let bruteForceComputePipeline: GPUComputePipeline

        // Define the buffers
        let currentPositionBuffer: GPUBuffer | undefined
        let nextPositionBuffer: GPUBuffer | undefined
        let velocityBuffer: GPUBuffer | undefined
        let typeBuffer: GPUBuffer | undefined
        let typeBufferPacked: GPUBuffer | undefined // Packed type buffer for compute shader
        let colorBuffer: GPUBuffer | undefined
        let deltaTimeBuffer: GPUBuffer | undefined
        let cameraBuffer: GPUBuffer | undefined
        let interactionMatrixBuffer: GPUBuffer | undefined
        let simOptionsBuffer: GPUBuffer | undefined
        let particleHashesBuffer: GPUBuffer | undefined
        let cellHeadsBuffer: GPUBuffer | undefined
        let particleNextIndicesBuffer: GPUBuffer | undefined

        let binOffsetBuffer: GPUBuffer | undefined
        let binOffsetTempBuffer: GPUBuffer | undefined
        let particleBuffer: GPUBuffer | undefined
        let particleTempBuffer: GPUBuffer | undefined
        let binPrefixSumStepSizeBuffer: GPUBuffer | undefined

        let offscreenTexture: GPUTexture | undefined
        let offscreenTextureView: GPUTextureView
        let offscreenSampler: GPUSampler
        let renderOffscreenPipeline: GPURenderPipeline
        let renderMirrorPipeline: GPURenderPipeline
        let renderInfinitePipeline: GPURenderPipeline
        let renderPipeline: GPURenderPipeline

        let binClearSizePipeline: GPUComputePipeline
        let binFillSizePipeline: GPUComputePipeline
        let binPrefixSumPipeline: GPUComputePipeline
        let particleSortClearSizePipeline: GPUComputePipeline
        let particleSortPipeline: GPUComputePipeline
        let particleComputeForcesPipeline: GPUComputePipeline
        let particleAdvancePipeline: GPUComputePipeline

        let particleBufferReadOnlyBindGroup: GPUBindGroup
        let binFillSizeBindGroup: GPUBindGroup
        let binPrefixSumBindGroup: GPUBindGroup[] = []
        let particleSortBindGroup: GPUBindGroup
        let particleComputeForcesBindGroup: GPUBindGroup
        let particleBufferBindGroup: GPUBindGroup
        let simOptionsBindGroup: GPUBindGroup
        let deltaTimeBindGroup: GPUBindGroup
        let cameraBindGroup: GPUBindGroup
        let offscreenTextureBindGroup: GPUBindGroup

        let particleBufferBindGroupLayout: GPUBindGroupLayout
        let binPrefixSumBindGroupLayout: GPUBindGroupLayout
        let particleBufferReadOnlyBindGroupLayout: GPUBindGroupLayout
        let binFillSizeBindGroupLayout: GPUBindGroupLayout
        let particleSortBindGroupLayout: GPUBindGroupLayout
        let particleComputeForcesBindGroupLayout: GPUBindGroupLayout
        let simOptionsBindGroupLayout: GPUBindGroupLayout
        let deltaTimeBindGroupLayout: GPUBindGroupLayout
        let cameraBindGroupLayout: GPUBindGroupLayout
        let offscreenTextureBindGroupLayout: GPUBindGroupLayout

        let binCount: number = 0
        let prefixSumIterations: number = 0

        onMounted(async () => {
            await initWebGPU()
            handleResize()
            setSimSizeBasedOnScreen()
            initLife()

            useEventListener('resize', handleResize)
            useEventListener(canvasRef.value, ['mousedown'], (e) => {
                lastPointerX = e.x - canvasRef.value!.getBoundingClientRect().left
                lastPointerY = e.y - canvasRef.value!.getBoundingClientRect().top
            })
            useEventListener(canvasRef.value, ['mousemove'], (e) => {
                pointerX = e.x - canvasRef.value!.getBoundingClientRect().left
                pointerY = e.y - canvasRef.value!.getBoundingClientRect().top

                if (e.buttons > 0) { // if mouse is pressed
                    if (particleLife.isLockedPointer) return // Prevent canvas dragging if the pointer is locked
                    isDragging = true
                    if (e.buttons === 1) { // if primary button is pressed (left click)
                        handleMove()
                    }
                }
                else if (e.buttons === 0) {
                    isDragging = false
                }
            })

            useEventListener(canvasRef.value, 'wheel', (e) => {
                if (e.deltaY < 0) { // Zoom in
                    handleZoom(1, pointerX, pointerY)
                } else { // Zoom out
                    handleZoom(-1, pointerX, pointerY)
                }
            })
        })
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function handleResize() {
            CANVAS_WIDTH = canvasRef.value!.width = canvasRef.value!.clientWidth
            CANVAS_HEIGHT = canvasRef.value!.height = canvasRef.value!.clientHeight
            updateCameraScaleFactors()
            cameraChanged = true
        }
        function updateCameraScaleFactors() {
            cameraScaleY = zoomFactor * 2.0 / SIM_HEIGHT
            cameraScaleX = cameraScaleY / (CANVAS_WIDTH / CANVAS_HEIGHT)
        }
        function setSimSizeBasedOnScreen() {
            particleLife.simWidth = SIM_WIDTH = baseSimWidth = CANVAS_WIDTH
            particleLife.simHeight = SIM_HEIGHT = baseSimHeight = CANVAS_HEIGHT
            updateCameraScaleFactors()
            updateOffscreenMirrorResources()
        }
        function setSimSizeWhenWrapped() { // Set the grid size when the walls are wrapped
            if (!useSpatialHash) return
            particleLife.simWidth = SIM_WIDTH = CELL_SIZE * Math.round(baseSimWidth / CELL_SIZE)
            particleLife.simHeight = SIM_HEIGHT = CELL_SIZE * Math.round(baseSimHeight / CELL_SIZE)
            updateCameraScaleFactors()
            updateOffscreenMirrorResources()
        }
        function centerView() {
            cameraCenter = { x: SIM_WIDTH / 2, y: SIM_HEIGHT / 2 }
        }
        function handleMove() {
            if (isDragging) {
                const dx = pointerX - lastPointerX
                const dy = pointerY - lastPointerY
                cameraCenter.x -= dx / (cameraScaleX * CANVAS_WIDTH * 0.5)
                cameraCenter.y -= dy / (cameraScaleY * CANVAS_HEIGHT * 0.5)
                lastPointerX = pointerX
                lastPointerY = pointerY
                cameraChanged = true
            }
        }
        function handleZoom(delta: number, x: number, y: number) {
            const mouseClipX = (x / CANVAS_WIDTH) * 2 - 1
            const mouseClipY = (y / CANVAS_HEIGHT) * 2 - 1

            const worldXBefore = cameraCenter.x + mouseClipX / cameraScaleX
            const worldYBefore = cameraCenter.y + mouseClipY / cameraScaleY

            const zoomIntensity = 0.1
            const zoomDelta = delta * zoomIntensity
            zoomFactor = Math.max(0.1, Math.min(8.0, zoomFactor * (1 + zoomDelta)))

            updateCameraScaleFactors()

            const worldXAfter = cameraCenter.x + mouseClipX / cameraScaleX
            const worldYAfter = cameraCenter.y + mouseClipY / cameraScaleY

            cameraCenter.x += worldXBefore - worldXAfter
            cameraCenter.y += worldYBefore - worldYAfter
            cameraChanged = true
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const initWebGPU = async () => {
            const adapter = await navigator.gpu.requestAdapter()
            if (!adapter) throw new Error("WebGPU adapter not found")
            device = await adapter.requestDevice()
            ctx = canvasRef.value!.getContext('webgpu')!
            ctx.configure({
                device,
                format: navigator.gpu.getPreferredCanvasFormat(),
                alphaMode: 'opaque'
            })
        }
        const initLife = () => {
            setRulesMatrix(makeRandomRulesMatrix())
            setMinRadiusMatrix(makeRandomMinRadiusMatrix())
            setMaxRadiusMatrix(makeRandomMaxRadiusMatrix())
            // setRulesMatrix([[-0.2758, -0.9341, -0.7292, -0.2024, -0.4367, -0.4714, -0.8962],[0.3548, -0.4365, -0.5117, -0.3945, -0.7828, 0.7885, 0.4696],[-0.9114, -0.8742, -0.5724, 0.1277, 0.3471, 0.3468, -0.6377],[0.3619, 0.6267, -0.6251, -0.1823, -0.285, -0.7255, 0.4615],[-0.2717, 0.9975, -0.4783, -0.9001, -0.2176, -0.9916, -0.4428],[-0.133, -0.342, -0.5631, 0.1238, -0.2723, -0.7484, 0.8461],[0.571, -0.7669, 0.0851, 0.5078, 0.8143, -0.7627, 0.7893]])
            // setMinRadiusMatrix([[25, 39, 37, 31, 31, 40, 30],[33, 27, 37, 33, 40, 33, 40],[26, 31, 25, 30, 32, 34, 39],[33, 27, 33, 39, 34, 25, 38],[28, 32, 31, 30, 40, 37, 30],[39, 39, 38, 35, 25, 31, 40],[33, 36, 29, 35, 30, 25, 40]])
            // setMaxRadiusMatrix([[65, 72, 80, 66, 72, 67, 79],[69, 61, 75, 73, 69, 70, 73],[80, 69, 71, 74, 67, 62, 61],[73, 79, 70, 70, 70, 72, 79],[67, 65, 74, 76, 64, 77, 71],[61, 68, 72, 64, 69, 64, 79],[72, 68, 77, 74, 63, 70, 75]])
            // particleLife.currentMaxRadius = 80

            console.log("Rules Matrix:", rulesMatrix);
            console.log("Min Radius Matrix:", minRadiusMatrix);
            console.log("Max Radius Matrix:", maxRadiusMatrix);

            currentMaxRadius = particleLife.currentMaxRadius // Ensure this is set before creating buffers
            CELL_SIZE = currentMaxRadius // Ensure CELL_SIZE is set before creating buffers
            SPATIAL_HASH_TABLE_SIZE = Math.pow(2, Math.ceil(Math.log2(NUM_PARTICLES))) // Ensure SPATIAL_HASH_TABLE_SIZE is a power of 2

            updateCameraScaleFactors()
            if (isWallWrap) setSimSizeWhenWrapped()
            centerView()

            initColors()
            initParticles()
            createBuffers()
            createBindGroupLayouts()
            createPipelines()
            createBindGroups()

            if (!isRunning) step() // Run a step if not running to initialize the simulation

            lastFrameTime = performance.now()
            animationFrameId = requestAnimationFrame(frame)
        }
        const regenerateLife = async () => {
            cancelAnimationLoop()
            destroyPipelinesAndBindGroups()
            await destroyBuffers()
            initLife()
        }
        const step = () => {
            const encoder = device.createCommandEncoder()
            if (useSpatialHash) computeBinning(encoder)
            else computeBruteForce(encoder)
            renderParticles(encoder)
            device.queue.submit([encoder.finish()])
        }
        const frame = () => {
            const startExecutionTime = performance.now()

            if (isRunning) {
                handleDeltaTime(startExecutionTime)
                step()
            } else {
                const encoder = device.createCommandEncoder()
                renderParticles(encoder)
                device.queue.submit([encoder.finish()])
            }
            // device.queue.onSubmittedWorkDone().then(() => executionTime.value = performance.now() - startExecutionTime) // Approximate execution time of the GPU commands
            animationFrameId = requestAnimationFrame(frame)
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const handleDeltaTime = (startExecutionTime: number) => {
            const deltaTime = Math.min((startExecutionTime - lastFrameTime) / 1000, 0.1) // Cap deltaTime to avoid spikes
            lastFrameTime = startExecutionTime
            const lastSmoothedDeltaTime = smoothedDeltaTime
            smoothedDeltaTime = smoothedDeltaTime * (1 - 0.01) + deltaTime * 0.01 // Smooth the delta time

            // Only update the delta time buffer if it has changed significantly
            if (Math.round(lastSmoothedDeltaTime * 1000) !== Math.round(smoothedDeltaTime * 1000)) {
                // console.log(`Delta time changed: ${smoothedDeltaTime.toFixed(3)}`)
                device.queue.writeBuffer(deltaTimeBuffer!, 0, new Float32Array([smoothedDeltaTime]))
            }
        }
        const computeBruteForce = (encoder: GPUCommandEncoder) => {
            console.log("Computing forces using brute force method")
        }
        const renderParticles = (encoder: GPUCommandEncoder) => {
            if (cameraChanged) {
                device.queue.writeBuffer(cameraBuffer!, 0, new Float32Array([
                    cameraCenter.x, cameraCenter.y, cameraScaleX, cameraScaleY
                ]))
                cameraChanged = false
            }

            if (isMirrorWrap || isInfiniteMirrorWrap) {
                const renderOffscreenPass = encoder.beginRenderPass({
                    colorAttachments: [{
                        view: offscreenTextureView,
                        loadOp: 'clear',
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        storeOp: 'store',
                    }],
                })
                renderOffscreenPass.setBindGroup(0, particleBufferReadOnlyBindGroup)
                renderOffscreenPass.setBindGroup(1, simOptionsBindGroup)
                renderOffscreenPass.setPipeline(renderOffscreenPipeline)
                renderOffscreenPass.draw(3, NUM_PARTICLES)
                renderOffscreenPass.end()

                if (isInfiniteMirrorWrap) {
                    const renderInfinitePass = encoder.beginRenderPass({
                        colorAttachments: [{
                            view: ctx.getCurrentTexture().createView(),
                            loadOp: 'clear',
                            clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                            storeOp: 'store'
                        }]
                    })
                    renderInfinitePass.setBindGroup(0, cameraBindGroup)
                    renderInfinitePass.setBindGroup(1, simOptionsBindGroup)
                    renderInfinitePass.setBindGroup(2, offscreenTextureBindGroup)
                    renderInfinitePass.setPipeline(renderInfinitePipeline)
                    renderInfinitePass.draw(6, 1)
                    renderInfinitePass.end()
                } else {
                    const renderMirrorPass = encoder.beginRenderPass({
                        colorAttachments: [{
                            view: ctx.getCurrentTexture().createView(),
                            loadOp: 'clear',
                            clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                            storeOp: 'store'
                        }]
                    })
                    renderMirrorPass.setBindGroup(0, cameraBindGroup)
                    renderMirrorPass.setBindGroup(1, simOptionsBindGroup)
                    renderMirrorPass.setBindGroup(2, offscreenTextureBindGroup)
                    renderMirrorPass.setPipeline(renderMirrorPipeline)
                    renderMirrorPass.draw(6, mirrorWrapCount)
                    renderMirrorPass.end()
                }
            } else {
                const renderPass = encoder.beginRenderPass({
                    colorAttachments: [{
                        view: ctx.getCurrentTexture().createView(),
                        loadOp: 'clear',
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        storeOp: 'store',
                    }],
                })
                renderPass.setBindGroup(0, particleBufferReadOnlyBindGroup)
                renderPass.setBindGroup(1, simOptionsBindGroup)
                renderPass.setBindGroup(2, cameraBindGroup)
                renderPass.setPipeline(renderPipeline)
                renderPass.draw(3, NUM_PARTICLES)
                renderPass.end()
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const computeBinning = (encoder: GPUCommandEncoder) => {
            encoder.copyBufferToBuffer(particleBuffer!, 0, particleTempBuffer!, 0, particleBuffer!.size)

            const binningComputePass = encoder.beginComputePass()
            binningComputePass.setBindGroup(0, particleBufferReadOnlyBindGroup)
            binningComputePass.setBindGroup(1, simOptionsBindGroup)
            binningComputePass.setBindGroup(2, binFillSizeBindGroup)
            binningComputePass.setPipeline(binClearSizePipeline)
            binningComputePass.dispatchWorkgroups(Math.ceil((binCount + 1) / 64))

            binningComputePass.setPipeline(binFillSizePipeline)
            binningComputePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))

            binningComputePass.setPipeline(binPrefixSumPipeline)
            for (let i = 0; i < prefixSumIterations; ++i) {
                binningComputePass.setBindGroup(0, binPrefixSumBindGroup[i % 2], [i * 256])
                binningComputePass.dispatchWorkgroups(Math.ceil((binCount + 1) / 64))
            }

            binningComputePass.setBindGroup(0, particleSortBindGroup)
            binningComputePass.setPipeline(particleSortClearSizePipeline)
            binningComputePass.dispatchWorkgroups(Math.ceil((binCount + 1) / 64))

            binningComputePass.setPipeline(particleSortPipeline)
            binningComputePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
            binningComputePass.end()

            const forcesComputePass = encoder.beginComputePass()
            forcesComputePass.setBindGroup(0, particleComputeForcesBindGroup)
            forcesComputePass.setBindGroup(1, simOptionsBindGroup)
            forcesComputePass.setPipeline(particleComputeForcesPipeline)
            forcesComputePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
            forcesComputePass.end()

            const advanceComputePass = encoder.beginComputePass()
            advanceComputePass.setBindGroup(0, particleBufferBindGroup)
            advanceComputePass.setBindGroup(1, simOptionsBindGroup)
            advanceComputePass.setBindGroup(2, deltaTimeBindGroup)
            advanceComputePass.setPipeline(particleAdvancePipeline)
            advanceComputePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
            advanceComputePass.end()
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const createBuffers = () => {
            updateSimOptionsBuffer() // Set simulation options based on the store state
            updateInteractionMatrixBuffer() // Set interaction matrices based on the store state
            updateBinningBuffers()
            // ----------------------------------------------------------------------------------------------
            const paddedSize = Math.ceil(colors.byteLength / 16) * 16 // Ensure padded to 16 bytes
            colorBuffer = device.createBuffer({
                size: paddedSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            })
            new Float32Array(colorBuffer.getMappedRange()).set(colors)
            colorBuffer.unmap()

            const cameraData = new Float32Array([cameraCenter.x, cameraCenter.y, cameraScaleX, cameraScaleY])
            cameraBuffer = device.createBuffer({
                size: cameraData.byteLength,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            });
            new Float32Array(cameraBuffer.getMappedRange()).set(cameraData)
            cameraBuffer.unmap()

            deltaTimeBuffer = device.createBuffer({
                size: 4,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            })
            device.queue.writeBuffer(deltaTimeBuffer, 0, new Float32Array([smoothedDeltaTime]))
        }
        const updateBinningBuffers = () => {
            const gridWidth = Math.ceil(SIM_WIDTH / CELL_SIZE)
            const gridHeight = Math.ceil(SIM_HEIGHT / CELL_SIZE)
            binCount = gridWidth * gridHeight
            prefixSumIterations = Math.ceil(Math.ceil(Math.log2(binCount + 1)) / 2) * 2

            const initialParticles = new Float32Array(NUM_PARTICLES * 5)
            for (let i = 0; i < NUM_PARTICLES; ++i) {
                initialParticles[5 * i + 0] = Math.random() * SIM_WIDTH
                initialParticles[5 * i + 1] = Math.random() * SIM_HEIGHT
                initialParticles[5 * i + 2] = 0
                initialParticles[5 * i + 3] = 0
                initialParticles[5 * i + 4] = Math.floor(Math.random() * NUM_TYPES)
            }

            particleBuffer = device.createBuffer({
                size: NUM_PARTICLES * 20,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE,
            })
            device.queue.writeBuffer(particleBuffer, 0, initialParticles)

            particleTempBuffer = device.createBuffer({
                size: particleBuffer.size,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            })

            binOffsetBuffer = device.createBuffer({
                size: (binCount + 1) * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
            })
            binOffsetTempBuffer = device.createBuffer({
                size: (binCount + 1) * 4,
                usage: GPUBufferUsage.STORAGE,
            })

            const binPrefixSumStepSize = new Uint32Array(prefixSumIterations * 64)
            for (let i = 0; i < prefixSumIterations; ++i) {
                binPrefixSumStepSize[i * 64] = Math.pow(2, i)
            }
            binPrefixSumStepSizeBuffer = device.createBuffer({
                size: prefixSumIterations * 256,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
            })
            device.queue.writeBuffer(binPrefixSumStepSizeBuffer, 0, binPrefixSumStepSize);
        }
        // -------------------------------------------------------------------------------------------------------------
        const updateSimOptionsBuffer = () => {
            const simOptionsData = new ArrayBuffer(48)
            const simOptionsView = new DataView(simOptionsData)
            simOptionsView.setUint32(0, isWallRepel ? 1 : 0, true)
            simOptionsView.setUint32(4, isWallWrap ? 1 : 0, true)
            simOptionsView.setFloat32(8, forceFactor, true)
            simOptionsView.setFloat32(12, frictionFactor, true)
            simOptionsView.setFloat32(16, repel, true)
            simOptionsView.setFloat32(20, PARTICLE_SIZE, true)
            simOptionsView.setFloat32(24, SIM_WIDTH, true)
            simOptionsView.setFloat32(28, SIM_HEIGHT, true)
            simOptionsView.setFloat32(32, CELL_SIZE, true)
            simOptionsView.setUint32(36, SPATIAL_HASH_TABLE_SIZE, true)
            simOptionsView.setUint32(40, NUM_PARTICLES, true)
            simOptionsView.setUint32(44, NUM_TYPES, true)

            if (!simOptionsBuffer) {
                simOptionsBuffer = device.createBuffer({
                    size: simOptionsData.byteLength,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
                })
            }
            device.queue.writeBuffer(simOptionsBuffer, 0, simOptionsData)
        }
        const updateInteractionMatrixBuffer = () => {
            const stride = 4; // 4 octets par couple
            const interactionData = new Uint8Array(NUM_TYPES * NUM_TYPES * stride);
            for (let a = 0; a < NUM_TYPES; a++) {
                for (let b = 0; b < NUM_TYPES; b++) {
                    const index = (a * NUM_TYPES + b) * stride;
                    interactionData[index] = Math.round((rulesMatrix[a][b] + 1) * 0.5 * 255); // rule u8
                    interactionData[index + 1] = Math.round(minRadiusMatrix[a][b]); // minR u8
                    const maxR = maxRadiusMatrix[a][b];
                    interactionData[index + 2] = maxR & 0xFF; // maxR low byte
                    interactionData[index + 3] = (maxR >> 8) & 0xFF; // maxR high byte
                }
            }

            const paddedSize = Math.ceil(interactionData.byteLength / 16) * 16 // Ensure padded to 16 bytes
            const paddedInteractionData = new Uint8Array(paddedSize)
            paddedInteractionData.set(interactionData)

            if (!interactionMatrixBuffer || interactionMatrixBuffer.size !== paddedSize) {
                interactionMatrixBuffer = device.createBuffer({
                    size: paddedSize,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                })
            }
            device.queue.writeBuffer(interactionMatrixBuffer, 0, paddedInteractionData)
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const createBindGroups = () => {
            updateOffscreenTextureBindGroup()
            // ---------------------------------------------------------------------------------------------------------
            particleBufferBindGroup = device.createBindGroup({
                layout: particleBufferBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: particleBuffer! } },
                    { binding: 1, resource: { buffer: interactionMatrixBuffer! } },
                ],
            })
            particleBufferReadOnlyBindGroup = device.createBindGroup({
                layout: particleBufferReadOnlyBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: particleBuffer! } },
                    { binding: 1, resource: { buffer: colorBuffer! } }
                ],
            })
            binFillSizeBindGroup = device.createBindGroup({
                layout: binFillSizeBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: binOffsetBuffer! } }
                ],
            })
            binPrefixSumBindGroup[0] = device.createBindGroup({
                layout: binPrefixSumBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: binOffsetBuffer! } },
                    { binding: 1, resource: { buffer: binOffsetTempBuffer! } },
                    { binding: 2, resource: { buffer: binPrefixSumStepSizeBuffer!, size: 4 } },
                ],
            })
            binPrefixSumBindGroup[1] = device.createBindGroup({
                layout: binPrefixSumBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: binOffsetTempBuffer! } },
                    { binding: 1, resource: { buffer: binOffsetBuffer! } },
                    { binding: 2, resource: { buffer: binPrefixSumStepSizeBuffer!, size: 4 } },
                ],
            })
            particleSortBindGroup = device.createBindGroup({
                layout: particleSortBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: particleBuffer! } },
                    { binding: 1, resource: { buffer: particleTempBuffer! } },
                    { binding: 2, resource: { buffer: binOffsetBuffer! } },
                    { binding: 3, resource: { buffer: binOffsetTempBuffer! } },
                ],
            })
            particleComputeForcesBindGroup = device.createBindGroup({
                layout: particleComputeForcesBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: particleTempBuffer! } },
                    { binding: 1, resource: { buffer: particleBuffer! } },
                    { binding: 2, resource: { buffer: binOffsetBuffer! } },
                    { binding: 3, resource: { buffer: interactionMatrixBuffer! } },
                ],
            })
            simOptionsBindGroup = device.createBindGroup({
                layout: simOptionsBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: simOptionsBuffer! } },
                ],
            })
            deltaTimeBindGroup = device.createBindGroup({
                layout: deltaTimeBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: deltaTimeBuffer! } },
                ],
            })
            cameraBindGroup = device.createBindGroup({
                layout: cameraBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: cameraBuffer! } },
                ],
            })
        }
        const updateOffscreenTextureBindGroup = () => {
            if (offscreenTextureView && offscreenSampler) {
                offscreenTextureBindGroup = device.createBindGroup({
                    layout: offscreenTextureBindGroupLayout,
                    entries: [
                        { binding: 0, resource: offscreenTextureView },
                        { binding: 1, resource: offscreenSampler }
                    ]
                })
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const createBindGroupLayouts = () => {
            particleBufferBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // particleBuffer
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // interactionMatrixBuffer
                ],
            })
            particleBufferReadOnlyBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // particleBuffer
                    { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } }, // colorBuffer
                ],
            })
            binFillSizeBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // binOffsetBuffer
                ],
            })
            binPrefixSumBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // binOffsetBuffer
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // binOffsetTempBuffer
                    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform', hasDynamicOffset: true } }, // binPrefixSumStepSizeBuffer
                ],
            })
            particleSortBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // particleBuffer
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // particleTempBuffer
                    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // binOffsetBuffer
                    { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // binOffsetTempBuffer
                ],
            })
            particleComputeForcesBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // particleTempBuffer
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // particleBuffer
                    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // binOffsetBuffer
                    { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // interactionMatrixBuffer
                ],
            })
            simOptionsBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE | GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
                ],
            });
            deltaTimeBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } }, // deltaTimeBuffer
                ],
            })
            cameraBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }, // cameraBuffer
                ],
            })
            offscreenTextureBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { viewDimension: '2d' } }, // offscreenTextureView
                    { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } }, // offscreenSampler
                ],
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const createPipelines = () => {
            createComputePipelines()
            createRenderPipelines()
        }
        const createComputePipelines = () => {
            // const bruteForceShader = device.createShaderModule({ code: bruteForceShaderCode })
            // bruteForceComputePipeline = device.createComputePipeline({
            //     layout: 'auto',
            //     compute: { module: bruteForceShader, entryPoint: 'main' }
            // })
            const binFillSizeShader = device.createShaderModule({ code: binFillSizeShaderCode })
            binClearSizePipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        particleBufferReadOnlyBindGroupLayout,
                        simOptionsBindGroupLayout,
                        binFillSizeBindGroupLayout,
                    ],
                }),
                compute: { module: binFillSizeShader, entryPoint: 'clearBinSize' }
            })
            binFillSizePipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        particleBufferReadOnlyBindGroupLayout,
                        simOptionsBindGroupLayout,
                        binFillSizeBindGroupLayout,
                    ],
                }),
                compute: { module: binFillSizeShader, entryPoint: 'fillBinSize' }
            })
            const binPrefixSumShader = device.createShaderModule({ code: binPrefixSumShaderCode })
            binPrefixSumPipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        binPrefixSumBindGroupLayout,
                    ],
                }),
                compute: { module: binPrefixSumShader, entryPoint: 'prefixSumStep' }
            })
            const particleSortShader = device.createShaderModule({ code: particleSortShaderCode })
            particleSortClearSizePipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        particleSortBindGroupLayout,
                        simOptionsBindGroupLayout,
                    ],
                }),
                compute: { module: particleSortShader, entryPoint: 'clearBinSize' }
            })
            particleSortPipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        particleSortBindGroupLayout,
                        simOptionsBindGroupLayout,
                    ],
                }),
                compute: { module: particleSortShader, entryPoint: 'sortParticles' }
            })
            const particleComputeForcesShader = device.createShaderModule({ code: particleComputeForcesShaderCode })
            particleComputeForcesPipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        particleComputeForcesBindGroupLayout,
                        simOptionsBindGroupLayout,
                    ],
                }),
                compute: { module: particleComputeForcesShader, entryPoint: 'computeForces' }
            })
            const particleAdvanceShader = device.createShaderModule({ code: particleAdvanceShaderCode })
            particleAdvancePipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        particleBufferBindGroupLayout,
                        simOptionsBindGroupLayout,
                        deltaTimeBindGroupLayout,
                    ],
                }),
                compute: { module: particleAdvanceShader, entryPoint: 'particleAdvance' }
            })
        }
        const createRenderPipelines = () => {
            const renderVertexShader = device.createShaderModule({ code: vertexShaderCode })
            const renderFragmentShader = device.createShaderModule({ code: fragmentShaderCode })
            renderPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        particleBufferReadOnlyBindGroupLayout,
                        simOptionsBindGroupLayout,
                        cameraBindGroupLayout,
                    ],
                }),
                vertex: {
                    module: renderVertexShader,
                    entryPoint: 'main',
                    buffers: []
                },
                fragment: {
                    module: renderFragmentShader,
                    entryPoint: 'main',
                    targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }]
                },
                primitive: {
                    topology: 'triangle-list'
                }
            })
            // ---------------------------------------------------------------------------------------------------------
            const offscreenVertexShader = device.createShaderModule({ code: offscreenShaderCode })
            renderOffscreenPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        particleBufferReadOnlyBindGroupLayout,
                        simOptionsBindGroupLayout,
                    ],
                }),
                vertex: {
                    module: offscreenVertexShader,
                    entryPoint: 'main',
                    buffers: []
                },
                fragment: {
                    module: renderFragmentShader,
                    entryPoint: 'main',
                    targets: [{ format: 'rgba8unorm' }]
                },
                primitive: {
                    topology: 'triangle-list'
                }
            })
            // ---------------------------------------------------------------------------------------------------------
            const mirrorVertexShader = device.createShaderModule({ code: mirrorVertexShaderCode })
            const mirrorFragmentShader = device.createShaderModule({ code: mirrorFragmentShaderCode })
            renderMirrorPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        cameraBindGroupLayout,
                        simOptionsBindGroupLayout,
                        offscreenTextureBindGroupLayout
                    ],
                }),
                vertex: {
                    module: mirrorVertexShader,
                    entryPoint: 'main',
                    buffers: []
                },
                fragment: {
                    module: mirrorFragmentShader,
                    entryPoint: 'main',
                    targets: [{
                        format: navigator.gpu.getPreferredCanvasFormat(),
                    }]
                },
                primitive: { topology: 'triangle-list' }
            })
            // ---------------------------------------------------------------------------------------------------------
            const infiniteVertexShader = device.createShaderModule({ code: infiniteVertexShaderCode })
            const infiniteFragmentShader = device.createShaderModule({ code: infiniteFragmentShaderCode })
            renderInfinitePipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        cameraBindGroupLayout,
                        simOptionsBindGroupLayout,
                        offscreenTextureBindGroupLayout
                    ],
                }),
                vertex: {
                    module: infiniteVertexShader,
                    entryPoint: 'main',
                    buffers: []
                },
                fragment: {
                    module: infiniteFragmentShader,
                    entryPoint: 'main',
                    targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }]
                },
                primitive: {
                    topology: 'triangle-list'
                }
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const updateOffscreenMirrorResources = () => {
            if (offscreenTexture) {
                offscreenTexture.destroy(); offscreenTexture = undefined;
            }
            if (!isMirrorWrap && !isInfiniteMirrorWrap) return

            const maxDimension = device.limits.maxTextureDimension2D
            const aspectRatio = SIM_WIDTH / SIM_HEIGHT
            const baseResolution2K = 2048

            let desiredWidth = SIM_WIDTH * 3.5
            let desiredHeight = SIM_HEIGHT * 3.5

            if (desiredWidth > maxDimension || desiredHeight > maxDimension) {
                if (aspectRatio > 1) {
                    desiredWidth = maxDimension
                    desiredHeight = Math.round(desiredWidth / aspectRatio)
                } else {
                    desiredHeight = maxDimension
                    desiredWidth = Math.round(desiredHeight * aspectRatio)
                }
            }
            if (desiredWidth < baseResolution2K || desiredHeight < baseResolution2K) {
                if (aspectRatio > 1) {
                    desiredWidth = Math.max(desiredWidth, baseResolution2K)
                    desiredHeight = Math.round(desiredWidth / aspectRatio)
                } else {
                    desiredHeight = Math.max(desiredHeight, baseResolution2K)
                    desiredWidth = Math.round(desiredHeight * aspectRatio)
                }
            }
            const maxWidth = Math.min(desiredWidth, maxDimension)
            const maxHeight = Math.min(desiredHeight, maxDimension)
            offscreenTexture = device.createTexture({
                size: [maxWidth, maxHeight],
                // format: navigator.gpu.getPreferredCanvasFormat(),
                format: 'rgba8unorm',
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            })
            offscreenTextureView = offscreenTexture.createView()

            if (!offscreenSampler) {
                offscreenSampler = device.createSampler({
                    magFilter: 'linear',
                    minFilter: 'linear',
                    addressModeU: 'repeat',
                    addressModeV: 'repeat'
                })
            }

            if (isMirrorWrap && renderMirrorPipeline) updateOffscreenTextureBindGroup()
            if (isInfiniteMirrorWrap && renderInfinitePipeline) updateOffscreenTextureBindGroup()
        }
        const updateNumParticles = useDebounceFn(async (newCount: number) => {
            if (isUpdatingParticles || newCount === NUM_PARTICLES) return
            isUpdatingParticles = true

            try {
                cancelAnimationLoop()

                const oldCount = NUM_PARTICLES
                const oldPositions = await readBufferFromGPU(currentPositionBuffer!, oldCount * 2 * 4)
                const oldVelocities = await readBufferFromGPU(velocityBuffer!, oldCount * 2 * 4)
                const oldTypes = await readBufferFromGPU(typeBuffer!, oldCount * 4)

                const newPositions = new Float32Array(newCount * 2)
                const newVelocities = new Float32Array(newCount * 2)
                const newTypes = new Uint32Array(newCount)

                if (newCount > oldCount) {
                    newPositions.set(new Float32Array(oldPositions))
                    newVelocities.set(new Float32Array(oldVelocities))
                    newTypes.set(new Uint32Array(oldTypes))
                    for (let i = oldCount; i < newCount; i++) {
                        newPositions[2 * i] = Math.random() * SIM_WIDTH
                        newPositions[2 * i + 1] = Math.random() * SIM_HEIGHT
                        newVelocities[2 * i] = 0
                        newVelocities[2 * i + 1] = 0
                        newTypes[i] = Math.floor(Math.random() * NUM_TYPES)
                    }
                } else {
                    newPositions.set(new Float32Array(oldPositions).subarray(0, newCount * 2))
                    newVelocities.set(new Float32Array(oldVelocities).subarray(0, newCount * 2))
                    newTypes.set(new Uint32Array(oldTypes).subarray(0, newCount))
                }

                positions = newPositions
                velocities = newVelocities
                types = newTypes

                NUM_PARTICLES = newCount
                SPATIAL_HASH_TABLE_SIZE = Math.pow(2, Math.ceil(Math.log2(NUM_PARTICLES))) // Ensure SPATIAL_HASH_TABLE_SIZE is a power of 2

                destroyPipelinesAndBindGroups()
                await destroyBuffers()
                createBuffers()
                createPipelines()
                updateOffscreenMirrorResources() // Will create offscreen texture and bind group if needed
                createBindGroups()

                if (!isRunning) syncPositionBuffers()

                lastFrameTime = performance.now()
                animationFrameId = requestAnimationFrame(frame)
            } finally {
                isUpdatingParticles = false
                await updateNumParticles(particleLife.numParticles) // Reset the debounce function
            }
        }, 16, { maxWait: 33 })
        const updateNumTypes = async (newNumTypes: number) => {
            if (isUpdatingParticles || newNumTypes === NUM_TYPES) return
            isUpdatingParticles = true
            try {
                cancelAnimationLoop()

                const currentPositions = await readBufferFromGPU(currentPositionBuffer!, NUM_PARTICLES * 2 * 4)
                const currentVelocities = await readBufferFromGPU(velocityBuffer!, NUM_PARTICLES * 2 * 4)
                const currentTypes = await readBufferFromGPU(typeBuffer!, NUM_PARTICLES * 4)
                types = new Uint32Array(currentTypes)
                positions = new Float32Array(currentPositions)
                velocities = new Float32Array(currentVelocities)

                if (newNumTypes < NUM_TYPES) {
                    for (let i = 0; i < types.length; i++) {
                        if (types[i] >= newNumTypes) {
                            types[i] = Math.floor(Math.random() * newNumTypes)
                        }
                    }
                } else if (newNumTypes > NUM_TYPES) {
                    for (let i = 0; i < types.length; i++) {
                        if (Math.random() < (newNumTypes - NUM_TYPES) / newNumTypes) {
                            types[i] = NUM_TYPES + Math.floor(Math.random() * (newNumTypes - NUM_TYPES))
                        }
                    }
                }

                const newColors = new Float32Array(newNumTypes * 4)
                const oldColors = colors
                for (let i = 0; i < newNumTypes; i++) {
                    if (i < NUM_TYPES) {
                        newColors[i * 4] = oldColors[i * 4] ?? Math.random()
                        newColors[i * 4 + 1] = oldColors[i * 4 + 1] ?? Math.random()
                        newColors[i * 4 + 2] = oldColors[i * 4 + 2] ?? Math.random()
                        newColors[i * 4 + 3] = 1
                    } else {
                        newColors[i * 4] = Math.random()
                        newColors[i * 4 + 1] = Math.random()
                        newColors[i * 4 + 2] = Math.random()
                        newColors[i * 4 + 3] = 1
                    }
                }
                colors = newColors
                particleLife.currentColors = colors // Ensure the store is updated with the new colors

                setRulesMatrix(resizeMatrix(rulesMatrix, NUM_TYPES, newNumTypes, () => {
                    return Number((Math.random() * 2 - 1).toFixed(4))
                }))
                setMinRadiusMatrix(resizeMatrix(minRadiusMatrix, NUM_TYPES, newNumTypes, () => {
                    return Math.floor(Math.random() * (particleLife.minRadiusRange[1] - particleLife.minRadiusRange[0] + 1) + particleLife.minRadiusRange[0])
                }))
                setMaxRadiusMatrix(resizeMatrix(maxRadiusMatrix, NUM_TYPES, newNumTypes, () => {
                    return Math.floor(Math.random() * (particleLife.maxRadiusRange[1] - particleLife.maxRadiusRange[0] + 1) + particleLife.maxRadiusRange[0])
                }))
                NUM_TYPES = newNumTypes
                particleLife.currentMaxRadius = getCurrentMaxRadius()

                destroyPipelinesAndBindGroups()
                await destroyBuffers()
                createBuffers()
                createPipelines()
                updateOffscreenMirrorResources() // Will create offscreen texture and bind group if needed
                createBindGroups()

                if (!isRunning) syncPositionBuffers()

                lastFrameTime = performance.now()
                animationFrameId = requestAnimationFrame(frame)
            } finally {
                isUpdatingParticles = false
                await updateNumTypes(particleLife.numColors) // Reset the debounce function
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        const syncPositionBuffers = () => {
            const encoder = device.createCommandEncoder()
            encoder.copyBufferToBuffer(
                currentPositionBuffer!, 0,
                nextPositionBuffer!, 0,
                positions.byteLength
            )
            device.queue.submit([encoder.finish()])
        }
        async function readBufferFromGPU(buffer: GPUBuffer, size: number): Promise<ArrayBuffer> {
            const readBuffer = device.createBuffer({
                size,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
            })
            const encoder = device.createCommandEncoder()
            encoder.copyBufferToBuffer(buffer, 0, readBuffer, 0, size)
            device.queue.submit([encoder.finish()])
            await readBuffer.mapAsync(GPUMapMode.READ)
            const arrayBuffer = readBuffer.getMappedRange().slice(0)
            readBuffer.unmap()
            return arrayBuffer
        }
        function resizeMatrix(matrix: number[][], oldNumTypes: number, newNumTypes: number, randomFn: () => number) {
            const newMatrix: number[][] = []
            for (let i = 0; i < newNumTypes; i++) {
                const row: number[] = []
                for (let j = 0; j < newNumTypes; j++) {
                    if (i < oldNumTypes && j < oldNumTypes) {
                        row.push(matrix[i][j])
                    } else {
                        row.push(randomFn())
                    }
                }
                newMatrix.push(row)
            }
            return newMatrix
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function initColors() {
            colors = new Float32Array(NUM_TYPES * 4)
            for (let i = 0; i < NUM_TYPES; ++i) {
                colors[i * 4] = Math.random()
                colors[i * 4 + 1] = Math.random()
                colors[i * 4 + 2] = Math.random()
                colors[i * 4 + 3] = 1 // padding alpha channel
            }
            particleLife.currentColors = colors // Ensure the store is updated with the initial colors
        }
        function initParticles() {
            positions = new Float32Array(NUM_PARTICLES * 2)
            velocities = new Float32Array(NUM_PARTICLES * 2)
            types = new Uint32Array(NUM_PARTICLES)
            for (let i = 0; i < NUM_PARTICLES; i++) {
                positions[2 * i] = Math.random() * SIM_WIDTH
                positions[2 * i + 1] = Math.random() * SIM_HEIGHT
                velocities[2 * i] = 0
                velocities[2 * i + 1] = 0
                types[i] = Math.floor(Math.random() * NUM_TYPES)
            }
        }
        function makeRandomRulesMatrix() {
            let matrix: number[][] = []
            for (let i = 0; i < NUM_TYPES; i++) {
                matrix.push([])
                for (let j = 0; j < NUM_TYPES; j++) {
                    matrix[i].push(Number((Math.random() * 2 - 1).toFixed(4)))
                }
            }
            return matrix
        }
        function makeRandomMinRadiusMatrix() {
            let matrix: number[][] = []
            const min: number = particleLife.minRadiusRange[0]
            const max: number = particleLife.minRadiusRange[1]
            for (let i = 0; i < NUM_TYPES; i++) {
                matrix.push([])
                for (let j = 0; j < NUM_TYPES; j++) {
                    const random = Math.floor(Math.random() * (max - min + 1) + min)
                    matrix[i].push(random)
                }
            }
            return matrix
        }
        function makeRandomMaxRadiusMatrix() {
            let matrix: number[][] = []
            const min: number = particleLife.maxRadiusRange[0]
            const max: number = particleLife.maxRadiusRange[1]
            let maxRandom: number = min
            for (let i = 0; i < NUM_TYPES; i++) {
                matrix.push([])
                for (let j = 0; j < NUM_TYPES; j++) {
                    const random = Math.floor(Math.random() * (max - min + 1) + min)
                    matrix[i].push(random)
                    if (random > maxRandom) {
                        maxRandom = random
                    }
                }
            }
            particleLife.currentMaxRadius = maxRandom
            // currentMaxRadius = particleLife.currentMaxRadius
            // CELL_SIZE = currentMaxRadius
            return matrix
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const updateSimWidth = (newWidth: number | Event) => {
            if (typeof(newWidth) !== 'number') return // Prevent input event like unfocus
            if (particleLife.linkProportions) particleLife.simHeight = SIM_HEIGHT = baseSimHeight = Math.round(SIM_HEIGHT * (newWidth / SIM_WIDTH))
            particleLife.simWidth = SIM_WIDTH = baseSimWidth = newWidth
            if (isWallWrap) setSimSizeWhenWrapped()
            regenerateLife()
        }
        const updateSimHeight = (newHeight: number | Event) => {
            if (typeof(newHeight) !== 'number') return // Prevent input event like unfocus
            if (particleLife.linkProportions) particleLife.simWidth = SIM_WIDTH = baseSimWidth = Math.round(SIM_WIDTH * (newHeight / SIM_HEIGHT))
            particleLife.simHeight = SIM_HEIGHT = baseSimHeight = newHeight
            if (isWallWrap) setSimSizeWhenWrapped()
            regenerateLife()
        }
        const updateRulesMatrixValue = (x: number, y: number, value: number) => {
            particleLife.rulesMatrix[x][y] = value
            rulesMatrix[x][y] = value
            updateInteractionMatrixBuffer()
        }
        const updateMinMatrixValue = (x: number, y: number, value: number) => {
            particleLife.minRadiusMatrix[x][y] = value
            minRadiusMatrix[x][y] = value
            if (value > particleLife.maxRadiusMatrix[x][y]) {
                particleLife.maxRadiusMatrix[x][y] = value
                maxRadiusMatrix[x][y] = value
                particleLife.currentMaxRadius = getCurrentMaxRadius()
            }
            updateInteractionMatrixBuffer()
        }
        const updateMaxMatrixValue = (x: number, y: number, value: number) => {
            particleLife.maxRadiusMatrix[x][y] = value
            maxRadiusMatrix[x][y] = value
            particleLife.currentMaxRadius = getCurrentMaxRadius()
            if (value < particleLife.minRadiusMatrix[x][y]) {
                particleLife.minRadiusMatrix[x][y] = value
                minRadiusMatrix[x][y] = value
            }
            updateInteractionMatrixBuffer()
        }
        const newRandomRulesMatrix = () => {

        }
        function setRulesMatrix(newRules: number[][]) {
            rulesMatrix = newRules
            particleLife.rulesMatrix = rulesMatrix
        }
        function setMinRadiusMatrix(newMinRadius: number[][]) {
            minRadiusMatrix = newMinRadius
            particleLife.minRadiusMatrix = minRadiusMatrix
        }
        function setMaxRadiusMatrix(newMaxRadius: number[][]) {
            maxRadiusMatrix = newMaxRadius
            particleLife.maxRadiusMatrix = maxRadiusMatrix
        }
        // -------------------------------------------------------------------------------------------------------------
        const getCurrentMaxRadius = () => {
            let maxRandom = 0
            for (let i = 0; i < NUM_TYPES; i++) {
                for (let j = 0; j < NUM_TYPES; j++) {
                    if (maxRadiusMatrix[i][j] > maxRandom) maxRandom = maxRadiusMatrix[i][j]
                }
            }
            return maxRandom
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const colorRgbStrings = computed(() => {
            const arr = particleLife.currentColors
            if (!arr) return []
            const result: string[] = []
            for (let i = 0; i < arr.length; i += 4) {
                const r = Math.round(arr[i] * 255)
                const g = Math.round(arr[i + 1] * 255)
                const b = Math.round(arr[i + 2] * 255)
                result.push(`rgb(${r}, ${g}, ${b})`)
            }
            return result
        })
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function watchAndUpdate(effect: any, callback: any) {
            watch(effect, (value) => {
                callback(value)
                updateSimOptionsBuffer()
            })
        }
        watch(() => particleLife.mirrorWrapCount, (value: number) => mirrorWrapCount = value)
        watch(() => particleLife.numParticles, (value: number) => updateNumParticles(value))
        watch(() => particleLife.numColors, (value: number) => updateNumTypes(value))
        watch(() => particleLife.isRunning, (value: boolean) => isRunning = value)
        watch(() => particleLife.useSpatialHash, (value: boolean) => useSpatialHash = value)
        watchAndUpdate(() => particleLife.particleSize, (value: number) => PARTICLE_SIZE = value)
        watchAndUpdate(() => particleLife.repel, (value: number) => repel = value)
        watchAndUpdate(() => particleLife.forceFactor, (value: number) => forceFactor = value)
        watchAndUpdate(() => particleLife.frictionFactor, (value: number) => frictionFactor = value)
        watchAndUpdate(() => particleLife.currentMaxRadius, (value: number) => {
            currentMaxRadius = value
            CELL_SIZE = currentMaxRadius
            if (isWallWrap) setSimSizeWhenWrapped()
        })

        let isUpdatingWallState = false
        watch([
            () => particleLife.isWallRepel,
            () => particleLife.isWallWrap,
            () => particleLife.isMirrorWrap,
            () => particleLife.isInfiniteMirrorWrap
        ], ([newRepel, newWrap, newMirror, newInfinite], [oldRepel, oldWrap, oldMirror, oldInfinite]) => {
            if (isUpdatingWallState) return

            let changedProp = ''
            if (newRepel !== oldRepel) changedProp = 'isWallRepel'
            else if (newWrap !== oldWrap) changedProp = 'isWallWrap'
            else if (newMirror !== oldMirror) changedProp = 'isMirrorWrap'
            else if (newInfinite !== oldInfinite) changedProp = 'isInfiniteMirrorWrap'

            if (!changedProp) return

            isUpdatingWallState = true

            if (changedProp === 'isWallRepel' && newRepel) {
                particleLife.isWallWrap = false
                particleLife.isMirrorWrap = false
                particleLife.isInfiniteMirrorWrap = false
            } else if (changedProp === 'isWallWrap') {
                if (newWrap) {
                    particleLife.isWallRepel = false
                    if (!newMirror && !newInfinite) particleLife.isMirrorWrap = true
                } else {
                    particleLife.isMirrorWrap = false
                    particleLife.isInfiniteMirrorWrap = false
                }
            } else if (changedProp === 'isMirrorWrap' && newMirror) {
                particleLife.isWallWrap = true
                particleLife.isWallRepel = false
                particleLife.isInfiniteMirrorWrap = false
            } else if (changedProp === 'isInfiniteMirrorWrap' && newInfinite) {
                particleLife.isWallWrap = true
                particleLife.isWallRepel = false
                particleLife.isMirrorWrap = false
            }

            isWallRepel = particleLife.isWallRepel
            isWallWrap = particleLife.isWallWrap
            isMirrorWrap = particleLife.isMirrorWrap
            isInfiniteMirrorWrap = particleLife.isInfiniteMirrorWrap

            if (!oldWrap && ((changedProp === 'isWallWrap' && newWrap) || (changedProp === 'isMirrorWrap' && newMirror) || (changedProp === 'isInfiniteMirrorWrap' && newInfinite))) {
                setSimSizeWhenWrapped()
            } else {
                updateOffscreenMirrorResources()
            }
            if (changedProp === 'isWallWrap' || changedProp === 'isWallRepel' || (changedProp === 'isMirrorWrap' && newMirror && !oldWrap) || (changedProp === 'isInfiniteMirrorWrap' && newInfinite && !oldWrap)) {
                updateSimOptionsBuffer()
            }

            nextTick(() => {
                isUpdatingWallState = false
            })
        })
        // -------------------------------------------------------------------------------------------------------------
        const destroyBuffers = async () => {
            currentPositionBuffer?.destroy(); currentPositionBuffer = undefined;
            nextPositionBuffer?.destroy(); nextPositionBuffer = undefined;
            velocityBuffer?.destroy(); velocityBuffer = undefined;
            typeBuffer?.destroy(); typeBuffer = undefined;
            typeBufferPacked?.destroy(); typeBufferPacked = undefined;
            colorBuffer?.destroy(); colorBuffer = undefined;
            deltaTimeBuffer?.destroy(); deltaTimeBuffer = undefined;
            cameraBuffer?.destroy(); cameraBuffer = undefined;
            interactionMatrixBuffer?.destroy(); interactionMatrixBuffer = undefined;
            simOptionsBuffer?.destroy(); simOptionsBuffer = undefined;
            particleHashesBuffer?.destroy(); particleHashesBuffer = undefined;
            cellHeadsBuffer?.destroy(); cellHeadsBuffer = undefined;
            particleNextIndicesBuffer?.destroy(); particleNextIndicesBuffer = undefined;
            offscreenTexture?.destroy(); offscreenTexture = undefined;
            offscreenTextureView = undefined as any;
            offscreenSampler = undefined as any;

            particleBuffer?.destroy(); particleBuffer = undefined;
            particleTempBuffer?.destroy(); particleTempBuffer = undefined;
            binOffsetBuffer?.destroy(); binOffsetBuffer = undefined;
            binOffsetTempBuffer?.destroy(); binOffsetTempBuffer = undefined;
            binPrefixSumStepSizeBuffer?.destroy(); binPrefixSumStepSizeBuffer = undefined;

            await nextTick() // Ensure GPU resources are cleaned up before creating new ones
        }
        const destroyPipelinesAndBindGroups = () => {
            // bruteForceComputePipeline = undefined as any;

            renderOffscreenPipeline = undefined as any;
            renderMirrorPipeline = undefined as any;
            renderInfinitePipeline = undefined as any;
            renderPipeline = undefined as any;

            binClearSizePipeline = undefined as any;
            binFillSizePipeline = undefined as any;
            binPrefixSumPipeline = undefined as any;
            particleSortClearSizePipeline = undefined as any;
            particleSortPipeline = undefined as any;
            particleComputeForcesPipeline = undefined as any;
            particleAdvancePipeline = undefined as any;

            particleBufferReadOnlyBindGroup = undefined as any;
            binFillSizeBindGroup = undefined as any;
            binPrefixSumBindGroup = [];
            particleSortBindGroup = undefined as any;
            particleComputeForcesBindGroup = undefined as any;
            particleBufferBindGroup = undefined as any;
            simOptionsBindGroup = undefined as any;
            deltaTimeBindGroup = undefined as any;
            cameraBindGroup = undefined as any;
        }
        const cancelAnimationLoop = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
                animationFrameId = null
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        watch(() => particleLife.isLockedPointer, (value) => {
            const sidebarLeftElement = document.getElementById('sidebarLeft')
            if (sidebarLeftElement) {
                if (value) {
                    sidebarLeftElement.classList.add('force-hover-effect')
                } else {
                    sidebarLeftElement.classList.remove('force-hover-effect')
                }
            }
        })
        onUnmounted(() => {
            cancelAnimationLoop()
            destroyPipelinesAndBindGroups()
            destroyBuffers()
            // particleLife.$reset()
        })

        return {
            particleLife, canvasRef, fps, executionTime, colorRgbStrings,
            handleZoom, toggleFullscreen, isFullscreen, regenerateLife, step,
            updateSimWidth, updateSimHeight,
            updateRulesMatrixValue, updateMinMatrixValue, updateMaxMatrixValue, newRandomRulesMatrix,
        }
    }
});
</script>

<style scoped>
canvas {
    background: black;
}
.scrollableArea {
    scrollbar-color: #a5a5a5 transparent;
    scrollbar-width: none;
}
</style>

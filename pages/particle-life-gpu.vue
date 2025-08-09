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
                                        :min="16" :max="1048576" :step="16" v-model="particleLife.numParticles" @update:modelValue="updateNumParticles">
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
                                        :min="0.1" :max="6" :step="0.1" v-model="particleLife.particleSize" mt-2>
                            </RangeInput>
                            <ToggleSwitch label="Particle Glowing" colorful-label v-model="particleLife.isParticleGlow" />
                            <ToggleSwitch label="Additive Blending" colorful-label v-model="particleLife.isAdditiveBlending" />
                            <RangeInput input label="Glow Size"
                                        tooltip="Adjust the size of the glow effect around particles."
                                        :min="0" :max="32" :step="0.1" v-model="particleLife.glowSize" mt-2>
                            </RangeInput>
                            <RangeInput input label="Glow Intensity"
                                        tooltip="Adjust the intensity of the glow effect around particles."
                                        :min="0" :max="0.5" :step="0.005" v-model="particleLife.glowIntensity" mt-2>
                            </RangeInput>
                            <RangeInput input label="Glow Steepness"
                                        tooltip="Adjust the steepness of the glow effect around particles. <br> Higher values create a sharper transition between glowing and non-glowing areas."
                                        :min="0" :max="12" :step="1" v-model="particleLife.glowSteepness" mt-2>
                            </RangeInput>
                            <RangeInput input label="Particle Opacity"
                                        tooltip="Adjust the opacity of the particles in the simulation. <br> This setting allows you to control how transparent or opaque the particles appear."
                                        :min="0" :max="1" :step="0.01" v-model="particleLife.particleOpacity" mt-2>
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
        <canvas ref="canvasRef" id="canvasRef" @contextmenu.prevent w-full h-full cursor-crosshair></canvas>
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

import binFillSizeShaderCode from 'assets/particle-life-gpu/shaders/compute/binFillSize.wgsl?raw';
import binPrefixSumShaderCode from 'assets/particle-life-gpu/shaders/compute/binPrefixSum.wgsl?raw';
import particleSortShaderCode from 'assets/particle-life-gpu/shaders/compute/particleSort.wgsl?raw';
import bruteForceShaderCode from 'assets/particle-life-gpu/shaders/compute/compute_bruteForce.wgsl?raw';
import particleComputeForcesShaderCode from 'assets/particle-life-gpu/shaders/compute/particleComputeForces.wgsl?raw';
import particleAdvanceShaderCode from 'assets/particle-life-gpu/shaders/compute/particleAdvance.wgsl?raw';
import particleAdvanceBrushShaderCode from 'assets/particle-life-gpu/shaders/compute/particleAdvance_brush.wgsl?raw';

import renderShaderCode from 'assets/particle-life-gpu/shaders/render/render_normal.wgsl?raw';
import offscreenShaderCode from 'assets/particle-life-gpu/shaders/render/offscreen_render_vertex.wgsl?raw';
import infiniteCompositorShaderCode from 'assets/particle-life-gpu/shaders/compose/infinite_compositor.wgsl?raw';
import renderGlowShaderCode from 'assets/particle-life-gpu/shaders/render/particle_render_glow.wgsl?raw';
import composeHdrShaderCode from 'assets/particle-life-gpu/shaders/compose/compose_hdr.wgsl?raw';

import renderMirrorShaderCode from 'assets/particle-life-gpu/shaders/render/render_mirror.wgsl?raw';
import renderInfiniteShaderCode from 'assets/particle-life-gpu/shaders/render/render_infinite.wgsl?raw';

import particleEraseShaderCode from 'assets/particle-life-gpu/shaders/compute/particleErase.wgsl?raw';
import particleCompactShaderCode from 'assets/particle-life-gpu/shaders/compute/particleCompact.wgsl?raw';

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
        let isInitializing: boolean = true
        let isUpdatingParticles: boolean = false // Flag to prevent multiple additions at once

        let smoothedDeltaTime: number = 0.016 // Initial value (1/60s)
        let CANVAS_WIDTH: number = 0
        let CANVAS_HEIGHT: number = 0
        let SIM_WIDTH: number = 0
        let SIM_HEIGHT: number = 0
        let CELL_SIZE: number = 0
        let baseSimWidth: number = 0
        let baseSimHeight: number = 0
        let GRID_WIDTH: number = 0
        let GRID_HEIGHT: number = 0
        let binCount: number = 0
        let prefixSumIterations: number = 0

        let EXTENDED_GRID_WIDTH: number = 0
        let EXTENDED_GRID_HEIGHT: number = 0
        let GRID_OFFSET_X: number = 0
        let GRID_OFFSET_Y: number = 0
        let EXTENDED_SIM_WIDTH: number = 0
        let EXTENDED_SIM_HEIGHT: number = 0

        // Define color list and rules matrix for the particles
        let rulesMatrix: number[][] = [] // Rules matrix for each color
        let maxRadiusMatrix: number[][] = [] // Max radius matrix for each color
        let minRadiusMatrix: number[][] = [] // Min radius matrix for each color
        let currentMaxRadius: number = 0 // Max value between all colors max radius (for cell size)

        // Define the simulation properties
        let initialParticles: Float32Array // Initial particle x, y, vx, vy, type
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
        let lastFramePointerX: number = 0
        let lastFramePointerY: number = 0
        let cameraChanged: boolean = true
        let infiniteTotalInstances: number = 0 // Total number of instances for infinite rendering

        // Define variables for the simulation
        let repel: number = particleLife.repel // Repel force between particles
        let forceFactor: number = particleLife.forceFactor // Decrease will increase the impact of the force on the velocity (the higher the value, the slower the particles will move) (can't be 0)
        let frictionFactor: number = particleLife.frictionFactor // Slow down the particles (0 to 1, where 1 is no friction)
        let NUM_PARTICLES: number = particleLife.numParticles
        let PARTICLE_SIZE: number = particleLife.particleSize
        let NUM_TYPES: number = particleLife.numColors
        let isParticleGlow: boolean = particleLife.isParticleGlow // Enable glow effect for the particles
        let isAdditiveBlending = particleLife.isAdditiveBlending // Use additive blending for rendering particles
        let isWallRepel: boolean = particleLife.isWallRepel // Enable walls X and Y for the particles
        let isWallWrap: boolean = particleLife.isWallWrap // Enable wrapping for the particles
        let isMirrorWrap: boolean = particleLife.isMirrorWrap // Enable mirroring for the particles (only if isWallWrap is true)
        let isInfiniteMirrorWrap: boolean = particleLife.isInfiniteMirrorWrap // Enable infinite wrapping for the particles (only if isWallWrap is true)
        let mirrorWrapCount: number = particleLife.mirrorWrapCount // Number of mirrors to render if isMirrorWrap is true (5 or 9)
        let useSpatialHash: boolean = particleLife.useSpatialHash // Use spatial hash or brute force

        let glowSize: number = particleLife.glowSize
        let glowIntensity: number = particleLife.glowIntensity
        let glowSteepness: number = particleLife.glowSteepness
        let particleOpacity: number = particleLife.particleOpacity

        let isBrushActive: boolean = particleLife.isBrushActive
        let isBrushDrawing: boolean = false
        let brushType: number = particleLife.brushType // 0: Erase, 1: Draw, 2: Repulse, 3: Attract
        let brushes: number[] = particleLife.brushes
        let brushRadius: number = particleLife.brushRadius
        let brushIntensity: number = particleLife.brushIntensity
        let attractForce: number = -Math.abs(particleLife.attractForce)
        let repulseForce: number = particleLife.repulseForce
        let brushDirectionalForce: number = particleLife.brushDirectionalForce // Force applied in the direction of the brush movement

        // Define GPU resources
        let device: GPUDevice
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
        let glowOptionsBuffer: GPUBuffer | undefined
        let infiniteRenderOptionsBuffer: GPUBuffer | undefined
        let brushOptionsBuffer: GPUBuffer | undefined

        let binOffsetBuffer: GPUBuffer | undefined
        let binOffsetTempBuffer: GPUBuffer | undefined
        let particleBuffer: GPUBuffer | undefined
        let particleTempBuffer: GPUBuffer | undefined
        let binPrefixSumStepSizeBuffer: GPUBuffer | undefined

        let offscreenTexture: GPUTexture | undefined
        let offscreenTextureView: GPUTextureView
        let offscreenSampler: GPUSampler
        let hdrTexture: GPUTexture | undefined
        let hdrTextureView: GPUTextureView

        let renderPipeline: GPURenderPipeline
        let renderGlowPipeline: GPURenderPipeline
        let renderCirclePipeline: GPURenderPipeline
        let renderMirrorPipeline: GPURenderPipeline
        let renderMirrorGlowPipeline: GPURenderPipeline
        let renderMirrorCirclePipeline: GPURenderPipeline
        let renderInfinitePipeline: GPURenderPipeline
        let renderInfiniteGlowPipeline: GPURenderPipeline
        let renderInfiniteCirclePipeline: GPURenderPipeline
        let renderOffscreenPipeline: GPURenderPipeline
        let composeInfinitePipeline: GPURenderPipeline
        let composeHdrPipeline: GPURenderPipeline

        let renderPipelineAdditive: GPURenderPipeline
        let renderMirrorPipelineAdditive: GPURenderPipeline
        let renderInfinitePipelineAdditive: GPURenderPipeline
        let renderCirclePipelineAdditive: GPURenderPipeline
        let renderMirrorCirclePipelineAdditive: GPURenderPipeline
        let renderInfiniteCirclePipelineAdditive: GPURenderPipeline

        let binClearSizePipeline: GPUComputePipeline
        let binFillSizePipeline: GPUComputePipeline
        let binPrefixSumPipeline: GPUComputePipeline
        let particleSortClearSizePipeline: GPUComputePipeline
        let particleSortPipeline: GPUComputePipeline
        let bruteForceComputePipeline: GPUComputePipeline
        let particleComputeForcesPipeline: GPUComputePipeline
        let particleAdvancePipeline: GPUComputePipeline
        let particleAdvanceBrushPipeline: GPUComputePipeline

        let particleBufferReadOnlyBindGroup: GPUBindGroup
        let binFillSizeBindGroup: GPUBindGroup
        let binPrefixSumBindGroup: GPUBindGroup[] = []
        let particleSortBindGroup: GPUBindGroup
        let bruteForceBindGroup: GPUBindGroup
        let particleComputeForcesBindGroup: GPUBindGroup
        let particleBufferBindGroup: GPUBindGroup
        let simOptionsBindGroup: GPUBindGroup
        let deltaTimeBindGroup: GPUBindGroup
        let cameraBindGroup: GPUBindGroup
        let offscreenTextureBindGroup: GPUBindGroup
        let composeHdrBindGroup: GPUBindGroup
        let glowOptionsBindGroup: GPUBindGroup
        let infiniteRenderOptionsBindGroup: GPUBindGroup
        let brushOptionsBindGroup: GPUBindGroup

        let particleBufferBindGroupLayout: GPUBindGroupLayout
        let binPrefixSumBindGroupLayout: GPUBindGroupLayout
        let particleBufferReadOnlyBindGroupLayout: GPUBindGroupLayout
        let binFillSizeBindGroupLayout: GPUBindGroupLayout
        let particleSortBindGroupLayout: GPUBindGroupLayout
        let bruteForceBindGroupLayout: GPUBindGroupLayout
        let particleComputeForcesBindGroupLayout: GPUBindGroupLayout
        let simOptionsBindGroupLayout: GPUBindGroupLayout
        let deltaTimeBindGroupLayout: GPUBindGroupLayout
        let cameraBindGroupLayout: GPUBindGroupLayout
        let offscreenTextureBindGroupLayout: GPUBindGroupLayout
        let composeHdrBindGroupLayout: GPUBindGroupLayout
        let glowOptionsBindGroupLayout: GPUBindGroupLayout
        let infiniteRenderOptionsBindGroupLayout: GPUBindGroupLayout
        let brushOptionsBindGroupLayout: GPUBindGroupLayout

        let isBrushErasing: boolean = false

        let particleErasePipeline: GPUComputePipeline;
        let particleCompactPipeline: GPUComputePipeline;
        let particleEraseBindGroupLayout: GPUBindGroupLayout;
        let particleCompactBindGroupLayout: GPUBindGroupLayout;
        let particleEraseBindGroup: GPUBindGroup;
        let particleCompactBindGroup: GPUBindGroup;
        let particleKeepFlagsBuffer: GPUBuffer | undefined;
        let newParticleCountBuffer: GPUBuffer | undefined;
        let newParticleCountReadBuffer: GPUBuffer | undefined;
        let particleCompactBuffer: GPUBuffer | undefined;

        onMounted(async () => {
            await initWebGPU()
            handleResize()
            setSimSizeBasedOnScreen()
            await initLife()

            useEventListener('resize', handleResize)
            useEventListener(canvasRef.value, ['mousedown'], (e) => {
                lastPointerX = e.x - canvasRef.value!.getBoundingClientRect().left
                lastPointerY = e.y - canvasRef.value!.getBoundingClientRect().top
                if (e.buttons === 2 && isBrushActive) { // if secondary button is pressed (right click)
                    if (brushType === 0) isBrushErasing = true
                    else isBrushDrawing = true
                }
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
                    if (e.buttons === 2 && isBrushActive) { // if secondary button is pressed (right click)
                        if (brushType === 0) isBrushErasing = true
                        else isBrushDrawing = true
                    }
                }
                else if (e.buttons === 0) {
                    isDragging = false
                    isBrushDrawing = false
                    isBrushErasing = false
                }
            })
            useEventListener(canvasRef.value, ['mouseup'], () => {
                isDragging = false
                isBrushDrawing = false
                isBrushErasing = false
            })
            useEventListener(canvasRef.value, 'wheel', (e) => {
                pointerX = e.x - canvasRef.value!.getBoundingClientRect().left
                pointerY = e.y - canvasRef.value!.getBoundingClientRect().top
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
            updateHdrTexture()
            cameraChanged = true
        }
        function updateCameraScaleFactors() {
            cameraScaleY = zoomFactor * 2.0 / CANVAS_HEIGHT
            cameraScaleX = cameraScaleY / (CANVAS_WIDTH / CANVAS_HEIGHT)
        }
        function setSimSizeBasedOnScreen() {
            particleLife.simWidth = SIM_WIDTH = baseSimWidth = CANVAS_WIDTH
            particleLife.simHeight = SIM_HEIGHT = baseSimHeight = CANVAS_HEIGHT
            updateCameraScaleFactors()
        }
        function setSimSize() {
            if (useSpatialHash && isWallWrap) {
                particleLife.simWidth = SIM_WIDTH = CELL_SIZE * Math.round(baseSimWidth / CELL_SIZE)
                particleLife.simHeight = SIM_HEIGHT = CELL_SIZE * Math.round(baseSimHeight / CELL_SIZE)
            }
            updateCameraScaleFactors()
            updateBinningParameters()
            updateOffscreenMirrorResources()
            updateInfiniteRenderOptions()
        }
        const updateBinningParameters = () => {
            const oldBinCount = binCount
            const oldPrefixSumIterations = prefixSumIterations

            // If no walls, set a larger grid size for better performance
            if (!isWallWrap && !isWallRepel) {
                const requestedFactor = 4
                const maxWorkgroups = device.limits.maxComputeWorkgroupsPerDimension
                const maxBinCount = maxWorkgroups * 64
                const baseBinCount = Math.ceil(SIM_WIDTH / CELL_SIZE) * Math.ceil(SIM_HEIGHT / CELL_SIZE)
                const maxPossibleFactor = Math.sqrt(maxBinCount / baseBinCount)
                const safeFactor = Math.min(requestedFactor, maxPossibleFactor * 0.9)
                const extensionX = (SIM_WIDTH * safeFactor - SIM_WIDTH) / 2
                const extensionY = (SIM_HEIGHT * safeFactor - SIM_HEIGHT) / 2

                EXTENDED_SIM_WIDTH = SIM_WIDTH + (extensionX * 2)
                EXTENDED_SIM_HEIGHT = SIM_HEIGHT + (extensionY * 2)
                EXTENDED_GRID_WIDTH = Math.ceil(EXTENDED_SIM_WIDTH / CELL_SIZE)
                EXTENDED_GRID_HEIGHT = Math.ceil(EXTENDED_SIM_HEIGHT / CELL_SIZE)
                GRID_OFFSET_X = Math.ceil(extensionX / CELL_SIZE)
                GRID_OFFSET_Y = Math.ceil(extensionY / CELL_SIZE)
                GRID_WIDTH = Math.ceil(SIM_WIDTH / CELL_SIZE)
                GRID_HEIGHT = Math.ceil(SIM_HEIGHT / CELL_SIZE)
                binCount = EXTENDED_GRID_WIDTH * EXTENDED_GRID_HEIGHT
            } else {
                GRID_WIDTH = Math.ceil(SIM_WIDTH / CELL_SIZE)
                GRID_HEIGHT = Math.ceil(SIM_HEIGHT / CELL_SIZE)
                binCount = GRID_WIDTH * GRID_HEIGHT
            }
            prefixSumIterations = Math.ceil(Math.ceil(Math.log2(binCount + 1)) / 2) * 2

            if (device && (oldBinCount !== binCount || oldPrefixSumIterations !== prefixSumIterations)) {
                updateBinningBuffers()
                if (!isInitializing) {
                    updateBinningBindGroups()
                    updateParticleBindGroups()
                }
            }
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
            zoomFactor = Math.max(0.15, Math.min(1000.0, zoomFactor * (1 + zoomDelta)))

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
        const initLife = async () => {
            isInitializing = true
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

            await nextTick()
            centerView()

            initColors()
            initParticles()
            createBuffers()
            createBindGroupLayouts()
            createPipelines()
            createBindGroups()

            isInitializing = false
            lastFrameTime = performance.now()
            animationFrameId = requestAnimationFrame(frame)
        }
        const regenerateLife = async () => {
            cancelAnimationLoop()
            destroyPipelinesAndBindGroups()
            await destroyBuffers(true)
            await initLife()
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        let pendingFrames: number = 0
        const frame = async () => {
            // Wait for the GPU to finish processing before starting a new frame (to avoid overloading the GPU)
            // Produces flickering if the GPU is not fast enough
            // if (pendingFrames > 3) {
            //     animationFrameId = requestAnimationFrame(frame)
            //     return
            // }

            if (isBrushErasing) await eraseWithBrush()

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
            lastFramePointerX = pointerX
            lastFramePointerY = pointerY

            // // Wait for the GPU to finish processing before starting a new frame
            // ++pendingFrames
            // device.queue.onSubmittedWorkDone().then(() => { --pendingFrames })

            animationFrameId = requestAnimationFrame(frame)
        }
        // -------------------------------------------------------------------------------------------------------------
        const handleDeltaTime = (startExecutionTime: number) => {
            const deltaTime = Math.min((startExecutionTime - lastFrameTime) / 1000, 0.1) // Cap deltaTime to avoid spikes
            lastFrameTime = startExecutionTime
            const lastSmoothedDeltaTime = smoothedDeltaTime
            smoothedDeltaTime = smoothedDeltaTime * (1 - 0.01) + deltaTime * 0.01 // Smooth the delta time

            // Only update the delta time buffer if it has changed significantly
            if (Math.round(lastSmoothedDeltaTime * 1000) !== Math.round(smoothedDeltaTime * 1000)) {
                device.queue.writeBuffer(deltaTimeBuffer!, 0, new Float32Array([smoothedDeltaTime]))
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        const step = () => {
            const encoder = device.createCommandEncoder()

            encoder.copyBufferToBuffer(particleBuffer!, 0, particleTempBuffer!, 0, particleBuffer!.size)

            if (useSpatialHash) computeBinning(encoder)
            else computeBruteForce(encoder)

            computeAdvance(encoder)

            renderParticles(encoder)
            device.queue.submit([encoder.finish()])
        }
        // -------------------------------------------------------------------------------------------------------------
        const computeBruteForce = (encoder: GPUCommandEncoder) => {
            const computePass = encoder.beginComputePass()
            computePass.setPipeline(bruteForceComputePipeline)
            computePass.setBindGroup(0, bruteForceBindGroup)
            computePass.setBindGroup(1, simOptionsBindGroup)
            computePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
            computePass.end()
        }
        const computeBinning = (encoder: GPUCommandEncoder) => {
            const binningComputePass = encoder.beginComputePass()
            binningComputePass.setPipeline(binClearSizePipeline)
            binningComputePass.setBindGroup(0, particleBufferReadOnlyBindGroup)
            binningComputePass.setBindGroup(1, simOptionsBindGroup)
            binningComputePass.setBindGroup(2, binFillSizeBindGroup)
            binningComputePass.dispatchWorkgroups(Math.ceil((binCount + 1) / 64))

            binningComputePass.setPipeline(binFillSizePipeline)
            binningComputePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))

            binningComputePass.setPipeline(binPrefixSumPipeline)
            for (let i = 0; i < prefixSumIterations; ++i) {
                binningComputePass.setBindGroup(0, binPrefixSumBindGroup[i % 2], [i * 256])
                binningComputePass.dispatchWorkgroups(Math.ceil((binCount + 1) / 64))
            }

            binningComputePass.setPipeline(particleSortClearSizePipeline)
            binningComputePass.setBindGroup(0, particleSortBindGroup)
            binningComputePass.dispatchWorkgroups(Math.ceil((binCount + 1) / 64))

            binningComputePass.setPipeline(particleSortPipeline)
            binningComputePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
            binningComputePass.end()

            const forcesComputePass = encoder.beginComputePass()
            forcesComputePass.setPipeline(particleComputeForcesPipeline)
            forcesComputePass.setBindGroup(0, particleComputeForcesBindGroup)
            forcesComputePass.setBindGroup(1, simOptionsBindGroup)
            forcesComputePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
            forcesComputePass.end()
        }
        const computeAdvance = (encoder: GPUCommandEncoder) => {
            if (isBrushDrawing) {
                updateBrushOptionsBuffer()

                const advanceBrushComputePass = encoder.beginComputePass()
                advanceBrushComputePass.setPipeline(particleAdvanceBrushPipeline)
                advanceBrushComputePass.setBindGroup(0, particleBufferBindGroup)
                advanceBrushComputePass.setBindGroup(1, simOptionsBindGroup)
                advanceBrushComputePass.setBindGroup(2, deltaTimeBindGroup)
                advanceBrushComputePass.setBindGroup(3, brushOptionsBindGroup)
                advanceBrushComputePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
                advanceBrushComputePass.end()
            } else {
                const advanceComputePass = encoder.beginComputePass()
                advanceComputePass.setPipeline(particleAdvancePipeline)
                advanceComputePass.setBindGroup(0, particleBufferBindGroup)
                advanceComputePass.setBindGroup(1, simOptionsBindGroup)
                advanceComputePass.setBindGroup(2, deltaTimeBindGroup)
                advanceComputePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
                advanceComputePass.end()
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const renderParticles = (encoder: GPUCommandEncoder) => {
            if (cameraChanged) {
                device.queue.writeBuffer(cameraBuffer!, 0, new Float32Array([
                    cameraCenter.x, cameraCenter.y, cameraScaleX, cameraScaleY
                ]))
                updateInfiniteRenderOptions()
                cameraChanged = false
            }

            if (isParticleGlow) {
                const hdrRenderPass = encoder.beginRenderPass({
                    colorAttachments: [{
                        view: hdrTextureView,
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    }],
                })
                hdrRenderPass.setBindGroup(0, particleBufferReadOnlyBindGroup)
                hdrRenderPass.setBindGroup(1, simOptionsBindGroup)
                hdrRenderPass.setBindGroup(2, cameraBindGroup)
                if (isMirrorWrap) {
                    hdrRenderPass.setBindGroup(3, glowOptionsBindGroup)
                    hdrRenderPass.setPipeline(renderMirrorGlowPipeline)
                    hdrRenderPass.draw(4, NUM_PARTICLES * mirrorWrapCount)
                    hdrRenderPass.setPipeline(isAdditiveBlending ? renderMirrorCirclePipelineAdditive : renderMirrorCirclePipeline)
                    hdrRenderPass.draw(4, NUM_PARTICLES * mirrorWrapCount)
                    hdrRenderPass.end()
                } else if (isInfiniteMirrorWrap) {
                    hdrRenderPass.setBindGroup(3, infiniteRenderOptionsBindGroup)
                    hdrRenderPass.setPipeline(renderInfiniteGlowPipeline)
                    hdrRenderPass.draw(4, infiniteTotalInstances)
                    hdrRenderPass.setPipeline(isAdditiveBlending ? renderInfiniteCirclePipelineAdditive : renderInfiniteCirclePipeline)
                    hdrRenderPass.draw(4, infiniteTotalInstances)
                    hdrRenderPass.end()
                } else {
                    hdrRenderPass.setBindGroup(3, glowOptionsBindGroup)
                    hdrRenderPass.setPipeline(renderGlowPipeline)
                    hdrRenderPass.draw(4, NUM_PARTICLES)
                    hdrRenderPass.setPipeline(isAdditiveBlending ? renderCirclePipelineAdditive : renderCirclePipeline)
                    hdrRenderPass.draw(4, NUM_PARTICLES)
                    hdrRenderPass.end()
                }
                const composePass = encoder.beginRenderPass({
                    colorAttachments: [{
                        view: ctx.getCurrentTexture().createView(),
                        loadOp: 'clear',
                        storeOp: 'store',
                    }],
                })
                composePass.setPipeline(composeHdrPipeline)
                composePass.setBindGroup(0, composeHdrBindGroup)
                composePass.draw(3)
                composePass.end()
            }
            else if (isMirrorWrap) {
                const renderPass = encoder.beginRenderPass({
                    colorAttachments: [{
                        view: ctx.getCurrentTexture().createView(),
                        loadOp: 'clear',
                        storeOp: 'store',
                        clearValue: { r: 0, g: 0, b: 0, a: 1 }
                    }]
                })
                renderPass.setPipeline(isAdditiveBlending ? renderMirrorPipelineAdditive : renderMirrorPipeline)
                renderPass.setBindGroup(0, particleBufferReadOnlyBindGroup)
                renderPass.setBindGroup(1, simOptionsBindGroup)
                renderPass.setBindGroup(2, cameraBindGroup)
                renderPass.setBindGroup(3, glowOptionsBindGroup)
                renderPass.draw(4, NUM_PARTICLES * mirrorWrapCount)
                renderPass.end()
            }
            else if (isInfiniteMirrorWrap) {
                // renderInfiniteMirrorWithOffscreenTexture(encoder)

                const renderPass = encoder.beginRenderPass({
                    colorAttachments: [{
                        view: ctx.getCurrentTexture().createView(),
                        loadOp: 'clear',
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        storeOp: 'store'
                    }]
                })
                renderPass.setPipeline(isAdditiveBlending ? renderInfinitePipelineAdditive : renderInfinitePipeline)
                renderPass.setBindGroup(0, particleBufferReadOnlyBindGroup)
                renderPass.setBindGroup(1, simOptionsBindGroup)
                renderPass.setBindGroup(2, cameraBindGroup)
                renderPass.setBindGroup(3, infiniteRenderOptionsBindGroup)
                renderPass.draw(4, infiniteTotalInstances)
                renderPass.end()
            }
            else {
                const renderPass = encoder.beginRenderPass({
                    colorAttachments: [{
                        view: ctx.getCurrentTexture().createView(),
                        loadOp: 'clear',
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        storeOp: 'store',
                    }],
                })
                renderPass.setPipeline(isAdditiveBlending ? renderPipelineAdditive : renderPipeline)
                renderPass.setBindGroup(0, particleBufferReadOnlyBindGroup)
                renderPass.setBindGroup(1, simOptionsBindGroup)
                renderPass.setBindGroup(2, cameraBindGroup)
                renderPass.draw(4, NUM_PARTICLES)
                renderPass.end()
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        const renderInfiniteMirrorWithOffscreenTexture = (encoder: GPUCommandEncoder) => {
            const renderOffscreenPass = encoder.beginRenderPass({
                colorAttachments: [{
                    view: offscreenTextureView,
                    loadOp: 'clear',
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    storeOp: 'store',
                }],
            })
            renderOffscreenPass.setPipeline(renderOffscreenPipeline)
            renderOffscreenPass.setBindGroup(0, particleBufferReadOnlyBindGroup)
            renderOffscreenPass.setBindGroup(1, simOptionsBindGroup)
            renderOffscreenPass.draw(4, NUM_PARTICLES)
            renderOffscreenPass.end()

            const renderInfinitePass = encoder.beginRenderPass({
                colorAttachments: [{
                    view: ctx.getCurrentTexture().createView(),
                    loadOp: 'clear',
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    storeOp: 'store'
                }]
            })
            renderInfinitePass.setPipeline(composeInfinitePipeline)
            renderInfinitePass.setBindGroup(0, cameraBindGroup)
            renderInfinitePass.setBindGroup(1, simOptionsBindGroup)
            renderInfinitePass.setBindGroup(2, offscreenTextureBindGroup)
            renderInfinitePass.draw(3, 1)
            renderInfinitePass.end()
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const createBuffers = () => {
            updateSimOptionsBuffer() // Set simulation options based on the store state
            updateInteractionMatrixBuffer() // Set interaction matrices based on the store state
            updateParticleBuffers(true)
            updateEraseCompactBuffers()
            updateBinningBuffers()
            updateColorBuffer()
            updateGlowOptionsBuffer()
            updateBrushOptionsBuffer()
            // ----------------------------------------------------------------------------------------------
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
                mappedAtCreation: true
            })
            new Float32Array(deltaTimeBuffer.getMappedRange()).set([smoothedDeltaTime])
            deltaTimeBuffer.unmap()

            const infiniteRenderOptionsData = new Int32Array(4) // startX, startY, numCopiesX, numCopiesY
            infiniteRenderOptionsBuffer = device.createBuffer({
                size: infiniteRenderOptionsData.byteLength,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            })
            new Int32Array(infiniteRenderOptionsBuffer.getMappedRange()).set(infiniteRenderOptionsData)
            infiniteRenderOptionsBuffer.unmap()
            updateInfiniteRenderOptions()

            newParticleCountBuffer = device.createBuffer({
                size: 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
            })
            newParticleCountReadBuffer = device.createBuffer({
                size: 4,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
            })
        }
        const updateColorBuffer = () => {
            if (colorBuffer) colorBuffer?.destroy(); colorBuffer = undefined;
            const paddedSize = Math.ceil(colors.byteLength / 16) * 16 // Ensure padded to 16 bytes
            colorBuffer = device.createBuffer({
                size: paddedSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            })
            new Float32Array(colorBuffer.getMappedRange()).set(colors)
            colorBuffer.unmap()
        }
        const updateParticleBuffers = (hasInitialParticles: boolean = false) => {
            if (particleBuffer) particleBuffer?.destroy(); particleBuffer = undefined;
            if (particleTempBuffer) particleTempBuffer?.destroy(); particleTempBuffer = undefined;

            particleBuffer = device.createBuffer({
                size: NUM_PARTICLES * 20,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE,
                mappedAtCreation: hasInitialParticles,
            })
            if (hasInitialParticles) {
                new Float32Array(particleBuffer.getMappedRange()).set(initialParticles)
                particleBuffer.unmap()
            }
            particleTempBuffer = device.createBuffer({
                size: particleBuffer.size,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            })
        }
        const updateEraseCompactBuffers = () => {
            if (particleKeepFlagsBuffer) particleKeepFlagsBuffer.destroy(); particleKeepFlagsBuffer = undefined
            if (particleCompactBuffer) particleCompactBuffer.destroy(); particleCompactBuffer = undefined
            particleKeepFlagsBuffer = device.createBuffer({
                size: NUM_PARTICLES * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            })
            particleCompactBuffer = device.createBuffer({
                size: NUM_PARTICLES * 5 * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
            })
        }
        const updateBinningBuffers = () => {
            if (binOffsetBuffer) binOffsetBuffer.destroy(); binOffsetBuffer = undefined;
            if (binOffsetTempBuffer) binOffsetTempBuffer.destroy(); binOffsetTempBuffer = undefined;
            if (binPrefixSumStepSizeBuffer) binPrefixSumStepSizeBuffer.destroy(); binPrefixSumStepSizeBuffer = undefined;

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
                mappedAtCreation: true
            })
            new Uint32Array(binPrefixSumStepSizeBuffer.getMappedRange()).set(binPrefixSumStepSize)
            binPrefixSumStepSizeBuffer.unmap()
        }
        // -------------------------------------------------------------------------------------------------------------
        const updateBrushOptionsBuffer = () => {
            const brushX = cameraCenter.x + (pointerX / CANVAS_WIDTH * 2 - 1) / cameraScaleX
            const brushY = cameraCenter.y + (pointerY / CANVAS_HEIGHT * 2 - 1) / cameraScaleY
            const brushVx = (pointerX - lastFramePointerX) / (cameraScaleX * CANVAS_WIDTH * 0.5) / smoothedDeltaTime
            const brushVy = (pointerY - lastFramePointerY) / (cameraScaleY * CANVAS_HEIGHT * 0.5) / smoothedDeltaTime

            const brushForce = brushType === 2 ? repulseForce : attractForce

            const brushOptionsData = new ArrayBuffer(28)
            const brushOptionsView = new DataView(brushOptionsData)
            brushOptionsView.setFloat32(0, brushX, true)
            brushOptionsView.setFloat32(4, brushY, true)
            brushOptionsView.setFloat32(8, brushVx, true)
            brushOptionsView.setFloat32(12, brushVy, true)
            brushOptionsView.setFloat32(16, brushRadius, true)
            brushOptionsView.setFloat32(20, brushForce, true)
            brushOptionsView.setFloat32(24, brushDirectionalForce, true)

            if (!brushOptionsBuffer) {
                brushOptionsBuffer = device.createBuffer({
                    size: brushOptionsData.byteLength,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                    mappedAtCreation: true,
                })
                new Uint8Array(brushOptionsBuffer.getMappedRange()).set(new Uint8Array(brushOptionsData))
                brushOptionsBuffer.unmap()
            } else {
                device.queue.writeBuffer(brushOptionsBuffer, 0, brushOptionsData)
            }
        }
        const updateInfiniteRenderOptions = () => {
            if (!isInfiniteMirrorWrap) return

            const viewWidth = 2.0 / cameraScaleX
            const viewHeight = 2.0 / cameraScaleY

            const viewLeft = cameraCenter.x - viewWidth / 2
            const viewRight = cameraCenter.x + viewWidth / 2
            const viewTop = cameraCenter.y - viewHeight / 2
            const viewBottom = cameraCenter.y + viewHeight / 2

            const startX = Math.floor(viewLeft / SIM_WIDTH)
            const endX = Math.ceil(viewRight / SIM_WIDTH)
            const startY = Math.floor(viewTop / SIM_HEIGHT)
            const endY = Math.ceil(viewBottom / SIM_HEIGHT)

            const numCopiesX = endX - startX
            const numCopiesY = endY - startY

            infiniteTotalInstances = NUM_PARTICLES * numCopiesX * numCopiesY

            device.queue.writeBuffer(infiniteRenderOptionsBuffer!, 0, new Int32Array([startX, startY, numCopiesX, numCopiesY]))
        }
        const updateGlowOptionsBuffer = () => {
            const glowOptionsData = new ArrayBuffer(12)
            const glowOptionsView = new DataView(glowOptionsData)
            glowOptionsView.setFloat32(0, glowSize, true)
            glowOptionsView.setFloat32(4, glowIntensity, true)
            glowOptionsView.setFloat32(8, glowSteepness, true)

            if (!glowOptionsBuffer) {
                glowOptionsBuffer = device.createBuffer({
                    size: glowOptionsData.byteLength,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                    mappedAtCreation: true,
                })
                new Uint8Array(glowOptionsBuffer.getMappedRange()).set(new Uint8Array(glowOptionsData))
                glowOptionsBuffer.unmap()
            } else {
                device.queue.writeBuffer(glowOptionsBuffer, 0, glowOptionsData)
            }
        }
        const updateSimOptionsBuffer = () => {
            const simOptionsData = new ArrayBuffer(76)
            const simOptionsView = new DataView(simOptionsData)
            simOptionsView.setFloat32(0, SIM_WIDTH, true)
            simOptionsView.setFloat32(4, SIM_HEIGHT, true)
            simOptionsView.setUint32(8, GRID_WIDTH, true)
            simOptionsView.setUint32(12, GRID_HEIGHT, true)
            simOptionsView.setFloat32(16, CELL_SIZE, true)
            simOptionsView.setUint32(20, NUM_PARTICLES, true)
            simOptionsView.setUint32(24, NUM_TYPES, true)
            simOptionsView.setFloat32(28, PARTICLE_SIZE, true)
            simOptionsView.setFloat32(32, particleOpacity, true)
            simOptionsView.setUint32(36, isWallRepel ? 1 : 0, true)
            simOptionsView.setUint32(40, isWallWrap ? 1 : 0, true)
            simOptionsView.setFloat32(44, forceFactor, true)
            simOptionsView.setFloat32(48, frictionFactor, true)
            simOptionsView.setFloat32(52, repel, true)
            // Extended grid parameters for spatial hashing no walls
            simOptionsView.setUint32(56, EXTENDED_GRID_WIDTH, true)
            simOptionsView.setUint32(60, EXTENDED_GRID_HEIGHT, true)
            simOptionsView.setUint32(64, GRID_OFFSET_X, true)
            simOptionsView.setUint32(68, GRID_OFFSET_Y, true)
            simOptionsView.setUint32(72, mirrorWrapCount, true)

            if (!simOptionsBuffer) {
                simOptionsBuffer = device.createBuffer({
                    size: simOptionsData.byteLength,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                    mappedAtCreation: true,
                })
                new Uint8Array(simOptionsBuffer.getMappedRange()).set(new Uint8Array(simOptionsData))
                simOptionsBuffer.unmap()
            } else {
                device.queue.writeBuffer(simOptionsBuffer, 0, simOptionsData)
            }
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
                if (interactionMatrixBuffer) interactionMatrixBuffer.destroy(); interactionMatrixBuffer = undefined;
                interactionMatrixBuffer = device.createBuffer({
                    size: paddedSize,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                    mappedAtCreation: true
                })
                new Uint8Array(interactionMatrixBuffer.getMappedRange()).set(paddedInteractionData)
                interactionMatrixBuffer.unmap()
            } else {
                device.queue.writeBuffer(interactionMatrixBuffer, 0, paddedInteractionData)
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const createBindGroups = () => {
            updateBinningBindGroups()
            updateParticleBindGroups()
            updateEraseCompactBindGroups()
            updateOffscreenTextureBindGroup()
            updateComposeHdrBindGroup()
            // ---------------------------------------------------------------------------------------------------------
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
            glowOptionsBindGroup = device.createBindGroup({
                layout: glowOptionsBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: glowOptionsBuffer! } },
                ],
            })
            infiniteRenderOptionsBindGroup = device.createBindGroup({
                layout: infiniteRenderOptionsBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: glowOptionsBuffer! } },
                    { binding: 1, resource: { buffer: infiniteRenderOptionsBuffer! } },
                ],
            })
            brushOptionsBindGroup = device.createBindGroup({
                layout: brushOptionsBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: brushOptionsBuffer! } },
                ],
            })
        }
        const updateBinningBindGroups = () => {
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
        }
        const updateParticleBindGroups = () => {
            particleBufferBindGroup = undefined as any;
            particleBufferReadOnlyBindGroup = undefined as any;
            particleSortBindGroup = undefined as any;
            particleComputeForcesBindGroup = undefined as any;
            bruteForceBindGroup = undefined as any;

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
            bruteForceBindGroup = device.createBindGroup({
                layout: bruteForceBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: particleTempBuffer! } },
                    { binding: 1, resource: { buffer: particleBuffer! } },
                    { binding: 2, resource: { buffer: interactionMatrixBuffer! } },
                ],
            })
        }
        const updateEraseCompactBindGroups = () => {
            particleEraseBindGroup = undefined as any;
            particleCompactBindGroup = undefined as any;

            particleEraseBindGroup = device.createBindGroup({
                layout: particleEraseBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: particleBuffer! } },
                    { binding: 1, resource: { buffer: particleKeepFlagsBuffer! } }
                ],
            })
            particleCompactBindGroup = device.createBindGroup({
                layout: particleCompactBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: particleBuffer! } },
                    { binding: 1, resource: { buffer: particleCompactBuffer! } },
                    { binding: 2, resource: { buffer: particleKeepFlagsBuffer! } },
                    { binding: 3, resource: { buffer: newParticleCountBuffer! } },
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
        const updateComposeHdrBindGroup = () => {
            composeHdrBindGroup = device.createBindGroup({
                layout: composeHdrBindGroupLayout,
                entries: [
                    { binding: 0, resource: hdrTextureView }
                ],
            })
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
                    { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } }, // colorBuffer
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
            bruteForceBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // particleTempBuffer
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // particleBuffer
                    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // interactionMatrixBuffer
                ],
            })
            simOptionsBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE | GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
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
            composeHdrBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'unfilterable-float' } }, // Texture for HDR rendering
                ],
            })
            glowOptionsBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }, // glowOptionsBuffer
                ],
            })
            infiniteRenderOptionsBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }, // glowOptionsBuffer
                    { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }, // infiniteRenderOptionsBuffer
                ],
            })
            brushOptionsBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } }, // brushOptionsBuffer
                ],
            })
            particleEraseBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // particleBuffer
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }        // particleKeepFlagsBuffer
                ]
            })
            particleCompactBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // oldParticleBuffer
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },         // newParticleBuffer
                    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } }, // particleKeepFlags
                    { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }          // newParticleCount
                ]
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const createPipelines = () => {
            createComputePipelines()
            createRenderPipelines()
            createHdrGlowPipelines()
        }
        const createComputePipelines = () => {
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
            const bruteForceShader = device.createShaderModule({ code: bruteForceShaderCode })
            bruteForceComputePipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        bruteForceBindGroupLayout,
                        simOptionsBindGroupLayout,
                    ],
                }),
                compute: { module: bruteForceShader, entryPoint: 'main' }
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
            const particleAdvanceBrushShader = device.createShaderModule({ code: particleAdvanceBrushShaderCode })
            particleAdvanceBrushPipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        particleBufferBindGroupLayout,
                        simOptionsBindGroupLayout,
                        deltaTimeBindGroupLayout,
                        brushOptionsBindGroupLayout
                    ],
                }),
                compute: { module: particleAdvanceBrushShader, entryPoint: 'particleAdvance' }
            })
            const particleEraseShader = device.createShaderModule({ code: particleEraseShaderCode })
            particleErasePipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleEraseBindGroupLayout, simOptionsBindGroupLayout, brushOptionsBindGroupLayout,],
                }),
                compute: { module: particleEraseShader, entryPoint: 'markForErase' }
            })
            const particleCompactShader = device.createShaderModule({ code: particleCompactShaderCode })
            particleCompactPipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleCompactBindGroupLayout, simOptionsBindGroupLayout]
                }),
                compute: { module: particleCompactShader, entryPoint: 'compactParticles',},
            })
        }
        const particleNormalBlending: GPUBlendState = {
            color: { operation: 'add', srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
            alpha: { operation: 'add', srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
        }
        const particleAdditiveBlending: GPUBlendState = {
            color: { operation: 'add', srcFactor: 'src-alpha', dstFactor: 'one' },
            alpha: { operation: 'add', srcFactor: 'one', dstFactor: 'one' },
        }
        const createRenderPipelines = () => {
            const renderShader = device.createShaderModule({ code: renderShaderCode })
            renderPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout],
                }),
                vertex: { module: renderShader, entryPoint: 'vertexMain' },
                fragment: { module: renderShader, entryPoint: 'fragmentMain', targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                    blend: particleNormalBlending
                }] },
                primitive: { topology: 'triangle-strip' }
            })
            renderPipelineAdditive = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout,],
                }),
                vertex: { module: renderShader, entryPoint: 'vertexMain'},
                fragment: { module: renderShader, entryPoint: 'fragmentMain', targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                    blend: particleAdditiveBlending
                }] },
                primitive: { topology: 'triangle-strip' }
            })
            // ---------------------------------------------------------------------------------------------------------
            const renderMirrorShader = device.createShaderModule({ code: renderMirrorShaderCode });
            renderMirrorPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, glowOptionsBindGroupLayout],
                }),
                vertex: { module: renderMirrorShader, entryPoint: 'mirrorVertex' },
                fragment: { module: renderMirrorShader, entryPoint: 'mirrorFragment', targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                    blend: particleNormalBlending
                }] },
                primitive: { topology: 'triangle-strip' }
            })
            renderMirrorPipelineAdditive = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, glowOptionsBindGroupLayout],
                }),
                vertex: { module: renderMirrorShader, entryPoint: 'mirrorVertex' },
                fragment: { module: renderMirrorShader, entryPoint: 'mirrorFragment', targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                    blend: particleAdditiveBlending
                }] },
                primitive: { topology: 'triangle-strip' }
            })
            // ---------------------------------------------------------------------------------------------------------
            const renderInfiniteShader = device.createShaderModule({ code: renderInfiniteShaderCode });
            renderInfinitePipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, infiniteRenderOptionsBindGroupLayout]
                }),
                vertex: { module: renderInfiniteShader, entryPoint: 'infiniteVertex' },
                fragment: { module: renderInfiniteShader, entryPoint: 'infiniteFragment', targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                    blend: particleNormalBlending
                }] },
                primitive: { topology: 'triangle-strip', stripIndexFormat: 'uint32' }
            })
            renderInfinitePipelineAdditive = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, infiniteRenderOptionsBindGroupLayout,]
                }),
                vertex: { module: renderInfiniteShader, entryPoint: 'infiniteVertex' },
                fragment: { module: renderInfiniteShader, entryPoint: 'infiniteFragment', targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                    blend: particleAdditiveBlending
                }] },
                primitive: { topology: 'triangle-strip', stripIndexFormat: 'uint32' }
            })
            // ---------------------------------------------------------------------------------------------------------
            const offscreenVertexShader = device.createShaderModule({ code: offscreenShaderCode })
            renderOffscreenPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout,],
                }),
                vertex: { module: offscreenVertexShader, entryPoint: 'vertexMain' },
                fragment: { module: renderShader, entryPoint: 'fragmentMain',
                    targets: [{ format: 'rgba8unorm' }]
                },
                primitive: { topology: 'triangle-strip' }
            })
            // ---------------------------------------------------------------------------------------------------------
            const infiniteCompositorShader = device.createShaderModule({ code: infiniteCompositorShaderCode })
            composeInfinitePipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [cameraBindGroupLayout, simOptionsBindGroupLayout, offscreenTextureBindGroupLayout],
                }),
                vertex: { module: infiniteCompositorShader, entryPoint: 'vertexInfinite' },
                fragment: { module: infiniteCompositorShader, entryPoint: 'fragmentInfinite',
                    targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }]
                },
                primitive: { topology: 'triangle-list' }
            })
        }
        const createHdrGlowPipelines = () => {
            const glowBlendOptions: GPUBlendState = {
                color: { operation: 'add', srcFactor: 'src-alpha', dstFactor: 'one' },
                alpha: { operation: 'add', srcFactor: 'one', dstFactor: 'one' },
            }
            // ---------------------------------------------------------------------------------------------------------
            const renderGlowShader = device.createShaderModule({ code: renderGlowShaderCode })
            renderGlowPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, glowOptionsBindGroupLayout]
                }),
                vertex: { module: renderGlowShader, entryPoint: 'vertexGlow' },
                fragment: { module: renderGlowShader, entryPoint: 'fragmentGlow', targets: [{
                    format: 'rgba16float',
                    blend: glowBlendOptions,
                }] },
                primitive: { topology: 'triangle-strip' },
            })
            renderCirclePipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, glowOptionsBindGroupLayout]
                }),
                vertex: { module: renderGlowShader, entryPoint: 'vertexCircle' },
                fragment: { module: renderGlowShader, entryPoint: 'fragmentCircle', targets: [{
                    format: 'rgba16float',
                    blend: particleNormalBlending,
                }] },
                primitive: { topology: 'triangle-strip' },
            })
            renderCirclePipelineAdditive = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, glowOptionsBindGroupLayout]
                }),
                vertex: { module: renderGlowShader, entryPoint: 'vertexCircle' },
                fragment: { module: renderGlowShader, entryPoint: 'fragmentCircle', targets: [{
                    format: 'rgba16float',
                    blend: particleAdditiveBlending,
                }] },
                primitive: { topology: 'triangle-strip' },
            })
            // ---------------------------------------------------------------------------------------------------------
            const renderMirrorShader = device.createShaderModule({ code: renderMirrorShaderCode });
            renderMirrorGlowPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, glowOptionsBindGroupLayout]
                }),
                vertex: { module: renderMirrorShader, entryPoint: 'mirrorVertexGlow' },
                fragment: { module: renderMirrorShader, entryPoint: 'mirrorFragmentGlow', targets: [{
                    format: 'rgba16float',
                    blend: glowBlendOptions,
                }] },
                primitive: { topology: 'triangle-strip' },
            })
            renderMirrorCirclePipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, glowOptionsBindGroupLayout]
                }),
                vertex: { module: renderMirrorShader, entryPoint: 'mirrorVertexCircle' },
                fragment: { module: renderMirrorShader, entryPoint: 'mirrorFragmentCircle', targets: [{
                    format: 'rgba16float',
                    blend: particleNormalBlending,
                }] },
                primitive: { topology: 'triangle-strip' },
            })
            renderMirrorCirclePipelineAdditive = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, glowOptionsBindGroupLayout]
                }),
                vertex: { module: renderMirrorShader, entryPoint: 'mirrorVertexCircle' },
                fragment: { module: renderMirrorShader, entryPoint: 'mirrorFragmentCircle', targets: [{
                    format: 'rgba16float',
                    blend: particleAdditiveBlending,
                }] },
                primitive: { topology: 'triangle-strip' },
            })
            // ---------------------------------------------------------------------------------------------------------
            const renderInfiniteShader = device.createShaderModule({ code: renderInfiniteShaderCode });
            renderInfiniteGlowPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, infiniteRenderOptionsBindGroupLayout]
                }),
                vertex: { module: renderInfiniteShader, entryPoint: 'infiniteVertexGlow' },
                fragment: { module: renderInfiniteShader, entryPoint: 'infiniteFragmentGlow', targets: [{
                    format: 'rgba16float',
                    blend: glowBlendOptions,
                }] },
                primitive: { topology: 'triangle-strip' },
            })
            renderInfiniteCirclePipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, infiniteRenderOptionsBindGroupLayout]
                }),
                vertex: { module: renderInfiniteShader, entryPoint: 'infiniteVertexCircle' },
                fragment: { module: renderInfiniteShader, entryPoint: 'infiniteFragmentCircle', targets: [{
                    format: 'rgba16float',
                    blend: particleNormalBlending,
                }] },
                primitive: { topology: 'triangle-strip' },
            })
            renderInfiniteCirclePipelineAdditive = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout, infiniteRenderOptionsBindGroupLayout]
                }),
                vertex: { module: renderInfiniteShader, entryPoint: 'infiniteVertexCircle' },
                fragment: { module: renderInfiniteShader, entryPoint: 'infiniteFragmentCircle', targets: [{
                    format: 'rgba16float',
                    blend: particleAdditiveBlending,
                }] },
                primitive: { topology: 'triangle-strip' },
            })
            // ---------------------------------------------------------------------------------------------------------
            const composeShader = device.createShaderModule({ code: composeHdrShaderCode });
            composeHdrPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [composeHdrBindGroupLayout]
                }),
                vertex: { module: composeShader, entryPoint: 'vertexMain' },
                fragment: { module: composeShader, entryPoint: 'fragmentMain',
                    targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }]
                },
                primitive: { topology: 'triangle-list' },
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const updateHdrTexture = () => {
            if (hdrTexture) hdrTexture.destroy(); hdrTexture = undefined;

            hdrTexture = device.createTexture({
                size: [CANVAS_WIDTH, CANVAS_HEIGHT],
                format: 'rgba16float',
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
                mipLevelCount: 1, // No mipmaps for HDR = -33% performance hit
                sampleCount: 1, // No multisampling (MSAA) for HDR = -75% memory and compute hit
            })
            hdrTextureView = hdrTexture.createView()

            if (composeHdrPipeline) {
                updateComposeHdrBindGroup()
            }
        }
        const updateOffscreenMirrorResources = () => {
            if (offscreenTexture) {
                offscreenTexture.destroy(); offscreenTexture = undefined;
            }
            if (!isInfiniteMirrorWrap) return

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

            if (isInfiniteMirrorWrap && composeInfinitePipeline) updateOffscreenTextureBindGroup()
        }
        const eraseWithBrush = async () => {
            if (isUpdatingParticles || !isBrushActive || brushType !== 0) return
            isUpdatingParticles = true
            await device.queue.onSubmittedWorkDone()

            try {
                updateBrushOptionsBuffer()

                const encoder = device.createCommandEncoder({ label: 'Erase and Compact Encoder' })
                encoder.clearBuffer(newParticleCountBuffer!, 0, 4)

                const markPass = encoder.beginComputePass({ label: 'Mark Pass' })
                markPass.setPipeline(particleErasePipeline)
                markPass.setBindGroup(0, particleEraseBindGroup)
                markPass.setBindGroup(1, simOptionsBindGroup)
                markPass.setBindGroup(2, brushOptionsBindGroup)
                markPass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
                markPass.end()

                const compactPass = encoder.beginComputePass({ label: 'Compact Pass' })
                compactPass.setPipeline(particleCompactPipeline)
                compactPass.setBindGroup(0, particleCompactBindGroup)
                compactPass.setBindGroup(1, simOptionsBindGroup)
                compactPass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
                compactPass.end()

                encoder.copyBufferToBuffer(newParticleCountBuffer!, 0, newParticleCountReadBuffer!, 0, 4)
                device.queue.submit([encoder.finish()])
                await device.queue.onSubmittedWorkDone()

                await newParticleCountReadBuffer!.mapAsync(GPUMapMode.READ)
                const newCount = new Uint32Array(newParticleCountReadBuffer!.getMappedRange())[0]
                newParticleCountReadBuffer!.unmap()

                if (newCount < NUM_PARTICLES) {
                    NUM_PARTICLES = newCount
                    particleLife.numParticles = newCount
                    updateParticleBuffers()

                    const copyEncoder = device.createCommandEncoder({ label: 'Copy Compacted Data' })
                    copyEncoder.copyBufferToBuffer(particleCompactBuffer!, 0, particleBuffer!, 0, newCount * 5 * 4)
                    device.queue.submit([copyEncoder.finish()])
                    await device.queue.onSubmittedWorkDone()

                    updateEraseCompactBuffers()
                    updateSimOptionsBuffer()
                    updateParticleBindGroups()
                    updateEraseCompactBindGroups()
                    updateInfiniteRenderOptions()
                }
            } catch (error) {
                console.error("Error during erase and compact operation:", error)
            } finally {
                isUpdatingParticles = false
            }
        }
        const updateNumParticles = useDebounceFn(async (newCount: number) => {
            if (isUpdatingParticles || newCount === NUM_PARTICLES) return
            isUpdatingParticles = true

            try {
                cancelAnimationLoop()

                const oldCount = NUM_PARTICLES
                const oldParticlesData = await readBufferFromGPU(particleBuffer!, oldCount * 5 * 4)
                const oldParticles = new Float32Array(oldParticlesData)
                initialParticles = new Float32Array(newCount * 5)

                if (newCount > oldCount) { // If increasing the number of particles
                    initialParticles.set(oldParticles)
                    for (let i = oldCount; i < newCount; i++) {
                        const baseIndex = i * 5
                        initialParticles[baseIndex] = Math.random() * SIM_WIDTH      // x
                        initialParticles[baseIndex + 1] = Math.random() * SIM_HEIGHT // y
                        initialParticles[baseIndex + 4] = Math.floor(Math.random() * NUM_TYPES) // type
                    }
                } else { // If decreasing the number of particles
                    initialParticles.set(oldParticles.subarray(0, newCount * 5))
                    for (let i = newCount; i < oldCount; i++) {
                        const j = Math.floor(Math.random() * (i + 1))
                        if (j < newCount) {
                            const oldStartIndex = i * 5
                            const newIndex = j * 5
                            initialParticles[newIndex] = oldParticles[oldStartIndex]         // x
                            initialParticles[newIndex + 1] = oldParticles[oldStartIndex + 1] // y
                            initialParticles[newIndex + 2] = oldParticles[oldStartIndex + 2] // vx
                            initialParticles[newIndex + 3] = oldParticles[oldStartIndex + 3] // vy
                            initialParticles[newIndex + 4] = oldParticles[oldStartIndex + 4] // type
                        }
                    }
                }

                NUM_PARTICLES = newCount
                updateParticleBuffers(true) // Destroy and recreate particle buffers
                updateEraseCompactBuffers()
                updateParticleBindGroups() // Recreate bind groups that depend on particle buffers
                updateEraseCompactBindGroups()
                updateSimOptionsBuffer() // Update simulation options buffer
                updateInfiniteRenderOptions() // Update infinite render options buffer

                lastFrameTime = performance.now()
                animationFrameId = requestAnimationFrame(frame)
            } finally {
                isUpdatingParticles = false
                await updateNumParticles(particleLife.numParticles) // Reset the debounce function
            }
        }, 16, { maxWait: 64 })
        const updateNumTypes = async (newNumTypes: number) => {
            if (isUpdatingParticles || newNumTypes === NUM_TYPES) return
            isUpdatingParticles = true
            try {
                cancelAnimationLoop()

                const particleDataBuffer = await readBufferFromGPU(particleBuffer!, NUM_PARTICLES * 5 * 4)
                const particles = new Float32Array(particleDataBuffer)

                if (newNumTypes < NUM_TYPES) {
                    for (let i = 0; i < NUM_PARTICLES; i++) {
                        const typeIndex = i * 5 + 4;
                        if (particles[typeIndex] >= newNumTypes) {
                            particles[typeIndex] = Math.floor(Math.random() * newNumTypes);
                        }
                    }
                } else if (newNumTypes > NUM_TYPES) {
                    for (let i = 0; i < NUM_PARTICLES; i++) {
                        if (Math.random() < (newNumTypes - NUM_TYPES) / newNumTypes) {
                            const typeIndex = i * 5 + 4;
                            particles[typeIndex] = NUM_TYPES + Math.floor(Math.random() * (newNumTypes - NUM_TYPES));
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

                const oldNumTypes = NUM_TYPES;
                NUM_TYPES = newNumTypes;

                setRulesMatrix(resizeMatrix(rulesMatrix, oldNumTypes, newNumTypes, () => {
                    return Number((Math.random() * 2 - 1).toFixed(4))
                }))
                setMinRadiusMatrix(resizeMatrix(minRadiusMatrix, oldNumTypes, newNumTypes, () => {
                    return Math.floor(Math.random() * (particleLife.minRadiusRange[1] - particleLife.minRadiusRange[0] + 1) + particleLife.minRadiusRange[0])
                }))
                setMaxRadiusMatrix(resizeMatrix(maxRadiusMatrix, oldNumTypes, newNumTypes, () => {
                    return Math.floor(Math.random() * (particleLife.maxRadiusRange[1] - particleLife.maxRadiusRange[0] + 1) + particleLife.maxRadiusRange[0])
                }))

                device.queue.writeBuffer(particleBuffer!, 0, particles)
                updateInteractionMatrixBuffer()
                updateSimOptionsBuffer()

                const paddedSize = Math.ceil(colors.byteLength / 16) * 16
                if (!colorBuffer || colorBuffer.size !== paddedSize) {
                    updateColorBuffer()
                    updateParticleBindGroups()
                } else {
                    const paddedColors = new Float32Array(paddedSize / 4)
                    paddedColors.set(colors)
                    device.queue.writeBuffer(colorBuffer!, 0, paddedColors)
                }

                await nextTick()
                lastFrameTime = performance.now()
                animationFrameId = requestAnimationFrame(frame)
            } finally {
                isUpdatingParticles = false
                await updateNumTypes(particleLife.numColors) // Reset the debounce function
            }
        }
        // -------------------------------------------------------------------------------------------------------------
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
            initialParticles = new Float32Array(NUM_PARTICLES * 5)
            for (let i = 0; i < NUM_PARTICLES; ++i) {
                const baseIndex = i * 5
                initialParticles[baseIndex] = Math.random() * SIM_WIDTH
                initialParticles[baseIndex + 1] = Math.random() * SIM_HEIGHT
                initialParticles[baseIndex + 4] = Math.floor(Math.random() * NUM_TYPES)
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
            for (let i = 0; i < NUM_TYPES; i++) {
                matrix.push([])
                for (let j = 0; j < NUM_TYPES; j++) {
                    const random = Math.floor(Math.random() * (max - min + 1) + min)
                    matrix[i].push(random)
                }
            }
            return matrix
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const updateSimWidth = (newWidth: number | Event) => {
            if (typeof(newWidth) !== 'number') return // Prevent input event like unfocus
            if (particleLife.linkProportions) particleLife.simHeight = SIM_HEIGHT = baseSimHeight = Math.round(SIM_HEIGHT * (newWidth / SIM_WIDTH))
            particleLife.simWidth = SIM_WIDTH = baseSimWidth = newWidth
            setSimSize()
            regenerateLife()
        }
        const updateSimHeight = (newHeight: number | Event) => {
            if (typeof(newHeight) !== 'number') return // Prevent input event like unfocus
            if (particleLife.linkProportions) particleLife.simWidth = SIM_WIDTH = baseSimWidth = Math.round(SIM_WIDTH * (newHeight / SIM_HEIGHT))
            particleLife.simHeight = SIM_HEIGHT = baseSimHeight = newHeight
            setSimSize()
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
                setCurrentMaxRadius(getCurrentMaxRadius())
            }
            updateInteractionMatrixBuffer()
        }
        const updateMaxMatrixValue = (x: number, y: number, value: number) => {
            particleLife.maxRadiusMatrix[x][y] = value
            maxRadiusMatrix[x][y] = value
            setCurrentMaxRadius(getCurrentMaxRadius())
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
            setCurrentMaxRadius(getCurrentMaxRadius())
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
        const setCurrentMaxRadius = (value: number) => {
            if (currentMaxRadius === value) return
            currentMaxRadius = value
            particleLife.currentMaxRadius = value
            CELL_SIZE = currentMaxRadius

            setSimSize()
            updateSimOptionsBuffer()
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
        function watchAndUpdateSimOptions(effect: any, callback: any) {
            watch(effect, (value) => {
                callback(value)
                updateSimOptionsBuffer()
            })
        }
        function watchAndUpdateGlowOptions(effect: any, callback: any) {
            watch(effect, (value) => {
                callback(value)
                updateGlowOptionsBuffer()
            })
        }
        watch(() => particleLife.numColors, (value: number) => updateNumTypes(value))
        watch(() => particleLife.isRunning, (value: boolean) => isRunning = value)
        watch(() => particleLife.useSpatialHash, (value: boolean) => useSpatialHash = value)
        watch(() => particleLife.isParticleGlow, (value: boolean) => isParticleGlow = value)
        watch(() => particleLife.isAdditiveBlending, (value: boolean) => isAdditiveBlending = value)
        watch(() => particleLife.isBrushActive, (value: boolean) => isBrushActive = value)
        watch(() => particleLife.brushType, (value: number) => brushType = value)
        watch(() => particleLife.brushRadius, (value: number) => brushRadius = value)
        watch(() => particleLife.repulseForce, (value: number) => repulseForce = value)
        watch(() => particleLife.attractForce, (value: number) => attractForce = -value)
        watch(() => particleLife.brushDirectionalForce, (value: number) => brushDirectionalForce = value)

        watchAndUpdateGlowOptions(() => particleLife.glowSize, (value: number) => glowSize = value)
        watchAndUpdateGlowOptions(() => particleLife.glowIntensity, (value: number) => glowIntensity = value)
        watchAndUpdateGlowOptions(() => particleLife.glowSteepness, (value: number) => glowSteepness = value)

        watchAndUpdateSimOptions(() => particleLife.particleOpacity, (value: number) => particleOpacity = value)
        watchAndUpdateSimOptions(() => particleLife.mirrorWrapCount, (value: number) => mirrorWrapCount = value)
        watchAndUpdateSimOptions(() => particleLife.particleSize, (value: number) => PARTICLE_SIZE = value)
        watchAndUpdateSimOptions(() => particleLife.repel, (value: number) => repel = value)
        watchAndUpdateSimOptions(() => particleLife.forceFactor, (value: number) => forceFactor = value)
        watchAndUpdateSimOptions(() => particleLife.frictionFactor, (value: number) => frictionFactor = value)

        let isUpdatingWallState = false
        watch([
            () => particleLife.isWallRepel,
            () => particleLife.isWallWrap,
            () => particleLife.isMirrorWrap,
            () => particleLife.isInfiniteMirrorWrap,
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

            setSimSize()
            if (changedProp === 'isWallWrap' || changedProp === 'isWallRepel' || (changedProp === 'isMirrorWrap' && newMirror && !oldWrap) || (changedProp === 'isInfiniteMirrorWrap' && newInfinite && !oldWrap)) {
                updateSimOptionsBuffer()
            }

            nextTick(() => {
                isUpdatingWallState = false
            })
        })
        // -------------------------------------------------------------------------------------------------------------
        const destroyBuffers = async (keepTexture: boolean = false) => {
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
            glowOptionsBuffer?.destroy(); glowOptionsBuffer = undefined;
            particleHashesBuffer?.destroy(); particleHashesBuffer = undefined;
            cellHeadsBuffer?.destroy(); cellHeadsBuffer = undefined;
            particleNextIndicesBuffer?.destroy(); particleNextIndicesBuffer = undefined;
            particleBuffer?.destroy(); particleBuffer = undefined;
            particleTempBuffer?.destroy(); particleTempBuffer = undefined;
            binOffsetBuffer?.destroy(); binOffsetBuffer = undefined;
            binOffsetTempBuffer?.destroy(); binOffsetTempBuffer = undefined;
            binPrefixSumStepSizeBuffer?.destroy(); binPrefixSumStepSizeBuffer = undefined;

            particleKeepFlagsBuffer?.destroy(); particleKeepFlagsBuffer = undefined;
            newParticleCountBuffer?.destroy(); newParticleCountBuffer = undefined;
            newParticleCountReadBuffer?.destroy(); newParticleCountReadBuffer = undefined;
            particleCompactBuffer?.destroy(); particleCompactBuffer = undefined;

            if (!keepTexture) {
                offscreenTexture?.destroy(); offscreenTexture = undefined;
                offscreenTextureView = undefined as any;
                offscreenSampler = undefined as any;
                hdrTexture?.destroy(); hdrTexture = undefined;
                hdrTextureView = undefined as any;
            }

            await nextTick() // Ensure GPU resources are cleaned up before creating new ones
        }
        const destroyPipelinesAndBindGroups = () => {
            particleErasePipeline = undefined as any;
            particleCompactPipeline = undefined as any;
            particleCompactBindGroup = undefined as any;
            particleCompactBindGroupLayout = undefined as any;
            particleEraseBindGroup = undefined as any;
            particleEraseBindGroupLayout = undefined as any;

            renderPipeline = undefined as any;
            renderOffscreenPipeline = undefined as any;
            composeInfinitePipeline = undefined as any;
            renderMirrorPipeline = undefined as any;
            renderGlowPipeline = undefined as any;
            renderCirclePipeline = undefined as any;
            renderMirrorGlowPipeline = undefined as any;
            renderMirrorCirclePipeline = undefined as any;
            composeHdrPipeline = undefined as any;

            renderPipelineAdditive = undefined as any;
            renderMirrorPipelineAdditive = undefined as any;
            renderInfinitePipelineAdditive = undefined as any;
            renderCirclePipelineAdditive = undefined as any;
            renderMirrorCirclePipelineAdditive = undefined as any;
            renderInfiniteCirclePipelineAdditive = undefined as any;

            binClearSizePipeline = undefined as any;
            binFillSizePipeline = undefined as any;
            binPrefixSumPipeline = undefined as any;
            particleSortClearSizePipeline = undefined as any;
            particleSortPipeline = undefined as any;
            bruteForceComputePipeline = undefined as any;
            particleComputeForcesPipeline = undefined as any;
            particleAdvancePipeline = undefined as any;

            particleBufferReadOnlyBindGroup = undefined as any;
            binFillSizeBindGroup = undefined as any;
            if (binPrefixSumBindGroup) {
                for (let i = 0; i < binPrefixSumBindGroup.length; i++) {
                    binPrefixSumBindGroup[i] = undefined as any;
                }
            }
            binPrefixSumBindGroup = [];
            particleSortBindGroup = undefined as any;
            bruteForceBindGroup = undefined as any;
            particleComputeForcesBindGroup = undefined as any;
            particleBufferBindGroup = undefined as any;
            simOptionsBindGroup = undefined as any;
            deltaTimeBindGroup = undefined as any;
            cameraBindGroup = undefined as any;
            offscreenTextureBindGroup = undefined as any;
            composeHdrBindGroup = undefined as any;
            glowOptionsBindGroup = undefined as any;
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
            updateSimWidth, updateSimHeight, updateNumParticles,
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

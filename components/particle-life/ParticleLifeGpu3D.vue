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
                            <p class="ml-2 px-2 py-0.5 rounded-lg ring-1 uppercase justify-center font-mono font-bold bg-fuchsia-600/20 text-fuchsia-400 ring-fuchsia-500/30">
                                GPU
                            </p>
                        </div>
                        <!--                        <ToggleSwitch inactive-label="2D" label="3D" colorful-label v-model="particleLife.is3D" />-->
                    </div>
                    <hr border-slate-500>
                    <div overflow-auto flex-1 flex flex-col gap-2 mt-2 pb-12 class="scrollableArea">
                        <Collapse label="Matrix Settings" icon="i-tabler-grid-4x4 text-indigo-500"
                                  tooltip="Modify matrix values by clicking on cells in the grid. <br>
                                  Adjust individual cell values with the slider, or click and drag to change them directly. <br>
                                  Use Ctrl + Click to select multiple cells for group adjustments. <br>
                                  If no cells are selected, the slider will adjust all values.">
                            <MatrixSettings :store="particleLife"></MatrixSettings>
                        </Collapse>
                        <Collapse label="World Settings" icon="i-tabler-world-cog text-cyan-500" opened>
                            <RangeInput input label="Particle Count"
                                        tooltip="Adjust the total number of particles. <br> More particles may reveal complex interactions but can increase computational demand."
                                        :min="16" :max="1048576" :step="16" v-model="particleLife.numParticles">
                            </RangeInput>
                            <RangeInput input label="Species Count"
                                        tooltip="Specify the number of particle colors. <br> Each color interacts with all others, with distinct forces and interaction ranges."
                                        :min="1" :max="16" :step="1" v-model="particleLife.numColors" mt-2>
                            </RangeInput>
                            <OptionBar name="wallStateGpu3D" v-model="particleLife.wallState" mb-2 :options="[
                                { id: 'none', label: 'None' },
                                { id: 'repel', label: 'Repel' },
                                { id: 'wrap', label: 'Wrap' }]">
                            </OptionBar>
                        </Collapse>
                        <Collapse label="Physics Settings" icon="i-tabler-atom text-fuchsia-500" opened>
                            <RangeInput input label="Repel Force"
                                        tooltip="Adjust the force that repels particles from each other. <br> Higher values increase the separation distance."
                                        :min="0.01" :max="4" :step="0.01" v-model="particleLife.repel">
                            </RangeInput>
                            <RangeInput input label="Force Multiplier"
                                        tooltip="Scales the interaction forces between particles. <br> Higher values make forces stronger and particles move faster."
                                        :min="0.01" :max="2" :step="0.01" v-model="particleLife.forceFactor" mt-2>
                            </RangeInput>
                            <RangeInput input label="Friction"
                                        tooltip="Controls how much friction slows particles down. <br> Higher values reduce speed and help stabilize the system."
                                        :min="0" :max="1" :step="0.01" v-model="particleLife.frictionFactor" mt-2>
                            </RangeInput>
                        </Collapse>
                    </div>
                    <div absolute bottom-2 right-0 z-100 class="-mr-px">
                        <button rounded-l-lg border border-slate-600 flex items-center p-1 bg="slate-900/85 hover:slate-950/85" @click="particleLife.sidebarLeftOpen = false">
                            <span i-tabler-chevron-left text-2xl></span>
                        </button>
                    </div>
                </div>
            </template>
            <template #bottom-actions>
                <button type="button" name="Randomize" aria-label="Randomize" title="Randomize simulation"
                        btn rounded-full flex items-center justify-center p-2 pointer-events-auto
                        class="backdrop-blur-sm bg-[#094F5D]/90 hover:bg-[#0B5F6F]/90"
                        @click="regenerateLife" :disabled="particleLife.isHudLocked">
                    <span i-game-icons-perspective-dice-six-faces-random text-2xl></span>
                </button>
            </template>
        </SidebarLeft>

        <canvas ref="canvasRef" id="canvasRef" @contextmenu.prevent w-full h-full cursor-crosshair></canvas>

        <div absolute top-0 right-0 flex flex-col items-end text-right pointer-events-none>
            <div flex items-center text-start text-xs pl-4 pr-1 bg-slate-800 rounded-bl-xl style="padding-bottom: 1px; opacity: 75%" >
                <div flex>Fps: <div ml-1 min-w-8>{{ fps }}</div></div>
                <!--                <div flex ml-3>Process: <div ml-1 min-w-7>{{ Math.round(executionTime) }}</div></div>-->
            </div>
        </div>

        <div fixed z-10 bottom-2 flex justify-center items-end pointer-events-none class="left-1/2 transform -translate-x-1/2"> <!-- faded-hover-effect -->
            <button type="button" name="Toggle Fullscreen" aria-label="Toggle Fullscreen" btn p2 rounded-full mx-1 flex items-center backdrop-blur-sm bg="slate-800/80 hover:slate-700/80" :disabled="particleLife.isHudLocked" @click="toggleFullscreen">
                <span :class="isFullscreen ? 'i-tabler-maximize-off' : 'i-tabler-maximize'"></span>
            </button>
            <button type="button" name="Zoom Out" aria-label="Zoom Out" btn p2 rounded-full mx-1 flex items-center backdrop-blur-sm bg="slate-800/80 hover:slate-700/80" :disabled="particleLife.isHudLocked" @click="handleZoom(-1, true)">
                <span i-tabler-zoom-out></span>
            </button>
            <button type="button" name="Play/Pause" aria-label="Play/Pause" btn p3 rounded-full mx-1 flex items-center backdrop-blur-sm bg="slate-800/80 hover:slate-700/80" :disabled="particleLife.isHudLocked" @click="particleLife.isRunning = !particleLife.isRunning">
                <span text-xl :class="particleLife.isRunning ? 'i-tabler-player-pause-filled' : 'i-tabler-player-play-filled'"></span>
            </button>
            <button type="button" name="Step" aria-label="Step" btn p2 rounded-full mx-1 flex items-center backdrop-blur-sm bg="slate-800/80 hover:slate-700/80" :disabled="particleLife.isRunning || particleLife.isHudLocked" @click="step">
                <span i-tabler-player-skip-forward-filled></span>
            </button>
            <button type="button" name="Zoom In" aria-label="Zoom In" btn p2 rounded-full mx-1 flex items-center backdrop-blur-sm bg="slate-800/80 hover:slate-700/80" :disabled="particleLife.isHudLocked" @click="handleZoom(1, true)">
                <span i-tabler-zoom-in></span>
            </button>
        </div>
        <SocialLinks />
    </section>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import MatrixSettings from "~/components/particle-life/MatrixSettings.vue";
import { RULES_OPTIONS, generateRules } from '~/helpers/utils/rulesGenerator';
import { PALETTE_OPTIONS, generateColors } from "~/helpers/utils/colorsGenerator";
import { mat4Perspective, mat4LookAt, mat4Mul } from "~/helpers/utils/camera3D";

import bruteForceShaderCode from 'assets/particle-life-gpu-3d/shaders/compute/compute_bruteForce.wgsl?raw';
import particleAdvanceShaderCode from 'assets/particle-life-gpu-3d/shaders/compute/particleAdvance.wgsl?raw';
import renderShaderCode from 'assets/particle-life-gpu-3d/shaders/render/render_normal.wgsl?raw';
import boxShaderCode from 'assets/particle-life-gpu-3d/shaders/render/render_box.wgsl?raw';
import BrushSettings from "~/components/particle-life/BrushSettings.vue";

export default defineComponent({
    name: 'ParticleLifeGpu',
    components: {BrushSettings, MatrixSettings },
    setup() {
        // Define refs and variables
        const mainContainer = ref<HTMLElement | null>(null)
        const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(mainContainer)
        // const { success, error } = useToasts()
        const particleLife = useParticleLifeGPU3DStore()
        const fps = useFps()
        const executionTime = ref<number>(0)
        const canvasRef = ref<HTMLCanvasElement | null>(null)
        let ctx: GPUCanvasContext
        let animationFrameId: number | null = null
        let lastFrameTime: number = performance.now()
        let isRunning: boolean = particleLife.isRunning
        let isInitializing: boolean = true
        let isUpdatingParticles: boolean = false // Flag to prevent multiple additions at once
        let isUpdateNumParticlesPending: boolean = false
        let isUpdateNumTypesPending: boolean = false
        let hasUpdateNumParticles: boolean = false

        let smoothedDeltaTime: number = 0.0083 // Initial value (1/120s)
        let CANVAS_WIDTH: number = 0
        let CANVAS_HEIGHT: number = 0
        let DEVICE_PIXEL_RATIO: number = 1
        let CANVAS_ASPECT_RATIO: number = 1
        let SIM_WIDTH: number = 0
        let SIM_HEIGHT: number = 0
        let SIM_DEPTH: number = 0
        let SIM_WIDTH_HALF: number = 0
        let SIM_HEIGHT_HALF: number = 0
        let SIM_DEPTH_HALF: number = 0
        let CELL_SIZE: number = 0
        // let CELL_SUBDIVISIONS: number = particleLife.cellSubdivisions
        let baseSimWidth: number = 0
        let baseSimHeight: number = 0
        let baseSimDepth: number = 0
        let GRID_WIDTH: number = 0
        let GRID_HEIGHT: number = 0
        let GRID_DEPTH: number = 0
        let binCount: number = 0
        let prefixSumIterations: number = 0

        let EXTENDED_GRID_WIDTH: number = 0
        let EXTENDED_GRID_HEIGHT: number = 0
        let EXTENDED_GRID_DEPTH: number = 0
        let GRID_OFFSET_X: number = 0
        let GRID_OFFSET_Y: number = 0
        let GRID_OFFSET_Z: number = 0
        let EXTENDED_SIM_WIDTH: number = 0
        let EXTENDED_SIM_HEIGHT: number = 0
        let EXTENDED_SIM_DEPTH: number = 0

        // Define color list and rules matrix for the particles
        let rulesMatrix: number[][] = [] // Rules matrix for each color
        let maxRadiusMatrix: number[][] = [] // Max radius matrix for each color
        let minRadiusMatrix: number[][] = [] // Min radius matrix for each color
        let currentMaxRadius: number = 0 // Max value between all colors max radius (for cell size)

        // Define the simulation properties
        let initialParticles: Float32Array // Initial particle x, y, vx, vy, type
        let colors: Float32Array // Particle colors

        // Define the properties for dragging and zooming
        let isDragging: boolean = false // Flag to check if the mouse is being dragged
        let lastPointerX: number = 0 // For dragging
        let lastPointerY: number = 0 // For dragging
        let pointerX: number = 0 // Pointer X
        let pointerY: number = 0 // Pointer Y
        let cameraChanged: boolean = true

        // Define camera properties
        const FOV_Y: number = 60 * Math.PI / 180
        const NEAR_PLANE: number = 0.05
        const FAR_PLANE: number = 100.0

        let zoomFactor: number = 1.5 // distance from focus point (zoom)
        let cameraYaw: number = 0 // rotation around Y (horizontal)
        let cameraPitch: number = 0 // rotation around X (vertical)
        let cameraTarget: [number, number, number] = [0, 0, 0] // pan offset in normalized world space

        const cameraRight: [number, number, number] = [1, 0, 0]
        const cameraUp: [number, number, number]    = [0, 1, 0]
        const cameraFwd: [number, number, number]   = [0, 0, -1]
        let cameraRotationChanged: boolean = true

        const CAMERA_BUFFER_SIZE = 80 // 80 bytes = 64 (mat4) + 16 (vec4 params), aligned to 16 (multiple of 16)
        const cameraData = new Float32Array(CAMERA_BUFFER_SIZE / 4)
        const cameraProjMatrix = new Float32Array(16)
        const cameraViewMatrix = new Float32Array(16)

        // Define variables for the simulation
        let repel: number = particleLife.repel // Repel force between particles
        let forceFactor: number = particleLife.forceFactor // Adjust the overall force applied between particles (can't be 0)
        let frictionFactor: number = particleLife.frictionFactor // Slow down the particles (0 to 1, where 0 is no friction)
        let NUM_PARTICLES: number = particleLife.numParticles
        let NEW_NUM_PARTICLES: number = NUM_PARTICLES
        let PARTICLE_SIZE: number = particleLife.particleSize
        let NUM_TYPES: number = particleLife.numColors
        let NEW_NUM_TYPES: number = NUM_TYPES
        let useSpatialHash: boolean = particleLife.useSpatialHash // Use spatial hash or brute force
        let isWallRepel: boolean = particleLife.isWallRepel // Enable walls X and Y for the particles
        let isWallWrap: boolean = particleLife.isWallWrap // Enable wrapping for the particles
        let isBoxWireframeActive: boolean = particleLife.isBoxWireframeActive // Show box wireframe

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
        let particleBuffer: GPUBuffer | undefined
        let particleTempBuffer: GPUBuffer | undefined

        let particleBufferReadOnlyBindGroup: GPUBindGroup
        let bruteForceBindGroup: GPUBindGroup
        let particleBufferBindGroup: GPUBindGroup
        let simOptionsBindGroup: GPUBindGroup
        let deltaTimeBindGroup: GPUBindGroup
        let cameraBindGroup: GPUBindGroup

        let particleBufferBindGroupLayout: GPUBindGroupLayout
        let particleBufferReadOnlyBindGroupLayout: GPUBindGroupLayout
        let bruteForceBindGroupLayout: GPUBindGroupLayout
        let simOptionsBindGroupLayout: GPUBindGroupLayout
        let deltaTimeBindGroupLayout: GPUBindGroupLayout
        let cameraBindGroupLayout: GPUBindGroupLayout

        let bruteForceComputePipeline: GPUComputePipeline
        let particleAdvancePipeline: GPUComputePipeline

        let renderPipeline: GPURenderPipeline
        let boxRenderPipeline: GPURenderPipeline

        let depthTexture: GPUTexture | undefined
        const DEPTH_FORMAT: GPUTextureFormat = 'depth24plus'

        onMounted(async () => {
            await initWebGPU()
            handleResize()
            setSimSizeBasedOnScreen()
            await initLife()

            useEventListener('resize', handleResize)
            useEventListener(canvasRef.value, ['mousedown'], (e) => {
                lastPointerX = (e.x - canvasRef.value!.getBoundingClientRect().left) * DEVICE_PIXEL_RATIO
                lastPointerY = (e.y - canvasRef.value!.getBoundingClientRect().top) * DEVICE_PIXEL_RATIO
            })
            useEventListener(canvasRef.value, ['mousemove'], (e) => {
                pointerX = (e.x - canvasRef.value!.getBoundingClientRect().left) * DEVICE_PIXEL_RATIO
                pointerY = (e.y - canvasRef.value!.getBoundingClientRect().top) * DEVICE_PIXEL_RATIO

                if (e.buttons > 0) { // if mouse is pressed
                    if (e.buttons === 1) { // if primary button is pressed (left click) -> pan
                        isDragging = true
                        handleMove()
                    }
                    if (e.buttons === 2) { // if secondary button is pressed (right click) -> rotate
                        isDragging = true
                        handleRotate()
                    }
                }
                else if (e.buttons === 0) {
                    isDragging = false
                }
            })
            useEventListener(canvasRef.value, ['mouseup'], () => {
                isDragging = false
            })
            useEventListener(canvasRef.value, 'mouseleave', () => {
                isDragging = false
            })
            useEventListener(canvasRef.value, 'wheel', (e) => {
                e.preventDefault()
                if (e.deltaY < 0) handleZoom(1) // Zoom in
                else handleZoom(-1) // Zoom out
            })
        })
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function handleResize() {
            DEVICE_PIXEL_RATIO = window.devicePixelRatio || 1
            CANVAS_WIDTH = canvasRef.value!.width = Math.round(canvasRef.value!.clientWidth * DEVICE_PIXEL_RATIO)
            CANVAS_HEIGHT = canvasRef.value!.height = Math.round(canvasRef.value!.clientHeight * DEVICE_PIXEL_RATIO)
            CANVAS_ASPECT_RATIO = (CANVAS_WIDTH > 0 && CANVAS_HEIGHT > 0) ? CANVAS_WIDTH / CANVAS_HEIGHT : 1
            updateDepthTexture()
            cameraChanged = true
        }
        function setSimSizeBasedOnScreen() {
            particleLife.simWidth = SIM_WIDTH = baseSimWidth = CANVAS_WIDTH
            particleLife.simHeight = SIM_HEIGHT = baseSimHeight = CANVAS_HEIGHT
            particleLife.simDepth = SIM_DEPTH = baseSimDepth = CANVAS_HEIGHT
            SIM_WIDTH_HALF = SIM_WIDTH * 0.5
            SIM_HEIGHT_HALF = SIM_HEIGHT * 0.5
            SIM_DEPTH_HALF = SIM_DEPTH * 0.5
        }
        function setSimSize() {
            SIM_WIDTH_HALF = SIM_WIDTH * 0.5
            SIM_HEIGHT_HALF = SIM_HEIGHT * 0.5
            SIM_DEPTH_HALF = SIM_DEPTH * 0.5
        }
        function centerView() {
            cameraYaw = 0
            cameraPitch = 0
            zoomFactor = 1.5
            cameraTarget = [0, 0, 0]
            cameraRotationChanged = true
            cameraChanged = true
        }
        const handleMove = () => {
            const dx = pointerX - lastPointerX
            const dy = pointerY - lastPointerY
            updateCameraAxes()
            const speed = zoomFactor / Math.max(1, CANVAS_HEIGHT)
            cameraTarget[0] += (-dx * cameraRight[0] + dy * cameraUp[0]) * speed
            cameraTarget[1] += (-dx * cameraRight[1] + dy * cameraUp[1]) * speed
            cameraTarget[2] += (-dx * cameraRight[2] + dy * cameraUp[2]) * speed

            lastPointerX = pointerX
            lastPointerY = pointerY
            cameraChanged = true
        }
        const handleRotate = () => {
            const dx = pointerX - lastPointerX
            const dy = pointerY - lastPointerY
            const radPerPixel = Math.PI / Math.max(1, CANVAS_HEIGHT)
            cameraYaw -= dx * radPerPixel
            cameraPitch += dy * radPerPixel
            const lim = Math.PI * 0.5
            if (cameraPitch > lim) cameraPitch = lim
            if (cameraPitch < -lim) cameraPitch = -lim

            lastPointerX = pointerX
            lastPointerY = pointerY
            cameraRotationChanged = true
            cameraChanged = true
        }
        function handleZoom(delta: number, isCentered: boolean = false) {
            const zoomIntensity = 0.15
            zoomFactor = Math.max(0.2, Math.min(20.0, zoomFactor * (1 - delta * zoomIntensity)))
            cameraChanged = true
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function updateCameraAxes() {
            if (!cameraRotationChanged) return
            const cp = Math.cos(cameraPitch), sp = Math.sin(cameraPitch)
            const cy = Math.cos(cameraYaw),   sy = Math.sin(cameraYaw)

            const fx = -sy * cp, fy = -sp, fz = -cy * cp
            let rx = -fz, rz = fx
            const rl = Math.hypot(rx, rz) || 1
            rx /= rl; rz /= rl

            cameraRight[0] = rx; cameraRight[1] = 0; cameraRight[2] = rz
            cameraUp[0] = -rz * fy; cameraUp[1] = rz * fx - rx * fz; cameraUp[2] = rx * fy
            cameraFwd[0] = fx; cameraFwd[1] = fy; cameraFwd[2] = fz

            cameraRotationChanged = false
        }
        function computeCameraEye(): [number, number, number] {
            const cp = Math.cos(cameraPitch), sp = Math.sin(cameraPitch)
            const cy = Math.cos(cameraYaw),   sy = Math.sin(cameraYaw)
            // eye = target + R * (0,0,distance)
            const dirX = sy * cp
            const dirY = sp
            const dirZ = cy * cp
            return [
                cameraTarget[0] + dirX * zoomFactor,
                cameraTarget[1] + dirY * zoomFactor,
                cameraTarget[2] + dirZ * zoomFactor
            ]
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const initWebGPU = async () => {
            const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
            if (!adapter) throw new Error("WebGPU adapter not found")
            device = await adapter.requestDevice()
            ctx = canvasRef.value!.getContext('webgpu')!
            ctx.configure({
                device,
                format: navigator.gpu.getPreferredCanvasFormat(),
                alphaMode: 'opaque',
                colorSpace: 'srgb',
            })
        }
        const initLife = async (autoCenter: boolean = true) => {
            isInitializing = true
            setRulesMatrix(generateRules(0, NUM_TYPES)) // Random rule
            setMinRadiusMatrix(makeRandomMinRadiusMatrix())
            setMaxRadiusMatrix(makeRandomMaxRadiusMatrix())

            console.log("Rules Matrix:", rulesMatrix);
            console.log("Min Radius Matrix:", minRadiusMatrix);
            console.log("Max Radius Matrix:", maxRadiusMatrix);

            await nextTick()
            if (autoCenter) centerView()

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
            await initLife(false)
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const frame = async () => {
            const startExecutionTime = performance.now()
            if (isRunning) {
                handleDeltaTime(startExecutionTime)
                step()
            } else {
                const encoder = device.createCommandEncoder()
                renderParticles(encoder)
                device.queue.submit([encoder.finish()])
            }

            hasUpdateNumParticles = false

            animationFrameId = requestAnimationFrame(frame)
        }
        // -------------------------------------------------------------------------------------------------------------
        const step = () => {
            const encoder = device.createCommandEncoder()

            encoder.copyBufferToBuffer(particleBuffer!, 0, particleTempBuffer!, 0, particleBuffer!.size)
            computeBruteForce(encoder)
            computeAdvance(encoder)
            renderParticles(encoder)

            device.queue.submit([encoder.finish()])
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
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const computeBruteForce = (encoder: GPUCommandEncoder) => {
            const computePass = encoder.beginComputePass()
            computePass.setPipeline(bruteForceComputePipeline)
            computePass.setBindGroup(0, bruteForceBindGroup)
            computePass.setBindGroup(1, simOptionsBindGroup)
            computePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
            computePass.end()
        }
        const computeAdvance = (encoder: GPUCommandEncoder) => {
            const advanceComputePass = encoder.beginComputePass()
            advanceComputePass.setPipeline(particleAdvancePipeline)
            advanceComputePass.setBindGroup(0, particleBufferBindGroup)
            advanceComputePass.setBindGroup(1, simOptionsBindGroup)
            advanceComputePass.setBindGroup(2, deltaTimeBindGroup)
            advanceComputePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
            advanceComputePass.end()
        }
        const renderParticles = (encoder: GPUCommandEncoder) => {
            if (cameraChanged) {
                updateCameraBuffer()
                cameraChanged = false
            }

            const renderPass = encoder.beginRenderPass({
                colorAttachments: [{
                    view: ctx.getCurrentTexture().createView(),
                    loadOp: 'clear',
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    storeOp: 'store',
                }],
                depthStencilAttachment: {
                    view: depthTexture!.createView(),
                    depthLoadOp: 'clear',
                    depthClearValue: 1.0,
                    depthStoreOp: 'store',
                },
            })
            renderPass.setPipeline(renderPipeline)
            renderPass.setBindGroup(0, particleBufferReadOnlyBindGroup)
            renderPass.setBindGroup(1, simOptionsBindGroup)
            renderPass.setBindGroup(2, cameraBindGroup)
            renderPass.draw(4, NUM_PARTICLES)

            if (isBoxWireframeActive) renderBoxWireframe(renderPass)

            renderPass.end()
        }
        const renderBoxWireframe = (renderPass: GPURenderPassEncoder) => {
            renderPass.setPipeline(boxRenderPipeline)
            renderPass.setBindGroup(0, simOptionsBindGroup)
            renderPass.setBindGroup(1, cameraBindGroup)
            renderPass.draw(24, 1)
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function initColors() {
            colors = generateColors(particleLife.selectedColorPaletteOption, NUM_TYPES)
            particleLife.currentColors = colors // Ensure the store is updated with the initial colors
        }
        function initParticles() {
            // initialParticles = generatePositions(particleLife.selectedColorPaletteOption, NUM_PARTICLES, NUM_TYPES, SIM_WIDTH, SIM_HEIGHT)
            const positions = new Float32Array(NUM_PARTICLES * 7)
            for (let i = 0; i < NUM_PARTICLES; ++i) {
                const baseIndex = i * 7
                positions[baseIndex] = Math.random() * SIM_WIDTH
                positions[baseIndex + 1] = Math.random() * SIM_HEIGHT
                positions[baseIndex + 2] = Math.random() * SIM_HEIGHT // later a custom deepness
                positions[baseIndex + 6] = Math.floor(Math.random() * NUM_TYPES)
            }
            initialParticles = positions
            console.log("initParticles")
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
        // -------------------------------------------------------------------------------------------------------------
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
            // CELL_SIZE = Math.max(1, Math.ceil(currentMaxRadius / CELL_SUBDIVISIONS))

            setSimSize()
            updateSimOptionsBuffer()
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function updateCameraBuffer() {
            mat4Perspective(cameraProjMatrix, FOV_Y, CANVAS_ASPECT_RATIO, NEAR_PLANE, FAR_PLANE)
            const eye = computeCameraEye()
            mat4LookAt(cameraViewMatrix, eye, cameraTarget, [0, 1, 0])
            mat4Mul(cameraData, cameraProjMatrix, cameraViewMatrix)

            cameraData[16] = CANVAS_ASPECT_RATIO
            cameraData[17] = FOV_Y
            cameraData[18] = NEAR_PLANE
            cameraData[19] = FAR_PLANE

            if (!cameraBuffer) {
                cameraBuffer = device.createBuffer({
                    size: CAMERA_BUFFER_SIZE,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                    mappedAtCreation: true
                })
                new Float32Array(cameraBuffer.getMappedRange()).set(cameraData)
                cameraBuffer.unmap()
            } else {
                device.queue.writeBuffer(cameraBuffer, 0, cameraData)
            }
        }
        const updateSimOptionsBuffer = () => {
            const simOptionsData = new ArrayBuffer(88)
            const simOptionsView = new DataView(simOptionsData)
            simOptionsView.setFloat32(0,  SIM_WIDTH, true)
            simOptionsView.setFloat32(4,  SIM_HEIGHT, true)
            simOptionsView.setFloat32(8,  SIM_DEPTH, true)
            simOptionsView.setUint32(12,  GRID_WIDTH, true)
            simOptionsView.setUint32(16,  GRID_HEIGHT, true)
            simOptionsView.setUint32(20,  GRID_DEPTH, true)
            simOptionsView.setFloat32(24, CELL_SIZE, true)
            simOptionsView.setUint32(28,  NUM_PARTICLES, true)
            simOptionsView.setUint32(32,  NUM_TYPES, true)
            simOptionsView.setFloat32(36, PARTICLE_SIZE, true)
            simOptionsView.setFloat32(40, (particleLife as any).particleOpacity ?? 1, true)
            simOptionsView.setUint32(44,  isWallRepel ? 1 : 0, true)
            simOptionsView.setUint32(48,  isWallWrap ? 1 : 0, true)
            simOptionsView.setFloat32(52, forceFactor, true)
            simOptionsView.setFloat32(56, frictionFactor, true)
            simOptionsView.setFloat32(60, repel, true)
            // Extended grid parameters for spatial hashing no walls
            simOptionsView.setUint32(64,  EXTENDED_GRID_WIDTH, true)
            simOptionsView.setUint32(68,  EXTENDED_GRID_HEIGHT, true)
            simOptionsView.setUint32(72,  EXTENDED_GRID_DEPTH, true)
            simOptionsView.setUint32(76,  GRID_OFFSET_X, true)
            simOptionsView.setUint32(80,  GRID_OFFSET_Y, true)
            simOptionsView.setUint32(84,  GRID_OFFSET_Z, true)

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
        const updateParticleBuffers = (hasInitialParticles: boolean = false) => {
            if (particleBuffer) particleBuffer?.destroy(); particleBuffer = undefined;
            if (particleTempBuffer) particleTempBuffer?.destroy(); particleTempBuffer = undefined;

            particleBuffer = device.createBuffer({
                size: NUM_PARTICLES * 28,
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
        const updateColorBuffer = () => {
            const paddedSize = Math.ceil(colors.byteLength / 16) * 16 // Ensure padded to 16 bytes
            if (!colorBuffer || colorBuffer.size !== paddedSize) {
                if (colorBuffer) colorBuffer?.destroy(); colorBuffer = undefined;
                colorBuffer = device.createBuffer({
                    size: paddedSize,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                    mappedAtCreation: true
                })
                new Float32Array(colorBuffer.getMappedRange()).set(colors)
                colorBuffer.unmap()
            } else {
                const paddedColors = new Float32Array(paddedSize / 4)
                paddedColors.set(colors)
                device.queue.writeBuffer(colorBuffer!, 0, paddedColors)
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const createBuffers = () => {
            updateSimOptionsBuffer() // Set simulation options based on the store state
            updateInteractionMatrixBuffer() // Set interaction matrices based on the store state
            updateParticleBuffers(true)
            updateColorBuffer()
            updateCameraBuffer()
            // ----------------------------------------------------------------------------------------------
            deltaTimeBuffer = device.createBuffer({
                size: 4,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            })
            new Float32Array(deltaTimeBuffer.getMappedRange()).set([smoothedDeltaTime])
            deltaTimeBuffer.unmap()
        }
        // -------------------------------------------------------------------------------------------------------------
        const createBindGroups = () => {
            updateParticleBindGroups()
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
        }
        const updateParticleBindGroups = () => {
            particleBufferBindGroup = undefined as any;
            particleBufferReadOnlyBindGroup = undefined as any;
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
            bruteForceBindGroup = device.createBindGroup({
                layout: bruteForceBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: particleTempBuffer! } },
                    { binding: 1, resource: { buffer: particleBuffer! } },
                    { binding: 2, resource: { buffer: interactionMatrixBuffer! } },
                ],
            })
        }
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
                    { binding: 0, visibility: GPUShaderStage.COMPUTE | GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }, // deltaTimeBuffer
                ],
            })
            cameraBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }, // cameraBuffer
                ],
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        const createPipelines = () => {
            createComputePipelines()
            createRenderPipelines()
        }
        const createComputePipelines = () => {
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
        }
        const particleNormalBlending: GPUBlendState = {
            color: { operation: 'add', srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
            alpha: { operation: 'add', srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
        }
        const createRenderPipelines = () => {
            const renderShader = device.createShaderModule({code: renderShaderCode})
            renderPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [particleBufferReadOnlyBindGroupLayout, simOptionsBindGroupLayout, cameraBindGroupLayout],
                }),
                vertex: { module: renderShader, entryPoint: 'vertexMain' },
                fragment: {
                    module: renderShader, entryPoint: 'fragmentMain', targets: [{
                        format: navigator.gpu.getPreferredCanvasFormat(),
                        blend: particleNormalBlending
                    }]
                },
                primitive: {topology: 'triangle-strip'},
                depthStencil: {
                    format: DEPTH_FORMAT,
                    depthWriteEnabled: true,
                    depthCompare: 'less',
                },
            })

            const boxShader = device.createShaderModule({ code: boxShaderCode })
            boxRenderPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [simOptionsBindGroupLayout, cameraBindGroupLayout],
                }),
                vertex: { module: boxShader, entryPoint: 'vertexMain' },
                fragment: {
                    module: boxShader, entryPoint: 'fragmentMain', targets: [{
                        format: navigator.gpu.getPreferredCanvasFormat(),
                        blend: particleNormalBlending,
                    }],
                },
                primitive: { topology: 'line-list' },
                depthStencil: {
                    format: DEPTH_FORMAT,
                    depthWriteEnabled: false,
                    depthCompare: 'less-equal',
                },
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function updateDepthTexture() {
            if (depthTexture) depthTexture.destroy(); depthTexture = undefined;
            depthTexture = device.createTexture({
                size: [CANVAS_WIDTH, CANVAS_HEIGHT, 1],
                format: DEPTH_FORMAT,
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function watchAndUpdateSimOptions(effect: any, callback: any) {
            watch(effect, (value) => {
                callback(value)
                updateSimOptionsBuffer()
            })
        }

        watch(() => particleLife.isRunning, (value: boolean) => isRunning = value)
        watch(() => particleLife.useSpatialHash, (value: boolean) => useSpatialHash = value)

        watchAndUpdateSimOptions(() => particleLife.particleSize, (value: number) => PARTICLE_SIZE = value)
        watchAndUpdateSimOptions(() => particleLife.repel, (value: number) => repel = value)
        watchAndUpdateSimOptions(() => particleLife.forceFactor, (value: number) => forceFactor = value)
        watchAndUpdateSimOptions(() => particleLife.frictionFactor, (value: number) => frictionFactor = value)

        watch(() => particleLife.minRadiusRange, (value: number[]) => {
            if (value[0] > value[1]) particleLife.minRadiusRange[0] = value[1]
            if (value[1] > particleLife.maxRadiusRange[0]) particleLife.maxRadiusRange[0] = value[1]
        }, { deep: true })
        watch(() => particleLife.maxRadiusRange, (value: number[]) => {
            if (value[0] > value[1]) particleLife.maxRadiusRange[1] = value[0]
            if (value[0] < particleLife.minRadiusRange[1]) particleLife.minRadiusRange[1] = value[0]
        }, { deep: true })

        watch([() => particleLife.isWallRepel, () => particleLife.isWallWrap,], () => {
            isWallRepel = particleLife.isWallRepel
            isWallWrap = particleLife.isWallWrap
            setSimSize()
            updateSimOptionsBuffer()
        })
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const cancelAnimationLoop = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
                animationFrameId = null
            }
        }
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

            particleBuffer?.destroy(); particleBuffer = undefined;
            particleTempBuffer?.destroy(); particleTempBuffer = undefined;

            if (!keepTexture) {
                depthTexture?.destroy(); depthTexture = undefined;
            }

            await nextTick() // Ensure GPU resources are cleaned up before creating new ones
        }
        const destroyPipelinesAndBindGroups = () => {
            bruteForceComputePipeline = undefined as any;
            particleAdvancePipeline = undefined as any;
            renderPipeline = undefined as any;
            boxRenderPipeline = undefined as any;

            particleBufferReadOnlyBindGroup = undefined as any;
            bruteForceBindGroup = undefined as any;
            particleBufferBindGroup = undefined as any;
            simOptionsBindGroup = undefined as any;
            deltaTimeBindGroup = undefined as any;
            cameraBindGroup = undefined as any;
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        onUnmounted(() => {
            cancelAnimationLoop()
            destroyPipelinesAndBindGroups()
            destroyBuffers()
            // particleLife.$reset()
        })

        return {
            particleLife, canvasRef, fps, executionTime,
            handleZoom, toggleFullscreen, isFullscreen, regenerateLife, step,
        }
    }
})
</script>

<style scoped>
canvas {
    background: black;
}
</style>
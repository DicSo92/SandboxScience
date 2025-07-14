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
                        <Collapse label="World Settings" icon="i-tabler-world-cog" opened mt-2>
                            <RangeInput input label="Particle Number"
                                        tooltip="Adjust the total number of particles. <br> More particles may reveal complex interactions but can increase computational demand."
                                        :min="16" :max="100000" :step="16" v-model="particleLife.numParticles">
                            </RangeInput>
                            <RangeInput input label="Color Number"
                                        tooltip="Specify the number of particle colors. <br> Each color interacts with all others, with distinct forces and interaction ranges."
                                        :min="1" :max="20" :step="1" v-model="particleLife.numColors" mt-2>
                            </RangeInput>

                            <div mb-2>
                                <WallStateSelection :store="particleLife" />
                            </div>
                            <ToggleSwitch inactive-label="BruteForce" label="SpatialHash" colorful-label v-model="particleLife.useSpatialHash" />
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
import buildHashShaderCode from 'assets/particle-life-gpu/shaders/compute_buildHash.wgsl?raw';
import clearHashShaderCode from 'assets/particle-life-gpu/shaders/compute_clearHash.wgsl?raw';
import bruteForceShaderCode from '~/assets/particle-life-gpu/shaders/compute_bruteForce.wgsl?raw';
import spatialHashShaderCode from '~/assets/particle-life-gpu/shaders/compute_spatialHash.wgsl?raw';
import vertexShaderCode from '~/assets/particle-life-gpu/shaders/render_vertex.wgsl?raw';
import fragmentShaderCode from '~/assets/particle-life-gpu/shaders/render_fragment.wgsl?raw';
import BrushSettings from "~/components/particle-life/BrushSettings.vue";
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
        let zoomFactor = 1.0
        let cameraCenter = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
        let isDragging: boolean = false // Flag to check if the mouse is being dragged
        let lastPointerX: number = 0 // For dragging
        let lastPointerY: number = 0 // For dragging
        let pointerX: number = 0 // Pointer X
        let pointerY: number = 0 // Pointer Y
        let cameraChanged = true

        // Define the GPU device, pipelines, and bind groups
        let device: GPUDevice
        let renderPipeline: GPURenderPipeline
        let clearHashPipeline: GPUComputePipeline
        let buildHashPipeline: GPUComputePipeline
        let bruteForceComputePipeline: GPUComputePipeline
        let spatialHashComputePipeline: GPUComputePipeline
        let renderBindGroup: GPUBindGroup
        let clearHashBindGroup: GPUBindGroup
        let buildHashBindGroup: GPUBindGroup
        let bruteForceComputeBindGroup: GPUBindGroup
        let spatialHashComputeBindGroup: GPUBindGroup

        // Define the buffers
        let currentPositionBuffer: GPUBuffer | undefined
        let nextPositionBuffer: GPUBuffer | undefined
        let velocityBuffer: GPUBuffer | undefined
        let typeBuffer: GPUBuffer | undefined
        let typeBufferPacked: GPUBuffer | undefined // Packed type buffer for compute shader
        let colorBuffer: GPUBuffer | undefined
        let deltaTimeBuffer: GPUBuffer | undefined
        let triangleVertexBuffer: GPUBuffer | undefined
        let cameraBuffer: GPUBuffer | undefined
        let interactionMatrixBuffer: GPUBuffer | undefined
        let simOptionsBuffer: GPUBuffer | undefined
        let particleHashesBuffer: GPUBuffer | undefined
        let cellHeadsBuffer: GPUBuffer | undefined
        let particleNextIndicesBuffer: GPUBuffer | undefined

        // Define variables for the simulation
        let repel: number = particleLife.repel // Repel force between particles
        let forceFactor: number = particleLife.forceFactor // Decrease will increase the impact of the force on the velocity (the higher the value, the slower the particles will move) (can't be 0)
        let frictionFactor: number = particleLife.frictionFactor // Slow down the particles (0 to 1, where 1 is no friction)
        let NUM_PARTICLES: number = particleLife.numParticles
        let PARTICLE_SIZE: number = particleLife.particleSize
        let NUM_TYPES: number = particleLife.numColors
        let isWallRepel: boolean = particleLife.isWallRepel // Enable walls X and Y for the particles
        let isWallWrap: boolean = particleLife.isWallWrap // Enable wrapping for the particles
        let useSpatialHash: boolean = particleLife.useSpatialHash // Use spatial hash or brute force

        onMounted(async () => {
            await initWebGPU()
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
        }
        function setSimSizeWhenWrapped() { // Set the grid size when the walls are wrapped
            if (!useSpatialHash) return
            SIM_WIDTH = CELL_SIZE * Math.round(CANVAS_WIDTH / CELL_SIZE)
            SIM_HEIGHT = CELL_SIZE * Math.round(SIM_HEIGHT / CELL_SIZE)
        }
        function centerView() {
            cameraCenter = { x: SIM_WIDTH / 2, y: SIM_HEIGHT / 2 }
        }
        function handleMove() {
            if (isDragging) {
                const dx = pointerX - lastPointerX
                const dy = pointerY - lastPointerY
                cameraCenter.x -= dx / zoomFactor
                cameraCenter.y -= dy / zoomFactor
                lastPointerX = pointerX
                lastPointerY = pointerY
                cameraChanged = true
            }
        }
        function handleZoom(delta: number, x: number, y: number) {
            const oldZoomFactor = zoomFactor
            const zoomIntensity = 0.1
            const zoomDelta = delta * zoomIntensity
            zoomFactor = Math.max(0.1, Math.min(3.2, zoomFactor + zoomDelta))

            const worldBefore = {
                x: cameraCenter.x + (x - CANVAS_WIDTH / 2) * (SIM_WIDTH / CANVAS_WIDTH) / oldZoomFactor,
                y: cameraCenter.y + (y - CANVAS_HEIGHT / 2) * (SIM_HEIGHT / CANVAS_HEIGHT) / oldZoomFactor
            }
            const worldAfter = {
                x: cameraCenter.x + (x - CANVAS_WIDTH / 2) * (SIM_WIDTH / CANVAS_WIDTH) / zoomFactor,
                y: cameraCenter.y + (y - CANVAS_HEIGHT / 2) * (SIM_HEIGHT / CANVAS_HEIGHT) / zoomFactor
            }
            // Adjust the camera center to keep the mouse cursor over the same point in world space
            cameraCenter.x += worldBefore.x - worldAfter.x
            cameraCenter.y += worldBefore.y - worldAfter.y
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
            handleResize()

            rulesMatrix = makeRandomRulesMatrix()
            minRadiusMatrix = makeRandomMinRadiusMatrix()
            maxRadiusMatrix = makeRandomMaxRadiusMatrix()
            // rulesMatrix = [[-0.2758, -0.9341, -0.7292, -0.2024, -0.4367, -0.4714, -0.8962],[0.3548, -0.4365, -0.5117, -0.3945, -0.7828, 0.7885, 0.4696],[-0.9114, -0.8742, -0.5724, 0.1277, 0.3471, 0.3468, -0.6377],[0.3619, 0.6267, -0.6251, -0.1823, -0.285, -0.7255, 0.4615],[-0.2717, 0.9975, -0.4783, -0.9001, -0.2176, -0.9916, -0.4428],[-0.133, -0.342, -0.5631, 0.1238, -0.2723, -0.7484, 0.8461],[0.571, -0.7669, 0.0851, 0.5078, 0.8143, -0.7627, 0.7893]]
            // minRadiusMatrix = [[25, 39, 37, 31, 31, 40, 30],[33, 27, 37, 33, 40, 33, 40],[26, 31, 25, 30, 32, 34, 39],[33, 27, 33, 39, 34, 25, 38],[28, 32, 31, 30, 40, 37, 30],[39, 39, 38, 35, 25, 31, 40],[33, 36, 29, 35, 30, 25, 40]]
            // maxRadiusMatrix = [[65, 72, 80, 66, 72, 67, 79],[69, 61, 75, 73, 69, 70, 73],[80, 69, 71, 74, 67, 62, 61],[73, 79, 70, 70, 70, 72, 79],[67, 65, 74, 76, 64, 77, 71],[61, 68, 72, 64, 69, 64, 79],[72, 68, 77, 74, 63, 70, 75]]
            // particleLife.currentMaxRadius = 80

            console.log("Rules Matrix:", rulesMatrix);
            console.log("Min Radius Matrix:", minRadiusMatrix);
            console.log("Max Radius Matrix:", maxRadiusMatrix);

            currentMaxRadius = particleLife.currentMaxRadius // Ensure this is set before creating buffers
            CELL_SIZE = currentMaxRadius // Ensure CELL_SIZE is set before creating buffers
            SPATIAL_HASH_TABLE_SIZE = Math.pow(2, Math.ceil(Math.log2(NUM_PARTICLES))) // Ensure SPATIAL_HASH_TABLE_SIZE is a power of 2

            SIM_WIDTH = CANVAS_WIDTH
            SIM_HEIGHT = CANVAS_HEIGHT
            if (isWallWrap) setSimSizeWhenWrapped()
            centerView()

            initColors()
            initParticles()
            createBuffers()
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
            if (useSpatialHash) createSpatialHashBindGroups()
            else createBruteForceBindGroup()

            const encoder = device.createCommandEncoder()
            if (useSpatialHash) computeSpatialHash(encoder)
            else computeBruteForce(encoder)
            renderParticles(encoder)
            device.queue.submit([encoder.finish()])

            ;[currentPositionBuffer, nextPositionBuffer] = [nextPositionBuffer, currentPositionBuffer] // Swap position buffers
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
        const computeSpatialHash = (encoder: GPUCommandEncoder) => {
            const clearPass = encoder.beginComputePass()
            clearPass.setPipeline(clearHashPipeline)
            clearPass.setBindGroup(0, clearHashBindGroup)
            clearPass.dispatchWorkgroups(Math.ceil(SPATIAL_HASH_TABLE_SIZE / 64))
            clearPass.end()
            const buildHashPass = encoder.beginComputePass()
            buildHashPass.setPipeline(buildHashPipeline)
            buildHashPass.setBindGroup(0, buildHashBindGroup)
            buildHashPass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
            buildHashPass.end()
            const computePass = encoder.beginComputePass()
            computePass.setPipeline(spatialHashComputePipeline)
            computePass.setBindGroup(0, spatialHashComputeBindGroup)
            computePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
            computePass.end()
        }
        const computeBruteForce = (encoder: GPUCommandEncoder) => {
            const computePass = encoder.beginComputePass()
            computePass.setPipeline(bruteForceComputePipeline)
            computePass.setBindGroup(0, bruteForceComputeBindGroup)
            computePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
            computePass.end()
        }
        const renderParticles = (encoder: GPUCommandEncoder) => {
            if (cameraChanged) {
                device.queue.writeBuffer(cameraBuffer!, 0, new Float32Array([
                    cameraCenter.x, cameraCenter.y, zoomFactor, 0
                ]))
                cameraChanged = false
            }

            const renderPass = encoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: ctx.getCurrentTexture().createView(),
                        loadOp: 'clear',
                        storeOp: 'store',
                        clearValue: { r: 0, g: 0, b: 0, a: 1 }
                    }
                ]
            })
            renderPass.setPipeline(renderPipeline)
            renderPass.setBindGroup(0, renderBindGroup)
            renderPass.setVertexBuffer(0, triangleVertexBuffer)
            renderPass.setVertexBuffer(1, nextPositionBuffer)
            renderPass.setVertexBuffer(2, typeBuffer)
            renderPass.draw(6, NUM_PARTICLES)
            renderPass.end()
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const createBuffers = () => {
            updateSimOptionsBuffer() // Set simulation options based on the store state
            updateInteractionMatrixBuffer() // Set interaction matrices based on the store state
            updateSpatialHashBuffers() // Create spatial hash buffers
            updateParticleDataBuffers() // Create buffers for particle data

            // ----------------------------------------------------------------------------------------------
            const paddedSize = Math.ceil(colors.byteLength / 16) * 16 // Ensure padded to 16 bytes
            colorBuffer = device.createBuffer({
                size: paddedSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            })
            new Float32Array(colorBuffer.getMappedRange()).set(colors)
            colorBuffer.unmap()

            const quadVertices = new Float32Array([-1,-1, 1,-1, 1,1, -1,-1, 1,1, -1,1]);
            triangleVertexBuffer = device.createBuffer({
                size: quadVertices.byteLength,
                usage: GPUBufferUsage.VERTEX,
                mappedAtCreation: true
            })
            new Float32Array(triangleVertexBuffer.getMappedRange()).set(quadVertices)
            triangleVertexBuffer.unmap()

            const cameraData = new Float32Array([cameraCenter.x, cameraCenter.y, zoomFactor, 0]);
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
        const updateSpatialHashBuffers = () => {
            particleHashesBuffer = device.createBuffer({
                size: NUM_PARTICLES * 4, // u32
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            })
            cellHeadsBuffer = device.createBuffer({
                size: SPATIAL_HASH_TABLE_SIZE * 4, // u32
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            })
            particleNextIndicesBuffer = device.createBuffer({
                size: NUM_PARTICLES * 4, // u32
                usage: GPUBufferUsage.STORAGE,
            })
        }
        const updateParticleDataBuffers = () => {
            currentPositionBuffer = device.createBuffer({
                size: positions.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
                mappedAtCreation: true
            })
            new Float32Array(currentPositionBuffer.getMappedRange()).set(positions)
            currentPositionBuffer.unmap()
            nextPositionBuffer = device.createBuffer({
                size: positions.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
            })
            velocityBuffer = device.createBuffer({
                size: velocities.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
                mappedAtCreation: true
            })
            new Float32Array(velocityBuffer.getMappedRange()).set(velocities)
            velocityBuffer.unmap()
            const packedTypes = packTypes8Bits(types);
            typeBufferPacked = device.createBuffer({
                size: packedTypes.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            })
            new Uint32Array(typeBufferPacked.getMappedRange()).set(packedTypes)
            typeBufferPacked.unmap()
            typeBuffer = device.createBuffer({
                size: types.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
                mappedAtCreation: true
            })
            new Uint32Array(typeBuffer.getMappedRange()).set(types)
            typeBuffer.unmap()
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const createBindGroups = () => {
            createClearHashBindGroup()
            createSpatialHashBindGroups()
            createBruteForceBindGroup()
            createRenderBindGroup()
        }
        const createClearHashBindGroup = () => {
            clearHashBindGroup = device.createBindGroup({
                layout: clearHashPipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: cellHeadsBuffer! } },
                    { binding: 1, resource: { buffer: simOptionsBuffer! } }
                ]
            })
        }
        const createSpatialHashBindGroups = () => {
            buildHashBindGroup = device.createBindGroup({
                layout: buildHashPipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: currentPositionBuffer! } },
                    { binding: 1, resource: { buffer: particleHashesBuffer! } },
                    { binding: 2, resource: { buffer: cellHeadsBuffer! } },
                    { binding: 3, resource: { buffer: particleNextIndicesBuffer! } },
                    { binding: 4, resource: { buffer: simOptionsBuffer! } }
                ]
            })
            spatialHashComputeBindGroup = device.createBindGroup({
                layout: spatialHashComputePipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: currentPositionBuffer! } },
                    { binding: 1, resource: { buffer: nextPositionBuffer! } },
                    { binding: 2, resource: { buffer: velocityBuffer! } },
                    { binding: 3, resource: { buffer: typeBufferPacked! } },
                    { binding: 4, resource: { buffer: interactionMatrixBuffer! } },
                    { binding: 5, resource: { buffer: deltaTimeBuffer! } },
                    { binding: 6, resource: { buffer: simOptionsBuffer! } },
                    { binding: 7, resource: { buffer: cellHeadsBuffer! } },
                    { binding: 8, resource: { buffer: particleNextIndicesBuffer! } }
                ]
            })
        }
        const createBruteForceBindGroup = () => {
            bruteForceComputeBindGroup = device.createBindGroup({
                layout: bruteForceComputePipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: currentPositionBuffer! } },
                    { binding: 1, resource: { buffer: nextPositionBuffer! } },
                    { binding: 2, resource: { buffer: velocityBuffer! } },
                    { binding: 3, resource: { buffer: typeBufferPacked! } },
                    { binding: 4, resource: { buffer: interactionMatrixBuffer! } },
                    { binding: 5, resource: { buffer: deltaTimeBuffer! } },
                    { binding: 6, resource: { buffer: simOptionsBuffer! } },
                ]
            })
        }
        const createRenderBindGroup = () => {
            renderBindGroup = device.createBindGroup({
                layout: renderPipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: colorBuffer! } },
                    { binding: 1, resource: { buffer: cameraBuffer! } },
                    { binding: 2, resource: { buffer: simOptionsBuffer! } }
                ]
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const createPipelines = () => {
            const clearHashShader = device.createShaderModule({ code: clearHashShaderCode })
            clearHashPipeline = device.createComputePipeline({
                layout: 'auto',
                compute: { module: clearHashShader, entryPoint: 'main' }
            })
            const buildHashShader = device.createShaderModule({ code: buildHashShaderCode })
            buildHashPipeline = device.createComputePipeline({
                layout: 'auto',
                compute: { module: buildHashShader, entryPoint: 'main' }
            })
            const bruteForceShader = device.createShaderModule({ code: bruteForceShaderCode })
            bruteForceComputePipeline = device.createComputePipeline({
                layout: 'auto',
                compute: { module: bruteForceShader, entryPoint: 'main' }
            })
            const spatialHashShader = device.createShaderModule({ code: spatialHashShaderCode })
            spatialHashComputePipeline = device.createComputePipeline({
                layout: 'auto',
                compute: { module: spatialHashShader, entryPoint: 'main' }
            })

            const vertexShader = device.createShaderModule({ code: vertexShaderCode });
            const fragmentShader = device.createShaderModule({ code: fragmentShaderCode })
            renderPipeline = device.createRenderPipeline({
                layout: 'auto',
                vertex: {
                    module: vertexShader,
                    entryPoint: 'main',
                    buffers: [
                        { // triangle
                            arrayStride: 8,
                            stepMode: 'vertex',
                            attributes: [{ shaderLocation: 0, format: 'float32x2', offset: 0 }]
                        },
                        { // positions
                            arrayStride: 8,
                            stepMode: 'instance',
                            attributes: [{ shaderLocation: 1, format: 'float32x2', offset: 0 }]
                        },
                        {
                            arrayStride: 4,
                            stepMode: 'instance',
                            attributes: [{ shaderLocation: 2, format: 'uint32', offset: 0 }]
                        }
                    ]
                },
                fragment: {
                    module: fragmentShader,
                    entryPoint: 'main',
                    targets: [{
                        format: navigator.gpu.getPreferredCanvasFormat(),
                        blend: {
                            color: {
                                srcFactor: 'src-alpha',
                                dstFactor: 'one-minus-src-alpha',
                                operation: 'add'
                            },
                            alpha: {
                                srcFactor: 'one',
                                dstFactor: 'one-minus-src-alpha',
                                operation: 'add'
                            }
                        },
                        writeMask: GPUColorWrite.ALL
                    }]
                },
                primitive: { topology: 'triangle-list' }
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
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

                rulesMatrix = resizeMatrix(rulesMatrix, NUM_TYPES, newNumTypes, () => {
                    return Number((Math.random() * 2 - 1).toFixed(4))
                })
                minRadiusMatrix = resizeMatrix(minRadiusMatrix, NUM_TYPES, newNumTypes, () => {
                    return Math.floor(Math.random() * (particleLife.minRadiusRange[1] - particleLife.minRadiusRange[0] + 1) + particleLife.minRadiusRange[0])
                })
                maxRadiusMatrix = resizeMatrix(maxRadiusMatrix, NUM_TYPES, newNumTypes, () => {
                    return Math.floor(Math.random() * (particleLife.maxRadiusRange[1] - particleLife.maxRadiusRange[0] + 1) + particleLife.maxRadiusRange[0])
                })
                let maxRandom = 0
                for (let i = 0; i < newNumTypes; i++) {
                    for (let j = 0; j < newNumTypes; j++) {
                        if (maxRadiusMatrix[i][j] > maxRandom) maxRandom = maxRadiusMatrix[i][j]
                    }
                }
                particleLife.currentMaxRadius = maxRandom

                NUM_TYPES = newNumTypes

                destroyPipelinesAndBindGroups()
                await destroyBuffers()
                createBuffers()
                createPipelines()
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
        function packTypes8Bits(types: Uint32Array): Uint32Array {
            const packed = new Uint32Array(Math.ceil(types.length / 4));
            for (let i = 0; i < types.length; i++) {
                const wordIndex = Math.floor(i / 4);
                const byteOffset = (i % 4) * 8;
                packed[wordIndex] |= (types[i] & 0xFF) << byteOffset;
            }
            return packed;
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
            if (isWallWrap) {
                setSimSizeWhenWrapped()
            }
        })
        watchAndUpdate(() => particleLife.isWallRepel, (value: boolean) => {
            isWallRepel = value
            if (isWallRepel) particleLife.isWallWrap = false
        })
        watchAndUpdate(() => particleLife.isWallWrap, (value: boolean) => {
            isWallWrap = value
            if (isWallWrap) {
                particleLife.isWallRepel = false
                setSimSizeWhenWrapped()
            }
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
            triangleVertexBuffer?.destroy(); triangleVertexBuffer = undefined;
            cameraBuffer?.destroy(); cameraBuffer = undefined;
            interactionMatrixBuffer?.destroy(); interactionMatrixBuffer = undefined;
            simOptionsBuffer?.destroy(); simOptionsBuffer = undefined;
            particleHashesBuffer?.destroy(); particleHashesBuffer = undefined;
            cellHeadsBuffer?.destroy(); cellHeadsBuffer = undefined;
            particleNextIndicesBuffer?.destroy(); particleNextIndicesBuffer = undefined;
            await nextTick() // Ensure GPU resources are cleaned up before creating new ones
        }
        const destroyPipelinesAndBindGroups = () => {
            renderPipeline = undefined as any;
            clearHashPipeline = undefined as any;
            buildHashPipeline = undefined as any;
            bruteForceComputePipeline = undefined as any;
            spatialHashComputePipeline = undefined as any;

            renderBindGroup = undefined as any;
            clearHashBindGroup = undefined as any;
            buildHashBindGroup = undefined as any;
            bruteForceComputeBindGroup = undefined as any;
            spatialHashComputeBindGroup = undefined as any;
        }
        const cancelAnimationLoop = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
                animationFrameId = null
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        onUnmounted(() => {
            cancelAnimationLoop()
            destroyPipelinesAndBindGroups()
            destroyBuffers()
            // particleLife.$reset()
        })

        return {
            particleLife, canvasRef, fps, executionTime, colorRgbStrings,
            handleZoom, toggleFullscreen, isFullscreen, regenerateLife, step,
        }
    }
});
</script>

<style scoped>
canvas {
    background: black;
}
</style>

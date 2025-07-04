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
                                        :min="0" :max="100000" :step="10" v-model="particleLife.numParticles">
                            </RangeInput>
                            <RangeInput input label="Color Number"
                                        tooltip="Specify the number of particle colors. <br> Each color interacts with all others, with distinct forces and interaction ranges."
                                        :min="1" :max="20" :step="1" v-model="particleLife.numColors" mt-2>
                            </RangeInput>

                            <div mb-2>
                                <WallStateSelection :store="particleLife" />
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
            </div>
        </div>
    </section>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import WallStateSelection from "~/components/particle-life/WallStateSelection.vue";
import MatrixSettings from "~/components/particle-life/MatrixSettings.vue";

export default defineComponent({
    name: 'ParticleLifeGpu',
    components: {MatrixSettings, WallStateSelection},
    setup() {
        definePageMeta({
            layout: 'life',
            hideNavBar: true
        })

        const particleLife = useParticleLifeGPUStore()

        // Define refs and variables
        const canvasRef = ref<HTMLCanvasElement | null>(null)
        let ctx: GPUCanvasContext
        let CANVAS_WIDTH: number = 0
        let CANVAS_HEIGHT: number = 0
        let SIM_WIDTH: number = 0
        let SIM_HEIGHT: number = 0
        let CELL_SIZE: number = 0
        let animationFrameId: number | null = null
        let lastFrameTime = performance.now()

        // Define variables for the simulation
        let repel: number = particleLife.repel // Repel force between particles
        let forceFactor: number = particleLife.forceFactor // Decrease will increase the impact of the force on the velocity (the higher the value, the slower the particles will move) (can't be 0)
        let frictionFactor: number = particleLife.frictionFactor // Slow down the particles (0 to 1, where 1 is no friction)
        let NUM_PARTICLES = particleLife.numParticles
        let PARTICLE_SIZE = particleLife.particleSize
        let NUM_TYPES = particleLife.numColors
        let isWallRepel: boolean = particleLife.isWallRepel // Enable walls X and Y for the particles
        let isWallWrap: boolean = particleLife.isWallWrap // Enable wrapping for the particles

        // Define the GPU device, pipelines, and bind groups
        let device: GPUDevice
        let computePipeline: GPUComputePipeline
        let renderPipeline: GPURenderPipeline
        let computeBindGroup: GPUBindGroup
        let renderBindGroup: GPUBindGroup

        // Define the buffers
        let positionBufferA: GPUBuffer
        let positionBufferB: GPUBuffer
        let currentPositionBuffer: GPUBuffer
        let nextPositionBuffer: GPUBuffer
        let velocityBuffer: GPUBuffer
        let typeBuffer: GPUBuffer
        let colorBuffer: GPUBuffer
        let rulesMatrixBuffer: GPUBuffer
        let minRangeBuffer: GPUBuffer
        let maxRangeBuffer: GPUBuffer
        let deltaTimeBuffer: GPUBuffer
        let triangleVertexBuffer: GPUBuffer
        let cameraBuffer: GPUBuffer
        let interactionMatrixBuffer: GPUBuffer
        let simOptionsBuffer: GPUBuffer // Buffer for simulation options

        // Define the properties for dragging and zooming
        let zoomFactor = 1.0
        let cameraCenter = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
        let isDragging: boolean = false // Flag to check if the mouse is being dragged
        let lastPointerX: number = 0 // For dragging
        let lastPointerY: number = 0 // For dragging
        let pointerX: number = 0 // Pointer X
        let pointerY: number = 0 // Pointer Y
        let currentMaxRadius: number // Max value between all colors max radius (for cell size)

        // Define color list and rules matrix for the particles
        let rulesMatrix: number[][] = [] // Rules matrix for each color
        let maxRadiusMatrix: number[][] = [] // Max radius matrix for each color
        let minRadiusMatrix: number[][] = [] // Min radius matrix for each color

        let particleHashesBuffer: GPUBuffer
        let cellHeadsBuffer: GPUBuffer
        let particleNextIndicesBuffer: GPUBuffer

        let clearHashPipeline: GPUComputePipeline
        let buildHashPipeline: GPUComputePipeline

        let clearHashBindGroup: GPUBindGroup
        let buildHashBindGroup: GPUBindGroup

        let SPATIAL_HASH_TABLE_SIZE = NUM_PARTICLES


        const fps = useFps()

        onMounted(() => {
            initWebGPU()

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

            window.addEventListener('keydown', e => {
                const step = 20 * zoomFactor;
                if (e.key === 'ArrowUp') cameraCenter.y -= step
                if (e.key === 'ArrowDown') cameraCenter.y += step
                if (e.key === 'ArrowLeft') cameraCenter.x -= step
                if (e.key === 'ArrowRight') cameraCenter.x += step
            })
        })
        // -------------------------------------------------------------------------------------------------------------
        function handleResize() {
            CANVAS_WIDTH = canvasRef.value!.width = canvasRef.value!.clientWidth
            CANVAS_HEIGHT = canvasRef.value!.height = canvasRef.value!.clientHeight
        }
        function handleMove() {
            if (isDragging) {
                const dx = pointerX - lastPointerX
                const dy = pointerY - lastPointerY
                cameraCenter.x -= dx / zoomFactor
                cameraCenter.y -= dy / zoomFactor
                lastPointerX = pointerX
                lastPointerY = pointerY
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
        }
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

            handleResize()
            SIM_WIDTH = CANVAS_WIDTH
            SIM_HEIGHT = CANVAS_HEIGHT
            if (isWallWrap) setSimSizeWhenWrapped()
            centerView()

            rulesMatrix = makeRandomRulesMatrix()
            minRadiusMatrix = makeRandomMinRadiusMatrix()
            maxRadiusMatrix = makeRandomMaxRadiusMatrix()

            currentMaxRadius = particleLife.currentMaxRadius // Ensure this is set before creating buffers
            CELL_SIZE = currentMaxRadius // Ensure CELL_SIZE is set before creating buffers

            createBuffers()
            createPipelines()
            createBindGroups()
            animationFrameId = requestAnimationFrame(frame)
        }
        const frame = () => {
            const now = performance.now();
            const deltaTime = Math.min((now - lastFrameTime) / 1000, 0.05)
            lastFrameTime = now
            device.queue.writeBuffer(deltaTimeBuffer, 0, new Float32Array([deltaTime]))

            const encoder = device.createCommandEncoder()

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
            computePass.setPipeline(computePipeline)
            computePass.setBindGroup(0, computeBindGroup)
            computePass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
            computePass.end()

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

            device.queue.writeBuffer(cameraBuffer, 0, new Float32Array([
                cameraCenter.x, cameraCenter.y, zoomFactor, 0
            ]))

            renderPass.draw(6, NUM_PARTICLES)
            renderPass.end()

            device.queue.submit([encoder.finish()])

            // Swap position buffers
            ;[currentPositionBuffer, nextPositionBuffer] = [nextPositionBuffer, currentPositionBuffer]
            createBindGroups()

            animationFrameId = requestAnimationFrame(frame)
        }
        // -------------------------------------------------------------------------------------------------------------
        const createBuffers = () => {
            const { positions, velocities, types } = initParticles()
            const colors = initColors()


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


            const rules = new Float32Array(NUM_TYPES * NUM_TYPES)
            const minRanges = new Float32Array(NUM_TYPES * NUM_TYPES)
            const maxRanges = new Float32Array(NUM_TYPES * NUM_TYPES)
            for (let a = 0; a < NUM_TYPES; a++) {
                for (let b = 0; b < NUM_TYPES; b++) {
                    rules[a * NUM_TYPES + b] = rulesMatrix[a][b]
                    minRanges[a * NUM_TYPES + b] = minRadiusMatrix[a][b]
                    maxRanges[a * NUM_TYPES + b] = maxRadiusMatrix[a][b]
                }
            }

            updateSimOptionsBuffer() // Set simulation options based on the store state

            positionBufferA = device.createBuffer({
                size: positions.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            })
            new Float32Array(positionBufferA.getMappedRange()).set(positions)
            positionBufferA.unmap()
            positionBufferB = device.createBuffer({
                size: positions.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX,
            })
            currentPositionBuffer = positionBufferA
            nextPositionBuffer = positionBufferB

            velocityBuffer = device.createBuffer({
                size: velocities.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            })
            new Float32Array(velocityBuffer.getMappedRange()).set(velocities)
            velocityBuffer.unmap()

            typeBuffer = device.createBuffer({
                size: types.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            })
            new Uint32Array(typeBuffer.getMappedRange()).set(types)
            typeBuffer.unmap()

            const interactionData = new Float32Array(NUM_TYPES * NUM_TYPES * 3); // no vec4f
            for (let a = 0; a < NUM_TYPES; a++) {
                for (let b = 0; b < NUM_TYPES; b++) {
                    const index = (a * NUM_TYPES + b) * 3;
                    interactionData[index] = rulesMatrix[a][b];
                    interactionData[index + 1] = minRadiusMatrix[a][b];
                    interactionData[index + 2] = maxRadiusMatrix[a][b];
                }
            }
            interactionMatrixBuffer = device.createBuffer({
                size: interactionData.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            });
            device.queue.writeBuffer(interactionMatrixBuffer, 0, interactionData)


            deltaTimeBuffer = device.createBuffer({
                size: 4,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            })

            colorBuffer = device.createBuffer({
                size: colors.byteLength,
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
            new Float32Array(cameraBuffer.getMappedRange()).set(cameraData);
            cameraBuffer.unmap();
        }
        // -------------------------------------------------------------------------------------------------------------
        const createPipelines = () => {
            const clearHashShader = device.createShaderModule({
                code: `
                        struct CellHeads {
                            data: array<atomic<u32>>
                        };
                        struct SimOptions {
                            isWallRepel: u32,
                            isWallWrap: u32,
                            forceFactor: f32,
                            frictionFactor: f32,
                            repel: f32,
                            particleSize: f32,
                            simWidth: f32,
                            simHeight: f32,
                            cellSize: f32,
                            spatialHashTableSize: u32,
                            numParticles: u32,
                            numTypes: u32
                        };

                        @group(0) @binding(0) var<storage, read_write> cellHeads: CellHeads;
                        @group(0) @binding(1) var<uniform> options: SimOptions;

                        @compute @workgroup_size(64)
                        fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                            if (id.x >= options.spatialHashTableSize) { return; }
                            atomicStore(&cellHeads.data[id.x], 0xFFFFFFFFu);
                        }
                    `
            })
            clearHashPipeline = device.createComputePipeline({
                layout: 'auto',
                compute: {
                    module: clearHashShader,
                    entryPoint: 'main'
                }
            })

            const buildHashShader = device.createShaderModule({
                code: `
                        struct Positions { data: array<vec2<f32>> };
                        struct ParticleHashes { data: array<u32> };
                        struct ParticleNextIndices { data: array<u32> };
                        struct CellHeads { data: array<atomic<u32>> };
                        struct SimOptions {
                            isWallRepel: u32,
                            isWallWrap: u32,
                            forceFactor: f32,
                            frictionFactor: f32,
                            repel: f32,
                            particleSize: f32,
                            simWidth: f32,
                            simHeight: f32,
                            cellSize: f32,
                            spatialHashTableSize: u32,
                            numParticles: u32,
                            numTypes: u32
                        };

                        @group(0) @binding(0) var<storage, read> positions: Positions;
                        @group(0) @binding(1) var<storage, read_write> particleHashes: ParticleHashes;
                        @group(0) @binding(2) var<storage, read_write> cellHeads: CellHeads;
                        @group(0) @binding(3) var<storage, read_write> particleNextIndices: ParticleNextIndices;
                        @group(0) @binding(4) var<uniform> options: SimOptions;

                        const P1: i32 = 73856093;
                        const P2: i32 = 19349663;

                        fn get_cell_coords(pos: vec2<f32>) -> vec2<i32> {
                            return vec2<i32>(floor(pos / options.cellSize));
                        }

                        fn hash_coords(coords: vec2<i32>) -> u32 {
                            let h = u32((coords.x * P1) ^ (coords.y * P2));
                            return h % options.spatialHashTableSize;
                        }

                        @compute @workgroup_size(64)
                        fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                            let i = id.x;
                            if (i >= options.numParticles) { return; }

                            let pos = positions.data[i];
                            let cell_coords = get_cell_coords(pos);
                            let hash = hash_coords(cell_coords);

                            particleHashes.data[i] = hash;

                            let old_head = atomicExchange(&cellHeads.data[hash], i);
                            particleNextIndices.data[i] = old_head;
                        }
                    `
            })
            buildHashPipeline = device.createComputePipeline({
                layout: 'auto',
                compute: {
                    module: buildHashShader,
                    entryPoint: 'main'
                }
            })


            const computeShader = device.createShaderModule({
                code: `
                        struct Particles { data: array<vec2<f32>> };
                        struct Types { data: array<u32> };
                        struct InteractionMatrix { data: array<f32> };
                        struct SimOptions {
                            isWallRepel: u32,
                            isWallWrap: u32,
                            forceFactor: f32,
                            frictionFactor: f32,
                            repel: f32,
                            particleSize: f32,
                            simWidth: f32,
                            simHeight: f32,
                            cellSize: f32,
                            spatialHashTableSize: u32,
                            numParticles: u32,
                            numTypes: u32
                        };

                        struct ParticleNextIndices { data: array<u32> };
                        struct CellHeads { data: array<u32> };

                        @group(0) @binding(0) var<storage, read> currentPositions: Particles;
                        @group(0) @binding(1) var<storage, read_write> nextPositions: Particles;
                        @group(0) @binding(2) var<storage, read_write> velocities: Particles;
                        @group(0) @binding(3) var<storage, read> types: Types;
                        @group(0) @binding(4) var<storage, read> interactions: InteractionMatrix;
                        @group(0) @binding(5) var<uniform> deltaTime: f32;
                        @group(0) @binding(6) var<uniform> options: SimOptions;
                        @group(0) @binding(7) var<storage, read> cellHeads: CellHeads;
                        @group(0) @binding(8) var<storage, read> particleNextIndices: ParticleNextIndices;

                        const P1: i32 = 73856093;
                        const P2: i32 = 19349663;

                        fn get_cell_coords(pos: vec2<f32>) -> vec2<i32> {
                            return vec2<i32>(floor(pos / options.cellSize));
                        }
                        fn hash_coords(coords: vec2<i32>) -> u32 {
                            let h = u32((coords.x * P1) ^ (coords.y * P2));
                            return h % options.spatialHashTableSize;
                        }

                        @compute @workgroup_size(64)
                        fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                            let i = id.x;
                            if (i >= options.numParticles) { return; }

                            let GRID_WIDTH: i32 = i32(ceil(options.simWidth / options.cellSize));
                            let GRID_HEIGHT: i32 = i32(ceil(options.simHeight / options.cellSize));

                            let myPos = currentPositions.data[i];
                            let myType = types.data[i];
                            var velocitySum = vec2<f32>(0.0, 0.0);

                            let my_cell_coords = get_cell_coords(myPos);

                            for (var offsetY = -1; offsetY <= 1; offsetY = offsetY + 1) {
                                for (var offsetX = -1; offsetX <= 1; offsetX = offsetX + 1) {
                                    var neighbor_cell_coords = my_cell_coords + vec2<i32>(offsetX, offsetY);

                                    if (options.isWallWrap == 1u) {
                                        if (neighbor_cell_coords.x < 0) { neighbor_cell_coords.x += GRID_WIDTH; }
                                        if (neighbor_cell_coords.x >= GRID_WIDTH) { neighbor_cell_coords.x -= GRID_WIDTH; }
                                        if (neighbor_cell_coords.y < 0) { neighbor_cell_coords.y += GRID_HEIGHT; }
                                        if (neighbor_cell_coords.y >= GRID_HEIGHT) { neighbor_cell_coords.y -= GRID_HEIGHT; }
                                    }

                                    let hash = hash_coords(neighbor_cell_coords);
                                    var j = cellHeads.data[hash];

                                    loop {
                                        if (j == 0xFFFFFFFFu) { // End of the linked list
                                            break;
                                        }
                                        if (i == j) { // Skip self
                                            j = particleNextIndices.data[j];
                                            continue;
                                        }

                                        let otherPos = currentPositions.data[j];
                                        let otherType = types.data[j];
                                        var delta = otherPos - myPos;

                                        if (options.isWallWrap == 1u) {
                                            if (delta.x > options.simWidth / 2.0) { delta.x -= options.simWidth; }
                                            else if (delta.x < -options.simWidth / 2.0) { delta.x += options.simWidth; }
                                            if (delta.y > options.simHeight / 2.0) { delta.y -= options.simHeight; }
                                            else if (delta.y < -options.simHeight / 2.0) { delta.y += options.simHeight; }
                                        }

                                        let distSquared = dot(delta, delta);
                                        let index = (myType * options.numTypes + otherType) * 3u;
                                        let maxR = interactions.data[index + 2];

                                        if (distSquared > 0.0 && distSquared < maxR * maxR) {
                                            let dist = sqrt(distSquared);
                                            let rule = interactions.data[index];
                                            let minR = interactions.data[index + 1];
                                            var force = 0.0;
                                            if (dist < minR) {
                                                force = (options.repel / minR) * dist - options.repel;
                                                // force = options.repel * ((1.0 / minR) * dist - 1.0);
                                            } else {
                                                let mid = (minR + maxR) / 2.0;
                                                let slope = rule / (mid - minR);
                                                force = -(slope * abs(dist - mid)) + rule;
                                            }
                                            if (force != 0.0) {
                                                velocitySum += delta * (force / dist);
                                            }
                                        }

                                        j = particleNextIndices.data[j]; // Move to the next particle in the linked list
                                    }
                                }
                            }

                            let oldVelocity = velocities.data[i];
                            let acceleration = (velocitySum / options.forceFactor);
                            var newVelocity = (oldVelocity + acceleration) * options.frictionFactor;

                            var newPos = myPos + newVelocity * deltaTime;

                            if (options.isWallRepel == 1u) {
                                let margin = options.particleSize;
                                if (newPos.x < margin || newPos.x > options.simWidth - margin) {
                                  newVelocity.x = -newVelocity.x * 1.8;
                                  newPos.x = clamp(newPos.x, margin, options.simWidth - margin);
                                }
                                if (newPos.y < margin || newPos.y > options.simHeight - margin) {
                                  newVelocity.y = -newVelocity.y * 1.8;
                                  newPos.y = clamp(newPos.y, margin, options.simHeight - margin);
                                }
                            } else if (options.isWallWrap == 1u) {
                                if (newPos.x < 0.0) { newPos.x += options.simWidth; }
                                else if (newPos.x > options.simWidth) { newPos.x -= options.simWidth; }
                                if (newPos.y < 0.0) { newPos.y += options.simHeight; }
                                else if (newPos.y > options.simHeight) { newPos.y -= options.simHeight; }
                            }

                            velocities.data[i] = newVelocity;
                            nextPositions.data[i] = newPos;
                        }
                    `
            })

            const vertexShader = device.createShaderModule({
                code: `
                        struct VertexOutput {
                            @builtin(position) position: vec4f,
                            @location(0) offset: vec2f,
                            @location(1) @interpolate(flat) particleType: u32
                        };
                        struct SimOptions {
                            isWallRepel: u32,
                            isWallWrap: u32,
                            forceFactor: f32,
                            frictionFactor: f32,
                            repel: f32,
                            particleSize: f32,
                            simWidth: f32,
                            simHeight: f32,
                            cellSize: f32,
                            spatialHashTableSize: u32,
                            numParticles: u32,
                            numTypes: u32
                        };

                        struct Camera {
                            center: vec2f,
                            zoomFactor: f32,
                            pad: f32 // Padding to ensure the struct size is aligned to 16 bytes (required for uniform buffers)
                        };

                        @group(0) @binding(1) var<uniform> camera: Camera;
                        @group(0) @binding(2) var<uniform> options: SimOptions;

                        @vertex
                        fn main(
                            @location(0) localPos: vec2f,     // triangleVertexBuffer
                            @location(1) instancePos: vec2f,  // nextPositionBuffer
                            @location(2) particleType: u32    // typeBuffer
                        ) -> VertexOutput {
                            var out: VertexOutput;

                            let worldPos = instancePos + localPos * options.particleSize;
                            let pos = (worldPos - camera.center) * camera.zoomFactor;

                            out.position = vec4f(
                                (pos.x / options.simWidth) * 2.0,
                                -(pos.y / options.simHeight) * 2.0,
                                0.0, 1.0
                            );

                            out.offset = localPos;
                            out.particleType = particleType;

                            return out;
                        }
                      `
            })

            const fragmentShader = device.createShaderModule({
                code: `
                        struct Colors {
                            data: array<vec3f>
                        };
                        @group(0) @binding(0) var<storage, read> colors: Colors;

                        @fragment
                        fn main(@location(0) offset: vec2f, @location(1) @interpolate(flat) particleType: u32) -> @location(0) vec4f {
                            let color = colors.data[particleType];
                            if (length(offset) > 1.0) {
                                discard;
                            }
                            return vec4f(color, 0.95 - smoothstep(0.75, 0.95, length(offset)));
                        }
                      `
            })


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

            computePipeline = device.createComputePipeline({
                layout: 'auto',
                compute: {
                    module: computeShader,
                    entryPoint: 'main'
                }
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        const createBindGroups = () => {
            clearHashBindGroup = device.createBindGroup({
                layout: clearHashPipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: cellHeadsBuffer } },
                    { binding: 1, resource: { buffer: simOptionsBuffer } }
                ]
            })
            buildHashBindGroup = device.createBindGroup({
                layout: buildHashPipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: currentPositionBuffer } },
                    { binding: 1, resource: { buffer: particleHashesBuffer } },
                    { binding: 2, resource: { buffer: cellHeadsBuffer } },
                    { binding: 3, resource: { buffer: particleNextIndicesBuffer } },
                    { binding: 4, resource: { buffer: simOptionsBuffer } }
                ]
            })

            computeBindGroup = device.createBindGroup({
                layout: computePipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: currentPositionBuffer } },
                    { binding: 1, resource: { buffer: nextPositionBuffer } },
                    { binding: 2, resource: { buffer: velocityBuffer } },
                    { binding: 3, resource: { buffer: typeBuffer } },
                    { binding: 4, resource: { buffer: interactionMatrixBuffer } },
                    { binding: 5, resource: { buffer: deltaTimeBuffer } },
                    { binding: 6, resource: { buffer: simOptionsBuffer } },
                    { binding: 7, resource: { buffer: cellHeadsBuffer } },
                    { binding: 8, resource: { buffer: particleNextIndicesBuffer } }
                ]
            })

            renderBindGroup = device.createBindGroup({
                layout: renderPipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: colorBuffer } },
                    { binding: 1, resource: { buffer: cameraBuffer } },
                    { binding: 2, resource: { buffer: simOptionsBuffer } }
                ]
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        function initColors() {
            const colors = new Float32Array(NUM_TYPES * 3)

            for (let i = 0; i < NUM_TYPES; ++i) {
                colors[i * 3] = Math.random()
                colors[i * 3 + 1] = Math.random()
                colors[i * 3 + 2] = Math.random()
            }
            return colors
        }
        function initParticles() {
            const positions = new Float32Array(NUM_PARTICLES * 2)
            const velocities = new Float32Array(NUM_PARTICLES * 2)
            const types = new Uint32Array(NUM_PARTICLES)

            for (let i = 0; i < NUM_PARTICLES; i++) {
                positions[2 * i] = Math.random() * SIM_WIDTH
                positions[2 * i + 1] = Math.random() * SIM_HEIGHT
                velocities[2 * i] = 0
                velocities[2 * i + 1] = 0
                types[i] = Math.floor(Math.random() * NUM_TYPES)
            }
            return { positions, velocities, types }
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
        function setSimSizeWhenWrapped() { // Set the grid size when the walls are wrapped
            SIM_WIDTH = CELL_SIZE * Math.round(CANVAS_WIDTH / CELL_SIZE)
            SIM_HEIGHT = CELL_SIZE * Math.round(SIM_HEIGHT / CELL_SIZE)
        }
        function centerView() {
            cameraCenter = { x: SIM_WIDTH / 2, y: SIM_HEIGHT / 2 }
        }
        function updateSimOptionsBuffer() {
            const simOptionsData = new ArrayBuffer(48)
            const simOptionsView = new DataView(simOptionsData)
            simOptionsView.setUint32(0, particleLife.isWallRepel ? 1 : 0, true)
            simOptionsView.setUint32(4, particleLife.isWallWrap ? 1 : 0, true)
            simOptionsView.setFloat32(8, particleLife.forceFactor, true)
            simOptionsView.setFloat32(12, particleLife.frictionFactor, true)
            simOptionsView.setFloat32(16, particleLife.repel, true)
            simOptionsView.setFloat32(20, particleLife.particleSize, true)
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
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        function watchAndDraw(effect: any, callback: any) {
            watch(effect, (value) => {
                callback(value)
                // if (!isRunning) simpleDrawParticles()
                updateSimOptionsBuffer()
            })
        }
        watchAndDraw(() => particleLife.particleSize, (value: number) => PARTICLE_SIZE = value)
        watchAndDraw(() => particleLife.isWallRepel, (value: boolean) => {
            isWallRepel = value
            if (isWallRepel) particleLife.isWallWrap = false
        })
        watchAndDraw(() => particleLife.isWallWrap, (value: boolean) => {
            isWallWrap = value
            if (isWallWrap) {
                particleLife.isWallRepel = false
                setSimSizeWhenWrapped()
            }
        })
        watchAndDraw(() => particleLife.repel, (value: number) => repel = value)
        watchAndDraw(() => particleLife.forceFactor, (value: number) => forceFactor = value)
        watchAndDraw(() => particleLife.frictionFactor, (value: number) => frictionFactor = value)
        watchAndDraw(() => particleLife.currentMaxRadius, (value: number) => {
            currentMaxRadius = value
            CELL_SIZE = currentMaxRadius
            if (isWallWrap) {
                setSimSizeWhenWrapped()
            }
        })
        // -------------------------------------------------------------------------------------------------------------
        onUnmounted(() => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
                animationFrameId = null
            }
            // particleLife.$reset()
        })

        return {
            particleLife, canvasRef, fps
        }
    }
});
</script>

<style scoped>
canvas {
    background: black;
}
</style>

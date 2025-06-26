<template>
    <section h-screen flex flex-col justify-center overflow-hidden relative ref="mainContainer" id="mainContainer">
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

export default defineComponent({
    name: 'ParticleLifeGpu',
    setup() {
        definePageMeta({
            layout: 'life',
            hideNavBar: true
        })

        // Define refs and variables
        const canvasRef = ref<HTMLCanvasElement | null>(null)
        let ctx: GPUCanvasContext
        let CANVAS_WIDTH: number = 0
        let CANVAS_HEIGHT: number = 0
        let animationFrameId: number | null = null
        let lastFrameTime = performance.now()

        // Define variables for the simulation
        const forceFactor: number = 0.6 // Decrease will increase the impact of the force on the velocity (the higher the value, the slower the particles will move) (can't be 0)
        const frictionFactor: number = 0.6 // Slow down the particles (0 to 1, where 1 is no friction)
        const NUM_PARTICLES = 20000
        const PARTICLE_SIZE = 1.2
        const NUM_TYPES = 8
        let isWallRepel: boolean = false // Enable walls X and Y for the particles
        let isWallWrap: boolean = true // Enable wrapping for the particles

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

        let buildCellsPipeline: GPUComputePipeline
        let buildCellsBindGroupLayout: GPUBindGroupLayout
        let buildCellsBindGroup: GPUBindGroup
        let cellParticleCountsBuffer: GPUBuffer // Buffer to count particles in each cell
        let cellParticleIndicesBuffer: GPUBuffer // Buffer to store particle indices in each cell
        let particleCellIndicesBuffer: GPUBuffer // Buffer to store the cell index for each particle

        let renderBindGroupLayout: GPUBindGroupLayout
        let fragmentBindGroupLayout: GPUBindGroupLayout
        let fragmentBindGroup: GPUBindGroup
        let renderPipelineLayout: GPUPipelineLayout

        // Define the properties for dragging and zooming
        let zoomFactor = 1.0
        let cameraCenter = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
        let isDragging: boolean = false // Flag to check if the mouse is being dragged
        let lastPointerX: number = 0 // For dragging
        let lastPointerY: number = 0 // For dragging
        let pointerX: number = 0 // Pointer X
        let pointerY: number = 0 // Pointer Y

        // Define color list and rules matrix for the particles
        let rulesMatrix: number[][] = [] // Rules matrix for each color
        let maxRadiusMatrix: number[][] = [] // Max radius matrix for each color
        let minRadiusMatrix: number[][] = [] // Min radius matrix for each color

        let currentMaxRadius: number // Max value between all colors max radius (for cell size)
        let cellSize: number = 0 // Size of the cells in the grid (in pixels)
        let gridWidth: number
        let gridHeight: number
        let maxParticlesPerCell: number = 32768 // Max particles per cell (for the grid)

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
            zoomFactor = Math.max(0.3, Math.min(3.2, zoomFactor + zoomDelta))

            // Convert the mouse position to world coordinates (before zoom)
            const worldBefore = {
                x: cameraCenter.x + (x - CANVAS_WIDTH / 2) / oldZoomFactor,
                y: cameraCenter.y + (y - CANVAS_HEIGHT / 2) / oldZoomFactor
            }
            // Convert the mouse position to world coordinates (after zoom)
            const worldAfter = {
                x: cameraCenter.x + (x - CANVAS_WIDTH / 2) / zoomFactor,
                y: cameraCenter.y + (y - CANVAS_HEIGHT / 2) / zoomFactor
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
            cameraCenter = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }

            rulesMatrix = makeRandomRulesMatrix()
            minRadiusMatrix = makeRandomMinRadiusMatrix()
            maxRadiusMatrix = makeRandomMaxRadiusMatrix()

            createBuffers()
            createBindGroupLayouts()
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

            encoder.clearBuffer?.(cellParticleCountsBuffer)

            const buildCellsPass = encoder.beginComputePass()
            buildCellsPass.setPipeline(buildCellsPipeline)
            buildCellsPass.setBindGroup(0, buildCellsBindGroup)
            buildCellsPass.dispatchWorkgroups(Math.ceil(NUM_PARTICLES / 64))
            buildCellsPass.end()

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

            device.queue.writeBuffer(cameraBuffer, 0, new Float32Array([
                cameraCenter.x, cameraCenter.y, zoomFactor, 0
            ]))

            // renderPass.setVertexBuffer(0, triangleVertexBuffer);
            // renderPass.setBindGroup(0, renderBindGroup);
            // renderPass.draw(6, NUM_PARTICLES * 9);



            renderPass.setVertexBuffer(0, triangleVertexBuffer);
            renderPass.setBindGroup(0, renderBindGroup);
            renderPass.setBindGroup(1, fragmentBindGroup);
            renderPass.draw(6, NUM_PARTICLES * 9);

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

            const simOptionsArray = new Uint32Array([
                isWallRepel ? 1 : 0,
                isWallWrap ? 1 : 0,
                0, 0 // padding
            ])
            simOptionsBuffer = device.createBuffer({
                size: simOptionsArray.byteLength,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            })
            device.queue.writeBuffer(simOptionsBuffer, 0, simOptionsArray)


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


            gridWidth = Math.ceil(CANVAS_WIDTH / cellSize)
            gridHeight = Math.ceil(CANVAS_HEIGHT / cellSize)
            const numCells = gridWidth * gridHeight

            cellParticleCountsBuffer = device.createBuffer({
                size: numCells * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            })
            cellParticleIndicesBuffer = device.createBuffer({
                size: numCells * maxParticlesPerCell * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            })
            particleCellIndicesBuffer = device.createBuffer({
                size: NUM_PARTICLES * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        const createPipelines = () => {
            const buildCellsShader = device.createShaderModule({
                code: `
                    @group(0) @binding(0) var<storage, read> positions: array<vec2<f32>>;
                    @group(0) @binding(1) var<storage, read_write> cellParticleCounts: array<atomic<u32>>;
                    @group(0) @binding(2) var<storage, read_write> cellParticleIndices: array<u32>;
                    @group(0) @binding(3) var<storage, read_write> particleCellIndices: array<u32>;

                    @compute @workgroup_size(64)
                    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                        let i = id.x;
                        if (i >= ${NUM_PARTICLES}) { return; }
                        let pos = positions[i];
                        let rawCellX = i32(floor(pos.x /  ${cellSize}));
                        let rawCellY = i32(floor(pos.y /  ${cellSize}));
                        let cellX = clamp(rawCellX, 0, ${gridWidth - 1});
                        let cellY = clamp(rawCellY, 0, ${gridHeight - 1});
                        let cellIndex = u32(cellY * ${gridWidth} + cellX);
                        let offset = atomicAdd(&cellParticleCounts[cellIndex], 1u);
                        cellParticleIndices[cellIndex * ${maxParticlesPerCell}u + offset] = i;
                        particleCellIndices[i] = cellIndex;
                    }
                `
            })

            const computeShader = device.createShaderModule({
                code: `
                        struct Particles {
                            data: array<vec2<f32>>
                        };

                        struct Types {
                            data: array<u32>
                        };

                        struct InteractionMatrix {
                          data: array<f32>
                        };

                        struct SimOptions {
                            isWallRepel: u32, // 0 = false, 1 = true
                            isWallWrap: u32,  // 0 = false, 1 = true
                            pad1: u32,
                            pad2: u32
                        };

                        @group(0) @binding(0) var<storage, read> currentPositions: Particles;
                        @group(0) @binding(1) var<storage, read_write> nextPositions: Particles;
                        @group(0) @binding(2) var<storage, read_write> velocities: Particles;
                        @group(0) @binding(3) var<storage, read> types: Types;
                        @group(0) @binding(4) var<storage, read> interactions: InteractionMatrix;
                        @group(0) @binding(5) var<uniform> deltaTime: f32;
                        @group(0) @binding(6) var<uniform> options: SimOptions;
                        @group(0) @binding(7) var<storage, read> cellParticleCounts: array<u32>;
                        @group(0) @binding(8) var<storage, read> cellParticleIndices: array<u32>;
                        @group(0) @binding(9) var<storage, read> particleCellIndices: array<u32>;

                        @compute @workgroup_size(64)
                        fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                            let i = id.x;
                            if (i >= ${NUM_PARTICLES}) { return; }

                            let myPos = currentPositions.data[i];
                            let myType = types.data[i];
                            let myCell = particleCellIndices[i];
                            let cellX = i32(myCell % ${gridWidth});
                            let cellY = i32(myCell / ${gridWidth});

                            var velocitySum = vec2<f32>(0.0, 0.0);

                            for(var dx: i32 = -1; dx <= 1; dx = dx + 1) {
                                for(var dy: i32 = -1; dy <= 1; dy = dy + 1) {
                                    var nx = cellX + dx;
                                    var ny = cellY + dy;
                                    // if (nx < 0 || nx >= i32(${gridWidth}) || ny < 0 || ny >= i32(${gridHeight})) { continue; }

                                    if (options.isWallWrap == 1u) {
                                        if (nx < 0) { nx = ${gridWidth - 1}; }
                                        else if (nx >= ${gridWidth}) { nx = 0; }
                                        if (ny < 0) { ny = ${gridHeight - 1}; }
                                        else if (ny >= ${gridHeight}) { ny = 0; }
                                    }
                                    // else {
                                    //     if (nx < 0 || nx >= ${gridWidth} || ny < 0 || ny >= ${gridHeight}) { continue; }
                                    // }

                                    let neighborCell = u32(ny) * ${gridWidth} + u32(nx);
                                    let count = cellParticleCounts[neighborCell];
                                    if (count == 0u) { continue; }
                                    let safeCount = min(count, ${maxParticlesPerCell}u);
                                    for (var k = 0u; k < safeCount; k = k + 1u) {
                                        let j = cellParticleIndices[u32(neighborCell) * ${maxParticlesPerCell}u + k];
                                        if (i == j) { continue; }

                                        let otherPos = currentPositions.data[j];
                                        let otherType = types.data[j];
                                        var delta = otherPos - myPos;

                                        // Wrap around the canvas edges
                                        if (options.isWallWrap == 1u) {
                                            if (delta.x > ${CANVAS_WIDTH}.0 / 2.0) {
                                                delta.x -= ${CANVAS_WIDTH}.0;
                                            } else if (delta.x < -${CANVAS_WIDTH}.0 / 2.0) {
                                                delta.x += ${CANVAS_WIDTH}.0;
                                            }
                                            if (delta.y > ${CANVAS_HEIGHT}.0 / 2.0) {
                                                delta.y -= ${CANVAS_HEIGHT}.0;
                                            } else if (delta.y < -${CANVAS_HEIGHT}.0 / 2.0) {
                                                delta.y += ${CANVAS_HEIGHT}.0;
                                            }
                                        }

                                        let distSquared = dot(delta, delta);
                                        let index = (myType * ${NUM_TYPES}u + otherType) * 3u;
                                        let maxR = interactions.data[index + 2];
                                        if (distSquared < maxR * maxR) {
                                            let dist = sqrt(distSquared);

                                            let rule = interactions.data[index];
                                            let minR = interactions.data[index + 1];
                                            var force = 0.0;
                                            if (dist < minR) {
                                                force = (1.0 / minR) * dist - 1.0;
                                            } else {
                                                let mid = (minR + maxR) / 2.0;
                                                let slope = rule / (mid - minR);
                                                force = -(slope * abs(dist - mid)) + rule;
                                            }

                                            if (force != 0.0) {
                                                velocitySum += delta * (force / dist);
                                            }
                                        }
                                    }
                                }
                            }

                            let oldVelocity = velocities.data[i];
                            let acceleration = (velocitySum / ${forceFactor});
                            var newVelocity = (oldVelocity + acceleration) * ${frictionFactor};
                            velocities.data[i] = newVelocity;

                            var newPos = myPos + newVelocity * deltaTime;

                            // With walls
                            if (options.isWallRepel == 1u) {
                                let margin = f32(${PARTICLE_SIZE});
                                if (newPos.x < margin || newPos.x > ${CANVAS_WIDTH}.0 - margin) {
                                  newVelocity.x = -newVelocity.x * 1.8;
                                  newPos.x = clamp(newPos.x, margin, ${CANVAS_WIDTH}.0 - margin);
                                }
                                if (newPos.y < margin || newPos.y > ${CANVAS_HEIGHT}.0 - margin) {
                                  newVelocity.y = -newVelocity.y * 1.8;
                                  newPos.y = clamp(newPos.y, margin, ${CANVAS_HEIGHT}.0 - margin);
                                }
                            }

                            // Wall Wrapping
                            else if (options.isWallWrap == 1u) {
                                if (newPos.x < 0.0) {
                                    newPos.x += ${CANVAS_WIDTH}.0;
                                } else if (newPos.x > ${CANVAS_WIDTH}.0) {
                                    newPos.x -= ${CANVAS_WIDTH}.0;
                                }
                                if (newPos.y < 0.0) {
                                    newPos.y += ${CANVAS_HEIGHT}.0;
                                } else if (newPos.y > ${CANVAS_HEIGHT}.0) {
                                    newPos.y -= ${CANVAS_HEIGHT}.0;
                                }
                            }

                            velocities.data[i] = newVelocity;
                            nextPositions.data[i] = newPos;
                        };
                    `
            })

            const vertexShader = device.createShaderModule({
                code: `
                        struct VertexOutput {
                          @builtin(position) position: vec4f,
                          @location(0) offset: vec2f,
                          @location(1) @interpolate(flat) particleType: u32
                        };

                        struct Camera {
                          center: vec2f,
                          zoomFactor: f32,
                          _pad: f32
                        };

                        @group(0) @binding(0) var<storage, read> particlePositions: array<vec2f>;
                        @group(0) @binding(1) var<storage, read> particleTypes: array<u32>;
                        @group(0) @binding(2) var<uniform> camera: Camera;

                        @vertex
                        fn main(
                          @builtin(instance_index) instanceIndex: u32,
                          @location(0) localPos: vec2f,
                        ) -> VertexOutput {
                          var out: VertexOutput;
                          let particleIndex = instanceIndex / 9u;
                          let wrap = instanceIndex % 9u;
                          let dx = f32(i32(wrap % 3u) - 1);
                          let dy = f32(i32(wrap / 3u) - 1);
                          let wrapOffset = vec2f(dx * f32(${CANVAS_WIDTH}), dy * f32(${CANVAS_HEIGHT}));
                          let instancePos = particlePositions[particleIndex];
                          let particleType = particleTypes[particleIndex];
                          let worldPos = instancePos + localPos * ${PARTICLE_SIZE} + wrapOffset;
                          let pos = (worldPos - camera.center) * camera.zoomFactor;

                          out.position = vec4f(
                            (pos.x / f32(${CANVAS_WIDTH})) * 2.0,
                            -(pos.y / f32(${CANVAS_HEIGHT})) * 2.0,
                            0.0, 1.0);

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
                        @group(1) @binding(0) var<storage, read> colors: Colors;

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
                layout: renderPipelineLayout,
                vertex: {
                    module: vertexShader,
                    entryPoint: 'main',
                    buffers: [
                        {
                            arrayStride: 8,
                            stepMode: 'vertex',
                            attributes: [{ shaderLocation: 0, format: 'float32x2', offset: 0 }]
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

            buildCellsPipeline = device.createComputePipeline({
                layout: device.createPipelineLayout({ bindGroupLayouts: [buildCellsBindGroupLayout] }),
                compute: {
                    module: buildCellsShader,
                    entryPoint: 'main'
                }
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
        const createBindGroupLayouts = () => {
            buildCellsBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
                    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
                    { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } }
                ]
            })
            renderBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                    { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                    { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
                ]
            })
            fragmentBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } }
                ]
            })
            renderPipelineLayout = device.createPipelineLayout({
                bindGroupLayouts: [renderBindGroupLayout, fragmentBindGroupLayout]
            })

        }
        const createBindGroups = () => {
            buildCellsBindGroup = device.createBindGroup({
                layout: buildCellsBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: currentPositionBuffer } },
                    { binding: 1, resource: { buffer: cellParticleCountsBuffer } },
                    { binding: 2, resource: { buffer: cellParticleIndicesBuffer } },
                    { binding: 3, resource: { buffer: particleCellIndicesBuffer } }
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
                    { binding: 7, resource: { buffer: cellParticleCountsBuffer } },
                    { binding: 8, resource: { buffer: cellParticleIndicesBuffer } },
                    { binding: 9, resource: { buffer: particleCellIndicesBuffer } }
                ]
            })
            
            renderBindGroup = device.createBindGroup({
                layout: renderBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: nextPositionBuffer } }, // particlePositions
                    { binding: 1, resource: { buffer: typeBuffer } },         // particleTypes
                    { binding: 2, resource: { buffer: cameraBuffer } }        // camera
                ]
            })
            fragmentBindGroup = device.createBindGroup({
                layout: fragmentBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: colorBuffer } } // colors
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
                positions[2 * i] = Math.random() * CANVAS_WIDTH
                positions[2 * i + 1] = Math.random() * CANVAS_HEIGHT
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
            const min: number = 30
            const max: number = 70
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
            const min: number = 90
            const max: number = 200
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
            currentMaxRadius = maxRandom
            cellSize = currentMaxRadius * 2

            return matrix
        }
        // -------------------------------------------------------------------------------------------------------------
        onUnmounted(() => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
                animationFrameId = null
            }
            // particleLife.$reset()
        })

        return {
            canvasRef, fps
        }
    }
});
</script>

<style scoped>
canvas {
    background: black;
}
</style>

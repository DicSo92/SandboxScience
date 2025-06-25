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

        const canvasRef = ref<HTMLCanvasElement | null>(null)
        let ctx: GPUCanvasContext
        let CANVAS_WIDTH: number = 0
        let CANVAS_HEIGHT: number = 0
        let animationFrameId: number | null = null

        let forceFactor: number = 0.6 // Decrease will increase the impact of the force on the velocity (the higher the value, the slower the particles will move) (can't be 0)
        let frictionFactor: number = 0.6 // Slow down the particles (0 to 1, where 1 is no friction)

        const NUM_PARTICLES = 25000
        const PARTICLE_SIZE = 1.2
        const NUM_TYPES = 8

        let device: GPUDevice
        let computePipeline: GPUComputePipeline
        let renderPipeline: GPURenderPipeline

        // let positionBuffer: GPUBuffer
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

        let computeBindGroup: GPUBindGroup
        let renderBindGroup: GPUBindGroup

        let lastFrameTime = performance.now()
        let deltaTimeBuffer: GPUBuffer

        let triangleVertexBuffer: GPUBuffer

        let cameraBuffer: GPUBuffer
        let zoomFactor = 1.0
        let cameraCenter = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }

        // Define the properties for dragging and zooming
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

            rulesMatrixBuffer = device.createBuffer({
                size: rules.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            })
            new Float32Array(rulesMatrixBuffer.getMappedRange()).set(rules)
            rulesMatrixBuffer.unmap()
            minRangeBuffer = device.createBuffer({
                size: minRanges.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            })
            new Float32Array(minRangeBuffer.getMappedRange()).set(minRanges)
            minRangeBuffer.unmap()
            maxRangeBuffer = device.createBuffer({
                size: maxRanges.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            })
            new Float32Array(maxRangeBuffer.getMappedRange()).set(maxRanges)
            maxRangeBuffer.unmap()

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
            const computeShader = device.createShaderModule({
                code: `
                        struct Particles {
                            data: array<vec2<f32>>
                        };

                        struct Types {
                            data: array<u32>
                        };

                        struct Matrix {
                            data: array<f32>,
                        };

                        @group(0) @binding(0) var<storage, read> currentPositions: Particles;
                        @group(0) @binding(1) var<storage, read_write> nextPositions: Particles;
                        @group(0) @binding(2) var<storage, read_write> velocities: Particles;
                        @group(0) @binding(3) var<storage, read> types: Types;
                        @group(0) @binding(4) var<storage, read> rules: Matrix;
                        @group(0) @binding(5) var<storage, read> minRanges: Matrix;
                        @group(0) @binding(6) var<storage, read> maxRanges: Matrix;
                        @group(0) @binding(7) var<uniform> deltaTime: f32;

                        @compute @workgroup_size(64)
                        fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                            let i = id.x;
                            if (i >= ${NUM_PARTICLES}u) { return; }

                            let myPos = currentPositions.data[i];
                            let myType = types.data[i];
                            var velocitySum = vec2<f32>(0.0, 0.0);
                            var acc = vec2<f32>(0.0, 0.0);

                            for (var j = 0u; j < ${NUM_PARTICLES}u; j = j + 1u) {
                                if (i == j) { continue; }

                                let otherPos = currentPositions.data[j];
                                let otherType = types.data[j];
                                var delta = otherPos - myPos;

                                // Wrap around the canvas edges
                                // if (delta.x > ${CANVAS_WIDTH}.0 / 2.0) {
                                //     delta.x -= ${CANVAS_WIDTH}.0;
                                // } else if (delta.x < -${CANVAS_WIDTH}.0 / 2.0) {
                                //     delta.x += ${CANVAS_WIDTH}.0;
                                // }
                                // if (delta.y > ${CANVAS_HEIGHT}.0 / 2.0) {
                                //     delta.y -= ${CANVAS_HEIGHT}.0;
                                // } else if (delta.y < -${CANVAS_HEIGHT}.0 / 2.0) {
                                //     delta.y += ${CANVAS_HEIGHT}.0;
                                // }

                                let dist = length(delta);
                                let index = myType * ${NUM_TYPES}u + otherType;
                                let minR = minRanges.data[index];
                                let maxR = maxRanges.data[index];
                                let rule = rules.data[index];

                                if (dist < maxR) {
                                    var force = 0.0;
                                    if (dist < minR) {
                                        force = (1.0 / minR) * dist - 1.0;
                                    } else {
                                        let mid = (minR + maxR) / 2.0;
                                        let slope = rule / (mid - minR);
                                        force = -(slope * abs(dist - mid)) + rule;
                                    }

                                    if (force != 0.0) {
                                        // velocitySum += delta / dist * force;
                                        velocitySum += normalize(delta) * force;
                                    }
                                }
                            }

                            let oldVelocity = velocities.data[i];
                            let acceleration = (velocitySum / ${forceFactor});
                            var newVelocity = (oldVelocity + acceleration) * ${frictionFactor};
                            velocities.data[i] = newVelocity;

                            var newPos = myPos + newVelocity * deltaTime;

                            // No walls
                            nextPositions.data[i] = myPos + newVelocity * deltaTime;

                            // With walls
                            // let margin = f32(${PARTICLE_SIZE});
                            // if (newPos.x < margin || newPos.x > ${CANVAS_WIDTH}.0 - margin) {
                            //   newVelocity.x = -newVelocity.x * 1.8;
                            //   newPos.x = clamp(newPos.x, margin, ${CANVAS_WIDTH}.0 - margin);
                            // }
                            // if (newPos.y < margin || newPos.y > ${CANVAS_HEIGHT}.0 - margin) {
                            //   newVelocity.y = -newVelocity.y * 1.8;
                            //   newPos.y = clamp(newPos.y, margin, ${CANVAS_HEIGHT}.0 - margin);
                            // }

                            // Wall Wrapping
                            // var newPos = myPos + newVelocity * deltaTime;
                            // if (newPos.x < 0.0) {
                            //     newPos.x += ${CANVAS_WIDTH}.0;
                            // } else if (newPos.x > ${CANVAS_WIDTH}.0) {
                            //     newPos.x -= ${CANVAS_WIDTH}.0;
                            // }
                            // if (newPos.y < 0.0) {
                            //     newPos.y += ${CANVAS_HEIGHT}.0;
                            // } else if (newPos.y > ${CANVAS_HEIGHT}.0) {
                            //     newPos.y -= ${CANVAS_HEIGHT}.0;
                            // }

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
                            pad: f32 // Padding to ensure the struct size is aligned to 16 bytes (required for uniform buffers)
                        };

                        @group(0) @binding(1) var<uniform> camera: Camera;

                        @vertex
                        fn main(
                            @location(0) localPos: vec2f,
                            @location(1) instancePos: vec2f,
                            @location(2) particleType: u32
                        ) -> VertexOutput {
                            var out: VertexOutput;

                            let worldPos = instancePos + localPos * ${PARTICLE_SIZE};
                            let pos = (worldPos - camera.center) * camera.zoomFactor;

                            out.position = vec4f(
                                (pos.x / ${CANVAS_WIDTH}.0) * 2.0,
                                -(pos.y / ${CANVAS_HEIGHT}.0) * 2.0,
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
            computeBindGroup = device.createBindGroup({
                layout: computePipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: currentPositionBuffer } },
                    { binding: 1, resource: { buffer: nextPositionBuffer } },
                    { binding: 2, resource: { buffer: velocityBuffer } },
                    { binding: 3, resource: { buffer: typeBuffer } },
                    { binding: 4, resource: { buffer: rulesMatrixBuffer } },
                    { binding: 5, resource: { buffer: minRangeBuffer } },
                    { binding: 6, resource: { buffer: maxRangeBuffer } },
                    { binding: 7, resource: { buffer: deltaTimeBuffer } },
                ]
            })

            renderBindGroup = device.createBindGroup({
                layout: renderPipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: colorBuffer } },
                    { binding: 1, resource: { buffer: cameraBuffer } }
                ]
            })
        }
        // -------------------------------------------------------------------------------------------------------------
        function initColors() {
            const colors = new Float32Array(NUM_TYPES * 3)

            for (let i = 0; i < NUM_TYPES; ++i) {
                colors[i * 3 + 0] = Math.random()
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

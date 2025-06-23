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

        let canvasRef: HTMLCanvasElement | undefined
        let ctx: GPUCanvasContext
        let CANVAS_WIDTH: number = 0
        let CANVAS_HEIGHT: number = 0
        let animationFrameId: number | null = null

        const NUM_PARTICLES = 20480
        const PARTICLE_SIZE = 2
        const NUM_TYPES = 6

        let device: GPUDevice
        let computePipeline: GPUComputePipeline
        let renderPipeline: GPURenderPipeline

        let positionBuffer: GPUBuffer
        let velocityBuffer: GPUBuffer
        let typeBuffer: GPUBuffer
        let colorBuffer: GPUBuffer
        let rulesMatrixBuffer: GPUBuffer
        let minRangeBuffer: GPUBuffer
        let maxRangeBuffer: GPUBuffer

        let computeBindGroup: GPUBindGroup
        let renderBindGroup: GPUBindGroup

        const fps = useFps()

        onMounted(() => {
            initWebGPU()

            useEventListener('resize', handleResize)
        })
        // -------------------------------------------------------------------------------------------------------------
        function handleResize() {
            CANVAS_WIDTH = canvasRef!.width = canvasRef!.clientWidth
            CANVAS_HEIGHT = canvasRef!.height = canvasRef!.clientHeight
        }

        const initWebGPU = async () => {
            const adapter = await navigator.gpu.requestAdapter()
            if (!adapter) throw new Error("WebGPU adapter not found")

            device = await adapter.requestDevice()

            canvasRef = document.getElementById('canvasRef') as HTMLCanvasElement
            ctx = canvasRef.getContext('webgpu')!
            handleResize()


            ctx.configure({
                device,
                format: navigator.gpu.getPreferredCanvasFormat(),
                alphaMode: 'opaque'
            })

            createBuffers()
            createPipelines()
            createBindGroups()
            animationFrameId = requestAnimationFrame(frame)
        }


        const frame = () => {
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
            renderPass.setVertexBuffer(0, positionBuffer)
            renderPass.setVertexBuffer(1, typeBuffer)
            renderPass.setBindGroup(0, renderBindGroup)
            renderPass.draw(NUM_PARTICLES)
            renderPass.end()

            device.queue.submit([encoder.finish()])
            animationFrameId = requestAnimationFrame(frame)
        }


        const createBuffers = () => {
            const positions = new Float32Array(NUM_PARTICLES * 2)
            const velocities = new Float32Array(NUM_PARTICLES * 2)
            const types = new Uint32Array(NUM_PARTICLES)
            const rulesMatrix = new Float32Array(NUM_TYPES * NUM_TYPES)
            const minRanges = new Float32Array(NUM_TYPES * NUM_TYPES)
            const maxRanges = new Float32Array(NUM_TYPES * NUM_TYPES)
            const colors = new Float32Array(NUM_TYPES * 3)

            for (let i = 0; i < NUM_PARTICLES; i++) {
                positions[2 * i] = Math.random() * CANVAS_WIDTH
                positions[2 * i + 1] = Math.random() * CANVAS_HEIGHT
                velocities[2 * i] = 0
                velocities[2 * i + 1] = 0
                types[i] = Math.floor(Math.random() * NUM_TYPES)
            }

            for (let i = 0; i < NUM_TYPES * NUM_TYPES; i++) {
                rulesMatrix[i] = (Math.random() - 0.5) * 2.0
                // minRanges[i] = 5 + Math.random() * 10
                // maxRanges[i] = 20 + Math.random() * 40
                minRanges[i] = 5
                maxRanges[i] = 20
            }

            for (let i = 0; i < NUM_TYPES; i++) {
                colors[i * 3 + 0] = Math.random()
                colors[i * 3 + 1] = Math.random()
                colors[i * 3 + 2] = Math.random()
            }
            console.log(`Colors: ${colors}`)
            console.log(`Types: ${types}`)
            console.log(`Positions: ${positions}`)
            console.log(`Velocities: ${velocities}`)
            console.log(`Rules Matrix: ${rulesMatrix}`)
            console.log(`Min Ranges: ${minRanges}`)
            console.log(`Max Ranges: ${maxRanges}`)

            positionBuffer = device.createBuffer({
                size: positions.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            })
            new Float32Array(positionBuffer.getMappedRange()).set(positions)
            positionBuffer.unmap()

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
                size: rulesMatrix.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            })
            new Float32Array(rulesMatrixBuffer.getMappedRange()).set(rulesMatrix)
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

            colorBuffer = device.createBuffer({
                size: colors.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            })

            new Float32Array(colorBuffer.getMappedRange()).set(colors)
            colorBuffer.unmap()
        }

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

                        @group(0) @binding(0) var<storage, read_write> positions : Particles;
                        @group(0) @binding(1) var<storage, read_write> velocities : Particles;
                        @group(0) @binding(2) var<storage, read> types : Types;
                        @group(0) @binding(3) var<storage, read> rules : Matrix;
                        @group(0) @binding(4) var<storage, read> colors: Matrix;
                        @group(0) @binding(5) var<storage, read> minRanges: Matrix;
                        @group(0) @binding(6) var<storage, read> maxRanges: Matrix;

                        @compute @workgroup_size(64)
                        fn main(@builtin(global_invocation_id) id: vec3<u32>) {
                          let i = id.x;
                          if (i >= ${NUM_PARTICLES}u) { return; }

                          let myPos = positions.data[i];
                          let myType = types.data[i];
                          var velocitySum = vec2<f32>(0.0, 0.0);
                          var acc = vec2<f32>(0.0, 0.0);

                          for (var j = 0u; j < ${NUM_PARTICLES}u; j = j + 1u) {
                            if (i == j) { continue; }

                            let otherPos = positions.data[j];
                            let otherType = types.data[j];
                            let delta = otherPos - myPos;
                            let dist = length(delta);

                            let index = myType * ${NUM_TYPES}u + otherType;
                            let minR = minRanges.data[index];
                            let maxR = maxRanges.data[index];
                            let rule = rules.data[index];

                            // Répulsion forte à courte distance
                            var force = 0.0;
                            if (dist < minR) {
                              force = (1.0 / minR) * dist - 1.0;
                            } else if (dist <= maxR) {
                              let mid = (minR + maxR) / 2.0;
                              let slope = rule / (mid - minR);
                              force = -(slope * abs(dist - mid)) + rule;
                            }

                            if (force != 0.0) {
                              velocitySum += delta / dist * force;
                            }
                          }

                          velocities.data[i] = velocitySum / 0.5;
                          positions.data[i] += velocities.data[i] * 0.1;
                        }
                    `
            })

            const vertexShader = device.createShaderModule({
                code: `
                        struct VertexOutput {
                          @builtin(position) position: vec4<f32>,
                          @location(0) @interpolate(flat) particleType: u32
                        };

                        @vertex
                        fn main(@location(0) pos: vec2<f32>, @location(1) particleType: u32) -> VertexOutput {
                          var output: VertexOutput;
                          output.position = vec4<f32>(
                            (pos.x / ${CANVAS_WIDTH}.0) * 2.0 - 1.0,
                            -((pos.y / ${CANVAS_HEIGHT}.0) * 2.0 - 1.0),
                            0.0,
                            1.0
                          );
                          output.particleType = particleType;
                          return output;
                        }
                    `
            })

            const fragmentShader = device.createShaderModule({
                code: `
                        struct Colors {
                          data: array<vec3<f32>>
                        };

                        @group(0) @binding(4) var<storage, read> colors: Colors;

                        @fragment
                        fn main(@location(0) @interpolate(flat) particleType: u32) -> @location(0) vec4<f32> {
                          let color = colors.data[particleType];
                          return vec4<f32>(color, 1.0);
                        }
                      `
            })


            renderPipeline = device.createRenderPipeline({
                layout: 'auto',
                vertex: {
                    module: vertexShader,
                    entryPoint: 'main',
                    buffers: [
                        {
                            arrayStride: 8,
                            attributes: [{ shaderLocation: 0, format: 'float32x2', offset: 0 }]
                        },
                        {
                            arrayStride: 4,
                            attributes: [{ shaderLocation: 1, format: 'uint32', offset: 0 }]
                        }
                    ]
                },
                fragment: {
                    module: fragmentShader,
                    entryPoint: 'main',
                    targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }]
                },
                primitive: { topology: 'point-list' }
            })

            computePipeline = device.createComputePipeline({
                layout: 'auto',
                compute: {
                    module: computeShader,
                    entryPoint: 'main'
                }
            })
        }

        const createBindGroups = () => {
            computeBindGroup = device.createBindGroup({
                layout: computePipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: positionBuffer } },
                    { binding: 1, resource: { buffer: velocityBuffer } },
                    { binding: 2, resource: { buffer: typeBuffer } },
                    { binding: 3, resource: { buffer: rulesMatrixBuffer } },
                    { binding: 5, resource: { buffer: minRangeBuffer } },
                    { binding: 6, resource: { buffer: maxRangeBuffer } }
                ]
            })

            renderBindGroup = device.createBindGroup({
                layout: renderPipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 4, resource: { buffer: colorBuffer } }
                ]
            })
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

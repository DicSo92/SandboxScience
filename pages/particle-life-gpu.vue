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
        let canvasWidth: number = 0
        let canvasHeight: number = 0
        let animationFrameId: number | null = null

        const NUM_PARTICLES = 500
        const PARTICLE_SIZE = 2

        let device: GPUDevice
        let positionBuffer: GPUBuffer
        let velocityBuffer: GPUBuffer
        let computePipeline: GPUComputePipeline
        let renderPipeline: GPURenderPipeline
        let bindGroup: GPUBindGroup

        const fps = useFps()

        onMounted(() => {
            initWebGPU();

            useEventListener('resize', handleResize)
        })
        // -------------------------------------------------------------------------------------------------------------
        function handleResize() {
            canvasWidth = canvasRef!.width = canvasRef!.clientWidth
            canvasHeight = canvasRef!.height = canvasRef!.clientHeight
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
            createBindGroup()
            animationFrameId = requestAnimationFrame(frame)
        }

        const frame = () => {
            const encoder = device.createCommandEncoder()

            const computePass = encoder.beginComputePass()
            computePass.setPipeline(computePipeline)
            computePass.setBindGroup(0, bindGroup)
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
            renderPass.draw(NUM_PARTICLES)
            renderPass.end()

            device.queue.submit([encoder.finish()])
            animationFrameId = requestAnimationFrame(frame)
        }

        const createBuffers = () => {
            const positions = new Float32Array(NUM_PARTICLES * 2)
            const velocities = new Float32Array(NUM_PARTICLES * 2)

            for (let i = 0; i < NUM_PARTICLES; i++) {
                positions[2 * i] = Math.random() * canvasWidth
                positions[2 * i + 1] = Math.random() * canvasHeight
                velocities[2 * i] = 0
                velocities[2 * i + 1] = 0
            }

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
        }

        const createPipelines = () => {
            const computeShader = device.createShaderModule({
                code: `
        struct Particles {
          data: array<vec2<f32>>
        };

        @group(0) @binding(0) var<storage, read_write> positions : Particles;
        @group(0) @binding(1) var<storage, read_write> velocities : Particles;

        @compute @workgroup_size(64)
        fn main(@builtin(global_invocation_id) id : vec3<u32>) {
          let i = id.x;
          if (i >= ${NUM_PARTICLES}u) { return; }

          var acc = vec2<f32>(0.0, 0.0);
          let myPos = positions.data[i];

          for (var j = 0u; j < ${NUM_PARTICLES}u; j = j + 1u) {
            if (i == j) { continue; }
            let other = positions.data[j];
            let diff = other - myPos;
            let distSqr = max(dot(diff, diff), 1.0);
            acc += normalize(diff) / distSqr;
          }

          velocities.data[i] += acc * 0.05;
          positions.data[i] += velocities.data[i];
        }
        `
            })

            computePipeline = device.createComputePipeline({
                layout: 'auto',
                compute: {
                    module: computeShader,
                    entryPoint: 'main'
                }
            })

            const vertexShader = device.createShaderModule({
                code: `
        @vertex
        fn main(@location(0) pos: vec2<f32>) -> @builtin(position) vec4<f32> {
          return vec4<f32>(
            (pos.x / ${canvasWidth}.0) * 2.0 - 1.0,
            -((pos.y / ${canvasHeight}.0) * 2.0 - 1.0),
            0.0,
            1.0
          );
        }
        `
            })

            const fragmentShader = device.createShaderModule({
                code: `
        @fragment
        fn main() -> @location(0) vec4<f32> {
          return vec4<f32>(1.0, 1.0, 1.0, 1.0);
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
                            attributes: [
                                { shaderLocation: 0, format: 'float32x2', offset: 0 }
                            ]
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
        }

        const createBindGroup = () => {
            bindGroup = device.createBindGroup({
                layout: computePipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: positionBuffer } },
                    { binding: 1, resource: { buffer: velocityBuffer } }
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

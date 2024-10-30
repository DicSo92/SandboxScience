<template>
    <section absolute w-full h-full>
        <canvas id="controlsCanvas" @contextmenu.prevent w-full h-full cursor-crosshair></canvas>
        <div v-if="particleLife.isCapturingGIF" class="absolute top-16 left-1/2 transform -translate-x-1/2" w-64 h-6 rounded-full border-2 border-gray-500 flex justify-center items-center>
            <div absolute left-0 h-4 class="px-[2px]" :style="{ width: `${GIFCaptureProgress}%` }">
                <div rounded-full w-full h-full class="bg-[#E45C3A]"></div>
            </div>
            <span text-gray-300 absolute font-semibold class="drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">Capturing GIF... {{ GIFCaptureProgress }}%</span>
        </div>
    </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { GIFEncoder, quantize, applyPalette } from "gifenc";

export default defineComponent({
    props: {
        getSelectedAreaImageData: {
            type: Function as PropType<() => ImageData>,
            required: true
        }
    },
    setup(props, { emit, expose }) {
        const particleLife = useParticleLifeStore()
        let controlsCanvas: HTMLCanvasElement | undefined
        let ctx: CanvasRenderingContext2D | undefined

        const GIFCaptureProgress = ref<number>(0)
        let captureAreaBorderSize: number = 4
        let captureAreaBorderColor: string = '#1b50a8'
        let canvasColor: string = 'rgba(80,80,80,0.2)'

        let canSelectCaptureArea: boolean = true
        let isHandlingCaptureArea: boolean = false
        let startingCaptureArea: { x: number, y: number } | null = null
        let endingCaptureArea: { x: number, y: number } | null = null
        let currentCaptureArea: { x: number, y: number, width: number, height: number } | null = null
        let GIFCaptureCount: number = 0
        let GIFFrames: Uint8ClampedArray[] = []
        let GIFOptions: { x: number, y: number, width: number, height: number, delay: number, frames: number }

        let pointerX: number = 0
        let pointerY: number = 0
        let canvasWidth: number = 0
        let canvasHeight: number = 0
        // -------------------------------------------------------------------------------------------------------------
        onMounted(() => {
            controlsCanvas = document.getElementById('controlsCanvas') as HTMLCanvasElement
            ctx = controlsCanvas?.getContext('2d') || undefined
            handleResize()

            ctx!.clearRect(0, 0, canvasWidth, canvasHeight)
            ctx!.fillStyle = canvasColor // Fill the entire canvas with a semi-transparent color
            ctx!.fillRect(0, 0, canvasWidth, canvasHeight)

            useEventListener('resize', handleResize)
            useEventListener(controlsCanvas, ['mousemove'], (e) => {
                pointerX = e.x - lifeCanvas!.getBoundingClientRect().left
                pointerY = e.y - lifeCanvas!.getBoundingClientRect().top

                if (e.buttons > 0) { // if mouse is pressed
                    if (e.buttons === 1) { // if primary button is pressed (left click)
                        if (canSelectCaptureArea) handleSelectCaptureArea()
                    }
                }
            })
            useEventListener(controlsCanvas, ['mouseup'], (e) => {
                if (canSelectCaptureArea && isHandlingCaptureArea && e.button === 0) {
                    makeCapture()
                    console.log('mouseup')
                }
            })
        })
        // -------------------------------------------------------------------------------------------------------------
        function handleResize() {
            canvasWidth = controlsCanvas!.width = controlsCanvas!.clientWidth
            canvasHeight = controlsCanvas!.height = controlsCanvas!.clientHeight
        }
        function handleSelectCaptureArea() {
            startingCaptureArea = startingCaptureArea || { x: pointerX, y: pointerY }
            endingCaptureArea = { x: pointerX, y: pointerY }
            isHandlingCaptureArea = true
            drawCaptureArea()
        }
        function makeCapture() {
            canSelectCaptureArea = false
            if (particleLife.captureType === 'screenshot') {
                takeScreenshot()
            } else if (particleLife.captureType === 'GIF') {
                takeGIF()
            }
        }
        // -------------------------------------------------------------------------------------------------------------
        function takeScreenshot() {
            // Define capture zone
            const x = currentCaptureArea.x + captureAreaBorderSize / 2
            const y = currentCaptureArea.y + captureAreaBorderSize / 2
            const width = currentCaptureArea.width - captureAreaBorderSize
            const height = currentCaptureArea.height - captureAreaBorderSize

            // Get image data from the canvas
            const imageData = props.getSelectedAreaImageData(x, y, width, height)

            // Create a new canvas to draw the captured data
            const newCanvas = document.createElement('canvas')
            newCanvas.width = width
            newCanvas.height = height
            const newCtx = newCanvas.getContext('2d')

            newCtx!.putImageData(imageData, 0, 0) // Draw image data on the new canvas
            const imageURL = newCanvas.toDataURL('image/png') // Convert canvas to image URL

            // Download the image
            const link = document.createElement('a')
            link.href = imageURL
            link.download = 'particle-life_screenshot.png'
            link.click()

            canSelectCaptureArea = false
            isHandlingCaptureArea = false
            startingCaptureArea = null
            endingCaptureArea = null
            currentCaptureArea = null

            // Clear the canvas
            ctx!.clearRect(0, 0, canvasWidth, canvasHeight)
            particleLife.isControlsCanvasOpen = false
        }
        // -------------------------------------------------------------------------------------------------------------
        function takeGIF() {
            if (!startingCaptureArea || !endingCaptureArea) return
            const fps = 30
            const duration = 3 // seconds
            GIFOptions = {
                x: currentCaptureArea.x + captureAreaBorderSize / 2,
                y: currentCaptureArea.y + captureAreaBorderSize / 2,
                width: currentCaptureArea.width - captureAreaBorderSize,
                height: currentCaptureArea.height - captureAreaBorderSize,
                delay: 1 / fps * 1000,
                frames: Math.ceil(duration * fps)
            }
            GIFFrames = []
            GIFCaptureCount = 0
            // captureFrame()
            particleLife.isCapturingGIF = true
        }
        function captureFrame(context: CanvasRenderingContext2D) {
            const imageData = context.getImageData(GIFOptions.x, GIFOptions.y, GIFOptions.width, GIFOptions.height).data
            GIFFrames.push(imageData)
            GIFCaptureCount++
            GIFCaptureProgress.value = Math.round((GIFCaptureCount / GIFOptions.frames) * 100)
            if (GIFCaptureCount === GIFOptions.frames) {
                particleLife.isCapturingGIF = false
                generateGif()
            }
        }
        function generateGif() {
            console.log('Generating GIF...')
            const delay = GIFOptions.delay
            const gif = GIFEncoder()
            GIFFrames.forEach((frame) => {
                const palette = quantize(frame, 256)
                const index = applyPalette(frame, palette)
                gif.writeFrame(index, GIFOptions.width, GIFOptions.height, { palette, delay })
            })
            gif.finish()
            console.log('GIF generated !!')

            const buffer = gif.bytesView()
            const blob = new Blob([buffer], { type: 'image/gif' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'particle-life_animation.gif'
            link.click()

            canSelectCaptureArea = false
            isHandlingCaptureArea = false
            startingCaptureArea = null
            endingCaptureArea = null
            currentCaptureArea = null

            // Clear the canvas
            ctx!.clearRect(0, 0, canvasWidth, canvasHeight)
            particleLife.isControlsCanvasOpen = false
        }
        // -------------------------------------------------------------------------------------------------------------
        function drawCaptureArea() {
            if (!startingCaptureArea || !endingCaptureArea) return
            const x = startingCaptureArea.x
            const y = startingCaptureArea.y
            const width = endingCaptureArea.x - x
            const height = endingCaptureArea.y - y
            currentCaptureArea = { x, y, width, height }

            ctx!.clearRect(0, 0, canvasWidth, canvasHeight)
            ctx!.fillStyle = canvasColor // Fill the entire canvas with a semi-transparent color
            ctx!.fillRect(0, 0, canvasWidth, canvasHeight)
            ctx!.clearRect(x, y, width, height) // Clear the capture area to make it transparent

            ctx!.strokeStyle = captureAreaBorderColor
            ctx!.lineWidth = captureAreaBorderSize
            ctx!.strokeRect(x, y, width, height)
        }
        // -------------------------------------------------------------------------------------------------------------
        return { captureFrame, particleLife, GIFCaptureProgress }
    }
})
</script>

<style scoped>
#controlsCanvas {
    background:  transparent;
}
</style>
<template>
    <div absolute w-full h-full>
        <canvas id="trackerCanvas" @contextmenu.prevent w-full h-full cursor-crosshair></canvas>

        <div v-if="isSelecting" pointer-events-none class="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm ring-1 ring-amber-500/40 px-5 py-2.5 rounded-full text-sm animate-pulse">
            <span i-tabler-current-location text-rose-400></span>
            <span text-gray-200>Draw around a creature to start tracking</span>
        </div>

        <div v-if="isSelecting" class="absolute inset-0 pointer-events-none border-3 border-dashed border-amber-500/70 animate-pulse rounded-sm"></div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    props: {},
    emits: ['trackerZoneSelected'],
    setup(props, { emit }) {
        const particleLife = useParticleLifeStore()
        let trackerCanvas: HTMLCanvasElement | undefined
        let ctx: CanvasRenderingContext2D | undefined

        const isSelecting = ref<boolean>(true)
        let trackerAreaBorderSize: number = 4
        let trackerAreaBorderColor: string = '#06b6d4' // cyan-500

        let isHandlingTrackerArea: boolean = false
        let startingTrackerArea: { x: number, y: number } | null = null
        let endingTrackerArea: { x: number, y: number } | null = null

        let currentTrackerArea: { x: number, y: number, width: number, height: number } | null = null

        let pointerX: number = 0
        let pointerY: number = 0
        let canvasWidth: number = 0
        let canvasHeight: number = 0
        // -------------------------------------------------------------------------------------------------------------
        onMounted(() => {
            trackerCanvas = document.getElementById('trackerCanvas') as HTMLCanvasElement
            ctx = trackerCanvas?.getContext('2d') || undefined
            handleResize()
            drawBackground()

            useEventListener('resize', handleResize)
            useEventListener(trackerCanvas, ['mousemove'], (e) => {
                pointerX = e.x - trackerCanvas!.getBoundingClientRect().left
                pointerY = e.y - trackerCanvas!.getBoundingClientRect().top

                if (e.buttons > 0) { // if mouse is pressed
                    if (e.buttons === 1) { // if primary button is pressed (left click)
                        handleSelectTrackerArea()
                    }
                }
            })
            useEventListener(trackerCanvas, ['mouseup'], (e) => {
                if (isHandlingTrackerArea && e.button === 0) {
                    confirmTrackerArea()
                }
            })
        })
        // -------------------------------------------------------------------------------------------------------------
        function handleResize() {
            canvasWidth = trackerCanvas!.width = trackerCanvas!.clientWidth
            canvasHeight = trackerCanvas!.height = trackerCanvas!.clientHeight
        }
        function handleSelectTrackerArea() {
            startingTrackerArea = startingTrackerArea || { x: pointerX, y: pointerY }
            endingTrackerArea = { x: pointerX, y: pointerY }
            isHandlingTrackerArea = true
            drawTrackerArea()
        }
        // -------------------------------------------------------------------------------------------------------------
        function confirmTrackerArea() {
            if (!currentTrackerArea) return

            const x = currentTrackerArea.x + trackerAreaBorderSize / 2
            const y = currentTrackerArea.y + trackerAreaBorderSize / 2
            const width = currentTrackerArea.width - trackerAreaBorderSize
            const height = currentTrackerArea.height - trackerAreaBorderSize

            isHandlingTrackerArea = false
            startingTrackerArea = null
            endingTrackerArea = null
            currentTrackerArea = null
            isSelecting.value = false

            emit('trackerZoneSelected', { x, y, width, height })
        }
        // -------------------------------------------------------------------------------------------------------------
        function drawTrackerArea() {
            if (!startingTrackerArea || !endingTrackerArea) return
            const x = Math.min(startingTrackerArea.x, endingTrackerArea.x)
            const y = Math.min(startingTrackerArea.y, endingTrackerArea.y)
            const width = Math.abs(endingTrackerArea.x - startingTrackerArea.x)
            const height = Math.abs(endingTrackerArea.y - startingTrackerArea.y)
            currentTrackerArea = { x, y, width, height }

            drawBackground()
            ctx!.clearRect(x, y, width, height)

            ctx!.strokeStyle = trackerAreaBorderColor
            ctx!.lineWidth = trackerAreaBorderSize
            ctx!.setLineDash([8, 4])
            ctx!.strokeRect(x, y, width, height)
            ctx!.setLineDash([])

            // Centre crosshair
            const cx = x + width / 2
            const cy = y + height / 2
            ctx!.beginPath()
            ctx!.moveTo(cx - 10, cy)
            ctx!.lineTo(cx + 10, cy)
            ctx!.moveTo(cx, cy - 10)
            ctx!.lineTo(cx, cy + 10)
            ctx!.stroke()
        }
        function drawBackground() { // Fill the entire canvas with a semi-transparent color
            ctx!.clearRect(0, 0, canvasWidth, canvasHeight)
            ctx!.fillStyle = 'rgba(30, 30, 40, 0.3)'
            ctx!.fillRect(0, 0, canvasWidth, canvasHeight)
        }
        // -------------------------------------------------------------------------------------------------------------
        return { isSelecting, particleLife }
    }
})
</script>

<style scoped>

</style>
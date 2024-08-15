<template>
    <section h-screen flex flex-col justify-center overflow-hidden relative>
        <div flex-1 relative>
            <canvas ref="canvas" id="canvas" @contextmenu.prevent h-full w-full></canvas>
        </div>
    </section>
</template>

<script lang="ts">
export default defineComponent({
    setup() {
        definePageMeta({ layout: 'life' })

        // Define canvas and context for drawing
        let canvas: HTMLCanvasElement | undefined
        let ctx: CanvasRenderingContext2D | undefined
        let canvasWidth: number = 0
        let canvasHeight: number = 0
        let imageData: ImageData | undefined
        let imageDataArray: Int32Array | number[]
        let animationFrameId: number | null = null

        const game = useQuadStore()
        const cellSize = ref<number>(16)
        const rowx = ref<number>(0) // starting row
        const colx = ref<number>(0) // starting column
        const zoom = ref<number>(4)
        const isDragging = ref<boolean>(false)

        const MIN_GRID_CELL_SIZE = 8
        let hasGrid: boolean = true
        let pointerX: number = 0
        let pointerY: number = 0

        const rows = computed(() => {
            return Math.ceil(canvasHeight / cellSize.value) + 1
        })
        const cols = computed(() => {
            return Math.ceil(canvasWidth / cellSize.value) + 1
        })
        const row0 = computed(() => {
            return Math.floor(rowx.value)
        })
        const col0 = computed(() => {
            return Math.floor(colx.value)
        })
        const cellWidth = computed(() => {
            if (cellSize.value >= MIN_GRID_CELL_SIZE) return cellSize.value - 1
            return Math.max(1, cellSize.value)
        })
        const rowOffset = computed(() => {
            return Math.round(cellSize.value * (rowx.value - row0.value))
        })
        const colOffset = computed(() => {
            return Math.round(cellSize.value * (colx.value - col0.value))
        })

        onMounted(() => {
            canvas = document.getElementById('canvas') as HTMLCanvasElement
            ctx = canvas?.getContext('2d') || undefined
            initCanvas()

            useEventListener('resize', handleResize)
            useEventListener(canvas, ['mousemove'], (e) => {
                pointerX = e.x - canvas!.getBoundingClientRect().left
                pointerY = e.y - canvas!.getBoundingClientRect().top

                // Single button actions
                if (e.buttons > 0) { // if mouse is pressed
                    isDragging.value = true
                    if (e.buttons === 1) { // if primary button is pressed (left click)
                        if (!game.wasRunning) game.wasRunning = game.isRunning // store the running state
                        game.isRunning = false // pause the game
                        // toggleCell(e)
                    } else if (e.buttons === 4) { // if wheel button is pressed
                        handleMove(e)
                    }
                }
                // Reset the dragging state and resume the game if it was running when all buttons are released
                if (e.buttons === 0) {
                    isDragging.value = false
                    if (game.wasRunning) {
                        game.isRunning = game.wasRunning
                        game.wasRunning = false
                    }
                }
            })
            useEventListener(canvas, 'wheel', (e) => {
                if (e.deltaY < 0) { // Zoom in
                    handleZoom(1, pointerX, pointerY)
                } else { // Zoom out
                    handleZoom(-1, pointerX, pointerY)
                }
            })
        })
        //--------------------------------------------------------------------------------------------------------------
        //--------------------------------------------------------------------------------------------------------------
        function handleZoom(delta: number, x: number, y: number) {
            if (zoom.value + delta > 8 || zoom.value + delta < -8) return
            zoom.value += delta
            console.log(zoom.value)

            const cx = colx.value + x / cellSize.value
            const cy = rowx.value + y / cellSize.value
            cellSize.value *= Math.pow(2, delta)
            colx.value = cx - x / cellSize.value
            rowx.value = cy - y / cellSize.value
            if (!game.isRunning) requestAnimationFrame(draw) // redraw
        }
        function handleMove(e: { movementY: number; movementX: number; }) {
            console.log('handleMove')
            rowx.value -= e.movementY / cellSize.value
            colx.value -= e.movementX / cellSize.value
            if (!game.isRunning) requestAnimationFrame(draw) // redraw
        }
        function handleResize() {
            canvasWidth = canvas!.width = canvas!.clientWidth
            canvasHeight = canvas!.height = canvas!.clientHeight
            if (!game.isRunning) requestAnimationFrame(draw) // redraw
        }
        function center() {
            rowx.value = -canvasHeight / cellSize.value / 2
            colx.value = -canvasWidth / cellSize.value / 2
        }
        //--------------------------------------------------------------------------------------------------------------
        //--------------------------------------------------------------------------------------------------------------
        function initCanvas() {
            handleResize() // resize and draw the grid
            center() // center the grid on the canvas view
        }
        function draw() {
            ctx!.clearRect(0, 0, canvasWidth, canvasHeight)

            imageData = ctx!.createImageData(canvasWidth, canvasHeight)
            imageDataArray = new Int32Array(imageData.data.buffer)

            ctx!.putImageData(imageData, 0, 0)

            if (cellSize.value >= MIN_GRID_CELL_SIZE && hasGrid) {
                drawGrid()
            }
        }
        function drawGrid() {
            ctx!.beginPath()
            for (let row = 0; row < rows.value; row++) {
                const y = cellSize.value * row - rowOffset.value + cellWidth.value + 0.5
                ctx!.moveTo(0, y)
                ctx!.lineTo(canvasWidth, y)
            }
            for (let col = 0; col < cols.value; col++) {
                const x = cellSize.value * col - colOffset.value + cellWidth.value + 0.5
                ctx!.moveTo(x, 0)
                ctx!.lineTo(x, canvasHeight)
            }
            ctx!.strokeStyle = '#707070'
            ctx!.stroke()
        }


        class Node {
            nw: Node | null;
            ne: Node | null;
            sw: Node | null;
            se: Node | null;
            level: number;

            constructor(level: number) {
                this.nw = null;
                this.ne = null;
                this.sw = null;
                this.se = null;
                this.level = level;
            }
        }
    }
})
</script>

<style scoped>
#canvas {
    background-color: #000;
}
</style>
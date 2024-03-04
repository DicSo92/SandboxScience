<template>
    <section h-full flex>
        <canvas ref="lifeCanvas" @contextmenu.prevent w-full h-full></canvas>
    </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
    setup() {
        const lifeCanvas = ref<HTMLCanvasElement | undefined>()
        let ctx: CanvasRenderingContext2D | undefined
        let canvasWidth: number = 0
        let canvasHeight: number = 0

        const numParticles: number = 2000
        const particleSize: number = 2
        const numColors: number = 10
        const randomZDepth: number = 20
        const is3D: boolean = true

        const colorList: string[] = ['yellow', 'red', 'green', 'cyan', 'magenta', 'blue', 'white', 'orange', 'purple', 'pink']
        let currentColors: number[] = []
        let rulesMatrix: number[][] = []

        let maxRadius: number = 60 // maximum distance for particles to start attracting
        let minRadius: number = 20 // minimum distance for particles to start repelling
        let repel: number = 1 // repel force for particles that are too close to each other
        let forceFactor: number = 0.4 // Decrease will increase the impact of the force on the velocity
        let frictionFactor: number = 0.6 // Slow down the particles (0 to 1, where 1 is no friction)

        let colors = new Int32Array(numParticles)
        let positionX = new Float32Array(numParticles)
        let positionY = new Float32Array(numParticles)
        let positionZ = new Float32Array(numParticles)
        let velocityX = new Float32Array(numParticles).fill(0)
        let velocityY = new Float32Array(numParticles).fill(0)
        let velocityZ = new Float32Array(numParticles).fill(0)

        let pointerX: number = 0
        let pointerY: number = 0
        let isDragging: boolean = false
        let cameraOffsetX: number = 0
        let cameraOffsetY: number = 0
        let lastPointerX: number = 0
        let lastPointerY: number = 0
        let zoomFactor: number = 1

        onMounted(() => {
            ctx = lifeCanvas.value?.getContext('2d') || undefined
            handleResize()
            initLife()
            update()

            useEventListener('resize', handleResize)
            useEventListener(lifeCanvas, ['mousedown'], (e) => {
                lastPointerX = e.x - lifeCanvas.value!.getBoundingClientRect().left
                lastPointerY = e.y - lifeCanvas.value!.getBoundingClientRect().top
            })
            useEventListener(lifeCanvas, ['mousemove'], (e) => {
                pointerX = e.x - lifeCanvas.value!.getBoundingClientRect().left
                pointerY = e.y - lifeCanvas.value!.getBoundingClientRect().top

                if (e.buttons > 0) { // if mouse is pressed
                    isDragging = true
                    if (e.buttons === 1) { // if primary button is pressed (left click)
                        handleMove()
                    }
                }
                if (e.buttons === 0) {
                    isDragging = false
                }
            })
            useEventListener(lifeCanvas, 'wheel', (e) => {
                if (e.deltaY < 0) { // Zoom in
                    handleZoom(1, pointerX, pointerY)
                } else { // Zoom out
                    handleZoom(-1, pointerX, pointerY)
                }
            })
        })
        // -------------------------------------------------------------------------------------------------------------
        function handleResize() {
            canvasWidth = lifeCanvas.value!.width = lifeCanvas.value!.clientWidth
            canvasHeight = lifeCanvas.value!.height = lifeCanvas.value!.clientHeight
        }
        function handleMove() {
            if (isDragging) {
                cameraOffsetX += (pointerX - lastPointerX) / zoomFactor
                cameraOffsetY += (pointerY - lastPointerY) / zoomFactor
                lastPointerX = pointerX
                lastPointerY = pointerY
            }
        }
        function handleZoom(delta: number, x: number, y: number) {
            const zoomIntensity = 0.1
            zoomFactor += delta * zoomIntensity
            console.log(zoomFactor)
            zoomFactor = Math.max(0.1, Math.min(6, zoomFactor))
            // cameraOffsetX = x - (x - cameraOffsetX) * zoomFactor
            // cameraOffsetY = y - (y - cameraOffsetY) * zoomFactor

            const dx = (x - canvasWidth / 2) / (zoomFactor*zoomFactor)
            const dy = (y - canvasHeight / 2) / (zoomFactor*zoomFactor)
            cameraOffsetX -= dx
            cameraOffsetY -= dy
        }
        // -------------------------------------------------------------------------------------------------------------
        function initLife() {
            initColors()
            initParticles()
            rulesMatrix = makeRandomMatrix()
            console.table(rulesMatrix)
        }
        function initColors() {
            currentColors = [];
            for (let i = 0; i < numColors; ++i) {
                currentColors.push(i);
            }
        }
        function initParticles() {
            for (let i = 0; i < numParticles; ++i) {
                colors[i] = currentColors[Math.floor(Math.random() * numColors)]
                positionX[i] = Math.random() * canvasWidth
                positionY[i] = Math.random() * canvasHeight
                positionZ[i] = Math.random() * randomZDepth
            }
        }
        function makeRandomMatrix() {
            let matrix: number[][] = []
            for (let i = 0; i < numColors; i++) {
                matrix.push([])
                for (let j = 0; j < numColors; j++) {
                    matrix[i].push(Math.random() * 2 - 1)
                }
            }
            return matrix
        }
        // -------------------------------------------------------------------------------------------------------------
        function draw(x: number, y: number, z: number, color: number, size: number) {
            const depthFactor = 1 - z / canvasHeight // Adjust this factor to control the depth effect
            const newSize = size * depthFactor * zoomFactor
            if (newSize <= 0) return
            ctx!.fillStyle = colorList[color]
            ctx!.beginPath()

            const drawX = (x + cameraOffsetX) * zoomFactor
            const drawY = (y + cameraOffsetY) * zoomFactor

            ctx!.fillRect(drawX, drawY, newSize, newSize)
            // ctx!.arc(x + cameraOffsetX, y + cameraOffsetY, newSize, 0, Math.PI * 2)
            // ctx!.fill()
        }
        function getForce(ruleFactor: number, distance: number) {
            if (distance < minRadius) {
                return (repel / minRadius) * distance - repel
            } else if (distance > maxRadius) {
                return 0
            } else {
                let mid = (minRadius + maxRadius) / 2
                let slope = ruleFactor / (mid - minRadius)
                return -(slope * Math.abs(distance - mid)) + ruleFactor
            }
        }
        function processRules() {
            for (let i = 0; i < numParticles; i++) {
                const posXA = positionX[i]
                const posYA = positionY[i]
                const posZA = positionZ[i]
                for (let j = 0; j < numParticles; j++) {
                    if (i === j) continue
                    const posXB = positionX[j]
                    const posYB = positionY[j]
                    const posZB = positionZ[j]

                    let distanceX = Math.abs(posXA - posXB)
                    let distanceY = Math.abs(posYA - posYB)
                    let distanceZ = Math.abs(posZA - posZB)
                    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY + distanceZ * distanceZ)
                    if (distance < maxRadius) {
                        const force = getForce(rulesMatrix[colors[i]][colors[j]], distance)

                        distanceX = (posXB - posXA)
                        distanceY = (posYB - posYA)
                        distanceZ = (posZB - posZA)

                        const cos = distanceX / distance
                        const sin = distanceY / distance
                        const tan = distanceZ / distance

                        velocityX[i] += cos * force * (1 / forceFactor)
                        velocityY[i] += sin * force * (1 / forceFactor)
                        velocityZ[i] += tan * force * (1 / forceFactor)
                    }
                }
            }
        }
        function updateParticles() {
            ctx!.clearRect(0, 0, canvasWidth, canvasHeight)
            for (let i = 0; i < numParticles; i++) {
                velocityX[i] *= frictionFactor
                velocityY[i] *= frictionFactor
                velocityZ[i] *= frictionFactor
                positionX[i] += velocityX[i]
                positionY[i] += velocityY[i]
                positionZ[i] += velocityZ[i]

                draw(positionX[i], positionY[i], positionZ[i], currentColors[colors[i]], particleSize)
            }
        }
        function update() {
            const startExecutionTime = performance.now()
            processRules()
            updateParticles()
            const executionTime = performance.now() - startExecutionTime
            // console.log('Execution time: ', executionTime + 'ms')
            requestAnimationFrame(update)
        }

        return { lifeCanvas }
    }
})
</script>

<style scoped>
canvas {
    background: black;
}
</style>
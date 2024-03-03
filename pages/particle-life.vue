<template>
    <section h-full flex>
        <canvas ref="canvasRef" @contextmenu.prevent w-full h-full></canvas>
    </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
    setup() {
        const canvasRef = ref<HTMLCanvasElement | undefined>()
        let ctx: CanvasRenderingContext2D | undefined
        let canvasWidth: number = 0
        let canvasHeight: number = 0

        const numParticles: number = 2000
        const particleSize: number = 2
        const numColors: number = 6

        const colorList: string[] = ['yellow', 'red', 'green', 'cyan', 'magenta', 'blue', 'white', 'orange', 'purple', 'pink']
        let currentColors: number[] = []
        let rulesMatrix: number[][] = []

        let maxRadius: number = 40 // maximum distance for particles to start attracting
        let minRadius: number = 20 // minimum distance for particles to start repelling
        let repel: number = 1 // repel force for particles that are too close to each other
        let forceFactor: number = 0.4 // Decrease will increase the impact of the force on the velocity
        let frictionFactor: number = 0.5 // Slow down the particles (0 to 1, where 1 is no friction)

        let colors = new Int32Array(numParticles)
        let positionX = new Float32Array(numParticles)
        let positionY = new Float32Array(numParticles)
        let velocityX = new Float32Array(numParticles).fill(0)
        let velocityY = new Float32Array(numParticles).fill(0)


        onMounted(() => {
            ctx = canvasRef.value?.getContext('2d') || undefined
            canvasWidth = canvasRef.value!.width = canvasRef.value!.clientWidth
            canvasHeight = canvasRef.value!.height = canvasRef.value!.clientHeight
            initLife()
            update()
        })
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
        function draw(x: number, y: number, color: number, size: number) {
            ctx!.fillStyle = colorList[color]
            ctx!.fillRect(x, y, size, size)
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
                for (let j = 0; j < numParticles; j++) {
                    if (i === j) continue
                    let distanceX = Math.abs(positionX[i] - positionX[j])
                    let distanceY = Math.abs(positionY[i] - positionY[j])
                    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)
                    if (distance < maxRadius) {
                        const force = getForce(rulesMatrix[colors[i]][colors[j]], distance)

                        let dx = (positionX[j] - positionX[i])
                        let dy = (positionY[j] - positionY[i])

                        let cos = dx / distance
                        let sin = dy / distance

                        velocityX[i] += cos * force * (1 / forceFactor)
                        velocityY[i] += sin * force * (1 / forceFactor)
                    }
                }
            }
        }
        function updateParticles() {
            ctx!.clearRect(0, 0, canvasWidth, canvasHeight)
            for (let i = 0; i < numParticles; i++) {
                velocityX[i] *= frictionFactor
                velocityY[i] *= frictionFactor
                positionX[i] += velocityX[i]
                positionY[i] += velocityY[i]
                draw(positionX[i], positionY[i], currentColors[colors[i]], particleSize)
            }
        }
        function update() {
            const startExecutionTime = performance.now()
            processRules()
            updateParticles()
            const executionTime = performance.now() - startExecutionTime
            console.log('Execution time: ', executionTime + 'ms')
            requestAnimationFrame(update)
        }

        return { canvasRef }
    }
})
</script>

<style scoped>
canvas {
    background: #0b0b0b;
}
</style>
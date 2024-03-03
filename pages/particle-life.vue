<template>
    <section h-full flex>
        <canvas ref="canvasRef" @contextmenu.prevent w-full h-full></canvas>
    </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
    setup() {
        // const canvasEl: Ref<HTMLCanvasElement | undefined> = ref()
        const canvasRef = ref<HTMLCanvasElement | null>(null)
        let ctx: CanvasRenderingContext2D | undefined
        let canvasWidth: number = 0
        let canvasHeight: number = 0

        let particles: any[] = []
        let particleGroups: any[] = []
        let rulesMatrix: number[][] = []

        const particleSize: number = 1
        const forceRadius: number = 80 * 80
        const numParticles: number = 500
        let numColors: number = 4
        let viscosity = 1
        let time_scale = 0.85

        const colorList: string[] = ['yellow', 'red', 'green', 'cyan', 'magenta', 'blue', 'white']
        let currentColors: number[] = []

        onMounted(() => {
            ctx = canvasRef.value?.getContext('2d') || undefined
            canvasWidth = canvasRef.value!.width = canvasRef.value!.clientWidth
            canvasHeight = canvasRef.value!.height = canvasRef.value!.clientHeight
            console.log(canvasHeight, canvasWidth)

            initLife()
            rulesMatrix = makeRandomMatrix()
            console.log(rulesMatrix)
            console.table(rulesMatrix)
            update()
        })
        function initLife() {
            initColors()
            for (let i = 0; i < numColors; ++i) {
                particleGroups.push(create(numParticles, currentColors[i]))
            }
        }
        function initColors() {
            currentColors = [];
            for (let i = 0; i < numColors; ++i) {
                currentColors.push(i);
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
        function newParticle(x: number, y: number, color: string) {
            // return { x: x, y: y, vx: 0, vy: 0, color: color }
            return [x, y, 0, 0, color]
        }
        function random() {
            return Math.random() * canvasWidth -50
        }
        function create(count: number, color: number) {
            let group = []
            for (let i = 0; i < count; i++) {
                group.push([random(), random(), 0, 0, color])
                particles.push(group[i])
            }
            return group
        }

        function processRules(particlesA: any[], particlesB: any[], g: number) { // g is the gravitational constant
            // for (const a of particles) {
            //     let forceX = 0
            //     let forceY = 0
            //     for (const b of particles) {
            //         if (a === b) continue
            //         let distanceX = a[0] - b[0]
            //         let distanceY = a[1] - b[1]
            //         if (distanceX !== 0 && distanceY !== 0) {
            //             // distance between the two particles (pythagorean theorem)
            //             const distance = distanceX * distanceX + distanceY * distanceY
            //             if (distance < forceRadius) {
            //                 // gravitational force
            //                 const force = rulesMatrix[a[4]][b[4]] / Math.sqrt(distance) // f = g * m1 * m2 / r^2 simplified to f = g / r where m1 and m2 are 1
            //                 forceX += force * distanceX
            //                 forceY += force * distanceY
            //             }
            //         }
            //         const vmix = (1. - viscosity);
            //         a[2] = a[2] * vmix + forceX * time_scale
            //         a[3] = a[3] * vmix + forceY * time_scale
            //
            //         a[0] += a[2]
            //         a[1] += a[3]
            //
            //         // When Atoms touch or bypass canvas borders
            //         if (a[0] < 0) {
            //             a[0] = -a[0];
            //             a[2] *= -1;
            //         }
            //         if (a[0] >= canvasWidth) {
            //             a[0] = 2 * canvasWidth - a[0];
            //             a[2] *= -1;
            //         }
            //         if (a[1] < 0) {
            //             a[1] = -a[1];
            //             a[3] *= -1;
            //         }
            //         if (a[1] >= canvasHeight) {
            //             a[1] = 2 * canvasHeight - a[1];
            //             a[3] *= -1;
            //         }
            //     }
            // }

            for (let i = 0; i < particlesA.length; i++) {
                let forceX = 0
                let forceY = 0
                let a = particlesA[i]
                for (let j = 0; j < particlesB.length; j++) {
                    let b = particlesB[j]
                    if (a === b) continue
                    let distanceX = a[0] - b[0]
                    let distanceY = a[1] - b[1]
                    if (distanceX !== 0 && distanceY !== 0) {
                        // distance between the two particles (pythagorean theorem)
                        const distance = distanceX * distanceX + distanceY * distanceY
                        if (distance < forceRadius) {
                            // gravitational force
                            const force = g / Math.sqrt(distance) // f = g * m1 * m2 / r^2 simplified to f = g / r where m1 and m2 are 1
                            forceX += force * distanceX
                            forceY += force * distanceY
                        }
                    }
                }
                const vmix = (1. - viscosity);
                a[2] = a[2] * vmix + forceX * time_scale
                a[3] = a[3] * vmix + forceY * time_scale

                a[0] += a[2]
                a[1] += a[3]

                // When Atoms touch or bypass canvas borders
                if (a[0] < 0) {
                    a[0] = -a[0];
                    a[2] *= -1;
                }
                if (a[0] >= canvasWidth) {
                    a[0] = 2 * canvasWidth - a[0];
                    a[2] *= -1;
                }
                if (a[1] < 0) {
                    a[1] = -a[1];
                    a[3] *= -1;
                }
                if (a[1] >= canvasHeight) {
                    a[1] = 2 * canvasHeight - a[1];
                    a[3] *= -1;
                }


                // // Velocity Verlet integration
                // // v = u + at from the law of motion (velocity = initial velocity + acceleration * time)
                // a[2] = (a[2] + forceX) * 0.5 // a = f / m where m = 1
                // a[3] = (a[3] + forceY) * 0.5
                // // Set the new positions
                // a[0] += a[2]
                // a[1] += a[3]
                // // Reverse the direction of the particle if it hits the wall
                // if (a[0] <= 0 || a[0] >= canvasWidth) { a[2] *= -1 }
                // if (a[1] <= 0 || a[1] >= canvasHeight) { a[3] *= -1 }
            }
        }
        function update() {
            const startExecutionTime = performance.now()

            // processRules()

            for (let i = 0; i < particleGroups.length; i++) {
                const groupA = particleGroups[i]
                for (let j = 0; j < particleGroups.length; j++) {
                    const groupB = particleGroups[j]
                    processRules(groupA, groupB, Math.random() * 2 - 1) // -1 attracts, 1 repels
                }
            }

            ctx!.clearRect(0, 0, canvasWidth, canvasHeight)
            for (let i = 0; i < particles.length; i++) {
                const particle = particles[i]
                draw(particle[0], particle[1], particle[4], particleSize)
            }
            const executionTime = performance.now() - startExecutionTime
            // console.log('Execution time: ', executionTime + 'ms')
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
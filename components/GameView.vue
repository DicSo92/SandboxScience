<template>
    <section flex flex-col justify-center>
        <canvas ref="canvas"></canvas>
        <div flex flex-col>
            <div flex justify-between>
                <div flex>
                    <div mx-2>Rows: {{game.rows}}</div>
                    <div mx-2>Cols: {{game.cols}}</div>
                    <div mx-2>Cell Size: {{game.size}}</div>
                    <div mx-2>Speed: {{game.SPEED}}</div>
                </div>
                <div mx-2>Execution Time: {{ Math.round(executionTime) }} ms</div>
            </div>
            <div flex>
                <div btn @click="randomCells(((game.rows * game.cols) * 20) / 100)" class="bg-orange-700 hover:bg-orange-800 p2 mx-1">Random</div>
                <div btn @click="killRandom(20)" class="bg-red-700 hover:bg-red-900 p2 mx-1">Kill</div>
                <div btn @click="newCycle" class="bg-green-900 hover:bg-green-800 p2 mx-1">Cycle</div>
                <div btn @click="startLoop" class="bg-green-700 hover:bg-green-900 flex items-center mx-1">
                    <div i-carbon-play mr-1></div>
                    Start Loop
                </div>
            </div>
        </div>
    </section>
</template>

<script lang="ts">
import {defineComponent} from 'vue'
import { aliveNeighbours } from '~/helpers/utils/neighbours'
import { Cell } from '~/models/classes/Cell'
import type { ICell } from '~/models/interfaces/ICell.interface'

export default defineComponent({
        setup() {
            const game = useGameStore()
            const canvas: Ref<HTMLCanvasElement | undefined> = ref()
            const ctx: Ref<CanvasRenderingContext2D | undefined> = ref()

            const executionTime = ref<number>(0) // cycle execution time
            let startExecutionTime: number // for calculating execution time
            let lastTime: number | null // for calculating elapsed time

            onMounted(() => {
                ctx.value = canvas.value?.getContext('2d') || undefined
                drawCanvas()
            })

            function drawCanvas() {
                canvas.value!.width = game.canvasWidth
                canvas.value!.height = game.canvasHeight

                for (let y = 0; y < game.rows; y++) {
                    for (let x = 0; x < game.cols; x++) {
                        let index = x + y * game.cols
                        game.cellsArray[index] = reactive(new Cell(x, y, game.size, ctx.value))
                    }
                }
                console.log(game.cellsArray)
            }

            const randomCells = (num: number) => {
                for (let i = 0; i < num; i++) {
                    const random = Math.floor(Math.random() * game.cellsArray.length)
                    game.cellsArray[random].makeAlive(true)
                }
                console.log(game.cellsArray)
            }
            const killRandom = (num: number) => {
                const shuffled = [...game.cellsArray].sort(() => 0.5 - Math.random())
                const rCells = shuffled.slice(0, num)
                rCells.forEach((cell) => {
                    cell.kill(true)
                })
            }

            function startLoop() {
                lastTime = Number(document.timeline.currentTime) || null
                if (!lastTime) {
                    console.log("Can't get document.timeline.currentTime")
                    return
                }

                lastTime = lastTime - game.SPEED // to start a cycle immediately
                startExecutionTime = performance.now()
                requestAnimationFrame(animate)
            }


            function animate(currentTime: number) {
                const elapsedTime = currentTime - lastTime!

                if (elapsedTime >= game.SPEED) {
                    newCycle()

                    lastTime = currentTime - (elapsedTime % game.SPEED)
                    executionTime.value = performance.now() - startExecutionTime
                    console.log(`Execution Time : ${executionTime.value} ms`)
                }

                startExecutionTime = performance.now()
                requestAnimationFrame(animate);
            }

            function newCycle() {
                console.log(game.cellsArray)
                let changedCells = [] as ICell[]
                game.cellsArray.forEach((cell, index) => {
                    const hasChanged = processRules(cell, aliveNeighbours(cell.x, cell.y))
                    if (hasChanged) changedCells.push(cell)
                })
                changedCells.forEach((cell, index) => {
                    cell.isAlive = cell.nextAlive
                })
            }

            function processRules(cell: ICell, aliveNeighbours: number): boolean { // return if cell has changed
                if (cell.isAlive && (aliveNeighbours === 2 || aliveNeighbours === 3)) {
                    // Survives
                    return false
                } else if (!cell.isAlive && aliveNeighbours === 3) {
                    // Born
                    cell.makeAlive()
                    return true
                } else {
                    // Dies
                    if (cell.isAlive) cell.kill()
                    return true
                }
            }

            return {
                game, ctx, canvas, newCycle, randomCells, killRandom, startLoop, executionTime
            }
        },
    })

</script>

<style scoped>
    canvas {
        background-color: midnightblue;
    }
</style>

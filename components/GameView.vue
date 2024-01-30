<template>
    <section flex justify-center>
        <button @click="randomCells(150)" p2 mx-1>Random</button>
        <canvas ref="canvas"></canvas>
        <button @click="killRandom(20)" bg-red-900 p2 mx-1>Kill</button>
        <button @click="newCycle" bg-red-600 p2 mx-1>Cycle</button>
        <button @click="startLoop" bg-black text-white p2 mx-1>Start Loop</button>
    </section>
</template>

<script lang="ts">
import {defineComponent} from 'vue'
import { surroundingsWithMirrorEdges, surroundingsWithDeadEdges } from '~/helpers/utils/surroundings';
import { Cell } from '~/models/classes/Cell';
import type { ICell } from '~/models/interfaces/ICell.interface';

export default defineComponent({
        setup() {
            const game = useGameStore()
            const canvas: Ref<HTMLCanvasElement | undefined> = ref();
            const ctx: Ref<CanvasRenderingContext2D | undefined> = ref();
            let cellsArray = reactive([] as Cell[]) // array of cells

            const executionTime = ref<number>() // cycle execution time
            let startExecutionTime: number // for calculating execution time
            let lastTime: number | null // for calculating elapsed time

            onMounted(() => {
                ctx.value = canvas.value?.getContext('2d') || undefined;
                drawCanvas();
            })

            function drawCanvas() {
                canvas.value!.width = game.canvasWidth
                canvas.value!.height = game.canvasHeight

                for (let y = 0; y < game.rows; y++) {
                    for (let x = 0; x < game.cols; x++) {
                        let index = x + y * game.cols;
                        cellsArray[index] = reactive(new Cell(x, y, game.size, ctx.value))
                    }
                }
                console.log(cellsArray)
            }

            const randomCells = (num: number) => {
                for (let i = 0; i < num; i++) {
                    const random = Math.floor(Math.random() * cellsArray.length)
                    cellsArray[random].makeAlive(true)
                }
                console.log(cellsArray)
            }
            const killRandom = (num: number) => {
                const shuffled = [...cellsArray].sort(() => 0.5 - Math.random())
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
                console.log(cellsArray)
                let changedCells = [] as ICell[]
                cellsArray.forEach((cell, index) => {
                    // const aliveNeighbours = surroundingsWithDeadEdges(cellsArray, index, cols).reduce((acc, cur) => acc += cur?.isAlive ? 1 : 0 , 0);
                    // const aliveNeighbours = surroundingsWithMirrorEdges(cellsArray, index, rows, cols).reduce((acc, cur) => acc += cur?.isAlive ? 1 : 0 , 0);
                    const aliveNeighbours = surroundingsWithNewPrinciple(cell.x, cell.y)

                    const hasChanged = processRules(cell, aliveNeighbours)
                    if (hasChanged) changedCells.push(cell)
                })
                changedCells.forEach((cell, index) => {
                    cell.isAlive = cell.nextAlive
                })
            }

            const neighbourCellsMap = [
                [-1, -1], [0, -1], [1, -1],
                [-1, 0],           [1, 0],
                [-1, 1],  [0, 1],  [1, 1]
            ]

            const surroundingsWithNewPrinciple = (x: number, y: number) => {
                return neighbourCellsMap.reduce((numNeighbours, [dx, dy]) => {
                    return numNeighbours + (isCellAlive(x + dx, y + dy) ? 1 : 0);
                }, 0);
            }

            const isCellAlive = (x: number, y: number) => {
                // Dead Edges
                // if (x < 0 || x >= cols || y < 0 || y >= rows){
                //     return false;
                // }

                // Mirror Edges
                const modX = (x + game.cols) % game.cols
                const modY = (y + game.rows) % game.rows

                return cellsArray[gridToIndex(modX, modY, game.cols)].isAlive
            }

            const gridToIndex = (x: number, y: number, cols: number) => {
                return x + (y * cols);
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
                canvas, ctx, cellsArray, randomCells, killRandom, newCycle, startLoop
            }
        },
    })

</script>

<style scoped>
    canvas {
        background-color: midnightblue;
    }
</style>

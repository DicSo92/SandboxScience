<template>
    <section flex justify-center>
        <button @click="randomCells(100)" p2 mx-1>Random</button>
        <canvas ref="canvas"></canvas>
        <button @click="killRandom(20)" bg-red-900 p2 mx-1>Kill</button>
        <button @click="newCycle" bg-red-600 p2 mx-1>Cycle</button>
        <button @click="loop" bg-black text-white p2 mx-1>Loop</button>
    </section>
</template>

<script lang="ts">
import {defineComponent} from 'vue'
import { surroundingsWithMirrorEdges, surroundingsWithDeadEdges } from '~/helpers/utils/surroundings';
import { Cell } from '~/models/classes/Cell';
import type { ICell } from '~/models/interfaces/ICell.interface';

export default defineComponent({
        setup() {
            const canvas: Ref<HTMLCanvasElement | undefined> = ref();
            const ctx: Ref<CanvasRenderingContext2D | undefined> = ref();
            // const cellsArray = ref<Cell[]>([])
            let cellsArray = reactive([] as Cell[])

            const cw = 800 // the width of the canvas
            const ch = 800 // the height of the canvas
            const size = 20 // the size of every cell
            const rows = ch / size // number of rows
            const cols = cw / size // number of columns

            const speed = 80 // the speed of the animation

            onMounted(() => {
                ctx.value = canvas.value?.getContext('2d') || undefined;

                drawCanvas();
            })

            function drawCanvas() {
                canvas.value!.width = cw
                canvas.value!.height = ch

                // fill the cells array with values
                for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < cols; x++) {
                        let index = x + y * cols;
                        cellsArray[index] = reactive(new Cell(x, y, size, ctx.value))
                    }
                }
                console.log(cellsArray)
            }

            const randomCells = (num: number) => {
                for (let i = 0; i < num; i++) {
                    const random = Math.floor(Math.random() * cellsArray.length)
                    console.log(random)
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

            function loop() {
                setInterval(() => {
                    newCycle()
                }, speed)
            }

            function newCycle() {
                console.log(cellsArray)
                cellsArray.forEach((cell, index) => {
                    // const aliveNeighbours = surroundingsWithDeadEdges(index, rows).reduce((acc, cur) => acc += cur?.isAlive ? 1 : 0 , 0);
                    const aliveNeighbours = surroundingsWithMirrorEdges(cellsArray, index, rows, cols).reduce((acc, cur) => acc += cur?.isAlive ? 1 : 0 , 0);

                    processRules(cell, aliveNeighbours)
                })
                cellsArray.forEach((cell, index) => {
                    cell.isAlive = cell.nextAlive
                })
            }

            function processRules(cell: ICell, aliveNeighbours: number) {
                if (cell.isAlive && (aliveNeighbours === 2 || aliveNeighbours === 3)) {
                    cell.makeAlive()
                } else if (!cell.isAlive && aliveNeighbours === 3) {
                    cell.makeAlive()
                } else {
                    cell.kill()
                }
            }

            return {
                canvas, ctx, cellsArray, randomCells, killRandom, newCycle, loop
            }
        },
    })

</script>

<style scoped>
    canvas {
        background-color: midnightblue;
    }
</style>

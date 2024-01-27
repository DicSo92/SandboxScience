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
            const speed = 80 // the speed of the animation

            onMounted(() => {
                ctx.value = canvas.value?.getContext('2d') || undefined;

                drawCanvas();
            })

            function drawCanvas() {
                canvas.value!.width = cw
                canvas.value!.height = ch

                const rows = cw / size // number of rows
                const cols = ch / size // number of columns

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

            const surroundings = {
                nw: (index: number, rows: number) => cellsArray[index - rows - 1],    // top-left
                n: (index: number, rows: number) => cellsArray[index - rows],         // top
                ne: (index: number, rows: number) => cellsArray[index - rows + 1],    // top-right
                w: (index: number) => cellsArray[index - 1],                          // center-left
                e: (index: number) => cellsArray[index + 1],                          // center-right
                so: (index: number, rows: number) => cellsArray[index + rows - 1],    // bottom-left
                s: (index: number, rows: number) => cellsArray[index + rows],         // bottom
                se: (index: number, rows: number) => cellsArray[index + rows + 1],    // bottom-right

                otnw: (index: number, rows: number, cols: number) => cellsArray[index + (rows * (cols - 1)) - 1],  // opposite-top-north-west
                otn: (index: number, rows: number, cols: number) => cellsArray[index + (rows * (cols - 1))],       // opposite-top-north
                otne: (index: number, rows: number, cols: number) => cellsArray[index + (rows * (cols - 1)) + 1],  // opposite-top-north-east
                olnw: (index: number) => cellsArray[index - 1],                                                    // opposite-left-north-west
                olw: (index: number, rows: number) => cellsArray[index + (rows - 1)],                              // opposite-left-west
                olsw: (index: number, rows: number) => cellsArray[index + (rows * 2) - 1],                         // opposite-left-south-west
                orne: (index: number, rows: number) => cellsArray[index - (rows * 2) + 1],                         // opposite-right-north-east
                ore: (index: number, rows: number) => cellsArray[index - (rows - 1)],                              // opposite-right-east
                orse: (index: number) => cellsArray[index + 1],                                                    // opposite-right-south-east
                obsw: (index: number, rows: number, cols: number) => cellsArray[index - (rows * (cols - 1)) - 1],  // opposite-bottom-south-west
                obs: (index: number, rows: number, cols: number) => cellsArray[index - (rows * (cols - 1))],       // opposite-bottom-south
                obse: (index: number, rows: number, cols: number) => cellsArray[index - (rows * (cols - 1)) + 1],  // opposite-bottom-south-east
            }

            function surroundingsWithMirrorEdges(index: number, rows: number, cols: number) {
                // check if cell is on the edge
                if (index % rows === 0) {
                    // left edge
                    return [
                        surroundings.n(index, rows),     // top
                        surroundings.ne(index, rows),    // top-right
                        surroundings.e(index),           // center-right
                        surroundings.se(index, rows),    // bottom-right
                        surroundings.s(index, rows),     // bottom
                        surroundings.olsw(index, rows),  // opposite-left-south-west
                        surroundings.olw(index, rows),   // opposite-left-west
                        surroundings.olnw(index),        // opposite-left-north-west
                    ]
                } else if (index % rows === rows - 1) {
                    // right edge
                    return [
                        surroundings.nw(index, rows),    // top-left
                        surroundings.n(index, rows),     // top
                        surroundings.w(index),           // center-left
                        surroundings.so(index, rows),    // bottom-left
                        surroundings.s(index, rows),     // bottom
                        surroundings.orne(index, rows),  // opposite-right-north-east
                        surroundings.ore(index, rows),   // opposite-right-east
                        surroundings.orse(index),        // opposite-right-south-east
                    ]
                } else if (index < rows) {
                    // top edge
                    return [
                        surroundings.w(index),           // center-left
                        surroundings.e(index),           // center-right
                        surroundings.so(index, rows),    // bottom-left
                        surroundings.s(index, rows),     // bottom
                        surroundings.se(index, rows),    // bottom-right
                        surroundings.otnw(index, rows, cols),  // opposite-top-north-west
                        surroundings.otn(index, rows, cols),   // opposite-top-north
                        surroundings.otne(index, rows, cols),  // opposite-top-north-east
                    ]
                } else if (index > (rows * (cols - 1))) {
                    // bottom edge
                    return [
                        surroundings.nw(index, rows),    // top-left
                        surroundings.n(index, rows),     // top
                        surroundings.ne(index, rows),    // top-right
                        surroundings.w(index),           // center-left
                        surroundings.e(index),           // center-right
                        surroundings.obsw(index, rows, cols),  // opposite-bottom-south-west
                        surroundings.obs(index, rows, cols),   // opposite-bottom-south
                        surroundings.obse(index, rows, cols),  // opposite-bottom-south-east
                    ]
                } else {
                    // middle
                    return [
                        surroundings.nw(index, rows),    // top-left
                        surroundings.n(index, rows),     // top
                        surroundings.ne(index, rows),    // top-right
                        surroundings.w(index),           // center-left
                        surroundings.e(index),           // center-right
                        surroundings.so(index, rows),    // bottom-left
                        surroundings.s(index, rows),     // bottom
                        surroundings.se(index, rows),    // bottom-right
                    ]
                }
            }
            function surroundingsWithDeadEdges(index: number, row: number) {
                // check if cell is on the edge
                if (index % row === 0) {
                    // left edge
                    return [
                        surroundings.n(index, row),     // top
                        surroundings.ne(index, row),    // top-right
                        surroundings.e(index),     // center-right
                        surroundings.s(index, row),     // bottom
                        surroundings.se(index, row)     // bottom-right
                    ]
                } else if (index % row === row - 1) {
                    // right edge
                    return [
                        surroundings.nw(index, row),    // top-left
                        surroundings.n(index, row),     // top
                        surroundings.w(index),     // center-left
                        surroundings.so(index, row),    // bottom-left
                        surroundings.s(index, row)      // bottom
                    ]
                } else {
                    // middle
                    return [
                        surroundings.nw(index, row),    // top-left
                        surroundings.n(index, row),     // top
                        surroundings.ne(index, row),    // top-right
                        surroundings.w(index),     // center-left
                        surroundings.e(index),     // center-right
                        surroundings.so(index, row),    // bottom-left
                        surroundings.s(index, row),     // bottom
                        surroundings.se(index, row)     // bottom-right
                    ]
                }
            }

            function loop() {
                setInterval(() => {
                    newCycle()
                }, speed)
            }

            function newCycle() {
                console.log(cellsArray)
                cellsArray.forEach((cell, index) => {
                    const rows = cw / size // number of rows
                    const cols = ch / size // number of rows
                    // const aliveNeighbours = surroundingsWithDeadEdges(index, rows).reduce((acc, cur) => acc += cur?.isAlive ? 1 : 0 , 0);
                    const aliveNeighbours = surroundingsWithMirrorEdges(index, rows, cols).reduce((acc, cur) => acc += cur?.isAlive ? 1 : 0 , 0);

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

            class Cell implements ICell {
                ctx: CanvasRenderingContext2D | undefined
                x: number
                y: number
                size: number
                isAlive: boolean = false
                nextAlive: boolean = false

                constructor(x: number, y: number, size: number, ctx: CanvasRenderingContext2D | undefined) {
                    this.x = x
                    this.y = y
                    this.size = size
                    this.ctx = ctx

                    this.init()
                }

                private init () {
                    this.ctx!.beginPath();
                    this.ctx!.strokeRect(this.coordinates.x, this.coordinates.y, this.size, this.size);
                }

                public makeAlive (isInit: boolean = false) {
                    if (this.isAlive) {
                        // console.log(this.x + '-' + this.y + ' alive (cant revive)')
                        return
                    }
                    this.ctx!.fillStyle = "black";
                    this.ctx!.fillRect(this.coordinates.x, this.coordinates.y, this.size, this.size)
                    this.nextAlive = true
                    this.isAlive = isInit ? true : this.isAlive
                }
                public kill (isInit: boolean = false) {
                    if (!this.isAlive) {
                        // console.log(this.coordinates.x + '-' + this.coordinates.y + ' not alive (cant remove)')
                        return
                    }
                    this.clear()
                    this.nextAlive = false
                    this.isAlive = isInit ? false : this.isAlive
                }

                public get coordinates (): { x: number, y: number } {
                    return {
                        x: this.x * this.size,
                        y: this.y * this.size
                    }
                }

                private clear () {
                    this.ctx!.clearRect(this.coordinates.x, this.coordinates.y, this.size, this.size);
                    this.ctx!.fillStyle = "midnightblue";
                    this.ctx!.fillRect(this.coordinates.x, this.coordinates.y, this.size, this.size)
                    this.ctx!.strokeRect(this.coordinates.x, this.coordinates.y, this.size, this.size);
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

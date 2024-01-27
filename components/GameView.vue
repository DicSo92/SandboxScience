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

export default defineComponent({
        setup() {
            const canvas: Ref<HTMLCanvasElement | undefined> = ref();
            const ctx: Ref<CanvasRenderingContext2D | undefined> = ref();
            // const cellsArray: Cell[] = ref([])
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

                        cellsArray[index] = reactive(new Cell(x, y, size))
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

            function surroundings(index: number, row: number) {
                // check if cell is on the edge
                if (index % row === 0) {
                    // left edge
                    return [
                        cellsArray[index - row],     // top
                        cellsArray[index - row + 1], // top-right
                        cellsArray[index + 1],       // center-right
                        cellsArray[index + row],     // bottom
                        cellsArray[index + row + 1]  // bottom-right
                    ]
                } else if (index % row === row - 1) {
                    // right edge
                    return [
                        cellsArray[index - row - 1], // top-left
                        cellsArray[index - row],     // top
                        cellsArray[index - 1],       // center-left
                        cellsArray[index + row - 1], // bottom-left
                        cellsArray[index + row]      // bottom
                    ]
                } else {
                    // middle
                    return [
                        cellsArray[index - row - 1], // top-left
                        cellsArray[index - row],     // top
                        cellsArray[index - row + 1], // top-right
                        cellsArray[index - 1],       // center-left
                        cellsArray[index + 1],       // center-right
                        cellsArray[index + row - 1], // bottom-left
                        cellsArray[index + row],     // bottom
                        cellsArray[index + row + 1]  // bottom-right
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
                    const rows = cw / size

                    const sdg = surroundings(index, rows).reduce((acc, cur) => acc += cur?.prevAlive ? 1 : 0 , 0);
                    console.log(sdg)

                    if (cell.prevAlive && (sdg === 2 || sdg === 3)) {
                        cell.makeAlive()
                    } else if (!cell.prevAlive && sdg === 3) {
                        cell.makeAlive()
                    } else {
                        cell.kill()
                    }
                })
                cellsArray.forEach((cell, index) => {
                    cell.prevAlive = cell.isAlive
                })
            }

            class Cell {
                x: number
                y: number
                size: number
                isAlive: boolean = false
                prevAlive: boolean = false

                constructor(x: number, y: number, size: number) {
                    this.x = x
                    this.y = y
                    this.size = size

                    this.init()
                }

                private init () {
                    ctx.value!.beginPath();
                    ctx.value!.strokeRect(this.coordinates.x, this.coordinates.y, this.size, this.size);
                }

                public makeAlive (isInit: boolean = false) {
                    if (this.isAlive) {
                        // console.log(this.coordinates.x + '-' + this.coordinates.y + ' alive (cant revive)')
                        return
                    }
                    ctx.value!.fillStyle = "black";
                    ctx.value!.fillRect(this.coordinates.x, this.coordinates.y, this.size, this.size)
                    this.prevAlive = isInit ? true : this.isAlive
                    this.isAlive = true
                }
                public kill (isInit: boolean = false) {
                    if (!this.isAlive) {
                        // console.log(this.coordinates.x + '-' + this.coordinates.y + ' not alive (cant remove)')
                        return
                    }
                    this.clear()
                    this.prevAlive = isInit ? true : this.isAlive
                    this.isAlive = false
                }

                public get coordinates (): { x: number, y: number } {
                    return {
                        x: this.x * this.size,
                        y: this.y * this.size
                    }
                }

                private clear () {
                    ctx.value!.clearRect(this.coordinates.x, this.coordinates.y, this.size, this.size);
                    ctx.value!.fillStyle = "midnightblue";
                    ctx.value!.fillRect(this.coordinates.x, this.coordinates.y, this.size, this.size)
                    ctx.value!.strokeRect(this.coordinates.x, this.coordinates.y, this.size, this.size);
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

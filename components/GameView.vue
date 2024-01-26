<template>
    <section flex justify-center>
        <button @click="randomCells(8)">Random</button>
        <canvas ref="canvas"></canvas>
        <button @click="killRandom(20)">kill</button>
    </section>
</template>

<script lang="ts">
import {defineComponent} from 'vue'

export default defineComponent({
        setup() {
            const canvas: Ref<HTMLCanvasElement | undefined> = ref();
            const ctx: Ref<CanvasRenderingContext2D | undefined> = ref();
            // const cellsArray: Cell[] = ref([])
            let cellsArray = reactive([] as Cell[])

            onMounted(() => {
                ctx.value = canvas.value?.getContext('2d') || undefined;

                drawCanvas();
            })

            function drawCanvas() {
                let cw = 300;//the width of the canvas
                let ch = 300;//the height of the canvas
                canvas.value!.width = cw
                canvas.value!.height = ch

                let size = 25; //the size of every cell
                let rows = 12; //number of rows
                let cols = 12; //number of columns

                // fill the cells array with values
                for (let y = 0; y <= rows; y++) {
                    for (let x = 0; x < cols; x++) {
                        let index = x + y * cols;

                        cellsArray[index] = new Cell(x, y, size)
                    }
                }

                console.log(cellsArray)
            }

            const randomCells = (num: number) => {
                const shuffled = [...cellsArray].sort(() => 0.5 - Math.random())

                const rCells = shuffled.slice(0, num)

                rCells.forEach((cell) => {
                    cell.makeAlive()
                })
            }
            const killRandom = (num: number) => {
                const shuffled = [...cellsArray].sort(() => 0.5 - Math.random())

                const rCells = shuffled.slice(0, num)

                rCells.forEach((cell) => {
                    cell.kill()
                })
            }

            class Cell {
                x: number
                y: number
                size: number
                isAlive: boolean = false

                constructor(x: number, y: number, size: number) {
                    this.x = x
                    this.y = y
                    this.size = size

                    this.init()
                }

                private init () {
                    ctx.value!.beginPath();
                    this.clear()
                }

                public makeAlive () {
                    ctx.value!.fillRect(this.coordinates.x, this.coordinates.y, this.size, this.size)
                    this.isAlive = true
                }
                public kill () {
                    if (!this.isAlive) {
                        return console.log(this.coordinates.x + '-' + this.coordinates.y + ' not alive (cant remove)')
                    }
                    this.clear()
                }

                public get coordinates (): { x: number, y: number } {
                    return {
                        x: this.x * this.size,
                        y: this.y * this.size
                    }
                }

                private clear () {
                    ctx.value!.clearRect(this.coordinates.x, this.coordinates.y, this.size, this.size);
                    ctx.value!.strokeRect(this.coordinates.x, this.coordinates.y, this.size, this.size);
                    this.isAlive = false
                }
            }

            return {
                canvas, ctx, cellsArray, randomCells, killRandom
            }
        },
    })

</script>

<style scoped>
    canvas {
        background-color: midnightblue;
    }
</style>

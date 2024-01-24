<template>
    <section flex justify-center>
        <canvas ref="canvas"></canvas>
    </section>
</template>

<script lang="ts">
    import { defineComponent } from 'vue'

    export default defineComponent({
        setup() {
            const canvas: Ref<HTMLCanvasElement | undefined> = ref();
            const ctx: Ref<CanvasRenderingContext2D | undefined> = ref();

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

                // initiate the cells array
                let cells = new Array(cols*rows);

                // fill the cells array with values
                for (let y = 0; y <= rows; y++) {
                    for (let x = 0; x < cols; x++) {
                        let index = x + y * cols;
                        let cell = { x, y }
                        cell.x = x * size;
                        cell.y = y * size;

                        cells[index] = cell;
                    }
                }

                console.log(cells)

                //draw every cell in the grid of cells
                cells.forEach((c,i)=>{
                    ctx.value!.beginPath();
                    ctx.value!.strokeRect(c.x, c.y, size, size);
                })
            }

            return {
                canvas, ctx
            }
        },
    })

</script>

<style scoped>
    canvas {
        background-color: midnightblue;
    }
</style>

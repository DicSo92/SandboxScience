<template>
    <section w-full flex>
        <div flex-1>
            <div grid gap-px :style="`grid-template-rows: repeat(${ cellRowCount }, minmax(0, 1fr))`">
                <div v-for="(col, i) in cellRowCount" :key="i" w-full grid gap-px :style="`grid-template-columns: repeat(${ cellRowCount }, minmax(0, 1fr))`">
                    <div v-for="(row, j) in cellRowCount" :key="j" class="aspect-square">
                        <div v-if="j === 0 && i === 0" h-full w-full p-1>
                            <div bg-black w-full h-full></div>
                        </div>
                        <div v-else-if="i === 0 && j > 0" h-full w-full class="pp-10">
                            <div rounded-full w-full h-full :style="`background-color: hsl(${particleLife.currentColors[j-1]}, 100%, 50%)`"></div>
                        </div>
                        <div v-else-if="j === 0 && i > 0" h-full w-full class="pp-10">
                            <div rounded-full w-full h-full :style="`background-color: hsl(${particleLife.currentColors[i-1]}, 100%, 50%)`"></div>
                        </div>
                        <div v-else h-full w-full relative cursor-ew-resize select-none
                             :class="(hoveredCell && hoveredCell[0] === i-1 && hoveredCell[1] === j-1) && 'hovered-cell'"
                             :style="{ backgroundColor: interpolateColor(particleLife.minRadiusMatrix[i-1][j-1]) }"
                             @mouseenter="hoveredCell = [i-1, j-1]"
                             @mouseleave="mouseleave(i-1, j-1)"
                             @mousedown="startDrag($event, i-1, j-1)"
                             @mousemove="handleDrag($event, i-1, j-1)"
                             @mouseup="endDrag">
                            <div class="tooltip -mt-9 -translate-x-1/2 left-1/2" invisible
                                 absolute px-3 py-2 bg-gray-800 rounded-full pointer-events-none>
                                <p text-sm m-0>{{ particleLife.minRadiusMatrix[i-1][j-1] }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
    setup(props, { emit }) {
        const particleLife = useParticleLifeStore()
        const cellRowCount = computed(() => particleLife.minRadiusMatrix.length + 1)
        const totalCells = computed(() => cellRowCount.value * cellRowCount.value)

        const minValue = computed(() => particleLife.minRadiusMatrix.reduce((min, row) => Math.min(min, ...row), Infinity))
        const maxValue = computed(() => particleLife.minRadiusMatrix.reduce((max, row) => Math.max(max, ...row), -Infinity))

        const neutralColor = [12, 12, 12]
        const targetColor = [12, 116, 137] // blue cerulean

        const dragging = ref(false)
        const wasDragging = ref(false)
        const hoveredCell = ref<[number, number] | null>(null)

        function startDrag(event: MouseEvent, i: number, j: number) {
            particleLife.isLockedPointer = true
            dragging.value = true

            const targetElement = event.target as HTMLElement
            if(targetElement.requestPointerLock) {
                targetElement.requestPointerLock()
                hoveredCell.value = [i, j]
            } else {
                console.log('PointerLock API not supported in this device.')
            }
        }
        function handleDrag(event: MouseEvent, i: number, j: number) {
            if (dragging.value) {
                if (event.movementX === 0) return
                let newValue = particleLife.minRadiusMatrix[i][j] + event.movementX
                setValue(i, j, newValue)
            }
        }
        function setValue(i: number, j: number, newValue: number = 0) {
            newValue = Math.max(0, Math.min(particleLife.maxRadiusMatrix[i][j], newValue))
            emit('update', i, j, newValue)
        }
        function endDrag() {
            document.exitPointerLock()
            wasDragging.value = true
            dragging.value = false
            particleLife.isLockedPointer = false
        }

        function mouseleave(i: number, j: number) {
            if (hoveredCell.value || !wasDragging.value) {
                hoveredCell.value = null
            }
            wasDragging.value = false
        }
        function interpolateColor(value: number) {
            const color1 = neutralColor
            const color2 = targetColor

            value = Math.abs(value - minValue.value) / (maxValue.value - minValue.value)
            const [r1, g1, b1] = color1
            const [r2, g2, b2] = color2

            const r = Math.round(r1 + (r2 - r1) * value)
            const g = Math.round(g1 + (g2 - g1) * value)
            const b = Math.round(b1 + (b2 - b1) * value)

            return `rgb(${r}, ${g}, ${b})`
        }

        return {
            particleLife, cellRowCount, totalCells,
            dragging, hoveredCell,
            startDrag, handleDrag, endDrag, mouseleave, interpolateColor
        }
    }
})
</script>

<style scoped>
.pp-10 {
    padding: 5%;
}

.hovered-cell {
    box-shadow: inset 0 0 2px 2px rgba(180,180,180,0.9);
    .tooltip {
        @apply visible;
    }
}
</style>
<template>
    <section w-full flex flex-col>
        <div flex-1>
            <div grid gap-px :style="`grid-template-rows: repeat(${ cellRowCount }, minmax(0, 1fr))`">
                <div v-for="(col, i) in cellRowCount" :key="i" w-full grid gap-px :style="`grid-template-columns: repeat(${ cellRowCount }, minmax(0, 1fr))`">
                    <div v-for="(row, j) in cellRowCount" :key="j" class="aspect-square">
                        <div v-if="j === 0 && i === 0" h-full w-full class="pp-12">
                            <div bg-black w-full h-full rounded-full></div>
                        </div>
                        <div v-else-if="i === 0 && j > 0" h-full w-full class="pp-6">
                            <div rounded-full w-full h-full :style="`background-color: hsl(${particleLife.currentColors[j-1]}, 100%, 50%)`"></div>
                        </div>
                        <div v-else-if="j === 0 && i > 0" h-full w-full class="pp-6">
                            <div rounded-full w-full h-full :style="`background-color: hsl(${particleLife.currentColors[i-1]}, 100%, 50%)`"></div>
                        </div>
                        <div v-else h-full w-full relative cursor-ew-resize select-none
                             :class="(isHoveredCell(i-1, j-1) || isCellSelected(i-1, j-1)) && 'hovered-cell'"
                             :style="{ backgroundColor: hasSameValues ? 'rgb(12, 12, 12)' : interpolateColor(particleLife.maxRadiusMatrix[i-1][j-1]) }"
                             @mouseenter="mouseenter(i-1, j-1)"
                             @mouseleave="mouseleave"
                             @mousedown="mousedown($event, i-1, j-1)">
                            <div class="-mt-9 -translate-x-1/2 left-1/2"
                                 :class="isHoveredCell(i-1, j-1) || (isCellSelected(i-1, j-1) && selectedCells![selectedCells!.length - 1][0] === i-1 && selectedCells![selectedCells!.length - 1][1] === j-1) ? 'visible' : 'invisible'"
                                 absolute px-3 py-2 bg-gray-800 rounded-full pointer-events-none>
                                <p text-sm m-0>{{ particleLife.maxRadiusMatrix[i-1][j-1] }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <RangeInput input :min="selectedCell && selectedCells?.length === 1 ? particleLife.minRadiusMatrix[selectedCell[0]][selectedCell[1]] : 1" :max="600" :step="1" v-model="selectedValue" mt-2 >
            <template #customLabel>
                <div class="w-2/3 px-2 py-0.5" border-2 border-gray-500 bg-zinc-800 rounded-lg>
                    <div v-if="!selectedCells" font-bold text-center text-gray-300>All Colors</div>
                    <div v-else-if="selectedCells?.length === 1" flex items-center justify-between>
                        <div flex-1 flex justify-center>
                            <div class="rounded-full w-5 h-5" :style="`background-color: hsl(${particleLife.currentColors[selectedCells[0][0]]}, 100%, 50%)`"></div>
                        </div>
                        <div i-tabler-arrow-narrow-right text-xl mx-1 text-gray></div>
                        <div flex-1 flex justify-center>
                            <div class="rounded-full w-5 h-5" :style="`background-color: hsl(${particleLife.currentColors[selectedCells[0][1]]}, 100%, 50%)`"></div>
                        </div>
                    </div>
                    <div v-else font-bold text-center text-gray-300>Group Colors</div>
                </div>
            </template>
        </RangeInput>
    </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
    setup(props, { emit }) {
        const particleLife = useParticleLifeStore()
        const hoveredCell = ref<[number, number] | null>(null)
        const selectedCell = ref<[number, number] | null>(null)
        const selectedCells = ref<[number, number][] | null>(null)
        const noSelectionValue = ref<number>(120)

        const neutralColor = [12, 12, 12]
        const targetColor = [214, 40, 57] // red crimson

        let dragging = false
        let wasDragging = false
        let toDeselect = false
        // -------------------------------------------------------------------------------------------------------------
        const cellRowCount = computed(() => particleLife.maxRadiusMatrix.length + 1)
        const minValue = computed(() => particleLife.maxRadiusMatrix.reduce((min, row) => Math.min(min, ...row), Infinity))
        const maxValue = computed(() => particleLife.maxRadiusMatrix.reduce((max, row) => Math.max(max, ...row), -Infinity))
        const hasSameValues = computed(() => {
            for (let i = 0; i < particleLife.numColors; i++) {
                for (let j = 0; j < particleLife.numColors; j++) {
                    if (particleLife.maxRadiusMatrix[i][j] !== particleLife.maxRadiusMatrix[0][0]) {
                        return false
                    }
                }
            }
            return true
        })
        const selectedValue = computed({
            get: () => {
                if (selectedCell.value) {
                    return particleLife.maxRadiusMatrix[selectedCell.value[0]][selectedCell.value[1]]
                }
                return noSelectionValue.value
            },
            set: (newValue) => {
                if (selectedCell.value) {
                    updateMatrixForSelectedCells(newValue)
                } else {
                    noSelectionValue.value = newValue
                    updateMatrixForAllCells(newValue)
                }
            }
        })
        // -------------------------------------------------------------------------------------------------------------
        watch(() => particleLife.numColors, () => {
            selectedCells.value = null
            selectedCell.value = null
            hoveredCell.value = null
        })
        // -------------------------------------------------------------------------------------------------------------
        onMounted(() => {
            useEventListener(document, "pointerlockerror", () => {
                nextTick(() => {
                    console.error('PointerLock error')
                    particleLife.isLockedPointer = false
                    dragging = false
                    wasDragging = false
                    document.exitPointerLock()
                })
            }, false)
            useEventListener(document, "pointerlockchange", () => {
                nextTick(() => {
                    if (document.pointerLockElement && !particleLife.isLockedPointer) {
                        document.exitPointerLock()
                        dragging = false
                        wasDragging = false
                    }
                })
            }, false)
            useEventListener(document, "mouseup", (event: MouseEvent) => {
                nextTick(() => {
                    if (toDeselect) {
                        if (event.ctrlKey) {
                            groupSelect(selectedCell.value![0], selectedCell.value![1])
                        } else {
                            select(selectedCell.value![0], selectedCell.value![1])
                        }
                        toDeselect = false
                    }
                    particleLife.isLockedPointer = false
                    dragging = false
                    wasDragging = false
                    document.exitPointerLock()
                    document.removeEventListener('mousemove', handleDrag, true)
                })
            }, false)
        })
        // -------------------------------------------------------------------------------------------------------------
        function mousedown(event: MouseEvent, i: number, j: number) {
            hoveredCell.value = [i, j]
            selectedCell.value = [i, j]

            if (isCellSelected(i, j)) {
                toDeselect = true
            }
            if ((!isCellSelected(i, j)) || !selectedCells.value) {
                if (event.ctrlKey) {
                    groupSelect(i, j)
                } else {
                    select(i, j)
                }
            }
            dragging = true
            if (!event.ctrlKey) document.addEventListener('mousemove', handleDrag, true)
        }
        function handleDrag(event: MouseEvent) {
            if (dragging) {
                toDeselect = false
                const targetElement = event.target as HTMLElement
                if(targetElement.requestPointerLock) {
                    if (!particleLife.isLockedPointer && !document.pointerLockElement) {
                        particleLife.isLockedPointer = true
                        targetElement.requestPointerLock()
                    }
                } else {
                    console.log('PointerLock API not supported in this device.')
                }

                wasDragging = true
                // if (event.movementX === 0 || Math.abs(event.movementX) > 16) return // Prevent movementX error with pointer lock
                const i = selectedCell.value![0]
                const j = selectedCell.value![1]
                const value = particleLife.maxRadiusMatrix[i][j] + event.movementX
                updateMatrixForSelectedCells(value)
            }
        }
        function mouseenter(i: number, j: number) {
            if (!particleLife.isLockedPointer && !wasDragging) {
                hoveredCell.value = [i, j]
            }
        }
        function mouseleave() {
            if ((!particleLife.isLockedPointer && !wasDragging) || hoveredCell.value) {
                hoveredCell.value = null
            }
            wasDragging = false
        }
        // -------------------------------------------------------------------------------------------------------------
        function select(i: number, j: number) {
            if (isCellSelected(i, j) && selectedCells.value!.length === 1) {
                selectedCells.value = null
                selectedCell.value = null
                hoveredCell.value = null
                return
            }
            selectedCells.value = [[i, j]]
        }
        function groupSelect(i: number, j: number) {
            if (isCellSelected(i, j)) {
                selectedCells.value = selectedCells.value!.filter(([x, y]) => x !== i || y !== j) // Remove cell from selectedCells
                if (selectedCells.value.length === 0) { // Set to null if no more cells are selected
                    selectedCells.value = null
                    selectedCell.value = null
                    hoveredCell.value = null
                }
                return
            }
            if (!selectedCells.value) {
                selectedCells.value = []
            }
            selectedCells.value.push([i, j])
        }
        function isCellSelected(i: number, j: number) {
            return selectedCells.value?.some(([x, y]) => x === i && y === j)
        }
        function isHoveredCell(i: number, j: number) {
            return hoveredCell.value && hoveredCell.value[0] === i && hoveredCell.value[1] === j
        }
        // -------------------------------------------------------------------------------------------------------------
        function updateMatrixForAllCells(value: number = 0) {
            value = Math.max(1, value)
            for (let i = 0; i < particleLife.numColors; i++) {
                for (let j = 0; j < particleLife.numColors; j++) {
                    emit('update', i, j, value)
                }
            }
        }
        function updateMatrixForSelectedCells(value: number) {
            value = Math.max(1, value)
            for (let i = 0; i < selectedCells.value!.length; i++) {
                const [x, y] = selectedCells.value![i]
                emit('update', x, y, value)
            }
        }
        // -------------------------------------------------------------------------------------------------------------
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
        // -------------------------------------------------------------------------------------------------------------
        return {
            particleLife, cellRowCount, selectedValue, selectedCell, selectedCells, hasSameValues,
            mousedown, mouseenter, mouseleave,
            interpolateColor, isCellSelected, isHoveredCell
        }
    }
})
</script>

<style scoped>
.pp-6 {
    padding: 6%;
}
.pp-12 {
    padding: 12%;
}

.hovered-cell {
    box-shadow: inset 0 0 2px 2px rgba(180,180,180,0.9);
    .tooltip {
        @apply visible;
    }
}
</style>
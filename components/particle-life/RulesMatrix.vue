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
                             :class="((hoveredCell && hoveredCell[0] === i-1 && hoveredCell[1] === j-1) || selectedCell && selectedCell[0] === i-1 && selectedCell[1] === j-1) && 'hovered-cell'"
                             :style="{ backgroundColor: interpolateColor(particleLife.rulesMatrix[i-1][j-1]) }"
                             @mouseenter="mouseenter(i-1, j-1)"
                             @mouseleave="mouseleave"
                             @mousedown="mousedown($event, i-1, j-1)">
                            <div class="tooltip -mt-9 -translate-x-1/2 left-1/2" invisible
                                 absolute px-3 py-2 bg-gray-800 rounded-full pointer-events-none>
                                <p text-sm m-0>{{ particleLife.rulesMatrix[i-1][j-1] }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <RangeInput input :min="-1" :max="1" :step="0.01" v-model="selectedRule" mt-2 >
            <template #customLabel>
                <div class="w-2/3" border-2 border-gray-500 bg-zinc-800 rounded-lg px-3 py-2>
                    <div v-if="selectedCell" flex items-center justify-between>
                        <div rounded-full w-6 h-6 :style="`background-color: hsl(${particleLife.currentColors[selectedCell[0]]}, 100%, 50%)`"></div>
                        <div i-tabler-arrow-narrow-right text-xl mx-1 text-gray></div>
                        <div rounded-full w-6 h-6 :style="`background-color: hsl(${particleLife.currentColors[selectedCell[1]]}, 100%, 50%)`"></div>
                    </div>
                    <div v-else font-black text-center text-gray-300>All Colors</div>
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
        const ruleValue = ref<number>(0)

        const repulsionColor = [214, 40, 57]
        const attractionColor = [137, 189, 158]
        const neutralColor = [12, 12, 12]

        let dragging = false
        let wasDragging = false
        let toDeselect = false
        // -------------------------------------------------------------------------------------------------------------
        const cellRowCount = computed(() => particleLife.rulesMatrix.length + 1)
        const selectedRule = computed({
            get: () => {
                if (selectedCell.value) {
                    return particleLife.rulesMatrix[selectedCell.value[0]][selectedCell.value[1]]
                }
                return ruleValue.value
            },
            set: (newValue) => {
                if (selectedCell.value) {
                    setValue(selectedCell.value[0], selectedCell.value[1], newValue)
                } else {
                    ruleValue.value = newValue
                    for (let i = 0; i < particleLife.numColors; i++) {
                        for (let j = 0; j < particleLife.numColors; j++) {
                            setValue(i, j, newValue)
                        }
                    }
                }
            }
        })
        // -------------------------------------------------------------------------------------------------------------
        watch(() => particleLife.numColors, (newValue) => {
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
            }, false);
            useEventListener(document, "pointerlockchange", () => {
                nextTick(() => {
                    if (document.pointerLockElement && !particleLife.isLockedPointer) {
                        document.exitPointerLock()
                        dragging = false
                        wasDragging = false
                    }
                })
            }, false);
            useEventListener(document, "mouseup", () => {
                nextTick(() => {
                    if (toDeselect) {
                        selectedCell.value = null
                        hoveredCell.value = null
                        toDeselect = false
                    }
                    particleLife.isLockedPointer = false
                    dragging = false
                    wasDragging = false
                    document.exitPointerLock()
                    document.removeEventListener('mousemove', handleDrag, true)
                })
            }, false);
        })
        // -------------------------------------------------------------------------------------------------------------
        function select(i: number, j: number) {
            if (selectedCell.value && selectedCell.value[0] === i && selectedCell.value[1] === j) {
                selectedCell.value = null
                return
            }
            selectedCell.value = [i, j]
        }
        function mousedown(event: MouseEvent, i: number, j: number) {
            hoveredCell.value = [i, j]

            if (selectedCell.value && selectedCell.value[0] === i && selectedCell.value[1] === j) {
                toDeselect = true
            }
            if ((selectedCell.value && (selectedCell.value[0] !== i || selectedCell.value[1] !== j)) || !selectedCell.value) {
                select(i, j)
            }
            dragging = true
            document.addEventListener('mousemove', handleDrag, true)
        }
        function handleDrag(event: MouseEvent) {
            if (dragging) {
                toDeselect = false
                const targetElement = event.target as HTMLElement
                if(targetElement.requestPointerLock) {
                    if (!particleLife.isLockedPointer && !document.pointerLockElement) {
                        particleLife.isLockedPointer = true
                        targetElement.requestPointerLock()
                        // hoveredCell.value = [i, j]
                    }
                } else {
                    console.log('PointerLock API not supported in this device.')
                }

                wasDragging = true
                if (event.movementX === 0 || Math.abs(event.movementX) > 16) return // Prevent movementX error with pointer lock
                const i = selectedCell.value![0]
                const j = selectedCell.value![1]
                let newValue = particleLife.rulesMatrix[i][j] + (event.movementX > 0 ? 0.01 : -0.01)
                setValue(i, j, newValue)
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
        function setValue(i: number, j: number, newValue: number = 0) {
            newValue = Math.max(-1, Math.min(1, newValue))
            newValue = Number(newValue.toFixed(4))
            emit('update', i, j, newValue)
        }

        function interpolateColor(value: number) {
            const color1 = neutralColor
            const color2 = value < 0 ? repulsionColor : value > 0 ? attractionColor : neutralColor

            value = Math.abs(value)
            const [r1, g1, b1] = color1
            const [r2, g2, b2] = color2

            const r = Math.round(r1 + (r2 - r1) * value)
            const g = Math.round(g1 + (g2 - g1) * value)
            const b = Math.round(b1 + (b2 - b1) * value)

            return `rgb(${r}, ${g}, ${b})`
        }

        return {
            particleLife, cellRowCount, hoveredCell, selectedCell, selectedRule,
            mousedown, mouseenter, mouseleave, interpolateColor, select
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
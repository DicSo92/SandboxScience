<template>
    <section w-full flex flex-col>
        <!-- Tab bar -->
        <div class="flex rounded-[0.625rem] bg-slate-700/80 p-0.75 shadow-md space-x-1">
            <button :class="openTab === 1 ? 'bg-slate-900/80' : 'hover:bg-slate-800/80'" class="flex-1 rounded-lg py-1 pl-1 text-sm transition-all duration-100 focus:outline-none" @click="openTab = 1">
                Forces
            </button>
            <button :class="openTab === 2 ? 'bg-slate-900/80' : 'hover:bg-slate-800/80'" class="flex-1 rounded-lg py-1 pl-1 text-sm transition-all duration-100 focus:outline-none" @click="openTab = 2">
                Min Radius
            </button>
            <button :class="openTab === 3 ? 'bg-slate-900/80' : 'hover:bg-slate-800/80'" class="flex-1 rounded-lg py-1 pl-1 text-sm transition-all duration-100 focus:outline-none" @click="openTab = 3">
                Max Radius
            </button>
        </div>

        <div mt-2 class="rounded-lg bg-slate-700/40 p-2 shadow-md">
            <div flex-1>
                <div grid gap-px :style="`grid-template-rows: repeat(${cellRowCount}, minmax(0, 1fr))`">
                    <div v-for="(col, i) in cellRowCount" :key="i" grid w-full gap-px :style="`grid-template-columns: repeat(${cellColCount}, minmax(0, 1fr))`">
                        <div v-for="(row, j) in cellColCount" :key="j" class="aspect-square">
                            <!-- Top-left corner -->
                            <div v-if="j === 0 && i === 0" h-full w-full class="pp-12">
                                <div h-full w-full rounded-full bg-black />
                            </div>
                            <!-- Column headers: matter color swatches -->
                            <div v-else-if="i === 0 && j > 0" h-full w-full class="pp-6" :title="`Matter color ${j - 1}`">
                                <div class="h-full w-full rounded-full ring-1 ring-slate-500/40" :style="{ backgroundColor: getColorStyleById(j - 1) }" />
                            </div>
                            <!-- Row headers: urge index labels -->
                            <div v-else-if="j === 0 && i > 0" h-full w-full class="pp-6" :title="`Urge ${i - 1}`">
                                <div class="h-full w-full flex select-none items-center justify-center rounded-full bg-slate-800/70 text-[9px] text-white/80 font-mono ring-1 ring-slate-600/50">
                                    <span class="truncate px-0.5">{{ i - 1 }}</span>
                                </div>
                            </div>
                            <!-- Data cells -->
                            <div
                                v-else relative h-full w-full cursor-ew-resize select-none
                                :class="(isHoveredCell(i - 1, j - 1) || isCellSelected(i - 1, j - 1)) && 'hovered-cell'"
                                :style="{ backgroundColor: getCellStyleColor(i - 1, j - 1) }"
                                @mouseenter="mouseenter(i - 1, j - 1)"
                                @mouseleave="mouseleave"
                                @mousedown="mousedown($event, i - 1, j - 1)"
                            >
                                <div
                                    class="left-1/2 -mt-9 -translate-x-1/2"
                                    :class="isHoveredCell(i - 1, j - 1) || (isCellSelected(i - 1, j - 1) && selectedCells![selectedCells!.length - 1][0] === i - 1 && selectedCells![selectedCells!.length - 1][1] === j - 1) ? 'visible' : 'invisible'"
                                    pointer-events-none absolute rounded-full bg-gray-800 px-3 py-2
                                >
                                    <p m-0 text-sm>
                                        {{ getCellValue(i - 1, j - 1) }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Slider -->
            <RangeInput v-if="openTab === 1" v-model="selectedValue" input :min="-1" :max="1" :step="0.01" mt-2>
                <template #customLabel>
                    <div class="w-2/3 border-2 border-slate-500/80 bg-slate-900/80 px-2 py-0.5" rounded-lg>
                        <div v-if="!selectedCells" text-center text-gray-300 font-bold>
                            All Cells
                        </div>
                        <div v-else-if="selectedCells?.length === 1" flex items-center justify-between>
                            <div class="h-5 w-5 flex items-center justify-center rounded-full bg-slate-800/70 text-[9px] text-white/80 font-mono ring-1 ring-slate-600/50">
                                {{ selectedCells[0][0] }}
                            </div>
                            <div i-tabler-arrow-narrow-right mx-1 text-xl text-gray />
                            <div class="h-5 w-5 rounded-full" :style="`background-color: ${getColorStyleById(selectedCells[0][1])}`" />
                        </div>
                        <div v-else text-center text-gray-300 font-bold>
                            Selection
                        </div>
                    </div>
                </template>
            </RangeInput>
            <RangeInput v-else-if="openTab === 2" v-model="selectedValue" input :min="1" :max="getMaxSliderBound()" :step="1" mt-2>
                <template #customLabel>
                    <div class="w-2/3 border-2 border-slate-500/80 bg-slate-900/80 px-2 py-0.5" rounded-lg>
                        <div v-if="!selectedCells" text-center text-gray-300 font-bold>
                            All Cells
                        </div>
                        <div v-else-if="selectedCells?.length === 1" flex items-center justify-between>
                            <div class="h-5 w-5 flex items-center justify-center rounded-full bg-slate-800/70 text-[9px] text-white/80 font-mono ring-1 ring-slate-600/50">
                                {{ selectedCells[0][0] }}
                            </div>
                            <div i-tabler-arrow-narrow-right mx-1 text-xl text-gray />
                            <div class="h-5 w-5 rounded-full" :style="`background-color: ${getColorStyleById(selectedCells[0][1])}`" />
                        </div>
                        <div v-else text-center text-gray-300 font-bold>
                            Selection
                        </div>
                    </div>
                </template>
            </RangeInput>
            <RangeInput v-else v-model="selectedValue" input :min="1" :max="300" :step="1" mt-2>
                <template #customLabel>
                    <div class="w-2/3 border-2 border-slate-500/80 bg-slate-900/80 px-2 py-0.5" rounded-lg>
                        <div v-if="!selectedCells" text-center text-gray-300 font-bold>
                            All Cells
                        </div>
                        <div v-else-if="selectedCells?.length === 1" flex items-center justify-between>
                            <div class="h-5 w-5 flex items-center justify-center rounded-full bg-slate-800/70 text-[9px] text-white/80 font-mono ring-1 ring-slate-600/50">
                                {{ selectedCells[0][0] }}
                            </div>
                            <div i-tabler-arrow-narrow-right mx-1 text-xl text-gray />
                            <div class="h-5 w-5 rounded-full" :style="`background-color: ${getColorStyleById(selectedCells[0][1])}`" />
                        </div>
                        <div v-else text-center text-gray-300 font-bold>
                            Selection
                        </div>
                    </div>
                </template>
            </RangeInput>
        </div>
    </section>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { hslToRgb, rgbToHex } from '~/helpers/utils/colorConversion'

export default defineComponent({
    props: {
        store: {
            type: Object,
            required: true,
        },
    },
    emits: ['update-max', 'update-min', 'update-rule'],
    setup(props, { emit }) {
        const particleLife = props.store
        const openTab = ref<number>(1)
        const hoveredCell = ref<[number, number] | null>(null)
        const selectedCell = ref<[number, number] | null>(null)
        const selectedCells = ref<[number, number][] | null>(null)
        const noSelectionValue = ref<number>(0)

        // Colors for rule interpolation
        const repulsionColor = [214, 40, 57]
        const attractionColor = [6, 182, 212] // #06b6d4 cyan-500
        const neutralColor = [9, 13, 22] // #090D16 slate-950-ish

        // Colors for radius interpolation
        const radiusNeutralColor = [12, 12, 12]
        const radiusTargetColor = [6, 182, 212] // #06b6d4 cyan-500

        let dragging = false
        let wasDragging = false
        let toDeselect = false

        const cellRowCount = computed(() => particleLife.numUrges + 1)
        const cellColCount = computed(() => particleLife.numColors + 1)

        // Get the appropriate matrix based on the active tab
        const getMatrix = () => {
            if (openTab.value === 1)
                return particleLife.urgeRulesMatrix
            if (openTab.value === 2)
                return particleLife.urgeMinRadiusMatrix
            return particleLife.urgeMaxRadiusMatrix
        }

        const getCellValue = (i: number, j: number): number => {
            const m = getMatrix()
            if (!m || !m[i])
                return 0
            return m[i][j] ?? 0
        }

        const getCellStyleColor = (i: number, j: number): string => {
            const value = getCellValue(i, j)
            if (openTab.value === 1) {
                // Rule: interpolate between repulsion and attraction
                return interpolateRuleColor(value)
            }
            else {
                // Radius: interpolate from dark to target color based on relative magnitude
                return interpolateRadiusColor(value)
            }
        }

        const getMaxSliderBound = (): number => {
            if (selectedCell.value && selectedCells.value?.length === 1) {
                return particleLife.urgeMaxRadiusMatrix[selectedCell.value[0]][selectedCell.value[1]] ?? 300
            }
            return 300
        }

        const selectedValue = computed({
            get: () => {
                if (selectedCell.value) {
                    return getCellValue(selectedCell.value[0], selectedCell.value[1])
                }
                return noSelectionValue.value
            },
            set: (newValue) => {
                if (openTab.value === 1) {
                    newValue = Math.max(-1, Math.min(1, newValue))
                }
                else {
                    newValue = Math.max(1, Math.round(newValue))
                }
                if (selectedCell.value) {
                    updateMatrixForSelectedCells(newValue)
                }
                else {
                    noSelectionValue.value = newValue
                    updateMatrixForAllCells(newValue)
                }
            },
        })

        watch(() => [particleLife.numColors, particleLife.numUrges], () => {
            selectedCells.value = null
            selectedCell.value = null
            hoveredCell.value = null
        })
        // Reset selection when switching tabs
        watch(() => openTab.value, () => {
            selectedCells.value = null
            selectedCell.value = null
            hoveredCell.value = null
            noSelectionValue.value = openTab.value === 1 ? 0 : 40
        })

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
                        }
                        else {
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

        function mousedown(event: MouseEvent, i: number, j: number) {
            hoveredCell.value = [i, j]
            selectedCell.value = [i, j]

            if (isCellSelected(i, j)) {
                toDeselect = true
            }
            if ((!isCellSelected(i, j)) || !selectedCells.value) {
                if (event.ctrlKey) {
                    groupSelect(i, j)
                }
                else {
                    select(i, j)
                }
            }
            dragging = true
            if (!event.ctrlKey)
                document.addEventListener('mousemove', handleDrag, true)
        }

        function handleDrag(event: MouseEvent) {
            if (dragging) {
                toDeselect = false
                const targetElement = event.target as HTMLElement
                if (targetElement.requestPointerLock) {
                    if (!particleLife.isLockedPointer && !document.pointerLockElement) {
                        particleLife.isLockedPointer = true
                        targetElement.requestPointerLock()
                    }
                }
                else {
                    console.log('PointerLock API not supported in this device.')
                }

                wasDragging = true
                const i = selectedCell.value![0]
                const j = selectedCell.value![1]
                let value: number
                if (openTab.value === 1) {
                    value = getCellValue(i, j) + (event.movementX > 0 ? 0.01 : -0.01)
                }
                else {
                    value = Math.round(getCellValue(i, j)) + (event.movementX > 0 ? 1 : -1)
                }
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
                selectedCells.value = selectedCells.value!.filter(([x, y]) => x !== i || y !== j)
                if (selectedCells.value.length === 0) {
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
            const numUrges = particleLife.numUrges
            const numColors = particleLife.numColors
            for (let i = 0; i < numUrges; i++) {
                for (let j = 0; j < numColors; j++) {
                    if (openTab.value === 1)
                        emit('update-rule', i, j, value)
                    else if (openTab.value === 2)
                        emit('update-min', i, j, value)
                    else emit('update-max', i, j, value)
                }
            }
        }

        function updateMatrixForSelectedCells(value: number) {
            for (let i = 0; i < selectedCells.value!.length; i++) {
                const [x, y] = selectedCells.value![i]
                if (openTab.value === 1)
                    emit('update-rule', x, y, value)
                else if (openTab.value === 2)
                    emit('update-min', x, y, value)
                else emit('update-max', x, y, value)
            }
        }

        // -------------------------------------------------------------------------------------------------------------
        function interpolateRuleColor(value: number): string {
            const color1 = neutralColor
            const color2 = value < 0 ? repulsionColor : value > 0 ? attractionColor : neutralColor
            const v = Math.abs(value)
            const [r1, g1, b1] = color1
            const [r2, g2, b2] = color2
            const r = Math.round(r1 + (r2 - r1) * v)
            const g = Math.round(g1 + (g2 - g1) * v)
            const b = Math.round(b1 + (b2 - b1) * v)
            return `rgb(${r}, ${g}, ${b})`
        }

        function interpolateRadiusColor(value: number): string {
            // Map radius 0..300 to dark..target color
            const t = Math.min(1, value / 200)
            const [r1, g1, b1] = radiusNeutralColor
            const [r2, g2, b2] = radiusTargetColor
            const r = Math.round(r1 + (r2 - r1) * t)
            const g = Math.round(g1 + (g2 - g1) * t)
            const b = Math.round(b1 + (b2 - b1) * t)
            return `rgb(${r}, ${g}, ${b})`
        }

        function getColorStyleById(id: number): string {
            const colors = particleLife.currentColors
            if (!colors)
                return "rgb(12,12,12)"
            if (colors instanceof Float32Array) {
                const i = id * 4
                const r = Math.round(colors[i] * 255)
                const g = Math.round(colors[i + 1] * 255)
                const b = Math.round(colors[i + 2] * 255)
                return `rgb(${r}, ${g}, ${b})`
            }
            return colors[id] ? `hsl(${colors[id][0]}, ${colors[id][1]}%, ${colors[id][2]}%)` : "hsl(0, 0%, 5%)"
        }

        function getColorHexById(id: number): string {
            const colors = particleLife.currentColors
            if (!colors)
                return '#0C0C0C'
            if (colors instanceof Float32Array) {
                const i = id * 4
                return rgbToHex(Math.round(colors[i] * 255), Math.round(colors[i + 1] * 255), Math.round(colors[i + 2] * 255))
            }
            const [h, s, l] = colors[id]
            const [r, g, b] = hslToRgb(h, s, l)
            return rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255))
        }

        // -------------------------------------------------------------------------------------------------------------
        return {
            particleLife,
            openTab,
            cellRowCount,
            cellColCount,
            selectedValue,
            selectedCells,
            mousedown,
            mouseenter,
            mouseleave,
            getCellValue,
            getCellStyleColor,
            getMaxSliderBound,
            isCellSelected,
            isHoveredCell,
            getColorStyleById,
            getColorHexById,
        }
    },
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
}
</style>

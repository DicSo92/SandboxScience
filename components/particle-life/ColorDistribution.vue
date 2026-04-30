<template>
    <div>
        <div flex overflow-hidden rounded-lg h-4.5 mb-3 class="shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)] ring-1 ring-slate-600/25">
            <div v-for="(pct, i) in distribution" :key="i"
                 border-r border-slate-700 class="last:border-r-0 min-w-[2px]"
                 :class="draggingIndex === i ? 'brightness-130 z-1' : ''"
                 :style="{ width: pct + '%', backgroundColor: rgb(colors[i]) }">
            </div>
        </div>

        <div flex flex-col gap-0.5>
            <div v-for="(pct, i) in distribution" :key="i"
                 flex items-center rounded-lg px-1 py-0.5 gap-1.5 transition-all duration-150
                 :class="draggingIndex === i ? 'bg-white/8 ring-1 ring-white/15 scale-[1.01]' : 'hover:bg-white/4'">

                <!-- Color indicator -->
                <div w-2.5 h-2.5 rounded-full shrink-0
                     :style="{
                         backgroundColor: rgb(colors[i]),
                         boxShadow: draggingIndex === i
                             ? `0 0 8px ${rgba(colors[i], 0.5)}, 0 0 3px ${rgba(colors[i], 0.38)}`
                             : `0 0 4px ${rgba(colors[i], 0.25)}`
                     }">
                </div>

                <!-- Type index -->
                <span class="text-2xs w-3 shrink-0 text-center select-none" :class="draggingIndex === i ? 'text-gray-200' : 'text-gray-500'">
                    {{ i + 1 }}
                </span>

                <!-- Interactive bar track (range input) -->
                <div flex-1 h-4 rounded-md relative overflow-hidden class="bg-slate-800/80">
                    <!-- Fill overlay -->
                    <div absolute inset-y-0 left-0 rounded-md pointer-events-none class="bar-fill"
                         :class="{ 'bar-fill--dragging': draggingIndex === i }"
                         :style="{
                             width: pct + '%',
                             background: `linear-gradient(90deg, ${rgba(colors[i], 0.73)}, ${rgb(colors[i])})`,
                             boxShadow: draggingIndex === i
                                 ? `0 0 14px ${rgba(colors[i], 0.38)}, inset 0 1px 0 rgba(255,255,255,0.18)`
                                 : 'inset 0 1px 0 rgba(255,255,255,0.08)'
                         }">
                    </div>
                    <!-- Reference marks -->
                    <div v-for="mark in [25, 50, 75]" :key="mark"
                         absolute inset-y-0 w-px pointer-events-none class="bg-slate-600/25"
                         :style="{ left: mark + '%' }">
                    </div>
                    <!-- Range input -->
                    <input :ref="(el: any) => setRangeInput(el, i)" type="range" min="0" max="100" step="0.1" :aria-label="`Color ${i} distribution`" class="range-slider"
                        :value="pct" :disabled="locked[i]"
                        @pointerdown="onRangePointerDown(i, $event)"
                        @pointerup="onRangePointerUp"
                        @input="onRangeInput(i)"
                    />
                </div>

                <!-- Editable percentage -->
                <div shrink-0 flex items-center gap-0>
                    <input :ref="(el: any) => setNumberInput(el, i)" type="text" inputmode="decimal" text-2xs w-10 px-0.5 font-mono text-right
                           bg-transparent border-none outline-none rounded transition-colors duration-150
                           class="focus:bg-white/10 focus:ring-1 focus:ring-white/20 hover:bg-white/5"
                           :class="[
                               draggingIndex === i ? 'text-white font-semibold' : 'text-gray-400',
                               locked[i] ? 'opacity-50' : ''
                           ]"
                           :value="pct === 100 ? pct : pct.toFixed(1)"
                           :disabled="locked[i]"
                           @focus="onInputFocus(i)"
                           @input="onInputChange(i)"
                           @blur="onInputBlur(i)"
                           @keydown.enter="numberInputs[i]?.blur()"
                           @keydown.escape="numberInputs[i]?.blur()"
                    />

                    <span ml-0.5 text-2xs font-mono select-none :class="draggingIndex === i ? 'text-white/50' : 'text-gray-600'">%</span>
                </div>

                <button @click="toggleLock(i)" w-4 h-4 shrink-0 flex items-center justify-center rounded transition-all duration-150
                        :class="locked[i] ? 'text-amber-400 bg-amber-400/15 hover:bg-amber-400/25' : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'">
                    <span :class="locked[i] ? 'i-tabler-lock' : 'i-tabler-lock-open'" text-2xs />
                </button>
            </div>
        </div>

        <div flex gap-1.5 mt-3>
            <button @click="initEqual" flex-1 btn py-1.5 text-xs rounded-lg flex items-center justify-center class="bg-slate-600/50 hover:bg-slate-500/50">
                <span i-tabler-equal text-xs mr-1 />
                Equal
            </button>
            <button @click="randomize" flex-1 btn py-1.5 text-xs rounded-lg flex items-center justify-center class="bg-slate-600/50 hover:bg-slate-500/50">
                <span i-tabler-dice-3 text-xs mr-1 />
                Random
            </button>
            <button @click="applyDistribution" flex-1 btn py-1.5 text-xs rounded-lg font-medium flex items-center justify-center class="bg-teal-600/70 hover:bg-teal-500/70 text-teal-100">
                <span i-tabler-check text-xs mr-1 />
                Apply
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    numColors: number
    colors: number[][]
}>()
const emit = defineEmits<{
    apply: [distribution: number[]]
}>()

const distribution = ref<number[]>([])
const draggingIndex = ref<number>(-1)
const locked = ref<boolean[]>([])

const rangeInputs = ref<HTMLInputElement[]>([])
const numberInputs = ref<HTMLInputElement[]>([])
const setRangeInput = (el: HTMLInputElement | null, i: number) => {
    if (el) rangeInputs.value[i] = el
    else delete rangeInputs.value[i]
}
const setNumberInput = (el: HTMLInputElement | null, i: number) => {
    if (el) numberInputs.value[i] = el
    else delete numberInputs.value[i]
}

onMounted(() => {
    initEqual()
})
// ---------------------------------------------------------------------------------------------------------------------
const toggleLock = (index: number) => {
    if (locked.value[index]) {
        locked.value[index] = false
        return
    }
    const unlockedCount = locked.value.filter(l => !l).length
    if (unlockedCount <= 2) return // Keep at least 2 unlocked
    locked.value[index] = true
}
// ---------------------------------------------------------------------------------------------------------------------
// Rounds every value to 1 decimal while guaranteeing sum === 100.0
const roundDistribution = (raw: number[]): number[] => {
    const floored = raw.map(v => Math.floor(v * 10) / 10)
    const remainders = raw.map((v) => v * 10 - Math.floor(v * 10))
    let missing = Math.round((100 - floored.reduce((a, b) => a + b, 0)) * 10)

    const indices = raw.map((_, i) => i)
    indices.sort((a, b) => remainders[b] - remainders[a])

    for (const i of indices) {
        if (missing <= 0) break
        floored[i] = Math.round((floored[i] + 0.1) * 10) / 10
        missing--
    }
    return floored
}
// ---------------------------------------------------------------------------------------------------------------------
const redistribute = (refDist: number[], idx: number, newPct: number): number[] => {
    const dist = refDist.map(v => (Number.isFinite(v) && v > 0 ? v : 0)) // guarantees value >= 0 and finite
    const newDist = [...dist]

    let lockedTotal = 0
    let freeTotal = 0
    const freeIndices: number[] = []
    for (let i = 0; i < dist.length; i++) {
        if (i === idx) continue
        if (locked.value[i]) lockedTotal += dist[i]
        else { freeIndices.push(i); freeTotal += dist[i] }
    }

    newDist[idx] = Math.min(Math.max(0, newPct), Math.max(0, 100 - lockedTotal)) // Clamp to [0, 100 - lockedTotal]

    const remaining = 100 - newDist[idx] - lockedTotal
    if (freeIndices.length === 0 || remaining <= 0) {
        for (const i of freeIndices) newDist[i] = 0
    } else if (freeTotal > 0) {
        const scale = remaining / freeTotal
        for (const i of freeIndices) newDist[i] = dist[i] * scale
    } else {
        const share = remaining / freeIndices.length
        for (const i of freeIndices) newDist[i] = share
    }

    return roundDistribution(newDist)
}
// ---------------------------------------------------------------------------------------------------------------------
let dragStartDist: number[] = []
const onRangePointerDown = (index: number, e: PointerEvent) => {
    if (locked.value[index]) return
    draggingIndex.value = index
    dragStartDist = [...distribution.value]
    ;(e.target as HTMLInputElement).setPointerCapture(e.pointerId)
}
const onRangePointerUp = () => {
    if (draggingIndex.value === -1) return
    draggingIndex.value = -1
    dragStartDist = []
}
const onRangeInput = (index: number) => {
    const value = parseFloat(rangeInputs.value[index].value)
    if (isNaN(value)) return

    // Use snapshot if dragging, otherwise current distribution
    const refDist = dragStartDist.length ? dragStartDist : distribution.value
    distribution.value = redistribute(refDist, index, value)
}
// ---------------------------------------------------------------------------------------------------------------------
const applyInputValue = (index: number) => {
    const parsed = parseFloat(numberInputs.value[index].value.trim())
    if (isNaN(parsed)) return

    const clamped = Math.round(Math.max(0, Math.min(100, parsed)) * 10) / 10
    distribution.value = redistribute(distribution.value, index, clamped)
}
const debouncedApply = useDebounceFn(applyInputValue, 750)

const onInputFocus  = (index: number) => nextTick(() => numberInputs.value[index]?.select())
const onInputChange = (index: number) => debouncedApply(index)
const onInputBlur   = (index: number) => applyInputValue(index)
// ---------------------------------------------------------------------------------------------------------------------
const initEqual = () => {
    const n = props.numColors
    if (n <= 0) return
    const pct = 100 / n
    distribution.value = roundDistribution(Array.from({ length: n }, () => pct))
    locked.value = Array.from({ length: n }, () => false)
}
const randomize = () => {
    const n = props.numColors
    if (n <= 0) return
    const weights = Array.from({ length: n }, () => Math.random() * 0.9 + 0.1)
    const total = weights.reduce((a, b) => a + b, 0)
    distribution.value = roundDistribution(weights.map(w => (w / total) * 100))
}
const applyDistribution = () => {
    emit('apply', [...distribution.value])
}
// ---------------------------------------------------------------------------------------------------------------------
const rgb = (c?: number[]) => c ? `rgb(${c[0]},${c[1]},${c[2]})` : 'transparent'
const rgba = (c?: number[], a = 1) => c ? `rgba(${c[0]},${c[1]},${c[2]},${a})` : 'transparent'
// ---------------------------------------------------------------------------------------------------------------------
watch(() => props.numColors, (newVal, oldVal) => {
    if (oldVal !== undefined) initEqual()
})
</script>

<style scoped>
.bar-fill--dragging {
    animation: bar-glow-pulse 1.2s ease-in-out infinite;
}
@keyframes bar-glow-pulse {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.3); }
}

.range-slider {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    opacity: 0;
    cursor: ew-resize;
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    z-index: 2;
}
.range-slider:disabled {
    cursor: not-allowed;
}
.range-slider::-webkit-slider-runnable-track {
    height: 100%;
    background: transparent;
    border: none;
}
.range-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 4px;
    height: 100%;
    background: transparent;
    border: none;
    cursor: ew-resize;
}
.range-slider::-moz-range-track {
    height: 100%;
    background: transparent;
    border: none;
}
.range-slider::-moz-range-thumb {
    width: 4px;
    height: 100%;
    background: transparent;
    border: none;
    cursor: ew-resize;
}
.range-slider::-moz-range-progress {
    background: transparent;
}
</style>
<template>
    <div>
        <div class="overflow-hidden rounded-[0.6rem] border border-slate-500/35 bg-slate-950/50">
            <svg ref="svgRef" :viewBox="`0 0 ${VIEW} ${VIEW}`" font-family="Inter, sans-serif" w-full select-none overflow-visible touch-none
                 :class="dragging ? 'cursor-grabbing' : hovered ? 'cursor-grab' : 'cursor-default'"
                 @pointerdown="onDown" @pointermove="onMove"
                 @pointerup="onUp" @pointerleave="onUp">

                <defs>
                    <radialGradient id="glow-gradient">
                        <stop offset="0%"   stop-color="#cbd5e1" stop-opacity="0.5"/>
                        <stop offset="55%"  stop-color="#94a3b8" stop-opacity="0.15"/>
                        <stop offset="100%" stop-color="#64748b" stop-opacity="0"/>
                    </radialGradient>
                    <radialGradient id="vignette">
                        <stop offset="65%"  stop-color="transparent"/>
                        <stop offset="100%" stop-color="rgba(2,6,15,0.35)"/>
                    </radialGradient>
                    <filter id="particle-glow" x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="2.2" result="b"/>
                        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <filter id="stroke-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2.8" result="b"/>
                        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                </defs>

                <!-- Vignette background -->
                <circle :cx="CENTER" :cy="CENTER" :r="MAX_VISUAL_R + 8" fill="url(#vignette)"/>
                <!-- Outer boundary -->
                <circle :cx="CENTER" :cy="CENTER" :r="MAX_VISUAL_R + 6" fill="none" :stroke="COLOR.crosshair" stroke-opacity="0.35" stroke-width="0.5"/>
                <!-- Reference grid -->
                <circle v-for="g in gridLines" :key="g.label" :cx="CENTER" :cy="CENTER" :r="g.radius" fill="none" :stroke="COLOR.crosshair" stroke-opacity="0.25" stroke-width="0.5" stroke-dasharray="3 6"/>

                <!-- Graduation labels -->
                <g v-for="g in labelLines" :key="'gl-' + g.label">
                    <text :x="CENTER + g.radius" :y="CENTER - 6" text-anchor="middle" :fill="COLOR.crosshair" fill-opacity="0.45" font-size="3">
                        {{ g.label }}
                    </text>
                    <text :x="CENTER - g.radius" :y="CENTER - 6" text-anchor="middle" :fill="COLOR.crosshair" fill-opacity="0.45" font-size="3">
                        {{ g.label }}
                    </text>
                </g>
                <!-- Crosshair horizontal -->
                <line :x1="CENTER - MAX_VISUAL_R - 4" :y1="CENTER" :x2="CENTER + MAX_VISUAL_R + 4" :y2="CENTER" :stroke="COLOR.crosshair" stroke-opacity="0.35" stroke-width="0.5"/>
                <!-- Crosshair vertical -->
                <line :x1="CENTER" :y1="CENTER - MAX_VISUAL_R - 4" :x2="CENTER" :y2="CENTER + MAX_VISUAL_R + 4" :stroke="COLOR.crosshair" stroke-opacity="0.35" stroke-width="0.5"/>

                <!-- Main ticks -->
                <g v-for="g in gridLines" :key="'gr-' + g.label">
                    <line :x1="CENTER + g.radius" :y1="CENTER - 4" :x2="CENTER + g.radius" :y2="CENTER + 4" :stroke="COLOR.crosshair" stroke-opacity="0.55" stroke-width="0.5"/>
                    <line :x1="CENTER - g.radius" :y1="CENTER - 4" :x2="CENTER - g.radius" :y2="CENTER + 4" :stroke="COLOR.crosshair" stroke-opacity="0.55" stroke-width="0.5"/>
                    <line :x1="CENTER - 4" :y1="CENTER + g.radius" :x2="CENTER + 4" :y2="CENTER + g.radius" :stroke="COLOR.crosshair" stroke-opacity="0.55" stroke-width="0.5"/>
                    <line :x1="CENTER - 4" :y1="CENTER - g.radius" :x2="CENTER + 4" :y2="CENTER - g.radius" :stroke="COLOR.crosshair" stroke-opacity="0.55" stroke-width="0.5"/>
                </g>
                <!-- Sub ticks -->
                <g v-for="(r, i) in subTicks" :key="'st-' + i">
                    <line :x1="CENTER + r" :y1="CENTER - 2" :x2="CENTER + r" :y2="CENTER + 2" :stroke="COLOR.crosshair" stroke-opacity="0.35" stroke-width="0.5"/>
                    <line :x1="CENTER - r" :y1="CENTER - 2" :x2="CENTER - r" :y2="CENTER + 2" :stroke="COLOR.crosshair" stroke-opacity="0.35" stroke-width="0.5"/>
                    <line :x1="CENTER - 2" :y1="CENTER + r" :x2="CENTER + 2" :y2="CENTER + r" :stroke="COLOR.crosshair" stroke-opacity="0.35" stroke-width="0.5"/>
                    <line :x1="CENTER - 2" :y1="CENTER - r" :x2="CENTER + 2" :y2="CENTER - r" :stroke="COLOR.crosshair" stroke-opacity="0.35" stroke-width="0.5"/>
                </g>

                <!-- Max radius zone -->
                <circle v-if="scaledRadii.maxB > scaledRadii.maxA" :cx="CENTER" :cy="CENTER" :r="(scaledRadii.maxA + scaledRadii.maxB) / 2" fill="none" :stroke="COLOR.max.base" stroke-opacity="0.45" :stroke-width="scaledRadii.maxB - scaledRadii.maxA"/>
                <!-- Min radius zone -->
                <circle v-if="scaledRadii.minB > scaledRadii.minA" :cx="CENTER" :cy="CENTER" :r="(scaledRadii.minA + scaledRadii.minB) / 2" fill="none" :stroke="COLOR.min.base" stroke-opacity="0.40" :stroke-width="scaledRadii.minB - scaledRadii.minA"/>

                <!-- MIN label -->
                <text :x="CENTER" :y="CENTER + (scaledRadii.minA + scaledRadii.minB) / 2" text-anchor="middle" dy="0.15em"
                      :font-size="minFontSize" font-weight="800"
                      :stroke="COLOR.textOutline" stroke-opacity="0.8" :stroke-width="minFontSize * 0.08" stroke-linejoin="round"
                      paint-order="stroke" :fill="COLOR.min.base" pointer-events-none>
                    MIN
                </text>
                <!-- MAX label -->
                <text :x="CENTER" :y="CENTER + (scaledRadii.maxA + scaledRadii.maxB) / 2" text-anchor="middle" dy="0.25em"
                      :font-size="maxFontSize" font-weight="800"
                      :stroke="COLOR.textOutline" stroke-opacity="0.8" :stroke-width="maxFontSize * 0.08" stroke-linejoin="round"
                      paint-order="stroke" :fill="COLOR.max.base" pointer-events-none>
                    MAX
                </text>

                <!-- Circle outlines -->
                <circle v-for="c in circles" :key="c.id" :cx="CENTER" :cy="CENTER" :r="Math.max(0.5, c.radius)"
                        fill="none"
                        style="transition: stroke-width 0.15s ease, stroke-opacity 0.15s ease, stroke 0.15s ease"
                        :stroke="isActive(c.id) ? c.activeColor : c.color"
                        :stroke-width="isActive(c.id) ? 1.8 : 1.2"
                        :stroke-opacity="isActive(c.id) ? 1 : 0.65"
                        :stroke-dasharray="isActive(c.id) ? 'none' : '3 4'"
                        :filter="isActive(c.id) ? 'url(#stroke-glow)' : 'none'"
                />

                <!-- Active handle -->
                <circle v-if="activeId" :cx="CENTER + activeScaledR" :cy="CENTER" r="3.5"
                        fill="none" :stroke="activeColor" stroke-width="1.5" class="handle-pulse" pointer-events-none/>
                <circle v-if="activeId" :cx="CENTER + activeScaledR" :cy="CENTER" r="2.5" :fill="activeColor" opacity="0.9"/>

                <!-- Active value label -->
                <g v-if="activeId">
                    <text :x="CENTER - 8" :y="labelY" text-anchor="end"
                          font-size="5" font-weight="600"
                          :stroke="COLOR.textOutline" stroke-opacity="0.9" stroke-width="2.5" stroke-linejoin="round"
                          paint-order="stroke" :fill="activeColor" opacity="0.5">
                        {{ activeLabel }}
                    </text>
                    <text :x="CENTER" :y="labelY" dy="1" text-anchor="middle"
                          font-size="6" font-weight="700"
                          :stroke="COLOR.textOutline" stroke-opacity="0.9" stroke-width="2.5" stroke-linejoin="round"
                          paint-order="stroke" :fill="activeColor" opacity="0.7">
                        {{ activeChevron }}
                    </text>
                    <text :x="CENTER + 8" :y="labelY" text-anchor="start"
                          font-size="10" font-weight="700"
                          :stroke="COLOR.textOutline" stroke-opacity="0.9" stroke-width="3.5" stroke-linejoin="round"
                          paint-order="stroke" :fill="activeColor">
                        {{ activeValue }}
                    </text>
                </g>

                <!-- Center dot -->
                <circle :cx="CENTER" :cy="CENTER" r="8" fill="url(#glow-gradient)"/>
                <circle :cx="CENTER" :cy="CENTER" r="2" :fill="COLOR.centerDot" filter="url(#particle-glow)" opacity="0.8"/>
            </svg>
        </div>

        <div flex flex-col gap-1.5 mt-1.5>
            <div flex items-center justify-between>
                <div flex items-center gap-1.5>
                    <span inline-block w-2 h-2 rounded-full flex-shrink-0 bg-cyan-500/>
                    <span text-2sm text-slate-300>Min Radius</span>
                    <TooltipInfo container="#mainContainer" tooltip="Range for generating minimum interaction radii. <br> Controls the minimum distance at which particles begin to interact." />
                </div>
                <div flex items-center gap-1>
                    <Input :modelValue="minRadiusRange[0]" @change="(val: number) => applyValue('minA', val)"/>
                    <span text-slate-500 text-2xs>–</span>
                    <Input :modelValue="minRadiusRange[1]" @change="(val: number) => applyValue('minB', val)"/>
                </div>
            </div>
            <div flex items-center justify-between>
                <div flex items-center gap-1.5>
                    <span inline-block w-2 h-2 rounded-full flex-shrink-0 bg-rose-500/>
                    <span text-2sm text-slate-300>Max Radius</span>
                    <TooltipInfo container="#mainContainer" tooltip="Range for generating maximum interaction radii. <br> Controls the maximum interaction distance between particles." />
                </div>
                <div flex items-center gap-1>
                    <Input :modelValue="maxRadiusRange[0]" @change="(val: number) => applyValue('maxA', val)"/>
                    <span text-slate-500 text-2xs>–</span>
                    <Input :modelValue="maxRadiusRange[1]" @change="(val: number) => applyValue('maxB', val)"/>
                </div>
            </div>
            <hr border-slate-600>
            <div flex gap-1.5>
                <button @click="emit('randomizeRadius')" type="button" title="Randomize radius matrices with current range settings" aria-label="Randomize radius matrices"
                        btn flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-2sm shadow-lg bg="slate-700/60 hover:slate-800/60">
                    <span class="i-tabler-circles text-sm"/>
                    <span>Radius</span>
                </button>
                <button @click="emit('randomizeRulesAndRadius')" type="button" title="Randomize rules and radius matrices (keep positions and colors)" aria-label="Randomize rules and radius"
                        btn flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-2sm shadow-lg bg="slate-700/60 hover:slate-800/60">
                    <span class="i-tabler-arrows-shuffle text-sm"/>
                    <span>Rules + Radius</span>
                </button>
            </div>
            <button @click="emit('randomizeAll')" type="button" title="Randomize everything (positions, colors, rules, radius)" aria-label="Randomize all"
                    btn w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-2sm shadow-lg bg="cyan-900/80 hover:cyan-900/50">
                <span class="i-game-icons-perspective-dice-six-faces-random text-sm"/>
                <span>Randomize All</span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    minRadiusRange: number[]
    maxRadiusRange: number[]
}>()
const emit = defineEmits<{
    'update:minRadiusRange': [value: number[]]
    'update:maxRadiusRange': [value: number[]]
    'randomizeRadius': []
    'randomizeRulesAndRadius': []
    'randomizeAll': []
}>()
// ---------------------------------------------------------------------------------------------------------------------
const COLOR = {
    min: {
        base: '#06b6d4',      // cyan-500
        highlight: '#22d3ee', // cyan-400
    },
    max: {
        base: '#f43f5e',      // rose-500
        highlight: '#fda4af', // rose-300
    },
    crosshair: '#94a3b8',     // slate-400
    textOutline: '#020617',   // slate-950
    centerDot: '#e2e8f0',     // slate-200
}
// ---------------------------------------------------------------------------------------------------------------------
type Handle = 'minA' | 'minB' | 'maxA' | 'maxB'
const HANDLE = {
    minA: { label: 'min', chevron: '▾', color: COLOR.min },
    minB: { label: 'min', chevron: '▴', color: COLOR.min },
    maxA: { label: 'max', chevron: '▾', color: COLOR.max },
    maxB: { label: 'max', chevron: '▴', color: COLOR.max },
}
// ---------------------------------------------------------------------------------------------------------------------
const VIEW = 300
const CENTER = VIEW / 2
const MAX_VISUAL_R = 136
const MIN_LABEL_GAP = 26
const LERP_SPEED = 0.12
const HANDLE_GAP = 1
const SNAP_DIST = 22

const svgRef = ref<SVGSVGElement | null>(null)
const dragging = ref<Handle | null>(null)
const hovered = ref<Handle | null>(null)
const targetRenderMax = ref(256)
const renderMax = ref(256)

let animating = false
let animationFrameId: number | null = null
let frozenPxPerUnit = 0 // Ensures scale stays stable while dragging
// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
const isActive = (id: Handle): boolean => dragging.value === id || hovered.value === id
const activeId = computed<Handle | null>(() => dragging.value ?? hovered.value)
const activeValue = computed(() => {
    const id = activeId.value
    if (!id) return 0
    if (id === 'minA') return props.minRadiusRange[0]
    if (id === 'minB') return props.minRadiusRange[1]
    if (id === 'maxA') return props.maxRadiusRange[0]
    return props.maxRadiusRange[1]
})
const activeColor = computed(() => HANDLE[activeId.value ?? 'minA'].color.highlight)
const activeScaledR = computed(() => activeId.value ? scaledRadii.value[activeId.value] : 0)
const activeLabel = computed(() => activeId.value ? HANDLE[activeId.value].label : '')
const activeChevron = computed(() => activeId.value ? HANDLE[activeId.value].chevron : '')
const labelY = computed(() => Math.max(36, CENTER - activeScaledR.value - 10))
const minFontSize = computed(() => zoneFontSize(scaledRadii.value.minA, scaledRadii.value.minB))
const maxFontSize = computed(() => zoneFontSize(scaledRadii.value.maxA, scaledRadii.value.maxB))
const pxPerUnit = computed(() => MAX_VISUAL_R / renderMax.value)
// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
const scaledRadii = computed(() => ({
    minA: props.minRadiusRange[0] * pxPerUnit.value,
    minB: props.minRadiusRange[1] * pxPerUnit.value,
    maxA: props.maxRadiusRange[0] * pxPerUnit.value,
    maxB: props.maxRadiusRange[1] * pxPerUnit.value,
}))
const circles = computed(() => [
    { id: 'minA' as Handle, radius: scaledRadii.value.minA, color: HANDLE.minA.color.base, activeColor: HANDLE.minA.color.highlight },
    { id: 'minB' as Handle, radius: scaledRadii.value.minB, color: HANDLE.minB.color.base, activeColor: HANDLE.minB.color.highlight },
    { id: 'maxA' as Handle, radius: scaledRadii.value.maxA, color: HANDLE.maxA.color.base, activeColor: HANDLE.maxA.color.highlight },
    { id: 'maxB' as Handle, radius: scaledRadii.value.maxB, color: HANDLE.maxB.color.base, activeColor: HANDLE.maxB.color.highlight },
])
// ---------------------------------------------------------------------------------------------------------------------
const dataMax = computed(() => Math.max(props.minRadiusRange[0], props.minRadiusRange[1], props.maxRadiusRange[0], props.maxRadiusRange[1], 10))
const displayMax = computed(() => {
    const step = niceStep(dataMax.value)
    return Math.max(step * 2, Math.ceil(dataMax.value * 1.12 / step) * step)
})
// ---------------------------------------------------------------------------------------------------------------------
const currentStep = computed(() => niceStep(renderMax.value))
const gridLines = computed(() => {
    const step = currentStep.value
    const max = renderMax.value
    const out: { radius: number; label: number }[] = []
    for (let val = step; val <= max; val += step) {
        out.push({ radius: val * pxPerUnit.value, label: val })
    }
    return out
})
const labelLines = computed(() => {
    const all = gridLines.value
    if (all.length === 0) return []
    const out: typeof all = []
    let lastR = -MIN_LABEL_GAP
    for (const line of all) {
        if (line.radius - lastR >= MIN_LABEL_GAP) {
            out.push(line)
            lastR = line.radius
        }
    }
    return out
})
const subTicks = computed(() => {
    const step = currentStep.value
    const sub = step / 2
    const max = renderMax.value
    const out: number[] = []
    for (let val = sub; val <= max; val += sub) {
        if (Math.abs(val % step) > 0.001) {
            out.push(val * pxPerUnit.value)
        }
    }
    return out
})
// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
const zoneFontSize = (a: number, b: number) => Math.max(7.5, Math.min(Math.max(0, b - a) * 0.45, 15))
const niceStep = (max: number): number => {
    if (max <= 0) return 10
    const rough = max / 5
    const mag = Math.pow(10, Math.floor(Math.log10(rough)))
    const norm = rough / mag
    if (norm <= 1.5) return mag
    if (norm <= 3.5) return 2 * mag
    if (norm <= 7.5) return 5 * mag
    return 10 * mag
}
const tickRenderMax = () => {
    const diff = targetRenderMax.value - renderMax.value
    if (Math.abs(diff) < 0.3) {
        renderMax.value = targetRenderMax.value
        animating = false
        cancelAnimationLoop()
        return
    }
    renderMax.value += diff * LERP_SPEED
    animationFrameId = requestAnimationFrame(tickRenderMax)
}
const setRenderMax = (newMax: number) => {
    targetRenderMax.value = newMax
    if (!animating) {
        animating = true
        animationFrameId = requestAnimationFrame(tickRenderMax)
    }
}
// ---------------------------------------------------------------------------------------------------------------------
const svgDist = (e: PointerEvent): number => {
    if (!svgRef.value) return 0
    const rect = svgRef.value.getBoundingClientRect()
    const sx = ((e.clientX - rect.left) / rect.width) * VIEW
    const sy = ((e.clientY - rect.top) / rect.height) * VIEW
    return Math.sqrt((sx - CENTER) ** 2 + (sy - CENTER) ** 2)
}
const closestHandle = (pointerDist: number): Handle | null => {
    let best: Handle | null = null
    let bestDist = Infinity
    for (const circle of circles.value) {
        const gap = Math.abs(pointerDist - circle.radius)
        if (gap < bestDist) {
            best = circle.id
            bestDist = gap
        }
    }
    return bestDist < SNAP_DIST ? best : null
}
// ---------------------------------------------------------------------------------------------------------------------
const applyDrag = (handle: Handle, svgR: number) => {
    const value = Math.round(Math.max(0, svgR / frozenPxPerUnit))
    applyValue(handle, value)
}
const applyValue = (handle: Handle, value: number) => {
    const minR = [props.minRadiusRange[0], props.minRadiusRange[1]]
    const maxR = [props.maxRadiusRange[0], props.maxRadiusRange[1]]

    if (handle === 'minA') {
        minR[0] = Math.max(0, value)
        if (minR[0] > minR[1] - HANDLE_GAP) minR[1] = minR[0] + HANDLE_GAP
        if (minR[1] > maxR[0] - HANDLE_GAP) maxR[0] = minR[1] + HANDLE_GAP
        if (maxR[0] > maxR[1] - HANDLE_GAP) maxR[1] = maxR[0] + HANDLE_GAP
    }
    else if (handle === 'minB') {
        minR[1] = Math.max(0, value)
        if (minR[1] < minR[0] + HANDLE_GAP) minR[0] = Math.max(0, minR[1] - HANDLE_GAP)
        if (minR[1] > maxR[0] - HANDLE_GAP) maxR[0] = minR[1] + HANDLE_GAP
        if (maxR[0] > maxR[1] - HANDLE_GAP) maxR[1] = maxR[0] + HANDLE_GAP
    }
    else if (handle === 'maxA') {
        maxR[0] = Math.max(0, value)
        if (maxR[0] < minR[1] + HANDLE_GAP) minR[1] = Math.max(0, maxR[0] - HANDLE_GAP)
        if (minR[1] < minR[0] + HANDLE_GAP) minR[0] = Math.max(0, minR[1] - HANDLE_GAP)
        if (maxR[0] > maxR[1] - HANDLE_GAP) maxR[1] = maxR[0] + HANDLE_GAP
    }
    else {
        maxR[1] = Math.max(0, value)
        if (maxR[1] < maxR[0] + HANDLE_GAP) maxR[0] = Math.max(0, maxR[1] - HANDLE_GAP)
        if (maxR[0] < minR[1] + HANDLE_GAP) minR[1] = Math.max(0, maxR[0] - HANDLE_GAP)
        if (minR[1] < minR[0] + HANDLE_GAP) minR[0] = Math.max(0, minR[1] - HANDLE_GAP)
    }

    if (minR[0] !== props.minRadiusRange[0] || minR[1] !== props.minRadiusRange[1]) {
        emit('update:minRadiusRange', minR)
    }
    if (maxR[0] !== props.maxRadiusRange[0] || maxR[1] !== props.maxRadiusRange[1]) {
        emit('update:maxRadiusRange', maxR)
    }
}
// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
const onDown = (e: PointerEvent) => {
    const handle = closestHandle(svgDist(e))
    if (!handle) return
    dragging.value = handle
    frozenPxPerUnit = pxPerUnit.value
    svgRef.value?.setPointerCapture(e.pointerId)
    e.preventDefault()
}
const onMove = (e: PointerEvent) => {
    const dist = svgDist(e)
    if (dragging.value) {
        e.preventDefault()
        applyDrag(dragging.value, dist)
    }
    else {
        hovered.value = closestHandle(dist)
    }
}
const onUp = () => {
    dragging.value = null
    hovered.value = null
    setRenderMax(displayMax.value)
}
// ---------------------------------------------------------------------------------------------------------------------
const cancelAnimationLoop = () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
    }
}
// ---------------------------------------------------------------------------------------------------------------------

watch(displayMax, (value) => {
    if (!dragging.value) setRenderMax(value)
}, { immediate: true })

// ---------------------------------------------------------------------------------------------------------------------
onUnmounted(() => cancelAnimationLoop())
// ---------------------------------------------------------------------------------------------------------------------
</script>

<style scoped>
.handle-pulse {
    animation: handle-pulse 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}
@keyframes handle-pulse {
    0%   { r: 4px; opacity: 0.6; }
    100% { r: 12px; opacity: 0; }
}
</style>
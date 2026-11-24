<template>
    <div flex flex-col select-none>
        <div
            ref="colorPanel" relative aspect-square w-full cursor-crosshair touch-none overflow-hidden rounded-lg
            :style="{ background: `linear-gradient(to bottom, rgba(0,0,0,0), #000), linear-gradient(to right, #fff, rgba(255,255,255,0)), ${pureHueColor}` }"
            @pointerdown="startPanelDrag" @pointermove="onPanelMove"
        >
            <div
                pointer-events-none absolute h-4 w-4 border-2 border-white rounded-full
                class="translate-x-[-50%] translate-y-[-50%] shadow-black/35 shadow-md ring-1 ring-black/40"
                :style="panelThumbStyle"
            />
        </div>

        <div mt-2 flex items-center gap-2.5 pr-1>
            <div h-7 w-7 flex-shrink-0 border border-gray-600 rounded-md :style="{ backgroundColor: hexColor }" />

            <div
                ref="hueSlider" relative h-3.5 w-full cursor-pointer touch-none rounded-full
                :style="{ background: 'linear-gradient(to right in hsl longer hue, hsl(0 100% 50%), hsl(360 100% 50%))' }"
                @pointerdown="startHueDrag" @pointermove="onHueMove"
            >
                <div
                    pointer-events-none absolute h-4 w-4 border-2 border-white rounded-full
                    class="top-1/2 translate-x-[-50%] translate-y-[-50%] shadow-black/30 shadow-md ring-1 ring-black/40"
                    :style="hueThumbStyle"
                />
            </div>
        </div>

        <div mt-1 flex items-center gap-2>
            <div flex flex-col justify-end gap-0.5>
                <button flex gap-2 rounded p-0.5 class="hover:ring-px hover:ring-slate-500/70" @click="inputMode = inputMode === 'rgb' ? 'hsl' : 'rgb'">
                    <span flex-1 class="text-center text-[10px] text-gray-400 leading-none">{{ inputMode === 'rgb' ? 'R' : 'H' }}</span>
                    <span flex-1 class="text-center text-[10px] text-gray-400 leading-none">{{ inputMode === 'rgb' ? 'G' : 'S' }}</span>
                    <span flex-1 class="text-center text-[10px] text-gray-400 leading-none">{{ inputMode === 'rgb' ? 'B' : 'L' }}</span>
                </button>
                <div flex gap-1>
                    <template v-if="inputMode === 'rgb'">
                        <input
                            type="text" inputmode="numeric" maxlength="3"
                            :value="rgbColor.r" class="w-full border border-gray-600 rounded bg-gray-800 px-1 py-0.5 text-center text-xs text-white font-mono" @change="onRgbInput('r', $event)"
                            @keydown.enter="onRgbInput('r', $event)"
                        >
                        <input
                            type="text" inputmode="numeric" maxlength="3"
                            :value="rgbColor.g" class="w-full border border-gray-600 rounded bg-gray-800 px-1 py-0.5 text-center text-xs text-white font-mono" @change="onRgbInput('g', $event)"
                            @keydown.enter="onRgbInput('g', $event)"
                        >
                        <input
                            type="text" inputmode="numeric" maxlength="3"
                            :value="rgbColor.b" class="w-full border border-gray-600 rounded bg-gray-800 px-1 py-0.5 text-center text-xs text-white font-mono" @change="onRgbInput('b', $event)"
                            @keydown.enter="onRgbInput('b', $event)"
                        >
                    </template>

                    <template v-else>
                        <input
                            type="text" inputmode="numeric" maxlength="3"
                            :value="hslColor.h" class="w-full border border-gray-600 rounded bg-gray-800 px-1 py-0.5 text-center text-xs text-white font-mono" @change="onHslInput('h', $event)"
                            @keydown.enter="onHslInput('h', $event)"
                        >
                        <input
                            type="text" inputmode="numeric" maxlength="3"
                            :value="hslColor.s" class="w-full border border-gray-600 rounded bg-gray-800 px-1 py-0.5 text-center text-xs text-white font-mono" @change="onHslInput('s', $event)"
                            @keydown.enter="onHslInput('s', $event)"
                        >
                        <input
                            type="text" inputmode="numeric" maxlength="3"
                            :value="hslColor.l" class="w-full border border-gray-600 rounded bg-gray-800 px-1 py-0.5 text-center text-xs text-white font-mono" @change="onHslInput('l', $event)"
                            @keydown.enter="onHslInput('l', $event)"
                        >
                    </template>
                </div>
            </div>
            <div min-w-18 flex flex-col justify-end gap-0.5>
                <p p-0.5 class="text-center text-[10px] text-gray-400 leading-none">
                    Hex
                </p>
                <input
                    v-model="hexInput" type="text" maxlength="7" class="w-full flex-1 border border-gray-600 rounded-md bg-gray-800 px-2 py-0.5 text-center text-xs text-white tracking-wider font-mono uppercase"
                    @keydown.enter="applyHexInput" @blur="applyHexInput"
                >
            </div>
        </div>

        <div grid grid-cols-10 mt-2 gap-1>
            <button
                v-for="color in defaultPalette" :key="color" aspect-square
                cursor-pointer border border-gray-600 rounded-md hover:border-gray-300 :style="{ backgroundColor: color }"
                @click="selectColor(color)"
            />

            <template v-if="savedColors.length">
                <hr col-span-10 border-gray-600>

                <button
                    v-for="(color, i) in savedColors" :key="`s${i}`"
                    group relative aspect-square cursor-pointer border border-gray-600 rounded-md hover:border-gray-300
                    :style="{ backgroundColor: color }"
                    @click="selectColor(color)"
                    @contextmenu.prevent="savedColors.splice(i, 1)"
                >
                    <div
                        absolute inset-0 flex items-center justify-center rounded-md
                        class="bg-black/50 text-[8px] text-white leading-none opacity-0 group-hover:opacity-100"
                    >
                        ✕
                    </div>
                </button>
            </template>

            <button
                title="Save current color" aspect-square
                flex cursor-pointer items-center justify-center border border-gray-500 rounded-md border-dashed leading-none hover:border-gray-300 @click="saveCurrentColor"
            >
                <span i-tabler-plus text-gray-400 class="text-[0.8rem] hover:text-gray-300" />
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { clamp, hexToRgb, hslToHsv, hsvToHsl, hsvToRgb, rgbToHex, rgbToHsv } from '~/helpers/utils/colorConversion'

// ---------------------------------------------------------------------------------------------------------------------
const props = defineProps<{
    value: string
    storageKey?: string
}>()
const emit = defineEmits<{
    change: [hex: string]
}>()
// ---------------------------------------------------------------------------------------------------------------------
const hue = ref(0) // 0 – 360
const saturation = ref(1) // 0 – 1
const brightness = ref(1) // 0 – 1
const hexInput = ref(props.value.toUpperCase())
const inputMode = ref<'rgb' | 'hsl'>('rgb')

const colorPanel = ref<HTMLElement>()
const hueSlider = ref<HTMLElement>()

// ---------------------------------------------------------------------------------------------------------------------
const defaultPalette = [
    '#EF4444',
    '#F97316',
    '#EAB308',
    '#22C55E',
    '#14B8A6',
    '#06B6D4',
    '#3B82F6',
    '#6366F1',
    '#A855F7',
    '#EC4899',
]
const savedColors = useLocalStorage<string[]>(`picker-palette:${props.storageKey ?? 'default'}`, [])
// ---------------------------------------------------------------------------------------------------------------------
setHsvFromHex(props.value)
// ---------------------------------------------------------------------------------------------------------------------
const hexColor = computed(() => rgbToHex(rgbColor.value.r, rgbColor.value.g, rgbColor.value.b))
const rgbColor = computed(() => {
    const [r, g, b] = hsvToRgb(hue.value, saturation.value, brightness.value)
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
})
const hslColor = computed(() => {
    const [h, s, l] = hsvToHsl(hue.value, saturation.value, brightness.value)
    return { h: Math.round(h), s: Math.round(s), l: Math.round(l) }
})

const pureHueColor = computed(() => `hsl(${hue.value}, 100%, 50%)`)
const panelThumbStyle = computed(() => ({
    left: `${saturation.value * 100}%`,
    top: `${(1 - brightness.value) * 100}%`,
    backgroundColor: hexColor.value,
}))
const hueThumbStyle = computed(() => ({
    left: `${(hue.value / 360) * 100}%`,
    backgroundColor: pureHueColor.value,
}))
// ---------------------------------------------------------------------------------------------------------------------
function onRgbInput(channel: 'r' | 'g' | 'b', event: Event) {
    const num = Number.parseInt((event.target as HTMLInputElement).value)
    if (Number.isNaN(num))
        return
    const r = channel === 'r' ? clamp(num, 0, 255) : rgbColor.value.r
    const g = channel === 'g' ? clamp(num, 0, 255) : rgbColor.value.g
    const b = channel === 'b' ? clamp(num, 0, 255) : rgbColor.value.b
    const hsv = rgbToHsv(r, g, b)
    if (hsv.s > 0 && hsv.v > 0)
        hue.value = hsv.h
    if (hsv.v > 0)
        saturation.value = hsv.s
    brightness.value = hsv.v
    emitColor()
}
function onHslInput(channel: 'h' | 's' | 'l', event: Event) {
    const num = Number.parseInt((event.target as HTMLInputElement).value)
    if (Number.isNaN(num))
        return
    const h = channel === 'h' ? clamp(num, 0, 360) : hslColor.value.h
    const s = channel === 's' ? clamp(num, 0, 100) : hslColor.value.s
    const l = channel === 'l' ? clamp(num, 0, 100) : hslColor.value.l
    const hsv = hslToHsv(h, s, l)
    if (channel === 'h')
        hue.value = h
    else if (hsv.s > 0 && hsv.v > 0)
        hue.value = hsv.h
    saturation.value = hsv.s
    brightness.value = hsv.v
    emitColor()
}
function applyHexInput() {
    let hex = hexInput.value.trim()
    if (!hex.startsWith('#'))
        hex = `#${hex}`
    const rgb = hexToRgb(hex)
    if (rgb) {
        setHsvFromHex(hex)
        emitColor()
    }
    else {
        hexInput.value = hexColor.value.toUpperCase()
    }
}
// ---------------------------------------------------------------------------------------------------------------------
function setHsvFromHex(hex: string) {
    const rgb = hexToRgb(hex)
    if (!rgb)
        return
    const hsv = rgbToHsv(...rgb)
    if (hsv.s > 0 && hsv.v > 0)
        hue.value = hsv.h
    if (hsv.v > 0)
        saturation.value = hsv.s
    brightness.value = hsv.v
}
function emitColor() {
    hexInput.value = hexColor.value
    emit('change', hexColor.value)
}
// ---------------------------------------------------------------------------------------------------------------------
function startPanelDrag(e: PointerEvent) {
    colorPanel.value!.setPointerCapture(e.pointerId)
    updatePanel(e)
}
function onPanelMove(e: PointerEvent) {
    if (!e.buttons)
        return
    updatePanel(e)
}
function startHueDrag(e: PointerEvent) {
    hueSlider.value!.setPointerCapture(e.pointerId)
    updateHue(e)
}
function onHueMove(e: PointerEvent) {
    if (!e.buttons)
        return
    updateHue(e)
}
// ---------------------------------------------------------------------------------------------------------------------
function updatePanel(e: PointerEvent) {
    const rect = colorPanel.value!.getBoundingClientRect()
    saturation.value = clamp((e.clientX - rect.left) / rect.width)
    brightness.value = 1 - clamp((e.clientY - rect.top) / rect.height)
    emitColor()
}
function updateHue(e: PointerEvent) {
    const rect = hueSlider.value!.getBoundingClientRect()
    hue.value = clamp((e.clientX - rect.left) / rect.width) * 360
    emitColor()
}
// ---------------------------------------------------------------------------------------------------------------------
function selectColor(hex: string) {
    setHsvFromHex(hex)
    emitColor()
}
function saveCurrentColor() {
    const hex = hexColor.value
    if (!savedColors.value.includes(hex))
        savedColors.value.push(hex)
}
// ---------------------------------------------------------------------------------------------------------------------
watch(() => props.value, (hex) => {
    if (hex.toUpperCase() === hexColor.value)
        return
    setHsvFromHex(hex)
    hexInput.value = hex.toUpperCase()
})
</script>

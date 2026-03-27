<template>
    <div flex flex-col select-none>
        <div ref="colorPanel" relative w-full rounded-lg overflow-hidden cursor-crosshair touch-none aspect-square
             :style="{ background: `linear-gradient(to bottom, rgba(0,0,0,0), #000), linear-gradient(to right, #fff, rgba(255,255,255,0)), ${pureHueColor}` }"
             @pointerdown="startPanelDrag" @pointermove="onPanelMove">
            <div absolute rounded-full border-2 border-white pointer-events-none w-4 h-4
                 class="translate-x-[-50%] translate-y-[-50%] ring-1 ring-black/40 shadow-md shadow-black/35"
                 :style="panelThumbStyle">
            </div>
        </div>

        <div flex items-center gap-2.5 pr-1 mt-2>
            <div rounded-md border border-gray-600 flex-shrink-0 w-7 h-7 :style="{ backgroundColor: hexColor }"></div>

            <div ref="hueSlider" relative w-full rounded-full cursor-pointer touch-none h-3.5
                 :style="{ background: 'linear-gradient(to right in hsl longer hue, hsl(0 100% 50%), hsl(360 100% 50%))' }"
                 @pointerdown="startHueDrag" @pointermove="onHueMove">
                <div absolute rounded-full border-2 border-white pointer-events-none w-4 h-4
                     class="top-1/2 translate-x-[-50%] translate-y-[-50%] ring-1 ring-black/40 shadow-md shadow-black/30"
                     :style="hueThumbStyle">
                </div>
            </div>
        </div>

        <div flex items-center gap-2 mt-1>
            <div flex flex-col justify-end gap-0.5>
                <button @click="inputMode = inputMode === 'rgb' ? 'hsl' : 'rgb'" flex gap-2 p-0.5 rounded class="hover:ring-px hover:ring-slate-500/70">
                    <span flex-1 class="text-center text-[10px] text-gray-400 leading-none">{{ inputMode === 'rgb' ? 'R' : 'H' }}</span>
                    <span flex-1 class="text-center text-[10px] text-gray-400 leading-none">{{ inputMode === 'rgb' ? 'G' : 'S' }}</span>
                    <span flex-1 class="text-center text-[10px] text-gray-400 leading-none">{{ inputMode === 'rgb' ? 'B' : 'L' }}</span>
                </button>
                <div flex gap-1>
                    <template v-if="inputMode === 'rgb'">
                        <input type="text" inputmode="numeric" maxlength="3"
                               :value="rgbColor.r" @change="onRgbInput('r', $event)" @keydown.enter="onRgbInput('r', $event)"
                               class="w-full bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-xs text-white text-center font-mono">
                        <input type="text" inputmode="numeric" maxlength="3"
                               :value="rgbColor.g" @change="onRgbInput('g', $event)" @keydown.enter="onRgbInput('g', $event)"
                               class="w-full bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-xs text-white text-center font-mono">
                        <input type="text" inputmode="numeric" maxlength="3"
                               :value="rgbColor.b" @change="onRgbInput('b', $event)" @keydown.enter="onRgbInput('b', $event)"
                               class="w-full bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-xs text-white text-center font-mono">
                    </template>

                    <template v-else>
                        <input type="text" inputmode="numeric" maxlength="3"
                               :value="hslColor.h" @change="onHslInput('h', $event)" @keydown.enter="onHslInput('h', $event)"
                               class="w-full bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-xs text-white text-center font-mono">
                        <input type="text" inputmode="numeric" maxlength="3"
                               :value="hslColor.s" @change="onHslInput('s', $event)" @keydown.enter="onHslInput('s', $event)"
                               class="w-full bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-xs text-white text-center font-mono">
                        <input type="text" inputmode="numeric" maxlength="3"
                               :value="hslColor.l" @change="onHslInput('l', $event)" @keydown.enter="onHslInput('l', $event)"
                               class="w-full bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-xs text-white text-center font-mono">
                    </template>
                </div>
            </div>
            <div flex flex-col justify-end gap-0.5 min-w-18>
                <p p-0.5 class="text-center text-[10px] text-gray-400 leading-none">Hex</p>
                <input type="text" v-model="hexInput" maxlength="7" class="flex-1 w-full bg-gray-800 border border-gray-600 rounded-md px-2 py-0.5 text-xs text-white text-center font-mono tracking-wider uppercase"
                       @keydown.enter="applyHexInput" @blur="applyHexInput">
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { clamp, hsvToRgb, rgbToHex, hexToRgb, rgbToHsv, hsvToHsl, hslToHsv } from '~/helpers/utils/colorConversion'

// ---------------------------------------------------------------------------------------------------------------------
const model = defineModel<string>({ default: '#FF0000' })
// ---------------------------------------------------------------------------------------------------------------------
const hue = ref(0)              // 0 – 360
const saturation = ref(1)       // 0 – 1
const value = ref(1)            // 0 – 1
const hexInput = ref(model.value.toUpperCase())
const inputMode = ref<'rgb' | 'hsl'>('rgb')

const colorPanel = ref<HTMLElement>()
const hueSlider = ref<HTMLElement>()

// ---------------------------------------------------------------------------------------------------------------------
setHsvFromHex(model.value)

// ---------------------------------------------------------------------------------------------------------------------
const hexColor = computed(() => rgbToHex(rgbColor.value.r, rgbColor.value.g, rgbColor.value.b))
const rgbColor = computed(() => {
    const [r, g, b] = hsvToRgb(hue.value, saturation.value, value.value)
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
})
const hslColor = computed(() => {
    const [h, s, l] = hsvToHsl(hue.value, saturation.value, value.value)
    return { h: Math.round(h), s: Math.round(s), l: Math.round(l) }
})

const pureHueColor = computed(() => `hsl(${hue.value}, 100%, 50%)`)
const panelThumbStyle = computed(() => ({
    left: `${saturation.value * 100}%`,
    top: `${(1 - value.value) * 100}%`,
    backgroundColor: hexColor.value,
}))
const hueThumbStyle = computed(() => ({
    left: `${(hue.value / 360) * 100}%`,
    backgroundColor: pureHueColor.value,
}))
// ---------------------------------------------------------------------------------------------------------------------
function onRgbInput(channel: 'r' | 'g' | 'b', event: Event) {
    const num = parseInt((event.target as HTMLInputElement).value)
    if (isNaN(num)) return
    const r = channel === 'r' ? clamp(num, 0, 255) : rgbColor.value.r
    const g = channel === 'g' ? clamp(num, 0, 255) : rgbColor.value.g
    const b = channel === 'b' ? clamp(num, 0, 255) : rgbColor.value.b
    const hsv = rgbToHsv(r, g, b)
    if (hsv.s > 0 && hsv.v > 0) hue.value = hsv.h
    if (hsv.v > 0) saturation.value = hsv.s
    value.value = hsv.v
    emitColor()
}
function onHslInput(channel: 'h' | 's' | 'l', event: Event) {
    const num = parseInt((event.target as HTMLInputElement).value)
    if (isNaN(num)) return
    const h = channel === 'h' ? clamp(num, 0, 360) : hslColor.value.h
    const s = channel === 's' ? clamp(num, 0, 100) : hslColor.value.s
    const l = channel === 'l' ? clamp(num, 0, 100) : hslColor.value.l
    const hsv = hslToHsv(h, s, l)
    if (channel === 'h') hue.value = h
    else if (hsv.s > 0 && hsv.v > 0) hue.value = hsv.h
    saturation.value = hsv.s
    value.value = hsv.v
    emitColor()
}
function applyHexInput() {
    let hex = hexInput.value.trim()
    if (!hex.startsWith('#')) hex = `#${hex}`
    const rgb = hexToRgb(hex)
    if (rgb) {
        setHsvFromHex(hex)
        emitColor()
    } else {
        hexInput.value = hexColor.value.toUpperCase()
    }
}
// ---------------------------------------------------------------------------------------------------------------------
function setHsvFromHex(hex: string) {
    const rgb = hexToRgb(hex)
    if (!rgb) return
    const hsv = rgbToHsv(...rgb)
    if (hsv.s > 0 && hsv.v > 0) hue.value = hsv.h
    if (hsv.v > 0) saturation.value = hsv.s
    value.value = hsv.v
}
function emitColor() {
    hexInput.value = hexColor.value
    model.value = hexColor.value
}
// ---------------------------------------------------------------------------------------------------------------------
function startPanelDrag(e: PointerEvent) {
    colorPanel.value!.setPointerCapture(e.pointerId)
    updatePanel(e)
}
function onPanelMove(e: PointerEvent) {
    if (!e.buttons) return
    updatePanel(e)
}
function startHueDrag(e: PointerEvent) {
    hueSlider.value!.setPointerCapture(e.pointerId)
    updateHue(e)
}
function onHueMove(e: PointerEvent) {
    if (!e.buttons) return
    updateHue(e)
}
// ---------------------------------------------------------------------------------------------------------------------
function updatePanel(e: PointerEvent) {
    const rect = colorPanel.value!.getBoundingClientRect()
    saturation.value = clamp((e.clientX - rect.left) / rect.width)
    value.value = 1 - clamp((e.clientY - rect.top) / rect.height)
    emitColor()
}
function updateHue(e: PointerEvent) {
    const rect = hueSlider.value!.getBoundingClientRect()
    hue.value = clamp((e.clientX - rect.left) / rect.width) * 360
    emitColor()
}
// ---------------------------------------------------------------------------------------------------------------------
watch(() => model.value, (hex) => {
    if (hex.toUpperCase() === hexColor.value) return
    setHsvFromHex(hex)
    hexInput.value = hex.toUpperCase()
})
</script>
export interface PaletteOption { id: number; name: string; category?: string }
export type Colors = Float32Array
type KeyColor = { t: number; r: number; g: number; b: number }

// ---------------------------------------------------------------------------------------------------------------------
// ==== HELPERS ========================================================================================================
// ---------------------------------------------------------------------------------------------------------------------
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const randRange = (a: number, b: number) => lerp(a, b, Math.random())
const randN = (mu = 0, sigma = 1) => { // Box–Muller
    let u = 0, v = 0
    while (u === 0) u = Math.random()
    while (v === 0) v = Math.random()
    return mu + sigma * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    const c = v * s
    const hp = h / 60
    const x = c * (1 - Math.abs((hp % 2) - 1))
    let [r, g, b] = [0, 0, 0]

    if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0]
    else if (hp < 2) [r, g, b] = [x, c, 0]
    else if (hp < 3) [r, g, b] = [0, c, x]
    else if (hp < 4) [r, g, b] = [0, x, c]
    else if (hp < 5) [r, g, b] = [x, 0, c]
    else [r, g, b] = [c, 0, x]

    const m = v - c
    return [r + m, g + m, b + m]
}
export function float32ArrayToHsl(colors: Float32Array): number[][] {
    const out: number[][] = []
    for (let i = 0; i < colors.length; i += 4) {
        const r = clamp(colors[i], 0, 1)
        const g = clamp(colors[i + 1], 0, 1)
        const b = clamp(colors[i + 2], 0, 1)

        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const d = max - min

        let h = 0
        let s = 0
        const l = (max + min) / 2 // Lightness

        if (d !== 0) {
            // Hue
            if (max === r) h = ((g - b) / d) % 6
            else if (max === g) h = ((b - r) / d) + 2
            else h = ((r - g) / d) + 4
            h = h * 60
            if (h < 0) h += 360

            // Saturation (HSL)
            s = d / (1 - Math.abs(2 * l - 1))
        } else {
            h = 0
            s = 0
        }

        // push [h (deg), s (%), l (%)]
        out.push([h, s * 100, l * 100])
    }
    return out
}
function gradientPalette(NUM_TYPES: number, keyColors: KeyColor[]): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)
    if (NUM_TYPES <= 0) return colors

    keyColors = keyColors.slice().sort((a, b) => a.t - b.t) // Ensure stops are sorted by t
    let k = 0
    for (let i = 0; i < NUM_TYPES; i++) {
        const u = NUM_TYPES <= 1 ? 0 : i / (NUM_TYPES - 1)

        while (k < keyColors.length - 2 && u > keyColors[k + 1].t) k++
        const a = keyColors[k]
        const b = keyColors[k + 1]

        const span = Math.max(1e-6, b.t - a.t)
        const v = (u - a.t) / span

        const r = clamp(lerp(a.r, b.r, v))
        const g = clamp(lerp(a.g, b.g, v))
        const bl = clamp(lerp(a.b, b.b, v))

        colors.set([r, g, bl, 1], i * 4)
    }
    return colors
}
function jitterPair([a, b]: [number, number], jStart: number, jEnd: number): [number, number] {
    let x = clamp(a + (Math.random() * 2 - 1) * jStart)
    let y = clamp(b + (Math.random() * 2 - 1) * jEnd)
    if (y < x) [x, y] = [y, x]
    return [x, y]
}
function fillSegment(
    out: Float32Array,
    start: number, count: number,
    hMin: number, hMax: number,
    sMin: number, sMax: number,
    vMin: number, vMax: number,
    opts?: { vCurveExp?: number }
): void {
    if (count <= 0) return
    const last = Math.max(1, count - 1)
    const useCurve = opts && typeof opts.vCurveExp === 'number'
    const exp = useCurve ? (opts!.vCurveExp as number) : 1

    for (let i = 0; i < count; i++) {
        const u = count === 1 ? 0.5 : i / last
        const h = hMin + (hMax - hMin) * u
        const s = clamp(sMin + (sMax - sMin) * u)
        const v = useCurve
            ? clamp(vMax - (vMax - vMin) * Math.pow(u, exp))  // abyss-style fade
            : clamp(vMin + (vMax - vMin) * u)                 // linear
        const [r, g, b] = hsvToRgb((h + 360) % 360, s, v)
        out.set([r, g, b, 1], (start + i) * 4)
    }
}

// ---------------------------------------------------------------------------------------------------------------------
// ==== GENERATORS =====================================================================================================
// ---------------------------------------------------------------------------------------------------------------------
export function randomGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)
    for (let i = 0; i < NUM_TYPES; ++i) {
        colors[i * 4] = Math.random()
        colors[i * 4 + 1] = Math.random()
        colors[i * 4 + 2] = Math.random()
        colors[i * 4 + 3] = 1 // padding alpha channel
    }
    return colors
}
export function rainbow(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)
    for (let i = 0; i < NUM_TYPES; ++i) {
        const hue = (i / NUM_TYPES) * 360
        const [r, g, b] = hsvToRgb(hue, 1.0, 1.0)
        colors.set([r, g, b, 1], i * 4)
    }
    return colors
}
export function pastel(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)
    for (let i = 0; i < NUM_TYPES; ++i) {
        const hue = (i / NUM_TYPES) * 360
        const [r, g, b] = hsvToRgb(hue, 0.5, 1.0)
        colors.set([r, g, b, 1], i * 4)
    }
    return colors
}
// ---------------------------------------------------------------------------------------------------------------------
export function coldBlue(NUM_TYPES: number): Colors {
    return gradientPalette(NUM_TYPES, [
        { t: 0.00, r: 0.05, g: 0.10, b: 0.35 }, // deep navy blue
        { t: 0.25, r: 0.10, g: 0.25, b: 0.70 }, // cold blue
        { t: 0.50, r: 0.20, g: 0.55, b: 0.95 }, // bright azure
        { t: 0.75, r: 0.55, g: 0.80, b: 1.00 }, // sky blue
        { t: 1.00, r: 0.85, g: 0.95, b: 1.00 }, // icy white-blue
    ])
}
export function sciFiSpectrum(NUM_TYPES: number): Colors {
    return gradientPalette(NUM_TYPES, [
        { t: 0.00, r: 0.00, g: 0.00, b: 0.30 }, // deep blue
        { t: 0.25, r: 0.00, g: 0.20, b: 1.00 }, // cyan-ish
        { t: 0.50, r: 0.00, g: 1.00, b: 0.40 }, // green
        { t: 0.75, r: 1.00, g: 1.00, b: 0.40 }, // yellow
        { t: 1.00, r: 1.00, g: 0.40, b: 1.00 }, // pink-magenta
    ])
}
export function thermalGlow(NUM_TYPES: number): Colors {
    return gradientPalette(NUM_TYPES, [
        { t: 0.00, r: 0.00, g: 0.00, b: 0.25 }, // deep navy blue
        { t: 0.20, r: 0.00, g: 0.25, b: 0.80 }, // intense blue
        { t: 0.40, r: 0.00, g: 0.85, b: 0.40 }, // teal-green
        { t: 0.60, r: 0.95, g: 0.85, b: 0.00 }, // warm yellow
        { t: 0.80, r: 1.00, g: 0.40, b: 0.00 }, // vivid orange
        { t: 1.00, r: 0.90, g: 0.00, b: 0.65 }, // hot magenta
    ])
}
export function heatmapClassic(NUM_TYPES: number): Colors {
    return gradientPalette(NUM_TYPES, [
        { t: 0.00, r: 0.00, g: 0.00, b: 0.25 }, // deep blue
        { t: 0.25, r: 0.00, g: 0.80, b: 1.00 }, // cyan
        { t: 0.50, r: 1.00, g: 1.00, b: 1.00 }, // white (center intensity)
        { t: 0.75, r: 1.00, g: 1.00, b: 0.00 }, // yellow
        { t: 1.00, r: 0.80, g: 0.00, b: 0.00 }, // red
    ])
}
export function heatmapCool(NUM_TYPES: number): Colors {
    return gradientPalette(NUM_TYPES, [
        { t: 0.00, r: 0.05, g: 0.10, b: 0.35 }, // deep navy blue
        { t: 0.25, r: 0.10, g: 0.25, b: 0.85 }, // blue
        { t: 0.50, r: 0.00, g: 0.80, b: 0.80 }, // cyan
        { t: 0.75, r: 1.00, g: 0.90, b: 0.10 }, // yellow
        { t: 1.00, r: 1.00, g: 1.00, b: 1.00 }, // white
    ])
}
export function heatmapWarm(NUM_TYPES: number): Colors {
    return gradientPalette(NUM_TYPES, [
        { t: 0.00, r: 0.45, g: 0.00, b: 0.00 }, // bright red
        { t: 0.25, r: 0.90, g: 0.20, b: 0.00 }, // deep orange
        { t: 0.55, r: 1.00, g: 0.65, b: 0.00 }, // golden
        { t: 0.80, r: 1.00, g: 0.90, b: 0.40 }, // pale yellow
        { t: 1.00, r: 1.00, g: 1.00, b: 1.00 }, // white
    ])
}
export function grayscale(NUM_TYPES: number): Colors {
    return gradientPalette(NUM_TYPES, [
        { t: 0.00, r: 0.05, g: 0.05, b: 0.05 }, // dark gray
        { t: 0.75, r: 0.65, g: 0.65, b: 0.65 }, // light gray
        { t: 1.00, r: 1.00, g: 1.00, b: 1.00 }, // white
    ])
}
export function desertWarm(NUM_TYPES: number): Colors {
    return gradientPalette(NUM_TYPES, [
        { t: 0.00, r: 0.9647, g: 0.8863, b: 0.7020 }, // light sand
        { t: 0.25, r: 0.9098, g: 0.7529, b: 0.4471 }, // golden sand
        { t: 0.50, r: 0.8471, g: 0.5373, b: 0.2275 }, // warm ochre
        { t: 0.75, r: 0.7216, g: 0.3608, b: 0.1843 }, // terracotta
        { t: 1.00, r: 0.3686, g: 0.2275, b: 0.1804 }, // deep umber
    ])
}
// ---------------------------------------------------------------------------------------------------------------------
export function neonWarm(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)

    const startH = 20   // warm orange
    const endH = 300    // vibrant magenta
    const s0 = 1.0
    const s1 = 0.7
    const v0 = 1.0
    const v1 = 0.8

    for (let i = 0; i < NUM_TYPES; i++) {
        const t = NUM_TYPES <= 1 ? 0 : i / (NUM_TYPES - 1)
        const h = lerp(startH, endH, t) % 360
        const s = lerp(s0, s1, t)
        const v = lerp(v0, v1, t)
        const [r, g, b] = hsvToRgb(h, s, v)
        colors.set([r, g, b, 1], i * 4)
    }
    return colors
}
export function fire(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)

    const startH = 5     // deep red
    const endH = 45      // golden yellow-orange
    const s0 = 1.0
    const s1 = 0.9
    const v0 = 0.9
    const v1 = 1.0

    for (let i = 0; i < NUM_TYPES; i++) {
        const t = NUM_TYPES <= 1 ? 0 : i / (NUM_TYPES - 1)
        const h = lerp(startH, endH, t)
        const s = lerp(s0, s1, t)
        const v = lerp(v0, v1, t)
        const [r, g, b] = hsvToRgb(h, s, v)
        colors.set([r, g, b, 1], i * 4)
    }
    return colors
}
export function violetFade(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)

    const startH = 345  // bright pinkish red
    const endH = 260    // deep violet-blue
    const s0 = 0.9
    const s1 = 0.55
    const v0 = 0.95
    const v1 = 0.35

    for (let i = 0; i < NUM_TYPES; i++) {
        const t = NUM_TYPES <= 1 ? 0 : i / (NUM_TYPES - 1)
        const h = lerp(startH, endH, t)
        const s = lerp(s0, s1, t)
        const v = lerp(v0, v1, t)
        const [r, g, b] = hsvToRgb(h, s, v)
        colors.set([r, g, b, 1], i * 4)
    }
    return colors
}
export function crimsonFlame(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)

    const startH = 2     // bright red
    const endH = -30     // deep magenta
    const s0 = 1.0       // strong saturation
    const s1 = 0.7       // slightly softer at the end
    const v0 = 0.95      // bright start
    const v1 = 0.45      // darker finish

    for (let i = 0; i < NUM_TYPES; i++) {
        const t = NUM_TYPES <= 1 ? 0 : i / (NUM_TYPES - 1)
        // Move backward on hue circle to avoid green
        const h = (startH - (startH - endH) * t + 360) % 360
        const s = lerp(s0, s1, t)
        const v = lerp(v0, v1, t)
        const [r, g, b] = hsvToRgb(h, s, v)
        colors.set([r, g, b, 1], i * 4)
    }
    return colors
}
// ---------------------------------------------------------------------------------------------------------------------
export function dualGradientGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)
    if (NUM_TYPES <= 0) return colors

    const MIN_HUE_DIFF = 70;   // minimal hue separation in degrees
    const MIN_S_DIFF   = 0.15; // minimal saturation difference
    const MIN_V_DIFF   = 0.12; // minimal value/brightness difference

    const startH = Math.random() * 360
    let endH     = Math.random() * 360
    let startS = 0.70 + Math.random() * 0.30  // 0.70–1.00
    let endS   = 0.70 + Math.random() * 0.30
    let startV = 0.80 + Math.random() * 0.20  // 0.80–1.00
    let endV   = 0.70 + Math.random() * 0.30

    const hueDelta = ((endH - startH + 540) % 360) - 180 // [-180,180)
    if (Math.abs(hueDelta) < MIN_HUE_DIFF) {
        const sign = hueDelta >= 0 ? 1 : -1
        endH = (startH + sign * MIN_HUE_DIFF + 360) % 360
    }
    if (Math.abs(endS - startS) < MIN_S_DIFF) {
        endS = clamp(endS + (endS >= startS ? MIN_S_DIFF : -MIN_S_DIFF), 0, 1)
    }
    if (Math.abs(endV - startV) < MIN_V_DIFF) {
        endV = clamp(endV + (endV >= startV ? MIN_V_DIFF : -MIN_V_DIFF), 0, 1)
    }

    let dH = ((endH - startH + 540) % 360) - 180
    for (let i = 0; i < NUM_TYPES; i++) {
        const t = NUM_TYPES <= 1 ? 0 : i / (NUM_TYPES - 1)
        const h = (startH + dH * t + 360) % 360
        const s = startS + (endS - startS) * t
        const v = startV + (endV - startV) * t
        const [r, g, b] = hsvToRgb(h, s, v)
        colors.set([r, g, b, 1], i * 4)
    }
    return colors
}

export function cyberNeonGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const baseH = randRange(280, 340)
    for (let i=0;i<NUM_TYPES;i++){
        const h = (baseH + i* (360/NUM_TYPES) * randRange(0.6,1.1) + randN(0, 6)) % 360
        const s = clamp(0.9 + randN(0, 0.05))
        const v = clamp(0.9 + randN(0, 0.07))
        const [r,g,b] = hsvToRgb(h,s,v)
        colors.set([r,g,b,1], i*4)
    }
    return colors
}

export function organicFlowGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const baseH = randRange(0, 15)
    for (let i=0;i<NUM_TYPES;i++){
        const h = (baseH + randN(0, 8) + (i%4===0 ? randRange(15,30):0)) % 360
        const s = clamp(0.7 + randN(0, 0.1))
        const v = clamp(0.45 + Math.abs(randN(0, 0.2)))
        const [r,g,b] = hsvToRgb(h,s,v)
        colors.set([r,g,b,1], i*4)
    }
    return colors
}

export function auroraGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const center = randRange(120, 220)
    for (let i=0;i<NUM_TYPES;i++){
        const spread = randRange(20, 60)
        const h = (center + randN(0, spread)) % 360
        const s = clamp(0.6 + randN(0, 0.15))
        const v = clamp(0.75 + randN(0, 0.12))
        const [r,g,b] = hsvToRgb(h,s,v)
        colors.set([r,g,b,1], i*4)
    }
    return colors
}

export function goldenAngleJitterGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const phi = 137.50776405003785
    const baseH = randRange(0, 360)
    const sBase = randRange(0.6, 0.95)
    const vBase = randRange(0.8, 1.0)
    const jitterH = randRange(2, 10)
    for (let i=0;i<NUM_TYPES;i++){
        const h = (baseH + i*phi + randN(0, jitterH)) % 360
        const s = clamp(sBase + randN(0, 0.07))
        const v = clamp(vBase + randN(0, 0.05))
        const [r,g,b] = hsvToRgb(h,s,v)
        colors.set([r,g,b,1], i*4)
    }
    return colors
}

export function paperInkGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const inks = [210, 30, 220]
    for (let i=0;i<NUM_TYPES;i++){
        const paper = i % 4 === 0
        if (paper){
            const v = clamp(0.92 + randN(0, .03))
            const tint = randRange(-6, 6)
            const [r,g,b] = hsvToRgb((45+tint+360)%360, 0.18 + randN(0,.05), v)
            colors.set([r,g,b,1], i*4)
        } else {
            const hue = inks[Math.floor(Math.random() * inks.length)]
            const [r,g,b] = hsvToRgb((hue+randN(0,6)+360)%360, 0.6 + randN(0,.1), 0.35 + randN(0,.08))
            colors.set([r,g,b,1], i*4)
        }
    }
    return colors
}

export function candyGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const phi = 137.50776405003785
    const baseH = randRange(0,360)
    for (let i=0;i<NUM_TYPES;i++){
        const h = (baseH + i*phi + randN(0,8)) % 360
        const s = clamp(0.8 + randN(0,.08))
        const v = clamp(0.9 + randN(0,.06))
        const [r,g,b] = hsvToRgb(h,s,v)
        colors.set([r,g,b,1], i*4)
    }
    return colors
}

export function vaporwavePastelGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const anchors = [320, 260, 170]
    for (let i=0;i<NUM_TYPES;i++){
        const h0 = anchors[i % anchors.length]
        const h = (h0 + randN(0, 10)) % 360
        const s = clamp(0.35 + randN(0,.08))
        const v = clamp(0.95 + randN(0,.04))
        const [r,g,b] = hsvToRgb(h,s,v)
        colors.set([r,g,b,1], i*4)
    }
    return colors
}

export function gameboyDMGGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)
    const steps = [0.2, 0.35, 0.55, 0.78]
    const hue = randRange(90, 110)

    for (let i = 0; i < NUM_TYPES; i++) {
        const v = steps[i % steps.length] + randN(0, 0.03)
        const s = clamp(0.25 + randN(0, 0.05))
        const [r, g, b] = hsvToRgb(hue, s, clamp(v))
        colors.set([r * 0.9, g, b * 0.9, 1], i * 4)
    }
    return colors
}
export function cyberDarkGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)
    if (NUM_TYPES <= 0) return colors

    const accentH = randRange(10, 350)
    const accentPeriod = Math.max(3, Math.round(NUM_TYPES / 3))

    for (let i = 0; i < NUM_TYPES; i++) {
        const isAccent = (i % accentPeriod) === 0

        if (isAccent) {
            const h = (accentH + randN(0, 8) + 360) % 360
            const [r, g, b] = hsvToRgb(h, 0.9, 0.95)
            colors.set([r, g, b, 1], i * 4)
        } else {
            let v = clamp(0.25 + Math.random() * 0.55)
            v = Math.pow(v, 1.1)
            colors.set([v, v, v, 1], i * 4)
        }
    }
    return colors
}

export function anodizedMetalGenerator(NUM_TYPES:number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const hue0 = randRange(180, 320)
    for (let i=0;i<NUM_TYPES;i++){
        const t = i/Math.max(1,NUM_TYPES-1)
        const h = (hue0 + 40*Math.sin(2*Math.PI*t) + randN(0,3)) % 360
        const s = clamp(0.6 + 0.25*Math.sin(4*Math.PI*t + 1.2) + randN(0,.03))
        const v = clamp(0.65 + 0.3*Math.cos(4*Math.PI*t) + randN(0,.03))
        const [r,g,b] = hsvToRgb(h,s,v)
        colors.set([r*0.96, g*0.96, b*0.96, 1], i*4)
    }
    return colors
}

export function holoFoilGenerator(NUM_TYPES:number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const k1 = randRange(0.8, 1.4), k2 = randRange(2.2, 3.6)
    for (let i=0;i<NUM_TYPES;i++){
        const t = i/Math.max(1,NUM_TYPES-1)
        const h = (360*(t + 0.05*Math.sin(2*Math.PI*k1*t) + 0.03*Math.sin(2*Math.PI*k2*t)) + randN(0,4)) % 360
        const s = clamp(0.5 + 0.4*Math.sin(2*Math.PI*(k1+k2)*t) + randN(0,.05))
        const v = clamp(0.85 + 0.1*Math.cos(2*Math.PI*k2*t) + randN(0,.03))
        const [r,g,b] = hsvToRgb(h,s,v)
        colors.set([r,g,b,1], i*4)
    }
    return colors
}
export function holoFoilGenerator1(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)
    if (NUM_TYPES <= 0) return colors

    const IRIDESCENCE = 0.06        // hue ripple amplitude (0..~0.1)
    const WAVES = 2.5               // hue ripple frequency
    const S_MIN = 0.70, S_MAX = 0.95
    const V_MIN = 0.92, V_MAX = 1.00

    const phaseH = Math.random() * 2 * Math.PI
    const phaseS = Math.random() * 2 * Math.PI
    const phaseV = Math.random() * 2 * Math.PI

    for (let i = 0; i < NUM_TYPES; i++) {
        const t = NUM_TYPES <= 1 ? 0 : i / (NUM_TYPES - 1)

        const baseHue = 360 * t
        const hue = (baseHue + 360 * IRIDESCENCE * Math.sin((WAVES * 2 * Math.PI) * t + phaseH)) % 360

        const s = clamp(S_MIN + (S_MAX - S_MIN) * (0.5 + 0.5 * Math.sin(2 * Math.PI * t + phaseS)))
        const v = clamp(V_MIN + (V_MAX - V_MIN) * (0.5 + 0.5 * Math.cos(2 * Math.PI * t + phaseV)))

        const [r, g, b] = hsvToRgb((hue + 360) % 360, s, v)
        colors.set([r, g, b, 1], i * 4)
    }
    return colors
}


export function inkBleedWatercolorGenerator(NUM_TYPES:number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const center = randRange(190, 260)
    for (let i=0;i<NUM_TYPES;i++){
        const h = (center + randN(0, 18)) % 360
        const s = clamp(0.2 + Math.abs(randN(0, .12)))
        const v = clamp(0.7 + 0.25*Math.sin(i*0.9 + randRange(0,Math.PI)) + randN(0,.06))
        const [r,g,b] = hsvToRgb(h,s,v)
        colors.set([r,g,b,1], i*4)
    }
    return colors
}

export function cmykMisregisterGenerator(NUM_TYPES:number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const inks = [200, 300, 55, 220]
    for (let i=0;i<NUM_TYPES;i++){
        const h = (inks[i % inks.length] + randN(0, 5)) % 360
        const s = clamp((i%4===3 ? 0.1 : 0.9) + randN(0,.05))
        const v = clamp((i%4===3 ? 0.35 : 0.95) + randN(0,.05))
        const [r,g,b] = hsvToRgb(h,s,v)
        colors.set([r,g,b,1], i*4)
    }
    return colors
}
export function earthFlowGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)
    if (NUM_TYPES <= 0) return colors

    const hA = randRange(10, 30)                 // earth
    const hB = (hA + randRange(140, 220)) % 360  // water/sky
    const phase = Math.random() * Math.PI              // phase offset for sinusoïdal variation

    const TAU = 6.283185307179586
    for (let i = 0; i < NUM_TYPES; i++) {
        const u = NUM_TYPES <= 1 ? 0 : i / (NUM_TYPES - 1)
        const a = TAU * u + phase
        const mix = 0.5 + 0.5 * Math.sin(a)
        const hue = (hA * (1 - mix) + hB * mix + randN(0, 3) + 360) % 360
        const s = clamp(0.75 + randN(0, 0.07))
        const v = clamp(0.60 + 0.35 * Math.sin(a + 1.1) + randN(0, 0.06))
        const [r, g, b] = hsvToRgb(hue, s, v)
        colors.set([r, g, b, 1], i * 4)
    }
    return colors
}
export function fluoroSportGenerator(NUM_TYPES:number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const accents = [95, 175, 310]
    for (let i=0;i<NUM_TYPES;i++){
        const isAccent = (i % 4 === 0)
        const h = isAccent ? accents[Math.floor(Math.random()*accents.length)] + randN(0,6)
            : randRange(210, 260) + randN(0,8)
        const s = isAccent ? clamp(0.95 + randN(0,.03)) : clamp(0.25 + randN(0,.08))
        const v = isAccent ? clamp(0.98 + randN(0,.02)) : clamp(0.18 + randN(0,.06))
        const [r,g,b] = hsvToRgb((h+360)%360, s, v)
        colors.set([r,g,b,1], i*4)
    }
    return colors
}
export function midnightCircuitGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)
    if (NUM_TYPES <= 0) return colors

    const AMBER_MAX    = 2
    const AMBER_CHANCE = 0.80
    const JIT_S = 0.08
    const JIT_V = 0.08

    const H_AMB: [number, number] = [25, 40]
    const H_VIO: [number, number] = [270, 285]
    const H_TEA: [number, number] = [175, 200]
    const SVA_S: [number, number] = [0.90, 1.00]
    const SVA_V: [number, number] = [0.90, 1.00]
    const SVV_S: [number, number] = [0.65, 0.92]
    const SVV_V: [number, number] = [0.28, 0.52]
    const SVT_S: [number, number] = [0.65, 0.85]
    const SVT_V: [number, number] = [0.20, 0.50]

    const ambS = jitterPair(SVA_S, JIT_S, JIT_S)
    const ambV = jitterPair(SVA_V, JIT_V, JIT_V)
    const vioS = jitterPair(SVV_S, JIT_S, JIT_S)
    const vioV = jitterPair(SVV_V, JIT_V, JIT_V)
    const teaS = jitterPair(SVT_S, JIT_S, JIT_S)
    const teaV = jitterPair(SVT_V, JIT_V, JIT_V)

    let a = 0, v = 0, t = 0
    if (Math.random() < AMBER_CHANCE) {
        const maxAmberAllowed = Math.min(AMBER_MAX, Math.max(0, NUM_TYPES - 1))
        a = maxAmberAllowed > 0 ? (1 + Math.floor(Math.random() * maxAmberAllowed)) : 0
    } else {
        a = 0
    }

    let rest = NUM_TYPES - a
    v = Math.min(1, rest)
    rest -= v
    const tealExtra = rest > 0 ? Math.floor(Math.random() * (rest + 1)) : 0
    t = tealExtra
    v += (rest - tealExtra)

    let idx = 0
    fillSegment(colors, idx, a, H_AMB[0], H_AMB[1], ambS[0], ambS[1], ambV[0], ambV[1]); idx += a
    fillSegment(colors, idx, v, H_VIO[0], H_VIO[1], vioS[0], vioS[1], vioV[0], vioV[1]); idx += v
    fillSegment(colors, idx, t, H_TEA[0], H_TEA[1], teaS[0], teaS[1], teaV[0], teaV[1])

    return colors
}
export function biolumAbyssGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)
    if (NUM_TYPES <= 0) return colors

    const ACCENT_MAX = 2
    const JIT_S = 0.05
    const JIT_V = 0.06

    const H_ACC:  [number, number] = [185, 200]
    const H_DEEP: [number, number] = [200, 225]
    const S_ACC:  [number, number] = [0.9, 1.0]
    const V_ACC:  [number, number] = [0.85, 1.0]
    const S_DEEP: [number, number] = [0.8, 0.95]
    const V_DEEP: [number, number] = [0.12, 0.20]

    const accS  = jitterPair(S_ACC,  JIT_S, JIT_S)
    const accV  = jitterPair(V_ACC,  JIT_V, JIT_V)
    const deepS = jitterPair(S_DEEP, JIT_S, JIT_S)
    const deepV = jitterPair(V_DEEP, JIT_V, JIT_V)

    const accentCount = Math.min(ACCENT_MAX, Math.max(1, Math.floor(Math.random() * (ACCENT_MAX + 1))))
    const deepCount   = Math.max(0, NUM_TYPES - accentCount)

    let idx = 0
    fillSegment(colors, idx, accentCount, H_ACC[0], H_ACC[1], accS[0],  accS[1],  accV[0],  accV[1]); idx += accentCount
    fillSegment(colors, idx, deepCount,   H_DEEP[0], H_DEEP[1], deepS[0], deepS[1], deepV[0], deepV[1], { vCurveExp: 1.8 })

    return colors
}
export function blueprintGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)
    if (NUM_TYPES <= 0) return colors

    const ACCENT_MAX = 2       // number of bright white accents
    const JIT_S = 0.05         // saturation jitter
    const JIT_V = 0.05         // brightness jitter

    const H_BLUE: [number, number] = [215, 235]   // blueprint hue span
    const S_BLUE: [number, number] = [0.60, 0.75] // blueprint saturation range
    const V_BLUE: [number, number] = [0.30, 0.50] // blueprint value range
    const V_ACCENT: [number, number] = [0.90, 0.98] // white accent brightness

    const sBlue = jitterPair(S_BLUE, JIT_S, JIT_S)
    const vBlue = jitterPair(V_BLUE, JIT_V, JIT_V)
    const vAccent = jitterPair(V_ACCENT, 0.01, 0.01)

    const accentCount = Math.min(ACCENT_MAX, Math.max(1, Math.floor(Math.random() * (ACCENT_MAX + 1))))
    const blueCount = Math.max(0, NUM_TYPES - accentCount)

    let idx = 0
    fillSegment(colors, idx, accentCount, 0, 0, 0, 0, vAccent[0], vAccent[1]); idx += accentCount
    fillSegment(colors, idx, blueCount, H_BLUE[0], H_BLUE[1], sBlue[0], sBlue[1], vBlue[0], vBlue[1])
    return colors
}

export function gemstonesGenerator(NUM_TYPES:number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const hues = [140, 350, 220, 45, 200, 300]
    for (let i=0;i<NUM_TYPES;i++){
        const h = (hues[i % hues.length] + randN(0,5)) % 360
        const s = clamp(0.75 + randN(0,.08))
        const v = clamp(0.7 + randN(0,.1))
        const [r,g,b] = hsvToRgb(h,s,v)
        colors.set([r,g,b,1], i*4)
    }
    return colors
}

export function solarizedDriftGenerator(NUM_TYPES:number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const anchors = [
        {h: 44, s:0.55, v:0.92}, // base2
        {h: 44, s:0.25, v:0.60}, // base01
        {h: 192,s:0.55, v:0.85}, // cyan
        {h: 220,s:0.55, v:0.80}, // blue
        {h:  64,s:0.55, v:0.85}, // green
        {h:  18,s:0.65, v:0.90}, // orange
        {h: 350,s:0.55, v:0.85}, // red
        {h: 300,s:0.40, v:0.85}, // magenta
    ]
    for (let i=0;i<NUM_TYPES;i++){
        const a = anchors[i % anchors.length]
        const h = (a.h + randN(0,5) + 360) % 360
        const s = clamp(a.s + randN(0,.06))
        const v = clamp(a.v + randN(0,.05))
        const [r,g,b] = hsvToRgb(h,s,v)
        colors.set([r,g,b,1], i*4)
    }
    return colors
}
// ---------------------------------------------------------------------------------------------------------------------
// === Registry & API ==================================================================================================
// ---------------------------------------------------------------------------------------------------------------------
const PALETTES: { id: number; name: string; category?: string; generator: (n: number) => Colors }[] = [
    { id: 0, name: 'Random', category: 'Default', generator: randomGenerator },                       // +++ GENERATIVE   DONE
    { id: 1, name: 'Rainbow', category: 'Static', generator: rainbow },                              // +++ STATIC   DONE
    { id: 2, name: 'Neon Warm', category: 'Static', generator: neonWarm },                           // +++ STATIC   DONE
    { id: 3, name: 'Heatmap Classic', category: 'Static', generator: heatmapClassic },               // +++ STATIC   DONE
    { id: 4, name: 'Heatmap Cool', category: 'Static', generator: heatmapCool },                     // ++  STATIC   DONE
    { id: 5, name: 'Heatmap Warm', category: 'Static', generator: heatmapWarm },                     // ++  STATIC   DONE
    { id: 6, name: 'Pastel', category: 'Static', generator: pastel },                                // +++ STATIC   DONE
    { id: 7, name: 'Cold Blue', category: 'Static', generator: coldBlue },                           // +   STATIC   DONE
    { id: 8, name: 'Sci-Fi Spectrum', category: 'Static', generator: sciFiSpectrum },                // ++  STATIC   DONE
    { id: 9, name: 'Thermal Glow', category: 'Static', generator: thermalGlow },                     // +   STATIC   DONE
    { id: 10, name: 'Crimson Flame', category: 'Static', generator: crimsonFlame },                  // +++ STATIC   DONE
    { id: 11, name: 'Fire', category: 'Static', generator: fire },                                   // +++ STATIC   DONE
    { id: 12, name: 'Violet Fade', category: 'Static', generator: violetFade },                      // +++ STATIC   DONE
    { id: 13, name: 'Grayscale', category: 'Static', generator: grayscale },                         // +++ STATIC   DONE
    { id: 14, name: 'Desert Warm', category: 'Static', generator: desertWarm },                      // +   STATIC   DONE

    { id: 15, name: 'Dual Gradient', category: 'Generative', generator: dualGradientGenerator },         // +++ GENERATIVE   NEED OPTIMIZATION
    { id: 16, name: 'Candy', category: 'Generative', generator: candyGenerator },                        // +++ GENERATIVE   NEED OPTIMIZATION
    { id: 17, name: 'Organic Flow', category: 'Generative', generator: organicFlowGenerator },           // +   GENERATIVE   NEED OPTIMIZATION
    { id: 18, name: 'Earth Flow', category: 'Generative', generator: earthFlowGenerator },               // ++  GENERATIVE   DONE
    { id: 19, name: 'Game Boy DMG', category: 'Generative', generator: gameboyDMGGenerator },            // ++  GENERATIVE   DONE
    { id: 20, name: 'Paper & Ink', category: 'Generative', generator: paperInkGenerator },               // +++ GENERATIVE   NEED OPTIMIZATION
    { id: 21, name: 'Fluoro Sport', category: 'Generative', generator: fluoroSportGenerator },           // ++  GENERATIVE   NEED OPTIMIZATION
    { id: 22, name: 'Midnight Circuit', category: 'Generative', generator: midnightCircuitGenerator },   // ++  GENERATIVE   DONE
    { id: 23, name: 'BioLuminescent Abyss', category: 'Generative', generator: biolumAbyssGenerator },   // +   GENERATIVE   DONE
    { id: 24, name: 'Blueprint', category: 'Generative', generator: blueprintGenerator },                // +   GENERATIVE   DONE
    { id: 25, name: 'Cyber Dark', category: 'Generative', generator: cyberDarkGenerator },               // +   GENERATIVE   DONE

    { id: 26, name: 'Holographic Foil', category: 'Experimental', generator: holoFoilGenerator },          // +   GENERATIVE
    { id: 36, name: 'Holographic Foil 2', category: 'Experimental', generator: holoFoilGenerator1 },       // +   GENERATIVE
    { id: 27, name: 'Mineral Gemstones', category: 'Experimental', generator: gemstonesGenerator },        // ++  GENERATIVE
    { id: 28, name: 'Vaporwave Pastel', category: 'Experimental', generator: vaporwavePastelGenerator },   // +   GENERATIVE pastel neon rose/violet/cyan
    { id: 29, name: 'Solarized Drift', category: 'Experimental', generator: solarizedDriftGenerator },     // ++  GENERATIVE Encore une sorte de random pastel
    { id: 30, name: 'Aurora', category: 'Experimental', generator: auroraGenerator },                      // ++  GENERATIVE toDo: description
    { id: 31, name: 'Cyber Neon', category: 'Experimental', generator: cyberNeonGenerator },               // ++  GENERATIVE
    { id: 32, name: 'Golden Angle Jitter', category: 'Experimental', generator: goldenAngleJitterGenerator }, // ++  GENERATIVE toDo: description
    { id: 33, name: 'CMYK Misregister', category: 'Experimental', generator: cmykMisregisterGenerator },   // +  Bleu, Magenta, Jaune, Noir avec legeres variations
    { id: 34, name: 'Anodized Metal', category: 'Experimental', generator: anodizedMetalGenerator },       // ~~ Des bleu et rose/violet metallique
    { id: 35, name: 'Ink Bleed Watercolor', category: 'Experimental', generator: inkBleedWatercolorGenerator }, // ~~
]

export const PALETTE_OPTIONS: PaletteOption[] = PALETTES.map(({ id, name, category }) => ({ id, name, category }))

export function generateColors(optionID: number, NUM_TYPES: number): Colors {
    if (NUM_TYPES <= 0) return new Float32Array(0)
    const palette = PALETTES.find(p => p.id === optionID)
    const generator = palette?.generator ?? randomGenerator
    return generator(NUM_TYPES)
}
export function generateHSLColors(optionID: number, NUM_TYPES: number): number[][] {
    if (NUM_TYPES <= 0) return []
    const palette = PALETTES.find(p => p.id === optionID)
    const generator = palette?.generator ?? randomGenerator
    const newPalette = generator(NUM_TYPES)
    return float32ArrayToHsl(newPalette)
}
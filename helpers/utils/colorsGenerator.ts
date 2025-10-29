export interface PaletteOption { id: number; name: string }
export type Colors = Float32Array
type KeyColor = { t: number; r: number; g: number; b: number }

// ---------------------------------------------------------------------------------------------------------------------
// ==== HELPERS ========================================================================================================
// ---------------------------------------------------------------------------------------------------------------------
const clamp = (x:number, a=0, b=1)=> Math.max(a, Math.min(b, x))
const lerp = (a:number,b:number,t:number)=> a + (b - a) * t
const rand = ()=> Math.random()
const randRange = (a:number,b:number)=> lerp(a,b,rand())
const randN = (mu=0, sigma=1)=> { // Box–Muller
    let u = 0, v = 0
    while (u===0) u = Math.random()
    while (v===0) v = Math.random()
    return mu + sigma * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2*Math.PI*v)
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
// ---------------------------------------------------------------------------------------------------------------------
// ==== GENERATORS =====================================================================================================
// ---------------------------------------------------------------------------------------------------------------------
export function randomGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)
    for (let i = 0; i < NUM_TYPES; ++i) {
        colors[i * 4] = rand()
        colors[i * 4 + 1] = rand()
        colors[i * 4 + 2] = rand()
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
export function vividSpectrum(NUM_TYPES: number): Colors {
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

    // Hue range: from orange (20°) to pink-violet (300°)
    const startH = 20
    const endH = 300

    // Saturation and value gradually soften for a natural gradient
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

    // Hue range: deep red → golden orange (degrees on HSV color wheel)
    const startH = 5     // deep red
    const endH = 45      // golden yellow-orange

    // Rich, warm saturation and brightness values
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

    // Hue range: from warm magenta-pink → deep violet-blue
    const startH = 345  // bright pinkish red
    const endH = 260    // deep violet-blue

    // More dynamic gradient: starts bright, ends dark
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

    // Hue range: fiery red → deep magenta (avoids green transition)
    const startH = 2     // bright red
    const endH = -30     // deep magenta, moving backward on hue circle

    const s0 = 1.0       // strong saturation
    const s1 = 0.7       // slightly softer at the end
    const v0 = 0.95       // bright start
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
    const startHue = Math.random() * 360
    const endHue = (startHue + 180) % 360
    for (let i = 0; i < NUM_TYPES; ++i) {
        const t = i / (NUM_TYPES - 1)
        const hue = startHue * (1 - t) + endHue * t
        const [r, g, b] = hsvToRgb(hue, 0.9, 1.0)
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

export function magmaDeepGenerator(NUM_TYPES: number): Colors {
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
            const hue = inks[Math.floor(rand()*inks.length)]
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

export function sciFiUIGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const coolBand = [170, 200]
    const accents  = [300, 30]
    for (let i=0;i<NUM_TYPES;i++){
        const accent = (i % 6 === 0)
        const hue = accent ? accents[Math.floor(rand()*accents.length)]
            : randRange(coolBand[0], coolBand[1])
        const s = accent ? clamp(0.85 + randN(0,.08)) : clamp(0.7 + randN(0,.1))
        const v = accent ? clamp(0.95 + randN(0,.03)) : clamp(0.75 + randN(0,.07))
        let [r,g,b] = hsvToRgb((hue+360)%360, s, v)
        r*=0.8; g*=0.9; b*=0.95
        colors.set([r,g,b,1], i*4)
    }
    return colors
}

export function blueprintGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    for (let i=0;i<NUM_TYPES;i++){
        const blueprint = i % 5 !== 0
        if (blueprint){
            const h = (220 + randN(0, 5)) % 360
            const s = clamp(0.6 + randN(0,.05))
            const v = clamp(0.5 + randN(0,.05))
            const [r,g,b] = hsvToRgb(h,s,v)
            colors.set([r*0.8, g*0.85, b, 1], i*4)
        } else {
            const v = clamp(0.95 + randN(0,.03))
            colors.set([v, v, v, 1], i*4)
        }
    }
    return colors
}

export function gameboyDMGGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const steps = [0.2, 0.35, 0.55, 0.78]
    const hue = randRange(90, 110)
    for (let i=0;i<NUM_TYPES;i++){
        const v = steps[i % steps.length] + randN(0, .03)
        const s = clamp(0.25 + randN(0,.05))
        const [r,g,b] = hsvToRgb(hue, s, clamp(v))
        colors.set([r*0.9, g, b*0.9, 1], i*4)
    }
    return colors
}

export function noirAccentGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const accentH = randRange(10, 350)
    for (let i=0;i<NUM_TYPES;i++){
        const isAccent = i % Math.max(3, Math.round(NUM_TYPES/5)) === 0
        if (isAccent){
            const [r,g,b] = hsvToRgb((accentH+randN(0,8)+360)%360, 0.9, 0.95)
            colors.set([r,g,b,1], i*4)
        } else {
            let v = clamp(0.25 + rand() * 0.55)
            v = Math.pow(v, 1.1)
            colors.set([v, v, v, 1], i*4)
        }
    }
    return colors
}

export function cgaNeonGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const choices = [ {h:300,s:1,v:1}, {h:190,s:1,v:1} ]
    for (let i=0;i<NUM_TYPES;i++){
        const c = choices[i % choices.length]
        const h = (c.h + randN(0, 6)) % 360
        const s = clamp(c.s - Math.abs(randN(0,.08)))
        const v = clamp(0.9 + randN(0,.07))
        const [r,g,b] = hsvToRgb(h,s,v)
        colors.set([r, g, b, 1], i*4)
    }
    return colors
}

export function biolumAbyssGenerator(NUM_TYPES:number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const baseH = randRange(180, 210)
    const accentCount = Math.max(1, Math.round(NUM_TYPES * randRange(0.08, 0.2)))
    const accentIdx = new Set<number>()
    while (accentIdx.size < accentCount) accentIdx.add(Math.floor(Math.random()*NUM_TYPES))
    for (let i=0;i<NUM_TYPES;i++){
        const isAccent = accentIdx.has(i)
        const h = isAccent ? randRange(160, 190) : (baseH + randN(0,8))
        const s = isAccent ? clamp(0.9 + randN(0,.05)) : clamp(0.35 + randN(0,.1))
        const v = isAccent ? clamp(0.95 + randN(0,.03)) : clamp(0.12 + randN(0,.05))
        const [r,g,b] = hsvToRgb((h+360)%360, s, v)
        colors.set([r,g,b,1], i*4)
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

export function lavaLampGenerator(NUM_TYPES:number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const hA = randRange(10, 30), hB = (hA + randRange(140,220)) % 360
    for (let i=0;i<NUM_TYPES;i++){
        const t = i/Math.max(1,NUM_TYPES-1)
        const mix = 0.5 + 0.5*Math.sin(2*Math.PI*t + randRange(0,Math.PI))
        const h = (hA*(1-mix) + hB*mix + randN(0,4)) % 360
        const s = clamp(0.75 + randN(0,.08))
        const v = clamp(0.6 + 0.35*Math.sin(2*Math.PI*t + 1.1) + randN(0,.06))
        const [r,g,b] = hsvToRgb(h,s,v)
        colors.set([r,g,b,1], i*4)
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

export function midnightCircuitGenerator(NUM_TYPES:number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    for (let i=0;i<NUM_TYPES;i++){
        const roll = Math.random()
        let h:number, s:number, v:number
        if (roll < 0.1){
            h = randRange(25, 40); s = clamp(0.9 + randN(0,.05)); v = clamp(0.95 + randN(0,.02))
        } else if (roll < 0.55){
            h = randRange(170, 200); s = clamp(0.7 + randN(0,.08)); v = clamp(0.35 + randN(0,.06))
        } else {
            h = randRange(270, 300); s = clamp(0.7 + randN(0,.08)); v = clamp(0.35 + randN(0,.06))
        }
        const [r,g,b] = hsvToRgb((h+360)%360, s, v)
        colors.set([r,g,b,1], i*4)
    }
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
const PALETTES: { id: number; name: string; generator: (n: number) => Colors }[] = [
    { id: 0, name: 'Random', generator: randomGenerator },                       // +++ GENERATIVE   DONE
    { id: 1, name: 'Rainbow', generator: rainbow },                              // +++ STATIC   DONE
    { id: 2, name: 'Neon Warm', generator: neonWarm },                           // +++ STATIC   DONE toDo: renaming? (radiantGlow?)
    { id: 3, name: 'Heatmap Classic', generator: heatmapClassic },               // +++ STATIC   DONE
    { id: 4, name: 'Heatmap Cool', generator: heatmapCool },                     // ++  STATIC   DONE
    { id: 5, name: 'Heatmap Warm', generator: heatmapWarm },                     // ++  STATIC   DONE
    { id: 6, name: 'Pastel', generator: pastel },                                // +++ STATIC   DONE
    { id: 7, name: 'Cold Blue', generator: coldBlue },                           // +   STATIC   DONE
    { id: 8, name: 'Vivid Spectrum', generator: vividSpectrum },                 // +   STATIC   DONE
    { id: 9, name: 'Thermal Glow', generator: thermalGlow },                     // +   STATIC   DONE
    { id: 10, name: 'Crimson Flame', generator: crimsonFlame },                  // +++ STATIC   DONE
    { id: 11, name: 'Fire', generator: fire },                                   // +++ STATIC   DONE
    { id: 12, name: 'Violet Fade', generator: violetFade },                      // +++ STATIC   DONE
    { id: 13, name: 'Grayscale', generator: grayscale },                         // +++ STATIC   DONE
    { id: 14, name: 'Desert Warm', generator: desertWarm },                      // +   STATIC   DONE

    { id: 15, name: 'Dual Gradient', generator: dualGradientGenerator },         // +++ GENERATIVE
    { id: 16, name: 'Candy', generator: candyGenerator },                        // +++ GENERATIVE fun bright colors
    { id: 17, name: 'Paper & Ink', generator: paperInkGenerator },               // +++ GENERATIVE toDo: description
    { id: 22, name: 'Midnight Circuit', generator: midnightCircuitGenerator },   // ++  GENERATIVE encore un truc neon aleatoire sombre avec couleur d'accent
    { id: 20, name: 'Lava Lamp', generator: lavaLampGenerator },                 // ++  GENERATIVE toDo: Sympas mais incoherent? Renaming
    
    { id: 18, name: 'BioLuminescent Abyss', generator: biolumAbyssGenerator },   // +   GENERATIVE toDo: too dark?
    { id: 19, name: 'Blueprint', generator: blueprintGenerator },                // +   GENERATIVE toDo: frequence du blanc
    { id: 21, name: 'Fluoro Sport', generator: fluoroSportGenerator },           // +   GENERATIVE nuances foncees avec accents fluos
    { id: 23, name: 'Magma Deep', generator: magmaDeepGenerator },               // +   GENERATIVE toDo: Incoherent? green?? Renaming?

    { id: 24, name: 'Holographic Foil', generator: holoFoilGenerator },          // +   GENERATIVE
    { id: 25, name: 'Mineral Gemstones', generator: gemstonesGenerator },        // ++  GENERATIVE
    { id: 26, name: 'Vaporwave Pastel', generator: vaporwavePastelGenerator },   // +   GENERATIVE pastel neon rose/violet/cyan
    { id: 27, name: 'Solarized Drift', generator: solarizedDriftGenerator },     // ++  GENERATIVE Encore une sorte de random pastel
    { id: 28, name: 'Aurora', generator: auroraGenerator },                      // ++  GENERATIVE toDo: description
    { id: 29, name: 'Cyber Neon', generator: cyberNeonGenerator },               // ++  GENERATIVE
    { id: 30, name: 'Golden Angle Jitter', generator: goldenAngleJitterGenerator }, // ++  GENERATIVE toDo: description

    { id: 31, name: 'Game Boy DMG', generator: gameboyDMGGenerator },            // + toDo: pas mal, mais peut etre a revoir
    { id: 32, name: 'CGA Neon', generator: cgaNeonGenerator },                   // + alterne en rose neaon et cyan neon 1 sur 2
    { id: 33, name: 'Noir + Accent', generator: noirAccentGenerator },           // +  Mouais trop de gris
    { id: 34, name: 'Ink Bleed Watercolor', generator: inkBleedWatercolorGenerator }, // +
    { id: 35, name: 'CMYK Misregister', generator: cmykMisregisterGenerator },   // +  Bleu, Magenta, Jaune, Noir avec legeres variations
    { id: 36, name: 'Anodized Metal', generator: anodizedMetalGenerator },       // ~~ Des bleu et rose/violet metallique
    { id: 37, name: 'Sci-Fi UI', generator: sciFiUIGenerator },                  // ~~ nuance de bleu/cyan avec accents rose/violet et orange
]

export const PALETTE_OPTIONS: PaletteOption[] = PALETTES.map(({ id, name }) => ({ id, name }))

export function generateColors(optionID: number, NUM_TYPES: number): Colors {
    if (NUM_TYPES <= 0) return new Float32Array(0)
    const palette = PALETTES.find(p => p.id === optionID)
    const generator = palette?.generator ?? randomGenerator
    return generator(NUM_TYPES)
}
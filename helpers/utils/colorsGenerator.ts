export interface PaletteOption { id: number; name: string }
export type Colors = Float32Array

// ==== GENERATORS ====

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

export function rainbowGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)
    for (let i = 0; i < NUM_TYPES; ++i) {
        const hue = (i / NUM_TYPES) * 360
        const [r, g, b] = hsvToRgb(hue, 1.0, 1.0)
        colors.set([r, g, b, 1], i * 4)
    }
    return colors
}

export function pastelGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)
    for (let i = 0; i < NUM_TYPES; ++i) {
        const hue = (i / NUM_TYPES) * 360
        const [r, g, b] = hsvToRgb(hue, 0.5, 1.0)
        colors.set([r, g, b, 1], i * 4)
    }
    return colors
}

export function coldGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)
    for (let i = 0; i < NUM_TYPES; ++i) {
        const t = i / (NUM_TYPES - 1)
        const r = 0.2 * (1 - t)
        const g = 0.5 + 0.5 * t
        const b = 0.8 + 0.2 * t
        colors.set([r, g, b, 1], i * 4)
    }
    return colors
}

export function heatmapGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)
    for (let i = 0; i < NUM_TYPES; ++i) {
        const t = i / (NUM_TYPES - 1)
        const [r, g, b] = t < 0.5
            ? [t * 2, 0, 0]
            : [1, (t - 0.5) * 2, 0]
        const v = Math.min(1, 0.5 + t)
        colors.set([r * v, g * v, b * v, 1], i * 4)
    }
    return colors
}

export function neonGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)
    for (let i = 0; i < NUM_TYPES; ++i) {
        const hue = (i / NUM_TYPES) * 360
        const sat = 0.9 + 0.1 * Math.sin(i * 0.7)
        const val = 0.9 + 0.1 * Math.cos(i * 0.5)
        const [r, g, b] = hsvToRgb(hue, sat, val)
        colors.set([r, g, b, 1], i * 4)
    }
    return colors
}

export function galaxyGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)
    for (let i = 0; i < NUM_TYPES; ++i) {
        const hue = (i / NUM_TYPES) * 360
        const [r, g, b] = hsvToRgb(hue, 0.8, 0.7)
        colors.set([r * 0.5, g * 0.5, b * 0.8, 1], i * 4)
    }
    return colors
}

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

export function mirrorGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES * 4)
    for (let i = 0; i < NUM_TYPES; ++i) {
        const idx = (i < NUM_TYPES / 2) ? i : NUM_TYPES - i - 1
        const hue = (idx / (NUM_TYPES / 2)) * 360
        const [r, g, b] = hsvToRgb(hue, 0.8, 1.0)
        colors.set([r, g, b, 1], i * 4)
    }
    return colors
}

export function desertWarmGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const baseH = randRange(20, 40)
    const baseS = randRange(0.45, 0.75)
    const baseV = randRange(0.85, 1.0)
    for (let i=0;i<NUM_TYPES;i++){
        const h = (baseH + randN(0, 6)) % 360
        const s = clamp(baseS + randN(0, 0.08))
        const v = clamp(baseV - Math.abs(randN(0, 0.07)))
        const [r,g,b] = hsvToRgb(h,s,v)
        colors.set([r,g,b,1], i*4)
    }
    return colors
}

export function oceanCoolGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const baseH = randRange(180, 210)
    const baseS = randRange(0.45, 0.9)
    const baseV = randRange(0.7, 1.0)
    for (let i=0;i<NUM_TYPES;i++){
        const h = (baseH + randN(0, 10)) % 360
        const s = clamp(baseS + randN(0, 0.12))
        const v = clamp(baseV + randN(0, 0.08))
        const [r,g,b] = hsvToRgb(h,s,v)
        colors.set([r,g,b,1], i*4)
    }
    return colors
}

export function forestEarthGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const baseH = randRange(85, 140)
    for (let i=0;i<NUM_TYPES;i++){
        const h = (baseH + randN(0, 12) + (i%3===0 ? randRange(-20,20):0)) % 360
        const s = clamp(0.35 + randN(0, 0.12))
        const v = clamp(0.45 + randN(0, 0.15))
        const [r,g,b] = hsvToRgb(h,s,v)
        colors.set([r,g,b,1], i*4)
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

export function sunsetVariantGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const startH = randRange(10, 25)
    const endH   = (startH + randRange(40, 80)) % 360
    const s0 = randRange(0.7, 1.0), s1 = randRange(0.6, 0.9)
    const v0 = randRange(0.8, 1.0), v1 = randRange(0.6, 0.95)
    for (let i=0;i<NUM_TYPES;i++){
        const t = NUM_TYPES<=1 ? 0 : i/(NUM_TYPES-1)
        const h = (lerp(startH, endH, t) + randN(0, 4)) % 360
        const s = clamp(lerp(s0, s1, t) + randN(0, 0.05))
        const v = clamp(lerp(v0, v1, t) + randN(0, 0.05))
        const [r,g,b] = hsvToRgb(h,s,v)
        colors.set([r,g,b,1], i*4)
    }
    return colors
}

export function icePastelGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const baseH = randRange(160, 220)
    for (let i=0;i<NUM_TYPES;i++){
        const h = (baseH + randN(0, 20)) % 360
        const s = clamp(0.25 + randN(0, 0.08))
        const v = clamp(0.9 + randN(0, 0.05))
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

export function grayscaleFilmGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const gamma = randRange(0.9, 1.2)
    for (let i=0;i<NUM_TYPES;i++){
        let v = clamp(0.25 + 0.7 * (i/(NUM_TYPES-1)) + randN(0, 0.08))
        v = Math.pow(clamp(v), gamma)
        colors.set([v, v, v, 1], i*4)
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

export function retroConsoleGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const baseH = randRange(105, 125)
    for (let i=0;i<NUM_TYPES;i++){
        const h = (baseH + randN(0, 3)) % 360
        const s = clamp(0.55 + randN(0, .08))
        const v = clamp(0.75 + randN(0, .1))
        const [r,g,b] = hsvToRgb(h,s,v)
        colors.set([r*0.9, g, b*0.8, 1], i*4)
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

export function crtAmberGenerator(NUM_TYPES: number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const baseH = randRange(28, 38)
    for (let i=0;i<NUM_TYPES;i++){
        const h = (baseH + randN(0, 2.5)) % 360
        const s = clamp(0.75 + randN(0,.06))
        const v = clamp(0.85 + randN(0,.08))
        const [r,g,b] = hsvToRgb(h,s,v)
        colors.set([r, g*0.8, b*0.5, 1], i*4)
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

export function iridescentBeetleGenerator(NUM_TYPES:number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    const base = randRange(110, 140)
    for (let i=0;i<NUM_TYPES;i++){
        const t = i/Math.max(1,NUM_TYPES-1)
        const h = (base + 80*Math.sin(2*Math.PI*t) + randN(0,6)) % 360
        const s = clamp(0.7 + 0.2*Math.cos(4*Math.PI*t) + randN(0,.05))
        const v = clamp(0.6 + 0.35*Math.sin(3*Math.PI*t + 0.8) + randN(0,.04))
        const [r,g,b] = hsvToRgb(h,s,v)
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

export function thermalSatelliteGenerator(NUM_TYPES:number): Colors {
    const colors = new Float32Array(NUM_TYPES*4)
    for (let i=0;i<NUM_TYPES;i++){
        const t = i/Math.max(1,NUM_TYPES-1)
        let r=0,g=0,b=0
        if (t < 0.25){
            const u=t/0.25; [r,g,b]=[0, u*0.2, 0.3+0.7*u]
        } else if (t < 0.5){
            const u=(t-0.25)/0.25; [r,g,b]=[0, 0.2+0.8*u, 1-0.2*u]
        } else if (t < 0.75){
            const u=(t-0.5)/0.25; [r,g,b]=[u, 1, (1-u)*0.4]
        } else {
            const u=(t-0.75)/0.25; [r,g,b]=[1, 1-u*0.6, 0.4+0.6*u]
        }
        colors.set([clamp(r),clamp(g),clamp(b),1], i*4)
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

// ==== UTILS ====

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

// ==== PALETTE REGISTRY ====

const PALETTES: { id: number; name: string; generator: (n: number) => Colors }[] = [
    // 🧩 Essentials / Fundamentals
    { id: 0, name: 'Random', generator: randomGenerator },
    { id: 1, name: 'Rainbow', generator: rainbowGenerator },
    { id: 2, name: 'Mirror', generator: mirrorGenerator },
    { id: 3, name: 'Dual Gradient', generator: dualGradientGenerator },
    { id: 4, name: 'Heatmap', generator: heatmapGenerator },
    { id: 5, name: 'Grayscale Film', generator: grayscaleFilmGenerator },

    // 🌿 Natural & Organic
    { id: 6, name: 'Desert Warm', generator: desertWarmGenerator },
    { id: 7, name: 'Forest Earth', generator: forestEarthGenerator },
    { id: 8, name: 'Ocean Cool', generator: oceanCoolGenerator },
    { id: 9, name: 'Aurora', generator: auroraGenerator },
    { id: 10, name: 'BioLuminescent Abyss', generator: biolumAbyssGenerator },
    { id: 11, name: 'Mineral Gemstones', generator: gemstonesGenerator },

    // ☀️ Ambient & Soft
    { id: 12, name: 'Pastel', generator: pastelGenerator },
    { id: 13, name: 'Ice Pastel', generator: icePastelGenerator },
    { id: 14, name: 'Sunset Variant', generator: sunsetVariantGenerator },
    { id: 15, name: 'Cyber Neon', generator: cyberNeonGenerator },
    { id: 16, name: 'Magma Deep', generator: magmaDeepGenerator },
    { id: 17, name: 'Lava Lamp', generator: lavaLampGenerator },

    // 💾 Retro & Tech
    { id: 18, name: 'Retro Console', generator: retroConsoleGenerator },
    { id: 19, name: 'Game Boy DMG', generator: gameboyDMGGenerator },
    { id: 20, name: 'CRT Amber', generator: crtAmberGenerator },
    { id: 21, name: 'CGA Neon', generator: cgaNeonGenerator },
    { id: 22, name: 'Sci-Fi UI', generator: sciFiUIGenerator },
    { id: 23, name: 'Fluoro Sport', generator: fluoroSportGenerator },
    { id: 24, name: 'Midnight Circuit', generator: midnightCircuitGenerator },

    // 🧠 Materials & Reflections
    { id: 25, name: 'Iridescent Beetle', generator: iridescentBeetleGenerator },
    { id: 26, name: 'Anodized Metal', generator: anodizedMetalGenerator },
    { id: 27, name: 'Holographic Foil', generator: holoFoilGenerator },

    // 🧬 Scientific & Analytical
    { id: 28, name: 'Cold', generator: coldGenerator },
    { id: 29, name: 'Thermal Satellite', generator: thermalSatelliteGenerator },
    { id: 30, name: 'Solarized Drift', generator: solarizedDriftGenerator },
    { id: 31, name: 'Neon Spectrum', generator: neonGenerator },
    { id: 32, name: 'Galaxy', generator: galaxyGenerator },
    { id: 33, name: 'Golden Angle Jitter', generator: goldenAngleJitterGenerator },

    // 🎨 Artistic & Stylized
    { id: 34, name: 'Paper & Ink', generator: paperInkGenerator },
    { id: 35, name: 'Blueprint', generator: blueprintGenerator },
    { id: 36, name: 'Ink Bleed Watercolor', generator: inkBleedWatercolorGenerator },
    { id: 37, name: 'CMYK Misregister', generator: cmykMisregisterGenerator },
    { id: 38, name: 'Noir + Accent', generator: noirAccentGenerator },
    { id: 39, name: 'Candy', generator: candyGenerator },
    { id: 40, name: 'Vaporwave Pastel', generator: vaporwavePastelGenerator },
]

export const PALETTE_OPTIONS: PaletteOption[] = PALETTES.map(({ id, name }) => ({ id, name }))

export function generateColors(optionID: number, NUM_TYPES: number): Colors {
    if (NUM_TYPES <= 0) return new Float32Array(0)
    const palette = PALETTES.find(p => p.id === optionID)
    const generator = palette?.generator ?? randomGenerator
    const colors = generator(NUM_TYPES)
    return colors
}
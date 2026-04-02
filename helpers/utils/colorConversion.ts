export function clamp(v: number, min = 0, max = 1): number {
    return Math.max(min, Math.min(max, v))
}

// -- HSV ↔ RGB --------------------------------------------------------------------------------------------------------

// HSV → RGB.  h: 0–360, s: 0–1, v: 0–1  →  r,g,b: 0–1
export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
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

// RGB → HSV.  r,g,b: 0–255  →  h: 0–360, s: 0–1, v: 0–1
export function rgbToHsv(r: number, g: number, b: number): { h: number, s: number, v: number } {
    r /= 255; g /= 255; b /= 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const d = max - min
    let h = 0
    if (d !== 0) {
        if (max === r) h = ((g - b) / d) % 6
        else if (max === g) h = (b - r) / d + 2
        else h = (r - g) / d + 4
        h *= 60
        if (h < 0) h += 360
    }
    const s = max === 0 ? 0 : d / max
    return { h, s, v: max }
}

// -- HSV ↔ HSL --------------------------------------------------------------------------------------------------------

// HSV → HSL.  h: 0–360, s: 0–1, v: 0–1  →  [h°, s%, l%]
export function hsvToHsl(h: number, s: number, v: number): [number, number, number] {
    const l = v * (1 - s / 2)
    const sl = (l === 0 || l === 1) ? 0 : (v - l) / Math.min(l, 1 - l)
    return [h, sl * 100, l * 100]
}

// HSL → HSV.  h: 0–360, s: 0–100, l: 0–100  →  h: 0–360, s: 0–1, v: 0–1
export function hslToHsv(h: number, s: number, l: number): { h: number, s: number, v: number } {
    s /= 100; l /= 100
    const v = l + s * Math.min(l, 1 - l)
    const sv = v === 0 ? 0 : 2 * (1 - l / v)
    return { h, s: sv, v }
}

// -- RGB ↔ HEX --------------------------------------------------------------------------------------------------------

// RGB → Hex.  r,g,b: 0–255  →  "#RRGGBB"
export function rgbToHex(r: number, g: number, b: number): string {
    const h = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0').toUpperCase()
    return `#${h(r)}${h(g)}${h(b)}`
}

// Hex → RGB.  "#rrggbb" or "#rgb"  →  [r, g, b] 0–255, or null
export function hexToRgb(hex: string): [number, number, number] | null {
    let h = hex.replace(/^#/, '')
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
    const m = h.match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
    if (!m) return null
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
}

// -- RGB float (0-1) → HSL --------------------------------------------------------------------------------------------

// RGB float → HSL.  r,g,b: 0–1  →  [h°, s%, l%]
export function rgbFloatToHsl(r: number, g: number, b: number): [number, number, number] {
    r = clamp(r); g = clamp(g); b = clamp(b)
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const d = max - min
    let h = 0, s = 0
    const l = (max + min) / 2
    if (d !== 0) {
        if (max === r) h = ((g - b) / d) % 6
        else if (max === g) h = (b - r) / d + 2
        else h = (r - g) / d + 4
        h *= 60
        if (h < 0) h += 360
        s = d / (1 - Math.abs(2 * l - 1))
    }
    return [h, s * 100, l * 100]
}

// HSL → RGB.  h: 0–360, s: 0–100, l: 0–100  →  r,g,b: 0–1
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h /= 360; s /= 100; l /= 100
    if (s === 0) return [l, l, l]
    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)]
}

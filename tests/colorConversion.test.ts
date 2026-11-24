import { describe, expect, it } from 'vitest'
import { clamp, hexToRgb, hslToHsv, hslToRgb, hsvToHsl, hsvToRgb, rgbFloatToHsl, rgbToHex, rgbToHsv } from '~/helpers/utils/colorConversion'

// Pure color-space math. These are deterministic and framework-free, so they make
// ideal regression tests: a broken conversion (off-by-one hue sector, wrong
// normalization, dropped clamp) fails here without any DOM/GPU mocking.

describe('clamp', () => {
    it('passes through values already within the default [0,1] range', () => {
        expect(clamp(0)).toBe(0)
        expect(clamp(0.5)).toBe(0.5)
        expect(clamp(1)).toBe(1)
    })

    it('clamps below-min and above-max to the default bounds', () => {
        expect(clamp(-3)).toBe(0)
        expect(clamp(2.7)).toBe(1)
    })

    it('honors custom min/max bounds', () => {
        expect(clamp(5, 0, 10)).toBe(5)
        expect(clamp(-4, 0, 10)).toBe(0)
        expect(clamp(99, 0, 10)).toBe(10)
        expect(clamp(7, -10, 20)).toBe(7)
    })
})

describe('hsvToRgb', () => {
    it('maps the pure primaries correctly (h:0-360, s,v:0-1 -> r,g,b:0-1)', () => {
        expect(hsvToRgb(0, 1, 1)).toEqual([1, 0, 0]) // red
        expect(hsvToRgb(120, 1, 1)).toEqual([0, 1, 0]) // green
        expect(hsvToRgb(240, 1, 1)).toEqual([0, 0, 1]) // blue
    })

    it('produces white and black at the value extremes', () => {
        expect(hsvToRgb(0, 0, 1)).toEqual([1, 1, 1]) // full value, no saturation
        expect(hsvToRgb(0, 0, 0)).toEqual([0, 0, 0]) // zero value
    })

    it('widens the channel spread as saturation increases (s=0 is gray)', () => {
        const spread = ([r, g, b]: number[]) => Math.max(r, g, b) - Math.min(r, g, b)
        // Fully desaturated -> all channels equal (gray).
        expect(spread(hsvToRgb(240, 0, 1))).toBeCloseTo(0)
        // Higher saturation -> a wider gap between the brightest and darkest channel.
        expect(spread(hsvToRgb(240, 0.8, 1))).toBeGreaterThan(spread(hsvToRgb(240, 0.2, 1)))
    })
})

describe('rgbToHsv', () => {
    it('maps the pure primaries back to their HSV coordinates (r,g,b:0-255)', () => {
        expect(rgbToHsv(255, 0, 0)).toEqual({ h: 0, s: 1, v: 1 })
        expect(rgbToHsv(0, 255, 0)).toEqual({ h: 120, s: 1, v: 1 })
        expect(rgbToHsv(0, 0, 255)).toEqual({ h: 240, s: 1, v: 1 })
    })

    it('reports zero saturation for grays', () => {
        const gray = rgbToHsv(128, 128, 128)
        expect(gray.s).toBeCloseTo(0)
        expect(gray.v).toBeCloseTo(128 / 255)
    })

    it('round-trips with hsvToRgb for a non-degenerate color', () => {
        const target = { h: 200, s: 0.7, v: 0.9 }
        const [r, g, b] = hsvToRgb(target.h, target.s, target.v)
        const back = rgbToHsv(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255))
        expect(back.h).toBeCloseTo(target.h, 0)
        expect(back.s).toBeCloseTo(target.s, 1)
        expect(back.v).toBeCloseTo(target.v, 1)
    })
})

describe('hsvToHsl / hslToHsv', () => {
    it('converts pure HSV red to HSL [0,100,50]', () => {
        expect(hsvToHsl(0, 1, 1)).toEqual([0, 100, 50])
    })

    it('converts pure HSL red back to HSV {h:0,s:1,v:1}', () => {
        expect(hslToHsv(0, 100, 50)).toEqual({ h: 0, s: 1, v: 1 })
    })

    it('round-trips a mid color through HSV -> HSL -> HSV', () => {
        const start = { h: 90, s: 0.6, v: 0.8 }
        const [h, sPct, lPct] = hsvToHsl(start.h, start.s, start.v)
        const back = hslToHsv(h, sPct, lPct)
        expect(back.h).toBeCloseTo(start.h, 5)
        expect(back.s).toBeCloseTo(start.s, 4)
        expect(back.v).toBeCloseTo(start.v, 4)
    })
})

describe('rgbToHex / hexToRgb', () => {
    it('encodes a full RGB triple as an upper-case #RRGGBB string', () => {
        expect(rgbToHex(255, 0, 0)).toBe('#FF0000')
        expect(rgbToHex(0, 128, 255)).toBe('#0080FF')
    })

    it('decodes #rrggbb (case-insensitive) to a 0-255 triple', () => {
        expect(hexToRgb('#ff0000')).toEqual([255, 0, 0])
        expect(hexToRgb('#123456')).toEqual([18, 52, 86])
    })

    it('expands the 3-digit shorthand #rgb', () => {
        expect(hexToRgb('fff')).toEqual([255, 255, 255])
        expect(hexToRgb('#f0a')).toEqual([255, 0, 170])
    })

    it('returns null for malformed input', () => {
        expect(hexToRgb('#zzz')).toBeNull()
        expect(hexToRgb('#12345')).toBeNull() // wrong length
        expect(hexToRgb('')).toBeNull()
    })

    it('round-trips hex -> rgb -> hex', () => {
        const hex = '#0a1b2c'
        const [r, g, b] = hexToRgb(hex)!
        expect(rgbToHex(r, g, b)).toBe('#0A1B2C')
    })
})

describe('rgbFloatToHsl / hslToRgb', () => {
    it('maps pure RGB floats to their HSL values (r,g,b:0-1 -> [h,s%,l%])', () => {
        expect(rgbFloatToHsl(1, 0, 0)).toEqual([0, 100, 50]) // red
        expect(rgbFloatToHsl(0, 1, 0)).toEqual([120, 100, 50]) // green
        expect(rgbFloatToHsl(0, 0, 1)).toEqual([240, 100, 50]) // blue
    })

    it('maps white and black correctly', () => {
        expect(rgbFloatToHsl(1, 1, 1)).toEqual([0, 0, 100])
        expect(rgbFloatToHsl(0, 0, 0)).toEqual([0, 0, 0])
    })

    it('clamps out-of-range float inputs into [0,1]', () => {
        // r=2 should clamp to 1 -> pure red-ish; must not throw or produce NaN.
        const [h, s, l] = rgbFloatToHsl(2, -1, 1)
        expect(Number.isNaN(h)).toBe(false)
        expect(s).toBeGreaterThanOrEqual(0)
        expect(l).toBeGreaterThan(0)
    })

    it('round-trips HSL -> RGB -> HSL for a non-degenerate color', () => {
        const [h, s, l] = [35, 70, 60]
        const [r, g, b] = hslToRgb(h, s, l)
        const back = rgbFloatToHsl(r, g, b)
        expect(back[0]).toBeCloseTo(h, 1)
        expect(back[1]).toBeCloseTo(s, 1)
        expect(back[2]).toBeCloseTo(l, 1)
    })

    it('returns gray for zero saturation', () => {
        const [r, g, b] = hslToRgb(0, 0, 50)
        expect(r).toBeCloseTo(g)
        expect(g).toBeCloseTo(b)
        expect(r).toBeCloseTo(0.5)
    })
})

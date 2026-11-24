import { describe, expect, it } from 'vitest'
import { float32ArrayToHsl, generateColors, generateHSLColors, PALETTE_OPTIONS } from '~/helpers/utils/colorsGenerator'

// Palette generators turn a species count into concrete particle colors. Every one
// must return the right number of valid colors; a regression that returns a short
// buffer, a NaN channel, or an out-of-range HSL value would corrupt the whole sim.

function isFiniteNumber(v: unknown): boolean {
    return typeof v === 'number' && Number.isFinite(v)
}

describe('float32ArrayToHsl', () => {
    it('reads RGBA quads (ignoring alpha) and converts each to HSL', () => {
        const rgba = new Float32Array([1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1])
        const hsl = float32ArrayToHsl(rgba)
        expect(hsl).toHaveLength(3)
        expect(hsl[0]).toEqual([0, 100, 50]) // red
        expect(hsl[1]).toEqual([120, 100, 50]) // green
        expect(hsl[2]).toEqual([0, 0, 100]) // white
    })

    it('returns an empty array for an empty buffer', () => {
        expect(float32ArrayToHsl(new Float32Array(0))).toEqual([])
    })
})

describe('generateColors (RGB float output)', () => {
    it('every palette returns a finite RGBA buffer of exactly n*4 channels', () => {
        const n = 8
        for (const option of PALETTE_OPTIONS) {
            const colors = generateColors(option.id, n)
            expect(colors, `palette ${option.id} (${option.name}) length`).toBeInstanceOf(Float32Array)
            expect(colors.length).toBe(n * 4)
            for (let i = 0; i < colors.length; i++)
                expect(isFiniteNumber(colors[i]), `palette ${option.id} channel ${i}`).toBe(true)
        }
    })

    it('returns an empty buffer when NUM_TYPES <= 0', () => {
        expect(generateColors(0, 0)).toHaveLength(0)
    })
})

describe('generateHSLColors (HSL output)', () => {
    it('every palette returns n HSL tuples within valid ranges', () => {
        const n = 7
        for (const option of PALETTE_OPTIONS) {
            const hsl = generateHSLColors(option.id, n)
            expect(hsl.length, `palette ${option.id} (${option.name}) count`).toBe(n)
            for (const [h, s, l] of hsl) {
                expect(isFiniteNumber(h), `palette ${option.id} hue finite`).toBe(true)
                expect(isFiniteNumber(s), `palette ${option.id} sat finite`).toBe(true)
                expect(isFiniteNumber(l), `palette ${option.id} light finite`).toBe(true)
                expect(h).toBeGreaterThanOrEqual(0)
                expect(h).toBeLessThanOrEqual(360)
                expect(s).toBeGreaterThanOrEqual(0)
                expect(s).toBeLessThanOrEqual(100)
                expect(l).toBeGreaterThanOrEqual(0)
                expect(l).toBeLessThanOrEqual(100)
            }
        }
    })

    it('falls back to a valid random palette for an unknown option id', () => {
        const hsl = generateHSLColors(9999, 5)
        expect(hsl.length).toBe(5)
        for (const [h, s, l] of hsl) {
            expect(h).toBeGreaterThanOrEqual(0)
            expect(s).toBeGreaterThanOrEqual(0)
            expect(l).toBeGreaterThanOrEqual(0)
        }
    })

    it('returns an empty array when NUM_TYPES <= 0', () => {
        expect(generateHSLColors(0, 0)).toEqual([])
    })
})

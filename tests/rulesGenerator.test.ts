import { describe, expect, it } from 'vitest'
import {
    antiSymmetricSwirlGenerator,
    bipartiteGenerator,
    blueNoiseConveyorGenerator,
    generateRules,
    makeRandomRulesMatrix,
    rockPaperScissorsGenerator,
    RULES_OPTIONS,
    snakeGenerator,
    symmetricGenerator,
} from '~/helpers/utils/rulesGenerator'

// Rule-matrix generators are the "physics presets" for Particle Life. Most are
// deterministic (a few use Math.random), so we can assert exact structure and
// invariants that a regression would break: wrong dimensionality, a broken
// symmetry, an out-of-range force, or a dispatcher that no longer maps id -> generator.

const N = 6

function isSquareMatrix(m: number[][], size: number): boolean {
    return m.length === size && m.every(row => row.length === size)
}

describe('makeRandomRulesMatrix', () => {
    it('produces a square matrix of the requested size with values in [-1, 1]', () => {
        const m = makeRandomRulesMatrix(N)
        expect(isSquareMatrix(m, N)).toBe(true)
        for (const row of m) {
            for (const v of row) {
                expect(Number.isFinite(v)).toBe(true)
                expect(v).toBeGreaterThanOrEqual(-1)
                expect(v).toBeLessThan(1)
            }
        }
    })

    it('returns an empty matrix for size 0', () => {
        expect(makeRandomRulesMatrix(0)).toEqual([])
    })
})

describe('symmetricGenerator', () => {
    it('is exactly symmetric (m[i][j] === m[j][i])', () => {
        const m = symmetricGenerator(N)
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++)
                expect(m[i][j]).toBe(m[j][i])
        }
    })
})

describe('snakeGenerator', () => {
    it('has a 1 diagonal, 0.2 on the next ring, and 0 elsewhere', () => {
        const m = snakeGenerator(4)
        expect(m[0]).toEqual([1, 0.2, 0, 0])
        expect(m[3]).toEqual([0.2, 0, 0, 1]) // wraps around the ring
    })
})

describe('bipartiteGenerator', () => {
    it('separates even/odd types into two strongly-interacting blocs', () => {
        const m = bipartiteGenerator(4)
        expect(m[0]).toEqual([0.2, -0.8, 0.8, -0.8]) // row 0: self, cross, same, cross
        expect(m[1]).toEqual([-0.8, 0.2, -0.8, 0.8]) // row 1 (odd bloc)
    })
})

describe('rockPaperScissorsGenerator', () => {
    it('encodes the cyclic attract/repel pattern for n=3', () => {
        const m = rockPaperScissorsGenerator(3)
        expect(m[0]).toEqual([-0.1, 0.9, -0.7])
        expect(m[1]).toEqual([-0.7, -0.1, 0.9])
        expect(m[2]).toEqual([0.9, -0.7, -0.1])
    })
})

describe('antiSymmetricSwirlGenerator', () => {
    it('is antisymmetric off the diagonal with a fixed negative diagonal', () => {
        const m = antiSymmetricSwirlGenerator(5)
        for (let i = 0; i < 5; i++) {
            expect(m[i][i]).toBeCloseTo(-0.05)
            for (let j = 0; j < 5; j++) {
                if (i !== j)
                    expect(m[i][j]).toBeCloseTo(-m[j][i])
            }
        }
    })
})

describe('blueNoiseConveyorGenerator', () => {
    it('is deterministic: identical input yields an identical matrix', () => {
        const a = blueNoiseConveyorGenerator(N)
        const b = blueNoiseConveyorGenerator(N)
        expect(a).toEqual(b)
    })

    it('has the fixed self-interaction on the diagonal', () => {
        const m = blueNoiseConveyorGenerator(N)
        for (let i = 0; i < N; i++)
            expect(m[i][i]).toBeCloseTo(-0.05)
    })
})

describe('generateRules dispatcher', () => {
    it('every registered option produces a finite, square matrix of the right size', () => {
        for (const option of RULES_OPTIONS) {
            const m = generateRules(option.id, N)
            expect(isSquareMatrix(m, N), `option ${option.id} (${option.name})`).toBe(true)
            for (const row of m) {
                for (const v of row)
                    expect(Number.isFinite(v), `option ${option.id} produced a non-finite value`).toBe(true)
            }
        }
    })

    it('rounds every entry to two decimal places', () => {
        const m = generateRules(0, N) // random -> exercises the rounding pass
        for (const row of m) {
            for (const v of row)
                expect(v).toBe(Math.round(v * 100) / 100)
        }
    })

    it('keeps forces within [-1, 1] after generation', () => {
        const m = generateRules(0, N)
        for (const row of m) {
            for (const v of row) {
                expect(v).toBeGreaterThanOrEqual(-1)
                expect(v).toBeLessThanOrEqual(1)
            }
        }
    })

    it('routes a deterministic option to its generator (id 2 -> snake)', () => {
        const viaDispatcher = generateRules(2, 4)
        const direct = snakeGenerator(4)
        expect(viaDispatcher).toEqual(direct) // snake values are already 2dp
    })

    it('falls back to a valid random matrix for an unknown option id', () => {
        const m = generateRules(9999, N)
        expect(isSquareMatrix(m, N)).toBe(true)
        for (const row of m) {
            for (const v of row)
                expect(Number.isFinite(v)).toBe(true)
        }
    })

    it('returns an empty matrix when NUM_TYPES <= 0', () => {
        expect(generateRules(0, 0)).toEqual([])
        expect(generateRules(5, -3)).toEqual([])
    })
})

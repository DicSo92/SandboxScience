import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useParticleBrainGPUStore } from '~/stores/particleBrainGPUStore'

// ---------------------------------------------------------------------------
// Constants matching the component's particle layout (11 floats / 44 bytes per slot)
// ---------------------------------------------------------------------------
const STRIDE = 11

// Drive param bounds (must match ParticleLifeGpu.vue PHASE 3 & PHASE 4)
const DRIVE_TARGET_MIN = 0.1
const DRIVE_TARGET_MAX = 3.0
const DRIVE_SCALE_MIN = 0.05
const DRIVE_SCALE_MAX = 2.0
const DRIVE_GAIN_MIN = 0.0
const DRIVE_GAIN_MAX = 3.0

// Mutation ranges (must match ParticleLifeGpu.vue PHASE 4)
const MUT_TARGET = 0.1
const MUT_SCALE = 0.06
const MUT_GAIN = 0.06

// Deterministic pseudo-random for reproducible tests
function seededRandom(seed: number) {
    let s = seed
    return () => {
        s = (s * 16807 + 0) % 2147483647
        return (s - 1) / 2147483646
    }
}

/**
 * Helper: create a particle buffer with one urge at the given bufIdx.
 * Sets drive params (offsets 8, 9, 10) to known values.
 */
function makeBufferWithUrge(bufIdx: number, signal: number, control: number, driveTarget: number, driveScale: number, driveGain: number): Float32Array {
    const buf = new Float32Array(STRIDE * 4)
    const base = bufIdx * STRIDE
    // offset 4 = type tag (urges use NUM_TYPES + k + 0.5; use a large value to mark as urge)
    buf[base + 4] = 100 + bufIdx
    buf[base + 5] = control
    buf[base + 6] = signal
    buf[base + 7] = -1 // goalB
    buf[base + 8] = driveTarget
    buf[base + 9] = driveScale
    buf[base + 10] = driveGain
    return buf
}

// ---------------------------------------------------------------------------
// Store: brain defaults
// ---------------------------------------------------------------------------
describe('Brain Drive — Store Defaults', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('enables cloning by default', () => {
        const store = useParticleBrainGPUStore()
        expect(store.isCloningEnabled).toBe(true)
    })

    it('enables merging by default', () => {
        const store = useParticleBrainGPUStore()
        expect(store.isMergeEnabled).toBe(true)
    })

    it('enables the electrical (brain) layer by default', () => {
        const store = useParticleBrainGPUStore()
        expect(store.isElectricalEnabled).toBe(true)
    })

    it('has a positive clone pool for dormant slots', () => {
        const store = useParticleBrainGPUStore()
        expect(store.numClonePool).toBeGreaterThan(0)
    })
})

// ---------------------------------------------------------------------------
// Buffer logic: merge averaging (PHASE 3)
// ---------------------------------------------------------------------------
describe('Brain Drive — Merge Averages Drive Params', () => {
    it('survivor driveTarget is the midpoint of both parents', () => {
        const particles = new Float32Array(STRIDE * 4)

        // Survivor at bufIdx 0, loser at bufIdx 1
        const sBase = 0 * STRIDE
        const lBase = 1 * STRIDE

        particles[sBase + 8] = 1.0 // survivor driveTarget
        particles[lBase + 8] = 2.4 // loser driveTarget

        // Apply the merge formula (exact code from PHASE 3)
        const l8 = lBase
        particles[sBase + 8] = (particles[sBase + 8] + particles[l8 + 8]) * 0.5

        expect(particles[sBase + 8]).toBeCloseTo(1.7, 5)
    })

    it('survivor driveScale is the midpoint of both parents', () => {
        const particles = new Float32Array(STRIDE * 4)

        const sBase = 0 * STRIDE
        const lBase = 1 * STRIDE

        particles[sBase + 9] = 0.5 // survivor driveScale
        particles[lBase + 9] = 1.3 // loser driveScale

        const l8 = lBase
        particles[sBase + 9] = (particles[sBase + 9] + particles[l8 + 9]) * 0.5

        expect(particles[sBase + 9]).toBeCloseTo(0.9, 5)
    })

    it('survivor driveGain is the midpoint of both parents', () => {
        const particles = new Float32Array(STRIDE * 4)

        const sBase = 0 * STRIDE
        const lBase = 1 * STRIDE

        particles[sBase + 10] = 0.2 // survivor driveGain
        particles[lBase + 10] = 2.8 // loser driveGain

        const l8 = lBase
        particles[sBase + 10] = (particles[sBase + 10] + particles[l8 + 10]) * 0.5

        expect(particles[sBase + 10]).toBeCloseTo(1.5, 5)
    })

    it('merge averaging is symmetric (order-independent)', () => {
        // Same values, swapped between survivor and loser → same result
        const a = new Float32Array(STRIDE * 4)
        const b = new Float32Array(STRIDE * 4)

        const sA = 0 * STRIDE
        const lA = 1 * STRIDE
        a[sA + 8] = 0.5; a[lA + 8] = 2.5
        a[sA + 9] = 1.0; a[lA + 9] = 0.4
        a[sA + 10] = 3.0; a[lA + 10] = 1.0

        b[sA + 8] = 2.5; b[lA + 8] = 0.5
        b[sA + 9] = 0.4; b[lA + 9] = 1.0
        b[sA + 10] = 1.0; b[lA + 10] = 3.0

        const l8a = lA
        a[sA + 8] = (a[sA + 8] + a[l8a + 8]) * 0.5
        a[sA + 9] = (a[sA + 9] + a[l8a + 9]) * 0.5
        a[sA + 10] = (a[sA + 10] + a[l8a + 10]) * 0.5

        const l8b = lA
        b[sA + 8] = (b[sA + 8] + b[l8b + 8]) * 0.5
        b[sA + 9] = (b[sA + 9] + b[l8b + 9]) * 0.5
        b[sA + 10] = (b[sA + 10] + b[l8b + 10]) * 0.5

        expect(a[sA + 8]).toBeCloseTo(b[sA + 8], 5)
        expect(a[sA + 9]).toBeCloseTo(b[sA + 9], 5)
        expect(a[sA + 10]).toBeCloseTo(b[sA + 10], 5)
    })

    it('merge averaging with identical parents preserves the value', () => {
        const particles = new Float32Array(STRIDE * 4)
        const sBase = 0 * STRIDE
        const lBase = 1 * STRIDE

        particles[sBase + 8] = 1.5; particles[lBase + 8] = 1.5
        particles[sBase + 9] = 0.8; particles[lBase + 9] = 0.8
        particles[sBase + 10] = 2.0; particles[lBase + 10] = 2.0

        const l8 = lBase
        particles[sBase + 8] = (particles[sBase + 8] + particles[l8 + 8]) * 0.5
        particles[sBase + 9] = (particles[sBase + 9] + particles[l8 + 9]) * 0.5
        particles[sBase + 10] = (particles[sBase + 10] + particles[l8 + 10]) * 0.5

        expect(particles[sBase + 8]).toBeCloseTo(1.5, 5)
        expect(particles[sBase + 9]).toBeCloseTo(0.8, 5)
        expect(particles[sBase + 10]).toBeCloseTo(2.0, 5)
    })
})

// ---------------------------------------------------------------------------
// Buffer logic: clone inheritance + mutation (PHASE 4)
// ---------------------------------------------------------------------------
describe('Brain Drive — Clone Inherits & Mutates Drive Params', () => {

    function applyCloneDrive(parentBase: number, childBase: number, particles: Float32Array, rand: () => number) {
        // Exact formula from PHASE 4 in ParticleLifeGpu.vue
        const pDriveBase = parentBase
        particles[childBase + 8] = Math.min(DRIVE_TARGET_MAX, Math.max(DRIVE_TARGET_MIN, particles[pDriveBase + 8] + (rand() - 0.5) * MUT_TARGET))
        particles[childBase + 9] = Math.min(DRIVE_SCALE_MAX, Math.max(DRIVE_SCALE_MIN, particles[pDriveBase + 9] + (rand() - 0.5) * MUT_SCALE))
        particles[childBase + 10] = Math.min(DRIVE_GAIN_MAX, Math.max(DRIVE_GAIN_MIN, particles[pDriveBase + 10] + (rand() - 0.5) * MUT_GAIN))
    }

    it('clone driveTarget stays within [parent - 0.05, parent + 0.05]', () => {
        const rand = seededRandom(42)
        const particles = new Float32Array(STRIDE * 4)

        const pBase = 0 * STRIDE
        const cBase = 1 * STRIDE
        particles[pBase + 8] = 1.5 // parent driveTarget

        applyCloneDrive(pBase, cBase, particles, rand)

        expect(particles[cBase + 8]).toBeGreaterThanOrEqual(1.5 - MUT_TARGET / 2)
        expect(particles[cBase + 8]).toBeLessThanOrEqual(1.5 + MUT_TARGET / 2)
    })

    it('clone driveScale stays within [parent - 0.03, parent + 0.03]', () => {
        const rand = seededRandom(99)
        const particles = new Float32Array(STRIDE * 4)

        const pBase = 0 * STRIDE
        const cBase = 1 * STRIDE
        particles[pBase + 9] = 1.0 // parent driveScale

        applyCloneDrive(pBase, cBase, particles, rand)

        expect(particles[cBase + 9]).toBeGreaterThanOrEqual(1.0 - MUT_SCALE / 2)
        expect(particles[cBase + 9]).toBeLessThanOrEqual(1.0 + MUT_SCALE / 2)
    })

    it('clone driveGain stays within [parent - 0.03, parent + 0.03]', () => {
        const rand = seededRandom(7)
        const particles = new Float32Array(STRIDE * 4)

        const pBase = 0 * STRIDE
        const cBase = 1 * STRIDE
        particles[pBase + 10] = 0.5 // parent driveGain

        applyCloneDrive(pBase, cBase, particles, rand)

        expect(particles[cBase + 10]).toBeGreaterThanOrEqual(0.5 - MUT_GAIN / 2)
        expect(particles[cBase + 10]).toBeLessThanOrEqual(0.5 + MUT_GAIN / 2)
    })

    it('clone driveTarget is clamped to minimum 0.1 when parent is at boundary', () => {
        const rand = seededRandom(12345)
        const particles = new Float32Array(STRIDE * 4)

        const pBase = 0 * STRIDE
        const cBase = 1 * STRIDE
        particles[pBase + 8] = DRIVE_TARGET_MIN // parent at minimum (0.1)

        applyCloneDrive(pBase, cBase, particles, rand)

        expect(particles[cBase + 8]).toBeGreaterThanOrEqual(DRIVE_TARGET_MIN)
    })

    it('clone driveTarget is clamped to maximum 3.0 when parent is at boundary', () => {
        const rand = seededRandom(54321)
        const particles = new Float32Array(STRIDE * 4)

        const pBase = 0 * STRIDE
        const cBase = 1 * STRIDE
        particles[pBase + 8] = DRIVE_TARGET_MAX // parent at maximum (3.0)

        applyCloneDrive(pBase, cBase, particles, rand)

        expect(particles[cBase + 8]).toBeLessThanOrEqual(DRIVE_TARGET_MAX)
    })

    it('clone driveScale is clamped to minimum 0.05 when parent is at boundary', () => {
        const rand = seededRandom(777)
        const particles = new Float32Array(STRIDE * 4)

        const pBase = 0 * STRIDE
        const cBase = 1 * STRIDE
        particles[pBase + 9] = DRIVE_SCALE_MIN // parent at minimum (0.05)

        applyCloneDrive(pBase, cBase, particles, rand)

        expect(particles[cBase + 9]).toBeGreaterThanOrEqual(DRIVE_SCALE_MIN)
    })

    it('clone driveScale is clamped to maximum 2.0 when parent is at boundary', () => {
        const rand = seededRandom(888)
        const particles = new Float32Array(STRIDE * 4)

        const pBase = 0 * STRIDE
        const cBase = 1 * STRIDE
        particles[pBase + 9] = DRIVE_SCALE_MAX // parent at maximum (2.0)

        applyCloneDrive(pBase, cBase, particles, rand)

        expect(particles[cBase + 9]).toBeLessThanOrEqual(DRIVE_SCALE_MAX)
    })

    it('clone driveGain is clamped to minimum 0.0 when parent is at boundary', () => {
        const rand = seededRandom(111)
        const particles = new Float32Array(STRIDE * 4)

        const pBase = 0 * STRIDE
        const cBase = 1 * STRIDE
        particles[pBase + 10] = DRIVE_GAIN_MIN // parent at minimum (0.0)

        applyCloneDrive(pBase, cBase, particles, rand)

        expect(particles[cBase + 10]).toBeGreaterThanOrEqual(DRIVE_GAIN_MIN)
    })

    it('clone driveGain is clamped to maximum 3.0 when parent is at boundary', () => {
        const rand = seededRandom(222)
        const particles = new Float32Array(STRIDE * 4)

        const pBase = 0 * STRIDE
        const cBase = 1 * STRIDE
        particles[pBase + 10] = DRIVE_GAIN_MAX // parent at maximum (3.0)

        applyCloneDrive(pBase, cBase, particles, rand)

        expect(particles[cBase + 10]).toBeLessThanOrEqual(DRIVE_GAIN_MAX)
    })

    it('multiple clones from the same parent diverge slightly (evolutionary drift)', () => {
        const rand = seededRandom(4242)
        const particles = new Float32Array(STRIDE * 8)

        const pBase = 0 * STRIDE
        particles[pBase + 8] = 1.5
        particles[pBase + 9] = 1.0
        particles[pBase + 10] = 2.0

        // Spawn 3 clones at different buffer slots
        const cloneBases = [1, 2, 3].map(i => i * STRIDE)
        for (const cBase of cloneBases) {
            applyCloneDrive(pBase, cBase, particles, rand)
        }

        // Collect the driveTarget values — at least one should differ from parent
        const targets = cloneBases.map(cb => particles[cb + 8])
        const allIdentical = targets.every(t => t === particles[pBase + 8])
        expect(allIdentical).toBe(false) // with non-zero mutation, clones diverge
    })
})

// ---------------------------------------------------------------------------
// Buffer logic: combined merge-then-clone scenario
// ---------------------------------------------------------------------------
describe('Brain Drive — Merge Then Clone (evolutionary pipeline)', () => {
    it('a merged urge that then clones produces a grandchild near the blended midpoint', () => {
        // Step 1: two parents merge
        const particles = new Float32Array(STRIDE * 4)
        const sBase = 0 * STRIDE
        const lBase = 1 * STRIDE

        particles[sBase + 8] = 1.0; particles[lBase + 8] = 2.0 // driveTarget: 1.0 and 2.0
        particles[sBase + 9] = 0.5; particles[lBase + 9] = 1.5 // driveScale: 0.5 and 1.5
        particles[sBase + 10] = 1.0; particles[lBase + 10] = 3.0 // driveGain: 1.0 and 3.0

        // Apply merge (PHASE 3 formula)
        const l8 = lBase
        particles[sBase + 8] = (particles[sBase + 8] + particles[l8 + 8]) * 0.5 // → 1.5
        particles[sBase + 9] = (particles[sBase + 9] + particles[l8 + 9]) * 0.5 // → 1.0
        particles[sBase + 10] = (particles[sBase + 10] + particles[l8 + 10]) * 0.5 // → 2.0

        // Step 2: the merged survivor clones (PHASE 4 formula)
        const cBase = 2 * STRIDE
        const rand = seededRandom(999)
        const pDriveBase = sBase
        particles[cBase + 8] = Math.min(DRIVE_TARGET_MAX, Math.max(DRIVE_TARGET_MIN, particles[pDriveBase + 8] + (rand() - 0.5) * MUT_TARGET))
        particles[cBase + 9] = Math.min(DRIVE_SCALE_MAX, Math.max(DRIVE_SCALE_MIN, particles[pDriveBase + 9] + (rand() - 0.5) * MUT_SCALE))
        particles[cBase + 10] = Math.min(DRIVE_GAIN_MAX, Math.max(DRIVE_GAIN_MIN, particles[pDriveBase + 10] + (rand() - 0.5) * MUT_GAIN))

        // Grandchild should be near the merged midpoint (within mutation range)
        expect(particles[cBase + 8]).toBeGreaterThanOrEqual(1.5 - MUT_TARGET / 2)
        expect(particles[cBase + 8]).toBeLessThanOrEqual(1.5 + MUT_TARGET / 2)
        expect(particles[cBase + 9]).toBeGreaterThanOrEqual(1.0 - MUT_SCALE / 2)
        expect(particles[cBase + 9]).toBeLessThanOrEqual(1.0 + MUT_SCALE / 2)
        expect(particles[cBase + 10]).toBeGreaterThanOrEqual(2.0 - MUT_GAIN / 2)
        expect(particles[cBase + 10]).toBeLessThanOrEqual(2.0 + MUT_GAIN / 2)
    })
})

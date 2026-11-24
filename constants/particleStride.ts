/**
 * GPU Particle Buffer — stride & field layout.
 *
 * This is the SINGLE SOURCE OF TRUTH for the particle record layout shared
 * between the CPU (Float32Array) and every WGSL shader that declares
 * `struct Particle`. If you add/remove a field in any shader, you MUST
 * update this constant — the regression test (`wgslStrideConsistency.test.ts`)
 * will fail if the JS stride and WGSL field count diverge.
 */

/** Number of f32 values per particle (== number of fields in `struct Particle`). */
export const PARTICLE_STRIDE = 11 as const

/** Byte size of one particle record (stride × 4 bytes/f32). Used for GPU buffer sizing. */
export const PARTICLE_BYTES = PARTICLE_STRIDE * 4 // 44

/**
 * Field offsets within a single particle record.
 * Use these instead of magic numbers: `buf[particleBase(i) + P.vx]`
 */
export const P = {
    x:           0,
    y:           1,
    vx:          2,
    vy:          3,
    particleType: 4,
    control:     5,
    signal:      6,
    goalB:       7,
    driveTarget: 8,
    driveScale:  9,
    driveGain:   10,
} as const

/** Compute the flat buffer index for particle `i`'s first field. */
export function particleBase(i: number): number {
    return i * PARTICLE_STRIDE
}

// =============================================================================
// Brain Mutate — Slow Drift of Per-Urge Drive Parameters
//
// Single workgroup (64 threads). Runs AFTER the force pass each frame.
// Applies a tiny random perturbation to each urge's driveTarget/driveScale/driveGain,
// scaled by a per-urge "changeability" derived from its local index.
//
// This is the SLOW tier of the two-tier genome: drives drift over time while
// the network weights (in brainWeightsBuffer) stay frozen.
//
// Mutation model:
//   For each urge u with local index k:
//     changeability = 0.02 + 0.98 * hash(k, salt=7)  // [0.02, 1.0]
//     driveTarget += gauss() * 0.005 * changeability
//     driveScale  *= 1 + gauss() * 0.003 * changeability
//     driveGain   += gauss() * 0.003 * changeability
//   All clamped to valid ranges.
// =============================================================================

const MAX_URGES : u32 = 64u;

struct Particle {
    x : f32,
    y : f32,
    vx : f32,
    vy : f32,
    particleType : f32,
    control : f32,
    signal  : f32,
    goalB   : f32,
    driveTarget : f32,
    driveScale  : f32,
    driveGain   : f32,
};

struct MutateOpts {
    numUrges : u32,
    numTypes : u32,
    frameCount : u32, // used as RNG seed so mutations differ each frame
};

// Simple hash-based pseudo-random (no external state needed)
fn hash(n: u32) -> f32 {
    var x = n * 747796405u + 2891336453u;
    x = (x ^ (x >> 16u)) * 2246822507u;
    x = (x ^ (x >> 13u)) * 3266489909u;
    x = x ^ (x >> 16u);
    return f32(x) / 4294967295.0; // [0, 1)
}

// Approximate Gaussian via sum of 3 uniform randoms (Irwin-Hall), centered at 0
fn gauss3(salt: u32, seed: u32) -> f32 {
    let a = hash(salt * 31u + seed);
    let b = hash(salt * 61u + seed + 1u);
    let c = hash(salt * 97u + seed + 2u);
    return (a + b + c - 1.5) * 1.1547; // ~N(0,1) approximation
}

@group(0) @binding(0) var<storage, read_write> particles : array<Particle>;
@group(1) @binding(0) var<uniform> opts : MutateOpts;

@compute @workgroup_size(64)
fn main(@builtin(local_invocation_id) lid : vec3<u32>) {
    let tid = lid.x;
    let nU = min(opts.numUrges, MAX_URGES);
    if (tid >= nU) { return; }

    // Urge particle index in the buffer
    let pIdx = opts.numTypes + tid;
    var p = particles[pIdx];

    // Per-urge changeability: deterministic from local index (hardcoded "species" trait)
    // Low values = frozen drives (hunger, thirst), high = plastic (curiosity, play)
    let changeability = 0.02 + 0.98 * hash(tid);

    // Frame-based seed so each frame produces different mutations
    let seed = opts.frameCount;

    // Apply small perturbations scaled by changeability
    p.driveTarget += gauss3(tid, seed) * 0.005 * changeability;
    p.driveScale *= 1.0 + gauss3(tid + 100u, seed) * 0.003 * changeability;
    p.driveGain += gauss3(tid + 200u, seed) * 0.003 * changeability;

    // Clamp to valid ranges
    p.driveTarget = clamp(p.driveTarget, 0.1, 3.0);
    p.driveScale = clamp(p.driveScale, 0.05, 2.0);
    p.driveGain = clamp(p.driveGain, 0.0, 3.0);

    particles[pIdx] = p;
}

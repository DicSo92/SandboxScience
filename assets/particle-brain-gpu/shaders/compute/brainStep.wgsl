// =============================================================================
// Brain Step — Recurrent Network Mapping Urge Errors → Neuron Modulations
//
// Single workgroup (64 threads). Runs BEFORE the force pass each frame.
// Reads previous-frame urge signals + drive params from the particle buffer,
// computes errors, runs a small recurrent network, and writes per-neuron modulations.
//
// Architecture:
//   error[u]  = clamp((driveTarget_u - signal_u) / driveScale_u, -1, 1) * driveGain_u
//   h_new[i]  = tanh( sum_u W_down[i,u]*error[u] + sum_j W_recur[i,j]*h[j] + b[i] )
//   mod[n]    = clamp( tanh(groupW[group(n)] dot h_new) + bias[n], -1, 1 )
//
// Drive params (target/scale/gain) are PER-PARTICLE — they live in the particle buffer
// and can be mutated/cloned/merged by other passes. The network weights are global.
// =============================================================================

const H : u32 = 8u;        // hidden units
const G : u32 = 16u;       // neuron groups
const MAX_URGES : u32 = 64u;
const MAX_NEURONS : u32 = 128u;

struct BrainWeights {
    W_down : array<f32, 512>,      // [H * MAX_URGES] (padded)
    b_down : array<f32, 8>,        // [H]
    W_recur : array<f32, 64>,      // [H * H]
    groupW : array<f32, 128>,      // [G * H]
    biases : array<f32, 128>,      // [MAX_NEURONS] (padded)
};

struct Particle {
    x : f32,
    y : f32,
    vx : f32,
    vy : f32,
    particleType : f32,
    control : f32,
    signal  : f32,
    goalB   : f32,
    driveTarget : f32, // brain: desired metric value (homeostasis setpoint)
    driveScale  : f32, // brain: error normalisation (sensitivity)
    driveGain   : f32, // brain: weight of this urge's error into the network
};

struct BrainOpts {
    numUrges : u32,
    numNeurons : u32,
    numTypes : u32,
};

// Workgroup memory for sharing within the single workgroup
var<workgroup> wg_errors : array<f32, MAX_URGES>;
var<workgroup> wg_hNew   : array<f32, 8>;
var<workgroup> wg_hPrev  : array<f32, 8>;

@group(0) @binding(0) var<storage, read> particles : array<Particle>;       // previous frame (temp buffer)
@group(0) @binding(1) var<storage, read_write> brainState : array<f32, 8>;  // persistent hidden state [H]
@group(0) @binding(2) var<storage, read> weights : BrainWeights;            // network weights (global, frozen)
@group(0) @binding(3) var<storage, read_write> neuronMods : array<f32, MAX_NEURONS>; // output: per-neuron modulation

@group(1) @binding(0) var<uniform> brainOpts : BrainOpts;

@compute @workgroup_size(64)
fn main(@builtin(local_invocation_id) lid : vec3<u32>) {
    let tid = lid.x;
    let nU = min(brainOpts.numUrges, MAX_URGES);
    let nN = min(brainOpts.numNeurons, MAX_NEURONS);

    // --- Phase 1: Compute urge errors (threads 0..nU-1) ---
    // Drive params are read FROM THE PARTICLE — they are per-particle and evolvable.
    if (tid < nU) {
        let pIdx = brainOpts.numTypes + tid;
        let p = particles[pIdx];

        let tgtVal = p.driveTarget;
        let scl    = max(p.driveScale, 0.1);
        let gain   = p.driveGain;

        // Error: how far is current metric from target? Positive = "too little" (want more)
        let error = clamp((tgtVal - p.signal) / scl, -1.0, 1.0);
        wg_errors[tid] = error * gain;
    } else {
        wg_errors[tid] = 0.0;
    }

    // --- Phase 2: Load previous hidden state into workgroup memory ---
    if (tid < H) {
        wg_hPrev[tid] = brainState[tid];
    }

    workgroupBarrier();

    // --- Phase 3: Compute new hidden state (threads 0..H-1) ---
    if (tid < H) {
        let i = tid;
        var val : f32 = weights.b_down[i];

        // W_down @ errors: sum over all urges
        for (var u = 0u; u < nU; u += 1u) {
            val += weights.W_down[i * MAX_URGES + u] * wg_errors[u];
        }

        // W_recur @ h_prev: sum over hidden units
        for (var j = 0u; j < H; j += 1u) {
            val += weights.W_recur[i * H + j] * wg_hPrev[j];
        }

        wg_hNew[i] = tanh(val);
    }

    workgroupBarrier();

    // --- Phase 4: Write new hidden state back to persistent buffer ---
    if (tid < H) {
        brainState[tid] = wg_hNew[tid];
    }

    // --- Phase 5: Compute neuron modulations (threads 0..nN-1) ---
    if (tid < nN) {
        let n = tid;

        // Determine this neuron's group: n % G
        let grp = n % G;

        // mod = tanh(groupW[grp] dot h_new) + bias[n]
        var val : f32 = 0.0;
        for (var i = 0u; i < H; i += 1u) {
            val += weights.groupW[grp * H + i] * wg_hNew[i];
        }
        val = tanh(val) + weights.biases[n];

        // Clamp to [-1, 1]
        neuronMods[n] = clamp(val, -1.0, 1.0);
    }
}

// =============================================================================
// Debug: emit "dotted line" dots connecting each URGE to every NEURON within
// electrical.neuronRadius. One work item per urge; the inner loop scans neurons.
// Dots are written to a grow-only buffer (guarded by an atomic counter) and drawn
// by render_connections.wgsl as small additive billboards -> a light dotted line.
// =============================================================================
struct SimOptions {
    simWidth: f32,
    simHeight: f32,
    gridWidth: u32,
    gridHeight: u32,
    cellSize: f32,
    numParticles: u32,
    numTypes: u32,
    particleSize: f32,
    particleOpacity: f32,
    isWallRepel: u32,
    isWallWrap: u32,
    forceFactor: f32,
    frictionFactor: f32,
    repel: f32,
    extendedGridWidth: u32,
    extendedGridHeight: u32,
    gridOffsetX: u32,
    gridOffsetY: u32,
    mirrorWrapCount: u32,
    cellSubdivisions: u32,
};
struct ElectricalOptions {
    enabled: u32,
    metricMode: u32,
    numUrges: u32,
    numNeurons: u32,
    urgeRadius: f32,
    neuronRadius: f32,
    urgeForce: f32,
    controlGain: f32,
    controlMax: f32,
    neuronInfluence: f32,
    neuronAuthority: f32,
    maxAuthority: f32,
    cohesion: f32,
    numSenseNeurons: u32,// needed for the dormant sentinel (sense band sits between motor neurons and the pool)
};
struct Particle {
    x : f32,
    y : f32,
    vx : f32,
    vy : f32,
    particleType : f32,
    control : f32,
    signal  : f32,
    goalB   : f32, // secondary goal index (local k), -1 if none
    driveTarget : f32, // brain: desired metric value (homeostasis setpoint)
    driveScale  : f32, // brain: error normalisation (sensitivity)
    driveGain   : f32, // brain: weight of this urge's error into the network
}
struct ConnDot {
    pos: vec2<f32>,
    col: vec3<f32>,
};

const MAX_CONN_DOTS: u32 = 32768u;
const DOTS_PER_SEG: u32 = 8u;

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<storage, read_write> connDots: array<ConnDot>;
@group(0) @binding(2) var<storage, read_write> connCount: atomic<u32>;

@group(1) @binding(0) var<uniform> options: SimOptions;
@group(2) @binding(0) var<uniform> electrical: ElectricalOptions;

const URGE_COL = vec3<f32>(0.45, 0.90, 1.0);   // cyan (matches urges)
const NEURON_COL = vec3<f32>(1.0, 0.62, 0.20); // warm orange (matches neurons)

@compute @workgroup_size(64)
fn emitConnections(@builtin(global_invocation_id) id: vec3u) {
    if (id.x >= electrical.numUrges) { return; }

    // Urges & neurons are scattered through the buffer by the spatial sort, so locate this
    // urge by its type code (exactly one particle per urge index) instead of a fixed slot.
    let urgeType = f32(options.numTypes + id.x);
    var ax = 0.0;
    var ay = 0.0;
    var found = false;
    for (var i = 0u; i < options.numParticles; i += 1u) {
        let p = particles[i];
        if (p.particleType == urgeType) { ax = p.x; ay = p.y; found = true; break; }
    }
    if (!found) { return; }

    // Motor neurons are the type codes in [numTypes+numUrges, +numNeurons); they too are
    // scattered, so we scan every particle and skip anything that is not a motor neuron.
    let neuronBase = f32(options.numTypes + electrical.numUrges);
    // Sense neurons (next band) and dormant clone-pool slots (type == the full sentinel)
    // are NOT motor neurons: they do not get urge->neuron connection lines.
    let dormantType = f32(options.numTypes + electrical.numUrges + electrical.numNeurons + electrical.numSenseNeurons);
    let halfW = options.simWidth * 0.5;
    let halfH = options.simHeight * 0.5;
    let wrapping = options.isWallWrap == 1u;
    let nR = max(electrical.neuronRadius, 1.0);
    let nR2 = nR * nR;

    for (var n = 0u; n < options.numParticles; n += 1u) {
        let b = particles[n];
        if (b.particleType < neuronBase || b.particleType >= dormantType) { continue; } // matter, urge, or dormant -> not a neuron
        var dx = b.x - ax;
        var dy = b.y - ay;
        if (wrapping) {
            if (dx > halfW) { dx -= options.simWidth; }
            else if (dx < -halfW) { dx += options.simWidth; }
            if (dy > halfH) { dy -= options.simHeight; }
            else if (dy < -halfH) { dy += options.simHeight; }
        }
        let d2 = dx * dx + dy * dy;
        if (d2 >= nR2 || d2 < 0.0001) { continue; }

        // Emit a dotted line from the urge to this neuron.
        for (var k = 0u; k < DOTS_PER_SEG; k += 1u) {
            let t = f32(k) / f32(DOTS_PER_SEG - 1u);
            var px = ax + dx * t;
            var py = ay + dy * t;
            // keep dots inside the sim box when wrapping (the segment may cross a seam)
            if (wrapping) {
                if (px < 0.0) { px += options.simWidth; } else if (px >= options.simWidth) { px -= options.simWidth; }
                if (py < 0.0) { py += options.simHeight; } else if (py >= options.simHeight) { py -= options.simHeight; }
            }
            let idx = atomicAdd(&connCount, 1u);
            if (idx >= MAX_CONN_DOTS) { break; } // buffer full -> stop emitting
            connDots[idx] = ConnDot(vec2<f32>(px, py), mix(URGE_COL, NEURON_COL, t));
        }
    }
}

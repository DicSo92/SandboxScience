struct Particle {
    x: f32,
    y: f32,
    vx: f32,
    vy: f32,
    particleType: f32,
}

struct SimOptions {
    simWidth: f32,
    simHeight: f32,
    gridWidth: u32,
    gridHeight: u32,
    cellSize: f32, // = currentMaxRadius
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
}

// Tracker state persisted across frames
struct TrackerState {
    x: f32,
    y: f32,
    vx: f32,
    vy: f32,
    searchRadius: f32,
    expectedCount: u32,
    baseCameraX: f32,
    baseCameraY: f32,
}

// Accumulator for each search radius level (uses atomics for parallel accumulation)
struct LevelAccum {
    sumDx: atomic<i32>,
    sumDy: atomic<i32>,
    sumVx: atomic<i32>,
    sumVy: atomic<i32>,
    totalWeight: atomic<i32>,
    count: atomic<u32>,
    _padding1: u32,
    _padding2: u32,
}

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<storage, read_write> trackerState: TrackerState;
@group(0) @binding(2) var<storage, read_write> levels: array<LevelAccum, 4>;
@group(1) @binding(0) var<uniform> simOptions: SimOptions;
@group(2) @binding(0) var<uniform> deltaTime: f32;

const SCALE: f32 = 100.0;        // Fixed-point scale for atomic integer operations
const SCALE_INV: f32 = 0.01;     // Precomputed 1/SCALE
const MIN_RADIUS: f32 = 16.0;    // Minimum search radius (pixels)
const MIN_PARTICLES: u32 = 16u;  // Minimum particles for valid tracking
const NUM_LEVELS: u32 = 4u;      // Number of search radius levels
const RADIUS_MULTIPLIER = array<f32, 4>(1.0, 1.4, 1.8, 2.5); // Radius multipliers
const RADIUS_MULTIPLIER_SQ = array<f32, 4>(1.0, 1.96, 3.24, 6.25); // Precomputed squares
const RADIUS_MULTIPLIER_INV = array<f32, 4>(1.0, 0.71428571, 0.55555556, 0.4); // Precomputed 1/mult

// Pass 1: Accumulate particles into appropriate radius levels
@compute @workgroup_size(256)
fn accumulateParticles(@builtin(global_invocation_id) globalId: vec3u) {
    let tid = globalId.x;
    if (tid >= simOptions.numParticles) { return; }

    // Cache tracker state locally (avoid repeated memory reads)
    let tX = trackerState.x;
    let tY = trackerState.y;
    let tVx = trackerState.vx;
    let tVy = trackerState.vy;

    let baseRadius = max(simOptions.cellSize * 2.0 * 0.8, MIN_RADIUS);
    let baseRadiusSq = baseRadius * baseRadius;
    let baseRadiusInv = 1.0 / baseRadius;

    // Predicted reference position based on velocity (matches physics: vel *= 1-friction, pos += vel*dt)
    let predFactor = (1.0 - simOptions.frictionFactor) * deltaTime;
    let refX = tX + tVx * predFactor;
    let refY = tY + tVy * predFactor;

    let particle = particles[tid];
    let dx = particle.x - refX;
    let dy = particle.y - refY;
    let distSq = dx * dx + dy * dy;

    // Early exit if outside max radius
    let maxRadiusSq = baseRadiusSq * RADIUS_MULTIPLIER_SQ[NUM_LEVELS - 1u];
    if (distSq > maxRadiusSq) { return; }

    // Find smallest level containing this particle
    var minLevel: u32 = NUM_LEVELS - 1u;
    for (var lvl: u32 = 0u; lvl < NUM_LEVELS; lvl++) {
        if (distSq <= baseRadiusSq * RADIUS_MULTIPLIER_SQ[lvl]) {
            minLevel = lvl;
            break;
        }
    }

    // Compute distance using inverseSqrt (faster than sqrt + division)
    let distInv = inverseSqrt(max(distSq, 0.0001));
    let dist = distSq * distInv;

    // Directional bonus: favor particles in movement direction (0.7x to 1.3x)
    let speedSq = tVx * tVx + tVy * tVy;
    var dirBonus: f32 = 1.0;
    if (speedSq > 0.01) {
        let speedInv = inverseSqrt(speedSq);
        let alignment = (tVx * dx + tVy * dy) * speedInv * distInv;
        dirBonus = 1.0 + alignment * 0.3;
    }

    // Add particle to all levels >= minLevel (inclusive hierarchy)
    let normalizedDistBase = dist * baseRadiusInv;
    for (var lvl: u32 = minLevel; lvl < NUM_LEVELS; lvl++) {
        let lvlNormalizedDist = normalizedDistBase * RADIUS_MULTIPLIER_INV[lvl];
        let weight = exp(-lvlNormalizedDist * lvlNormalizedDist * 2.0) * dirBonus * SCALE;

        atomicAdd(&levels[lvl].sumDx, i32(dx * weight));
        atomicAdd(&levels[lvl].sumDy, i32(dy * weight));
        atomicAdd(&levels[lvl].sumVx, i32(particle.vx * weight));
        atomicAdd(&levels[lvl].sumVy, i32(particle.vy * weight));
        atomicAdd(&levels[lvl].totalWeight, i32(weight));
        atomicAdd(&levels[lvl].count, 1u);
    }
}

// Pass 2: Finalize tracker position using the most precise valid level
@compute @workgroup_size(1)
fn finalizeTracker() {
    let baseRadius = max(simOptions.cellSize * 2.0 * 0.8, MIN_RADIUS);
    let predFactor = (1.0 - simOptions.frictionFactor) * deltaTime;
    let expectedCount = trackerState.expectedCount;

    // Dynamic threshold: 15% of expectedCount, minimum MIN_PARTICLES
    let dynamicMinParticles = max(MIN_PARTICLES, u32(f32(expectedCount) * 0.15));

    // Find first level (most precise) with enough particles
    var bestLevel: i32 = -1;
    for (var lvl: u32 = 0u; lvl < NUM_LEVELS; lvl++) {
        let count = atomicLoad(&levels[lvl].count);
        if (count >= dynamicMinParticles) {
            bestLevel = i32(lvl);
            break;
        }
    }

    if (bestLevel >= 0) {
        let lvl = u32(bestLevel);
        let totalWeight = f32(atomicLoad(&levels[lvl].totalWeight)) * SCALE_INV;
        let currentCount = atomicLoad(&levels[lvl].count);
        let totalWeightInv = 1.0 / max(totalWeight, 0.001);

        // Compute weighted center of mass offset
        let offsetX = f32(atomicLoad(&levels[lvl].sumDx)) * SCALE_INV * totalWeightInv;
        let offsetY = f32(atomicLoad(&levels[lvl].sumDy)) * SCALE_INV * totalWeightInv;
        let newVx = f32(atomicLoad(&levels[lvl].sumVx)) * SCALE_INV * totalWeightInv;
        let newVy = f32(atomicLoad(&levels[lvl].sumVy)) * SCALE_INV * totalWeightInv;

        // Apply offset to predicted position
        let predX = trackerState.x + trackerState.vx * predFactor;
        let predY = trackerState.y + trackerState.vy * predFactor;

        trackerState.x = predX + offsetX;
        trackerState.y = predY + offsetY;
        trackerState.vx = newVx;
        trackerState.vy = newVy;
        trackerState.searchRadius = baseRadius * RADIUS_MULTIPLIER[lvl];

        // Smooth expectedCount update (97% old + 3% new)
        let newExpected = u32(f32(expectedCount) * 0.97 + f32(currentCount) * 0.03);
        trackerState.expectedCount = max(newExpected, MIN_PARTICLES);
    } else {
        // No valid level found: decelerate and continue in predicted direction
        trackerState.vx *= 0.98;
        trackerState.vy *= 0.98;
        trackerState.x = trackerState.x + trackerState.vx * predFactor;
        trackerState.y = trackerState.y + trackerState.vy * predFactor;

        trackerState.searchRadius = baseRadius * RADIUS_MULTIPLIER[NUM_LEVELS - 1u];

        // Decay expectedCount to allow re-initialization
        let newExpected = u32(f32(expectedCount) * 0.95);
        trackerState.expectedCount = max(newExpected, MIN_PARTICLES);
    }

    // Ensure expectedCount never drops below MIN_PARTICLES
    trackerState.expectedCount = max(trackerState.expectedCount, MIN_PARTICLES);

    // Reset all levels for next frame
    for (var lvl: u32 = 0u; lvl < NUM_LEVELS; lvl++) {
        atomicStore(&levels[lvl].sumDx, 0);
        atomicStore(&levels[lvl].sumDy, 0);
        atomicStore(&levels[lvl].sumVx, 0);
        atomicStore(&levels[lvl].sumVy, 0);
        atomicStore(&levels[lvl].totalWeight, 0);
        atomicStore(&levels[lvl].count, 0u);
    }
}
struct InteractionMatrix { data: array<u32> };
struct SimOptions {
    simWidth: f32,
    simHeight: f32,
    simDepth: f32,
    gridWidth: u32,
    gridHeight: u32,
    gridDepth: u32,
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
    extendedGridDepth: u32,
    gridOffsetX: u32,
    gridOffsetY: u32,
    gridOffsetZ: u32,
    cellSubdivisions: u32,
};
struct Particle {
    x : f32,
    y : f32,
    z : f32,
    vx : f32,
    vy : f32,
    vz : f32,
    particleType : f32,
}

fn get_interaction(index: u32) -> vec3<f32> {
    let word = interactions.data[index];
    let rule = (f32((word >> 0u) & 0xFFu) - 100.0) * 0.01;
    let minR = f32((word >> 8u) & 0xFFFu);
    let maxR = f32((word >> 20u) & 0xFFFu);
    return vec3<f32>(rule, minR, maxR);
}

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<storage, read_write> particlesDestination : array<Particle>;
@group(0) @binding(2) var<storage, read> interactions: InteractionMatrix;
@group(1) @binding(0) var<uniform> options: SimOptions;
@group(2) @binding(0) var<uniform> deltaTime: f32;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let i = id.x;
    if (i >= options.numParticles) { return; }

    let half_width = options.simWidth * 0.5;
    let half_height = options.simHeight * 0.5;
    let half_depth = options.simDepth * 0.5;
    let is_wrapping = options.isWallWrap == 1u;

    var particle = particles[i];
    let typeA = u32(particle.particleType);
    var velocitySum = vec3<f32>(0.0, 0.0, 0.0);

    for (var j = 0u; j < options.numParticles; j = j + 1u) {
        if (i == j) { continue; }

        let other = particles[j];
        let typeB = u32(other.particleType);
        var dx = other.x - particle.x;
        var dy = other.y - particle.y;
        var dz = other.z - particle.z;

        if (is_wrapping) {
            if (dx > half_width) { dx -= options.simWidth; }
            else if (dx < -half_width) { dx += options.simWidth; }
            if (dy > half_height) { dy -= options.simHeight; }
            else if (dy < -half_height) { dy += options.simHeight; }
            if (dz > half_depth) { dz -= options.simDepth; }
            else if (dz < -half_depth) { dz += options.simDepth; }
        }

        let dist = sqrt(dx * dx + dy * dy + dz * dz);
        let index = typeA * options.numTypes + typeB;
        let params = get_interaction(index);
        let maxR = params.z;
        if (dist > 0.0 && dist < maxR) {
            let rule = params.x;
            let minR = params.y;
            var force = 0.0;
            if (dist < minR) {
                force = (dist / minR - 1.0) * options.repel;
            } else {
                let mid = (minR + maxR) / 2.0;
                let slope = rule / (mid - minR);
                force = -(slope * abs(dist - mid)) + rule;
            }
            if (force != 0.0) {
                let invDist = force / dist;
                velocitySum.x += dx * invDist;
                velocitySum.y += dy * invDist;
                velocitySum.z += dz * invDist;
            }
        }
    }

    let forceFactor = options.forceFactor * deltaTime * 60.0;
    particle.vx += velocitySum.x * forceFactor;
    particle.vy += velocitySum.y * forceFactor;
    particle.vz += velocitySum.z * forceFactor;

    particlesDestination[i] = particle;
};

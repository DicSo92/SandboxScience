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
    magneticStrength: f32, // Lorentz force field strength (0 = off)
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
struct DeltaTime {
    deltaTime: f32,
    friction: f32, // pre-computed pow(1 - frictionFactor, deltaTime * 60) on the CPU
}

@group(0) @binding(0) var<storage, read_write> particles : array<Particle>;
@group(1) @binding(0) var<uniform> options : SimOptions;
@group(2) @binding(0) var<uniform> dt: DeltaTime;

@compute @workgroup_size(64)
fn particleAdvance(@builtin(global_invocation_id) id : vec3u) {
    if (id.x >= options.numParticles) { return; }

    let width = options.simWidth;
    let height = options.simHeight;

    var particle = particles[id.x];

    particle.vx *= dt.friction;
    particle.vy *= dt.friction;

    // ---- Magnetic (Lorentz) force: F = q * v x B, with B along z-axis ----
    // In 2D: Fx = q * vy * B, Fy = -q * vx * B
    // Charge is derived from particle type using a golden-angle hash for diversity:
    // different species curve in different directions and with different magnitudes.
    if (options.magneticStrength != 0.0) {
        let pType = particle.particleType;
        // Only matter particles get a charge; urges/neurons/dormant have q=0
        if (pType < f32(options.numTypes)) {
            // Golden-angle hash: maps type index to [-1, 1] with good distribution
            let angle = pType * 2.3999632; // golden angle in radians
            let q = sin(angle); // charge in [-1, 1]
            let bField = options.magneticStrength;
            // Use pre-friction velocity for stability (semi-implicit Euler)
            particle.vx += q * particle.vy * bField * dt.deltaTime;
            particle.vy -= q * particle.vx * bField * dt.deltaTime;
        }
    }

    particle.x += particle.vx * dt.deltaTime;
    particle.y += particle.vy * dt.deltaTime;

    if (options.isWallRepel == 1u) {
        let margin = options.particleSize;
        if (particle.x < margin || particle.x > width - margin) {
          particle.vx *= -1.0;
          particle.x = clamp(particle.x, margin, width - margin);
        }
        if (particle.y < margin || particle.y > height - margin) {
          particle.vy *= -1.0;
          particle.y = clamp(particle.y, margin, height - margin);
        }
    } else if (options.isWallWrap == 1u) {
        if (particle.x < 0.0) { particle.x += width; }
        else if (particle.x >= width) { particle.x -= width; }
        if (particle.y < 0.0) { particle.y += height; }
        else if (particle.y >= height) { particle.y -= height; }
    }

    particles[id.x] = particle;
}
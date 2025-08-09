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
};
struct Particle {
    x : f32,
    y : f32,
    vx : f32,
    vy : f32,
    particleType : f32,
}
struct BrushOptions {
    brushX: f32,
    brushY: f32,
    brushVx: f32,
    brushVy: f32,
    brushRadius: f32,
    brushForce: f32,
    brushDirectionalForce: f32,
}
struct BrushTypes {
    count: u32,
    types: array<u32>,
};

const BRUSH_FORCE_MULTIPLIER = 500.0;
const BRUSH_DIRECTIONAL_STRENGTH = 40.0;

@group(0) @binding(0) var<storage, read_write> particles : array<Particle>;
@group(1) @binding(0) var<uniform> options : SimOptions;
@group(2) @binding(0) var<uniform> deltaTime: f32;
@group(3) @binding(0) var<uniform> brush: BrushOptions;
@group(3) @binding(1) var<storage, read> brushTypes: BrushTypes;

@compute @workgroup_size(64)
fn particleAdvance(@builtin(global_invocation_id) id : vec3u) {
    if (id.x >= options.numParticles) { return; }
    var particle = particles[id.x];
    let width = options.simWidth;
    let height = options.simHeight;

    var distVec = vec2<f32>(particle.x, particle.y) - vec2<f32>(brush.brushX, brush.brushY);
    if (options.isWallWrap == 1u) {
        distVec.x = distVec.x - width * round(distVec.x / width);
        distVec.y = distVec.y - height * round(distVec.y / height);
    }
    let distSq = dot(distVec, distVec);
    if (distSq < brush.brushRadius * brush.brushRadius && distSq > 0.0) {
        let dist = sqrt(distSq);
        let normalizedDist = dist / brush.brushRadius;

        let forceMagnitude = 1.0 - smoothstep(0.0, 1.0, normalizedDist);

        let radialForce = brush.brushForce * forceMagnitude * BRUSH_FORCE_MULTIPLIER;
        let radialDir = distVec / dist;
        let directionalForce = forceMagnitude * brush.brushDirectionalForce * options.frictionFactor;

        let totalForce = (radialDir * radialForce) + (vec2<f32>(brush.brushVx, brush.brushVy) * directionalForce);
        particle.vx += totalForce.x * deltaTime;
        particle.vy += totalForce.y * deltaTime;
    }

//    // Vortex
//    if (distSq < brush.brushRadius * brush.brushRadius && distSq > 0.0) {
//        let dist = sqrt(distSq);
//        let normalizedDist = dist / brush.brushRadius;
//
//        let forceMagnitude = 1.0 - smoothstep(0.0, 1.0, normalizedDist);
//
//        let repulsionForce = brush.brushForce * forceMagnitude * BRUSH_FORCE_MULTIPLIER;
//        let radialDir = distVec / dist;
//
//        let swirlForce = 80 * forceMagnitude * BRUSH_FORCE_MULTIPLIER;
//        let tangentialDir = vec2<f32>(-radialDir.y, radialDir.x);
//        let directionalForce = forceMagnitude * brush.brushDirectionalForce * options.frictionFactor;
//
//        let totalForce = (radialDir * repulsionForce) + (tangentialDir * swirlForce) + (vec2<f32>(brush.brushVx, brush.brushVy) * directionalForce);
//        particle.vx += totalForce.x * deltaTime;
//        particle.vy += totalForce.y * deltaTime;
//    }

    particle.vx *= (1.0 - options.frictionFactor);
    particle.vy *= (1.0 - options.frictionFactor);

    particle.x += particle.vx * deltaTime;
    particle.y += particle.vy * deltaTime;

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
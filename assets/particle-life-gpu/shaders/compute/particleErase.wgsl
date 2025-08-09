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

@group(0) @binding(0) var<storage, read> particleBuffer: array<Particle>;
@group(0) @binding(1) var<storage, read_write> particleKeepFlags: array<u32>;
@group(1) @binding(0) var<uniform> simOptions: SimOptions;
@group(2) @binding(0) var<uniform> brushOptions: BrushOptions;
@group(2) @binding(1) var<storage, read> brushTypes: BrushTypes;

@compute @workgroup_size(64)
fn markForErase(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (index >= simOptions.numParticles) { return; }

    let particle = particleBuffer[index];
    let dx = particle.x - brushOptions.brushX;
    let dy = particle.y - brushOptions.brushY;
    let distSq = dx * dx + dy * dy;

    let inRadius = distSq < brushOptions.brushRadius * brushOptions.brushRadius;
    var shouldErase = inRadius && (brushTypes.count == 0u);
    if (inRadius && brushTypes.count > 0u) {
        let particleType = u32(particle.particleType);
        for (var i = 0u; i < brushTypes.count; i = i + 1u) {
            shouldErase = shouldErase || (particleType == brushTypes.types[i]);
        }
    }
    particleKeepFlags[index] = select(1u, 0u, shouldErase);
}
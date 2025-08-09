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

fn pcgHash(input: u32) -> u32 {
    var state = input * 747796405u + 2891336453u;
    let word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
    return (word >> 22u) ^ word;
}
fn randomFloat(seed: ptr<function, u32>) -> f32 {
    *seed = pcgHash(*seed);
    return f32(*seed) / 4294967296.0;
}

@group(0) @binding(0) var<storage, read_write> particleBuffer: array<Particle>;
@group(1) @binding(0) var<uniform> simOptions: SimOptions;
@group(2) @binding(0) var<uniform> brushOptions: BrushOptions;
@group(2) @binding(1) var<storage, read> brushTypes: BrushTypes;

@compute @workgroup_size(64)
fn drawParticles(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = simOptions.numParticles + global_id.x;

    var seed = index + u32(brushOptions.brushX * 1000.0) + u32(brushOptions.brushY * 1000.0);
    let angle = randomFloat(&seed) * 2.0 * 3.1415926535;
    let radius = sqrt(randomFloat(&seed)) * brushOptions.brushRadius;
    let posX = brushOptions.brushX + cos(angle) * radius;
    let posY = brushOptions.brushY + sin(angle) * radius;

    var particleType: f32;
    if (brushTypes.count == 0u) {
        particleType = floor(randomFloat(&seed) * f32(simOptions.numTypes));
    } else {
        let typeIndex = u32(floor(randomFloat(&seed) * f32(brushTypes.count)));
        particleType = f32(brushTypes.types[typeIndex]);
    }

    particleBuffer[index] = Particle(posX, posY, 0.0, 0.0, particleType);
}
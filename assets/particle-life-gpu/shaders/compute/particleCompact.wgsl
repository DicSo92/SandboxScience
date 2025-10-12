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

@group(0) @binding(0) var<storage, read> oldParticleBuffer: array<Particle>;
@group(0) @binding(1) var<storage, read_write> newParticleBuffer: array<Particle>;
@group(0) @binding(2) var<storage, read> particleKeepFlags: array<u32>;
@group(0) @binding(3) var<storage, read_write> newParticleCount: atomic<u32>;
@group(1) @binding(0) var<uniform> simOptions: SimOptions;

@compute @workgroup_size(64)
fn compactParticles(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (index >= simOptions.numParticles) {
        return;
    }

    let particle = oldParticleBuffer[index];
    let keepFlag = particleKeepFlags[index];

    if (keepFlag == 1u) {
        let newIndex = atomicAdd(&newParticleCount, 1u);
        newParticleBuffer[newIndex] = particle;
    }
}
struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) offset: vec2f,
    @location(1) @interpolate(flat) particleType: u32
};
struct SimOptions {
    isWallRepel: u32,
    isWallWrap: u32,
    forceFactor: f32,
    frictionFactor: f32,
    repel: f32,
    particleSize: f32,
    simWidth: f32,
    simHeight: f32,
    cellSize: f32,
    spatialHashTableSize: u32,
    numParticles: u32,
    numTypes: u32
};
struct Camera {
    center: vec2f,
    zoomFactor: f32,
    pad: f32 // Padding to ensure the struct size is aligned to 16 bytes (required for uniform buffers)
};

@group(0) @binding(1) var<uniform> camera: Camera;
@group(0) @binding(2) var<uniform> options: SimOptions;

@vertex
fn main(
    @location(0) localPos: vec2f,     // triangleVertexBuffer
    @location(1) instancePos: vec2f,  // nextPositionBuffer
    @location(2) particleType: u32    // typeBuffer
) -> VertexOutput {
    var out: VertexOutput;

    let worldPos = instancePos + localPos * options.particleSize;
    let pos = (worldPos - camera.center) * camera.zoomFactor;

    out.position = vec4f(
        (pos.x / options.simWidth) * 2.0,
        -(pos.y / options.simHeight) * 2.0,
        0.0, 1.0
    );

    out.offset = localPos;
    out.particleType = particleType;

    return out;
}
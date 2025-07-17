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

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) offset: vec2f,
    @location(1) @interpolate(flat) particleType: u32
};

@group(0) @binding(2) var<uniform> options: SimOptions;

@vertex
fn main(
    @location(0) localPos: vec2f,     // triangleVertexBuffer
    @location(1) instancePos: vec2f,  // nextPositionBuffer
    @location(2) particleType: u32    // typeBuffer
) -> VertexOutput {
    var out: VertexOutput;

    // Calculate the world position based on the instance position and local position
    let worldPos = instancePos + localPos * options.particleSize;

    // Normalize the world position to the range [-1, 1]
    let normalizedPos = (worldPos / vec2f(options.simWidth, options.simHeight)) * 2.0 - 1.0;

    // Set the output position and attributes
    out.position = vec4f(normalizedPos.x, -normalizedPos.y, 0.0, 1.0);
    out.offset = localPos;
    out.particleType = particleType;

    return out;
}
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
    scale: vec2f
};

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) texCoord: vec2f
};

@group(0) @binding(1) var<uniform> camera: Camera;
@group(0) @binding(2) var<uniform> options: SimOptions;

@vertex
fn main(@location(0) localPos: vec2f) -> VertexOutput {
    var out: VertexOutput;

    out.position = vec4f(localPos.x, localPos.y, 0.0, 1.0);
    let worldPos = vec2f(
        camera.center.x + localPos.x / camera.scale.x,
        camera.center.y - localPos.y / camera.scale.y
    );
    out.texCoord = worldPos / vec2f(options.simWidth, options.simHeight);

    return out;
}
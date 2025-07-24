struct SimOptions {
    simWidth: f32,
    simHeight: f32,
    gridWidth: u32,
    gridHeight: u32,
    cellSize: f32,
    numParticles: u32,
    numTypes: u32,
    particleSize: f32,
    isWallRepel: u32,
    isWallWrap: u32,
    forceFactor: f32,
    frictionFactor: f32,
    repel: f32,
    extendedGridWidth: u32,
    extendedGridHeight: u32,
    gridOffsetX: u32,
    gridOffsetY: u32,
};

struct Camera {
    center: vec2f,
    scale: vec2f
};

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) texCoord: vec2f
};

const QUAD_VERTICES = array<vec2f, 6>(
    vec2f(-1.0, -1.0),
    vec2f( 1.0, -1.0),
    vec2f( 1.0,  1.0),
    vec2f(-1.0, -1.0),
    vec2f( 1.0,  1.0),
    vec2f(-1.0,  1.0)
);

@group(0) @binding(0) var<uniform> camera: Camera;
@group(1) @binding(0) var<uniform> options: SimOptions;

@vertex
fn main(
    @builtin(vertex_index) vertex_index: u32
) -> VertexOutput {
    var out: VertexOutput;
    let localPos = QUAD_VERTICES[vertex_index];

    out.position = vec4f(localPos.x, localPos.y, 0.0, 1.0);
    let worldPos = vec2f(
        camera.center.x + localPos.x / camera.scale.x,
        camera.center.y - localPos.y / camera.scale.y
    );
    out.texCoord = worldPos / vec2f(options.simWidth, options.simHeight);

    return out;
}
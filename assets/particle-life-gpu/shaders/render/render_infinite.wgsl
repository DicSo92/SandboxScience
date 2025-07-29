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
    mirrorWrapCount: u32,
};
struct Particle {
    x: f32,
    y: f32,
    vx: f32,
    vy: f32,
    particleType: f32,
};
struct Camera {
    centerX: f32,
    centerY: f32,
    scaleX: f32,
    scaleY: f32,
};
struct InfiniteRenderOptions {
    start: vec2<i32>,
    numCopies: vec2<i32>,
};

const QUAD_VERTICES = array<vec2<f32>, 4>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0,  1.0)
);

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<storage, read> colors: array<vec4<f32>>;
@group(1) @binding(0) var<uniform> options: SimOptions;
@group(2) @binding(0) var<uniform> camera: Camera;
@group(3) @binding(0) var<uniform> infiniteOptions: InfiniteRenderOptions;

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) offset: vec2<f32>,
    @location(1) color: vec4<f32>,
};

@vertex
fn vertexMain(
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
    let particleIndex = instanceIndex % options.numParticles;
    let copyInstanceIndex = instanceIndex / options.numParticles;

    let numCopiesX = u32(infiniteOptions.numCopies.x);
    let copyX = copyInstanceIndex % numCopiesX;
    let copyY = copyInstanceIndex / numCopiesX;

    let worldOffsetX = f32(i32(copyX) + infiniteOptions.start.x) * options.simWidth;
    let worldOffsetY = f32(i32(copyY) + infiniteOptions.start.y) * options.simHeight;

    let p = particles[particleIndex];
    let particlePos = vec2<f32>(p.x + worldOffsetX, p.y + worldOffsetY);

    let posFromCamera = particlePos - vec2<f32>(camera.centerX, camera.centerY);
    let scaledPos = posFromCamera * vec2<f32>(camera.scaleX, -camera.scaleY);

    let quadOffset = QUAD_VERTICES[vertexIndex];
    let vertexOffset = quadOffset * options.particleSize * vec2<f32>(camera.scaleX, camera.scaleY);

    return VertexOutput(
        vec4<f32>(scaledPos + vertexOffset, 0.0, 1.0),
        quadOffset,
        colors[u32(p.particleType)],
    );
}

@fragment
fn fragmentMain(in: VertexOutput) -> @location(0) vec4f {
    let dist_sq = dot(in.offset, in.offset);
//    if (dist_sq > 1.0) { discard; }
//    return vec4f(in.color.rgb, in.color.a * 0.85);
    let circle_alpha = smoothstep(1.0, 0.85, dist_sq) * in.color.a * 0.85;
    if (circle_alpha < 0.01) { discard; }
    return vec4f(in.color.rgb, circle_alpha);
}
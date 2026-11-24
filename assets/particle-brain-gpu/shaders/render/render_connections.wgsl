// =============================================================================
// Debug: draw the connection dots produced by debugConnections.wgsl as small,
// light, additive billboards -> a "light dotted line" between urges & neurons.
// Instances beyond connCount[0] are clipped to a degenerate quad.
// =============================================================================
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
    cellSubdivisions: u32,
};
struct Camera {
    centerX: f32,
    centerY: f32,
    scaleX: f32,
    scaleY: f32,
};
struct ConnDot {
    pos: vec2<f32>,
    col: vec3<f32>,
};

const QUAD_VERTICES = array<vec2<f32>, 4>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0,  1.0)
);

@group(0) @binding(0) var<storage, read> connDots: array<ConnDot>;
@group(0) @binding(1) var<storage, read> connCount: array<u32>;
@group(1) @binding(0) var<uniform> camera: Camera;
@group(2) @binding(0) var<uniform> options: SimOptions;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) offset: vec2<f32>,
    @location(1) color: vec3<f32>,
}

@vertex
fn vertexMain(@builtin(instance_index) instanceIndex: u32, @builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    // Clip instances beyond the actual number of emitted dots.
    if (instanceIndex >= connCount[0]) {
        return VertexOutput(vec4f(0.0), vec2f(0.0), vec3f(0.0));
    }
    let dot = connDots[instanceIndex];

    let cameraScale = vec2f(camera.scaleX, -camera.scaleY);
    let cameraCenter = vec2f(camera.centerX, camera.centerY);
    let transformedCenterPos = fma(dot.pos, cameraScale, -cameraCenter * cameraScale);

    // Dots sized to read clearly as a dotted line over the scene.
    let dotSize = options.particleSize * 0.7;
    let quadOffset = QUAD_VERTICES[vertexIndex];
    let vertexOffset = quadOffset * dotSize * cameraScale;
    let finalPos = transformedCenterPos + vertexOffset;

    return VertexOutput(vec4f(finalPos, 0.0, 1.0), quadOffset, dot.col);
}

@fragment
fn fragmentMain(in: VertexOutput) -> @location(0) vec4f {
    let dist_sq = dot(in.offset, in.offset);
    if (dist_sq > 1.0) { discard; }
    let falloff = saturate(1.0 - dist_sq); // soft round dot
    // Drawn with normal (alpha) blending so it sits ON TOP of bright matter and stays visible.
    return vec4<f32>(in.color * 1.4, falloff);
}

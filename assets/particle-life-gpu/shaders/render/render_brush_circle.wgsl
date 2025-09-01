struct Camera {
    centerX: f32,
    centerY: f32,
    scaleX: f32,
    scaleY: f32,
};
struct BrushOptions {
    brushX: f32,
    brushY: f32,
    brushVx: f32,
    brushVy: f32,
    brushRadius: f32,
    brushForce: f32,
    brushDirectionalForce: f32,
}

const QUAD_VERTICES = array<vec2<f32>, 4>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, 1.0)
);

@group(0) @binding(0) var<uniform> camera: Camera;
@group(1) @binding(0) var<uniform> brush: BrushOptions;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) localPos: vec2<f32>,
};

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    let quadPos = QUAD_VERTICES[vertexIndex];
    let worldPos = vec2<f32>(brush.brushX, brush.brushY) + quadPos * brush.brushRadius;
    let clipPos = (worldPos - vec2<f32>(camera.centerX, camera.centerY)) * vec2<f32>(camera.scaleX, -camera.scaleY);
    return VertexOutput(
        vec4<f32>(clipPos, 0.0, 1.0),
        quadPos
    );
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
    let dist = length(input.localPos);
    let fw = fwidth(dist);

    let thickness = 0.015;
    let outerEdge = 1.0;
    let innerEdge = 1.0 - thickness;

    let alpha_outer = smoothstep(outerEdge + fw, outerEdge - fw, dist);
    let alpha_inner = smoothstep(innerEdge - fw, innerEdge + fw, dist);
    let alpha = alpha_outer * alpha_inner;

    if (alpha <= 0.0) { discard; }

    return vec4<f32>(0.153, 0.263, 0.502, alpha * 0.8);
}
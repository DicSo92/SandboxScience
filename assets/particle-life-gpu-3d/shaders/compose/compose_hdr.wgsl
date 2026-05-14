const offsets = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 3.0, -1.0),
    vec2<f32>(-1.0,  3.0),
);

fn acesTonemap(hdr_color: vec3<f32>) -> vec3<f32> {
    let a = 2.51;
    let b = 0.03;
    let c = 2.43;
    let d = 0.59;
    let e = 0.14;
    return (hdr_color * (a * hdr_color + b)) / (hdr_color * (c * hdr_color + d) + e);
}
fn dither(x: vec3f, n: f32) -> vec3f {
    let c = x * 255.0;
    let c0 = floor(c);
    let c1 = c0 + vec3f(1.0);
    let dc = c - c0;
    var r = c0;
    if (dc.r > n) { r.r = c1.r; }
    if (dc.g > n) { r.g = c1.g; }
    if (dc.b > n) { r.b = c1.b; }
    return r / 255.0;
}

@group(0) @binding(0) var hdrTexture: texture_2d<f32>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
};

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    let position = offsets[vertexIndex];
    return VertexOutput(vec4<f32>(position, 0.0, 1.0));
}

@fragment
fn fragmentMain(in: VertexOutput) -> @location(0) vec4<f32> {
    let noise = fract(dot(in.position.xy, vec2f(12.9898, 78.233)) * 43758.5453);
    let hdr_color = textureLoad(hdrTexture, vec2i(in.position.xy), 0);

    var color = acesTonemap(hdr_color.rgb);
    color = pow(color, vec3f(0.45454545)); // gamma 1/2.2
    color = dither(color, noise);
    return vec4f(color, 1.0);
}

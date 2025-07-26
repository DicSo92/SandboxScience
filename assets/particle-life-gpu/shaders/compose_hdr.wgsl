@group(0) @binding(0) var hdrTexture: texture_2d<f32>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) textureCoords: vec2<f32>,
}

const offsets = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 3.0, -1.0),
    vec2<f32>(-1.0,  3.0),
);

fn acesTonemap(hdr_color: vec3<f32>) -> vec3<f32> { // Tonemapping ACES
    let a = 2.51;
    let b = 0.03;
    let c = 2.43;
    let d = 0.59;
    let e = 0.14;
    return (hdr_color * (a * hdr_color + b)) / (hdr_color * (c * hdr_color + d) + e);
}
fn reinhard(hdr_color: vec3<f32>) -> vec3<f32> { // Reinhard tonemapping
    return hdr_color / (hdr_color + vec3<f32>(1.0));
}
fn uncharted2_tonemap_partial(x: vec3<f32>) -> vec3<f32> { // Uncharted 2 tonemapping partial function
    let a = 0.15; // Shoulder Strength
    let b = 0.50; // Linear Strength
    let c = 0.10; // Linear Angle
    let d = 0.20; // Toe Strength
    let e = 0.02; // Toe Numerator
    let f = 0.30; // Toe Denominator
    return ((x * (a * x + c * b) + d * e) / (x * (a * x + b) + d * f)) - e / f;
}
fn uncharted2_filmic(hdr_color: vec3<f32>) -> vec3<f32> { // Uncharted 2 filmic tonemapping
    let exposure_bias = 2.0;
    let curr = uncharted2_tonemap_partial(hdr_color * exposure_bias);

    let w = 11.2; // Linear White Point Value
    let white_scale = 1.0 / uncharted2_tonemap_partial(vec3<f32>(w));
    return curr * white_scale;
}
fn dither(x : vec3f, n : f32) -> vec3f { // Dithering to reduce banding artifacts
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
fn linear_to_srgb(color: vec3f) -> vec3f { // Convert linear RGB to sRGB precisely
    let linear_sqrt = sqrt(color);
    return max(1.055 * linear_sqrt - 0.055, color * 12.92);
}

@vertex
fn vertexMain(@builtin(vertex_index) id: u32) -> VertexOutput {
    let pos = offsets[id];
    var output: VertexOutput;
    output.position = vec4<f32>(pos, 0.0, 1.0);
    output.textureCoords = pos * 0.5 + 0.5;
    return output;
}
@fragment
fn fragmentMain(in: VertexOutput) -> @location(0) vec4<f32> {
    let noise = fract(sin(dot(in.position.xy, vec2f(12.9898, 78.233))) * 43758.5453); // Simple procedural noise
    let hdr_color = textureLoad(hdrTexture, vec2i(in.position.xy), 0);
    var color = hdr_color.rgb;

    color = acesTonemap(color); // Tonemapping ACES
//    color = reinhard(color); // Reinhard tonemapping
//    color = uncharted2_tonemap_partial(color); // Uncharted 2 tonemapping
//    color = uncharted2_filmic(color); // Uncharted 2 filmic tonemapping

//    color = linear_to_srgb(color); // Precise gamma correction
    color = pow(color, vec3f(1.0 / 2.2)); // Gamma correction
    color = dither(color, noise); // Dithering for banding reduction
    return vec4f(color, 1.0);
}
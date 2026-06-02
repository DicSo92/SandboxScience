// ---------------------------------------------------------------------------------------------------------------------
// --- Dual Kawase blur (Marius Bjørge, ARM 2015 - variant of Kawase 2003) ---------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
struct BloomOptions {
    threshold: f32, // luminance threshold above which pixels start to bloom
    intensity: f32, // multiplier applied at compose time (not used here directly)
    knee: f32, // soft-knee width (0 = hard cutoff, 1 = very soft falloff)
};

const offsets = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 3.0, -1.0),
    vec2<f32>(-1.0,  3.0),
);
// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
// --- Soft-knee bright pass (Karis / Unity HDRP style) ----------------------------------------------------------------
fn brightPass(c: vec3<f32>) -> vec3<f32> {
    let br = max(c.r, max(c.g, c.b));
    let knee = bloom.knee * bloom.threshold + 1e-5;
    let soft = clamp(br - bloom.threshold + knee, 0.0, 2.0 * knee);
    let soft2 = soft * soft * (0.25 / (knee + 1e-5));
    let weight = max(soft2, br - bloom.threshold) / max(br, 1e-5);

    let contribution = c * weight;
    // Rec.601 luma — close enough to Rec.709 for this purpose, cheaper.
    let lum = dot(contribution, vec3<f32>(0.299, 0.587, 0.114));
    let targetLum = br * weight;

    return contribution * (targetLum / max(lum, 1e-5));
//    let boost = clamp(targetLum / max(lum, 1e-5), 0.0, 3.0);
//    return contribution * boost;
}
// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
override IS_PREFILTER : bool = false;

@group(0) @binding(0) var srcTex : texture_2d<f32>;
@group(0) @binding(1) var srcSamp : sampler;
@group(0) @binding(2) var<uniform> bloom : BloomOptions;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
};
// ---------------------------------------------------------------------------------------------------------------------
@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    let p = offsets[vertexIndex];
    let uv = (p + vec2<f32>(1.0)) * 0.5;
    return VertexOutput(vec4<f32>(p, 0.0, 1.0), vec2<f32>(uv.x, 1.0 - uv.y));
}
// ---------------------------------------------------------------------------------------------------------------------
@fragment
fn fragmentDownsample(in: VertexOutput) -> @location(0) vec4<f32> {
    let texelSize = vec2<f32>(1.0) / vec2<f32>(textureDimensions(srcTex, 0));
    let o = texelSize * 0.5;
    var c0 = textureSample(srcTex, srcSamp, in.uv).rgb;
    var c1 = textureSample(srcTex, srcSamp, in.uv + vec2<f32>(-o.x, -o.y)).rgb;
    var c2 = textureSample(srcTex, srcSamp, in.uv + vec2<f32>( o.x, -o.y)).rgb;
    var c3 = textureSample(srcTex, srcSamp, in.uv + vec2<f32>(-o.x,  o.y)).rgb;
    var c4 = textureSample(srcTex, srcSamp, in.uv + vec2<f32>( o.x,  o.y)).rgb;
    if (IS_PREFILTER) {
        c0 = brightPass(c0);
        c1 = brightPass(c1);
        c2 = brightPass(c2);
        c3 = brightPass(c3);
        c4 = brightPass(c4);
    }
    let sum = c0 * 4.0 + c1 + c2 + c3 + c4;
    return vec4<f32>(sum / 8.0, 1.0);
}
// ---------------------------------------------------------------------------------------------------------------------
@fragment
fn fragmentUpsample(in: VertexOutput) -> @location(0) vec4<f32> {
    let texelSize = vec2<f32>(1.0) / vec2<f32>(textureDimensions(srcTex, 0));
    let t = texelSize;
    var c = textureSample(srcTex, srcSamp, in.uv + vec2<f32>(-t.x,  0.0)).rgb * 2.0;
    c += textureSample(srcTex, srcSamp, in.uv + vec2<f32>( t.x,  0.0)).rgb * 2.0;
    c += textureSample(srcTex, srcSamp, in.uv + vec2<f32>( 0.0, -t.y)).rgb * 2.0;
    c += textureSample(srcTex, srcSamp, in.uv + vec2<f32>( 0.0,  t.y)).rgb * 2.0;
    c += textureSample(srcTex, srcSamp, in.uv + vec2<f32>(-t.x, -t.y)).rgb;
    c += textureSample(srcTex, srcSamp, in.uv + vec2<f32>( t.x, -t.y)).rgb;
    c += textureSample(srcTex, srcSamp, in.uv + vec2<f32>(-t.x,  t.y)).rgb;
    c += textureSample(srcTex, srcSamp, in.uv + vec2<f32>( t.x,  t.y)).rgb;
    return vec4<f32>(c / 12.0, 1.0);
}

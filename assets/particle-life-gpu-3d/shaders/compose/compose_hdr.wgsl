struct BloomOptions {
    threshold: f32,
    intensity: f32,
    knee: f32,
};

const offsets = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 3.0, -1.0),
    vec2<f32>(-1.0,  3.0),
);
// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
// --- ACES "Narkowicz" approximation ----------------------------------------------------------------------------------
fn acesNarkowicz(x: vec3f) -> vec3f {
    let a = 2.51;
    let b = 0.03;
    let c = 2.43;
    let d = 0.59;
    let e = 0.14;
    return saturate((x * (a * x + b)) / (x * (c * x + d) + e));
}
// --- ACES "Fitted" (Stephen Hill) ------------------------------------------------------------------------------------
fn rrtAndOdtFit(v: vec3f) -> vec3f {
    let a = v * (v + vec3f(0.0245786)) - vec3f(0.000090537);
    let b = v * (0.983729 * v + vec3f(0.4329510)) + vec3f(0.238081);
    return a / b;
}
fn acesFitted(color: vec3f) -> vec3f {
    // sRGB -> ACES input
    let aces_in = mat3x3f(
        vec3f(0.59719, 0.07600, 0.02840),
        vec3f(0.35458, 0.90834, 0.13383),
        vec3f(0.04823, 0.01566, 0.83777),
    );
    // ACES -> sRGB output
    let aces_out = mat3x3f(
        vec3f( 1.60475, -0.10208, -0.00327),
        vec3f(-0.53108,  1.10813, -0.07276),
        vec3f(-0.07367, -0.00605,  1.07602),
    );
    var c = aces_in * color;
    c = rrtAndOdtFit(c);
    return saturate(aces_out * c);
}
// --- Reinhard-Jodie --------------------------------------------------------------------------------------------------
fn luminance(c: vec3f) -> f32 {
    return dot(c, vec3f(0.2126, 0.7152, 0.0722));
}
fn reinhardJodie(c: vec3f) -> vec3f {
    let l = luminance(c);
    let tc = c / (vec3f(1.0) + c);
    return mix(c / (1.0 + l), tc, tc);
}
// --- Uncharted 2 (John Hable) filmic ---------------------------------------------------------------------------------
fn uncharted2Partial(x: vec3f) -> vec3f {
    let a = 0.15; // shoulder strength
    let b = 0.50; // linear strength
    let c = 0.10; // linear angle
    let d = 0.20; // toe strength
    let e = 0.02; // toe numerator
    let f = 0.30; // toe denominator
    return ((x * (a * x + c * b) + d * e) / (x * (a * x + b) + d * f)) - e / f;
}
fn uncharted2Filmic(hdr: vec3f) -> vec3f {
    let exposureBias = 2.0;
    let curr = uncharted2Partial(hdr * exposureBias);
    let whitePoint = vec3f(11.2);
    let whiteScale = vec3f(1.0) / uncharted2Partial(whitePoint);
    return saturate(curr * whiteScale);
}
// --- Lottes (AMD) ----------------------------------------------------------------------------------------------------
fn lottes(x: vec3f) -> vec3f {
    let a      = vec3f(1.80);  // contrast (↑ vs 1.6 default = punchier midtones)
    let d      = vec3f(0.92);  // shoulder (↓ vs 0.977 = smoother highlight roll-off)
    let hdrMax = vec3f(12.0);  // max HDR value (↑ vs 8.0 = accept brighter bloom peaks)
    let midIn  = vec3f(0.18);  // input middle grey
    let midOut = vec3f(0.22);  // output middle grey (↓ vs 0.267 = deeper blacks, hotter highlights)

    let b =
        (-pow(midIn, a) + pow(hdrMax, a) * midOut) /
        ((pow(hdrMax, a * d) - pow(midIn, a * d)) * midOut);
    let c =
        (pow(hdrMax, a * d) * pow(midIn, a) - pow(hdrMax, a) * pow(midIn, a * d) * midOut) /
        ((pow(hdrMax, a * d) - pow(midIn, a * d)) * midOut);

    return pow(x, a) / (pow(x, a * d) * b + c);
}
// --- AGX (Troy Sobotka, minimal fit by bwrensch/Filament) ------------------------------------------------------------
fn agxDefaultContrastApprox(x: vec3f) -> vec3f {
    let x2 = x * x;
    let x4 = x2 * x2;
    return 15.5    * x4 * x2
         - 40.14   * x4 * x
         + 31.96   * x4
         -  6.868  * x2 * x
         +  0.4298 * x2
         +  0.1191 * x
         -  0.00232;
}
fn agx(color: vec3f) -> vec3f {
    let agxMat = mat3x3f(
        vec3f(0.842479062253094,  0.0423282422610123, 0.0423756549057051),
        vec3f(0.0784335999999992, 0.878468636469772,  0.0784336),
        vec3f(0.0792237451477643, 0.0791661274605434, 0.879142973793104),
    );
    let minEv = -12.47393;
    let maxEv =  4.026069;

    var c = agxMat * color;
    c = clamp(log2(c), vec3f(minEv), vec3f(maxEv));
    c = (c - vec3f(minEv)) / (maxEv - minEv);

//    return agxDefaultContrastApprox(c);
    return pow(saturate(agxDefaultContrastApprox(c)), vec3f(2.2));
}
// fn agxLook(c: vec3f) -> vec3f { ... }
// ---------------------------------------------------------------------------------------------------------------------
// --- Dithering -------------------------------------------------------------------------------------------------------
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
// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
override TONEMAP_ID : u32 = 1u;

fn applyTonemap(hdr: vec3f) -> vec3f {
    if (TONEMAP_ID == 0u) { return saturate(hdr); }
    if (TONEMAP_ID == 1u) { return acesNarkowicz(hdr); }
    if (TONEMAP_ID == 2u) { return acesFitted(hdr); }
    if (TONEMAP_ID == 3u) { return lottes(hdr); }
    if (TONEMAP_ID == 4u) { return reinhardJodie(hdr); }
    if (TONEMAP_ID == 5u) { return uncharted2Filmic(hdr); }
    if (TONEMAP_ID == 6u) { return agx(hdr); }
    return saturate(hdr);
}
// ---------------------------------------------------------------------------------------------------------------------
@group(0) @binding(0) var hdrTexture : texture_2d<f32>;
@group(0) @binding(1) var bloomTex : texture_2d<f32>;
@group(0) @binding(2) var bloomSamp : sampler;
@group(0) @binding(3) var<uniform> bloom : BloomOptions;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
};
// ---------------------------------------------------------------------------------------------------------------------
@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    let position = offsets[vertexIndex];
    let uv = (position + vec2f(1.0)) * 0.5;
    return VertexOutput(vec4f(position, 0.0, 1.0), vec2f(uv.x, 1.0 - uv.y));
}
// ---------------------------------------------------------------------------------------------------------------------
@fragment
fn fragmentMain(in: VertexOutput) -> @location(0) vec4<f32> {
    let noise = fract(dot(in.position.xy, vec2f(12.9898, 78.233)) * 43758.5453);
    let hdr_color = textureLoad(hdrTexture, vec2i(in.position.xy), 0).rgb;
    let bloom_color = textureSample(bloomTex, bloomSamp, in.uv).rgb;

    var color = applyTonemap(hdr_color + bloom_color * bloom.intensity);
    color = pow(color, vec3f(0.45454545)); // gamma 1/2.2
    color = dither(color, noise);
    return vec4f(color, 1.0);
}

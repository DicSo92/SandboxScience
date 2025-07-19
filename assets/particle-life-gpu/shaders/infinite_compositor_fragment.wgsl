@group(0) @binding(0) var offscreenTexture: texture_2d<f32>;
@group(0) @binding(3) var offscreenSampler: sampler;

@fragment
fn main(@location(0) texCoord: vec2f) -> @location(0) vec4f {
    return textureSample(offscreenTexture, offscreenSampler, texCoord);
}
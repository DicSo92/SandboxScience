@group(2) @binding(0) var offscreenTexture: texture_2d<f32>;
@group(2) @binding(1) var offscreenSampler: sampler;

@fragment
fn main(@location(0) texCoord: vec2f) -> @location(0) vec4f {
    return textureSample(offscreenTexture, offscreenSampler, texCoord);
}
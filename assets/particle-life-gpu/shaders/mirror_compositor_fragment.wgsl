@group(0) @binding(0) var offscreenTexture: texture_2d<f32>;
@group(0) @binding(3) var offscreenSampler: sampler;

@fragment
fn main(
    @location(0) texCoord: vec2f,
    @location(1) @interpolate(flat) instanceIndex: u32
) -> @location(0) vec4f {
    let textureColor = textureSample(offscreenTexture, offscreenSampler, texCoord);

    // Convert to grayscale and apply a fade effect
    let grayscale = dot(textureColor.rgb, vec3f(0.299, 0.587, 0.114));
    let grayscaleColorFade = vec4f(vec3f(grayscale), textureColor.a * 0.65);

    // Select the color for the mirror instance based on alpha value
    // If the alpha is too low, return transparent black
    let mirrorInstanceColor = grayscaleColorFade * step(0.1, textureColor.a);

    // Select the color based on the instance index
    return select(mirrorInstanceColor, textureColor, instanceIndex == 0u);
}


// For infinite wrapping mirror
//@group(0) @binding(0) var offscreenTexture: texture_2d<f32>;
//@group(0) @binding(3) var offscreenSampler: sampler;
//
//@fragment
//fn main(@location(0) texCoord: vec2f) -> @location(0) vec4f {
//    // Repeat do all the texture sampling logic here
//    return textureSample(offscreenTexture, offscreenSampler, texCoord);
//}
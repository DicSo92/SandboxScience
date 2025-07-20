struct Colors {
    data: array<vec4f>,
};

@group(0) @binding(1) var<storage, read> colors: Colors;

@fragment
fn main(
    @location(0) uv: vec2f,
    @location(1) particleType: f32
) -> @location(0) vec4f {
    if (length(uv) > 1.0) {
        discard;
    }
    let colorIndex = u32(particleType);
    return colors.data[colorIndex];
}
struct Colors {
    data: array<vec3f>
};
@group(0) @binding(0) var<storage, read> colors: Colors;

@fragment
fn main(@location(0) offset: vec2f, @location(1) @interpolate(flat) particleType: u32) -> @location(0) vec4f {
    let color = colors.data[particleType];
    if (length(offset) > 1.0) {
        discard;
    }
    return vec4f(color, 0.95 - smoothstep(0.75, 0.95, length(offset)));
}
struct SimOptions {
    simWidth: f32,
    simHeight: f32,
    gridWidth: u32,
    gridHeight: u32,
    cellSize: f32,
    numParticles: u32,
    numTypes: u32,
    particleSize: f32,
    particleOpacity: f32,
    isWallRepel: u32,
    isWallWrap: u32,
    forceFactor: f32,
    frictionFactor: f32,
    repel: f32,
    extendedGridWidth: u32,
    extendedGridHeight: u32,
    gridOffsetX: u32,
    gridOffsetY: u32,
    mirrorWrapCount: u32,
};
struct Particle {
    x : f32,
    y : f32,
    vx : f32,
    vy : f32,
    particleType : f32,
}
struct Camera {
    centerX: f32,
    centerY: f32,
    scaleX: f32,
    scaleY: f32,
}
struct GlowOptions {
    glowSize: f32,
    glowIntensity: f32,
    glowSteepness: f32,
}

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<storage, read> colors: array<vec4<f32>>;
@group(1) @binding(0) var<uniform> options: SimOptions;
@group(2) @binding(0) var<uniform> camera: Camera;
@group(3) @binding(0) var<uniform> glowOptions: GlowOptions;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) offset: vec2<f32>,
    @location(1) color: vec4<f32>,
}

const QUAD_VERTICES = array<vec2<f32>, 4>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0,  1.0)
);

fn srgb_to_linear(color: vec3f) -> vec3f {
    let cutoff = vec3f(0.04045);
    let linear_low = color / 12.92;
    let linear_high = pow((color + 0.055) / 1.055, vec3f(2.4));
    return select(linear_high, linear_low, color <= cutoff);
}

fn vertex_main(instanceIndex: u32, vertexIndex: u32, size: f32) -> VertexOutput {
    let particle = particles[instanceIndex];
    let offset = QUAD_VERTICES[vertexIndex];
    let color = colors[u32(particle.particleType)];

    let worldPos = vec2f(particle.x, particle.y) + offset * size;

    let cameraPos = vec2f(camera.centerX, camera.centerY);
    let cameraScale = vec2f(camera.scaleX, -camera.scaleY);
    let clipPos = (worldPos - cameraPos) * cameraScale;

    return VertexOutput(
        vec4f(clipPos, 0.0, 1.0),
        offset,
        color,
    );
}
@vertex
fn vertexGlow(@builtin(instance_index) instanceIndex: u32, @builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    return vertex_main(instanceIndex, vertexIndex, options.particleSize * glowOptions.glowSize);
}
@vertex
fn vertexCircle(@builtin(instance_index) instanceIndex: u32, @builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    return vertex_main(instanceIndex, vertexIndex, options.particleSize);
}

@fragment
fn fragmentGlow(in: VertexOutput) -> @location(0) vec4<f32> {
    let dist_sq = dot(in.offset, in.offset);
    if (dist_sq > 1.0) { discard; }

    let falloff = saturate(1.0 - dist_sq);
//    let falloff = 1.0 - dist_sq; // Alternative falloff calculation (less steep, more uniform, but less glow effect) (faster)

    let alpha = pow(falloff, glowOptions.glowSteepness) * glowOptions.glowIntensity;
//    let alpha = falloff * falloff * glowOptions.glowIntensity; // Alternative falloff calculation

    if (alpha < 0.0001) { discard; }
    return vec4<f32>(in.color.rgb * alpha, alpha);
}
@fragment
fn fragmentCircle(in: VertexOutput) -> @location(0) vec4<f32> {
    let dist = length(in.offset);
    if (dist > 1.0) { discard; }

//    let linear_color = in.color.rgb; // Use original color for circle rendering (no gamma correction)
    let linear_color = pow(in.color.rgb, vec3<f32>(2.2)); // Convert color to linear space for proper blending
//    let linear_color = srgb_to_linear(in.color.rgb); // Convert color to linear space for proper blending (precise / slower)

    return vec4<f32>(linear_color, in.color.a * options.particleOpacity);
}
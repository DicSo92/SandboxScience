struct SimOptions {
    simWidth: f32,
    simHeight: f32,
    gridWidth: u32,
    gridHeight: u32,
    cellSize: f32,
    numParticles: u32,
    numTypes: u32,
    particleSize: f32,
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
    x: f32,
    y: f32,
    vx: f32,
    vy: f32,
    particleType: f32,
};
struct Camera {
    centerX: f32,
    centerY: f32,
    scaleX: f32,
    scaleY: f32,
};
struct GlowOptions {
    glowSize: f32,
    glowIntensity: f32,
    glowSteepness: f32,
    particleOpacity: f32,
};
const QUAD_VERTICES = array<vec2<f32>, 4>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, 1.0)
);
const MIRROR_OFFSETS = array<vec2<f32>, 9>(
    vec2<f32>(0.0, 0.0),
    vec2<f32>(-1.0, 0.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(0.0, -1.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, 1.0)
);

const GRAYSCALE_WEIGHTS: vec3<f32> = vec3<f32>(0.299, 0.587, 0.114);
const PRIMARY_ALPHA: f32 = 0.85;

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<storage, read> colors: array<vec4<f32>>;
@group(1) @binding(0) var<uniform> options: SimOptions;
@group(2) @binding(0) var<uniform> camera: Camera;
@group(3) @binding(0) var<uniform> glowOptions: GlowOptions;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) offset: vec2<f32>,
    @location(1) color: vec4<f32>,
    @location(2) @interpolate(flat) mirrorIndex: u32,
}

fn vertex_main(instanceIndex: u32, vertexIndex: u32, size: f32) -> VertexOutput {
    let mirrorWrapCount = options.mirrorWrapCount;
    let invMWC = select(0.2, 0.11111111, mirrorWrapCount == 9u); // 1/5 or 1/9
    let particleIndex = u32(f32(instanceIndex) * invMWC);
    let mirrorIndex = instanceIndex - particleIndex * mirrorWrapCount;
//    let mirrorIndex = instanceIndex % options.mirrorWrapCount;
//    let particleIndex = instanceIndex / options.mirrorWrapCount;

    let vertId = vertexIndex & 3u; // Using bitwise AND for better performance instead of modulo 4u

    let offset = QUAD_VERTICES[vertId];
    let mirrorOffset = MIRROR_OFFSETS[mirrorIndex];
    let particle = particles[particleIndex];
    let color = colors[u32(particle.particleType)];

    let simSize = vec2f(options.simWidth, options.simHeight);
    let particlePos = vec2f(particle.x, particle.y);
    let worldPos = particlePos + (mirrorOffset * simSize) + (offset * size);

    let cameraPos = vec2f(camera.centerX, camera.centerY);
    let cameraScale = vec2f(camera.scaleX, -camera.scaleY);
    let clipPos = (worldPos - cameraPos) * cameraScale;

    return VertexOutput(
        vec4f(clipPos, 0.0, 1.0),
        offset,
        color,
        mirrorIndex
    );
}

@vertex
fn mirrorVertex(@builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
    return vertex_main(instanceIndex, vertexIndex, options.particleSize);
}
@fragment
fn mirrorFragment(in: VertexOutput) -> @location(0) vec4<f32> {
    let dist_sq = dot(in.offset, in.offset);
    if (dist_sq > 1.0) { discard; }

    let isMirror = f32(in.mirrorIndex != 0u);
    let grayscale = dot(in.color.rgb, GRAYSCALE_WEIGHTS);
    let finalColor = mix(in.color.rgb, vec3f(grayscale), isMirror);

    let particleOpacity = glowOptions.particleOpacity;
    let alpha = in.color.a * mix(particleOpacity, particleOpacity * 0.75, isMirror);
    return vec4f(finalColor, alpha);

//    if (in.mirrorIndex != 0u) {
//        let grayscale = dot(in.color.rgb, vec3f(0.299, 0.587, 0.114));
//        return vec4f(vec3f(grayscale), in.color.a * 0.65);
//    }
//    return vec4f(in.color.rgb, in.color.a * 0.85);
}


@vertex
fn mirrorVertexGlow(@builtin(instance_index) instanceIndex: u32, @builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    return vertex_main(instanceIndex, vertexIndex, options.particleSize * glowOptions.glowSize);
}
@vertex
fn mirrorVertexCircle(@builtin(instance_index) instanceIndex: u32, @builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    return vertex_main(instanceIndex, vertexIndex, options.particleSize);
}

@fragment
fn mirrorFragmentGlow(in: VertexOutput) -> @location(0) vec4<f32> {
    let dist_sq = dot(in.offset, in.offset);
    if (dist_sq > 1.0) { discard; }

    let isMirror = f32(in.mirrorIndex != 0u);
    let grayscale = dot(in.color.rgb, GRAYSCALE_WEIGHTS);
    let finalColor = mix(in.color.rgb, vec3f(grayscale), isMirror);

    let falloff = saturate(1.0 - dist_sq);
    var alpha = pow(falloff, glowOptions.glowSteepness) * glowOptions.glowIntensity;
    alpha = alpha * mix(1.0, 0.75, isMirror);

    if (alpha < 0.0001) { discard; }
    return vec4<f32>(finalColor * alpha, alpha);
}
@fragment
fn mirrorFragmentCircle(in: VertexOutput) -> @location(0) vec4<f32> {
    let dist_sq = dot(in.offset, in.offset);
    if (dist_sq > 1.0) { discard; }

    let isMirror = f32(in.mirrorIndex != 0u);
    let grayscale = dot(in.color.rgb, GRAYSCALE_WEIGHTS);
    let finalColor = mix(in.color.rgb, vec3f(grayscale), isMirror);

    let linear_color = pow(finalColor, vec3<f32>(2.2)); // Convert color to linear space for proper blending

    let particleOpacity = glowOptions.particleOpacity;
    let alpha = in.color.a * mix(particleOpacity, particleOpacity * 0.75, isMirror);
    return vec4f(linear_color, alpha);
}
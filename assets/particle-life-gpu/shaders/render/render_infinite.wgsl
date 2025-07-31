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
};
struct InfiniteRenderOptions {
    start: vec2<i32>,
    numCopies: vec2<i32>,
};

const QUAD_VERTICES = array<vec2<f32>, 4>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0,  1.0)
);

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<storage, read> colors: array<vec4<f32>>;
@group(1) @binding(0) var<uniform> options: SimOptions;
@group(2) @binding(0) var<uniform> camera: Camera;
@group(3) @binding(0) var<uniform> glowOptions: GlowOptions;
@group(3) @binding(1) var<uniform> infiniteOptions: InfiniteRenderOptions;

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) offset: vec2<f32>,
    @location(1) color: vec4<f32>,
};

fn vertex_main(instanceIndex: u32, vertexIndex: u32, size: f32) -> VertexOutput {
    let particleIndex = instanceIndex % options.numParticles;
    let copyInstanceIndex = instanceIndex / options.numParticles;

    let numCopiesX = u32(infiniteOptions.numCopies.x);
    let copyY = copyInstanceIndex / numCopiesX;
    let copyX = copyInstanceIndex - copyY * numCopiesX; // Faster than modulo (copyInstanceIndex % numCopiesX)

    let particle = particles[particleIndex];
    let color = colors[u32(particle.particleType)];
    let worldPos = vec2<f32>(
       fma(f32(i32(copyX) + infiniteOptions.start.x), options.simWidth, particle.x),
       fma(f32(i32(copyY) + infiniteOptions.start.y), options.simHeight, particle.y)
    );

    let cameraScale = vec2<f32>(camera.scaleX, -camera.scaleY);
    let cameraCenter = vec2<f32>(camera.centerX, camera.centerY);
    let transformedCenterPos = fma(worldPos, cameraScale, -cameraCenter * cameraScale);

    let quadOffset = QUAD_VERTICES[vertexIndex];
    let vertexOffset = quadOffset * size * cameraScale;
    let finalPos = transformedCenterPos + vertexOffset;

    return VertexOutput(
       vec4<f32>(finalPos, 0.0, 1.0),
       quadOffset,
       color
    );
}
@vertex
fn infiniteVertex(@builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
    return vertex_main(instanceIndex, vertexIndex, options.particleSize);
}
@vertex
fn infiniteVertexGlow(@builtin(instance_index) instanceIndex: u32, @builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    return vertex_main(instanceIndex, vertexIndex, options.particleSize * glowOptions.glowSize);
}
@vertex
fn infiniteVertexCircle(@builtin(instance_index) instanceIndex: u32, @builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    return vertex_main(instanceIndex, vertexIndex, options.particleSize);
}

@fragment
fn infiniteFragment(in: VertexOutput) -> @location(0) vec4f {
    let dist_sq = dot(in.offset, in.offset);
    if (dist_sq > 1.0) { discard; }

    return vec4f(in.color.rgb, in.color.a * options.particleOpacity);
}
@fragment
fn infiniteFragmentGlow(in: VertexOutput) -> @location(0) vec4f {
    let dist_sq = dot(in.offset, in.offset);
    if (dist_sq > 1.0) { discard; }

    let falloff = saturate(1.0 - dist_sq);
    let alpha = pow(falloff, glowOptions.glowSteepness) * glowOptions.glowIntensity;

    if (alpha < 0.0001) { discard; }
    return vec4<f32>(in.color.rgb * alpha, alpha);
}
@fragment
fn infiniteFragmentCircle(in: VertexOutput) -> @location(0) vec4f {
    let dist_sq = dot(in.offset, in.offset);
    if (dist_sq > 1.0) { discard; }

    let linear_color = pow(in.color.rgb, vec3<f32>(2.2)); // Convert color to linear space for proper blending

    return vec4f(linear_color, in.color.a * options.particleOpacity);
}
struct SimOptions {
    simWidth: f32,
    simHeight: f32,
    simDepth: f32,
    gridWidth: u32,
    gridHeight: u32,
    gridDepth: u32,
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
    extendedGridDepth: u32,
    gridOffsetX: u32,
    gridOffsetY: u32,
    gridOffsetZ: u32,
    cellSubdivisions: u32,
};
struct Particle {
    x : f32,
    y : f32,
    z : f32,
    vx : f32,
    vy : f32,
    vz : f32,
    particleType : f32,
};
struct Camera {
    viewProjMatrix: mat4x4<f32>,
    aspectRatio: f32,
    fovY: f32,
    nearPlane: f32,
    farPlane: f32,
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

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) offset: vec2<f32>,
    @location(1) color: vec4<f32>,
    @location(2) depthShade: f32,
}

@vertex
fn vertexMain(
    @builtin(instance_index) instanceIndex: u32,
    @builtin(vertex_index) vertexIndex: u32
) -> VertexOutput {
    if (instanceIndex >= options.numParticles) {
        return VertexOutput(vec4f(2.0, 2.0, 2.0, 1.0), vec2f(0.0), vec4f(0.0), 0.0);
    }
    let particle = particles[instanceIndex];
    let color = colors[u32(particle.particleType)];

    // Center the simulation around the origin and normalize using the largest axis,
    // so the simulation cube fits roughly in [-1, 1] on its largest dimension.
    let simSize = vec3f(options.simWidth, options.simHeight, options.simDepth);
    let halfSize = simSize * 0.5;
    let normScale = 1.0 / max(max(halfSize.x, halfSize.y), halfSize.z);
    let centered = vec3f(particle.x, particle.y, particle.z) - halfSize;
    // Flip Y so the simulation Y axis (downwards on screen) maps to standard Y-up world space.
    let worldPos = vec3f(centered.x, -centered.y, centered.z) * normScale;

    // Apply view-projection from the controllable camera.
    let centerClip = camera.viewProjMatrix * vec4f(worldPos, 1.0);

    // Billboard offset: keep the particle facing the camera by offsetting in clip space.

    let aspect = camera.aspectRatio;
    let fovY = camera.fovY;
    let f = 1.0 / tan(fovY * 0.5);
    let quadOffset = QUAD_VERTICES[vertexIndex];
    let pixelSize = options.particleSize;
    let billboardRadius = pixelSize * normScale * f;
    let offsetClip = vec2f(quadOffset.x / aspect, quadOffset.y) * billboardRadius;

    let clipPos = vec4f(centerClip.x + offsetClip.x,
                        centerClip.y + offsetClip.y,
                        centerClip.z,
                        centerClip.w);

    // Simple depth-based shading using clip-space w (≈ view-space distance).
    let depthShade = clamp(1.0 - (centerClip.w - 1.0) * 0.35, 0.35, 1.0);

    return VertexOutput(
        clipPos,
        quadOffset,
        color,
        depthShade
    );
}

@fragment
fn fragmentMain(in: VertexOutput) -> @location(0) vec4f {
    let dist_sq = dot(in.offset, in.offset);
    // Discard fragments outside the disc so they don't write to the depth buffer
    // (otherwise the transparent quad corners would occlude particles behind them).
    if (dist_sq > 1.0) {
        discard;
    }
    let edge_width = fwidth(dist_sq);
    let alpha = 1.0 - smoothstep(max(0.0, 1.0 - edge_width), 1.0, dist_sq);

    let shaded = in.color.rgb * in.depthShade;
    return vec4f(shaded, in.color.a * options.particleOpacity * alpha);
}

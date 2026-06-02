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
struct RenderOptions {
    isParticleBorder: u32,
    isSphereShading: u32,
    ambient: f32,
    diffuseStrength: f32,
    specularStrength: f32,
    shininess: f32,
    lightDir: vec4<f32>, // xyz = direction (normalized in shader); w reserved
};

const QUAD_VERTICES = array<vec2<f32>, 4>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0,  1.0)
);

@group(0) @binding(0) var<storage, read> particles : array<Particle>;
@group(0) @binding(1) var<storage, read> colors : array<vec4<f32>>;
@group(1) @binding(0) var<uniform> options : SimOptions;
@group(2) @binding(0) var<uniform> camera : Camera;
@group(3) @binding(0) var<uniform> render : RenderOptions;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) offset: vec2<f32>,
    @location(1) color: vec4<f32>,
    @location(2) depthShade: f32,
};

fn vertex_main(instanceIndex: u32, vertexIndex: u32) -> VertexOutput {
    if (instanceIndex >= options.numParticles) {
        return VertexOutput(vec4f(2.0, 2.0, 2.0, 1.0), vec2f(0.0), vec4f(0.0), 0.0);
    }
    let particle = particles[instanceIndex];
    let color = colors[u32(particle.particleType)];

    let simSize = vec3f(options.simWidth, options.simHeight, options.simDepth);
    let halfSize = simSize * 0.5;
    let normScale = 1.0 / max(max(halfSize.x, halfSize.y), halfSize.z);
    let centered = vec3f(particle.x, particle.y, particle.z) - halfSize;
    let worldPos = vec3f(centered.x, -centered.y, centered.z) * normScale;
    let centerClip = camera.viewProjMatrix * vec4f(worldPos, 1.0);

    let aspect = camera.aspectRatio;
    let f = 1.0 / tan(camera.fovY * 0.5);
    let quadOffset = QUAD_VERTICES[vertexIndex];
    let billboardRadius = options.particleSize * normScale * f;
    let offsetClip = vec2f(quadOffset.x / aspect, quadOffset.y) * billboardRadius;

    let clipPos = vec4f(centerClip.x + offsetClip.x, centerClip.y + offsetClip.y, centerClip.z, centerClip.w);

    let depthShade = clamp(1.0 - (centerClip.w - 1.0) * 0.35, 0.35, 1.0);

    return VertexOutput(clipPos, quadOffset, color, depthShade);
}

@vertex
fn vertexCircle(@builtin(instance_index) instanceIndex: u32, @builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    return vertex_main(instanceIndex, vertexIndex);
}

@fragment
fn fragmentCircle(in: VertexOutput) -> @location(0) vec4<f32> {
    let dist_sq = dot(in.offset, in.offset);
    if (dist_sq > 1.0) { discard; }

    var coverage: f32 = 1.0;
    if (render.isParticleBorder != 0u) {
        let edge_width = min(fwidth(dist_sq), 0.20);
        coverage = 1.0 - smoothstep(1.0 - edge_width, 1.0, dist_sq);
    }

    let linearColor = pow(in.color.rgb, vec3<f32>(2.2));
    var shaded = linearColor * in.depthShade;
    if (render.isSphereShading != 0u) {
        let r = in.offset;
        let z2 = max(1.0 - dist_sq, 0.0);
        let n = vec3<f32>(r.x, r.y, sqrt(z2));
        let L = normalize(render.lightDir.xyz);
        let V = vec3<f32>(0.0, 0.0, 1.0);
        let H = normalize(L + V);
        let diff = max(dot(n, L), 0.0);
        let spec = pow(max(dot(n, H), 0.0), max(render.shininess, 1.0));
        let lit = render.ambient + render.diffuseStrength * diff;
        shaded = (linearColor * lit + vec3<f32>(render.specularStrength * spec)) * in.depthShade;
    }
    return vec4<f32>(shaded * coverage, in.color.a * options.particleOpacity);
}

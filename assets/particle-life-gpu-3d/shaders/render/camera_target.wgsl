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
struct Camera {
    viewProjMatrix: mat4x4<f32>,
    aspectRatio: f32,
    fovY: f32,
    nearPlane: f32,
    farPlane: f32,
    focus: vec4<f32>, // xyz = camera focus point (normalized world space); w unused
};

const TAU = 6.2831853;
const CIRCLE_SEGMENTS = 24u;
const CIRCLE_VERTS = 48u; // CIRCLE_SEGMENTS * 2 (line-list)
const CIRCLE_R_WORLD = 0.050; // circle radius, in normalized world units
const AXIS_LEN_WORLD = 0.110; // axis half-length (protrudes past the circle)

const AXIS_COLORS = array<vec3<f32>, 3>(
    vec3<f32>(0.95, 0.32, 0.32), // X red
    vec3<f32>(0.40, 0.90, 0.45), // Y green
    vec3<f32>(0.40, 0.62, 0.98), // Z blue
);
const AXIS_DIRS = array<vec3<f32>, 3>(
    vec3<f32>(1.0, 0.0, 0.0),
    vec3<f32>(0.0, 1.0, 0.0),
    vec3<f32>(0.0, 0.0, 1.0),
);

@group(0) @binding(0) var<uniform> options: SimOptions;
@group(1) @binding(0) var<uniform> camera: Camera;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) @interpolate(flat) color: vec3<f32>,
}

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    let fc = camera.viewProjMatrix * vec4<f32>(camera.focus.xyz, 1.0);

    // Circle segments
    if (vertexIndex < CIRCLE_VERTS) {
        let seg = vertexIndex / 2u;
        let isEnd = vertexIndex % 2u;
        let angleIndex = seg + isEnd;
        let angle = TAU * f32(angleIndex) / f32(CIRCLE_SEGMENTS);
        let off = vec2<f32>(cos(angle), sin(angle));
        let focal = 1.0 / tan(camera.fovY * 0.5);
        let radius = CIRCLE_R_WORLD * focal;
        let offClip = vec2<f32>(off.x / camera.aspectRatio, off.y) * radius;
        let pos = vec4<f32>(fc.x + offClip.x, fc.y + offClip.y, fc.z, fc.w);
        return VertexOutput(pos, vec3<f32>(0.85, 0.85, 0.90));
    }

    // Axis segments
    let local = vertexIndex - CIRCLE_VERTS;
    let axis = local / 2u; // 0 = X, 1 = Y, 2 = Z
    let dir = select(-1.0, 1.0, (local % 2u) == 1u);
    let endWorld = camera.focus.xyz + AXIS_DIRS[axis] * (dir * AXIS_LEN_WORLD);
    let clipPos = camera.viewProjMatrix * vec4<f32>(endWorld, 1.0);
    return VertexOutput(clipPos, AXIS_COLORS[axis]);
}

@fragment
fn fragmentMain(in: VertexOutput) -> @location(0) vec4<f32> {
    return vec4<f32>(in.color, 0.9);
}

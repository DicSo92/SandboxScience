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
};

// 8 corners of a unit cube (in [0,1]^3 = simulation space scale).
const CORNERS = array<vec3<f32>, 8>(
    vec3<f32>(0.0, 0.0, 0.0),
    vec3<f32>(1.0, 0.0, 0.0),
    vec3<f32>(1.0, 1.0, 0.0),
    vec3<f32>(0.0, 1.0, 0.0),
    vec3<f32>(0.0, 0.0, 1.0),
    vec3<f32>(1.0, 0.0, 1.0),
    vec3<f32>(1.0, 1.0, 1.0),
    vec3<f32>(0.0, 1.0, 1.0),
);
// 12 edges -> 24 vertex pairs (line-list).
const EDGES = array<u32, 24>(
    // bottom face (z = 0)
    0u, 1u, 1u, 2u, 2u, 3u, 3u, 0u,
    // top face (z = simDepth)
    4u, 5u, 5u, 6u, 6u, 7u, 7u, 4u,
    // vertical pillars
    0u, 4u, 1u, 5u, 2u, 6u, 3u, 7u,
);

@group(0) @binding(0) var<uniform> options: SimOptions;
@group(1) @binding(0) var<uniform> camera: Camera;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) depthShade: f32,
}

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    let cornerIdx = EDGES[vertexIndex];
    let cornerUnit = CORNERS[cornerIdx];

    let simSize = vec3<f32>(options.simWidth, options.simHeight, options.simDepth);
    let halfSize = simSize * 0.5;
    let normScale = 1.0 / max(max(halfSize.x, halfSize.y), halfSize.z);

    // World space position (origin centered on the simulation cube), Y flipped to match render_normal.
    let centered = cornerUnit * simSize - halfSize;
    let worldPos = vec3<f32>(centered.x, -centered.y, centered.z) * normScale;

    let clipPos = camera.viewProjMatrix * vec4<f32>(worldPos, 1.0);

    let depthShade = clamp(1.0 - (clipPos.w - 1.0) * 0.35, 0.35, 1.0);

    return VertexOutput(clipPos, depthShade);
}

@fragment
fn fragmentMain(in: VertexOutput) -> @location(0) vec4<f32> {
    // Soft cyan edges, slightly faded at the back for depth perception.
    let baseColor = vec3<f32>(0.45, 0.85, 0.95);
    return vec4<f32>(baseColor * in.depthShade, 0.85);
}

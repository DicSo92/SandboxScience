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
struct Camera {
    centerX: f32,
    centerY: f32,
    scaleX: f32,
    scaleY: f32,
};
struct DebugOptions {
    isHeatmapActive: u32,
    maxParticleCount: f32,
};

const QUAD_VERTICES = array<vec2<f32>, 4>(
    vec2<f32>(0.0, 0.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 1.0)
);

@group(0) @binding(0) var<storage, read> binOffsets: array<u32>;
@group(0) @binding(1) var heatmapTexture: texture_2d<f32>;
@group(0) @binding(2) var heatmapSampler: sampler;
@group(1) @binding(0) var<uniform> debugOptions: DebugOptions;
@group(2) @binding(0) var<uniform> simOptions: SimOptions;
@group(3) @binding(0) var<uniform> camera: Camera;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) localPos: vec2<f32>,
    @location(1) particleCount: f32,
}
@vertex
fn vertexMain(@builtin(vertex_index) vertex_index: u32, @builtin(instance_index) instance_index: u32) -> VertexOutput {
    let bin_index = instance_index;
    let start_offset = binOffsets[bin_index];
    let end_offset = binOffsets[bin_index + 1];
    let count = end_offset - start_offset;

    let cellSize = simOptions.cellSize;

    var grid_x: f32;
    var grid_y: f32;
    if (simOptions.isWallWrap == 0u && simOptions.isWallRepel == 0u) {
        grid_x = f32(bin_index % simOptions.extendedGridWidth) - f32(simOptions.gridOffsetX);
        grid_y = f32(floor(f32(bin_index) / f32(simOptions.extendedGridWidth))) - f32(simOptions.gridOffsetY);
    } else {
        grid_x = f32(bin_index % simOptions.gridWidth);
        grid_y = f32(floor(f32(bin_index) / f32(simOptions.gridWidth)));
    }

    let binPos = vec2<f32>(grid_x * cellSize, grid_y * cellSize);
    let quadPos = QUAD_VERTICES[vertex_index];
    let worldPos = binPos + quadPos * cellSize;
    let clipPos = (worldPos - vec2<f32>(camera.centerX, camera.centerY)) * vec2<f32>(camera.scaleX, -camera.scaleY);

    return VertexOutput(
        vec4<f32>(clipPos, 0.0, 1.0),
        quadPos,
        f32(count)
    );
}
@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
    if (input.particleCount == 0.0) { discard; }

    if (debugOptions.isHeatmapActive == 0u) {
        return gridMap(max(fwidth(input.localPos.x), fwidth(input.localPos.y)), input);
    } else {
        let normalized_count = clamp(input.particleCount / debugOptions.maxParticleCount, 0.0, 1.0);
        return heatmap(normalized_count);
    //    return simpleHeatmap(normalized_count);
    }
}

fn heatmap(normalized_count: f32) -> vec4<f32> {
    return textureSampleLevel(heatmapTexture, heatmapSampler, vec2(normalized_count, 0.5), 0.0);
}
fn simpleHeatmap(normalized_count: f32) -> vec4<f32> {
    return mix(vec4<f32>(0.0, 0.0, 1.0, 0.1), vec4<f32>(1.0, 0.0, 0.0, 0.5), normalized_count);
}
fn gridMap(px: f32, input: VertexOutput) -> vec4<f32> {
    let x = input.localPos.x;
    let y = input.localPos.y;
    let d = min(min(x, 1.0 - x), min(y, 1.0 - y));

    let borderSize = 1.0;
    let normalized_border = borderSize * px * 0.5;
    let alpha = 1.0 - smoothstep(normalized_border, normalized_border + px, d);

    if (alpha <= 0.0) { discard; }

    let col = vec3<f32>(0.35, 0.35, 0.35);
    return vec4(col, alpha * 0.5);
}
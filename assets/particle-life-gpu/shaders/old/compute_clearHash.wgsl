struct CellHeads { data: array<atomic<u32>> };
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
};

@group(0) @binding(0) var<storage, read_write> cellHeads: CellHeads;
@group(0) @binding(1) var<uniform> options: SimOptions;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x >= options.spatialHashTableSize) { return; }
    atomicStore(&cellHeads.data[id.x], 0xFFFFFFFFu);
}
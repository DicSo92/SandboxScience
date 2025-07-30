struct Positions { data: array<vec2<f32>> };
struct ParticleHashes { data: array<u32> };
struct ParticleNextIndices { data: array<u32> };
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

const P1: i32 = 73856093;
const P2: i32 = 19349663;

fn get_cell_coords(pos: vec2<f32>) -> vec2<i32> {
    return vec2<i32>(floor(pos / options.cellSize));
}
//fn hash_coords(coords: vec2<i32>) -> u32 {
//    let h = u32((coords.x * P1) ^ (coords.y * P2));
//    return h % options.spatialHashTableSize;
//}
//fn hash_coords(coords: vec2<i32>) -> u32 {
//    // Hachage FNV-1a plus uniforme
//    var hash = 2166136261u;
//    hash = (hash ^ u32(coords.x)) * 16777619u;
//    hash = (hash ^ u32(coords.y)) * 16777619u;
//    return hash % options.spatialHashTableSize;
//}
fn hash_coords(coords: vec2<i32>) -> u32 {
    let x = u32(coords.x);
    let y = u32(coords.y);
    return ((x * 73856093u) ^ (y * 19349663u)) & (options.spatialHashTableSize - 1u);
}

@group(0) @binding(0) var<storage, read> positions: Positions;
@group(0) @binding(1) var<storage, read_write> particleHashes: ParticleHashes;
@group(0) @binding(2) var<storage, read_write> cellHeads: CellHeads;
@group(0) @binding(3) var<storage, read_write> particleNextIndices: ParticleNextIndices;
@group(0) @binding(4) var<uniform> options: SimOptions;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let i = id.x;
    if (i >= options.numParticles) { return; }

    let pos = positions.data[i];
    let cell_coords = get_cell_coords(pos);
    let hash = hash_coords(cell_coords);

    particleHashes.data[i] = hash;

    let old_head = atomicExchange(&cellHeads.data[hash], i);
    particleNextIndices.data[i] = old_head;
}
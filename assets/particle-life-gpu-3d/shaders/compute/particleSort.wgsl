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
}
struct BinInfo {
    gridSize : vec3i,
    binId : vec3i,
    binIndex : i32,
}

fn getBinInfo(position: vec3f, options: SimOptions) -> BinInfo {
    var gridSize: vec3i;
    var adjustedPosition = position;

    if (options.isWallWrap == 0u && options.isWallRepel == 0u) {
        gridSize = vec3i(i32(options.extendedGridWidth), i32(options.extendedGridHeight), i32(options.extendedGridDepth));
        adjustedPosition = position + vec3f(f32(options.gridOffsetX) * options.cellSize, f32(options.gridOffsetY) * options.cellSize, f32(options.gridOffsetZ) * options.cellSize);
    } else {
        gridSize = vec3i(i32(options.gridWidth), i32(options.gridHeight), i32(options.gridDepth));
    }

    let binId = vec3i(
        clamp(i32(floor(adjustedPosition.x / options.cellSize)), 0, gridSize.x - 1),
        clamp(i32(floor(adjustedPosition.y / options.cellSize)), 0, gridSize.y - 1),
        clamp(i32(floor(adjustedPosition.z / options.cellSize)), 0, gridSize.z - 1)
    );
    let binIndex = (binId.z * gridSize.y + binId.y) * gridSize.x + binId.x;
    return BinInfo(gridSize, binId, binIndex);
}

@group(0) @binding(0) var<storage, read> source : array<Particle>;
@group(0) @binding(1) var<storage, read_write> destination : array<Particle>;
@group(0) @binding(2) var<storage, read> binOffset : array<u32>;
@group(0) @binding(3) var<storage, read_write> binSize : array<atomic<u32>>;

@group(1) @binding(0) var<uniform> options: SimOptions;

@compute @workgroup_size(64)
fn clearBinSize(@builtin(global_invocation_id) id : vec3u, @builtin(num_workgroups) numWg : vec3u) {
    let idx = id.y * (numWg.x * 64u) + id.x;
    if (idx >= arrayLength(&binSize)) { return; }
    atomicStore(&binSize[idx], 0u);
}

@compute @workgroup_size(64)
fn sortParticles(@builtin(global_invocation_id) id : vec3u) {
    if (id.x >= options.numParticles) { return; }

    let particle = source[id.x];
    let binIndex = getBinInfo(vec3f(particle.x, particle.y, particle.z), options).binIndex;
    let newParticleIndex = binOffset[binIndex] + atomicAdd(&binSize[binIndex], 1u);
    destination[newParticleIndex] = particle;
}
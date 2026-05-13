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

fn getCellId(position: vec3f, options: SimOptions) -> vec3i {
    var cellId = vec3i(
        i32(floor(position.x / options.cellSize)),
        i32(floor(position.y / options.cellSize)),
        i32(floor(position.z / options.cellSize))
    );
    if (options.isWallWrap == 1u) {
        let g = vec3i(i32(options.gridWidth), i32(options.gridHeight), i32(options.gridDepth));
        cellId.x = ((cellId.x % g.x) + g.x) % g.x;
        cellId.y = ((cellId.y % g.y) + g.y) % g.y;
        cellId.z = ((cellId.z % g.z) + g.z) % g.z;
    }
    return cellId;
}

// Teschner et al. 2003 spatial hash. Bitmask requires tableSize to be a power of two.
fn hashCell(cellId: vec3i, tableSize: u32) -> u32 {
    let ix = bitcast<u32>(cellId.x);
    let iy = bitcast<u32>(cellId.y);
    let iz = bitcast<u32>(cellId.z);
    let h = (ix * 73856093u) ^ (iy * 19349663u) ^ (iz * 83492791u);
    return h & (tableSize - 1u);
}

@group(0) @binding(0) var<storage, read> particles : array<Particle>;
@group(1) @binding(0) var<uniform> options: SimOptions;
@group(2) @binding(0) var<storage, read_write> binSize : array<atomic<u32>>;

@compute @workgroup_size(64)
fn clearBinSize(@builtin(global_invocation_id) id : vec3u, @builtin(num_workgroups) numWg : vec3u) {
    let idx = id.y * (numWg.x * 64u) + id.x;
    if (idx >= arrayLength(&binSize)) { return; }
    atomicStore(&binSize[idx], 0u);
}

@compute @workgroup_size(64)
fn fillBinSize(@builtin(global_invocation_id) id : vec3u) {
    if (id.x >= options.numParticles) { return; }

    let particle = particles[id.x];
    let cellId = getCellId(vec3f(particle.x, particle.y, particle.z), options);
    let tableSize = arrayLength(&binSize) - 1u; // binCount, power of two
    let slot = hashCell(cellId, tableSize);
    atomicAdd(&binSize[slot + 1u], 1u);
}

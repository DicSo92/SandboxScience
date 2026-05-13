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
fn rawHashCell(cellId: vec3i) -> u32 {
    let ix = bitcast<u32>(cellId.x);
    let iy = bitcast<u32>(cellId.y);
    let iz = bitcast<u32>(cellId.z);
    return (ix * 73856093u) ^ (iy * 19349663u) ^ (iz * 83492791u);
}

@group(0) @binding(0) var<storage, read> source : array<Particle>;
@group(0) @binding(1) var<storage, read_write> destination : array<Particle>;
@group(0) @binding(2) var<storage, read> binOffset : array<u32>;
@group(0) @binding(3) var<storage, read_write> binSize : array<atomic<u32>>;
@group(0) @binding(4) var<storage, read_write> cellSignature : array<u32>;

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
    let cellId = getCellId(vec3f(particle.x, particle.y, particle.z), options);
    let h = rawHashCell(cellId);
    let tableSize = arrayLength(&binSize) - 1u;
    let slot = h & (tableSize - 1u);
    let newParticleIndex = binOffset[slot] + atomicAdd(&binSize[slot], 1u);
    destination[newParticleIndex] = particle;
    cellSignature[newParticleIndex] = h;
}

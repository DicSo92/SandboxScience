struct InteractionMatrix { data: array<u32> };
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
fn get_interaction(index: u32) -> vec3<f32> {
    let word = interactions.data[index];
    let rule = (f32((word >> 0u) & 0xFFu) - 100.0) * 0.01;
    let minR = f32((word >> 8u) & 0xFFFu);
    let maxR = f32((word >> 20u) & 0xFFFu);
    return vec3<f32>(rule, minR, maxR);
}

@group(0) @binding(0) var<storage, read> particlesSource : array<Particle>;
@group(0) @binding(1) var<storage, read_write> particlesDestination : array<Particle>;
@group(0) @binding(2) var<storage, read> binOffset : array<u32>;
@group(0) @binding(3) var<storage, read> interactions: InteractionMatrix;
@group(0) @binding(4) var<storage, read> cellSignature : array<u32>;

@group(1) @binding(0) var<uniform> options : SimOptions;
@group(2) @binding(0) var<uniform> deltaTime : f32;

@compute @workgroup_size(64)
fn computeForces(@builtin(global_invocation_id) id : vec3u) {
    if (id.x >= options.numParticles) { return; }

    let half_width  = options.simWidth  * 0.5;
    let half_height = options.simHeight * 0.5;
    let half_depth  = options.simDepth  * 0.5;
    let is_wrapping = options.isWallWrap == 1u;
    let repelForce = options.repel;
    let cellSubdivisions = i32(options.cellSubdivisions);

    var particle = particlesSource[id.x];
    let myType = u32(particle.particleType);
    let myTypeOffset = myType * options.numTypes;
    let particlePosition = vec3f(particle.x, particle.y, particle.z);
    let myCell = getCellId(particlePosition, options);

    let tableSize = arrayLength(&binOffset) - 1u;
    let gridSize = vec3i(i32(options.gridWidth), i32(options.gridHeight), i32(options.gridDepth));
    var totalForce = vec3f(0.0, 0.0, 0.0);

    for (var dz = -cellSubdivisions; dz <= cellSubdivisions; dz += 1) {
        for (var dy = -cellSubdivisions; dy <= cellSubdivisions; dy += 1) {
            for (var dx = -cellSubdivisions; dx <= cellSubdivisions; dx += 1) {
                var targetCell = vec3i(myCell.x + dx, myCell.y + dy, myCell.z + dz);
                if (is_wrapping) {
                    targetCell.x = ((targetCell.x % gridSize.x) + gridSize.x) % gridSize.x;
                    targetCell.y = ((targetCell.y % gridSize.y) + gridSize.y) % gridSize.y;
                    targetCell.z = ((targetCell.z % gridSize.z) + gridSize.z) % gridSize.z;
                }

                let slot = rawHashCell(targetCell) & (tableSize - 1u);
                let binStart = binOffset[slot];
                let binEnd   = binOffset[slot + 1u];

                for (var j = binStart; j < binEnd; j += 1u) {
                    if (j == id.x) { continue; }

                    let other = particlesSource[j];
                    let otherPos = vec3f(other.x, other.y, other.z);

                    var r = otherPos - particlePosition;
                    if (is_wrapping) {
                        if (abs(r.x) >= half_width)  { r.x -= sign(r.x) * options.simWidth; }
                        if (abs(r.y) >= half_height) { r.y -= sign(r.y) * options.simHeight; }
                        if (abs(r.z) >= half_depth)  { r.z -= sign(r.z) * options.simDepth; }
                    }

                    let distSquared = dot(r, r);
                    if (distSquared < 0.0001) { continue; }

                    let otherType = u32(other.particleType);
                    let interaction = get_interaction(myTypeOffset + otherType);
                    let maxR = interaction.z;

                    if (distSquared < maxR * maxR) {
                        let invDist = inverseSqrt(distSquared);
                        let dist = distSquared * invDist;
                        let minR = interaction.y;
                        var force : f32;

                        if (dist < minR) {
                            force = fma(dist / minR, repelForce, -repelForce);
                        } else {
                            let rule = interaction.x;
                            let mid = (minR + maxR) * 0.5;
                            let slope = rule / (mid - minR);
                            force = fma(-slope, abs(dist - mid), rule);
                        }

                        let scaledForce = force * invDist;
                        totalForce.x = fma(r.x, scaledForce, totalForce.x);
                        totalForce.y = fma(r.y, scaledForce, totalForce.y);
                        totalForce.z = fma(r.z, scaledForce, totalForce.z);
                    }
                }
            }
        }
    }

    let forceFactor = options.forceFactor * deltaTime * 60.0;
    particle.vx = fma(totalForce.x, forceFactor, particle.vx);
    particle.vy = fma(totalForce.y, forceFactor, particle.vy);
    particle.vz = fma(totalForce.z, forceFactor, particle.vz);

    particlesDestination[id.x] = particle;
}

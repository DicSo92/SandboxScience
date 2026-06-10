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
fn get_interaction(index: u32) -> vec3<f32> {
    let word = interactions.data[index];
//    let rule = (f32((word >> 0u) & 0xFFu) / 255.0) * 2.0 - 1.0;
//    let rule = fma(f32((word >> 0u) & 0xFFu), 1.0 / 127.5, -1.0);
    let rule = (f32((word >> 0u) & 0xFFu) - 100.0) * 0.01;
    let minR = f32((word >> 8u) & 0xFFu);
    let maxR = f32((word >> 16u) & 0xFFFFu);
    return vec3<f32>(rule, minR, maxR);
}

@group(0) @binding(0) var<storage, read> particlesSource : array<Particle>;
@group(0) @binding(1) var<storage, read_write> particlesDestination : array<Particle>;
@group(0) @binding(2) var<storage, read> binOffset : array<u32>;
@group(0) @binding(3) var<storage, read> interactions: InteractionMatrix;

@group(1) @binding(0) var<uniform> options : SimOptions;

@compute @workgroup_size(64)
fn computeForces(@builtin(global_invocation_id) id : vec3u) {
    if (id.x >= options.numParticles) { return; }

    let half_width = options.simWidth * 0.5;
    let half_height = options.simHeight * 0.5;
    let half_depth = options.simDepth * 0.5;
    let is_wrapping = options.isWallWrap == 1u;
    let repelForce = options.repel;
    let cellSubdivisions = i32(options.cellSubdivisions);

    var particle = particlesSource[id.x];
    let myType = u32(particle.particleType);
    let myTypeOffset = myType * options.numTypes;
    let particlePosition = vec3f(particle.x, particle.y, particle.z);
    let binInfo = getBinInfo(particlePosition, options);

    var binXMin = binInfo.binId.x - cellSubdivisions;
    var binYMin = binInfo.binId.y - cellSubdivisions;
    var binZMin = binInfo.binId.z - cellSubdivisions;
    var binXMax = binInfo.binId.x + cellSubdivisions;
    var binYMax = binInfo.binId.y + cellSubdivisions;
    var binZMax = binInfo.binId.z + cellSubdivisions;

    if (!is_wrapping) {
        binXMin = max(0, binXMin);
        binYMin = max(0, binYMin);
        binZMin = max(0, binZMin);
        binXMax = min(binInfo.gridSize.x - 1, binXMax);
        binYMax = min(binInfo.gridSize.y - 1, binYMax);
        binZMax = min(binInfo.gridSize.z - 1, binZMax);
    }

    var totalForce = vec3f(0.0, 0.0, 0.0);

    for (var binZ = binZMin; binZ <= binZMax; binZ += 1) {
        for (var binY = binYMin; binY <= binYMax; binY += 1) {
            for (var binX = binXMin; binX <= binXMax; binX += 1) {
                var realBinX = binX;
                var realBinY = binY;
                var realBinZ = binZ;
                if (is_wrapping) {
                    if (binX < 0) { realBinX = binX + binInfo.gridSize.x; }
                    else if (binX >= binInfo.gridSize.x) { realBinX = binX - binInfo.gridSize.x; }
                    if (binY < 0) { realBinY = binY + binInfo.gridSize.y; }
                    else if (binY >= binInfo.gridSize.y) { realBinY = binY - binInfo.gridSize.y; }
                    if (binZ < 0) { realBinZ = binZ + binInfo.gridSize.z; }
                    else if (binZ >= binInfo.gridSize.z) { realBinZ = binZ - binInfo.gridSize.z; }
                }
                let binIndex = u32((realBinZ * binInfo.gridSize.y + realBinY) * binInfo.gridSize.x + realBinX);
                let binStart = binOffset[binIndex];
                let binEnd = binOffset[binIndex + 1u];

                for (var j = binStart; j < binEnd; j += 1u) {
                    if (j == id.x) { continue; }

                    let other = particlesSource[j];

                    var r = vec3f(other.x, other.y, other.z) - particlePosition;

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

    particle.vx = fma(totalForce.x, options.forceFactor, particle.vx);
    particle.vy = fma(totalForce.y, options.forceFactor, particle.vy);
    particle.vz = fma(totalForce.z, options.forceFactor, particle.vz);

    particlesDestination[id.x] = particle;
}

//@compute @workgroup_size(64)
//fn computeForces(@builtin(global_invocation_id) id : vec3u) {
//    if (id.x >= options.numParticles) { return; }
//
//    let half_width = options.simWidth * 0.5;
//    let half_height = options.simHeight * 0.5;
//    let is_wrapping = options.isWallWrap == 1u;
//
//    var particle = particlesSource[id.x];
//    let myType = u32(particle.particleType);
//    let binInfo = getBinInfo(vec2f(particle.x, particle.y), options);
//
//    var totalForce = vec2f(0.0, 0.0);
//    let particlePosition = vec2f(particle.x, particle.y);
//
//    // Boucle unifiée sur le voisinage 3x3
//    for (var dx = -1; dx <= 1; dx += 1) {
//        for (var dy = -1; dy <= 1; dy += 1) {
//            var realBinX = binInfo.binId.x + dx;
//            var realBinY = binInfo.binId.y + dy;
//
//            if (is_wrapping) {
//                if (realBinX < 0) { realBinX += binInfo.gridSize.x; }
//                else if (realBinX >= binInfo.gridSize.x) { realBinX -= binInfo.gridSize.x; }
//                if (realBinY < 0) { realBinY += binInfo.gridSize.y; }
//                else if (realBinY >= binInfo.gridSize.y) { realBinY -= binInfo.gridSize.y; }
//            } else {
//                if (realBinX < 0 || realBinX >= binInfo.gridSize.x ||
//                    realBinY < 0 || realBinY >= binInfo.gridSize.y) {
//                    continue;
//                }
//            }
//
//            let binIndex = u32(realBinY * binInfo.gridSize.x + realBinX);
//            let binStart = binOffset[binIndex];
//            let binEnd = binOffset[binIndex + 1];
//
//            for (var j = binStart; j < binEnd; j += 1) {
//                if (j == id.x) { continue; }
//
//                let other = particlesSource[j];
//                let otherType = u32(other.particleType);
//
//                let interactionIndex = myType * options.numTypes + otherType;
//                let interaction = get_interaction(interactionIndex);
//
//                var r = vec2f(other.x, other.y) - particlePosition;
//
//                if (is_wrapping) {
//                    if (abs(r.x) >= half_width) { r.x -= sign(r.x) * options.simWidth; }
//                    if (abs(r.y) >= half_height) { r.y -= sign(r.y) * options.simHeight; }
//                }
//
//                let maxR = interaction.z;
//                let distSquared = dot(r, r);
//
//                if (distSquared > 0.0001 && distSquared < maxR * maxR) {
//                    let dist = sqrt(distSquared);
//                    let minR = interaction.y;
//                    var force = 0.0;
//
//                    if (dist < minR) {
//                        force = (dist * (1.0 / minR) - 1.0) * options.repel;
//                    } else {
//                        let rule = interaction.x;
//                        let mid = (minR + maxR) * 0.5;
//                        if (mid > minR) { // Évite la division par zéro
//                            let invSlopeDenom = 1.0 / (mid - minR);
//                            let slope = rule * invSlopeDenom;
//                            force = -(slope * abs(dist - mid)) + rule;
//                        }
//                    }
//                    if (force != 0.0) {
//                        let invDist = 1.0 / dist;
//                        let scaledForce = force * invDist;
//                        totalForce.x += r.x * scaledForce;
//                        totalForce.y += r.y * scaledForce;
//                    }
//                }
//            }
//        }
//    }
//
//    particle.vx += totalForce.x * options.forceFactor;
//    particle.vy += totalForce.y * options.forceFactor;
//
//    particlesDestination[id.x] = particle;
//}

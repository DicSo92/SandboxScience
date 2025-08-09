struct InteractionMatrix { data: array<u32> };
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
struct Particle {
    x : f32,
    y : f32,
    vx : f32,
    vy : f32,
    particleType : f32,
}
struct BinInfo {
    gridSize : vec2i,
    binId : vec2i,
    binIndex : i32,
}

fn getBinInfo(position: vec2f, options: SimOptions) -> BinInfo {
    var gridSize: vec2i;
    var adjustedPosition = position;

    if (options.isWallWrap == 0u && options.isWallRepel == 0u) {
        gridSize = vec2i(i32(options.extendedGridWidth), i32(options.extendedGridHeight));
        adjustedPosition = position + vec2f(f32(options.gridOffsetX) * options.cellSize, f32(options.gridOffsetY) * options.cellSize);
    } else {
        gridSize = vec2i(i32(options.gridWidth), i32(options.gridHeight));
    }

    let binId = vec2i(
        clamp(i32(floor(adjustedPosition.x / options.cellSize)), 0, gridSize.x - 1),
        clamp(i32(floor(adjustedPosition.y / options.cellSize)), 0, gridSize.y - 1)
    );
    let binIndex = binId.y * gridSize.x + binId.x;
    return BinInfo(gridSize, binId, binIndex);
}
fn get_interaction(index: u32) -> vec3<f32> {
    let word = interactions.data[index];
    let rule = (f32((word >> 0u) & 0xFFu) / 255.0) * 2.0 - 1.0;
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
    let is_wrapping = options.isWallWrap == 1u;

    var particle = particlesSource[id.x];
    let myType = u32(particle.particleType);
    let binInfo = getBinInfo(vec2f(particle.x, particle.y), options);

    var binXMin = binInfo.binId.x - 1;
    var binYMin = binInfo.binId.y - 1;
    var binXMax = binInfo.binId.x + 1;
    var binYMax = binInfo.binId.y + 1;

    if (!is_wrapping) {
        binXMin = max(0, binXMin);
        binYMin = max(0, binYMin);
        binXMax = min(binInfo.gridSize.x - 1, binXMax);
        binYMax = min(binInfo.gridSize.y - 1, binYMax);
    }

    var totalForce = vec2f(0.0, 0.0);
    let particlePosition = vec2f(particle.x, particle.y);

    for (var binX = binXMin; binX <= binXMax; binX += 1) {
        for (var binY = binYMin; binY <= binYMax; binY += 1) {
            var realBinX = binX;
            var realBinY = binY;
            if (is_wrapping) {
//                realBinX = (binX + binInfo.gridSize.x) % binInfo.gridSize.x;
//                realBinY = (binY + binInfo.gridSize.y) % binInfo.gridSize.y;
                if (binX < 0) { realBinX = binX + binInfo.gridSize.x; }
                else if (binX >= binInfo.gridSize.x) { realBinX = binX - binInfo.gridSize.x; }
                if (binY < 0) { realBinY = binY + binInfo.gridSize.y; }
                else if (binY >= binInfo.gridSize.y) { realBinY = binY - binInfo.gridSize.y; }
            }
            let binIndex = u32(realBinY * binInfo.gridSize.x + realBinX);
            let binStart = binOffset[binIndex];
            let binEnd = binOffset[binIndex + 1];

            for (var j = binStart; j < binEnd; j += 1) {
                if (j == id.x) { continue; }

                let other = particlesSource[j];
                let otherType = u32(other.particleType);

                let interactionIndex = myType * options.numTypes + otherType;
                let interaction = get_interaction(interactionIndex);

                var r = vec2f(other.x, other.y) - particlePosition;

                if (is_wrapping) {
                    if (abs(r.x) >= half_width) { r.x -= sign(r.x) * options.simWidth; }
                    if (abs(r.y) >= half_height) { r.y -= sign(r.y) * options.simHeight; }
                }

                let maxR = interaction.z;
                let distSquared = dot(r, r);

                if (distSquared > 0.0001 && distSquared < maxR * maxR) {
                    let dist = sqrt(distSquared);
                    let minR = interaction.y;
                    var force = 0.0;

                    if (dist < minR) {
//                        force = (options.repel / minR) * dist - options.repel;
                        force = (dist * (1.0 / minR) - 1.0) * options.repel;
//                        force = (dist / minR - 1.0) * options.repel;
                    } else {
                        let rule = interaction.x;
                        let mid = (minR + maxR) * 0.5;
                        let invSlopeDenom = 1.0 / (mid - minR);
                        let slope = rule * invSlopeDenom;
                        force = -(slope * abs(dist - mid)) + rule;
                    }
                    if (force != 0.0) {
                        let invDist = 1.0 / dist;
//                        totalForce += r * (force * invDist);
                        let scaledForce = force * invDist;
                        totalForce.x += r.x * scaledForce;
                        totalForce.y += r.y * scaledForce;
                    }
                }
            }
        }
    }

    particle.vx += totalForce.x * options.forceFactor;
    particle.vy += totalForce.y * options.forceFactor;

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
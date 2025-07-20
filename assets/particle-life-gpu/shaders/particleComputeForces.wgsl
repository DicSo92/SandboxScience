struct InteractionMatrix { data: array<u32> };
struct SimOptions {
  isWallRepel: u32,
  isWallWrap: u32,
  forceFactor: f32,
  frictionFactor: f32,
  repel: f32,
  particleSize: f32,
  simWidth: f32,
  simHeight: f32,
  cellSize: f32,
  hashTableSize: u32,
  numParticles: u32,
  numTypes: u32,
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
    let gridSize = vec2i(
        i32(ceil(options.simWidth / options.cellSize)),
        i32(ceil(options.simHeight / options.cellSize)),
    );
    let binId = vec2i(
        clamp(i32(floor(position.x / options.cellSize)), 0, i32(gridSize.x) - 1),
        clamp(i32(floor(position.y / options.cellSize)), 0, i32(gridSize.y) - 1)
    );
    let binIndex = binId.y * gridSize.x + binId.x;
    return BinInfo(gridSize, binId, binIndex);
}
fn get_interaction(index: u32, numTypes: u32) -> vec3<f32> {
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
    if (id.x >= arrayLength(&particlesSource)) { return; }

    var particle = particlesSource[id.x];
    let myType = u32(particle.particleType);
    let binInfo = getBinInfo(vec2f(particle.x, particle.y), options);

    var binXMin = binInfo.binId.x - 1;
    var binYMin = binInfo.binId.y - 1;

    var binXMax = binInfo.binId.x + 1;
    var binYMax = binInfo.binId.y + 1;

    if (options.isWallWrap != 1u) {
        binXMin = max(0, binXMin);
        binYMin = max(0, binYMin);
        binXMax = min(binInfo.gridSize.x - 1, binXMax);
        binYMax = min(binInfo.gridSize.y - 1, binYMax);
    }

    let width = options.simWidth;
    let height = options.simHeight;

    var totalForce = vec2f(0.0, 0.0);

    let particlePosition = vec2f(particle.x, particle.y);

    for (var binX = binXMin; binX <= binXMax; binX += 1) {
        for (var binY = binYMin; binY <= binYMax; binY += 1) {
            var realBinX = (binX + binInfo.gridSize.x) % binInfo.gridSize.x;
            var realBinY = (binY + binInfo.gridSize.y) % binInfo.gridSize.y;

            let binIndex = realBinY * binInfo.gridSize.x + realBinX;
            let binStart = binOffset[binIndex];
            let binEnd = binOffset[binIndex + 1];

            for (var j = binStart; j < binEnd; j += 1) {
                if (j == id.x) { continue; }

                let other = particlesSource[j];
                let otherType = u32(other.particleType);

                let index = myType * u32(options.numTypes) + otherType;
                let force = get_interaction(index, options.numTypes);

                var r = vec2f(other.x, other.y) - particlePosition;

                if (options.isWallWrap == 1u) {
                    if (abs(r.x) >= width * 0.5) { r.x -= sign(r.x) * width; }
                    if (abs(r.y) >= height * 0.5) { r.y -= sign(r.y) * height; }
                }

//                let d = length(r);
//                if (d > 0.0 && d < force.z) {
//                    let n = r / d;
//
//                    totalForce += force.x * max(0.0, 1.0 - d / force.z) * n;
//                    totalForce -= force.x * max(0.0, 1.0 - d / force.y) * n;
//                }

                let d = length(r);
                let minR = force.y;
                let maxR = force.z;

                if (d > 0.0 && d < maxR) {
                    let rule = force.x;
                    var force_magnitude = 0.0;

                    if (d < minR) {
                        force_magnitude = (d / minR - 1.0) * options.repel;
                    } else {
                        let mid = (minR + maxR) / 2.0;
                        let slope = rule / (mid - minR);
                        force_magnitude = -(slope * abs(d - mid)) + rule;
                    }
                    if (force_magnitude != 0.0) {
                        totalForce += r * (force_magnitude / d);
                    }
                }
            }
        }
    }

    particle.vx += totalForce.x * options.forceFactor;
    particle.vy += totalForce.y * options.forceFactor;

    particlesDestination[id.x] = particle;
}
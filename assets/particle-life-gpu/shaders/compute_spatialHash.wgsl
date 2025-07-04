struct Particles { data: array<vec2<f32>> };
struct Types { data: array<u32> };
struct InteractionMatrix { data: array<f32> };
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
    spatialHashTableSize: u32,
    numParticles: u32,
    numTypes: u32
};

struct ParticleNextIndices { data: array<u32> };
struct CellHeads { data: array<u32> };

@group(0) @binding(0) var<storage, read> currentPositions: Particles;
@group(0) @binding(1) var<storage, read_write> nextPositions: Particles;
@group(0) @binding(2) var<storage, read_write> velocities: Particles;
@group(0) @binding(3) var<storage, read> types: Types;
@group(0) @binding(4) var<storage, read> interactions: InteractionMatrix;
@group(0) @binding(5) var<uniform> deltaTime: f32;
@group(0) @binding(6) var<uniform> options: SimOptions;
@group(0) @binding(7) var<storage, read> cellHeads: CellHeads;
@group(0) @binding(8) var<storage, read> particleNextIndices: ParticleNextIndices;

const P1: i32 = 73856093;
const P2: i32 = 19349663;

fn get_cell_coords(pos: vec2<f32>) -> vec2<i32> {
    return vec2<i32>(floor(pos / options.cellSize));
}
fn hash_coords(coords: vec2<i32>) -> u32 {
    let h = u32((coords.x * P1) ^ (coords.y * P2));
    return h % options.spatialHashTableSize;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let i = id.x;
    if (i >= options.numParticles) { return; }

    let GRID_WIDTH: i32 = i32(ceil(options.simWidth / options.cellSize));
    let GRID_HEIGHT: i32 = i32(ceil(options.simHeight / options.cellSize));

    let myPos = currentPositions.data[i];
    let myType = types.data[i];
    var velocitySum = vec2<f32>(0.0, 0.0);

    let my_cell_coords = get_cell_coords(myPos);

    for (var offsetY = -1; offsetY <= 1; offsetY = offsetY + 1) {
        for (var offsetX = -1; offsetX <= 1; offsetX = offsetX + 1) {
            var neighbor_cell_coords = my_cell_coords + vec2<i32>(offsetX, offsetY);

            if (options.isWallWrap == 1u) {
                if (neighbor_cell_coords.x < 0) { neighbor_cell_coords.x += GRID_WIDTH; }
                if (neighbor_cell_coords.x >= GRID_WIDTH) { neighbor_cell_coords.x -= GRID_WIDTH; }
                if (neighbor_cell_coords.y < 0) { neighbor_cell_coords.y += GRID_HEIGHT; }
                if (neighbor_cell_coords.y >= GRID_HEIGHT) { neighbor_cell_coords.y -= GRID_HEIGHT; }
            }

            let hash = hash_coords(neighbor_cell_coords);
            var j = cellHeads.data[hash];

            loop {
                if (j == 0xFFFFFFFFu) { // End of the linked list
                    break;
                }
                if (i == j) { // Skip self
                    j = particleNextIndices.data[j];
                    continue;
                }

                let otherPos = currentPositions.data[j];
                let otherType = types.data[j];
                var delta = otherPos - myPos;

                if (options.isWallWrap == 1u) {
                    if (delta.x > options.simWidth / 2.0) { delta.x -= options.simWidth; }
                    else if (delta.x < -options.simWidth / 2.0) { delta.x += options.simWidth; }
                    if (delta.y > options.simHeight / 2.0) { delta.y -= options.simHeight; }
                    else if (delta.y < -options.simHeight / 2.0) { delta.y += options.simHeight; }
                }

                let distSquared = dot(delta, delta);
                let index = (myType * options.numTypes + otherType) * 3u;
                let maxR = interactions.data[index + 2];

                if (distSquared > 0.0 && distSquared < maxR * maxR) {
                    let dist = sqrt(distSquared);
                    let rule = interactions.data[index];
                    let minR = interactions.data[index + 1];
                    var force = 0.0;
                    if (dist < minR) {
                        force = (options.repel / minR) * dist - options.repel;
                        // force = options.repel * ((1.0 / minR) * dist - 1.0);
                    } else {
                        let mid = (minR + maxR) / 2.0;
                        let slope = rule / (mid - minR);
                        force = -(slope * abs(dist - mid)) + rule;
                    }
                    if (force != 0.0) {
                        velocitySum += delta * (force / dist);
                    }
                }

                j = particleNextIndices.data[j]; // Move to the next particle in the linked list
            }
        }
    }

    let oldVelocity = velocities.data[i];
    let acceleration = (velocitySum / options.forceFactor);
    var newVelocity = (oldVelocity + acceleration) * options.frictionFactor;

    var newPos = myPos + newVelocity * deltaTime;

    if (options.isWallRepel == 1u) {
        let margin = options.particleSize;
        if (newPos.x < margin || newPos.x > options.simWidth - margin) {
          newVelocity.x = -newVelocity.x * 1.8;
          newPos.x = clamp(newPos.x, margin, options.simWidth - margin);
        }
        if (newPos.y < margin || newPos.y > options.simHeight - margin) {
          newVelocity.y = -newVelocity.y * 1.8;
          newPos.y = clamp(newPos.y, margin, options.simHeight - margin);
        }
    } else if (options.isWallWrap == 1u) {
        if (newPos.x < 0.0) { newPos.x += options.simWidth; }
        else if (newPos.x > options.simWidth) { newPos.x -= options.simWidth; }
        if (newPos.y < 0.0) { newPos.y += options.simHeight; }
        else if (newPos.y > options.simHeight) { newPos.y -= options.simHeight; }
    }

    velocities.data[i] = newVelocity;
    nextPositions.data[i] = newPos;
}
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

@group(0) @binding(0) var<storage, read_write> particles : array<Particle>;
@group(1) @binding(0) var<uniform> options : SimOptions;
@group(2) @binding(0) var<uniform> deltaTime: f32;

@compute @workgroup_size(64)
fn particleAdvance(@builtin(global_invocation_id) id : vec3u) {
    if (id.x >= arrayLength(&particles)) { return; }

    let width = options.simWidth;
    let height = options.simHeight;

    var particle = particles[id.x];

    particle.vx *= (1.0 - options.frictionFactor);
    particle.vy *= (1.0 - options.frictionFactor);

    particle.x += particle.vx * deltaTime;
    particle.y += particle.vy * deltaTime;

    if (options.isWallRepel == 1u) {
        let margin = options.particleSize;
        if (particle.x < margin || particle.x > width - margin) {
          particle.vx *= -1.0;
          particle.x = clamp(particle.x, margin, width - margin);
        }
        if (particle.y < margin || particle.y > height - margin) {
          particle.vy *= -1.0;
          particle.y = clamp(particle.y, margin, height - margin);
        }
    } else if (options.isWallWrap == 1u) {
        if (particle.x < 0.0) { particle.x += width; }
        else if (particle.x >= width) { particle.x -= width; }
        if (particle.y < 0.0) { particle.y += height; }
        else if (particle.y >= height) { particle.y -= height; }
    }

    particles[id.x] = particle;
}
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
struct Camera {
    centerX: f32,
    centerY: f32,
    scaleX: f32,
    scaleY: f32,
}
struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
    @location(1) particleType: f32,
};

const vert = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f( 3.0, -1.0),
    vec2f(-1.0,  3.0)
);

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(1) @binding(0) var<uniform> options: SimOptions;
@group(2) @binding(0) var<uniform> camera: Camera;

@vertex
fn main(
    @builtin(instance_index) instanceIndex: u32,
    @builtin(vertex_index) vertexIndex: u32
) -> VertexOutput {
    let particle = particles[instanceIndex];
    let vertex = vert[vertexIndex];

    let worldPos = vec2f(particle.x, particle.y) + vertex * options.particleSize;
    let clipPos = vec2f(
        (worldPos.x - camera.centerX) * camera.scaleX,
        (worldPos.y - camera.centerY) * -camera.scaleY
    );

    var output: VertexOutput;
    output.position = vec4f(clipPos, 0.0, 1.0);
    output.uv = vertex;
    output.particleType = particle.particleType;
    return output;
}
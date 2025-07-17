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

struct Camera {
    center: vec2f,
    scale: vec2f
};

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) texCoord: vec2f,
    @location(1) @interpolate(flat) instanceIndex: u32
};

@group(0) @binding(1) var<uniform> camera: Camera;
@group(0) @binding(2) var<uniform> options: SimOptions;

const offsets = array<vec2f, 9>(
    // Normal offsets for 5 instances
    vec2f(0.0, 0.0),   // Main texture
    vec2f(-1.0, 0.0),  // Left
    vec2f(1.0, 0.0),   // Right
    vec2f(0.0, 1.0),   // Top
    vec2f(0.0, -1.0),  // Bottom
    // Diagonal offsets if 9 instances are used
    vec2f(-1.0, 1.0),  // Top Left
    vec2f(1.0, 1.0),   // Top Right
    vec2f(-1.0, -1.0), // Bottom Left
    vec2f(1.0, -1.0)   // Bottom Right
);

@vertex
fn main(
    @builtin(instance_index) instanceIndex: u32,
    @location(0) localPos: vec2f
) -> VertexOutput {
    var out: VertexOutput;

    // Calculate the texture coordinates based on the local position
    out.texCoord = localPos * 0.5 + 0.5;

    // Calculate the offset based on the instance index
    let offset = offsets[instanceIndex];
    let offsetTexCoord = out.texCoord + offset;

    // Calculate the world position based on the offset texture coordinates
    let worldPos = offsetTexCoord * vec2f(options.simWidth, options.simHeight);
    let finalPos = (worldPos - camera.center) * camera.scale;

    // Set the output position and instance index
    out.position = vec4f(finalPos.x, -finalPos.y, 0.0, 1.0);
    out.instanceIndex = instanceIndex;

    return out;
}


// For infinite wrapping mirror
//struct VertexOutput {
//    @builtin(position) position: vec4f,
//    @location(0) texCoord: vec2f
//};
//
//@group(0) @binding(1) var<uniform> camera: Camera;
//@group(0) @binding(2) var<uniform> options: SimOptions;
//
//@vertex
//fn main(@location(0) localPos: vec2f) -> VertexOutput {
//    var out: VertexOutput;
//
//    out.position = vec4f(localPos.x, localPos.y, 0.0, 1.0);
//    let worldPos = vec2f(
//        camera.center.x + localPos.x / camera.scale.x,
//        camera.center.y - localPos.y / camera.scale.y
//    );
//    out.texCoord = worldPos / vec2f(options.simWidth, options.simHeight);
//
//    return out;
//}
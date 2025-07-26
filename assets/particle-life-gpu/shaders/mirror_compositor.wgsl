struct SimOptions {
    simWidth: f32,
    simHeight: f32,
    gridWidth: u32,
    gridHeight: u32,
    cellSize: f32,
    numParticles: u32,
    numTypes: u32,
    particleSize: f32,
    isWallRepel: u32,
    isWallWrap: u32,
    forceFactor: f32,
    frictionFactor: f32,
    repel: f32,
    extendedGridWidth: u32,
    extendedGridHeight: u32,
    gridOffsetX: u32,
    gridOffsetY: u32,
};
struct Camera {
    center: vec2f,
    scale: vec2f
};

const mirrorOffsets = array<vec2f, 9>(
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

const QUAD_VERTICES = array<vec2f, 6>(
    vec2f(-1.0, -1.0),
    vec2f( 1.0, -1.0),
    vec2f( 1.0,  1.0),
    vec2f(-1.0, -1.0),
    vec2f( 1.0,  1.0),
    vec2f(-1.0,  1.0)
);

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) texCoord: vec2f
};
struct VertexMirrorOutput {
    @builtin(position) position: vec4f,
    @location(0) texCoord: vec2f,
    @location(1) @interpolate(flat) instanceIndex: u32
};

@group(0) @binding(0) var<uniform> camera: Camera;
@group(1) @binding(0) var<uniform> options: SimOptions;
@group(2) @binding(0) var offscreenTexture: texture_2d<f32>;
@group(2) @binding(1) var offscreenSampler: sampler;

@vertex
fn vertexMirror(
    @builtin(instance_index) instanceIndex: u32,
    @builtin(vertex_index) vertex_index: u32
) -> VertexMirrorOutput {
    var out: VertexMirrorOutput;

    let localPos = QUAD_VERTICES[vertex_index];

    // Calculate the texture coordinates based on the local position
    out.texCoord = localPos * 0.5 + 0.5;

    // Calculate the offset based on the instance index
    let offset = mirrorOffsets[instanceIndex];
    let offsetTexCoord = out.texCoord + offset;

    // Calculate the world position based on the offset texture coordinates
    let worldPos = offsetTexCoord * vec2f(options.simWidth, options.simHeight);
    let finalPos = (worldPos - camera.center) * camera.scale;

    // Set the output position and instance index
    out.position = vec4f(finalPos.x, -finalPos.y, 0.0, 1.0);
    out.instanceIndex = instanceIndex;

    return out;
}

@vertex
fn vertexInfinite(
    @builtin(vertex_index) vertex_index: u32
) -> VertexOutput {
    var out: VertexOutput;
    let localPos = QUAD_VERTICES[vertex_index];

    out.position = vec4f(localPos.x, localPos.y, 0.0, 1.0);
    let worldPos = vec2f(
        camera.center.x + localPos.x / camera.scale.x,
        camera.center.y - localPos.y / camera.scale.y
    );
    out.texCoord = worldPos / vec2f(options.simWidth, options.simHeight);

    return out;
}

@fragment
fn fragmentMirror(
    @location(0) texCoord: vec2f,
    @location(1) @interpolate(flat) instanceIndex: u32
) -> @location(0) vec4f {
    let textureColor = textureSample(offscreenTexture, offscreenSampler, texCoord);

    // Convert to grayscale and apply a fade effect
    let grayscale = dot(textureColor.rgb, vec3f(0.299, 0.587, 0.114));
    let grayscaleColorFade = vec4f(vec3f(grayscale), textureColor.a * 0.65);

    // Select the color for the mirror instance based on alpha value
    // If the alpha is too low, return transparent black
    let mirrorInstanceColor = grayscaleColorFade * step(0.1, textureColor.a);

    // Select the color based on the instance index
    return select(mirrorInstanceColor, textureColor, instanceIndex == 0u);
}

@fragment
fn fragmentInfinite(@location(0) texCoord: vec2f) -> @location(0) vec4f {
    return textureSample(offscreenTexture, offscreenSampler, texCoord);
}
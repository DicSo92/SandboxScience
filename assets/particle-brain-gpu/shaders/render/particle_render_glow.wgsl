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
    cellSubdivisions: u32,  // padding (unused by render)
    matrixStride: u32,      // padding (unused by render)
    numUrges: u32,          // number of urge types (for category detection)
    neuronRadius: f32,      // world-unit radius for the debug dotted circle
    isDebugConnections: u32,// flag: draw dotted circles around urges/neurons
    numSenseNeurons: u32,   // number of sense-neuron types (splits motor vs sense in the render)
    senseRadius: f32,       // world-unit perception radius for the sense debug dotted circle
};
struct Particle {
    x : f32,
    y : f32,
    vx : f32,
    vy : f32,
    particleType : f32,
    control : f32,
    signal  : f32,
    goalB   : f32,
    driveTarget : f32, // brain: desired metric value (homeostasis setpoint)
    driveScale  : f32, // brain: error normalisation (sensitivity)
    driveGain   : f32, // brain: weight of this urge's error into the network
}
struct Camera {
    centerX: f32,
    centerY: f32,
    scaleX: f32,
    scaleY: f32,
}
struct GlowOptions {
    glowSize: f32,
    glowIntensity: f32,
    glowSteepness: f32,
}

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<storage, read> colors: array<vec4<f32>>;
@group(1) @binding(0) var<uniform> options: SimOptions;
@group(2) @binding(0) var<uniform> camera: Camera;
@group(3) @binding(0) var<uniform> glowOptions: GlowOptions;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) offset: vec2<f32>,
    @location(1) color: vec4<f32>,
    @location(2) particleType: f32,
    @location(3) isDebugCircle: f32,
}

const QUAD_VERTICES = array<vec2<f32>, 4>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0,  1.0)
);

fn srgb_to_linear(color: vec3f) -> vec3f {
    let cutoff = vec3f(0.04045);
    let linear_low = color / 12.92;
    let linear_high = pow((color + 0.055) / 1.055, vec3f(2.4));
    return select(linear_high, linear_low, color <= cutoff);
}

// Shared vertex logic: computes position, size, and debug circle flag
fn compute_vertex(instanceIndex: u32, vertexIndex: u32, sizeMultiplier: f32) -> VertexOutput {
    if (instanceIndex >= options.numParticles) {
        return VertexOutput(vec4f(0.0), vec2f(0.0), vec4f(0.0), 0.0, 0.0);
    }
    let particle = particles[instanceIndex];
    let pType = u32(particle.particleType);
    var color = colors[min(pType, arrayLength(&colors) - 1u)];
    // Category split: [matter][urges][motor neurons][sense neurons][dormant]. The dormant entry
    // is the LAST one in the color table, so the sense band ends at arrayLength(colors)-1.
    let lastType = u32(arrayLength(&colors)) - 1u;          // dormant sentinel type code
    let senseBase = lastType - options.numSenseNeurons;      // first sense-neuron type code
    let isSenseType = pType >= senseBase && pType < lastType;
    // Brightness: for SENSE neurons `control` holds a BEARING in radians (not a strength), so
    // their glow is driven by the perception magnitude (signal) alone — tolerating the new meaning.
    let bright = select(
        1.0 + 0.9 * abs(particle.control) + 0.35 * min(particle.signal, 6.0),
        1.0 + 0.9 * min(particle.signal, 1.0),
        isSenseType
    );
    color = vec4f(color.rgb * bright, color.a);

    let isUrge = pType >= options.numTypes && pType < options.numTypes + options.numUrges;
    let isMotor = pType >= options.numTypes + options.numUrges && pType < senseBase;
    var size: f32 = options.particleSize * sizeMultiplier;
    var isDebugCircle: f32 = 0.0;
    if (options.isDebugConnections != 0u) {
        if (isUrge) {
            size = options.neuronRadius;
            isDebugCircle = 1.0;
        } else if (isMotor) {
            size = options.particleSize * 2.5;
            isDebugCircle = 1.0;
        } else if (isSenseType) {
            // Sense neurons: dotted circle at their perception radius (senseRadius)
            size = options.senseRadius;
            isDebugCircle = 1.0;
        }
    }

    let particleCenterPos = vec2f(particle.x, particle.y);
    let cameraScale = vec2f(camera.scaleX, -camera.scaleY);
    let cameraCenter = vec2f(camera.centerX, camera.centerY);
    let transformedCenterPos = fma(particleCenterPos, cameraScale, -cameraCenter * cameraScale);

    let vertexOffset = QUAD_VERTICES[vertexIndex] * size * cameraScale;
    let finalPos = transformedCenterPos + vertexOffset;

    return VertexOutput(
        vec4f(finalPos, 0.0, 1.0),
        QUAD_VERTICES[vertexIndex],
        color,
        f32(pType),
        isDebugCircle
    );
}

@vertex
fn vertexGlow(@builtin(instance_index) instanceIndex: u32, @builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    return compute_vertex(instanceIndex, vertexIndex, glowOptions.glowSize);
}
@vertex
fn vertexCircle(@builtin(instance_index) instanceIndex: u32, @builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    return compute_vertex(instanceIndex, vertexIndex, 1.0);
}

// Shared dotted circle fragment logic
fn debug_circle_fragment(in: VertexOutput) -> vec4f {
    let dist = length(in.offset);
    let ringRadius = 0.92;
    let ringWidth = 0.06;
    let inRing = abs(dist - ringRadius) < ringWidth;
    if (!inRing) { discard; }

    let angle = atan2(in.offset.y, in.offset.x);
    let numDots = 16.0;
    let segIdx = i32(floor((angle + 3.14159265) / (6.2831853 * 2.0 / numDots)));
    let dotAngle = fract(f32(segIdx) + (angle + 3.14159265) / (6.2831853 * 2.0 / numDots) - f32(segIdx));
    // Simpler: just check if we're in the first half of our segment
    let localAngle = (angle + 3.14159265) - f32(segIdx) * (6.2831853 * 2.0 / numDots);
    let inDot = localAngle < (6.2831853 * 2.0 / numDots) * 0.5;
    if (!inDot) { discard; }

    let white = (segIdx % 2) == 0;
    let edgeFade = 1.0 - smoothstep(ringWidth * 0.5, ringWidth, abs(dist - ringRadius));
    if (white) {
        return vec4f(1.0, 1.0, 1.0, 0.9 * edgeFade);
    } else {
        return vec4f(0.0, 0.0, 0.0, 0.9 * edgeFade);
    }
}

@fragment
fn fragmentGlow(in: VertexOutput) -> @location(0) vec4f {
    // In debug circle mode, skip the glow (the dotted ring is drawn by fragmentCircle)
    if (in.isDebugCircle == 1.0) { discard; }

    let dist_sq = dot(in.offset, in.offset);
    if (dist_sq > 1.0) { discard; }

    let falloff = saturate(1.0 - dist_sq);
    let alpha = pow(falloff, glowOptions.glowSteepness) * glowOptions.glowIntensity;
    if (alpha < 0.0001) { discard; }
    return vec4f(in.color.rgb * alpha, alpha);
}

@fragment
fn fragmentCircle(in: VertexOutput) -> @location(0) vec4f {
    // fwidth must be called from uniform control flow — compute before any per-fragment branch.
    let dist_sq = dot(in.offset, in.offset);
    let edge_width = fwidth(dist_sq);

    // Debug dotted circle takes priority
    if (in.isDebugCircle == 1.0) {
        return debug_circle_fragment(in);
    }

    let dist = sqrt(dist_sq);
    var alpha = 1.0 - smoothstep(max(0.0, 1.0 - edge_width), 1.0, dist_sq);

    // Border for electrical particles: urges & motor neurons get the solid white border (as today);
    // sense neurons get a cyan accent so they read as sensors, distinct from the motor-white.
    let isElectrical = in.particleType >= f32(options.numTypes);
    let senseBaseF = f32(u32(arrayLength(&colors)) - 1u) - f32(options.numSenseNeurons);
    let isSenseBorder = in.particleType >= senseBaseF && in.particleType < f32(u32(arrayLength(&colors)) - 1u);
    if (isElectrical && alpha > 0.0) {
        let borderDist = 0.88;
        let borderWidth = 0.06;
        let inBorder = abs(dist - borderDist) < borderWidth;
        if (inBorder) {
            let borderFade = 1.0 - smoothstep(borderWidth * 0.5, borderWidth, abs(dist - borderDist));
            let linear_border = select(vec3f(1.0), vec3f(0.08, 0.90, 1.0), isSenseBorder); // white vs cyan (linear)
            return vec4f(linear_border, max(in.color.a * options.particleOpacity * alpha, borderFade * options.particleOpacity * alpha));
        }
    }

    let linear_color = pow(in.color.rgb, vec3<f32>(2.2));
    return vec4f(linear_color, in.color.a * options.particleOpacity * alpha);
}

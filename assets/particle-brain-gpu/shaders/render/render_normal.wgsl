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

const QUAD_VERTICES = array<vec2<f32>, 4>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0,  1.0)
);

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<storage, read> colors: array<vec4<f32>>;
@group(1) @binding(0) var<uniform> options: SimOptions;
@group(2) @binding(0) var<uniform> camera: Camera;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) offset: vec2<f32>,
    @location(1) color: vec4<f32>,
    @location(2) particleType: f32,
    @location(3) isDebugCircle: f32, // 1 = this quad is a debug dotted circle (urge in debug mode)
}

@vertex
fn vertexMain(
    @builtin(instance_index) instanceIndex: u32,
    @builtin(vertex_index) vertexIndex: u32
) -> VertexOutput {
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
    // Brightness driven by live state (urges glow with |control|, motor neurons pulse with signal).
    // For SENSE neurons `control` holds a BEARING in radians (not a strength), so their glow is
    // driven by the perception magnitude (signal) alone — tolerating the field's new meaning.
    let bright = select(
        1.0 + 0.9 * abs(particle.control) + 0.35 * min(particle.signal, 6.0),
        1.0 + 0.9 * min(particle.signal, 1.0),
        isSenseType
    );
    color = vec4f(color.rgb * bright, color.a);

    // Determine render size: urges in debug mode get a larger quad for the dotted circle
    let isUrge = pType >= options.numTypes && pType < options.numTypes + options.numUrges;
    let isMotor = pType >= options.numTypes + options.numUrges && pType < senseBase;
    var size: f32 = options.particleSize;
    var isDebugCircle: f32 = 0.0;
    if (options.isDebugConnections != 0u) {
        if (isUrge) {
            // Scale up to neuronRadius (world units) for the dotted circle
            size = options.neuronRadius;
            isDebugCircle = 1.0;
        } else if (isMotor) {
            // Slightly larger for motor neurons: small dotted ring
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

    // For debug circles, size is in world units (already scaled by cameraScale).
    // For normal particles, size is in screen pixels at zoom=1.
    var vertexOffset: vec2f;
    if (isDebugCircle == 1.0) {
        vertexOffset = QUAD_VERTICES[vertexIndex] * size * cameraScale;
    } else {
        vertexOffset = QUAD_VERTICES[vertexIndex] * size * cameraScale;
    }
    let finalPos = transformedCenterPos + vertexOffset;

    return VertexOutput(
        vec4f(finalPos, 0.0, 1.0),
        QUAD_VERTICES[vertexIndex],
        color,
        f32(pType),
        isDebugCircle
    );
}

@fragment
fn fragmentMain(in: VertexOutput) -> @location(0) vec4f {
    let dist_sq = dot(in.offset, in.offset);
    // fwidth must be called from uniform control flow — compute before any per-fragment branch.
    let edge_width = fwidth(dist_sq);
    let dist = sqrt(dist_sq);

    // ---- Debug dotted circle mode (urges/neurons when isDebugConnections is on) ----
    if (in.isDebugCircle == 1.0) {
        // Draw a black-and-white dotted ring at the edge of the quad.
        // The ring sits at dist ≈ 0.92 (slightly inside the edge for visibility).
        let ringRadius = 0.92;
        let ringWidth = 0.06;
        let inRing = abs(dist - ringRadius) < ringWidth;
        if (!inRing) { discard; }

        // 16 dots around the circle, alternating black and white
        let angle = atan2(in.offset.y, in.offset.x);
        let numDots = 16.0;
        let dotAngle = fract((angle + 3.14159265) / (6.2831853 * 2.0 / numDots));
        // Each dot occupies half its segment
        let inDot = dotAngle < 0.5;
        if (!inDot) { discard; }

        // Alternate: even dots white, odd dots black
        let segmentIndex = fract((angle + 3.14159265) / (6.2831853 * 2.0 / numDots)) * numDots;
        let isWhite = fract(segmentIndex) < 0.5;
        // Use floor of the segment index to determine color
        let segIdx = i32(floor((angle + 3.14159265) / (6.2831853 * 2.0 / numDots)));
        let white = (segIdx % 2) == 0;

        // Soft edge on the dot
        let edgeFade = 1.0 - smoothstep(ringWidth * 0.5, ringWidth, abs(dist - ringRadius));
        if (white) {
            return vec4f(1.0, 1.0, 1.0, 0.9 * edgeFade);
        } else {
            return vec4f(0.0, 0.0, 0.0, 0.9 * edgeFade);
        }
    }

    // ---- Normal particle rendering with border for electrical particles ----
    let isElectrical = in.particleType >= f32(options.numTypes);
    // Sense-neuron band (for the accent border): ends at the dormant entry, starts numSenseNeurons before.
    let senseBaseF = f32(u32(arrayLength(&colors)) - 1u) - f32(options.numSenseNeurons);
    let isSenseBorder = in.particleType >= senseBaseF && in.particleType < f32(u32(arrayLength(&colors)) - 1u);
    var alpha = 1.0 - smoothstep(max(0.0, 1.0 - edge_width), 1.0, dist_sq);

    // Draw a thin border ring for electrical particles (urges & motor neurons: solid white,
    // sense neurons: cyan accent so they read as sensors, distinct from the motor-white).
    if (isElectrical && alpha > 0.0) {
        // Border: thin ring at the very edge (dist close to 1.0)
        let borderDist = 0.88;
        let borderWidth = 0.06;
        let inBorder = abs(dist - borderDist) < borderWidth;
        if (inBorder) {
            // Soft falloff
            let borderFade = 1.0 - smoothstep(borderWidth * 0.5, borderWidth, abs(dist - borderDist));
            let borderAlpha = borderFade * options.particleOpacity * alpha;
            let borderColor = select(vec3f(1.0, 1.0, 1.0), vec3f(0.30, 0.95, 1.0), isSenseBorder); // white vs cyan
            return vec4f(borderColor, max(in.color.a * options.particleOpacity * alpha, borderAlpha));
        }
    }

    return vec4f(in.color.rgb, in.color.a * options.particleOpacity * alpha);
}

struct Camera {
    centerX: f32,
    centerY: f32,
    scaleX: f32,
    scaleY: f32,
};
struct TrackerState {
    x: f32,
    y: f32,
    vx: f32,
    vy: f32,
    searchRadius: f32,
    expectedCount: u32,
    baseCameraX: f32,
    baseCameraY: f32,
};
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
};

const MIN_PARTICLES: u32 = 16u;
const TRACKER_SIZE: f32 = 75.0;
const TRACKER_SIZE_INV: f32 = 1.0 / 75.0;
const PI: f32 = 3.14159265;
const TAU_INV: f32 = 1.0 / (2.0 * 3.14159265);

const COLOR_BRIGHT: vec3<f32>   = vec3<f32>(0.85, 1.0, 1.0);
const COLOR_CYAN: vec3<f32>     = vec3<f32>(0.4, 0.92, 1.0);
const COLOR_VELOCITY: vec3<f32> = vec3<f32>(1.0, 0.55, 0.15);
const COLOR_DIAMOND: vec3<f32>  = vec3<f32>(1.0, 0.45, 0.1);
const COLOR_LOST: vec3<f32>     = vec3<f32>(1.0, 0.15, 0.1);

const OUTER_RING_RADIUS: f32 = 0.90;
const OUTER_RING_THICKNESS: f32 = 0.065;
const CROSSHAIR_GAP_INNER: f32 = 0.30;
const CROSSHAIR_GAP_OUTER: f32 = OUTER_RING_RADIUS - 0.06;
const CROSSHAIR_THICKNESS: f32 = 0.028;

const QUAD_VERTICES = array<vec2<f32>, 4>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, 1.0)
);

@group(0) @binding(0) var<uniform> camera: Camera;
@group(1) @binding(0) var<storage, read> tracker: TrackerState;
@group(2) @binding(0) var<uniform> deltaTime: f32;
@group(3) @binding(0) var<uniform> simOptions: SimOptions;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) localPos: vec2<f32>,
};

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    let quadPos = QUAD_VERTICES[vertexIndex];
    let vel = vec2<f32>(tracker.vx, tracker.vy);
    let predFactor = (1.0 - simOptions.frictionFactor) * deltaTime;
    let predReach = length(vel) * predFactor + tracker.searchRadius; // Total reach including predicted movement
    let maxSize = max(TRACKER_SIZE, predReach) + 16.0; // Add padding to ensure full visibility of rings
    let worldPos = vec2<f32>(tracker.x, tracker.y) + quadPos * maxSize;
    let clipPos = (worldPos - vec2<f32>(camera.centerX, camera.centerY)) * vec2<f32>(camera.scaleX, -camera.scaleY);
    return VertexOutput(
        vec4<f32>(clipPos, 0.0, 1.0),
        quadPos * (maxSize * TRACKER_SIZE_INV)
    );
}

fn ring(dist: f32, r: f32, halfT: f32, fw: f32) -> f32 {
    return smoothstep(r + halfT + fw, r + halfT - fw, dist)
         * smoothstep(r - halfT - fw, r - halfT + fw, dist);
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
    let pos = input.localPos;
    let dist = length(pos);
    let fw = fwidth(dist);
    let absX = abs(pos.x);
    let absY = abs(pos.y);

    // Precompute shared values
    let angle = atan2(pos.y, pos.x);
    let angleNorm = angle * TAU_INV + 0.5; // [0, 1] range
    let vel = vec2<f32>(tracker.vx, tracker.vy);
    let speed = length(vel);
    let speedFade = smoothstep(0.1, 0.5, speed);
    let searchR = tracker.searchRadius * TRACKER_SIZE_INV;

    // ── OUTER RING (4 arcs, gaps at cardinal directions) ──
    let seg4 = fract(angleNorm * 4.0);
    let gapMask = smoothstep(0.05, 0.09, seg4) * smoothstep(0.95, 0.91, seg4);
    let outerRingAlpha = ring(dist, OUTER_RING_RADIUS, OUTER_RING_THICKNESS * 0.5, fw) * gapMask;

    // ── SEARCH RADIUS RING (dashed) ──
    let dashSeg = fract(angleNorm * 20.0);
    let dashMask = smoothstep(0.12, 0.18, dashSeg) * smoothstep(0.88, 0.82, dashSeg);
    let searchRingAlpha = ring(dist, searchR, 0.0125, fw) * dashMask * 0.65;

    // ── CROSSHAIR (short lines) ──
    let hLine = smoothstep(CROSSHAIR_THICKNESS + fw, CROSSHAIR_THICKNESS - fw, absY)
              * smoothstep(CROSSHAIR_GAP_INNER - fw, CROSSHAIR_GAP_INNER + fw, absX)
              * smoothstep(CROSSHAIR_GAP_OUTER + fw, CROSSHAIR_GAP_OUTER - fw, absX);
    let vLine = smoothstep(CROSSHAIR_THICKNESS + fw, CROSSHAIR_THICKNESS - fw, absX)
              * smoothstep(CROSSHAIR_GAP_INNER - fw, CROSSHAIR_GAP_INNER + fw, absY)
              * smoothstep(CROSSHAIR_GAP_OUTER + fw, CROSSHAIR_GAP_OUTER - fw, absY);
    let crosshairAlpha = max(hLine, vLine) * 0.85;

    // ── PREDICTED POSITION RING ──
    let predFactor = (1.0 - simOptions.frictionFactor) * deltaTime;
    let predOffset = vel * (predFactor * TRACKER_SIZE_INV);
    let predDist = length(pos - predOffset);
    let predRingAlpha = ring(predDist, searchR, 0.0075, fw) * 0.45 * speedFade;

    // ── VELOCITY INDICATOR ──
    let velAngle = atan2(vel.y, vel.x);
    let normDiff = atan2(sin(angle - velAngle), cos(angle - velAngle));
    let absNormDiff = abs(normDiff);
    let fw2 = fw * 2.0;
    let velAngularMask = smoothstep(0.04 + fw2, 0.04 - fw2, absNormDiff);
    let velEnd = 0.20 + clamp(log(1.0 + speed * 0.02) * 0.5, 0.0, 1.0) * 0.66;
    let velRadialMask = smoothstep(0.20 - fw, 0.20 + fw, dist) * smoothstep(velEnd + fw, velEnd - fw, dist);
    let velAlpha = velAngularMask * velRadialMask * speedFade * 0.7;

    // ── VELOCITY DIAMOND (oriented in movement direction on outer ring) ──
    let velDir = vec2<f32>(cos(velAngle), sin(velAngle));
    let velPerp = vec2<f32>(-sin(velAngle), cos(velAngle));
    let velDotOffset = pos - velDir * OUTER_RING_RADIUS;
    let dAlongVel = abs(dot(velDotOffset, velDir));   // distance along velocity axis
    let dPerpVel = abs(dot(velDotOffset, velPerp));    // distance perpendicular
    let diamondDist = dAlongVel * 0.7 + dPerpVel;     // elongated diamond (pointy along vel)
    let velDotAlpha = smoothstep(0.08 + fw, 0.08 - fw, diamondDist) * speedFade * 0.9;

    // ── CENTER DOT ──
    let centerDot = smoothstep(0.035 + fw, 0.035 - fw, dist) * 0.9;

    // ── COMBINE ──
    let sStruct = max(max(outerRingAlpha, searchRingAlpha), max(crosshairAlpha, centerDot));
    let sVel = max(velAlpha, predRingAlpha);
    let s = max(max(sStruct, sVel), velDotAlpha);

    // ── GLOW ──
    let outerGlow = exp(-abs(dist - OUTER_RING_RADIUS) * 10.0) * 0.25;
    let predGlow = exp(-abs(predDist - searchR) * 16.0) * 0.1 * speedFade;
    let crossGlowH = exp(-absY * 12.0) * smoothstep(0.28, 0.35, absX) * smoothstep(CROSSHAIR_GAP_OUTER + 0.05, CROSSHAIR_GAP_OUTER - 0.05, absX) * 0.08;
    let crossGlowV = exp(-absX * 12.0) * smoothstep(0.28, 0.35, absY) * smoothstep(CROSSHAIR_GAP_OUTER + 0.05, CROSSHAIR_GAP_OUTER - 0.05, absY) * 0.08;
    let glow = outerGlow + predGlow + crossGlowH + crossGlowV;

    let totalAlpha = max(s, glow);
    if (totalAlpha <= 0.005) { discard; }

    // ── COLOR ──
    let isLost = step(f32(tracker.expectedCount), f32(MIN_PARTICLES));
    let velWeight = sVel / max(s, 0.001);
    let dotWeight = velDotAlpha / max(s, 0.001);
    let normalColor = mix(mix(COLOR_BRIGHT, COLOR_CYAN, smoothstep(0.1, 0.9, dist)), COLOR_VELOCITY, velWeight);
    let withDot = mix(normalColor, COLOR_DIAMOND, dotWeight);
    let color = mix(withDot, COLOR_LOST, isLost) * (1.0 + s * 0.4);

    return vec4<f32>(color, totalAlpha);
}

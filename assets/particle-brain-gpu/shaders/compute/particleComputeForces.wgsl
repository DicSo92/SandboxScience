// =============================================================================
// Particle Life — 2D GPU force pass  (with Urge / Neuron "quantum-electrical" layer)
//
// Particle type layout (see CPU side):
//   [0, numTypes)                       -> matter colors (classic particle life rules)
//   [numTypes, numTypes + numUrges)     -> urges.  local index k = type - numTypes
//                                         Each urge has its OWN goal, derived deterministically
//                                         from k (no extra buffer fields): a target color and an
//                                         goal mode (maximize / minimize / homeostasis).
//   [numTypes+numUrges, TOTAL_TYPES)    -> neurons. local index m = type - numTypes - numUrges
//                                         target color = m % numTypes  (fixed for its lifetime)
//
// MODEL: urges modulate NEURONS; neurons actuate MATTER.
//   * An urge learns a signed `control` (+ attract / − repel) toward ITS OWN goal. The sign is
//     NOT fixed in advance — the learning rule finds it, so the population ends up with a mix of
//     attracting and repelling urges (diverse by construction via the per-urge goal).
//   * A neuron is a pure actuator for ONE matter color. In its own branch it scans for urges within
//     `neuronRadius` OF THE NEURON, sums their previous-frame signed `control` (falloff-weighted)
//     into a `drive`, then pushes/pulls ONLY matter of its single target color by that drive.
//   * So an urge's effect on matter is mediated through neurons: it recruits nearby neurons to
//     attract or repel the color those neurons own. There is no direct urge->matter field.
//
// Each particle carries two persistent "electrical" scalars that survive across frames:
//   control : for an urge, its current attract(+) / repel(-) bias (its learned intent). A neuron
//             reads it to decide how hard to push/pull its color. For a neuron it is 0.
//   signal  : for an urge, the running value of the objective metric it tracks (prior frame).
//             Comparing this frame's metric with `signal` gives a dM/dt gradient that drives a
//             simple Hebbian learning rule on `control`. For a neuron it is its firing activity.
//
// SINGLE PASS: the force pass reads last frame's state (particleTempBuffer) and writes the new one,
// so every particle sees only PREVIOUS-frame values of all others. No second pass, no ordering
// dependency between urge-control learning and neuron actuation — the 1-frame delay doubles as
// smoothing.
// =============================================================================
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
    cellSubdivisions: u32,
    matrixStride: u32,  // stride of the interaction matrix (= numTypes + 2: matter + urge + neuron rows)
    numUrges: u32,
    neuronRadius: f32,
    isDebugConnections: u32,
    numSenseNeurons: u32,
    senseRadius: f32,
    magneticStrength: f32, // Lorentz force field strength (0 = off)
};
struct Particle {
    x : f32,
    y : f32,
    vx : f32,
    vy : f32,
    particleType : f32,
    control : f32, // urge: learned attract(+) / repel(-) intent — read by nearby neurons. Persists.
    signal  : f32, // urge: prior-frame objective metric (for dM/dt). neuron: firing activity. Persists.
    goalB   : f32, // secondary goal index (local k), -1 if none. Set on merge.
    driveTarget : f32, // brain: desired metric value (homeostasis setpoint)
    driveScale  : f32, // brain: error normalisation (sensitivity)
    driveGain   : f32, // brain: weight of this urge's error into the network
}
struct ElectricalOptions {
    enabled: u32,        // master switch for the whole electrical layer
    metricMode: u32,     // 0 local density of target color / 1 local fraction / 2 own-type density
    numUrges: u32,       // number of urge particles (== number of distinct urge types)
    numNeurons: u32,     // number of neuron particles
    urgeRadius: f32,     // radius over which an urge acts on matter & measures its metric
    neuronRadius: f32,   // radius over which a neuron modulates an urge
    urgeForce: f32,      // strength of an urge's attract/repel field on matter
    controlGain: f32,    // learning rate: how strongly dM/dt pushes an urge's control toward its goal sign
    controlMax: f32,     // clamp on |control|
    neuronInfluence: f32,// (legacy) strength of a single neuron's vote on an urge's control — unused now
    neuronAuthority: f32,// (legacy) extra authority gained per nearby neuron — unused now
    maxAuthority: f32,   // (legacy) cap on the accumulated neuron authority — unused now
    cohesion: f32,       // how strongly urges/neurons cling to the body & avoid overlapping
    numSenseNeurons: u32,// number of sense neuron particles (sensors; one target color each)
    senseRadius: f32,    // perception radius shared by all three senses (sight/smell/sound)
    senseConeHalfAngle: f32, // sight: half-angle of the forward cone, in RADIANS
    senseMode: u32,      // 0 = cycle all three per-sense, 1 = all sight, 2 = all smell, 3 = all sound
};

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
    let rule = fma(f32((word >> 0u) & 0xFFu), 1.0 / 127.5, -1.0);
    let minR = f32((word >> 8u) & 0xFFu);
    let maxR = f32((word >> 16u) & 0xFFFFu);
    return vec3<f32>(rule, minR, maxR);
}

// Classic (rule, minR, maxR) force for a distance `dist` — identical math to branch 1.
// Returns the scalar along the direction from self toward the other particle
// (positive = attract, negative = repel). Caller adds `dir * force`.
fn interaction_force(interaction: vec3<f32>, dist: f32) -> f32 {
    let maxR = interaction.z;
    if (dist >= maxR) { return 0.0; }
    let minR = interaction.y;
    var force : f32;
    if (dist < minR) {
        force = fma(dist / minR, options.repel, -options.repel);
    } else {
        let rule = interaction.x;
        let mid = (minR + maxR) * 0.5;
        let slope = rule / (mid - minR);
        force = fma(-slope, abs(dist - mid), rule);
    }
    return force;
}

// particle category: 0 matter, 1 urge, 2 motor neuron, 4 sense neuron, 3 dormant (clone pool slot)
// Layout: [matter][urges][motor neurons][sense neurons][dormant pool].
// Default is NEURON (the historical behavior for any type >= numTypes+numUrges); only a type
// exactly at the dormant sentinel (above the whole known population) is treated as a dormant
// clone-pool slot. This keeps stale/mis-labeled types behaving like neurons instead of vanishing.
fn cat(t: u32) -> u32 {
    if (t < options.numTypes) { return 0u; }                                            // matter
    if (t < options.numTypes + electrical.numUrges) { return 1u; }                       // urge
    if (t < options.numTypes + electrical.numUrges + electrical.numNeurons) { return 2u; } // motor neuron
    if (t < options.numTypes + electrical.numUrges + electrical.numNeurons + electrical.numSenseNeurons) { return 4u; } // sense neuron
    if (t == options.numTypes + electrical.numUrges + electrical.numNeurons + electrical.numSenseNeurons) { return 3u; } // dormant
    return 2u;                                                                           // fallback: stale type -> motor neuron
}

// Sense-neuron constants. SENSE_SECTORS is fixed (12) because it sizes a local array;
// the smell bearing quantization to 12 sectors is part of the perception model.
const PI_CONST = 3.14159265;
const TWO_PI_CONST = 6.2831853;
const SENSE_SECTORS: u32 = 12u;

// Per-urge goal, derived deterministically from the urge's local index k so the population is
// diverse with NO extra buffer fields. Each urge has:
//   - a target color: k % numTypes (each urge acts on a different color)
//   - a goal mode: 0 = maximize density, 1 = minimize density, 2 = homeostasis (keep at target)
// metricMode controls the global family: 0 = cycle all three per-urge, 1 = all maximize,
//   2 = all minimize, 3 = all homeostasis.
struct UrgeGoal {
    mode: u32,        // 0 = maximize density, 1 = minimize density, 2 = homeostasis
    targetValue: f32, // for homeostasis: the desired normalized metric value (O(1) scale)
}
fn urgeGoal(k: u32) -> UrgeGoal {
    let numTypes = options.numTypes;
    if (numTypes == 0u) { return UrgeGoal(0u, 1.0); }
    var mode: u32;
    switch (electrical.metricMode % 4u) {
        case 0u: { // cycle all three modes across the population
            mode = k % 3u;
        }
        case 1u: { mode = 0u; break; } // all maximize
        case 2u: { mode = 1u; break; } // all minimize
        default: { mode = 2u; break; } // all homeostasis
    }
    // Homeostasis target: deterministic pseudo-random in [0.6, 1.4] based on k
    var targetValue: f32 = 1.0;
    if (mode == 2u) {
        let hash = fract(sin(f32(k) * 12.9898 + 78.233) * 43758.5453);
        targetValue = 0.6 + hash * 0.8; // [0.6, 1.4]
    }
    return UrgeGoal(mode, targetValue);
}

@group(0) @binding(0) var<storage, read> particlesSource : array<Particle>;
@group(0) @binding(1) var<storage, read_write> particlesDestination : array<Particle>;
@group(0) @binding(2) var<storage, read> binOffset : array<u32>;
@group(0) @binding(3) var<storage, read> interactions: InteractionMatrix;
@group(0) @binding(4) var<storage, read> neuronMods : array<f32>; // brain output: per-neuron modulation [-1,1]

@group(1) @binding(0) var<uniform> options : SimOptions;
@group(2) @binding(0) var<uniform> deltaTime : f32;
@group(3) @binding(0) var<uniform> electrical : ElectricalOptions;

@compute @workgroup_size(64)
fn computeForces(@builtin(global_invocation_id) id : vec3u) {
    if (id.x >= options.numParticles) { return; }

    let half_width = options.simWidth * 0.5;
    let half_height = options.simHeight * 0.5;
    let is_wrapping = options.isWallWrap == 1u;
    let cellSubdivisions = i32(options.cellSubdivisions);

    var particle = particlesSource[id.x];
    let myType = u32(particle.particleType);
    let myCat = cat(myType);
    if (myCat == 3u) { particlesDestination[id.x] = particle; return; } // dormant: pass through unchanged
    let isMatter = myCat == 0u;
    let isUrge = myCat == 1u;
    let isNeuron = myCat == 2u;
    let isSense = myCat == 4u;

    // Per-urge goal: the target color it acts on and its goal mode (maximize/minimize/homeostasis).
    let kIdx = myType - options.numTypes;                       // local urge index (valid if isUrge)
    let mIdx = myType - options.numTypes - electrical.numUrges; // local neuron index (valid if isNeuron)
    let goal = urgeGoal(kIdx);
    let urgeTarget = kIdx % options.numTypes;   // the color this urge acts on (only meaningful when isUrge)
    let neuronTarget = mIdx % options.numTypes; // the single color this neuron actuates (valid if isNeuron)

    // Sense-neuron setup: exactly ONE target color and a deterministic sense mode (0 sight, 1 smell,
    // 2 sound) derived from its local index s so the population is diverse with NO extra buffer field.
    let sIdx = myType - options.numTypes - electrical.numUrges - electrical.numNeurons; // local sense index
    let senseTarget = sIdx % options.numTypes; // the single color this sense neuron perceives (valid if isSense)
    var senseModeLocal: u32 = 0u;
    switch (electrical.senseMode % 4u) {
        case 0u: { senseModeLocal = sIdx % 3u; } // cycle all three senses across the population
        case 1u: { senseModeLocal = 0u; break; } // all sight
        case 2u: { senseModeLocal = 1u; break; } // all smell
        default: { senseModeLocal = 2u; break; } // all sound
    }
    let sR = max(electrical.senseRadius, 1.0);
    // SIGHT heading: direction of this sense neuron's own motion (zero velocity -> no heading).
    let vlen = length(vec2f(particle.vx, particle.vy));
    let hasHeading = vlen > 0.001;
    let heading = vec2f(particle.vx, particle.vy) / max(vlen, 0.001);
    let cosHalfAngle = cos(electrical.senseConeHalfAngle);

    let binInfo = getBinInfo(vec2f(particle.x, particle.y), options);

    var binXMin = binInfo.binId.x - cellSubdivisions;
    var binYMin = binInfo.binId.y - cellSubdivisions;
    var binXMax = binInfo.binId.x + cellSubdivisions;
    var binYMax = binInfo.binId.y + cellSubdivisions;

    if (!is_wrapping) {
        binXMin = max(0, binXMin);
        binYMin = max(0, binYMin);
        binXMax = min(binInfo.gridSize.x - 1, binXMax);
        binYMax = min(binInfo.gridSize.y - 1, binYMax);
    }

    var totalForce = vec2f(0.0, 0.0);
    let particlePosition = vec2f(particle.x, particle.y);

    // Accumulator for neuron-local magnetic field (matter only).
    // Each nearby motor neuron contributes its firing activity (signal) scaled by falloff.
    var localMagneticB: f32 = 0.0;

    // accumulators used by the electrical layer
    var metricCount: f32 = 0.0;   // this urge's target-color matter within urgeRadius (density metric)
    var metricCountB: f32 = 0.0;  // secondary goal target-color count (for merged urges)
    var drive: f32 = 0.0;         // neuron: signed sum of nearby urges' previous-frame control
    var firing: f32 = 0.0;        // neuron: magnitude of that drive (its "firing activity")
    var cohesionForce = vec2f(0.0, 0.0);
    // Sense accumulators (only used when isSense):
    var seenCount: f32 = 0.0;              // sight: target-color matter inside the forward cone
    var sectorScores = array<f32, SENSE_SECTORS>(
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    );                                     // smell: nearness-weighted score per sector
    var soundVec = vec2f(0.0, 0.0);        // sound: uniform-weight vector sum toward sources
    var soundCount: f32 = 0.0;             // sound: count of target-color matter within sR

    // Secondary goal setup (for merged urges): resolve the secondary target color.
    let hasGoalB = particle.goalB >= 0.0;
    var goalB_kIdx: u32 = 0u;
    var goalB_target: u32 = 0u;
    if (hasGoalB) {
        goalB_kIdx = u32(particle.goalB);
        goalB_target = goalB_kIdx % options.numTypes;
    }

    let eOn = electrical.enabled != 0u;
    let eR = max(electrical.urgeRadius, 1.0);
    let nR = max(electrical.neuronRadius, 1.0);

    for (var binX = binXMin; binX <= binXMax; binX += 1) {
        for (var binY = binYMin; binY <= binYMax; binY += 1) {
            var realBinX = binX;
            var realBinY = binY;
            if (is_wrapping) {
                if (binX < 0) { realBinX = binX + binInfo.gridSize.x; }
                else if (binX >= binInfo.gridSize.x) { realBinX = binX - binInfo.gridSize.x; }
                if (binY < 0) { realBinY = binY + binInfo.gridSize.y; }
                else if (binY >= binInfo.gridSize.y) { realBinY = binY - binInfo.gridSize.y; }
            }
            let binIndex = u32(realBinY * binInfo.gridSize.x + realBinX);
            let binStart = binOffset[binIndex];
            let binEnd = binOffset[binIndex + 1u];

            for (var j = binStart; j < binEnd; j += 1u) {
                if (j == id.x) { continue; }

                let other = particlesSource[j];
                let oType = u32(other.particleType);
                let oCat = cat(oType);
                if (oCat == 3u) { continue; } // dormant clone slot — skip

                var r = vec2f(other.x, other.y) - particlePosition;
                if (is_wrapping) {
                    if (abs(r.x) >= half_width) { r.x -= sign(r.x) * options.simWidth; }
                    if (abs(r.y) >= half_height) { r.y -= sign(r.y) * options.simHeight; }
                }

                let distSquared = dot(r, r);
                if (distSquared < 0.0001) { continue; }
                let dist = sqrt(distSquared);
                let dir = r / dist;

                // ---- 1) classic matter <-> matter rule -----------------------------------
                if (isMatter && oCat == 0u) {
                    let myTypeOffset = myType * options.matrixStride;
                    let interaction = get_interaction(myTypeOffset + oType);
                    totalForce += dir * interaction_force(interaction, dist);
                }

                if (!eOn) { continue; } // electrical layer off -> only classic forces apply

                // ---- 1b) electrical <-> matter via the main interaction matrix ------------
                // Urges and neurons push/pull matter using a shared row in the main matrix:
                //   row numTypes = "urge" (applies to ALL urges), row numTypes+1 = "neuron".
                // Convention: only the ROW particle's entry is used (Newton's 3rd law via
                // the matter side reading its own row in ITS pass).
                // Sense neurons do NOT actuate matter, but they DO get matrix-driven drift from
                // matter through the shared NEURON row (row numTypes+1) — this keeps them attached
                // to the body like other specials without giving them any actuation of their own.
                if ((isUrge && oCat == 0u) || (isNeuron && oCat == 0u) || (isSense && oCat == 0u)) {
                    let rowIdx = options.numTypes + select(0u, 1u, isNeuron || isSense);
                    let interaction = get_interaction(rowIdx * options.matrixStride + oType);
                    totalForce += dir * interaction_force(interaction, dist);
                }
                // Note: special<->special interactions are handled by the cohesion force;
                // the electrical interaction matrix only stores special-vs-matter rows.

                // ---- 2) an urge gathering the metric for ITS OWN goal ----------------------
                // (There is no direct urge->matter field anymore: urges act on matter ONLY by
                //  driving neurons, which then push/pull their single color.)
                if (isUrge && oCat == 0u && dist < eR) {
                    if (oType == urgeTarget) { metricCount += 1.0; }
                    if (hasGoalB && oType == goalB_target) { metricCountB += 1.0; }
                }

                // ---- 3) a neuron driven by nearby urges, measured FROM THE NEURON ----------
                // The reference point is this neuron: it scans for urges within `neuronRadius`
                // of itself and accumulates their previous-frame signed control (falloff-weighted).
                if (isNeuron && oCat == 1u && dist < nR) {
                    let fall = max(0.0, 1.0 - dist / nR);
                    drive += other.control * fall;   // other is the urge; .control is last frame's value
                }
                // ---- 4) a neuron actuating ONLY its own color ------------------------------
                if (isNeuron && oCat == 0u && oType == neuronTarget && dist < eR) {
                    let fall = max(0.0, 1.0 - dist / eR);
                    totalForce += dir * (drive * electrical.urgeForce * fall); // drive>0 attracts, <0 repels
                }

                // ---- 4b) matter feels local B from nearby motor neurons --------------------
                // Neurons act as "muscles" that amplify the magnetic field locally.
                // Their firing activity (signal, smoothed over frames) determines strength.
                if (isMatter && oCat == 2u && dist < nR) {
                    let fall = max(0.0, 1.0 - dist / nR);
                    localMagneticB += other.signal * fall;
                }

                // ---- 5) a sense neuron perceiving its ONE target color ----------------------
                // It NEVER touches matter: this branch only accumulates perception from the
                // previous-frame positions of target-color matter within sR. The three senses
                // differ ONLY in how they aggregate that scan:
                //   SIGHT  = forward cone test (magnitude only, no bearing).
                //   SMELL  = nearness-weighted sector score -> bearing to the NEAREST dense cluster.
                //   SOUND  = uniform-weight vector sum -> bearing + loudness, NO far/near
                //            discrimination. Sanity check: smell weights by (sR - dist)/sR
                //            (near-biased); sound weights by 1.0 (range-agnostic). That one
                //            difference is the whole behavioral distinction between the two.
                if (isSense && oCat == 0u && oType == senseTarget && dist < sR) {
                    if (senseModeLocal == 0u) {
                        // SIGHT: "seen" iff inside the forward cone of motion and within sR.
                        if (hasHeading && dot(dir, heading) > cosHalfAngle) { seenCount += 1.0; }
                    } else if (senseModeLocal == 1u) {
                        // SMELL: closer particles weigh more -> biases toward the nearest dense region.
                        let ang = atan2(dir.y, dir.x) + PI_CONST; // [0, 2*PI)
                        let sec = u32(ang / (TWO_PI_CONST / f32(SENSE_SECTORS))) % SENSE_SECTORS;
                        sectorScores[sec] += (sR - dist) / sR;
                    } else {
                        // SOUND: uniform weight 1.0 (range-agnostic): many-far and few-near at equal
                        // total count contribute the same -> it genuinely cannot tell them apart.
                        soundVec += dir;
                        soundCount += 1.0;
                    }
                }

                // ---- 6) cohesion: specials cling to the body and avoid overlapping ----------
                if (isUrge || isNeuron || isSense) {
                    if (oCat == 0u && dist < eR) {
                        let fall = max(0.0, 1.0 - dist / eR);
                        cohesionForce += dir * (fall * electrical.cohesion);      // pull toward matter
                    } else if (oCat == 1u || oCat == 2u || oCat == 4u) {
                        if (dist < 8.0) {
                            cohesionForce -= dir * (electrical.cohesion * 2.0);   // hard anti-overlap
                        } else if (dist < eR * 0.6) {
                            cohesionForce += dir * (electrical.cohesion * 0.3);   // mild clumping
                        }
                    }
                }
            }
        }
    }

    // ---- BRAIN MODULATION: add global network output to neuron drive --------
    // The brain pass (runs before this one) computed per-neuron modulations from
    // all urge errors. We add it here as an additional input on top of the local
    // spatial urge scanning, so both mechanisms coexist.
    if (isNeuron && eOn) {
        drive += neuronMods[mIdx] * 1.5; // brainGain = 1.5 (tunable)
    }

    let forceFactor = options.forceFactor * deltaTime * 60.0;

    if (isMatter) {
        particle.vx = fma(totalForce.x, forceFactor, particle.vx);
        particle.vy = fma(totalForce.y, forceFactor, particle.vy);

        // ---- Neuron-local magnetic (Lorentz) force ------------------------------------
        // In addition to the global B field (applied in the advance shader), nearby motor
        // neurons add a LOCAL field proportional to their firing activity. This lets the
        // brain "steer" matter into spirals/circular motion around active neuron clusters.
        // F = q * v x B_local, with B along z: Fx = q*vy*B, Fy = -q*vx*B
        if (options.magneticStrength != 0.0 && localMagneticB > 0.001) {
            let pTypeF = particle.particleType;
            let angle = pTypeF * 2.3999632; // golden angle for per-species charge
            let q = sin(angle); // charge in [-1, 1]
            // Scale local B by the global magneticStrength to keep it user-controllable.
            // localMagneticB is O(1..N) depending on how many active neurons are nearby.
            let bLocal = options.magneticStrength * localMagneticB;
            particle.vx += q * particle.vy * bLocal * deltaTime;
            particle.vy -= q * particle.vx * bLocal * deltaTime;
        }

        // matter keeps control/signal = 0
    } else {
        // Special particles move under the extended interaction-matrix forces (branch 1b/1c,
        // already in totalForce and scaled by options.forceFactor like everything else) PLUS the
        // cohesion term, which stays scaled by the global cohesion slider so it can be zeroed out.
        // The matrix forces move the specials at full strength; cohesion is an additional
        // clump/anti-overlap term scaled by its own slider (zeroing it removes only that part).
        let cf = electrical.cohesion * 0.5;
        particle.vx = fma(totalForce.x + cohesionForce.x, forceFactor, particle.vx);
        particle.vy = fma(totalForce.y + cohesionForce.y, forceFactor, particle.vy);

        if (isUrge) {
            // Normalize metric to O(1): mean=1.0 at baseline uniform distribution.
            // This makes birth/death thresholds interpretable: >1 = above expected, <1 = below.
            let numTypesF = f32(options.numTypes);
            let area = options.simWidth * options.simHeight;
            let numMatterApprox = max(f32(options.numParticles) - f32(electrical.numUrges + electrical.numNeurons), 1.0);
            let expectedCount = numMatterApprox * 3.14159265 * eR * eR / area / numTypesF;

            // The metric value for this urge's OWN goal: normalized density of its target color.
            let M = metricCount / max(expectedCount, 0.001);

            // Combined metric: if a secondary goal exists (merged urge), add its contribution.
            var M_combined = M;
            if (hasGoalB) {
                // Secondary goal also uses normalized density of ITS target color.
                let M_B = metricCountB / max(expectedCount, 0.001);
                M_combined = M + M_B;
            }

            // Learning rule depends on the urge's goal mode:
            let dM = M_combined - particle.signal; // gradient vs the previous frame's stored value
            var newControl: f32;
            if (goal.mode == 0u) {
                // MAXIMIZE density: Hebbian with polarity +1.
                // If metric is rising (dM > 0), reinforce attraction (control increases).
                newControl = particle.control + electrical.controlGain * dM;
            } else if (goal.mode == 1u) {
                // MINIMIZE density: Hebbian with polarity -1.
                // If metric is rising (dM > 0), reinforce repulsion (control decreases).
                newControl = particle.control - electrical.controlGain * dM;
            } else {
                // HOMEOSTASIS: proportional controller toward the target value.
                // error = target - M; positive means "too little" → attract,
                // negative means "too much" → repel. Blend toward the ideal control level.
                let error = goal.targetValue - M_combined;
                let targetCtrl = clamp(error, -1.0, 1.0) * electrical.controlMax;
                newControl = mix(particle.control, targetCtrl, electrical.controlGain);
            }
            newControl = clamp(newControl, -electrical.controlMax, electrical.controlMax);

            particle.control = newControl;
            particle.signal = mix(particle.signal, M_combined, 0.15); // smooth the stored metric
        } else if (isNeuron) { // neuron: activity = magnitude of the drive it is under (it "fires" when recruited)
            firing = abs(drive);
            particle.signal = mix(particle.signal, firing, 0.2);
            particle.control = 0.0;
        } else if (isSense) {
            // Sense neuron: store the perception in signal (magnitude [0,1]) and control
            // (bearing radians). It never actuates; nothing reads its control as motor drive.
            let numTypesF = f32(options.numTypes);
            let area = options.simWidth * options.simHeight;
            let numMatterApprox = max(f32(options.numParticles) - f32(electrical.numUrges + electrical.numNeurons + electrical.numSenseNeurons), 1.0);
            // O(1) expected count of target-color matter in the full sense disk at baseline
            // (same trick as the urge metric): mean=1.0 for a uniform distribution.
            let expectedCount = numMatterApprox * PI_CONST * sR * sR / area / numTypesF;

            var newSignal: f32 = 0.0;
            var newControl: f32 = 0.0;
            if (senseModeLocal == 0u) {
                // SIGHT: fraction of the expected cone coverage that is occupied. No bearing.
                let expectedInCone = expectedCount * (electrical.senseConeHalfAngle / PI_CONST); // (2*theta)/(2*PI)
                newSignal = clamp(seenCount / max(expectedInCone, 0.001), 0.0, 1.0);
                newControl = 0.0;
            } else if (senseModeLocal == 1u) {
                // SMELL: strongest sector wins -> bearing to the nearest high-density cluster.
                var bestScore: f32 = 0.0;
                var bestSector: u32 = 0u;
                for (var sec = 0u; sec < SENSE_SECTORS; sec += 1u) {
                    if (sectorScores[sec] > bestScore) { bestScore = sectorScores[sec]; bestSector = sec; }
                }
                if (bestScore > 0.0001) { // global max ~0 -> nothing to smell, output stays zero
                    newSignal = clamp(bestScore / max(expectedCount / f32(SENSE_SECTORS), 0.001), 0.0, 1.0);
                    newControl = (f32(bestSector) + 0.5) * TWO_PI_CONST / f32(SENSE_SECTORS) - PI_CONST; // sector center in [-PI, PI]
                }
            } else {
                // SOUND: bearing toward the centroid of sources + total loudness.
                if (soundCount > 0.0) {
                    newSignal = clamp(soundCount / max(expectedCount, 0.001), 0.0, 1.0);
                    newControl = atan2(soundVec.y, soundVec.x);
                }
            }
            particle.signal = mix(particle.signal, newSignal, 0.25); // smooth like other specials
            particle.control = newControl;
        }
    }

    particlesDestination[id.x] = particle;
}

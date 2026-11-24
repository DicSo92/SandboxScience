import type { Preset } from "~/composables/usePresetManager"
import { defineStore } from 'pinia'

export const useParticleBrainGPUStore = defineStore('particleBrainGPU', () => {
    const engineType = ref<'CPU' | 'GPU' | 'GPU3D'>('GPU') // Engine type
    const sidebarLeftOpen = ref<boolean>(false) // Is sidebar left open
    const isLockedPointer = ref<boolean>(false) // Prevent lifeCanvas events from being triggered
    const isHudLocked = ref<boolean>(false) // Disable HUD interactions during blocking actions (e.g. tracker selection)

    const isRunning = ref<boolean>(true) // Is the simulation running

    const currentColors = ref<Float32Array>() // Current colors for the particles
    const rulesMatrix = ref<number[][]>([]) // Rules matrix for each color
    const minRadiusMatrix = ref<number[][]>([]) // Min radius matrix for each color
    const maxRadiusMatrix = ref<number[][]>([]) // Max radius matrix for each color

    const simWidth = ref<number>(0) // Grid width
    const simHeight = ref<number>(0) // Grid height
    const linkProportions = ref<boolean>(false) // Constraint x y sim proportions

    const numParticles = ref<number>(64000) // Number of particles
    const particleSize = ref<number>(2.0) // Size of the particles at zoomFactor = 1
    const numColors = ref<number>(7) // Number of colors to be used

    const zoomSmoothing = ref<number>(0.15) // Smoothing factor for zooming (0 to 1, where 1 is no smoothing)
    const panSmoothing = ref<number>(0.17) // Smoothing factor for panning (0 to 1, where 1 is no smoothing)
    const is3D = ref<boolean>(false) // Enable 3D Algorithm
    const isParticleGlow = ref<boolean>(true) // Enable particle glow
    const isAdditiveBlending = ref<boolean>(true) // Enable additive blending for the particles
    const isWallRepel = ref<boolean>(false) // Enable walls X and Y for the particles
    const isWallWrap = ref<boolean>(false) // Enable wrapped particles
    const wallState = computed({
        get: () => isWallRepel.value ? 'repel' : isWallWrap.value ? 'wrap' : 'none',
        set: (value: string) => {
            isWallRepel.value = value === 'repel'
            isWallWrap.value = value === 'wrap'
        },
    })
    const isMirrorWrap = ref<boolean>(false) // Enable mirrors for the particles (only works if isWallWrap is true)
    const isInfiniteMirrorWrap = ref<boolean>(false) // Enable infinite mirrors for the particles (only works if isWallWrap is true)
    const mirrorWrapCount = ref<number>(5) // Number of mirrors (5 or 9)
    const screenMultiplierForGridSize = ref<number>(3) // Multiplier for the grid size (1 means the grid will be the same size as the screen)
    const isDebugBinsActive = ref<boolean>(false) // Show bins for the particles
    const debugMaxParticleCount = ref<number>(1600) // Maximum number of particles for debugging purposes
    const isDebugHeatmapActive = ref<boolean>(true) // Enable debug heatmap for the particles
    const cellSubdivisions = ref<number>(2) // Number of subdivisions of maxRadius per cell (CELL_SIZE = maxRadius / cellSubdivisions)

    const isDriftCamActive = ref<boolean>(false) // Enable drift camera mode (slow automatic movement)
    const driftCamResetOnPan = ref<boolean>(false) // Reset drift camera trajectory when the user pans/zoom
    const driftCamSpeed = ref<number>(0.1) // Drift camera speed (0.1 = slow, 1.0 = fast)
    const driftCamAmplitude = ref<number>(0.90) // Amplitude of camera movement (0.5 = half the simulation size, 1.0 = full simulation size)
    const driftCamZoomRange = ref<number[]>([0.4, 3.0]) // Range of zoom levels for driftCam (min, max)

    const isTrackerActive = ref<boolean>(false) // Enable tracker for the particles (follows creatures)
    const isTrackerSelectionActive = ref<boolean>(false) // Enable selection mode for the tracker (select a creature to follow)
    const isTrackerCameraActive = ref<boolean>(true) // Enable camera follow mode for the tracker
    const isTrackerIndicatorVisible = ref<boolean>(true) // Show/hide the tracker indicator overlay
    const trackerCameraSmoothing = ref<number>(0.75) // Smoothing factor for camera tracking (0 = no smoothing, 1 = instant)

    // Define force properties
    const repel = ref<number>(1) // repel force for particles that are too close to each other
    const forceFactor = ref<number>(1.0) // Adjust the overall force applied between particles (can't be 0)
    const frictionFactor = ref<number>(0.3) // Slow down the particles (0 to 1, where 0 is no friction)
    const magneticStrength = ref<number>(0) // Lorentz force strength (0 = off). Each species has a derived charge; non-zero creates spiral/circular motion

    // ---- Quantum / Electrical layer: Urge & Neuron particles -------------------------
    const isElectricalEnabled = ref<boolean>(true) // Master switch for the whole urge/neuron layer
    const numUrges = ref<number>(30) // Number of urge particles (each has its own objective)
    const numNeurons = ref<number>(80) // Number of neuron particles (each is an actuator for one color, driven by nearby urges)
    const metricMode = ref<number>(0) // goal family: 0 = cycle all three per-urge (maximize/minimize/homeostasis), 1 = all maximize, 2 = all minimize, 3 = all homeostasis
    const urgeRadius = ref<number>(45) // Radius over which an urge measures its goal metric & a neuron pushes/pulls its color
    const neuronRadius = ref<number>(30) // Radius (from the neuron) within which an urge drives it
    const urgeForce = ref<number>(0.2) // Strength of a neuron's field on its color, scaled by the drive from nearby urges (tuned: controlMax*urgeForce ≈ 1.15× F_pair)
    const controlGain = ref<number>(0.2) // Learning rate: how strongly dM/dt pushes an urge's control toward its goal sign (tuned for O(1) normalized metric)
    const controlMax = ref<number>(2.0) // Clamp on |control| (+ attract / - repel)
    const neuronInfluence = ref<number>(0.6) // (legacy, unused) strength of a single neuron's vote on an urge's control
    const neuronAuthority = ref<number>(0.4) // (legacy, unused) extra authority gained per nearby neuron
    const maxAuthority = ref<number>(3.0) // (legacy, unused) cap on the accumulated neuron authority
    const cohesion = ref<number>(0.6) // How strongly urges/neurons cling to the body & avoid overlapping
    // ---- Sense neurons: sensors that perceive ONE target color (no actuation) --------------
    // Each sense neuron senses exactly one color (= local index % numTypes) and stores its
    // perception in the persistent particle scalars: signal = magnitude [0,1], control = bearing
    // (radians, -PI..PI) for omnidirectional senses; 0 when there is no meaningful bearing.
    const numSenseNeurons = ref<number>(200) // Number of sense neuron particles (sensors)
    const senseRadius = ref<number>(60) // Perception radius (world units) shared by all three senses
    const senseConeHalfAngleDeg = ref<number>(35) // Sight: half-angle (degrees) of the forward cone in direction of motion
    const senseMode = ref<number>(0) // 0 = cycle all three per-sense (sight/smell/sound), 1 = all sight, 2 = all smell, 3 = all sound
    const isDebugConnections = ref<boolean>(false) // Debug: draw dotted lines between urges and the neurons wired to them

    // ---- Urge Cloning system -----------------------------------------------------------
    const isCloningEnabled = ref<boolean>(true) // Master switch for the clone-on-high-metric system
    const cloneMetricThreshold = ref<number>(1.5) // Normalized metric above which an urge triggers a clone (>50% above expected → "highly successful")
    const birthSustainedTicks = ref<number>(2) // Consecutive 500 ms ticks above threshold before a birth (1 = immediately whenever above)
    const cloneImpulse = ref<number>(1500) // Initial velocity magnitude for clones (enough to exit radius, stay in area)
    const numClonePool = ref<number>(100) // Number of dormant slots available for cloning (added to total particle count)

    // ---- Urge Lifecycle: Death, Merges & Murders ---------------------------------------
    const isDeathEnabled = ref<boolean>(false) // Starvation death: urge dies when metric stays near zero
    const deathMetricThreshold = ref<number>(0.4) // Normalized signal below this counts as "genuinely starved" (<60% below expected)
    const deathSustainedTicks = ref<number>(12) // Consecutive 500 ms ticks below threshold before death (12×500 ms ≈ 6 s)

    const isMergeEnabled = ref<boolean>(true) // Two urges that stay close merge into one
    const mergeRadius = ref<number>(27) // World-unit distance for "close" (default ≈ urgeRadius × 0.6)
    const mergeSustainedTicks = ref<number>(8) // Consecutive ticks of proximity before merge (8×500 ms ≈ 4 s)

    const isMurderEnabled = ref<boolean>(false) // Instant kill on collision when power gap exceeds margin
    const murderRadius = ref<number>(16) // World-unit distance for "collision" (default ≈ urgeRadius × 0.35)
    const murderPowerMargin = ref<number>(0.5) // Minimum |powerA − powerB| before the weaker dies

    const showLiveDeltaTime = ref<boolean>(false) // Show live Δt in the HUD (for debugging and performance monitoring)
    const manualDeltaTimeEnabled = ref<boolean>(false) // Override the automatic (framerate-independent) Δt with a fixed value
    const manualDeltaTime = ref<number>(0.0166) // Manual simulation time step in seconds (used only when manualDeltaTimeEnabled)

    // Define properties for randomizing radius matrix
    const minRadiusRange = ref<number[]>([12, 24]) // Range for the random minRadius of each color
    const maxRadiusRange = ref<number[]>([32, 64]) // Range for the random maxRadius of each color

    const currentMaxRadius = ref<number>(0) // Current max radius for the particles

    const useSpatialHash = ref<boolean>(true) // Use spatial hash for collision detection or brute force

    const isBrushActive = ref<boolean>(false) // Is the brush active
    const brushes = ref<number[]>([]) // Brush particles
    const brushRadius = ref<number>(220) // Brush radius
    const brushIntensity = ref<number>(160) // Brush intensity (number of particles)
    const brushType = ref<number>(1) // Brush type (0: Add, 1: Remove)
    const attractForce = ref<number>(50) // Attract force for the brush
    const repulseForce = ref<number>(35) // Repulse force for the brush
    const brushDirectionalForce = ref<number>(40) // Directional force for the brush
    const showBrushCircle = ref<boolean>(true) // Show the brush circle

    const glowSize = ref<number>(10.0) // Size of the glow effect
    const glowIntensity = ref<number>(0.066) // Intensity of the glow effect
    const glowSteepness = ref<number>(3.0) // Steepness of the glow effect
    const particleOpacity = ref<number>(0.85) // Opacity of the particles

    const selectedSpawnPositionOption = ref<number>(0) // Default to 'random'
    const selectedRulesOption = ref<number>(0) // Default to 'random'
    const selectedColorPaletteOption = ref<number>(0) // Default to 'random'

    const savedPresets = ref<Record<string, Preset>>({}) // Saved presets from localStorage
    const isSaveModalOpen = ref<boolean>(false) // Is the save preset modal open

    function $reset() {
        sidebarLeftOpen.value = false
        currentMaxRadius.value = 0 // Prevent watcher from not triggering when page is reloaded (!important)
    }

    return {
        engineType,
        sidebarLeftOpen,
        isLockedPointer,
        isHudLocked,
        isRunning,
        rulesMatrix,
        minRadiusMatrix,
        maxRadiusMatrix,
        currentColors,
        simWidth,
        simHeight,
        linkProportions,
        numParticles,
        particleSize,
        numColors,
        zoomSmoothing,
        panSmoothing,
        is3D,
        isParticleGlow,
        isAdditiveBlending,
        isWallRepel,
        isWallWrap,
        wallState,
        isMirrorWrap,
        isInfiniteMirrorWrap,
        mirrorWrapCount,
        screenMultiplierForGridSize,
        isDebugBinsActive,
        debugMaxParticleCount,
        isDebugHeatmapActive,
        cellSubdivisions,
        isDriftCamActive,
        driftCamResetOnPan,
        driftCamSpeed,
        driftCamAmplitude,
        driftCamZoomRange,
        isTrackerActive,
        isTrackerSelectionActive,
        isTrackerCameraActive,
        isTrackerIndicatorVisible,
        trackerCameraSmoothing,
        minRadiusRange,
        maxRadiusRange,
        currentMaxRadius,
        repel,
        forceFactor,
        frictionFactor,
        magneticStrength,
        useSpatialHash,
        isElectricalEnabled,
        numUrges,
        numNeurons,
        metricMode,
        urgeRadius,
        neuronRadius,
        urgeForce,
        controlGain,
        controlMax,
        neuronInfluence,
        neuronAuthority,
        maxAuthority,
        cohesion,
        numSenseNeurons,
        senseRadius,
        senseConeHalfAngleDeg,
        senseMode,
        isDebugConnections,
        isCloningEnabled,
        cloneMetricThreshold,
        birthSustainedTicks,
        cloneImpulse,
        numClonePool,
        isDeathEnabled,
        deathMetricThreshold,
        deathSustainedTicks,
        isMergeEnabled,
        mergeRadius,
        mergeSustainedTicks,
        isMurderEnabled,
        murderRadius,
        murderPowerMargin,
        showLiveDeltaTime,
        manualDeltaTimeEnabled,
        manualDeltaTime,
        isBrushActive,
        brushes,
        brushRadius,
        brushIntensity,
        brushType,
        attractForce,
        repulseForce,
        brushDirectionalForce,
        showBrushCircle,
        glowSize,
        glowIntensity,
        glowSteepness,
        particleOpacity,
        selectedSpawnPositionOption,
        selectedRulesOption,
        selectedColorPaletteOption,
        savedPresets,
        isSaveModalOpen,
        $reset,
    }
})

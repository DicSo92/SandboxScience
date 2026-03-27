import { defineStore } from 'pinia'
import type { Preset } from "~/composables/usePresetManager";

export const useParticleLifeGPUStore = defineStore('particleLifeGPU', () => {
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
        }
    })
    const isMirrorWrap = ref<boolean>(false) // Enable mirrors for the particles (only works if isWallWrap is true)
    const isInfiniteMirrorWrap = ref<boolean>(false) // Enable infinite mirrors for the particles (only works if isWallWrap is true)
    const mirrorWrapCount = ref<number>(5) // Number of mirrors (5 or 9)
    const screenMultiplierForGridSize = ref<number>(3) // Multiplier for the grid size (1 means the grid will be the same size as the screen)
    const isDebugBinsActive = ref<boolean>(false) // Show bins for the particles
    const debugMaxParticleCount = ref<number>(1600) // Maximum number of particles for debugging purposes
    const isDebugHeatmapActive = ref<boolean>(true) // Enable debug heatmap for the particles

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

    const selectedColor = ref<string>('#3c7928')


    function $reset() {
        sidebarLeftOpen.value = false
        currentMaxRadius.value = 0 // Prevent watcher from not triggering when page is reloaded (!important)
    }

    return {
        engineType, sidebarLeftOpen, isLockedPointer, isHudLocked,
        isRunning,
        rulesMatrix, minRadiusMatrix, maxRadiusMatrix, currentColors,
        simWidth, simHeight, linkProportions,
        numParticles, particleSize, numColors, zoomSmoothing, panSmoothing,
        is3D, isParticleGlow, isAdditiveBlending, isWallRepel, isWallWrap, wallState, isMirrorWrap, isInfiniteMirrorWrap, mirrorWrapCount, screenMultiplierForGridSize,
        isDebugBinsActive, debugMaxParticleCount, isDebugHeatmapActive,
        isDriftCamActive, driftCamResetOnPan, driftCamSpeed, driftCamAmplitude, driftCamZoomRange,
        isTrackerActive, isTrackerSelectionActive, isTrackerCameraActive, isTrackerIndicatorVisible, trackerCameraSmoothing,
        minRadiusRange, maxRadiusRange, currentMaxRadius,
        repel, forceFactor, frictionFactor, useSpatialHash,
        isBrushActive, brushes, brushRadius, brushIntensity, brushType, attractForce, repulseForce, brushDirectionalForce, showBrushCircle,
        glowSize, glowIntensity, glowSteepness, particleOpacity,
        selectedSpawnPositionOption, selectedRulesOption, selectedColorPaletteOption, savedPresets, isSaveModalOpen,
        $reset, selectedColor
    }
})

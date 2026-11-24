struct TrackerState {
    x: f32,
    y: f32,
    vx: f32,
    vy: f32,
    searchRadius: f32,
    expectedCount: u32,
    baseCameraX: f32,
    baseCameraY: f32,
}

struct Camera {
    centerX: f32,
    centerY: f32,
    scaleX: f32,
    scaleY: f32,
}

struct TrackerCameraOptions {
    panOffsetX: f32,
    panOffsetY: f32,
    smoothing: f32,
}

@group(0) @binding(0) var<storage, read_write> tracker: TrackerState;
@group(0) @binding(1) var<storage, read_write> camera: Camera;
@group(0) @binding(2) var<uniform> cameraOptions: TrackerCameraOptions;

@compute @workgroup_size(1)
fn main() {
    // Smooth base camera position towards tracker (tracker smoothing only)
    let newBaseX = tracker.baseCameraX + (tracker.x - tracker.baseCameraX) * cameraOptions.smoothing;
    let newBaseY = tracker.baseCameraY + (tracker.y - tracker.baseCameraY) * cameraOptions.smoothing;

    // Persist base position for next frame
    tracker.baseCameraX = newBaseX;
    tracker.baseCameraY = newBaseY;

    // Apply pan offset directly (already smoothed by panSmoothing on CPU)
    camera.centerX = newBaseX + cameraOptions.panOffsetX;
    camera.centerY = newBaseY + cameraOptions.panOffsetY;
}

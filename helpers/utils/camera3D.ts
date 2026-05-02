// =====================================================================================================================
// Matrix math helpers for 3D camera (column-major, WebGPU-style depth in [0,1])
// =====================================================================================================================
// All functions write into a pre-allocated `out` Float32Array (no allocations) and return it for chaining.

/**
 * Build a perspective projection matrix.
 * @param out    Destination Float32Array of length 16 (column-major).
 * @param fovY   Vertical field-of-view in radians.
 * @param aspect Viewport aspect ratio (width / height).
 * @param near   Near clipping plane (must be > 0).
 * @param far    Far clipping plane (must be > near).
 */
export function mat4Perspective(out: Float32Array, fovY: number, aspect: number, near: number, far: number) {
    const f = 1 / Math.tan(fovY / 2)
    const nf = 1 / (near - far)
    out[0]=f/aspect; out[1]=0;  out[2]=0;             out[3]=0
    out[4]=0;        out[5]=f;  out[6]=0;             out[7]=0
    out[8]=0;        out[9]=0;  out[10]=far*nf;       out[11]=-1
    out[12]=0;       out[13]=0; out[14]=near*far*nf;  out[15]=0
    return out
}

/**
 * Build a view matrix that places the camera at `eye` looking at `target` with a given world-space `up`.
 * @param out    Destination Float32Array of length 16 (column-major).
 * @param eye    Camera position [x, y, z].
 * @param target Point the camera looks at [x, y, z].
 * @param up     World-space up vector [x, y, z] (typically [0, 1, 0]).
 */
export function mat4LookAt(out: Float32Array, eye: number[], target: number[], up: number[]) {
    const zx = eye[0]-target[0], zy = eye[1]-target[1], zz = eye[2]-target[2]
    const zl = Math.hypot(zx, zy, zz) || 1
    const fz0 = zx/zl, fz1 = zy/zl, fz2 = zz/zl
    // x = normalize(cross(up, z))
    let xx = up[1]*fz2 - up[2]*fz1
    let xy = up[2]*fz0 - up[0]*fz2
    let xz = up[0]*fz1 - up[1]*fz0
    const xl = Math.hypot(xx, xy, xz) || 1
    xx/=xl; xy/=xl; xz/=xl
    // y = cross(z, x)
    const yx = fz1*xz - fz2*xy
    const yy = fz2*xx - fz0*xz
    const yz = fz0*xy - fz1*xx
    out[0]=xx;  out[1]=yx;  out[2]=fz0;  out[3]=0
    out[4]=xy;  out[5]=yy;  out[6]=fz1;  out[7]=0
    out[8]=xz;  out[9]=yz;  out[10]=fz2; out[11]=0
    out[12]=-(xx*eye[0]+xy*eye[1]+xz*eye[2])
    out[13]=-(yx*eye[0]+yy*eye[1]+yz*eye[2])
    out[14]=-(fz0*eye[0]+fz1*eye[1]+fz2*eye[2])
    out[15]=1
    return out
}

/**
 * Multiply two 4x4 matrices: `out = a * b` (column-major).
 * `out` may NOT alias `a` or `b`.
 */
export function mat4Mul(out: Float32Array, a: Float32Array, b: Float32Array) {
    for (let c = 0; c < 4; c++) {
        const b0=b[c*4], b1=b[c*4+1], b2=b[c*4+2], b3=b[c*4+3]
        out[c*4]   = a[0]*b0 + a[4]*b1 + a[8]*b2  + a[12]*b3
        out[c*4+1] = a[1]*b0 + a[5]*b1 + a[9]*b2  + a[13]*b3
        out[c*4+2] = a[2]*b0 + a[6]*b1 + a[10]*b2 + a[14]*b3
        out[c*4+3] = a[3]*b0 + a[7]*b1 + a[11]*b2 + a[15]*b3
    }
    return out
}

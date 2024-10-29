declare module 'gifenc' {
    export function GIFEncoder(): GIFEncoder;
    export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number): Uint8Array;
    export function applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: Uint8Array): Uint8Array;
}
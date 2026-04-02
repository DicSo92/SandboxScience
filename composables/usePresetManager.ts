import { hideAllPoppers } from "floating-vue";
import { clamp, rgbToHex, hslToRgb, hexToRgb } from "~/helpers/utils/colorConversion"
const { success, error } = useToasts()

import * as z from "zod/mini";
z.config(z.locales.en())

export type Preset = {
    v: number
    meta: {
        name: string
        description: string | null
    }
    types: string[]
    settings?: {
        species: number
        numParticles: number
        frictionFactor: number
        forceFactor: number
    }
    matrices?: {
        forces: number[][]
        minRadius?: number[][]
        maxRadius?: number[][]
    }
    colors?: string[]
}

// -----------------------------------------------------------------------------------------------------------------
// --- Format preset JSON ------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------
const formatPresetJson = (presetData: Preset): string => {
    // Convert preset data to formatted JSON string
    let formattedJson = JSON.stringify(presetData, null, 2)

    // Match simple JSON arrays (no nested [ ]) on multiple lines
    const arrayBlockRegex = /\[(?:[^\[\]]|\n|\r)*?]/g
    formattedJson = formattedJson.replace(arrayBlockRegex, (match) => {
        try {
            const parsed = JSON.parse(match)

            // Skip if not an array
            if (!Array.isArray(parsed)) return match

            // Only compact flat arrays of primitives: string | number | boolean | null
            const isSimple =
                parsed.length === 0 ||
                parsed.every(v => v === null || ["string", "number", "boolean"].includes(typeof v))

            if (!isSimple) return match

            // One-line array with a space after commas
            const inner = parsed.map(v => JSON.stringify(v)).join(", ")
            return `[${inner}]`
        } catch {
            return match
        }
    })

    return formattedJson
}
// -----------------------------------------------------------------------------------------------------------------
const copyToClipboard = (presetData: Preset | undefined) => {
    if (!presetData) return

    const formattedJson = formatPresetJson(presetData)

    // Write the formatted text to clipboard
    navigator.clipboard.writeText(formattedJson).then(() => {
        console.log('Preset copied to clipboard')
        success('Preset copied to clipboard.')
        safeHideAllPoppers()
    }).catch(err => {
        console.error('Could not copy preset: ', err)
        error('Error copying preset to clipboard.')
        safeHideAllPoppers()
    })
}
// -----------------------------------------------------------------------------------------------------------------
const download = (presetData: Preset | undefined) => {
    if (!presetData) return

    const formattedJson = formatPresetJson(presetData)

    // Build a filename from the preset name (fallback if empty)
    const baseName = (presetData.meta?.name || "preset")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\-]+/g, "-")
        .replace(/^-+|-+$/g, "")

    const fileName = `${baseName || "preset"}.json`

    // Create a Blob and a temporary download link
    const blob = new Blob([formattedJson], { type: "application/json;charset=utf-8" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    a.style.display = "none"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    success("Preset downloaded.")
    safeHideAllPoppers()
}
// -----------------------------------------------------------------------------------------------------------------
// --- Utility functions for presets -------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------
const safeHideAllPoppers = () => {
    // Blur any active element inside a preset dropdown to prevent focus issues on hide
    const active = document.activeElement as HTMLElement | null;
    if (active && active.closest(".dropdownPresetOptions")) {
        active.blur()
    }
    hideAllPoppers()
}
const clone1D = <T>(arr: T[]) => [...arr]
const clone2D = (m: number[][]) => m.map(row => [...row])
const flatRgbaToHexList = (flatRgba: Float32Array | number[]): string[] => {
    const colors: string[] = []
    for (let i = 0; i < flatRgba.length; i += 4) {
        colors.push(rgbToHex(
            Math.round(clamp(flatRgba[i], 0, 1) * 255),
            Math.round(clamp(flatRgba[i + 1], 0, 1) * 255),
            Math.round(clamp(flatRgba[i + 2], 0, 1) * 255),
        ))
    }
    return colors
}
const hexListToFlatRgba = (hexList: string[]): Float32Array => {
    const flat = new Float32Array(hexList.length * 4)
    for (let i = 0; i < hexList.length; i++) {
        const rgb = hexToRgb(hexList[i])
        if (!rgb) continue
        flat[i * 4]     = rgb[0] / 255
        flat[i * 4 + 1] = rgb[1] / 255
        flat[i * 4 + 2] = rgb[2] / 255
        flat[i * 4 + 3] = 1
    }
    return flat
}
const hslArrayToHexList = (hslArray: number[][]): string[] => {
    const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0").toUpperCase()
    return hslArray.map(([h, s, l]) => {
        const [r, g, b] = hslToRgb(h, s, l)
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`
    })
}
const flattenMatrix = (matrix: number[][]): number[] => {
    const size = matrix.length
    const result = new Array(size * size)

    let index = 0
    for (let i = 0; i < size; i++) {
        const row = matrix[i]
        for (let j = 0; j < size; j++) {
            result[index++] = row[j]
        }
    }
    return result
}
const  unflattenMatrix = (array: number[], size: number): number[][] => {
    const result = new Array(size)
    for (let i = 0; i < size; i++) {
        result[i] = array.slice(i * size, (i + 1) * size)
    }
    return result
}

// ---------------------------------------------------------------------------------------------------------------------
// --- Preset validation -----------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
export type PresetValidationError = {
    message: string
    path?: string
    code?: string
}
export type PresetValidationResult = {
    valid: boolean
    errors: PresetValidationError[]
}

const isProper2DMatrix = (m: number[][]) => {
    if (!Array.isArray(m) || m.length === 0) return false // Must be non-empty 2D array
    const rows = m.length
    const cols = Array.isArray(m[0]) ? m[0].length : 0
    if (cols === 0 || rows !== cols) return false // Must be square
    // All rows must have same length and contain only numbers
    return m.every(row => Array.isArray(row) && row.length === cols && row.every(v => Number.isFinite(v)))
}
const presetSchema = z.strictObject({
    v: z.literal(1),
    meta: z.strictObject({
        name: z.string().check(z.minLength(1), z.maxLength(32), z.trim()),
        description: z.nullable(z.optional(z.string())),
    }),
    types: z.array(z.enum(["settings", "forces", "radii", "colors"], 'Must be one of: settings | forces | radii | colors')).check(
        z.minLength(1, "Must contain at least one type."),
        z.refine(
            (types) => new Set(types).size === types.length,
            { message: "Must not contain duplicates.", params: { subCode: "types_duplicates" }}
        )
    ),
    colors: z.optional(
        z.array(
            z.string().check(z.regex(/^#([0-9a-fA-F]{6})$/, "Must be a valid hex color (#RRGGBB)."))
        ).check(z.minLength(1))
    ),
    matrices: z.optional(z.strictObject({
        forces: z.optional(z.array(z.array(z.number().check(z.gte(-1), z.lte(1)))).check(
            z.minLength(1), z.refine(isProper2DMatrix, { message: "Must be a square 2D matrix (same number of rows and columns)", params: { subCode: "invalid_square_matrix"} })
        )),
        minRadius: z.optional(z.array(z.array(z.number().check(z.gte(0)))).check(
            z.minLength(1), z.refine(isProper2DMatrix, { message: "Must be a square 2D matrix (same number of rows and columns)", params: { subCode: "invalid_square_matrix"} })
        )),
        maxRadius: z.optional(z.array(z.array(z.number().check(z.gte(0)))).check(
            z.minLength(1), z.refine(isProper2DMatrix, { message: "Must be a square 2D matrix (same number of rows and columns)", params: { subCode: "invalid_square_matrix"} })
        )),
    }).check(z.refine((m: { minRadius?: number[][]; maxRadius?: number[][] }) =>
        (!m.minRadius && !m.maxRadius) || (m.minRadius && m.maxRadius),
        { message: "`minRadius` and `maxRadius` must be both present or both missing", params: { subCode: "radius_pair_incomplete"} })
    )),
    settings: z.optional(z.object({
        species: z.number(),
        numParticles: z.number(),
        frictionFactor: z.number(),
        forceFactor: z.number(),
    }))
})
const validatePreset = (preset: any): PresetValidationResult => {
    const errors: PresetValidationError[] = []

    const addError = (message: string, path?: string, code?: string) => {
        errors.push({ message, path, code })
    }

    const parsed = presetSchema.safeParse(preset as any)
    if (!parsed.success) {
        for (const issue of parsed.error.issues) {
            // const path = issue.path.join(".") || "root"
            const path = formatIssuePath(issue.path as (string | number)[])
            let code = issue.code
            if ("params" in issue) code = issue.params?.subCode || code
            addError(issue.message, path, code)
        }
        return { valid: false, errors }
    }

    const p = parsed.data as Preset
    const matrices = p.matrices
    const types = p.types ?? []

    const hasSettings = types.includes("settings")
    const hasForces = types.includes("forces")
    const hasRadii = types.includes("radii")
    const hasColors = types.includes("colors")

    if ((hasForces || hasRadii) && !matrices) {
        addError('Field "matrices" is required when "types" contains "forces" or "radii".', "matrices",  "missing_matrices")
    }
    if (!hasForces && !hasRadii && matrices) {
        addError('Field "matrices" must not be present when "types" does not contain "forces" or "radii".', "matrices", "unexpected_matrices")
    }
    if (hasForces && !matrices?.forces) {
        addError('Field "matrices.forces" is required when "types" contains "forces".', "matrices.forces", "missing_forces_matrix")
    } else if (!hasForces && matrices?.forces) {
        addError('Field "matrices.forces" must not be present when "types" does not contain "forces".', "matrices.forces", "unexpected_forces_matrix")
    }
    if (hasRadii && (!matrices?.minRadius || !matrices?.maxRadius)) {
        addError('Fields "matrices.minRadius" and "matrices.maxRadius" are required when "types" contains "radii".', "matrices", "missing_radii_matrices")
    } else if (!hasRadii && !!(matrices?.minRadius || matrices?.maxRadius)) {
        addError('Fields "matrices.minRadius" and "matrices.maxRadius" must not be present when "types" does not contain "radii".', "matrices", "unexpected_radii_matrices")
    }

    if (hasColors && !p.colors) {
        addError('Field "colors" is required when "types" contains "colors".', "colors", "missing_colors")
    }
    if (!hasColors && p.colors) {
        addError('Field "colors" must not be present when "types" does not contain "colors".', "colors", "unexpected_colors")
    }

    if (hasSettings && !p.settings) {
        addError('Field "settings" is required when "types" contains "settings".', "settings", "missing_settings")
    }
    if (!hasSettings && p.settings) {
        addError('Field "settings" must not be present when "types" does not contain "settings".', "settings", "unexpected_settings")
    }

    // Check for consistent species count across relevant fields
    if (errors.length === 0) {
        const sources = [
            { path: "colors", count: hasColors && p.colors ? p.colors.length : undefined },
            { path: "matrices.forces", count: hasForces && matrices?.forces ? matrices.forces.length : undefined },
            { path: "matrices.minRadius", count: hasRadii && matrices?.minRadius ? matrices.minRadius.length : undefined },
            { path: "matrices.maxRadius", count: hasRadii && matrices?.maxRadius ? matrices.maxRadius.length : undefined },
        ].filter(c => c.count != null) as { path: string; count: number }[]

        if (sources.length > 1) {
            const expected = sources[0].count
            for (const source of sources) {
                if (source.count !== expected) {
                    addError(`Species counts are inconsistent between '${sources[0].path}' (${expected}) and '${source.path}' (${source.count}).`, source.path, "inconsistent_species_count")
                    break
                }
            }
        }
    }

    return { valid: errors.length === 0, errors }
}
const formatIssuePath = (segments: (string | number)[]): string => {
    if (!segments.length) return "root"

    return segments.map((seg, index) => {
        if (index === 0) return String(seg)
        if (typeof seg === "number") return `[${seg}]`
        return `.${seg}`
    }).join("")
}
// ---------------------------------------------------------------------------------------------------------------------
// --- Preset manager composable ---------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
export const usePresetManager = (particleLife: any) => {
    const getSavedPresets = () => {
        // Load existing presets from localStorage
        const localPresets = localStorage.getItem("particleLife.presets")
        particleLife.savedPresets = localPresets ? JSON.parse(localPresets) as Record<string, Preset> : {}
    }
    const save = (presetData: Preset) => {
        getSavedPresets()
        const id = crypto.randomUUID?.() ?? `pl-${Date.now()}-${Math.random().toString(36).slice(2)}`
        particleLife.savedPresets = {
            [id]: presetData,
            ...particleLife.savedPresets
        }
        localStorage.setItem("particleLife.presets", JSON.stringify(particleLife.savedPresets))
        success("Preset saved.")
        safeHideAllPoppers()
    }
    const getPresetByID = (presetID: string): Preset | undefined => {
        getSavedPresets()
        const presetData: Preset | undefined = particleLife.savedPresets[presetID]
        if (!presetData) {
            error('Preset not found.')
            safeHideAllPoppers()
        }
        return presetData
    }
    const removePreset = (presetID: string) => {
        if (particleLife.savedPresets[presetID]) {
            delete particleLife.savedPresets[presetID]
            localStorage.setItem("particleLife.presets", JSON.stringify(particleLife.savedPresets))
            success("Preset deleted.")
            safeHideAllPoppers()
        } else {
            error("Preset not found.")
            safeHideAllPoppers()
        }
    }
    return {
        copyToClipboard, download, save, getSavedPresets, safeHideAllPoppers,
        formatPresetJson, getPresetByID, removePreset,
        clone1D, clone2D, flatRgbaToHexList, hexListToFlatRgba, hslArrayToHexList, flattenMatrix, unflattenMatrix,
        validatePreset
    }
}
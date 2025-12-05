import { hideAllPoppers } from "floating-vue";
const { success, error } = useToasts()

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
const flatRgbaToHexList = (flatRgba: number[]): string[] => {
    const colors: string[] = []

    for (let i = 0; i < flatRgba.length; i += 4) {
        const r = Math.round(Math.min(Math.max(flatRgba[i], 0), 1) * 255)
        const g = Math.round(Math.min(Math.max(flatRgba[i + 1], 0), 1) * 255)
        const b = Math.round(Math.min(Math.max(flatRgba[i + 2], 0), 1) * 255)

        const toHex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase()
        colors.push(`#${toHex(r)}${toHex(g)}${toHex(b)}`)
    }

    return colors
}
const hexListToFlatRgba = (hexList: string[]): Float32Array => {
    const flat = new Float32Array(hexList.length * 4)

    for (let i = 0; i < hexList.length; i++) {
        const hex = hexList[i]
        const clean = hex.replace("#", "").trim()
        const full = clean.length === 3
            ? clean.split("").map(c => c + c).join("") // ex: f0a → ff00aa
            : clean

        flat[i * 4]     = parseInt(full.substring(0, 2), 16) / 255
        flat[i * 4 + 1] = parseInt(full.substring(2, 4), 16) / 255
        flat[i * 4 + 2] = parseInt(full.substring(4, 6), 16) / 255
        flat[i * 4 + 3] = 1
    }
    return flat
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

export const usePresetUtils = (particleLife: any) => {
    const getSavedPresets = () => {
        // Load existing presets from localStorage
        const localPresets = localStorage.getItem("particleLife.presets")
        particleLife.savedPresets = localPresets ? JSON.parse(localPresets) as Record<string, Preset> : {}
    }
    const save = (presetData: Preset) => {
        getSavedPresets()
        const id = crypto.randomUUID?.() ?? `pl-${Date.now()}-${Math.random().toString(36).slice(2)}`
        particleLife.savedPresets[id] = presetData
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
        clone1D, clone2D, flatRgbaToHexList, hexListToFlatRgba, flattenMatrix, unflattenMatrix,
    }
}
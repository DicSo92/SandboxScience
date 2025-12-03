<template>
    <section>
        <div mb-2>
            <p class="text-2sm mb-1">Preset Name</p>
            <input type="text" maxlength="32" placeholder="Enter a name for this preset..." v-model="name"
                   class="w-full border bg-slate-900/70 border-gray-200 rounded px-2 py-1 text-sm text-slate-200 font-500">
        </div>
        <div>
            <p class="text-2sm mb-1">Description (Optional)</p>
            <textarea rows="2" maxlength="180" placeholder="Describe what this preset does..." v-model="description"
                      class="w-full border bg-slate-900/70 border-gray-200 rounded px-2 py-1 text-sm text-slate-200 font-500 leading-5 resize-y min-h-[1.25rem] max-h-[3.75rem] overflow-auto"></textarea>
        </div>
        <hr border-gray-500 my-2>
        <p underline text-gray-300 class="-mt-0.5" mb-2>Select what to include in this preset :</p>
        <div flex flex-col gap-2>
            <ToggleSwitch label="Force Matrix" colorful-label v-model="forceMatrix"
                          tooltip="Save force Matrix">
            </ToggleSwitch>
            <ToggleSwitch label="Radius Matrices" colorful-label v-model="radiusMatrices"
                          tooltip="Save min/max radius matrices">
            </ToggleSwitch>
            <ToggleSwitch label="Color Palette" colorful-label v-model="colors"
                          tooltip="Save species colors">
            </ToggleSwitch>
            <ToggleSwitch label="General settings" colorful-label v-model="generalSettings"
                          tooltip="Save simulation settings such as particle count, friction, and global forces.">
            </ToggleSwitch>
        </div>
        <div flex gap-2 justify-end text-sm mt-2>
            <button type="button" @click="copyToClipboard()" :disabled="!canSave" btn px-3 rounded-full flex justify-center items-center bg="slate-800/80 hover:slate-800/50 disabled:slate-800/30" class="disabled:cursor-not-allowed">
                <span i-tabler-copy mr-1></span>
                Copy
            </button>
            <button type="button" @click="download()" :disabled="!canSave" btn px-3 rounded-full flex justify-center items-center bg="slate-800/80 hover:slate-800/50 disabled:slate-800/30" class="disabled:cursor-not-allowed">
                <span i-tabler-download mr-1></span>
                Download
            </button>
            <button type="button" @click="save" :disabled="!canSave" btn px-3 rounded-full flex justify-center items-center bg="cyan-900/80 hover:cyan-900/50 disabled:cyan-900/30" class="disabled:cursor-not-allowed">
                <span i-carbon-save mr-1></span>
                Save
            </button>
        </div>
        <div mt-4>
            <div flex justify-between>
                <p underline text-gray-300 class="-mt-0.5" mb-2>Saved Presets :</p>
                <button type="button" @click="matchPresetCount = !matchPresetCount" text-xs btn px-2 rounded-full flex justify-center items-center
                        :class="matchPresetCount ? 'bg-red-800/80 hover:bg-red-800/60' : 'bg-slate-700/80 hover:bg-slate-700/50'">
                    <span i-tabler-lock mr-1></span>
                    Species
                </button>
            </div>


            <div v-if="Object.keys(savedPresets).length > 0" mb-3>
                <span text-xs text-gray-300 underline mb-1>Sort by type:</span>

                <div flex items-center gap-1 text-xs>
                    <button type="button" v-for="meta in PRESET_TYPE_META" :key="meta.id"
                            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-500"
                            :class="activeTypeFilters.includes(meta.id) ? meta.color : 'bg-slate-800/60 text-gray-300'"
                            @click="toggleTypeFilter(meta.id)"
                    >
                        <span v-if="meta.icon" :class="meta.icon" text-sm></span>
                        <span>{{ meta.label }}</span>
                    </button>
                </div>

            </div>

            <div v-if="Object.keys(savedPresets).length === 0" text-sm text-gray-400 italic>
                No presets saved yet.
            </div>
            <div v-else flex flex-col gap-2>
                <div v-for="(preset, id) in filteredPresets" :key="id" @click="loadPreset(id)" p-2 rounded-lg flex justify-between items-center class="bg-slate-700/30">
                    <div flex-1 min-w-0 pr-2>
                        <p font-bold text-slate-200 text-sm truncate capitalize>{{ preset.meta.name }}</p>
                    </div>
                    <div flex items-center gap-2 flex-shrink-0>
                        <div flex gap-1>
                            <span v-for="meta in PRESET_TYPE_META" :key="meta.id"
                                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-500 text-slate-50"
                                  :class="preset.types.includes(meta.id) ? meta.color : 'bg-slate-600/40 opacity-60'"
                            >
                                <span v-if="meta.icon" :class="meta.icon" text-sm></span>
                            </span>
                        </div>
                        <div w-px h-5 bg-slate-700></div>

                        <VDropdown placement="right-start" popperClass="dropdownPresetOptions" :arrowPadding="10" instant-move>
                            <div flex items-center>
                                <button type="button" i-tabler-dots-vertical text-slate-100 text-center></button>
                            </div>

                            <template #popper>
                                <div flex flex-col class="bg-slate-800/70 backdrop-blur-sm rounded-md shadow-md">
                                    <button type="button" @click="copyToClipboard(id)" text-sm text-slate-100 class="rounded-t hover:bg-slate-500/50 px-4 py-2">
                                        <span i-tabler-copy></span>
                                        Copy JSON
                                    </button>
                                    <button type="button" @click="download(id)" text-sm text-slate-100 class="hover:bg-slate-500/50 px-4 py-2">
                                        Download JSON
                                    </button>
                                    <hr>
                                    <button type="button" @click="removePreset(id)" text-sm text-slate-100 class="rounded-b bg-red-700/30 hover:bg-red-700/60 px-4 py-2">
                                        Delete
                                    </button>
                                </div>
                            </template>
                        </VDropdown>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { hideAllPoppers } from 'floating-vue'

type Preset = {
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

export default defineComponent({
    name: 'SaveOptions',
    props: {
        store: {
            type: Object,
            required: true
        }
    },
    setup(props, { emit }) {
        const { success, error } = useToasts()
        const particleLife = props.store
        const savedPresets = ref<Record<string, Preset>>({})

        const name = ref<string>("")
        const description = ref<string>("")
        const forceMatrix = ref<boolean>(false)
        const radiusMatrices = ref<boolean>(false)
        const colors = ref<boolean>(false)
        const generalSettings = ref<boolean>(false)

        const activeTypeFilters = ref<string[]>([])
        const matchPresetCount = ref<boolean>(false)

        const PRESET_TYPE_META: { id: string; label: string; color: string; icon?: string }[] = [
            { id: "forces",   label: "Forces",   color: "bg-sky-700/60",     icon: "i-tabler-arrows-random" },
            { id: "radii",    label: "Radii",    color: "bg-purple-700/60",  icon: "i-tabler-circles" },
            { id: "colors",   label: "Colors",   color: "bg-amber-700/60",   icon: "i-tabler-palette" },
            { id: "settings", label: "Settings", color: "bg-emerald-700/60", icon: "i-tabler-adjustments" },
        ]

        onMounted(() => {
            getSavedPresets()
        })

        const canSave = computed(() => {
            return forceMatrix.value || radiusMatrices.value || colors.value || generalSettings.value || name.value.trim().length > 0
        })

        const filteredPresets = computed(() => {
            const filters = activeTypeFilters.value
            if (filters.length === 0) return savedPresets.value

            const result: Record<string, Preset> = {}
            for (const [id, preset] of Object.entries(savedPresets.value)) {
                const matchesAll = filters.every(t => preset.types.includes(t))
                if (matchesAll) {
                    result[id] = preset
                }
            }
            return result
        })

        // -------------------------------------------------------------------------------------------------------------
        // --- Preset management ---------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const toggleTypeFilter = (typeId: string) => {
            const idx = activeTypeFilters.value.indexOf(typeId)
            if (idx === -1) {
                activeTypeFilters.value.push(typeId)
            } else {
                activeTypeFilters.value.splice(idx, 1)
            }
        }

        const getSavedPresets = () => {
            // Load existing presets from localStorage
            const localPresets = localStorage.getItem("particleLife.presets")
            savedPresets.value = localPresets ? JSON.parse(localPresets) as Record<string, Preset> : {}
        }

        const buildPresetData = (): Preset => {
            const presetData: Preset = {
                v: 1,
                meta: {
                    name: name.value.trim() || "Untitled preset",
                    description: description.value.trim() || null
                },
                types: [] as string[] // "settings", "forces", "radii", "colors"
            }

            if (generalSettings.value) {
                presetData.settings = {
                    species: particleLife.numColors,
                    numParticles: particleLife.numParticles,
                    frictionFactor: particleLife.frictionFactor,
                    forceFactor: particleLife.forceFactor,
                }
                presetData.types.push("settings")
            }

            if (forceMatrix.value || radiusMatrices.value) {
                presetData.matrices = { forces: [] }
                // presetData.matrices = { size: particleLife.numColors, forces: [] }

                presetData.matrices.forces = clone2D(particleLife.rulesMatrix)
                presetData.types.push("forces")

                if (radiusMatrices.value) {
                    presetData.matrices.minRadius = clone2D(particleLife.minRadiusMatrix)
                    presetData.matrices.maxRadius = clone2D(particleLife.maxRadiusMatrix)
                    presetData.types.push("radii")
                }
            }

            if (colors.value) {
                presetData.colors = flatRgbaToHexList(particleLife.currentColors)
                presetData.types.push("colors")
            }

            return presetData
        }

        const copyToClipboard = (presetID?: string) => {
            let presetData: Preset | undefined;
            // If presetID is provided, copy that preset; otherwise, build from current settings
            if (presetID) {
                getSavedPresets()
                presetData = savedPresets.value[presetID]
                if (!presetData) {
                    error('Preset not found.')
                    safeHideAllPoppers()
                    return
                }
            } else {
                presetData = buildPresetData()
            }

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
        const download = (presetID?: string) => {
            let presetData: Preset | undefined;
            // If presetID is provided, copy that preset; otherwise, build from current settings
            if (presetID) {
                getSavedPresets()
                presetData = savedPresets.value[presetID]
                if (!presetData) {
                    error('Preset not found.')
                    safeHideAllPoppers()
                    return
                }
            } else {
                presetData = buildPresetData()
            }

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
        const save = () => {
            getSavedPresets()
            const presetData = buildPresetData()
            const id = crypto.randomUUID?.() ?? `pl-${Date.now()}-${Math.random().toString(36).slice(2)}`
            savedPresets.value[id] = presetData
            localStorage.setItem("particleLife.presets", JSON.stringify(savedPresets.value))
            success("Preset saved.")
            safeHideAllPoppers()
        }
        const removePreset = (id: string) => {
            if (savedPresets.value[id]) {
                delete savedPresets.value[id]
                localStorage.setItem("particleLife.presets", JSON.stringify(savedPresets.value))
                success("Preset deleted.")
                safeHideAllPoppers()
            } else {
                error("Preset not found.")
                safeHideAllPoppers()
            }
        }
        const loadPreset = (id: string) => {
            getSavedPresets()
            const preset = savedPresets.value[id]
            if (!preset) {
                error("Preset not found.")
                return
            }

            // if (preset.settings) {
            //     particleLife.numColors = preset.settings.species
            //     particleLife.numParticles = preset.settings.numParticles
            //     particleLife.frictionFactor = preset.settings.frictionFactor
            //     particleLife.forceFactor = preset.settings.forceFactor
            // }
            // if (preset.matrices) {
            //     if (preset.matrices.forces) {
            //         particleLife.rulesMatrix = clone2D(preset.matrices.forces)
            //     }
            //     if (preset.matrices.minRadius) {
            //         particleLife.minRadiusMatrix = clone2D(preset.matrices.minRadius)
            //     }
            //     if (preset.matrices.maxRadius) {
            //         particleLife.maxRadiusMatrix = clone2D(preset.matrices.maxRadius)
            //     }
            // }

            const options: {
                presetRules?: number[][],
                presetColors?: Float32Array
            } = {}
            if (preset.colors) {
                options.presetColors = hexListToFlatRgba(preset.colors)
            }
            if (preset.matrices) {
                options.presetRules = clone2D(preset.matrices.forces)
            }
            emit("loadPreset", options, matchPresetCount.value)

            success("Preset loaded.")
        }
        // -------------------------------------------------------------------------------------------------------------
        // --- Utility functions ---------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const safeHideAllPoppers = () => {
            // Blur any active element inside a preset dropdown to prevent focus issues on hide
            const active = document.activeElement as HTMLElement | null;
            if (active && active.closest(".dropdownPresetOptions")) {
                active.blur()
            }
            hideAllPoppers()
        }
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
        const clone2D = (m: number[][]) => m.map(row => [...row])
        const clone1D = <T>(arr: T[]) => [...arr]

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

        // -------------------------------------------------------------------------------------------------------------
        // --- Watchers ------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        watch(forceMatrix, (newVal) => {
            if (!newVal) radiusMatrices.value = false
        })
        watch(radiusMatrices, (newVal) => {
            if (newVal) forceMatrix.value = true
        })

        return {
            name, description, forceMatrix, radiusMatrices, colors, generalSettings,
            savedPresets, PRESET_TYPE_META, canSave,
            activeTypeFilters, filteredPresets, matchPresetCount,
            toggleTypeFilter, copyToClipboard, download, save, removePreset, loadPreset,
        }
    },
})
</script>

<style>
.dropdownPresetOptions {
    transition: none !important;
    .v-popper__inner {
        background: none !important;
        @apply border-slate-400;
    }
    .v-popper__arrow-outer, .v-popper__arrow-inner {
        @apply border-slate-300;
    }
}
</style>
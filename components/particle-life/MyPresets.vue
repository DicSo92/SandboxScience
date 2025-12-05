<template>
    <div mt-4>
        <div flex justify-between>
            <p underline text-gray-300 class="-mt-0.5" mb-2>Saved Presets :</p>
            <button type="button" @click="matchPresetCount = !matchPresetCount" text-xs btn px-2 rounded-full flex justify-center items-center
                    :class="matchPresetCount ? 'bg-red-800/80 hover:bg-red-800/60' : 'bg-slate-700/80 hover:bg-slate-700/50'">
                <span i-tabler-lock mr-1></span>
                Species
            </button>
        </div>


        <div v-if="Object.keys(particleLife.savedPresets).length > 0" mb-3>
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

        <div v-if="Object.keys(particleLife.savedPresets).length === 0" text-sm text-gray-400 italic>
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
                                <button type="button" @click="copyToClipboard(getPresetByID(id))" text-sm text-slate-100 class="rounded-t hover:bg-slate-500/50 px-4 py-2">
                                    <span i-tabler-copy></span>
                                    Copy JSON
                                </button>
                                <button type="button" @click="download(getPresetByID(id))" text-sm text-slate-100 class="hover:bg-slate-500/50 px-4 py-2">
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
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { usePresetUtils } from "~/composables/usePresetUtils";
import type { Preset } from "~/composables/usePresetUtils";

export default defineComponent({
    name: 'SaveOptions',
    props: {
        store: {
            type: Object,
            required: true
        }
    },
    setup(props, {emit}) {
        const particleLife = props.store

        const { success, error } = useToasts()
        const { getSavedPresets, getPresetByID, copyToClipboard, download, removePreset, hexListToFlatRgba, clone2D } = usePresetUtils(particleLife)

        const activeTypeFilters = ref<string[]>([])
        const matchPresetCount = ref<boolean>(false)

        const PRESET_TYPE_META: { id: string; label: string; color: string; icon?: string }[] = [
            {id: "forces", label: "Forces", color: "bg-sky-700/60", icon: "i-tabler-arrows-random"},
            {id: "radii", label: "Radii", color: "bg-purple-700/60", icon: "i-tabler-circles"},
            {id: "colors", label: "Colors", color: "bg-amber-700/60", icon: "i-tabler-palette"},
            {id: "settings", label: "Settings", color: "bg-emerald-700/60", icon: "i-tabler-adjustments"},
        ]

        onMounted(() => {
            getSavedPresets()
        })

        const filteredPresets = computed(() => {
            const filters = activeTypeFilters.value
            if (filters.length === 0) return particleLife.savedPresets

            const savedPresets = particleLife.savedPresets as Record<string, Preset>
            const result: Record<string, Preset> = {}
            for (const [id, preset] of Object.entries(savedPresets) as [string, Preset][]) {
                const matchesAll = filters.every(t => preset.types.includes(t))
                if (matchesAll) {
                    result[id] = preset
                }
            }
            return result
        })
        const toggleTypeFilter = (typeId: string) => {
            const idx = activeTypeFilters.value.indexOf(typeId)
            if (idx === -1) {
                activeTypeFilters.value.push(typeId)
            } else {
                activeTypeFilters.value.splice(idx, 1)
            }
        }
        const loadPreset = (id: string) => {
            const preset: Preset | undefined = getPresetByID(id)
            if (!preset) return

            const options: {
                presetRules?: number[][],
                presetMinRadius?: number[][],
                presetMaxRadius?: number[][],
                presetColors?: Float32Array
            } = {}
            if (preset.colors) {
                options.presetColors = hexListToFlatRgba(preset.colors)
            }
            if (preset.matrices) {
                if (preset.matrices.forces) {
                    options.presetRules = clone2D(preset.matrices.forces)
                }
                if (preset.matrices.minRadius && preset.matrices.maxRadius) {
                    options.presetMinRadius = clone2D(preset.matrices.minRadius)
                    options.presetMaxRadius = clone2D(preset.matrices.maxRadius)
                }
            }
            let presetTypeCount: number = particleLife.numColors
            if (options.presetRules && options.presetRules.length > 0) {
                presetTypeCount = options.presetRules.length
            } else if (options.presetMinRadius && options.presetMinRadius.length > 0) {
                presetTypeCount = options.presetMinRadius.length
            } else if (options.presetMaxRadius && options.presetMaxRadius.length > 0) {
                presetTypeCount = options.presetMaxRadius.length
            } else if (options.presetColors && options.presetColors.length > 0 && options.presetColors.length % 4 === 0) {
                presetTypeCount = options.presetColors.length / 4
            }

            emit("loadPreset", options, presetTypeCount, matchPresetCount.value)
            success("Preset loaded.")
        }

        return {
            particleLife, PRESET_TYPE_META,
            activeTypeFilters, filteredPresets, matchPresetCount,
            toggleTypeFilter, getPresetByID, copyToClipboard, download, removePreset, loadPreset,
        }
    }
})
</script>

<style scoped>

</style>
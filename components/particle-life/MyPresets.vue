<template>
    <div>
        <div mb-2.5 flex items-end justify-between pt-0.5>
            <button
                type="button" aria-label="+New Preset" btn flex items-center justify-center rounded-lg py-1 pl-2.5 pr-3.5 transition transition-duration-75 bg="cyan-800/80 hover:cyan-600/60"
                class="border border-cyan-600/80 text-sm font-500 shadow-sm hover:border-cyan-500/80 hover:shadow-cyan-900/40" @click="particleLife.isSaveModalOpen = true"
            >
                <span i-tabler-plus mr-1.5 text-base />
                New Preset
            </button>

            <div flex items-center>
                <TooltipInfo
                    container="#mainContainer" tag="div" mr-0.5
                    tooltip="Choose how presets affect the species count:<br><small>
                             <u>Keep:</u> Keeps your current number of species.<br>
                             <u>Align:</u> Match the number of species defined by the preset.</small>"
                />

                <!--                <button type="button" @click="matchPresetCount = !matchPresetCount" text-xs btn px-2 rounded-full flex justify-center items-center -->
                <!--                        :class="!matchPresetCount ? 'bg-red-800/80 hover:bg-red-800/60' : 'bg-slate-700/80 hover:bg-slate-700/50'"> -->
                <!--                    <span mr-1 :class="!matchPresetCount ? 'i-tabler-lock' : 'i-tabler-lock-open'"></span> -->
                <!--                    {{ !matchPresetCount ? 'Keep' : 'Align' }} Species -->
                <!--                </button> -->
                <div class="inline-flex items-center border border-slate-700/80 rounded-full bg-slate-900/70 p-0.5 text-xs" :class="!hasPresets && 'opacity-60 cursor-not-allowed'">
                    <button
                        type="button" title="Keep Species" aria-label="Keep Species" :disabled="!hasPresets" class="flex items-center gap-1 rounded-full px-2 py-0.5 transition-colors transition-duration-75 disabled:pointer-events-none"
                        :class="[!matchPresetCount ? 'bg-slate-700/70 text-slate-50' : 'bg-transparent text-slate-300 hover:text-slate-100']"
                        @click="hasPresets && (matchPresetCount = false)"
                    >
                        <span i-tabler-lock text-xs :class="!matchPresetCount ? 'text-emerald-300/90' : 'text-emerald-300/70'" />
                        Keep
                    </button>
                    <button
                        type="button" title="Align Species" aria-label="Align Species" :disabled="!hasPresets" class="flex items-center gap-1 rounded-full px-2 py-0.5 transition-colors transition-duration-75 disabled:pointer-events-none"
                        :class="[matchPresetCount ? 'bg-slate-700/70 text-slate-50' : 'bg-transparent text-slate-300 hover:text-slate-100']"
                        @click="hasPresets && (matchPresetCount = true)"
                    >
                        <span i-tabler-lock-open text-xs :class="matchPresetCount ? 'text-violet-300/90' : 'text-violet-300/70'" />
                        Align
                    </button>
                </div>
            </div>
        </div>

        <div v-if="hasPresets" flex items-end justify-between>
            <span text-sm text-gray-400 underline>Filters:</span>

            <div flex items-center gap-1 text-xs>
                <button
                    v-for="meta in PRESET_TYPE_META" :key="meta.id" type="button" :aria-label="`${meta.label} Filter`"
                    class="text-2xs inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-500"
                    :class="activeTypeFilters.includes(meta.id) ? meta.color : 'bg-slate-700/50 hover:bg-slate-700/75 text-gray-300'"
                    @click="toggleTypeFilter(meta.id)"
                >
                    <span v-if="meta.icon" :class="meta.icon" text-sm />
                    {{ meta.label }}
                </button>
            </div>
        </div>

        <hr mb-2 mt-1 border-gray-500>

        <div v-if="!hasPresets" class="border border-slate-600/60 rounded-md bg-slate-800/40 px-3 py-3 text-center text-sm text-slate-300/80">
            <p class="text-slate-200/90 font-medium">
                No presets saved
            </p>
            <p class="mt-0.5 text-xs text-slate-400">
                Click on <span class="text-cyan-300 font-medium">+New Preset</span> to save your current setup
            </p>
        </div>

        <div
            v-else-if="Object.keys(filteredPresets).length === 0 && activeTypeFilters.length > 0"
            class="border border-slate-600/60 rounded-md bg-slate-800/40 px-3 py-3 text-center text-sm text-slate-300/80"
        >
            <p class="text-slate-200/90 font-medium">
                No presets match your filters
            </p>
            <p class="mt-0.5 text-xs text-slate-400">
                Try removing one or more filters to see more presets
            </p>
        </div>

        <div v-else ref="presetListRef" flex flex-col gap-1.5 overflow-y-auto pr-1 class="thin-scrollbar max-h-[39vh] -mr-1">
            <div
                v-for="(preset, id) in filteredPresets" :key="id" flex
                shrink-0 cursor-pointer items-stretch overflow-hidden rounded-lg class="border bg-slate-700/30 hover:bg-slate-600/30"
                :class="pendingPresetId === id ? 'border-emerald-600/50' : 'border-slate-700/60'" @click="requestLoadPreset(id)"
            >
                <div shrink-0 self-stretch overflow-hidden transition-all duration-250 ease-out :class="pendingPresetId === id ? 'max-w-15' : 'max-w-0'">
                    <button
                        type="button" aria-label="Confirm load" class="h-full w-15 flex flex-col items-center justify-center whitespace-nowrap bg-emerald-700/90 text-emerald-100 transition-opacity duration-200"
                        :class="confirmReady ? 'hover:bg-emerald-600 cursor-pointer opacity-100' : 'opacity-50 cursor-not-allowed'"
                        @click.stop="confirmLoadPreset(id)"
                    >
                        <span i-tabler-check text-base />
                        <span text-xs font-semibold>Load</span>
                    </button>
                </div>

                <div w-full flex shrink-0 items-center py-2 pl-3>
                    <div min-w-0 flex-1 pr-2>
                        <p truncate text-sm text-slate-200 font-bold capitalize>
                            {{ preset.meta.name }}
                        </p>
                        <p text-xs text-slate-400>
                            {{ getPresetSpeciesCount(preset) }} species
                        </p>
                    </div>
                    <div flex shrink-0 items-center self-stretch>
                        <div flex gap-1>
                            <span
                                v-for="meta in PRESET_TYPE_META" :key="meta.id"
                                class="text-2xs inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-slate-50 font-500"
                                :class="preset.types.includes(meta.id) ? meta.color : 'bg-slate-600/40 opacity-60'"
                            >
                                <span v-if="meta.icon" :class="meta.icon" text-sm />
                            </span>
                        </div>
                        <div ml-2 h-5 w-px bg-slate-700 />

                        <VDropdown placement="right-start" popper-class="dropdownPresetOptions" :arrow-padding="10" instant-move self-stretch @click.stop>
                            <div h-full flex items-center pl-2 pr-2.5 text-slate-300 class="hover:text-slate-100">
                                <button type="button" title="Preset Options" aria-label="Preset Options" i-tabler-dots-vertical text-center text-lg />
                            </div>

                            <template #popper>
                                <div flex flex-col class="rounded-md bg-slate-800/70 shadow-md backdrop-blur-sm">
                                    <button
                                        type="button" aria-label="Copy preset JSON"
                                        class="rounded-t px-4 py-2 hover:bg-slate-500/50"
                                        text-sm text-slate-100 @click="copyToClipboard(getPresetByID(id))"
                                    >
                                        Copy JSON
                                    </button>
                                    <button
                                        type="button" aria-label="Download preset JSON"
                                        class="px-4 py-2 hover:bg-slate-500/50"
                                        text-sm text-slate-100 @click="download(getPresetByID(id))"
                                    >
                                        Download JSON
                                    </button>
                                    <hr>
                                    <button
                                        type="button" aria-label="Delete preset"
                                        class="rounded-b bg-red-700/30 px-4 py-2 hover:bg-red-700/60"
                                        text-sm text-slate-100 @click="removePreset(id)"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </template>
                        </VDropdown>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import type { Preset } from "~/composables/usePresetManager"
import { onClickOutside } from "@vueuse/core"
import { Dropdown } from 'floating-vue'
import { defineComponent } from "vue"
import { usePresetManager } from "~/composables/usePresetManager"
import { float32ArrayToHsl } from "~/helpers/utils/colorsGenerator"

export default defineComponent({
    name: 'MyPresets',
    components: {
        VDropdown: Dropdown,
    },
    props: {
        store: {
            type: Object,
            required: true,
        },
    },
    emits: ['loadPreset'],
    setup(props, { emit }) {
        const particleLife = props.store

        const { getSavedPresets, getPresetByID, copyToClipboard, download, removePreset, hexListToFlatRgba, clone2D } = usePresetManager(particleLife)

        const activeTypeFilters = ref<string[]>([])
        const matchPresetCount = ref<boolean>(true)

        const PRESET_TYPE_META: { id: string, label: string, color: string, icon?: string }[] = [
            { id: "forces", label: "Forces", color: "bg-sky-700/60 hover:bg-sky-700/75", icon: "i-tabler-arrows-random" },
            { id: "radii", label: "Radii", color: "bg-purple-700/60 hover:bg-purple-700/75", icon: "i-tabler-circles" },
            { id: "colors", label: "Colors", color: "bg-amber-700/60 hover:bg-amber-700/75", icon: "i-tabler-palette" },
            { id: "settings", label: "Settings", color: "bg-emerald-700/60 hover:bg-emerald-700/75", icon: "i-tabler-adjustments" },
        ]

        onMounted(() => getSavedPresets())

        const hasPresets = computed(() => Object.keys(particleLife.savedPresets).length > 0)

        const filteredPresets = computed<Record<string, Preset>>(() => {
            const filters = activeTypeFilters.value
            if (filters.length === 0)
                return particleLife.savedPresets

            const getTypeIndex = (type: string) => PRESET_TYPE_META.findIndex(m => m.id === type)

            const presets = Object.entries(particleLife.savedPresets) as [string, Preset][]

            return Object.fromEntries(presets
                .filter(([_, preset]) => filters.every(f => preset.types.includes(f)))
                .sort(([idA, a], [idB, b]) => {
                    const scoreA = a.types.length - filters.length
                    const scoreB = b.types.length - filters.length

                    if (scoreA !== scoreB)
                        return scoreA - scoreB

                    for (let i = 0; i < Math.max(a.types.length, b.types.length); i++) {
                        const indexA = getTypeIndex(a.types[i] ?? '')
                        const indexB = getTypeIndex(b.types[i] ?? '')
                        if (indexA !== indexB)
                            return indexA - indexB
                    }

                    return idA.localeCompare(idB) // Sort by ID to ensure consistent order
                }),
            )
        })
        // -------------------------------------------------------------------------------------------------------------
        const getPresetSpeciesCount = (preset: Preset): number | undefined => {
            let typeCount: number | undefined
            if (preset.matrices) {
                if (preset.matrices.forces && preset.matrices.forces.length > 0) {
                    typeCount = preset.matrices.forces.length
                }
                else if (preset.matrices.minRadius && preset.matrices.minRadius.length > 0) {
                    typeCount = preset.matrices.minRadius.length
                }
                else if (preset.matrices.maxRadius && preset.matrices.maxRadius.length > 0) {
                    typeCount = preset.matrices.maxRadius.length
                }
            }
            else if (preset.colors && preset.colors.length > 0) {
                typeCount = preset.colors.length
            }
            return typeCount
        }
        const toggleTypeFilter = (typeId: string) => {
            const idx = activeTypeFilters.value.indexOf(typeId)
            if (idx === -1) {
                activeTypeFilters.value.push(typeId)
            }
            else {
                activeTypeFilters.value.splice(idx, 1)
            }
        }
        const loadPreset = (id: string) => {
            const preset: Preset | undefined = getPresetByID(id)
            if (!preset)
                return

            const presetTypeCount = getPresetSpeciesCount(preset) || particleLife.numColors

            const options: {
                presetRules?: number[][]
                presetMinRadius?: number[][]
                presetMaxRadius?: number[][]
                presetColors?: Float32Array | number[][]
            } = {}
            if (preset.colors) {
                if (particleLife.engineType === "CPU") { // CPU
                    options.presetColors = float32ArrayToHsl(hexListToFlatRgba(preset.colors))
                }
                else { // GPU
                    options.presetColors = hexListToFlatRgba(preset.colors)
                }
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

            emit("loadPreset", options, presetTypeCount, matchPresetCount.value)
        }
        // -------------------------------------------------------------------------------------------------------------
        const presetListRef = ref<HTMLElement | null>(null)
        const pendingPresetId = ref<string | null>(null)
        const confirmReady = ref(false)

        let autoCloseTimer: ReturnType<typeof setTimeout> | null = null
        let stopClickOutside: (() => void) | null = null
        const startClickOutside = () => {
            if (stopClickOutside)
                return
            stopClickOutside = onClickOutside(presetListRef, () => {
                closeConfirmLoad()
            })
        }
        const requestLoadPreset = (id: string) => {
            if (pendingPresetId.value === id) {
                closeConfirmLoad()
                return
            }
            confirmReady.value = false
            pendingPresetId.value = id
            startClickOutside()

            if (autoCloseTimer)
                clearTimeout(autoCloseTimer)
            autoCloseTimer = setTimeout(() => closeConfirmLoad(), 4000)

            setTimeout(() => {
                if (pendingPresetId.value === id) {
                    confirmReady.value = true
                }
            }, 500)
        }
        const confirmLoadPreset = (id: string) => {
            if (!confirmReady.value)
                return
            closeConfirmLoad()
            loadPreset(id)
        }
        const closeConfirmLoad = () => {
            pendingPresetId.value = null
            confirmReady.value = false
            stopClickOutside?.()
            stopClickOutside = null
            if (autoCloseTimer) {
                clearTimeout(autoCloseTimer)
                autoCloseTimer = null
            }
        }

        onUnmounted(() => closeConfirmLoad())
        // -------------------------------------------------------------------------------------------------------------
        return {
            particleLife,
            PRESET_TYPE_META,
            activeTypeFilters,
            filteredPresets,
            matchPresetCount,
            hasPresets,
            pendingPresetId,
            confirmReady,
            presetListRef,
            requestLoadPreset,
            confirmLoadPreset,
            closeConfirmLoad,
            getPresetSpeciesCount,
            toggleTypeFilter,
            getPresetByID,
            copyToClipboard,
            download,
            removePreset,
            loadPreset,
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

<template>
    <Modal :modal-active="particleLife.isSaveModalOpen" overlay-color="bg-gray-950/25" modal-class="max-w-[880px]" @close="closeModal">
        <section>
            <header class="-mt-2 sm:-mt-4" mb-3>
                <div mb-3 flex items-center class="text-2xl font-bold sm:text-[1.75rem]">
                    <span i-tabler-sparkles mr-3 text-amber-600 />
                    <h1 flex items-center>
                        Preset Manager
                    </h1>
                </div>
            </header>

            <div mb-4 h-px w-full class="bg-slate-700/80" />

            <div class="flex flex-col gap-2 md:flex-row">
                <div class="pr-0 md:w-6/12 md:pr-3">
                    <div mb-3 flex items-center>
                        <span i-carbon-save mr-2 text-2xl class="text-gray-400/80" />
                        <h2 pt-px text-xl>
                            Save New Preset
                        </h2>
                    </div>
                    <div mb-2>
                        <p class="mb-1 text-2sm text-gray-200">
                            Preset Name
                        </p>
                        <input
                            v-model="name" type="text" maxlength="32" placeholder="Enter a name for this preset..."
                            class="w-full border border-gray-600 rounded bg-slate-900/70 px-3 py-2 text-sm text-slate-200 font-500"
                        >
                    </div>
                    <div>
                        <p class="mb-1 text-2sm text-gray-200">
                            Description (Optional)
                        </p>
                        <textarea
                            v-model="description" maxlength="180" placeholder="Describe what this preset does..." h-15 max-h-30 min-h-9
                            class="w-full resize-y overflow-auto border border-gray-600 rounded bg-slate-900/70 px-3 py-2 text-sm text-slate-200 font-500 leading-5"
                        />
                    </div>
                    <hr my-2 border-gray-500>
                    <p class="-mt-0.5" mb-2 text-gray-200>
                        Components to include
                        <TooltipInfo
                            container="#mainContainer" tag="div"
                            tooltip="Choose what to include in this preset. <br>
                                            Forces: interaction matrix between color pairs. <br>
                                            Radii: min/max radius matrices between color pairs. <br>
                                            Colors: particle colors. <br>
                                            Settings: global simulation parameters."
                        />
                        :
                    </p>
                    <div flex flex-wrap gap-2>
                        <ToggleChip
                            v-model="forceMatrix"
                            label="Forces"
                            icon="i-tabler-arrows-random text-sky-600/80"
                            active-class="border-sky-600/80 bg-sky-600/20 hover:bg-sky-600/30 text-sky-100"
                            inactive-class="border-slate-600 bg-slate-800/80 hover:bg-slate-900/50 text-slate-300"
                        />
                        <ToggleChip
                            v-model="radiusMatrices"
                            label="Radii"
                            icon="i-tabler-circles text-purple-600/80"
                            active-class="border-purple-600/80 bg-purple-700/20 hover:bg-purple-700/30 text-purple-100"
                            inactive-class="border-slate-600 bg-slate-800/80 hover:bg-slate-900/50 text-slate-300"
                        />
                        <ToggleChip
                            v-model="colors"
                            label="Colors"
                            icon="i-tabler-palette text-amber-600/80"
                            active-class="border-amber-600/80 bg-amber-700/20 hover:bg-amber-700/30 text-amber-100"
                            inactive-class="border-slate-600 bg-slate-800/80 hover:bg-slate-900/50 text-slate-300"
                        />
                        <ToggleChip
                            v-model="generalSettings"
                            label="Settings"
                            icon="i-tabler-settings text-emerald-600/80"
                            active-class="border-emerald-600/80 bg-emerald-700/20 hover:bg-emerald-700/30 text-emerald-100"
                            inactive-class="border-slate-600 bg-slate-800/80 hover:bg-slate-900/50 text-slate-300"
                            disabled
                        />
                    </div>
                    <div mt-4 flex items-center justify-end gap-3>
                        <div flex flex-1 items-center justify-around>
                            <button type="button" :disabled="!canSave" flex items-center px-2 text-sm text="slate-300 hover:slate-300/80 disabled:slate-300/40" class="disabled:cursor-not-allowed" @click="copyToClipboard(buildPresetData())">
                                <span i-tabler-copy mr-1 />
                                Copy
                            </button>
                            <div h-6 w-px bg-gray-600 />
                            <button type="button" :disabled="!canSave" flex items-center px-2 text-sm text="slate-300 hover:slate-300/80 disabled:slate-300/40" class="disabled:cursor-not-allowed" @click="download(buildPresetData())">
                                <span i-tabler-download mr-1 />
                                Download
                            </button>
                        </div>

                        <button
                            type="button" :disabled="!canSave" btn flex items-center justify-center whitespace-nowrap rounded-lg py-1 pl-2.5 pr-3.5 transition transition-duration-75 class="border border-cyan-600/80 text-sm font-500 shadow-sm disabled:cursor-not-allowed hover:border-cyan-500/80 hover:shadow-cyan-900/40 disabled:hover:border-cyan-600/80"
                            bg="cyan-800/80 hover:cyan-600/60 disabled:cyan-800/80"
                            @click="savePreset"
                        >
                            <span i-carbon-save mr-1.5 text-base />
                            Save Preset
                        </button>
                    </div>
                </div>

                <div class="hidden w-px bg-slate-700/80 md:block" />

                <div class="md:w-6/12 md:pl-3">
                    <div mb-3 flex items-center>
                        <span i-tabler-file-upload mr-2 text-2xl class="text-gray-400/80" />
                        <h2 pt-px text-xl>
                            Load From JSON
                        </h2>
                    </div>
                    <div flex flex-col gap-2>
                        <h3 text-base text-slate-400>
                            Upload a .json file exported from Particle Life or paste JSON data directly.
                        </h3>
                        <div flex flex-col gap-1>
                            <div class="w-full flex items-center">
                                <button type="button" btn w-full flex items-center justify-center border rounded-lg px-3 class="border-slate-600/80 bg-slate-800/80 text-slate-100 hover:bg-slate-700/60" @click="fileInput?.click()">
                                    <span i-tabler-file mr-1 text-base />
                                    Upload JSON File
                                </button>
                                <input ref="fileInput" type="file" accept="application/json,.json" class="hidden" @change="onJsonFileSelected">
                            </div>
                            <TransitionGroup name="fade-translate-y">
                                <div v-if="fileError" border rounded-lg px-2 py-1 text-xs text-red-600 class="border-red-700/60 bg-red-950/30">
                                    {{ fileError }}
                                </div>
                                <div v-if="fileWarning" border rounded-lg px-2 py-1 text-xs text-amber-600 class="border-amber-700/60 bg-amber-950/30">
                                    {{ fileWarning }}
                                </div>
                            </TransitionGroup>
                        </div>
                        <JsonEditor v-model="jsonText" v-model:internal-error="jsonSyntaxError" :external-errors="jsonValidationErrors" />

                        <Transition name="fade-translate-y">
                            <div v-if="jsonErrors?.length" class="border border-red-800/60 bg-red-950/40" rounded-md backdrop-blur-sm>
                                <div flex items-center gap-2 border-b px-3 py-1.5 class="border-red-800/50">
                                    <span i-tabler-alert-triangle-filled text-sm text-red-400 />
                                    <span text-xs text-red-200 font-semibold tracking-wide uppercase>
                                        {{ jsonErrors.length }} error{{ jsonErrors.length > 1 ? 's' : '' }} detected
                                    </span>
                                </div>

                                <TransitionGroup name="fade-translate-y" tag="div" class="divide-y divide-red-900/40" text-xs>
                                    <div v-for="(error, index) in jsonErrors" :key="index" class="px-3 pb-1.5 pt-2 hover:bg-red-900/10">
                                        <div class="flex items-start gap-1.5">
                                            <span mt-1 block h-1.5 w-1.5 rounded-full bg-red-500 />

                                            <div class="flex-1">
                                                <div class="flex flex-wrap items-center gap-1">
                                                    <span v-if="error.code" class="border border-red-700/60 rounded bg-red-900/60 px-1 py-px text-[0.6rem] text-red-200 tracking-wide uppercase">
                                                        {{ error.code }}
                                                    </span>
                                                    <span text-red-100 leading-snug>
                                                        {{ error.message }}
                                                    </span>
                                                </div>
                                                <div v-if="error.path" class="mt-0.5 break-all pl-0.5 text-[0.65rem] text-red-300/70 font-mono">
                                                    ↳ {{ error.path }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TransitionGroup>
                            </div>
                        </Transition>

                        <div flex items-center justify-between>
                            <span v-if="!hasJsonErrors && !isJsonEmpty" class="inline-flex items-center border border-emerald-700/70 rounded-full bg-emerald-900/40 px-1.5 py-0.5 text-[0.70rem] text-emerald-200 tracking-wide">
                                <span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                Ready to load
                            </span>
                            <span v-else />

                            <button
                                type="button" :disabled="hasJsonErrors || isJsonEmpty" btn flex items-center justify-center whitespace-nowrap rounded-lg py-1 pl-2.5 pr-3.5 transition transition-duration-75 class="border border-cyan-600/80 text-sm font-500 shadow-sm disabled:cursor-not-allowed hover:border-cyan-500/80 hover:shadow-cyan-900/40 disabled:hover:border-cyan-600/80"
                                bg="cyan-800/80 hover:cyan-600/60 disabled:cyan-800/80"
                                @click="loadFromJson"
                            >
                                <span i-tabler-file-upload mr-1.5 text-base />
                                Load Preset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </Modal>
</template>

<script lang="ts">
import type { Preset, PresetValidationError, PresetValidationResult } from "~/composables/usePresetManager"
import { defineComponent } from "vue"
import { usePresetManager } from "~/composables/usePresetManager"

export default defineComponent({
    name: 'SaveModal',
    props: {
        store: {
            type: Object,
            required: true,
        },
    },
    // eslint-disable-next-line unused-imports/no-unused-vars
    setup(props, { emit }) {
        const particleLife = props.store
        const { copyToClipboard, download, save, flatRgbaToHexList, hslArrayToHexList, clone2D, validatePreset } = usePresetManager(particleLife)

        const name = ref<string>("")
        const description = ref<string>("")
        const forceMatrix = ref<boolean>(false)
        const radiusMatrices = ref<boolean>(false)
        const colors = ref<boolean>(false)
        const generalSettings = ref<boolean>(false)

        const canSave = computed(() => {
            return forceMatrix.value || radiusMatrices.value || colors.value || generalSettings.value
        })

        const closeModal = () => {
            particleLife.isSaveModalOpen = false
        }
        // -------------------------------------------------------------------------------------------------------------
        // --- Preset management ---------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const buildPresetData = (): Preset => {
            const presetData: Preset = {
                v: 1,
                meta: {
                    name: name.value.trim() || "Untitled Preset",
                    description: description.value.trim() || null,
                },
                types: [] as string[], // "settings", "forces", "radii", "colors"
            }

            // if (generalSettings.value) {
            //     presetData.settings = {
            //         species: particleLife.numColors,
            //         numParticles: particleLife.numParticles,
            //         frictionFactor: particleLife.frictionFactor,
            //         forceFactor: particleLife.forceFactor,
            //     }
            //     presetData.types.push("settings")
            // }

            if (forceMatrix.value || radiusMatrices.value) {
                presetData.matrices = { forces: [] }
                presetData.matrices.forces = clone2D(particleLife.rulesMatrix)
                presetData.types.push("forces")

                if (radiusMatrices.value) {
                    presetData.matrices.minRadius = clone2D(particleLife.minRadiusMatrix)
                    presetData.matrices.maxRadius = clone2D(particleLife.maxRadiusMatrix)
                    presetData.types.push("radii")
                }
            }

            if (colors.value) {
                if (particleLife.engineType === "CPU") { // CPU
                    presetData.colors = hslArrayToHexList(particleLife.currentColors)
                }
                else { // GPU
                    presetData.colors = flatRgbaToHexList(particleLife.currentColors)
                }
                presetData.types.push("colors")
            }

            return presetData
        }
        const savePreset = () => {
            if (!canSave.value)
                return
            save(buildPresetData())
            closeModal()
            resetFields()
        }
        const resetFields = () => {
            name.value = ""
            description.value = ""
            forceMatrix.value = false
            radiusMatrices.value = false
            colors.value = false
            generalSettings.value = false
            jsonText.value = ""
        }
        // -------------------------------------------------------------------------------------------------------------
        // --- JSON Editor ---------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        const jsonText = ref<string>("")
        const jsonSyntaxError = ref<string | null>(null)
        const jsonValidationErrors = ref<PresetValidationError[] | null>(null)

        const isJsonEmpty = computed(() => !jsonText.value.trim())
        const hasJsonErrors = computed(() => !!jsonSyntaxError.value || !!jsonValidationErrors.value?.length)
        const jsonErrors = computed<PresetValidationError[]>(() => {
            const errors: PresetValidationError[] = []
            if (jsonSyntaxError.value) {
                errors.push({
                    message: jsonSyntaxError.value,
                    code: "JSON_SYNTAX_ERROR",
                })
            }
            if (jsonValidationErrors.value && jsonValidationErrors.value.length > 0) {
                errors.push(...jsonValidationErrors.value)
            }
            return errors
        })

        // onMounted(async () => {
        //     jsonText.value = JSON.stringify(buildPresetData(), null, 2);
        // })

        const loadFromJson = () => {
            if (hasJsonErrors.value || isJsonEmpty.value)
                return
            const data = JSON.parse(jsonText.value) as Preset
            save(data)
            closeModal()
            resetFields()
        }

        const fileInput = ref<HTMLInputElement | null>(null)
        const fileWarning = ref<string | null>(null)
        const fileError = ref<string | null>(null)
        const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1 MB
        const JSON_MIME_TYPES = ["application/json", "text/json", "application/ld+json"]

        const onJsonFileSelected = (event: Event) => {
            const target = event.target as HTMLInputElement
            const file = target.files?.[0]
            if (!file)
                return

            fileError.value = null
            fileWarning.value = null

            if (file.size > MAX_FILE_SIZE) {
                fileError.value = "The file is too large (max 1 MB)."
                target.value = ""
                return
            }
            const hasJsonExtension = /\.json$/i.test(file.name)
            const hasJsonMime = file.type && JSON_MIME_TYPES.includes(file.type)
            if (!hasJsonExtension && !hasJsonMime) {
                fileError.value = "Only .json files are accepted."
                target.value = ""
                return
            }

            const reader = new FileReader()
            reader.onload = () => {
                try {
                    const text = String(reader.result || "")
                    const parsed = JSON.parse(text)

                    jsonSyntaxError.value = null

                    const result = validatePreset(parsed) as PresetValidationResult
                    if (!result.valid) {
                        jsonValidationErrors.value = result.errors
                        fileWarning.value = "The JSON file is invalid for a Particle Life preset."
                    }
                    else {
                        jsonValidationErrors.value = null
                        fileWarning.value = null
                    }

                    jsonText.value = text
                    fileError.value = null
                }
                // eslint-disable-next-line unused-imports/no-unused-vars
                catch (e: any) {
                    // fileError.value = e?.message ?? "Error parsing JSON file"
                    fileWarning.value = "The JSON file contains errors. Please review and correct them."
                    jsonText.value = String(reader.result || "")
                }
                finally {
                    target.value = ""
                }
            }
            reader.onerror = () => {
                console.log("Error reading JSON file:", reader.error)
                fileError.value = "Unable to read the JSON file."
                target.value = ""
            }
            reader.readAsText(file, "utf-8")
        }
        // -------------------------------------------------------------------------------------------------------------
        // --- Watchers ------------------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
        watch(forceMatrix, (newVal) => {
            if (!newVal)
                radiusMatrices.value = false
        })
        watch(radiusMatrices, (newVal) => {
            if (newVal)
                forceMatrix.value = true
        })
        watch(hasJsonErrors, (newVal) => {
            if (!newVal)
                fileWarning.value = null
        })
        watch(jsonText, (newVal) => {
            jsonSyntaxError.value = null
            jsonValidationErrors.value = null

            if (!newVal.trim())
                return

            try {
                const parsed = JSON.parse(newVal)
                const result = validatePreset(parsed) as PresetValidationResult
                jsonValidationErrors.value = !result.valid ? result.errors : null
            }
            catch (e: any) {
                jsonSyntaxError.value = e?.message ?? "Invalid JSON."
                jsonValidationErrors.value = null
            }
        })

        return {
            particleLife,
            closeModal,
            name,
            description,
            forceMatrix,
            radiusMatrices,
            colors,
            generalSettings,
            canSave,
            buildPresetData,
            copyToClipboard,
            download,
            loadFromJson,
            onJsonFileSelected,
            savePreset,
            fileInput,
            jsonText,
            jsonSyntaxError,
            jsonValidationErrors,
            isJsonEmpty,
            hasJsonErrors,
            jsonErrors,
            fileError,
            fileWarning,
        }
    },
})
</script>

<style scoped>
.fade-translate-y-enter-active,
.fade-translate-y-leave-active {
    transition: opacity 0.15s ease-out, transform 0.15s ease-out;
}
.fade-translate-y-enter-from,
.fade-translate-y-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}
.fade-translate-y-enter-to,
.fade-translate-y-leave-from {
    opacity: 1;
    transform: translateY(0);
}
</style>

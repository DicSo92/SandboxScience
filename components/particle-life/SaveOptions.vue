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
            <button type="button" @click="copyToClipboard(buildPresetData())" :disabled="!canSave" btn px-3 rounded-full flex justify-center items-center bg="slate-800/80 hover:slate-800/50 disabled:slate-800/30" class="disabled:cursor-not-allowed">
                <span i-tabler-copy mr-1></span>
                Copy
            </button>
            <button type="button" @click="download(buildPresetData())" :disabled="!canSave" btn px-3 rounded-full flex justify-center items-center bg="slate-800/80 hover:slate-800/50 disabled:slate-800/30" class="disabled:cursor-not-allowed">
                <span i-tabler-download mr-1></span>
                Download
            </button>
            <button type="button" @click="save(buildPresetData())" :disabled="!canSave" btn px-3 rounded-full flex justify-center items-center bg="cyan-900/80 hover:cyan-900/50 disabled:cyan-900/30" class="disabled:cursor-not-allowed">
                <span i-carbon-save mr-1></span>
                Save
            </button>
        </div>
    </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { hideAllPoppers } from 'floating-vue'
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
    setup(props, { emit }) {
        const particleLife = props.store
        const { copyToClipboard, download, save, flatRgbaToHexList, clone2D } = usePresetUtils(particleLife)

        const name = ref<string>("")
        const description = ref<string>("")
        const forceMatrix = ref<boolean>(false)
        const radiusMatrices = ref<boolean>(false)
        const colors = ref<boolean>(false)
        const generalSettings = ref<boolean>(false)

        const canSave = computed(() => {
            return forceMatrix.value || radiusMatrices.value || colors.value || generalSettings.value || name.value.trim().length > 0
        })
        // -------------------------------------------------------------------------------------------------------------
        // --- Preset management ---------------------------------------------------------------------------------------
        // -------------------------------------------------------------------------------------------------------------
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
            canSave, buildPresetData, copyToClipboard, download, save,
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
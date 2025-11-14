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
        <div flex gap-2 justify-end mt-2>
            <button type="button" :disabled="!canSave" btn px-3 rounded-full flex justify-center items-center bg="slate-800/80 hover:slate-800/50 disabled:slate-800/30" class="disabled:cursor-not-allowed">
                <span i-tabler-copy></span>
                Copy
            </button>
            <button type="button" @click="save" :disabled="!canSave" btn px-3 rounded-full flex justify-center items-center bg="cyan-900/80 hover:cyan-900/50 disabled:cyan-900/30" class="disabled:cursor-not-allowed">
                <span i-carbon-save mr-1></span>
                Save
            </button>
        </div>
    </section>
</template>

<script lang="ts">
import {defineComponent} from "vue";

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

        const name = ref<string>("")
        const description = ref<string>("")
        const forceMatrix = ref<boolean>(false)
        const radiusMatrices = ref<boolean>(false)
        const colors = ref<boolean>(false)
        const generalSettings = ref<boolean>(false)

        const canSave = computed(() => {
            return forceMatrix.value || radiusMatrices.value || colors.value || generalSettings.value || name.value.trim().length > 0
        })

        const save = () => {
            const presetData: any = {
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
                presetData.matrices = {}
                // presetData.matrices = { size: particleLife.numColors }

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

            // IndexedDB or localStorage saving logic goes here
            console.log("Saving preset:", presetData)
        }

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
        const hexListToFlatRgba = (hexList: string[]): number[] => {
            const flat: number[] = []

            for (const hex of hexList) {
                const clean = hex.replace("#", "").trim()
                const full = clean.length === 3
                    ? clean.split("").map(c => c + c).join("") // ex: f0a → ff00aa
                    : clean

                const r = parseInt(full.substring(0, 2), 16) / 255
                const g = parseInt(full.substring(2, 4), 16) / 255
                const b = parseInt(full.substring(4, 6), 16) / 255

                flat.push(r, g, b, 1)
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
        const clone2D = (m: number[][]) => m.map(row => [...row])
        const clone1D = <T>(arr: T[]) => [...arr]

        watch(forceMatrix, (newVal) => {
            if (!newVal) radiusMatrices.value = false
        })
        watch(radiusMatrices, (newVal) => {
            if (newVal) forceMatrix.value = true
        })

        return {
            name, description,
            forceMatrix, radiusMatrices, colors, generalSettings,
            canSave, save
        }
    },
})
</script>

<style scoped>

</style>
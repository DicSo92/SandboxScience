<template>
    <section mx-auto>
        <div class="flex rounded-[0.625rem] bg-slate-700/80 p-0.75 shadow-md space-x-1">
            <button key="tab-1" :class="openTab === 1 ? 'bg-slate-900/80' : 'hover:bg-slate-800/80'" class="focus:shadow-outline-blue flex-1 rounded-lg py-1 pl-1 text-sm transition-all duration-100 focus:outline-none" @click="openTab = 1">
                Official Presets
                <TooltipInfo
                    container="#mainContainer" tag="div"
                    tooltip="Displays a grid representing interaction forces between color pairs. <br>
                             Click on a cell to adjust the force value for the interaction between the two colors it represents."
                />
            </button>
            <button key="tab-2" :class="openTab === 2 ? 'bg-slate-900/80' : 'hover:bg-slate-800/80'" class="focus:shadow-outline-blue flex-1 rounded-lg py-1 pl-1 text-sm transition-all duration-100 focus:outline-none" @click="openTab = 2">
                My Presets
                <TooltipInfo
                    container="#mainContainer" tag="div"
                    tooltip="Displays a grid representing the minimum interaction radius for color pairs. <br>
                             Click on a cell to set the minimum distance at which particles of the two colors will start to interact."
                />
            </button>
        </div>

        <div mt-2>
            <!--------------------------------------------------------------------------------------------------------->
            <div v-if="openTab === 1">
                <div>
                    <div class="mb-1 flex items-center text-2sm">
                        <div class="text-md i-tabler-palette text-emerald-500" />
                        <span mx-1>Color Scheme</span>
                        <TooltipInfo container="#mainContainer" tooltip="Choose from static or generative color palette generators. <br> <b>Static</b> palettes are fixed, while <b>generative</b> ones produce new themed variations each time." />
                    </div>
                    <div flex gap-2>
                        <SelectInput v-model="particleLife.selectedColorPaletteOption" class="w-8/12" :options="paletteOptions" @change="updateColors" />
                        <div grid grid-cols-2 gap-1 class="w-4/12">
                            <button type="button" title="Reload palette" aria-label="Reload palette" btn flex items-center justify-center rounded-full px-3 bg="slate-800/80 hover:slate-800/50" @click="updateColors">
                                <span i-tabler-reload />
                            </button>
                            <button type="button" title="Random palette" aria-label="Random palette" btn flex items-center justify-center rounded-full px-3 bg="cyan-900/80 hover:cyan-900/50" @click="updateColors(true)">
                                <span i-game-icons-perspective-dice-six-faces-random />
                            </button>
                        </div>
                    </div>
                </div>
                <div mt-2>
                    <div class="mb-1 flex items-center text-2sm">
                        <div class="text-md i-tabler-grid-4x4 text-indigo-500" />
                        <span mx-1>Interaction Matrix</span>
                        <TooltipInfo container="#mainContainer" tooltip="Choose from different force matrix generators. <br> These are experimental and may produce unpredictable or unbalanced results." />
                    </div>
                    <div flex gap-2>
                        <SelectInput v-model="particleLife.selectedRulesOption" class="w-8/12" :options="rulesOptions" @change="updateRulesMatrix" />
                        <div grid grid-cols-2 gap-1 class="w-4/12">
                            <button type="button" title="Reload interaction matrix" aria-label="Reload interaction matrix" btn flex items-center justify-center rounded-full px-3 bg="slate-800/80 hover:slate-800/50" @click="updateRulesMatrix">
                                <span i-tabler-reload />
                            </button>
                            <button type="button" title="Random interaction matrix" aria-label="Random interaction matrix" btn flex items-center justify-center rounded-full px-3 bg="cyan-900/80 hover:cyan-900/50" @click="updateRulesMatrix(true)">
                                <span i-game-icons-perspective-dice-six-faces-random />
                            </button>
                        </div>
                    </div>
                </div>
                <div v-if="particleLife.engineType !== 'CPU'" mt-2>
                    <div class="mb-1 flex items-center text-2sm">
                        <div class="text-md i-tabler-spiral text-cyan-500" />
                        <span mx-1>Particle Distribution</span>
                        <TooltipInfo container="#mainContainer" tooltip="Choose from different particle distribution generators. <br> Each defines how particles are initially placed, affecting the simulation’s early motion and structure." />
                    </div>
                    <div flex gap-2>
                        <SelectInput v-model="particleLife.selectedSpawnPositionOption" class="w-8/12" :options="positionOptions" @change="updateParticlePositions" />
                        <div grid grid-cols-2 gap-1 class="w-4/12">
                            <button type="button" title="Reload particle distribution" aria-label="Reload particle distribution" btn flex items-center justify-center rounded-full px-3 bg="slate-800/80 hover:slate-800/50" @click="updateParticlePositions">
                                <span i-tabler-reload />
                            </button>
                            <button type="button" title="Random particle distribution" aria-label="Random particle distribution" btn flex items-center justify-center rounded-full px-3 bg="cyan-900/80 hover:cyan-900/50" @click="updateParticlePositions(true)">
                                <span i-game-icons-perspective-dice-six-faces-random />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <!--------------------------------------------------------------------------------------------------------->
            <div v-if="openTab === 2">
                <MyPresets :store="particleLife" @load-preset="loadPreset" />
            </div>
        </div>
    </section>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import MyPresets from "~/components/particle-life/MyPresets.vue"
import { PALETTE_OPTIONS } from "~/helpers/utils/colorsGenerator"
import { POSITION_OPTIONS } from "~/helpers/utils/positionsGenerator"
import { POSITION_OPTIONS as POSITION_OPTIONS_3D } from "~/helpers/utils/positionsGenerator3D"
import { RULES_OPTIONS } from '~/helpers/utils/rulesGenerator'

export default defineComponent({
    components: { MyPresets },
    props: {
        store: {
            type: Object,
            required: true,
        },
    },
    emits: ['loadPreset', 'updateColors', 'updateParticlePositions', 'updateRulesMatrix'],
    setup(props, { emit }) {
        const particleLife = props.store
        const rulesOptions = RULES_OPTIONS
        const paletteOptions = PALETTE_OPTIONS
        const positionOptions = particleLife.engineType === 'GPU3D' ? POSITION_OPTIONS_3D : POSITION_OPTIONS

        const openTab = ref<number>(1)

        const updateColors = async (useRandomGenerator: boolean | Event = false) => {
            emit('updateColors', useRandomGenerator)
        }
        const updateRulesMatrix = async (useRandomGenerator: boolean | Event = false) => {
            emit('updateRulesMatrix', useRandomGenerator)
        }
        const updateParticlePositions = async (useRandomGenerator: boolean | Event = false) => {
            emit('updateParticlePositions', useRandomGenerator)
        }
        const loadPreset = async (options: { presetRules?: number[][], presetMinRadius?: number[][], presetMaxRadius?: number[][], presetColors?: Float32Array | number[][] }, presetTypeCount: number, matchPresetCount: boolean) => {
            emit('loadPreset', options, presetTypeCount, matchPresetCount)
        }

        return {
            particleLife,
            openTab,
            rulesOptions,
            paletteOptions,
            positionOptions,
            updateColors,
            updateRulesMatrix,
            updateParticlePositions,
            loadPreset,
        }
    },
})
</script>

<style scoped>

</style>

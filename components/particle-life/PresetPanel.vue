<template>
    <section mx-auto>
        <div class="flex space-x-1 p-0.75 bg-slate-700/80 rounded-[0.625rem] shadow-md">
            <button key="tab-1" @click="openTab = 1" :class="openTab === 1 ? 'bg-slate-900/80' : 'hover:bg-slate-800/80'" class="pl-1 text-sm flex-1 py-1 rounded-lg focus:outline-none focus:shadow-outline-blue transition-all duration-100">
                Official Presets
                <TooltipInfo container="#mainContainer" tag="div"
                             tooltip="Displays a grid representing interaction forces between color pairs. <br>
                             Click on a cell to adjust the force value for the interaction between the two colors it represents.">
                </TooltipInfo>
            </button>
            <button key="tab-2" @click="openTab = 2" :class="openTab === 2 ? 'bg-slate-900/80' : 'hover:bg-slate-800/80'" class="pl-1 text-sm flex-1 py-1 rounded-lg focus:outline-none focus:shadow-outline-blue transition-all duration-100">
                My Presets
                <TooltipInfo container="#mainContainer" tag="div"
                             tooltip="Displays a grid representing the minimum interaction radius for color pairs. <br>
                             Click on a cell to set the minimum distance at which particles of the two colors will start to interact.">
                </TooltipInfo>
            </button>
        </div>

        <div mt-2>
            <!--------------------------------------------------------------------------------------------------------->
            <div v-if="openTab === 1">
                <div>
                    <div class="flex items-center text-2sm mb-1">
                        <div class="i-tabler-palette text-emerald-500 text-md"></div>
                        <span mx-1>Color Scheme</span>
                        <TooltipInfo container="#mainContainer" tooltip="Choose from static or generative color palette generators. <br> <b>Static</b> palettes are fixed, while <b>generative</b> ones produce new themed variations each time." />
                    </div>
                    <div flex gap-2>
                        <SelectInput class="w-8/12" v-model="particleLife.selectedColorPaletteOption" @change="updateColors" :options="paletteOptions"></SelectInput>
                        <div grid grid-cols-2 gap-1 class="w-4/12">
                            <button @click="updateColors" type="button" title="Reload palette" aria-label="Reload palette" btn px-3 rounded-full flex justify-center items-center bg="slate-800/80 hover:slate-800/50">
                                <span i-tabler-reload></span>
                            </button>
                            <button @click="updateColors(true)" type="button" title="Random palette" aria-label="Random palette" btn px-3 rounded-full flex justify-center items-center bg="cyan-900/80 hover:cyan-900/50">
                                <span i-game-icons-perspective-dice-six-faces-random></span>
                            </button>
                        </div>
                    </div>
                </div>
                <div mt-2>
                    <div class="flex items-center text-2sm mb-1">
                        <div class="i-tabler-grid-4x4 text-indigo-500 text-md"></div>
                        <span mx-1>Interaction Matrix</span>
                        <TooltipInfo container="#mainContainer" tooltip="Choose from different force matrix generators. <br> These are experimental and may produce unpredictable or unbalanced results." />
                    </div>
                    <div flex gap-2>
                        <SelectInput class="w-8/12" v-model="particleLife.selectedRulesOption" @change="updateRulesMatrix" :options="rulesOptions"></SelectInput>
                        <div grid grid-cols-2 gap-1 class="w-4/12">
                            <button @click="updateRulesMatrix" type="button" title="Reload interaction matrix" aria-label="Reload interaction matrix" btn px-3 rounded-full flex justify-center items-center bg="slate-800/80 hover:slate-800/50">
                                <span i-tabler-reload></span>
                            </button>
                            <button @click="updateRulesMatrix(true)" type="button" title="Random interaction matrix" aria-label="Random interaction matrix" btn px-3 rounded-full flex justify-center items-center bg="cyan-900/80 hover:cyan-900/50">
                                <span i-game-icons-perspective-dice-six-faces-random></span>
                            </button>
                        </div>
                    </div>
                </div>
                <div mt-2 v-if="particleLife.engineType === 'GPU'">
                    <div class="flex items-center text-2sm mb-1">
                        <div class="i-tabler-spiral text-cyan-500 text-md"></div>
                        <span mx-1>Particle Distribution</span>
                        <TooltipInfo container="#mainContainer" tooltip="Choose from different particle distribution generators. <br> Each defines how particles are initially placed, affecting the simulation’s early motion and structure." />
                    </div>
                    <div flex gap-2>
                        <SelectInput class="w-8/12" v-model="particleLife.selectedSpawnPositionOption" @change="updateParticlePositions" :options="positionOptions"></SelectInput>
                        <div grid grid-cols-2 gap-1 class="w-4/12">
                            <button @click="updateParticlePositions" type="button" title="Reload particle distribution" aria-label="Reload particle distribution" btn px-3 rounded-full flex justify-center items-center bg="slate-800/80 hover:slate-800/50">
                                <span i-tabler-reload></span>
                            </button>
                            <button @click="updateParticlePositions(true)" type="button" title="Random particle distribution" aria-label="Random particle distribution" btn px-3 rounded-full flex justify-center items-center bg="cyan-900/80 hover:cyan-900/50">
                                <span i-game-icons-perspective-dice-six-faces-random></span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <!--------------------------------------------------------------------------------------------------------->
            <div v-if="openTab === 2">
                <MyPresets :store="particleLife" @loadPreset="loadPreset"></MyPresets>
            </div>
        </div>
    </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { RULES_OPTIONS } from '~/helpers/utils/rulesGenerator';
import { PALETTE_OPTIONS } from "~/helpers/utils/colorsGenerator";
import { POSITION_OPTIONS } from "~/helpers/utils/positionsGenerator";
import MyPresets from "~/components/particle-life/MyPresets.vue";
export default defineComponent({
    components: { MyPresets },
    props: {
        store: {
            type: Object,
            required: true,
        }
    },
    setup(props, { emit }) {
        const particleLife = props.store
        const rulesOptions = RULES_OPTIONS
        const paletteOptions = PALETTE_OPTIONS
        const positionOptions = POSITION_OPTIONS

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
            particleLife, openTab,
            rulesOptions, paletteOptions, positionOptions,
            updateColors, updateRulesMatrix, updateParticlePositions, loadPreset
        }
    }
})
</script>

<style scoped>

</style>
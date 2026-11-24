<template>
    <div class="mx-auto">
        <div class="flex rounded-[0.625rem] bg-slate-700/80 p-0.75 shadow-md space-x-1">
            <button key="tab-1" :class="openTab === 1 ? 'bg-slate-900/80' : 'hover:bg-slate-800/80'" class="focus:shadow-outline-blue flex-1 rounded-lg py-1 pl-1 text-sm transition-all duration-100 focus:outline-none" @click="openTab = 1">
                Forces
                <TooltipInfo
                    container="#mainContainer" tag="div"
                    tooltip="Displays a grid representing interaction forces between color pairs. <br>
                             Click on a cell to adjust the force value for the interaction between the two colors it represents."
                />
            </button>
            <button key="tab-2" :class="openTab === 2 ? 'bg-slate-900/80' : 'hover:bg-slate-800/80'" class="focus:shadow-outline-blue flex-1 rounded-lg py-1 pl-1 text-sm transition-all duration-100 focus:outline-none" @click="openTab = 2">
                Min. Radius
                <TooltipInfo
                    container="#mainContainer" tag="div"
                    tooltip="Displays a grid representing the minimum interaction radius for color pairs. <br>
                             Click on a cell to set the minimum distance at which particles of the two colors will start to interact."
                />
            </button>
            <button key="tab-3" :class="openTab === 3 ? 'bg-slate-900/80' : 'hover:bg-slate-800/80'" class="focus:shadow-outline-blue flex-1 rounded-lg py-1 pl-1 text-sm transition-all duration-100 focus:outline-none" @click="openTab = 3">
                Max. Radius
                <TooltipInfo
                    container="#mainContainer" tag="div"
                    tooltip="Displays a grid representing the maximum interaction radius for color pairs. <br>
                             Click on a cell to set the maximum distance at which particles of the two colors will influence each other. <br>
                             Increasing this value can impact performance."
                />
            </button>
        </div>

        <div mt-2>
            <div v-if="openTab === 1" class="rounded-lg bg-slate-700/40 p-2 shadow-md">
                <RulesMatrix :store="particleLife" @update="(...args: any[]) => $emit('updateRulesMatrix', ...args)" @update-color="(...args: any[]) => $emit('updateColor', ...args)" />
            </div>

            <div v-if="openTab === 2" class="rounded-lg bg-slate-700/40 p-2 shadow-md">
                <MinMatrix :store="particleLife" @update="(...args: any[]) => $emit('updateMinMatrix', ...args)" @update-color="(...args: any[]) => $emit('updateColor', ...args)" />
            </div>

            <div v-if="openTab === 3" class="rounded-lg bg-slate-700/40 p-2 shadow-md">
                <MaxMatrix :store="particleLife" @update="(...args: any[]) => $emit('updateMaxMatrix', ...args)" @update-color="(...args: any[]) => $emit('updateColor', ...args)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import MaxMatrix from "~/components/particle-life/MaxMatrix.vue"
import MinMatrix from "~/components/particle-life/MinMatrix.vue"
import RulesMatrix from "~/components/particle-life/RulesMatrix.vue"

export default defineComponent({
    components: { MaxMatrix, MinMatrix, RulesMatrix },
    props: {
        store: {
            type: Object,
            required: true,
        },
    },
    emits: ['updateColor', 'updateMaxMatrix', 'updateMinMatrix', 'updateRulesMatrix'],
    // eslint-disable-next-line unused-imports/no-unused-vars
    setup(props, { emit }) {
        const particleLife = props.store

        const openTab = ref<number>(1)

        return { particleLife, openTab }
    },
})
</script>

<style scoped>

</style>

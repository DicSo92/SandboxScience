<template>
    <div> <!-- faded-hover-effect -->
        <button type="button" title="Brush" aria-label="Brush" btn w-8 aspect-square rounded-full p1 flex items-center justify-center backdrop-blur-sm
                :class="particleLife.isBrushActive && particleLife.brushType === 1 ? 'bg-blue-900 hover:bg-blue-950' : 'bg-slate-800/80 hover:bg-slate-700/80'"
                @click="toggleBrushType(1)">
            <span i-tabler-brush text-sm></span>
        </button>
        <button type="button" title="Eraser" aria-label="Eraser" btn w-8 aspect-square rounded-full p1 flex items-center justify-center backdrop-blur-sm
                :class="particleLife.isBrushActive && particleLife.brushType === 0 ? 'bg-blue-900 hover:bg-blue-950' : 'bg-slate-800/80 hover:bg-slate-700/80'"
                @click="toggleBrushType(0)">
            <span i-tabler-eraser text-sm></span>
        </button>
        <button type="button" title="Attractor" aria-label="Attractor" btn w-8 aspect-square rounded-full p1 flex items-center justify-center backdrop-blur-sm
                :class="particleLife.isBrushActive && particleLife.brushType === 3 ? 'bg-blue-900 hover:bg-blue-950' : 'bg-slate-800/80 hover:bg-slate-700/80'"
                @click="toggleBrushType(3)">
            <span i-tabler-magnetic text-sm></span>
        </button>
        <button type="button" title="Repeller" aria-label="Repeller" btn w-8 aspect-square rounded-full p1 flex items-center justify-center backdrop-blur-sm
                :class="particleLife.isBrushActive && particleLife.brushType === 2 ? 'bg-blue-900 hover:bg-blue-950' : 'bg-slate-800/80 hover:bg-slate-700/80'"
                @click="toggleBrushType(2)">
            <span i-tabler-magnet text-sm></span>
        </button>
        <div class="settings-btn group">
            <button type="button" title="Brush Settings" aria-label="Brush Settings" btn w-8 aspect-square rounded-full p1 flex items-center justify-center backdrop-blur-sm bg="slate-800/80 hover:slate-700/80">
                <span i-tabler-settings text-sm></span>
            </button>
            <div class="settings-panel absolute pr-1 right-full top-0 transition-all duration-200 ease-in-out delay-300
                opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 group-hover:transition-delay-0">
                <div p-3 pl-4 w-64 rounded-lg text-left backdrop-blur-sm class="bg-slate-800/80">
                    <p underline mb-2>Brush Settings :</p>
                    <div text-gray-300>
                        <div flex items-center mb-2>
                            <p mr-2 class="w-1/4">Radius</p>
                            <div flex-1>
                                <RangeInput input :min="10" :max="1000" :step="1" v-model="particleLife.brushRadius" />
                            </div>
                        </div>
                        <div flex items-center mb-2>
                            <p mr-2 class="w-1/4">Intensity</p>
                            <div flex-1>
                                <RangeInput input :min="1" :max="100" :step="1" v-model="particleLife.brushIntensity" />
                            </div>
                        </div>
                        <div flex items-center mb-2>
                            <p mr-2 class="w-1/4">Attract</p>
                            <div flex-1>
                                <RangeInput input :min="0" :max="100" :step="1" v-model="particleLife.attractForce" />
                            </div>
                        </div>
                        <div flex items-center>
                            <p mr-2 class="w-1/4">Repulse</p>
                            <div flex-1>
                                <RangeInput input :min="0" :max="100" :step="1" v-model="particleLife.repulseForce" />
                            </div>
                        </div>
                        <div v-if="particleLife.$id === 'particleLifeGPU'">
                            <div flex items-center mt-2>
                                <p mr-2 class="w-1/4">Velocity</p>
                                <div flex-1>
                                    <RangeInput input :min="0" :max="100" :step="1" v-model="particleLife.brushDirectionalForce" />
                                </div>
                            </div>
                            <ToggleSwitch label="Show Brush Circle" colorful-label v-model="particleLife.showBrushCircle" mt-2 />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div flex flex-col p1 rounded-full backdrop-blur-sm class="bg-slate-800/80">
            <button type="button" name="All Colors" aria-label="All Colors"
                    w-6 aspect-square rounded-full class="rainbow"
                    :class="!particleLife.brushes.length && 'border-3 border-gray-400 shadow-inner'"
                    @click="toggleBrushColor(null)">
            </button>
            <hr mt-1 border-gray-600>
            <button v-for="(color, index) in colorDisplayArray" :key="index"
                    type="button" :name="`Color ${index + 1}`" :aria-label="`Color ${index + 1}`"
                    w-6 aspect-square rounded-full mt-1 :class="particleLife.brushes.includes(index) && 'border-3 border-gray-950 shadow-inner'"
                    :style="{ backgroundColor: color }"
                    @click="toggleBrushColor(index)">
            </button>
        </div>
    </div>

</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    props: {
        store: {
            type: Object,
            required: true,
        }
    },
    setup(props, { emit }) {
        const particleLife = props.store

        const colorDisplayArray = computed(() => {
            const colors = particleLife.currentColors
            if (!colors) return []
            // WebGPU: Float32Array of RGB values
            if (colors instanceof Float32Array) {
                const result: string[] = []
                for (let i = 0; i < colors.length; i += 4) {
                    const r = Math.round(colors[i] * 255)
                    const g = Math.round(colors[i + 1] * 255)
                    const b = Math.round(colors[i + 2] * 255)
                    result.push(`rgb(${r}, ${g}, ${b})`)
                }
                return result
            }
            // Normal Array of HSL values
            return Array.from(colors).map(color => `hsl(${color}, 100%, 50%, 1)`)
        })

        function toggleBrushType(brushType: number) {
            if (particleLife.isBrushActive && particleLife.brushType === brushType) {
                particleLife.isBrushActive = false
            } else {
                particleLife.brushType = brushType
                particleLife.isBrushActive = true
            }
        }
        function toggleBrushColor(index: number | null) {
            particleLife.isBrushActive = true
            if (index === null) {
                particleLife.brushes = []
                return
            }
            const idx = particleLife.brushes.indexOf(index)
            if (idx === -1) {
                particleLife.brushes.push(index)
            } else {
                particleLife.brushes.splice(idx, 1)
            }
        }

        return { particleLife, toggleBrushType, toggleBrushColor, colorDisplayArray }
    }
})
</script>

<style scoped>
.rainbow {
    background: conic-gradient(
        hsl(360, 100%, 50%),
        hsl(315, 100%, 50%),
        hsl(270, 100%, 50%),
        hsl(225, 100%, 50%),
        hsl(180, 100%, 50%),
        hsl(135, 100%, 50%),
        hsl(90, 100%, 50%),
        hsl(45, 100%, 50%),
        hsl(0, 100%, 50%)
    );
}
.settings-btn {
    position: relative;
}
.settings-panel {
    z-index: 100;
}
</style>

<template>
    <div>
        <!-- faded-hover-effect -->
        <button
            type="button" title="Brush" aria-label="Brush" btn aspect-square w-8 flex items-center justify-center rounded-full p1 backdrop-blur-sm
            :class="particleLife.isBrushActive && particleLife.brushType === 1 ? 'bg-blue-900 hover:bg-blue-950' : 'bg-slate-800/80 hover:bg-slate-700/80'"
            @click="toggleBrushType(1)"
        >
            <span i-tabler-brush text-sm />
        </button>
        <button
            type="button" title="Eraser" aria-label="Eraser" btn aspect-square w-8 flex items-center justify-center rounded-full p1 backdrop-blur-sm
            :class="particleLife.isBrushActive && particleLife.brushType === 0 ? 'bg-blue-900 hover:bg-blue-950' : 'bg-slate-800/80 hover:bg-slate-700/80'"
            @click="toggleBrushType(0)"
        >
            <span i-tabler-eraser text-sm />
        </button>
        <button
            type="button" title="Attractor" aria-label="Attractor" btn aspect-square w-8 flex items-center justify-center rounded-full p1 backdrop-blur-sm
            :class="particleLife.isBrushActive && particleLife.brushType === 3 ? 'bg-blue-900 hover:bg-blue-950' : 'bg-slate-800/80 hover:bg-slate-700/80'"
            @click="toggleBrushType(3)"
        >
            <span i-tabler-magnetic text-sm />
        </button>
        <button
            type="button" title="Repeller" aria-label="Repeller" btn aspect-square w-8 flex items-center justify-center rounded-full p1 backdrop-blur-sm
            :class="particleLife.isBrushActive && particleLife.brushType === 2 ? 'bg-blue-900 hover:bg-blue-950' : 'bg-slate-800/80 hover:bg-slate-700/80'"
            @click="toggleBrushType(2)"
        >
            <span i-tabler-magnet text-sm />
        </button>
        <div class="settings-btn group">
            <button type="button" title="Brush Settings" aria-label="Brush Settings" btn aspect-square w-8 flex items-center justify-center rounded-full p1 backdrop-blur-sm bg="slate-800/80 hover:slate-700/80">
                <span i-tabler-settings text-sm />
            </button>
            <div class="settings-panel invisible absolute right-full top-0 pr-1 transition-all duration-200 delay-300 ease-in-out group-hover:visible group-hover:transition-delay-0">
                <div w-64 rounded-lg p-3 pl-4 text-left backdrop-blur-sm class="bg-slate-800/80">
                    <p mb-2 underline>
                        Brush Settings :
                    </p>
                    <div text-gray-300>
                        <div mb-2 flex items-center>
                            <p mr-2 class="w-1/4">
                                Radius
                            </p>
                            <div flex-1>
                                <RangeInput v-model="particleLife.brushRadius" input :min="10" :max="1000" :step="1" />
                            </div>
                        </div>
                        <div mb-2 flex items-center>
                            <p mr-2 class="w-1/4">
                                Intensity
                            </p>
                            <div flex-1>
                                <RangeInput v-model="particleLife.brushIntensity" input :min="1" :max="100" :step="1" />
                            </div>
                        </div>
                        <div mb-2 flex items-center>
                            <p mr-2 class="w-1/4">
                                Attract
                            </p>
                            <div flex-1>
                                <RangeInput v-model="particleLife.attractForce" input :min="0" :max="100" :step="1" />
                            </div>
                        </div>
                        <div flex items-center>
                            <p mr-2 class="w-1/4">
                                Repulse
                            </p>
                            <div flex-1>
                                <RangeInput v-model="particleLife.repulseForce" input :min="0" :max="100" :step="1" />
                            </div>
                        </div>
                        <div v-if="particleLife.$id === 'particleLifeGPU'">
                            <div mt-2 flex items-center>
                                <p mr-2 class="w-1/4">
                                    Velocity
                                </p>
                                <div flex-1>
                                    <RangeInput v-model="particleLife.brushDirectionalForce" input :min="0" :max="100" :step="1" />
                                </div>
                            </div>
                            <ToggleSwitch v-model="particleLife.showBrushCircle" label="Show Brush Circle" colorful-label mt-2 />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div flex flex-col rounded-full p1 backdrop-blur-sm class="bg-slate-800/80">
            <button
                type="button" name="All Colors" aria-label="All Colors"
                aspect-square w-6 rounded-full class="rainbow"
                :class="!particleLife.brushes.length && 'border-3 border-gray-400 shadow-inner'"
                @click="toggleBrushColor(null)"
            />
            <hr mt-1 border-gray-600>
            <button
                v-for="(color, index) in colorDisplayArray" :key="index"
                type="button" :name="`Color ${index + 1}`" :aria-label="`Color ${index + 1}`"
                mt-1 aspect-square w-6 rounded-full :class="particleLife.brushes.includes(index) && 'border-3 border-gray-950 shadow-inner'"
                :style="{ backgroundColor: color }"
                @click="toggleBrushColor(index)"
            />
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
        },
    },
    // eslint-disable-next-line unused-imports/no-unused-vars
    setup(props, { emit }) {
        const particleLife = props.store

        const colorDisplayArray = computed(() => {
            const colors = particleLife.currentColors
            if (!colors)
                return []
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
            return (colors as number[][]).map((color: number[]) => `hsl(${color[0]}, ${color[1]}%, ${color[2]}%, 1)`)
        })

        function toggleBrushType(brushType: number) {
            if (particleLife.isBrushActive && particleLife.brushType === brushType) {
                particleLife.isBrushActive = false
            }
            else {
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
            }
            else {
                particleLife.brushes.splice(idx, 1)
            }
        }

        return { particleLife, toggleBrushType, toggleBrushColor, colorDisplayArray }
    },
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

<template>
    <div mt-4 flex>
        <p v-if="label" class="w-2/3">{{ label }}</p>
        <div flex flex-col w-full>
            <div relative flex-1 ml-2>
                <input type="range"
                       :step="step"
                       :min="min" :max="max"
                       :value="modelValue[0]"
                       @input="updateMinValue($event.target.value)"
                       class="absolute pointer-events-none appearance-none z-20 h-2 w-full opacity-0 cursor-pointer left-0">

                <input type="range"
                       :step="step"
                       :min="min" :max="max"
                       :value="modelValue[1]"
                       @input="updateMaxValue($event.target.value)"
                       class="absolute pointer-events-none appearance-none z-20 h-2 w-full opacity-0 cursor-pointer left-0">

                <div class="relative z-10 h-2 flex items-center">
                    <div class="absolute z-10 left-0 right-0 bottom-0 top-0 rounded-md bg-gray-200"></div>
                    <div class="absolute z-20 top-0 bottom-0 rounded-md bg-#0C7489" :style="'right:'+maxOffset+'%; left:'+minOffset+'%'"></div>
                    <div class="absolute z-30 w-5 h-5 left-0 bg-#0A5F71 rounded-full -translate-x-1/2" :style="'left: '+minOffset+'%'"></div>
                    <div class="absolute z-30 w-5 h-5 right-0 bg-#0A5F71 rounded-full translate-x-1/2" :style="'right: '+maxOffset+'%'"></div>
                </div>
            </div>

            <div class="flex justify-between items-center pt-2 ml-2">
                <input type="text" maxlength="5" :value="modelValue[0]" @input="updateMinValue($event.target.value)" class="w-16 border border-gray-200 rounded text-center text-black">
                <input type="text" maxlength="5" :value="modelValue[1]" @input="updateMaxValue($event.target.value)" class="w-16 border border-gray-200 rounded text-center text-black">
            </div>
        </div>
    </div>

</template>

<script lang="ts">
import { defineComponent } from 'vue'
import {SymbolKind} from "vscode-languageserver-types";
import Array = SymbolKind.Array;
export default defineComponent({
    props: {
        min: {
            type: Number,
            required: true
        },
        max: {
            type: Number,
            required: true
        },
        step: {
            type: Number,
            default: 1,
        },
        modelValue: {
            type: Object,
            required: true
        },
        label: {
            type: String,
            required: false
        }
    },
    setup(props, { emit }) {
        const minOffset = computed(() => {
            return ((props.modelValue[0] - props.min) / (props.max - props.min)) * 100 // get the percentage from the left
        })
        const maxOffset = computed(() => {
            return 100 - (((props.modelValue[1] - props.min) / (props.max - props.min)) * 100) // get the percentage from the right
        })

        function updateMinValue(value: any) {
            const newRange = [Math.min(value, props.modelValue[1] - 10), props.modelValue[1]]
            emit("update:modelValue", newRange)
        }
        function updateMaxValue(value: any) {
            const newRange = [props.modelValue[0], Math.max(value, props.modelValue[0] + 10)]
            emit("update:modelValue", newRange)
        }

        return { minOffset, maxOffset, updateMinValue, updateMaxValue }
    }
})
</script>

<style scoped>
input[type=range]::-webkit-slider-thumb {
    pointer-events: all;
    width: 20px;
    height: 20px;
    -webkit-appearance: none;
    /* @apply w-6 h-6 appearance-none pointer-events-auto; */
}
input[type=range]::-moz-range-thumb {
    pointer-events: all;
    width: 20px;
    height: 20px;
    -webkit-appearance: none;
    /* @apply w-6 h-6 appearance-none pointer-events-auto; */
}
input[type=range]::-ms-thumb {
    pointer-events: all;
    width: 20px;
    height: 20px;
    -webkit-appearance: none;
    /* @apply w-6 h-6 appearance-none pointer-events-auto; */
}
</style>
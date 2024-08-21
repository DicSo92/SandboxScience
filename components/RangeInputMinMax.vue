<template>
    <div mt-2 flex>
        <div v-if="label" class="flex w-2/3 -mt-1.5">
            <p text-sm>
                {{ label }}
                <button v-if="tooltip" name="Info" aria-label="Info" i-tabler-info-circle text-zinc text-base cursor-help align-top
                        v-tooltip="{
                            content: tooltip, html: true, container: '#mainContainer',
                            popperClass: 'bg-gray-800 text-sm max-w-64 pointer-events-none',
                            delay: 0, distance: 7, placement: 'auto-start', overflowPadding: 10, arrowPadding: 10
                        }">
                </button>
            </p>
        </div>
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
                <input type="text" maxlength="5" :value="modelValue[0]" @input="inputTextUpdateMin($event.target.value)" class="w-14 border border-gray-200 rounded text-sm text-center text-black font-500">
                <input type="text" maxlength="5" :value="modelValue[1]" @input="inputTextUpdateMax($event.target.value)" class="w-14 border border-gray-200 rounded text-sm text-center text-black font-500">
            </div>
        </div>
    </div>

</template>

<script lang="ts">
import { defineComponent } from 'vue'
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
        },
        tooltip: {
            type: String,
            required: false
        }
    },
    setup(props, { emit, slots }) {
        const rangeOffset = 6
        const minOffset = computed(() => {
            return Math.max(0, Math.min(100, ((props.modelValue[0] - props.min) / (props.max - props.min)) * 100)) // get the percentage from the left
        })
        const maxOffset = computed(() => {
            return Math.max(0, Math.min(100, 100 - (((props.modelValue[1] - props.min) / (props.max - props.min)) * 100))) // get the percentage from the right
        })

        const inputTextUpdateMin = useDebounceFn((value: number) => {
            updateMinValue(isNaN(value) ? props.min : value)
        }, 750, { maxWait: 2500 })
        const inputTextUpdateMax = useDebounceFn((value: number) => {
            updateMaxValue(isNaN(value) ? props.min : value)
        }, 750, { maxWait: 2500 })
        function updateMinValue(value: any) {
            const newRange = [Math.min(value, props.modelValue[1] - rangeOffset), props.modelValue[1]]
            emit("update:modelValue", newRange)
        }
        function updateMaxValue(value: any) {
            const newRange = [props.modelValue[0], Math.max(value, props.modelValue[0] + rangeOffset)]
            emit("update:modelValue", newRange)
        }

        return { minOffset, maxOffset, inputTextUpdateMin, inputTextUpdateMax, updateMinValue, updateMaxValue, slots }
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
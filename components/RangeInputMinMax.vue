<template>
    <div mt-2 flex>
        <div v-if="label" class="w-2/3 flex -mt-1.5">
            <p class="text-2sm">
                {{ label }}
                <TooltipInfo v-if="tooltip" container="#mainContainer" :tooltip="tooltip!" />
            </p>
        </div>
        <div w-full flex flex-col>
            <div relative ml-2 flex-1>
                <input
                    type="range"
                    :step="step"
                    :min="min" :max="max"
                    :value="modelValue[0]"
                    class="pointer-events-none absolute left-0 z-20 h-2 w-full cursor-pointer appearance-none opacity-0"
                    @input="onMinRangeInput"
                >

                <input
                    type="range"
                    :step="step"
                    :min="min" :max="max"
                    :value="modelValue[1]"
                    class="pointer-events-none absolute left-0 z-20 h-2 w-full cursor-pointer appearance-none opacity-0"
                    @input="onMaxRangeInput"
                >

                <div class="relative z-10 h-2 flex items-center">
                    <div class="absolute bottom-0 left-0 right-0 top-0 z-10 rounded-md bg-gray-200" />
                    <div class="absolute bottom-0 top-0 z-20 rounded-md bg-#0C7489" :style="`right:${maxOffset}%; left:${minOffset}%`" />
                    <div class="absolute left-0 z-30 h-4.5 w-4.5 rounded-full bg-#0A5F71 -translate-x-1/2" :style="`left: ${minOffset}%`" />
                    <div class="absolute right-0 z-30 h-4.5 w-4.5 translate-x-1/2 rounded-full bg-#0A5F71" :style="`right: ${maxOffset}%`" />
                </div>
            </div>

            <div class="ml-2 flex items-center justify-between pt-2">
                <input type="text" maxlength="5" :value="modelValue[0]" class="w-14 border border-gray-200 rounded text-center text-sm text-black font-500" @input="onMinTextInput">
                <input type="text" maxlength="5" :value="modelValue[1]" class="w-14 border border-gray-200 rounded text-center text-sm text-black font-500" @input="onMaxTextInput">
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
            required: true,
        },
        max: {
            type: Number,
            required: true,
        },
        step: {
            type: Number,
            default: 1,
        },
        rangeOffset: {
            type: Number,
            default: 6,
        },
        modelValue: {
            type: Object,
            required: true,
        },
        label: {
            type: String,
            required: false,
        },
        tooltip: {
            type: String,
            required: false,
        },
    },
    emits: ['update:modelValue'],
    setup(props, { emit, slots }) {
        const minOffset = computed(() => {
            return Math.max(0, Math.min(100, ((props.modelValue[0] - props.min) / (props.max - props.min)) * 100)) // get the percentage from the left
        })
        const maxOffset = computed(() => {
            return Math.max(0, Math.min(100, 100 - (((props.modelValue[1] - props.min) / (props.max - props.min)) * 100))) // get the percentage from the right
        })

        const inputTextUpdateMin = useDebounceFn((value: string | number) => {
            const n = Number(value)
            updateMinValue(Number.isNaN(n) ? props.min : n)
        }, 750, { maxWait: 2500 })
        const inputTextUpdateMax = useDebounceFn((value: string | number) => {
            const n = Number(value)
            updateMaxValue(Number.isNaN(n) ? props.min : n)
        }, 750, { maxWait: 2500 })
        function updateMinValue(value: any) {
            const newRange = [Math.min(value, props.modelValue[1] - props.rangeOffset), props.modelValue[1]]
            emit("update:modelValue", newRange)
        }
        function updateMaxValue(value: any) {
            const newRange = [props.modelValue[0], Math.max(value, props.modelValue[0] + props.rangeOffset)]
            emit("update:modelValue", newRange)
        }

        const onMinRangeInput = (e: Event) => {
            updateMinValue((e.target as HTMLInputElement).value)
        }
        const onMaxRangeInput = (e: Event) => {
            updateMaxValue((e.target as HTMLInputElement).value)
        }
        const onMinTextInput = (e: Event) => {
            inputTextUpdateMin((e.target as HTMLInputElement).value)
        }
        const onMaxTextInput = (e: Event) => {
            inputTextUpdateMax((e.target as HTMLInputElement).value)
        }

        return { minOffset, maxOffset, inputTextUpdateMin, inputTextUpdateMax, updateMinValue, updateMaxValue, onMinRangeInput, onMaxRangeInput, onMinTextInput, onMaxTextInput, slots }
    },
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

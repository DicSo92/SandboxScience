<template>
    <div flex items-center>
        <div v-if="label" class="w-2/3 flex items-center">
            <p class="text-2sm">
                {{ label }}
                <TooltipInfo v-if="tooltip" container="#mainContainer" :tooltip="tooltip!" />
            </p>
        </div>

        <slot name="customLabel" />

        <div w-full flex items-center>
            <div relative mx-2 flex-1>
                <input
                    type="range"
                    :step="step"
                    :min="min" :max="max"
                    :value="modelValue"
                    class="absolute left-0 z-20 h-2 w-full cursor-pointer appearance-none opacity-0"
                    @input="onRangeInput"
                >

                <div class="relative z-10 h-2 flex items-center">
                    <div class="absolute bottom-0 left-0 right-0 top-0 z-10 rounded-md bg-gray-200" />
                    <div class="absolute bottom-0 left-0 top-0 z-20 rounded-md bg-#0C7489" :style="`right: ${maxOffset}%;`" />
                    <div class="absolute left-0 z-30 h-4.5 w-4.5 rounded-full bg-#0A5F71 -translate-x-1/2" :style="`left: ${minOffset}%;`" />
                </div>
            </div>
            <div v-if="input" w-14>
                <input type="text" maxlength="6" :value="modelValue" class="w-full border border-gray-200 rounded text-center text-sm text-black font-500" @input="onTextInput">
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
        modelValue: {
            type: Number,
            required: true,
        },
        input: {
            type: Boolean,
            default: false,
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
            return Math.max(0, Math.min(100, ((props.modelValue - props.min) / (props.max - props.min)) * 100)) // get the percentage from the left
        })
        const maxOffset = computed(() => {
            return Math.max(0, Math.min(100, 100 - (((props.modelValue - props.min) / (props.max - props.min)) * 100))) // get the percentage from the right
        })
        const inputTextUpdate = useDebounceFn((value: string | number) => {
            emit("update:modelValue", Number(value))
        }, 750, { maxWait: 2500 })
        function updateValue(value: any) {
            emit("update:modelValue", Number(value))
        }

        const onRangeInput = (e: Event) => {
            updateValue((e.target as HTMLInputElement).value)
        }
        const onTextInput = (e: Event) => {
            inputTextUpdate((e.target as HTMLInputElement).value)
        }

        return { minOffset, maxOffset, updateValue, inputTextUpdate, onRangeInput, onTextInput, slots }
    },
})
</script>

<style scoped>
input[type=range]::-webkit-slider-thumb, ::-moz-range-thumb, ::-ms-thumb {
    pointer-events: auto;
    width: 20px;
    height: 20px;
    -webkit-appearance: none;
}
</style>

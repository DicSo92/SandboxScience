<template>
    <div flex items-center>
        <div v-if="label" class="flex items-center w-2/3">
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

        <slot name="customLabel"></slot>

        <div flex items-center w-full>
            <div relative mx-2 flex-1>
                <input type="range"
                       :step="step"
                       :min="min" :max="max"
                       :value="modelValue"
                       @input="updateValue($event.target.value)"
                       class="absolute appearance-none z-20 h-2 w-full opacity-0 cursor-pointer left-0">

                <div class="relative z-10 h-2 flex items-center">
                    <div class="absolute z-10 left-0 right-0 bottom-0 top-0 rounded-md bg-gray-200"></div>
                    <div class="absolute z-20 top-0 left-0 bottom-0 rounded-md bg-#0C7489" :style="`right: ${maxOffset}%;`"></div>
                    <div class="absolute z-30 w-5 h-5 left-0 bg-#0A5F71 rounded-full -translate-x-1/2" :style="`left: ${minOffset}%;`"></div>
                </div>
            </div>
            <div v-if="input" w-14>
                <input type="text" maxlength="5" :value="modelValue" @input="inputTextUpdate($event.target.value)" class="w-full border border-gray-200 rounded text-sm text-center text-black font-500">
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
            type: Number,
            required: true,
        },
        input: {
            type: Boolean,
            default: false
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
        const minOffset = computed(() => {
            return Math.max(0, Math.min(100, ((props.modelValue - props.min) / (props.max - props.min)) * 100)) // get the percentage from the left
        })
        const maxOffset = computed(() => {
            return Math.max(0, Math.min(100, 100 - (((props.modelValue - props.min) / (props.max - props.min)) * 100))) // get the percentage from the right
        })
        const inputTextUpdate = useDebounceFn((value: number) => {
            emit("update:modelValue", Number(value))
        }, 750, { maxWait: 2500 })
        function updateValue(value: any) {
            emit("update:modelValue", Number(value))
        }

        return { minOffset, maxOffset, updateValue, inputTextUpdate, slots }
    }
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
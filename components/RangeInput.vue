<template>
    <div relative mx-2 min-w-48>
        <div relative mt-1>
            <input type="range"
                   :step="step"
                   :min="min" :max="max"
                   :value="modelValue"
                   @input="updateValue($event.target.value)"
                   class="absolute appearance-none z-20 h-2 w-full opacity-0 cursor-pointer left-0">

            <div class="relative z-10 h-2">
                <div class="absolute z-10 left-0 right-0 bottom-0 top-0 rounded-md bg-gray-200"></div>
                <div class="absolute z-20 top-0 bottom-0 rounded-md bg-purple-400" :style="`right: ${maxOffset}%; left: 0%`"></div>
                <div class="absolute z-30 w-5 h-5 top-0 left-0 bg-purple-500 rounded-full -ml-1" :style="`left: ${minOffset}%; margin-top: -7px;`"></div>
            </div>
        </div>

        <div v-if="inputs" class="flex justify-between items-center py-5">
            <input type="text" maxlength="5" :value="modelValue" @input="updateValue($event.target.value)" class="px-3 py-2 border border-gray-200 rounded w-24 text-center text-black">
            <input type="text" maxlength="5" :value="max" class="px-3 py-2 border border-gray-200 rounded w-24 text-center text-black">
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
        inputs: {
            type: Boolean,
            default: false
        }
    },
    setup(props, { emit }) {
        const minOffset = computed(() => {
            return ((props.modelValue - props.min) / (props.max - props.min)) * 100 // get the percentage from the left
        })
        const maxOffset = computed(() => {
            return 100 - (((props.modelValue - props.min) / (props.max - props.min)) * 100) // get the percentage from the right
        })

        onMounted(() => {
            updateValue(props.modelValue)
        })

        function updateValue(value: any) {
            emit("update:modelValue", Number(value))
        }

        return { minOffset, maxOffset, updateValue }
    }
})
</script>

<style scoped>
input[type=range]::-webkit-slider-thumb, ::-moz-range-thumb, ::-ms-thumb {
    pointer-events: all;
    width: 20px;
    height: 20px;
    -webkit-appearance: none;
    /* @apply w-6 h-6 appearance-none pointer-events-auto; */
}
</style>
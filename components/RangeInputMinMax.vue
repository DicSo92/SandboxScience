<template>
    <div mt-4 relative>
        <div relative>
            <input type="range"
                   :step="step"
                   :min="min" :max="max"
                   :value="minValue"
                   @input="updateMinValue($event.target.value)"
                   class="absolute pointer-events-none appearance-none z-20 h-2 w-full opacity-0 cursor-pointer left-0">

            <input type="range"
                   :step="step"
                   :min="min" :max="max"
                   :value="maxValue"
                   @input="updateMaxValue($event.target.value)"
                   class="absolute pointer-events-none appearance-none z-20 h-2 w-full opacity-0 cursor-pointer left-0">

            <div class="relative z-10 h-2">
                <div class="absolute z-10 left-0 right-0 bottom-0 top-0 rounded-md bg-gray-200"></div>
                <div class="absolute z-20 top-0 bottom-0 rounded-md bg-purple-400" :style="'right:'+maxOffset+'%; left:'+minOffset+'%'"></div>
                <div class="absolute z-30 w-6 h-6 top-0 left-0 bg-purple-500 rounded-full -mt-2 -ml-1" :style="'left: '+minOffset+'%'"></div>
                <div class="absolute z-30 w-6 h-6 top-0 right-0 bg-purple-500 rounded-full -mt-2 -mr-3" :style="'right: '+maxOffset+'%'"></div>
            </div>
        </div>

        <div class="flex justify-between items-center py-5">
            <input type="text" maxlength="5" :value="minValue" @input="updateMinValue($event.target.value)" class="px-3 py-2 border border-gray-200 rounded w-24 text-center text-black">
            <input type="text" maxlength="5" :value="maxValue" @input="updateMaxValue($event.target.value)" class="px-3 py-2 border border-gray-200 rounded w-24 text-center text-black">
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
        minValue: {
            type: Number,
            required: true,
        },
        maxValue: {
            type: Number,
            required: true,
        },
    },
    setup(props, { emit }) {
        const minOffset = computed(() => {
            return ((props.minValue - props.min) / (props.max - props.min)) * 100 // get the percentage from the left
        })
        const maxOffset = computed(() => {
            return 100 - (((props.maxValue - props.min) / (props.max - props.min)) * 100) // get the percentage from the right
        })

        onMounted(() => {
            updateMinValue(props.minValue)
            updateMaxValue(props.maxValue)
        })

        function updateMinValue(value: any) {
            emit("update:minValue", Math.min(value, props.maxValue - 500))

        }
        function updateMaxValue(value: any) {
            emit("update:maxValue", Math.max(value, props.minValue + 500))
        }

        return { minOffset, maxOffset, updateMinValue, updateMaxValue }
    }
})
</script>

<style scoped>
input[type=range]::-webkit-slider-thumb {
    pointer-events: all;
    width: 24px;
    height: 24px;
    -webkit-appearance: none;
    /* @apply w-6 h-6 appearance-none pointer-events-auto; */
}
input[type=range]::-moz-range-thumb {
    pointer-events: all;
    width: 24px;
    height: 24px;
    -webkit-appearance: none;
    /* @apply w-6 h-6 appearance-none pointer-events-auto; */
}
input[type=range]::-ms-thumb {
    pointer-events: all;
    width: 24px;
    height: 24px;
    -webkit-appearance: none;
    /* @apply w-6 h-6 appearance-none pointer-events-auto; */
}
</style>
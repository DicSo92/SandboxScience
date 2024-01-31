<template>
    <div ref="slider" mt-4 relative>
        <div relative>
            <input type="range"
                   :step="step"
                   :min="min" :max="max"
                   @input="onInputMin"
                   v-model.number="minValue"
                   class="absolute pointer-events-none appearance-none z-20 h-2 w-full opacity-0 cursor-pointer left-0">

            <input type="range"
                   :step="step"
                   :min="min" :max="max"
                   @input="onInputMax"
                   v-model.number="maxValue"
                   class="absolute pointer-events-none appearance-none z-20 h-2 w-full opacity-0 cursor-pointer left-0">

            <div class="relative z-10 h-2">
                <div class="absolute z-10 left-0 right-0 bottom-0 top-0 rounded-md bg-gray-200"></div>
                <div class="absolute z-20 top-0 bottom-0 rounded-md bg-purple-400" :style="'right:'+maxOffset+'%; left:'+minOffset+'%'"></div>
                <div class="absolute z-30 w-6 h-6 top-0 left-0 bg-purple-500 rounded-full -mt-2 -ml-1" :style="'left: '+minOffset+'%'"></div>
                <div class="absolute z-30 w-6 h-6 top-0 right-0 bg-purple-500 rounded-full -mt-2 -mr-3" :style="'right: '+maxOffset+'%'"></div>
            </div>
        </div>

        <div class="flex justify-between items-center py-5">
            <div>
                <input type="text" maxlength="5"  v-model.number="minValue" class="px-3 py-2 border border-gray-200 rounded w-24 text-center text-black">
            </div>
            <div>
                <input type="text" maxlength="5"  v-model.number="maxValue" class="px-3 py-2 border border-gray-200 rounded w-24 text-center text-black">
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
        const slider = ref<HTMLDivElement | undefined>(undefined)
        const minOffset = ref(0)
        const maxOffset = ref(0)

        const minValue = ref(props.minValue)
        const maxValue = ref(props.maxValue)

        onMounted(() => {
            minOffset.value = ((minValue.value - props.min) / (props.max - props.min)) * 100 // get the percentage from the left
            maxOffset.value = 100 - (((maxValue.value - props.min) / (props.max - props.min)) * 100) // get the percentage from the right
        })

        watch(minValue, (newValue, oldValue) => {
            if (slider && newValue !== oldValue) {
                minOffset.value = ((minValue.value - props.min) / (props.max - props.min)) * 100 // get the percentage from the left
                emit("update:minValue", minValue.value)
            }
        })
        watch(maxValue, (newValue, oldValue) => {
            if (slider && newValue !== oldValue) {
                maxOffset.value = 100 - (((maxValue.value - props.min) / (props.max - props.min)) * 100) // get the percentage from the right
                emit("update:maxValue", maxValue.value)
            }
        })

        function onInputMin() {
            minValue.value = Math.min(minValue.value, maxValue.value - 500);
        }
        function onInputMax() {
            maxValue.value = Math.max(maxValue.value, minValue.value + 500);
        }

        return { minValue, maxValue, minOffset, maxOffset, onInputMin, onInputMax }
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
</style>
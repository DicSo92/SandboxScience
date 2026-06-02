<template>
    <div flex items-center>
        <p v-if="label" class="text-2sm pt-0.5 mr-2">{{ label }}</p>
        <slot name="customLabel"></slot>
        <input type="text" maxlength="5" :value="modelValue"
               @input="inputTextUpdate($event.target.value)"
               class="w-14 border border-gray-200 rounded text-sm text-center text-black font-500"
               :class="inputClass">
    </div>

</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
    props: {
        modelValue: {
            type: Number,
            required: true,
        },
        label: {
            type: String,
            required: false
        },
        debounce: {
            type: Number,
            default: 750
        },
        inputClass: {
            type: String,
            default: ''
        }
    },
    emits: ['change', 'update:modelValue'],
    setup(props, { emit }) {
        const inputTextUpdate = useDebounceFn((value: number) => {
            emit("change", Number(value))
            emit("update:modelValue", Number(value))
        }, props.debounce, { maxWait: 2500 })

        return { inputTextUpdate }
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

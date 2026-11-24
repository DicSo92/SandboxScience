<template>
    <div flex items-center>
        <p v-if="label" class="mr-2 pt-0.5 text-2sm">
            {{ label }}
        </p>
        <slot name="customLabel" />
        <input
            type="text" maxlength="5" :value="modelValue"
            class="w-14 border border-gray-200 rounded text-center text-sm text-black font-500"
            :class="inputClass"
            @input="onInput"
        >
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
            required: false,
        },
        debounce: {
            type: Number,
            default: 750,
        },
        inputClass: {
            type: String,
            default: '',
        },
    },
    emits: ['change', 'update:modelValue'],
    setup(props, { emit }) {
        const inputTextUpdate = useDebounceFn((value: string | number) => {
            emit("change", Number(value))
            emit("update:modelValue", Number(value))
        }, props.debounce, { maxWait: 2500 })

        const onInput = (e: Event) => {
            inputTextUpdate((e.target as HTMLInputElement).value)
        }

        return { inputTextUpdate, onInput }
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

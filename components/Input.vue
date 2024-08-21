<template>
    <div flex items-center>
        <p v-if="label" class="text-2sm pt-0.5 mr-2">{{ label }}</p>
        <slot name="customLabel"></slot>
        <div flex items-center w-full>
            <div w-14>
                <input type="text" maxlength="5" :value="modelValue" @input="inputTextUpdate($event.target.value)" class="w-full border border-gray-200 rounded text-sm text-center text-black font-500">
            </div>
        </div>
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
        }
    },
    setup(props, { emit }) {
        const inputTextUpdate = useDebounceFn((value: number) => {
            emit("change", Number(value))
        }, 750, { maxWait: 2500 })

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

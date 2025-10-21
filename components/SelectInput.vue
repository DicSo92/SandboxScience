<template>
    <select v-model="value" @change="onChange" name="select-input" class="rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-900 shadow-sm focus:outline-none">
        <option v-for="(option, index) in options" :key="option.id" :value="option.id" class="text-gray-900">
            {{ option.name }}
        </option>
    </select>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'SelectInput',
    props: {
        options: {
            // type array of objects [id, name, icon?]
            type: Array<any>,
            required: true
        },
        modelValue: {
            type: [Number, String],
            required: true
        }
    },
    setup(props, { emit }) {
        const value = computed({
            get: () => props.modelValue as string | number,
            set: v => emit('update:modelValue', v as string | number),
        })

        const onChange = (e: Event) => {
            const target = e.target as HTMLSelectElement
            const newValue = target.value
            emit('change', newValue)
        }

        return { value, onChange }
    }

})

</script>

<style scoped>

</style>
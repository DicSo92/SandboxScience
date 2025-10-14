<template>
    <div class="flex flex-col gap-1">
        <label v-if="label" :for="selectId" v-once class="text-sm font-medium text-gray-700">
            {{ label }}
        </label>

        <select :id="selectId" v-model="value" @change="onChange" class="block w-full min-h-[2.25rem] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60">
            <option v-for="(option, index) in options" :key="option.id" :value="option.id" class="text-gray-900">
                {{ option.name }}
            </option>
        </select>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'SelectInput',
    props: {
        label: {
            type: String,
            required: false
        },
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
        const selectId = 'select-' + props.label
        const value = computed({
            get: () => props.modelValue as string | number,
            set: v => emit('update:model-value', v as string | number),
        })

        const onChange = (e: Event) => {
            const target = e.target as HTMLSelectElement
            const newValue = target.value
            emit('change', newValue)
        }

        return { selectId, value, onChange }
    }

})

</script>

<style scoped>

</style>
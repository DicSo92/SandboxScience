<template>
    <div flex items-center>
        <p v-if="inactiveLabel" mr-2 :class="(colorfulLabel && !modelValue) ? 'text-white font-600' : (colorfulLabel && modelValue) ? 'text-gray-800 font-600' : ''">{{ inactiveLabel }}</p>
        <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" class="sr-only peer" @change="toggle" :value="modelValue" :checked="modelValue" :disabled="disabled">
            <span :class="disabled && 'cursor-not-allowed'"
                  class="peer w-11 h-6 rounded-full peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full  after:content-['']
                  bg-#07404B peer-checked:bg-#0C7489 after:bg-gray-200 peer-checked:after:bg-white
                  after:border-gray-300 peer-checked:after:border-white
                  after:absolute after:top-0.5 after:start-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all">
            </span>
        </label>
        <p v-if="label" ml-2 :class="(colorfulLabel && modelValue) ? 'text-white font-600' : (colorfulLabel && !modelValue) ? 'text-gray-800 font-600' : ''">{{ label }}</p>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
    props: {
        inactiveLabel: {
            type: String,
            required: false
        },
        label: {
            type: String,
            required: false
        },
        modelValue: {
            type: Boolean,
            required: true
        },
        disabled: {
            type: Boolean,
            default: false
        },
        colorfulLabel: {
            type: Boolean,
            default: false
        }
    },
    setup(props, { emit }) {
        function toggle() {
            emit("update:modelValue", !props.modelValue)
        }
        return { toggle }
    }
})
</script>

<style scoped>

</style>
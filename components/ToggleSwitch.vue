<template>
    <div flex items-center>
        <p v-if="inactiveLabel" class="mr-2 pt-0.5 text-2sm" :class="(colorfulLabel && !modelValue) ? 'text-white font-600' : (colorfulLabel && modelValue) ? 'text-zinc-400 font-400' : ''">
            {{ inactiveLabel }}
            <button v-if="tooltip" name="Info" aria-label="Info" i-tabler-info-circle text-zinc text-base cursor-help align-top
                    v-tooltip="{
                            content: tooltip, html: true, container: '#mainContainer',
                            popperClass: 'bg-gray-800 text-sm max-w-64 pointer-events-none',
                            delay: 0, distance: 7, placement: 'auto-start', overflowPadding: 10, arrowPadding: 10
                        }">
            </button>
        </p>
        <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" class="sr-only peer" @change="toggle" :value="modelValue" :checked="modelValue" :disabled="disabled">
            <span :class="disabled && 'cursor-not-allowed'"
                  class="peer w-10 h-5.5 rounded-full peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-['']
                  bg-#07404B peer-checked:bg-#0C7489 after:bg-gray-200 peer-checked:after:bg-white
                  after:border-gray-300 peer-checked:after:border-white
                  after:absolute after:top-0.5 after:start-[2px] after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all">
            </span>
        </label>
        <p v-if="label"  class="ml-2 pt-0.5 text-2sm" :class="(colorfulLabel && modelValue) ? 'text-white font-600' : (colorfulLabel && !modelValue) ? 'text-zinc-400 font-400' : ''">
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
        },
        tooltip: {
            type: String,
            required: false
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
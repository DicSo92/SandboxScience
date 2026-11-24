<template>
    <section w-full>
        <div :class="isOpen && 'bg-slate-700/30 rounded-t-[18px]'">
            <div
                relative z-50 flex cursor-pointer items-center justify-between rounded-full px-4 py-1
                class="hover:bg-slate-600/50" :class="isOpen ? 'shadow-lg bg-slate-700/27' : 'bg-slate-700/50'" @click="toggle"
            >
                <div flex items-center>
                    <div v-if="icon" :class="icon" mr-2 text-lg />
                    <p flex items-center>
                        {{ label }}
                        <TooltipInfo v-if="tooltip" container="#mainContainer" :tooltip="tooltip" ml-1 />
                    </p>
                </div>
                <div :class="isOpen && 'rotate-180'" class="i-tabler-caret-up-filled transition-transform duration-300" text-2xl />
            </div>
        </div>

        <div v-if="isOpen" class="bg-slate-700/30" rounded-b-lg p-2>
            <slot />
        </div>
    </section>
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
    props: {
        icon: {
            type: String,
            required: false,
        },
        label: {
            type: String,
            required: true,
        },
        tooltip: {
            type: String,
            required: false,
        },
        opened: {
            type: Boolean,
            required: false,
        },
    },
    setup(props) {
        const isOpen = ref(false)

        onMounted(() => {
            if (props.opened) {
                isOpen.value = true
            }
        })
        function toggle() {
            isOpen.value = !isOpen.value
        }
        return { isOpen, toggle }
    },

})
</script>

<style scoped>

</style>

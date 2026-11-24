<template>
    <div class="relative">
        <button class="relative z-10 flex select-none items-center focus:outline-none" @click="open = !open">
            <slot name="button" />
        </button>

        <!-- to close when clicked on space around it -->
        <button v-if="open" class="fixed inset-0 h-full w-full cursor-default focus:outline-none" tabindex="-1" @click="open = false" />

        <transition enter-active-class="transition-all duration-200 ease-out" leave-active-class="transition-all duration-200 ease-in" enter-class="opacity-0 scale-75" enter-to-class="opacity-100 scale-100" leave-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-75">
            <div v-show="open" class="absolute z-10 mt-3 w-48 border border-zinc-800 rounded px-2 py-1 text-sm shadow-lg backdrop-blur-[2px]" :class="placement === 'right' ? 'right-0' : 'left-0'">
                <slot name="content" />
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    props: {
        placement: {
            type: String,
            default: "right",
            validator: (value: string) => ["right", "left"].includes(value),
        },
    },
    // eslint-disable-next-line unused-imports/no-unused-vars
    setup(props, { emit }) {
        const open = ref(false)

        const onEscape = (e: any) => {
            if (e.key === "Esc" || e.key === "Escape") {
                open.value = false
            }
        }

        onMounted(() => {
            useEventListener("keydown", onEscape)
        })

        watch(() => useRoute().fullPath, () => {
            open.value = false
        })

        return {
            open,
            onEscape,
        }
    },
})
</script>

<style scoped>

</style>

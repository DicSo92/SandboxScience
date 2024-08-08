<template>
    <div class="relative">
        <button class="z-10 relative flex items-center focus:outline-none select-none" @click="open = !open">
            <slot name="button"></slot>
        </button>

        <!-- to close when clicked on space around it-->
        <button class="fixed inset-0 h-full w-full cursor-default focus:outline-none" v-if="open" @click="open = false" tabindex="-1"></button>

        <transition enter-active-class="transition-all duration-200 ease-out" leave-active-class="transition-all duration-200 ease-in" enter-class="opacity-0 scale-75" enter-to-class="opacity-100 scale-100" leave-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-75">
            <div class="absolute shadow-lg border border-zinc-800 w-48 rounded py-1 px-2 text-sm mt-3 z-10 backdrop-blur-[2px]" :class="placement === 'right' ? 'right-0' : 'left-0'" v-if="open">
                <slot name="content"></slot>
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
            validator: (value: string) => ["right", "left"].indexOf(value) !== -1,
        },
    },
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
            open, onEscape
        }
    }
})
</script>

<style scoped>

</style>
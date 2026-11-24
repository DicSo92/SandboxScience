<template>
    <div id="sidebarLeft" z-50>
        <!-- faded-hover-effect -->
        <div fixed left-0 z-40 :style="toggleBtnStyle">
            <NuxtLink to="/" title="Home" aria-label="Home">
                <button
                    type="button" name="Home" aria-label="Home" btn flex items-center rounded-br-3xl p-2
                    class="mr-px ring-1 ring-slate-500 backdrop-blur-sm -ml-1 -mt-0.5" bg="slate-900/85 hover:slate-950/85"
                >
                    <span class="i-custom:icon text-2xl" />
                </button>
            </NuxtLink>
        </div>
        <div absolute left-0 top-13 z-40 :style="toggleBtnStyle">
            <button
                type="button" title="Settings" aria-label="Settings" btn flex flex-col items-center rounded-r-3xl pr-2
                class="py-[14px] pl-2 ring-1 ring-slate-500 backdrop-blur-sm -ml-1" bg="cyan-900/85 hover:cyan-950/85" @click="toggle"
            >
                <!--                <span i-tabler-settings text-lg mb-1></span> -->
                <span class="relative mb-1 flex">
                    <span v-show="!modelValue" i-tabler-settings class="ping absolute h-full w-full inline-flex text-sm opacity-75" />
                    <span i-tabler-settings class="relative inline-flex text-lg" />
                </span>
                <span class="vertical-90 rotate-180" text-sm font-medium>Settings</span>
            </button>
        </div>
        <div :style="toggleBtnStyle" pointer-events-none fixed bottom-2 left-2 z-40>
            <div class="flex flex-col items-start gap-1.5">
                <slot name="bottom-actions" />
            </div>
        </div>
        <Transition
            enter-active-class="transform transition-transform ease-out duration-300"
            enter-from-class="-translate-x-full"
            enter-to-class="translate-x-0"
            leave-active-class="transform transition-transform ease-in duration-200 delay-75"
            leave-from-class="translate-x-0"
            leave-to-class="-translate-x-full"
        >
            <div
                v-show="modelValue" :style="`width: ${sidebarWidth}px`"
                class="fixed inset-y-0 left-0 z-50 max-h-full max-w-full flex border-r border-slate-600/80"
            >
                <!-- inset-y-0 for fullheight sidebar -->
                <div class="h-full w-full flex flex-col bg-[#050818]/70 py-2 shadow-xl backdrop-blur-md">
                    <!-- bg-slate-950/70 -->
                    <slot />
                </div>
            </div>
        </Transition>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
    props: {
        modelValue: {
            type: Boolean,
            required: true,
        },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        const sidebarWidth = ref(400)

        function toggle() {
            emit("update:modelValue", !props.modelValue)
        }
        const toggleBtnStyle = computed(() => ({
            transition: props.modelValue
                ? 'transform 0.3s cubic-bezier(0, 0, 0.2, 1) 15ms'
                : 'transform 0.2s cubic-bezier(0.4, 0, 1, 1) 90ms',
            transform: `translateX(${props.modelValue ? sidebarWidth.value : 0}px)`,
        }))

        return { toggle, toggleBtnStyle, sidebarWidth }
    },
})
</script>

<style scoped>
#sidebarLeftBtn {}
.vertical-90 {
    writing-mode: vertical-rl;
    text-orientation: sideways;
}
.ping {
    animation: ping 4s cubic-bezier(0,0,0.2,1) 4s infinite;
}
@keyframes ping {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    20% {
        transform: scale(1.75);
        opacity: 0;
    }
    100% {
        transform: scale(1.75);
        opacity: 0;
    }
}
</style>

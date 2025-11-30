<template>
    <ClientOnly>
        <Teleport to="body">
            <div class="fixed inset-0 pointer-events-none z-[9999]">
                <div class="absolute bottom-15 right-2 flex flex-col gap-2">
                    <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2">
                        <div v-for="toast in toasts" :key="toast.id"
                             class="pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg border text-sm"
                             :class="toastTypes[toast.type].classes"
                        >
                            <span class="text-sm" :class="toastTypes[toast.type].icon"></span>
                            <p class="flex-1">{{ toast.message }}</p>
                            <button type="button" @click="removeToast(toast.id)" class="ml-2 text-xs opacity-70 hover:opacity-100">
                                ✕
                            </button>
                        </div>
                    </TransitionGroup>
                </div>
            </div>
        </Teleport>
    </ClientOnly>
</template>

<script setup lang="ts">
import type { ToastType } from '~/composables/useToasts';
const { toasts, removeToast } = useToasts();

const toastTypes: Record<ToastType, { classes: string, icon: string }> = {
    success: {
        classes: 'bg-emerald-900/70 border-emerald-200/70 text-emerald-50 backdrop-blur-sm',
        icon: 'i-tabler-check text-emerald-100',
    },
    error: {
        classes: 'bg-red-900/70 border-red-200/70 text-red-50 backdrop-blur-sm',
        icon: 'i-tabler-x text-red-100',
    },
    warning: {
        classes: 'bg-amber-900/70 border-amber-100/70 text-amber-50 backdrop-blur-sm',
        icon: 'i-tabler-alert-triangle text-amber-100',
    },
    info: {
        classes: 'bg-cyan-900/70 border-cyan-200/70 text-cyan-50 backdrop-blur-sm',
        icon: 'i-tabler-info-circle text-cyan-100',
    },
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
    transition: all 0.2s ease-out;
}
.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
}
</style>

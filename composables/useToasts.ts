export type ToastType = "success" | "warning" | "error" | "info"

export interface Toast {
    id: number
    type: ToastType
    message: string
}

const toasts = ref<Toast[]>([])

function addToast(type: ToastType, message: string, duration = 3000) {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, type, message })

    if (duration > 0) {
        setTimeout(() => removeToast(id), duration)
    }
}

function removeToast(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
}

export function useToasts() {
    return {
        toasts: readonly(toasts),
        success: (msg: string, duration?: number) => addToast("success", msg, duration),
        warning: (msg: string, duration?: number) => addToast("warning", msg, duration),
        error: (msg: string, duration?: number) => addToast("error", msg, duration),
        info: (msg: string, duration?: number) => addToast("info", msg, duration),
        removeToast,
    }
}

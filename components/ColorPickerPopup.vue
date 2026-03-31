<template>
    <div ref="triggerRef" :class="triggerClass" @click.stop="toggle">
        <slot />
    </div>

    <Teleport to="body">
        <div v-if="isOpen" ref="popupRef" @click.stop :style="popupStyle" class="bg-slate-800/80"
             fixed z-1000 w-64 p-3 rounded-xl border border-slate-600 backdrop-blur-md shadow-2xl>
            <ColorPicker :value="value" @change="onChange" :storage-key="storageKey" />
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

const props = withDefaults(defineProps<{
    value: string
    storageKey?: string
    placement?: 'bottom' | 'top' | 'left' | 'right'
    offset?: number
    triggerClass?: string
}>(), {
    storageKey: 'default',
    placement: 'bottom',
    offset: 8,
    triggerClass: 'inline-block',
})

const emit = defineEmits<{
    change: [hex: string]
}>()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement>()
const popupRef = ref<HTMLElement>()
const popupStyle = ref<Record<string, string>>({})

function toggle() {
    if (isOpen.value) close()
    else open()
}
function open() {
    isOpen.value = true
    nextTick(updatePosition)
}
function close() {
    isOpen.value = false
}
function onChange(hex: string) {
    emit('change', hex)
}

function updatePosition() {
    if (!triggerRef.value || !popupRef.value) return
    const rect = triggerRef.value.getBoundingClientRect()
    const popupRect = popupRef.value.getBoundingClientRect()
    const popupW = popupRect.width
    const popupH = popupRect.height
    const { offset, placement } = props

    let top = 0
    let left = 0

    switch (placement) {
        case 'bottom':
            top = rect.bottom + offset
            left = rect.left + rect.width / 2 - popupW / 2
            break
        case 'top':
            top = rect.top - popupH - offset
            left = rect.left + rect.width / 2 - popupW / 2
            break
        case 'right':
            top = rect.top + rect.height / 2 - popupH / 2
            left = rect.right + offset
            break
        case 'left':
            top = rect.top + rect.height / 2 - popupH / 2
            left = rect.left - popupW - offset
            break
    }

    const vw = window.innerWidth
    const vh = window.innerHeight
    if (left + popupW > vw - 8) left = vw - popupW - 8
    if (left < 8) left = 8
    if (top + popupH > vh - 8) top = vh - popupH - 8
    if (top < 8) top = 8

    popupStyle.value = {
        top: `${top}px`,
        left: `${left}px`,
    }
}

let stopClickOutside: (() => void) | null = null
watch(isOpen, (open) => {
    if (open) {
        nextTick(() => {
            if (popupRef.value) {
                stopClickOutside = onClickOutside(popupRef.value, close, { ignore: [triggerRef] })
            }
        })
    } else {
        stopClickOutside?.()
        stopClickOutside = null
    }
})
onBeforeUnmount(() => {
    stopClickOutside?.()
})
</script>

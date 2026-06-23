<template>
    <div flex flex-col gap-2>
        <p class="text-2sm text-gray-300 leading-snug">
            Save a complete snapshot of the simulation — the position, velocity and type of every particle — then load it
            back later to resume exactly where you left off.
        </p>
        <div flex gap-2>
            <button type="button"
                    flex-1 btn rounded-lg py-1.5 flex items-center justify-center font-semibold
                    class="bg-emerald-600/20 hover:bg-emerald-600/35 transition-all ring-1 ring-emerald-400/40 text-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="store.isHudLocked"
                    @click="$emit('saveState')">
                <span class="i-tabler-device-floppy text-base mr-1"></span>
                <span class="text-2sm">Save State</span>
            </button>
            <button type="button"
                    flex-1 btn rounded-lg py-1.5 flex items-center justify-center font-semibold
                    class="bg-sky-600/20 hover:bg-sky-600/35 transition-all ring-1 ring-sky-400/40 text-sky-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="store.isHudLocked"
                    @click="triggerLoad">
                <span class="i-tabler-folder-open text-base mr-1"></span>
                <span class="text-2sm">Load State</span>
            </button>
        </div>
        <input ref="fileInput" type="file" :accept="acceptExtension" class="hidden" @change="onFileSelected" />
    </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue"

export default defineComponent({
    name: "StatePanel",
    props: {
        store: { type: Object, required: true },
    },
    emits: ["saveState", "loadState"],
    setup(_props, { emit }) {
        const { FILE_EXTENSION } = useStateManager()
        const acceptExtension = `.${FILE_EXTENSION}`
        const fileInput = ref<HTMLInputElement | null>(null)

        const triggerLoad = () => {
            fileInput.value?.click()
        }
        const onFileSelected = (event: Event) => {
            const input = event.target as HTMLInputElement
            const file = input.files?.[0]
            if (file) emit("loadState", file)
            // Reset so selecting the same file again still fires a change event
            input.value = ""
        }

        return { acceptExtension, fileInput, triggerLoad, onFileSelected }
    },
})
</script>

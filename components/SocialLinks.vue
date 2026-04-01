<template>
    <section fixed z-10 bottom-2 right-2 flex items-end>
        <button type="button" name="Donate" aria-label="Donate" title="Donate" @click="openDonationModal()"
                class="donation-glow group relative flex items-center mr-2 p-1.2 rounded-full backdrop-blur-sm transition-all duration-300 bg-rose-600/80 hover:bg-rose-500/90 border border-rose-400/50 hover:border-rose-300/70 text-white">
            <span i-tabler-heart-filled class="animate-heartbeat"></span>
        </button>
        <NuxtLink to="https://github.com/DicSo92/SandboxScience" title="Github" aria-label="Github" target="_blank" flex items-center py-0 mr-2>
            <button type="button" name="Github" aria-label="Github" class="bg-slate-900/80 ring-1 ring-zinc-4/50 rounded-lg p-1 backdrop-blur-sm" text="zinc-2 hover:zinc-4" flex>
                <span i-carbon-logo-github text-xl></span>
            </button>
        </NuxtLink>
        <NuxtLink to="https://discord.com/invite/z5yuzkFpCA" title="Discord" aria-label="Discord" target="_blank" flex items-center py-0>
            <button type="button" name="Discord" aria-label="Discord" class="text-zinc-2 bg-indigo-600/80 hover:bg-indigo-700/80 ring-1 ring-zinc-2/50 rounded-full p-2 backdrop-blur-sm" flex>
                <span i-carbon-logo-discord text-2xl></span>
            </button>
        </NuxtLink>
    </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    setup() {
        const { open: openDonationModal } = useDonationModal()
        return { openDonationModal }
    }
})
</script>

<template>
    <section fixed bottom-2 right-2 z-10 flex items-end>
        <button
            type="button" name="Donate" aria-label="Donate" title="Donate" class="donation-glow group relative mr-2 flex items-center border border-rose-400/50 rounded-full bg-rose-600/80 p-1.2 text-white backdrop-blur-sm transition-all duration-300 hover:border-rose-300/70 hover:bg-rose-500/90"
            @click="openDonationModal()"
        >
            <span i-tabler-heart-filled class="animate-heartbeat" />
        </button>
        <NuxtLink to="https://github.com/DicSo92/SandboxScience" title="Github" aria-label="Github" target="_blank" mr-2 flex items-center py-0>
            <button type="button" name="Github" aria-label="Github" class="rounded-lg bg-slate-900/80 p-1 ring-1 ring-zinc-4/50 backdrop-blur-sm" text="zinc-2 hover:zinc-4" flex>
                <span i-carbon-logo-github text-xl />
            </button>
        </NuxtLink>
        <NuxtLink to="https://discord.com/invite/z5yuzkFpCA" title="Discord" aria-label="Discord" target="_blank" flex items-center py-0>
            <button type="button" name="Discord" aria-label="Discord" class="rounded-full bg-indigo-600/80 p-2 text-zinc-2 ring-1 ring-zinc-2/50 backdrop-blur-sm hover:bg-indigo-700/80" flex>
                <span i-carbon-logo-discord text-2xl />
            </button>
        </NuxtLink>
    </section>
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
    setup() {
        const { open: openDonationModal } = useDonationModal()
        return { openDonationModal }
    },
})
</script>

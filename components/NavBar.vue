<template>
    <nav fixed left-0 right-0 top-0 z-100 flex justify-center px-3 py-2 class="bg-#090909AA" style="box-shadow: 0 2px 8px 0 rgba(0,0,0,.5)">
        <div container flex justify-between>
            <div flex items-center>
                <NuxtLink to="/" title="Home" aria-label="Home" flex items-center>
                    <span class="i-custom:icon mr-1 text-lg" />
                    <div font-semibold>
                        SandboxScience
                    </div>
                </NuxtLink>
                <div ml-8 flex>
                    <Dropdown placement="left">
                        <template #button>
                            <div mx-2 flex items-center>
                                <span class="mr-1" text="zinc-2 hover:zinc-1">Simulations</span>
                                <span i-tabler-chevron-down mt-px />
                            </div>
                        </template>
                        <template #content>
                            <NuxtLink to="/game-of-life" my-1 w-full flex items-center justify-between rounded px-2 py-1 hover:bg-zinc-700>
                                Game Of Life
                            </NuxtLink>
                            <NuxtLink to="/particle-life" my-1 w-full flex items-center justify-between rounded px-2 py-1 hover:bg-zinc-700>
                                Particle Life
                            </NuxtLink>
                            <NuxtLink to="/hash-life" my-1 w-full flex items-center justify-between rounded px-2 py-1 hover:bg-zinc-700>
                                Hash Life
                            </NuxtLink>
                        </template>
                    </Dropdown>
                    <!--                    <NuxtLink to="/doc" mx-2>Documentation</NuxtLink> -->
                    <button mx-2 cursor-not-allowed text-gray-400>
                        Documentation
                    </button>
                    <NuxtLink to="/about" mx-2 class="text-zinc-2 hover:text-zinc-1">
                        About
                    </NuxtLink>
                </div>
            </div>
            <div flex items-center>
                <button
                    type="button" name="Donate" aria-label="Donate" title="Donate" class="mr-2 flex items-center border border-rose-500/30 rounded-lg bg-rose-600/20 px-2.5 py-1 text-xs text-rose-300 font-medium transition-all duration-200 hover:border-rose-500/50 hover:bg-rose-600/30 hover:text-rose-200"
                    @click="openDonationModal()"
                >
                    <span i-tabler-heart-filled mr-1 text-sm class="animate-heartbeat" />
                    Donate
                </button>
                <NuxtLink to="https://github.com/DicSo92/SandboxScience" title="Github" aria-label="Github" target="_blank" external class="mx-1 flex items-center py-0">
                    <button type="button" name="Github" aria-label="Github" text="zinc-3 hover:zinc-1" flex>
                        <span i-carbon-logo-github m-0.5 text-lg />
                    </button>
                </NuxtLink>
                <NuxtLink to="https://discord.com/invite/z5yuzkFpCA" title="Discord" aria-label="Discord" target="_blank" external class="ml-1.5 mr-1 flex items-center py-0">
                    <button type="button" name="Discord" aria-label="Discord" text="zinc-3 hover:zinc-1" flex>
                        <span i-carbon-logo-discord m-0.5 text-lg />
                    </button>
                </NuxtLink>
                <NuxtLink to="https://x.com" title="Twitter" aria-label="Twitter" target="_blank" external class="mx-1 flex items-center py-0">
                    <button type="button" name="Twitter" aria-label="Twitter" text="zinc-3 hover:zinc-1" flex>
                        <span i-carbon-logo-x m-0.5 text-lg />
                    </button>
                </NuxtLink>
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
const { open: openDonationModal } = useDonationModal()
</script>

<style scoped>

</style>

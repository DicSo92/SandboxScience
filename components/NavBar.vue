<template>
    <nav flex justify-center py-2 px-3 z-100 fixed top-0 left-0 right-0 class="bg-#090909AA">
        <div flex justify-between container>
            <div flex items-center>
                <SiteLink to="/" flex items-center>
                    <span class="i-custom:icon text-lg mr-1"></span>
                    <div font-semibold>SandboxScience</div>
                </SiteLink>
                <div flex ml-8>
                    <Dropdown placement="left">
                        <template v-slot:button>
                            <div flex items-center mx-2>
                                <span class="mr-1" text="zinc-2 hover:zinc-1">Simulations</span>
                                <span i-tabler-chevron-down mt-px></span>
                            </div>
                        </template>
                        <template v-slot:content>
                            <SiteLink to="/game-of-life" flex w-full justify-between items-center rounded px-2 py-1 my-1 hover:bg-zinc-700>
                                Game Of Life
                            </SiteLink>
                            <SiteLink to="/particle-life" flex w-full justify-between items-center rounded px-2 py-1 my-1 hover:bg-zinc-700>
                                Particle Life
                            </SiteLink>
                            <SiteLink to="/hash-life" flex w-full justify-between items-center rounded px-2 py-1 my-1 hover:bg-zinc-700>
                                Hash Life
                            </SiteLink>
                        </template>
                    </Dropdown>
<!--                    <SiteLink to="/doc" mx-2>Documentation</SiteLink>-->
                    <button mx-2 cursor-not-allowed text-gray-400>Documentation</button>
                    <SiteLink to="/about" mx-2 class="text-zinc-2 hover:text-zinc-1">
                        About
                    </SiteLink>
                </div>
            </div>
            <div flex>
                <NuxtLink to="https://github.com/DicSo92/SandboxScience" title="Github" aria-label="Github" target="_blank" flex items-center py-0 mx-2>
                    <button type="button" name="Github" text="zinc-3 hover:zinc-1" flex>
                        <span i-carbon-logo-github text-lg></span>
                    </button>
                </NuxtLink>
                <NuxtLink to="https://discord.com/invite/z5yuzkFpCA" title="Discord" aria-label="Discord" target="_blank" flex items-center py-0 mx-2>
                    <button type="button" name="Discord" text="zinc-3 hover:zinc-1" flex>
                        <span i-carbon-logo-discord text-lg></span>
                    </button>
                </NuxtLink>
                <NuxtLink to="https://x.com" title="Twitter" aria-label="Twitter" target="_blank" flex items-center py-0 mx-2>
                    <button type="button" name="X" text="zinc-3 hover:zinc-1" flex>
                        <span i-carbon-logo-x text-lg></span>
                    </button>
                </NuxtLink>
            </div>
        </div>

    </nav>
</template>

<script setup lang="ts">

</script>

<style scoped>
nav {
    box-shadow: 0 2px 8px 0 rgba(0,0,0,.5);
}
</style>
<template>
    <nav flex justify-center py-2 px-3 z-100 fixed top-0 left-0 right-0 class="bg-#090909AA">
        <div flex justify-between container>
            <div flex items-center>
                <NuxtLink to="/" flex items-center>
                    <span text-lg font-bold mr-1>🧪</span>
                    <div font-semibold>SandboxScience</div>
                </NuxtLink>
                <div flex ml-8>
                    <Dropdown placement="left">
                        <template v-slot:button>
                            <div flex items-center mx-2>
                                <span class="mr-1">Simulations</span>
                                <span i-tabler-chevron-down mt-px></span>
                            </div>
                        </template>
                        <template v-slot:content>
                            <NuxtLink to="/game-of-life" flex w-full justify-between items-center rounded px-2 py-1 my-1 hover:bg-zinc-700>
                                Game Of Life
                            </NuxtLink>
                            <NuxtLink to="/particle-life" flex w-full justify-between items-center rounded px-2 py-1 my-1 hover:bg-zinc-700>
                                Particle Life
                            </NuxtLink>
                            <NuxtLink to="/hash-life" flex w-full justify-between items-center rounded px-2 py-1 my-1 hover:bg-zinc-700>
                                Hash Life
                            </NuxtLink>
                        </template>
                    </Dropdown>
                    <NuxtLink to="/doc" mx-2>Documentation</NuxtLink>
                    <NuxtLink to="/about" mx-2>About</NuxtLink>
                </div>
            </div>
            <div flex>
                <button type="button" text="zinc-3 hover:zinc-1" flex items-center py-0 px-2>
                    <span i-carbon-logo-github text-lg></span>
                </button>
                <button type="button" text="zinc-3 hover:zinc-1" flex items-center py-0 px-2>
                    <span i-carbon-logo-discord text-lg></span>
                </button>
                <button type="button" text="zinc-3 hover:zinc-1" flex items-center py-0 px-2>
                    <span i-carbon-logo-x text-lg></span>
                </button>
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
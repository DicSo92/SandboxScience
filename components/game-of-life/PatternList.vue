<template>
    <div h-full flex flex-col>
        <div class="mt-4 px-4">
            <input type="text" placeholder="Search pattern here" class="w-full border border-gray-300 rounded-md p-2 transition-colors duration-300 focus:border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300">
        </div>
        <div class="mt-4 flex justify-between px-4">
            <p class="ml-2 text-gray-400">
                Patterns
            </p>
            <div class="flex">
                <button flex items-center>
                    <span i-tabler-list text-xl />
                </button>
                <button flex items-center>
                    <span i-tabler-layout-grid text-xl />
                </button>
            </div>
        </div>
        <div class="mt-4 flex-1 overflow-auto px-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div v-for="item in 22" :key="item" class="cursor-pointer border border-gray-300 rounded-md bg-gray-500 p-4 transition-colors duration-300 hover:bg-gray-400">
                    <h3 class="mb-2 text-lg text-black font-semibold">
                        Card {{ item }}
                    </h3>
                    <p class="text-gray-600">
                        Content for card {{ item }}.
                    </p>
                </div>
            </div>
        </div>
        <!-- Sidebar Footer -->
        <div class="mt-6 px-4">
            <button class="flex items-center justify-center gap-1 rounded-md bg-black p-2 text-sm text-white">
                <span i-tabler-filter text-xl />
                Filters
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">

</script>

<style scoped>

</style>

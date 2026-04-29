<script setup>
import { ExternalLink, Globe } from 'lucide-vue-next'

defineProps({
  preview: Object
})
</script>

<template>
  <div class="fixed bottom-6 left-6 max-w-[280px] animate-in fade-in slide-in-from-bottom-4 duration-500">
    <a :href="preview.url" target="_blank" class="block bg-white p-3 border border-slate-200 hover:border-slate-400 transition-colors group">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-100">
          <img v-if="preview.favicon" :src="preview.favicon" class="w-6 h-6 object-contain" />
          <Globe v-else :size="20" class="text-slate-400" />
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
            {{ preview.title || 'Visit Link' }}
          </h4>
          <p class="text-xs text-slate-500 truncate mt-0.5">{{ preview.url }}</p>
        </div>
        <ExternalLink :size="14" class="text-slate-400 group-hover:text-blue-500 transition-colors mt-1" />
      </div>
    </a>
  </div>
</template>

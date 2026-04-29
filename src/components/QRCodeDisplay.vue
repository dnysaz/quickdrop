<script setup>
import QrcodeVue from 'qrcode.vue'
import { Copy, Check } from 'lucide-vue-next'
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
  value: String,
  initialTtl: {
    type: Number,
    default: 600
  }
})

const copied = ref(false)
const timeLeft = ref(props.initialTtl)
let timer = null

const copyToClipboard = () => {
  navigator.clipboard.writeText(props.value)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

const formattedTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
  const s = timeLeft.value % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

onMounted(() => {
  timer = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      clearInterval(timer)
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="fixed bottom-6 right-6 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="bg-white p-4 border border-slate-200 flex flex-col items-center gap-3">
      <div class="bg-white p-2">
        <qrcode-vue :value="value" :size="120" level="H" render-as="svg" foreground="#0f172a" />
      </div>
      
      <button 
        @click="copyToClipboard"
        class="flex items-center justify-center w-full gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all active:scale-95"
      >
        <Check v-if="copied" :size="16" />
        <Copy v-else :size="16" />
        {{ copied ? 'Copied!' : 'Copy Link' }}
      </button>
    </div>
    
    <div class="text-slate-500 font-mono text-sm font-medium tracking-widest opacity-80">
      {{ formattedTime }}
    </div>
  </div>
</template>

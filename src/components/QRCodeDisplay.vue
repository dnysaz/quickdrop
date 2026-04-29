<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { Check, Copy, X } from 'lucide-vue-next'

const props = defineProps({
  value: String,
  initialTtl: {
    type: Number,
    default: 600
  }
})

const emit = defineEmits(['expired', 'close'])

const copied = ref(false)
const timeLeft = ref(props.initialTtl)
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

let timer = null

// Keep timer synced with server updates
watch(() => props.initialTtl, (newVal) => {
  if (Math.abs(timeLeft.value - newVal) > 5) {
    timeLeft.value = newVal
  }
})

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

// Drag logic
const startDrag = (e) => {
  isDragging.value = true
  const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX
  const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY
  dragOffset.value = {
    x: clientX - position.value.x,
    y: clientY - position.value.y
  }
  
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('touchmove', onDrag)
  window.addEventListener('touchend', stopDrag)
}

const onDrag = (e) => {
  if (!isDragging.value) return
  const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX
  const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY
  position.value = {
    x: clientX - dragOffset.value.x,
    y: clientY - dragOffset.value.y
  }
}

const stopDrag = () => {
  isDragging.value = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('touchend', stopDrag)
}

onMounted(() => {
  timer = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      clearInterval(timer)
      emit('expired')
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div 
    class="fixed bottom-6 right-6 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 z-50 select-none"
    :style="{ transform: `translate(${position.x}px, ${position.y}px)` }"
  >
    <div 
      class="bg-white p-4 border border-slate-200 flex flex-col items-center gap-3 cursor-grab active:cursor-grabbing relative"
      @mousedown="startDrag"
      @touchstart="startDrag"
    >
      <!-- Close Button -->
      <button 
        @click.stop="emit('close')"
        class="absolute -top-3 -right-3 w-6 h-6 bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors shadow-sm"
      >
        <X :size="14" />
      </button>

      <div class="bg-white p-2">
        <qrcode-vue :value="value" :size="120" level="H" render-as="svg" foreground="#0f172a" />
      </div>
      
      <button 
        @click.stop="copyToClipboard"
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

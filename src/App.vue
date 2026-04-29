<script setup>
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue'
import axios from 'axios'
import QRCodeDisplay from './components/QRCodeDisplay.vue'

const text = ref('')
const id = ref('')
const shareUrl = ref('')
const textareaRef = ref(null)
const ttl = ref(600)
const isFocused = ref(false)
const isSyncing = ref(false)

let pollInterval = null
let saveTimeout = null

const urlRegex = /((https?:\/\/|www\.)[^\s]+\.[^\s]{2,}|[a-zA-Z0-9.-]+\.(com|net|org|io|gov|edu|id|me|sh|app|dev)(\/[^\s]*)?)/gi

const generateId = () => Math.random().toString(36).substring(2, 7)

const parsedText = computed(() => {
  const escaped = text.value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
    
  return escaped.replace(urlRegex, (url) => {
    let href = url;
    if (!/^https?:\/\//i.test(url)) {
      href = `https://${url}`;
    }
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-600 underline decoration-blue-500/30 hover:decoration-blue-500 transition-colors">${url}</a>`;
  }).replace(/\n/g, '<br>');
})

onMounted(async () => {
  const path = window.location.pathname.slice(1)
  if (path && path.length >= 5) {
    id.value = path
    shareUrl.value = window.location.href
    await fetchDrop(path)
  } else {
    const draft = localStorage.getItem('qd_draft')
    if (draft) {
      text.value = draft
      initDrop()
    }
  }
  startPolling()
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
  if (saveTimeout) clearTimeout(saveTimeout)
})

const fetchDrop = async (dropId) => {
  isSyncing.value = true
  try {
    const res = await axios.get(`/api/get?id=${dropId}`)
    text.value = res.data.text
    if (res.data.ttl > 0) ttl.value = res.data.ttl
    localStorage.setItem('qd_draft', text.value)
  } catch (err) {
    text.value = "Drop expired or not found. Start typing..."
    setTimeout(() => {
      text.value = ""
      id.value = ""
      shareUrl.value = ""
      window.history.pushState({}, '', '/')
    }, 3000)
  } finally {
    isSyncing.value = false
  }
}

const startPolling = () => {
  if (pollInterval) clearInterval(pollInterval)
  pollInterval = setInterval(async () => {
    if (isFocused.value || !id.value) return 
    try {
      const res = await axios.get(`/api/get?id=${id.value}`)
      if (res.data.text !== text.value) {
        text.value = res.data.text
      }
      if (res.data.ttl) {
        ttl.value = res.data.ttl
      }
    } catch (e) {}
  }, 2000) 
}

const handleExpired = () => {
  text.value = ""
  id.value = ""
  shareUrl.value = ""
  localStorage.removeItem('qd_draft')
  window.history.pushState({}, '', '/')
}

const initDrop = () => {
  if (!id.value) {
    id.value = generateId()
    shareUrl.value = `${window.location.origin}/${id.value}`
    window.history.pushState({}, '', `/${id.value}`)
  }
}

const startEditing = () => {
  isFocused.value = true
  nextTick(() => textareaRef.value?.focus())
}

const handleFocus = () => isFocused.value = true
const handleBlur = () => isFocused.value = false

watch(text, (newText) => {
  if (newText.trim() === '') {
    localStorage.removeItem('qd_draft')
    if (id.value) {
      axios.post('/api/drop', { id: id.value, text: '' }).catch(() => {})
      id.value = ''
      shareUrl.value = ''
      window.history.pushState({}, '', '/')
    }
    return
  }

  localStorage.setItem('qd_draft', newText)
  
  if (newText.trim() && !id.value) initDrop()
  
  if (id.value && isFocused.value) {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      isSyncing.value = true
      axios.post('/api/drop', { id: id.value, text: newText })
        .finally(() => isSyncing.value = false)
    }, 500)
  }
}, { immediate: true })
</script>

<template>
  <div class="min-h-screen bg-white flex flex-col items-center justify-center p-8 md:p-24 selection:bg-blue-100 relative overflow-hidden">
    <!-- Top Progress Bar -->
    <div 
      class="fixed top-0 left-0 h-[2px] bg-blue-500 transition-all duration-500 ease-out z-[100]"
      :style="{ width: isSyncing ? '100%' : '0%', opacity: isSyncing ? '1' : '0' }"
    ></div>

    <div 
      v-show="!isFocused && text.length > 0" 
      @click="startEditing"
      class="w-full h-full flex-1 text-lg md:text-xl font-light text-slate-800 cursor-text transition-all duration-700 break-words whitespace-pre-wrap outline-none"
      v-html="parsedText"
    ></div>

    <textarea
      v-show="isFocused || text.length === 0"
      ref="textareaRef"
      v-model="text"
      @focus="handleFocus"
      @blur="handleBlur"
      placeholder="Start typing..."
      class="w-full h-full flex-1 bg-transparent border-none outline-none resize-none text-lg md:text-xl font-light text-slate-800 placeholder:text-slate-200 transition-all duration-700"
      spellcheck="false"
      autofocus
    ></textarea>

    <Transition name="slide-up">
      <QRCodeDisplay 
        v-if="shareUrl" 
        :value="shareUrl" 
        :initial-ttl="ttl" 
        @expired="handleExpired"
      />
    </Transition>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>

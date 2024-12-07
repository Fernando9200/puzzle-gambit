// src/pages/results-page.vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { sessionStorage } from '@/services/sessionStorage'
import SessionResultsDisplay from '@/components/SessionResultsDisplay.vue'
import type { SessionResult } from '@/services/sessionStorage'

const results = ref<SessionResult[]>([])

onMounted(() => {
  results.value = sessionStorage.getAllSessions()
})

definePage({
  meta: {
    icon: 'mdi-chart-box',
    title: 'Results',
    drawerIndex: 12,
  },
})
</script>

<template>
  <div class="wrapper full-size">
    <SessionResultsDisplay :results="results" @update:results="newResults => results = newResults" />
  </div>
</template>

<style scoped>
.full-size {
  width: 100%;
  height: 100%;
  overflow: auto;
}
</style>

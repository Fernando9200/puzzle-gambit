<script setup lang="ts">
import { ref, computed } from 'vue'
import { type SessionResult, sessionStorage } from '@/services/sessionStorage'

const props = defineProps<{
  results: SessionResult[]
}>()

const emit = defineEmits(['update:results'])

const sortKey = ref<keyof SessionResult>('date')
const sortDesc = ref(true)
const showConfirmDialog = ref(false)

const sortedResults = computed(() => {
  return [...props.results].sort((a, b) => {
    if (sortDesc.value) {
      return b[sortKey.value] > a[sortKey.value] ? 1 : -1
    }
    return a[sortKey.value] > b[sortKey.value] ? 1 : -1
  })
})

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }
  return new Intl.DateTimeFormat('en-US', options).format(date)
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m ${seconds % 60}s`
}

function getSkillLevelName(level: number): string {
  const levels = {
    0: '0-500',
    1: '500-1000',
    2: '1000-1500',
    3: '1500-2000',
    4: '2000-2500',
    5: '2500-3000',
    6: '3000-3500'
  }
  return levels[level as keyof typeof levels] || 'Unknown'
}

function toggleSort(key: keyof SessionResult) {
  if (sortKey.value === key) {
    sortDesc.value = !sortDesc.value
  } else {
    sortKey.value = key
    sortDesc.value = true
  }
}

function deleteSession(id: string) {
  sessionStorage.deleteSession(id)
  emit('update:results', sessionStorage.getAllSessions())
}

function clearAllSessions() {
  showConfirmDialog.value = false
  sessionStorage.clearAllSessions()
  emit('update:results', [])
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 90) return 'success'
  if (accuracy >= 70) return 'info'
  if (accuracy >= 50) return 'warning'
  return 'error'
}
</script>

<template>
  <v-card class="session-results" elevation="3">
    <v-card-title class="d-flex justify-space-between align-center pa-6">
      <div class="d-flex align-center">
        <v-icon color="primary" class="mr-2">mdi-history</v-icon>
        <span class="text-h5">Training Session History</span>
      </div>
      <v-btn color="error" variant="outlined" @click="showConfirmDialog = true" :disabled="!results.length"
        elevation="2" rounded>
        <v-icon start>mdi-delete-sweep</v-icon>
        Clear All Results
      </v-btn>
    </v-card-title>

    <v-card-text class="pa-0">
      <v-table v-if="results.length" class="results-table">
        <thead>
          <tr>
            <th v-for="(header, key) in {
              date: 'Date & Time',
              skillLevel: 'Skill Level',
              totalTime: 'Duration',
              puzzlesSolved: 'Solved',
              puzzlesFailed: 'Failed',
              accuracyRate: 'Accuracy'
            }" :key="key" @click="toggleSort(key as keyof SessionResult)" class="sortable-header">
              <div class="d-flex align-center">
                <span>{{ header }}</span>
                <v-icon v-if="sortKey === key" :icon="sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up'" size="small"
                  class="ml-1" />
              </div>
            </th>
            <th class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="result in sortedResults" :key="result.id" class="result-row">
            <td class="text-no-wrap">{{ formatDate(result.date) }}</td>
            <td>
              <v-chip
                :color="['success', 'info', 'warning', 'error', 'purple', 'orange', 'deep-orange'][result.skillLevel]"
                size="small" variant="outlined" class="font-weight-medium">
                {{ getSkillLevelName(result.skillLevel) }}
              </v-chip>
            </td>
            <td>{{ formatTime(result.totalTime) }}</td>
            <td class="text-success font-weight-medium">{{ result.puzzlesSolved }}</td>
            <td class="text-error font-weight-medium">{{ result.puzzlesFailed }}</td>
            <td>
              <v-chip :color="getAccuracyColor(result.accuracyRate)" size="small" class="font-weight-medium">
                {{ result.accuracyRate.toFixed(1) }}%
              </v-chip>
            </td>
            <td class="text-center">
              <v-btn icon="mdi-delete" size="small" color="error" variant="text" @click="deleteSession(result.id)"
                class="delete-btn" />
            </td>
          </tr>
        </tbody>
      </v-table>
      <div v-else class="empty-state pa-8 text-center">
        <v-icon color="grey" size="48" class="mb-4">mdi-chess</v-icon>
        <div class="text-h6 text-grey mb-2">No training sessions recorded yet</div>
        <div class="text-body-1 text-grey-darken-1">Complete some puzzles to see your progress here</div>
      </div>
    </v-card-text>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="showConfirmDialog" max-width="400">
      <v-card class="confirmation-dialog">
        <v-card-title class="text-h6">
          <v-icon color="error" class="mr-2">mdi-alert</v-icon>
          Clear All Results
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete all training session results? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="showConfirmDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" variant="text" @click="clearAllSessions">
            Clear All
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped>
.session-results {
  background: rgba(30, 30, 30, 0.8) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin: 20px;
}

.results-table {
  background: transparent !important;
}

.sortable-header {
  cursor: pointer;
  user-select: none;
  padding: 0.75rem 1rem !important;
  color: rgba(255, 255, 255, 0.87);
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.sortable-header:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.result-row {
  transition: background-color 0.2s ease;
}

.result-row:hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

.result-row td {
  padding: 0.75rem 1rem !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
}

.delete-btn {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.delete-btn:hover {
  opacity: 1;
}

.confirmation-dialog {
  background: rgba(30, 30, 30, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.empty-state {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>

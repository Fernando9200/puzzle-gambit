// src/components/SessionResultsDisplay.vue
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
  return new Date(dateStr).toLocaleDateString()
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
</script>

<template>
  <v-card outlined class="session-results">
    <v-card-title class="d-flex justify-space-between align-center">
      <span class="text-h5">Training Session History</span>
      <v-btn color="error" variant="outlined" @click="showConfirmDialog = true" :disabled="!results.length">
        Clear All Results
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-table v-if="results.length">
        <thead>
          <tr>
            <th @click="toggleSort('date')" class="sortable">
              Date
              <v-icon v-if="sortKey === 'date'" :icon="sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up'" />
            </th>
            <th @click="toggleSort('skillLevel')" class="sortable">
              Skill Level
              <v-icon v-if="sortKey === 'skillLevel'" :icon="sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up'" />
            </th>
            <th @click="toggleSort('totalTime')" class="sortable">
              Duration
              <v-icon v-if="sortKey === 'totalTime'" :icon="sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up'" />
            </th>
            <th @click="toggleSort('puzzlesSolved')" class="sortable">
              Solved
              <v-icon v-if="sortKey === 'puzzlesSolved'" :icon="sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up'" />
            </th>
            <th @click="toggleSort('puzzlesFailed')" class="sortable">
              Failed
              <v-icon v-if="sortKey === 'puzzlesFailed'" :icon="sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up'" />
            </th>
            <th @click="toggleSort('accuracyRate')" class="sortable">
              Accuracy
              <v-icon v-if="sortKey === 'accuracyRate'" :icon="sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up'" />
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="result in sortedResults" :key="result.id">
            <td>{{ formatDate(result.date) }}</td>
            <td>{{ getSkillLevelName(result.skillLevel) }}</td>
            <td>{{ formatTime(result.totalTime) }}</td>
            <td>{{ result.puzzlesSolved }}</td>
            <td>{{ result.puzzlesFailed }}</td>
            <td>{{ result.accuracyRate.toFixed(1) }}%</td>
            <td>
              <v-btn icon="mdi-delete" size="small" color="error" variant="text" @click="deleteSession(result.id)" />
            </td>
          </tr>
        </tbody>
      </v-table>
      <div v-else class="text-center pa-4">
        No training sessions recorded yet.
      </div>
    </v-card-text>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="showConfirmDialog" max-width="400px">
      <v-card>
        <v-card-title>Clear All Results</v-card-title>
        <v-card-text>
          Are you sure you want to delete all training session results? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="showConfirmDialog = false">
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
  margin: 20px;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: rgba(0, 0, 0, 0.1);
}
</style>

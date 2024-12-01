<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import ChessPuzzle from './ChessPuzzle.vue'
import { VProgressLinear } from 'vuetify/components'

interface BasePuzzleData {
  PuzzleId: string;
  FEN: string;
  Moves: string;
  Rating: number;
  RatingDeviation: number;
  Popularity: number;
  NbPlays: number;
  Themes: string;
  GameUrl: string;
  OpeningTags: string | null;
  originalLevel?: number;
  originalIndex?: number;
  [key: string]: any;
}

interface ExtendedPuzzleData extends BasePuzzleData {
  originalLevel: number;
  originalIndex: number;
}

const props = defineProps({
  level: {
    type: Number,
    required: true,
  },
  puzzleCollection: {
    type: Array as () => BasePuzzleData[],
    required: true,
  },
})

const failedPuzzles = ref<ExtendedPuzzleData[]>([])
const currentPuzzleIndex = ref(0)
const puzzleRef = ref<InstanceType<typeof ChessPuzzle> | null>(null)
const allowClue = ref(false)
const errorOccurred = ref(false)
const successOccurred = ref(false)
const zenMode = ref(false)

// Progress tracking
const totalPuzzles = ref(0)
const solvedPuzzlesCount = ref(0)

// Computed properties for progress tracking
const remainingPuzzles = computed(() => failedPuzzles.value.length)
const progressPercentage = computed(() => {
  if (totalPuzzles.value === 0) return 0
  const percentage = (solvedPuzzlesCount.value / totalPuzzles.value) * 100
  return Math.min(percentage, 100) // Ensure it doesn't exceed 100%
})

onMounted(() => {
  loadFailedPuzzles()
})

const loadFailedPuzzles = () => {
  // The puzzles are now already loaded with their original level and index
  failedPuzzles.value = props.puzzleCollection as ExtendedPuzzleData[]

  // Initialize progress tracking
  totalPuzzles.value = failedPuzzles.value.length
  solvedPuzzlesCount.value = 0
}

const nextPuzzle = () => {
  if (currentPuzzleIndex.value < failedPuzzles.value.length - 1) {
    currentPuzzleIndex.value++
    allowClue.value = false
  }
}

const previousPuzzle = () => {
  if (currentPuzzleIndex.value > 0) {
    currentPuzzleIndex.value--
    allowClue.value = false
  }
}

async function showError() {
  errorOccurred.value = true
  await new Promise((resolve) => setTimeout(resolve, 1000))
  errorOccurred.value = false
}

async function showSuccess() {
  successOccurred.value = true
  await new Promise((resolve) => setTimeout(resolve, 1000))
  successOccurred.value = false
}

const handleFailure = () => {
  console.log('Puzzle failed in review mode')
  allowClue.value = true
  showError()
}

const puzzleSolved = () => {
  console.log('Puzzle solved in review mode')
  showSuccess()

  solvedPuzzlesCount.value++

  const currentPuzzle = failedPuzzles.value[currentPuzzleIndex.value]
  const level = currentPuzzle.originalLevel

  // Get the failed puzzles for the specific level
  const failedPuzzleIndices = JSON.parse(localStorage.getItem(`failedPuzzles_${level}`) || '[]') as number[]
  const updatedIndices = failedPuzzleIndices.filter(index => index !== currentPuzzle.originalIndex)

  // Update the localStorage for the specific level
  localStorage.setItem(`failedPuzzles_${level}`, JSON.stringify(updatedIndices))

  // Remove puzzle from current view
  failedPuzzles.value.splice(currentPuzzleIndex.value, 1)

  if (currentPuzzleIndex.value >= failedPuzzles.value.length && currentPuzzleIndex.value > 0) {
    currentPuzzleIndex.value = Math.max(0, failedPuzzles.value.length - 1)
  }

  allowClue.value = false
}

const removePuzzle = () => {
  const currentPuzzle = failedPuzzles.value[currentPuzzleIndex.value]
  const level = currentPuzzle.originalLevel

  // Get the failed puzzles for the specific level
  const failedPuzzleIndices = JSON.parse(localStorage.getItem(`failedPuzzles_${level}`) || '[]') as number[]
  const updatedIndices = failedPuzzleIndices.filter(index => index !== currentPuzzle.originalIndex)

  // Update the localStorage for the specific level
  localStorage.setItem(`failedPuzzles_${level}`, JSON.stringify(updatedIndices))

  failedPuzzles.value.splice(currentPuzzleIndex.value, 1)
  totalPuzzles.value -= 1

  if (currentPuzzleIndex.value >= failedPuzzles.value.length && currentPuzzleIndex.value > 0) {
    currentPuzzleIndex.value = Math.max(0, failedPuzzles.value.length - 1)
  }
}

const clearFailedPuzzles = () => {
  // Clear failed puzzles from all levels
  for (let level = 0; level <= 6; level++) {
    localStorage.setItem(`failedPuzzles_${level}`, '[]')
  }

  failedPuzzles.value = []
  currentPuzzleIndex.value = 0
  solvedPuzzlesCount.value = 0
  totalPuzzles.value = 0
}

const sendClue = () => {
  if (puzzleRef.value) {
    puzzleRef.value.clue()
  }
}
</script>

<template>
  <v-container class="training" fluid>
    <v-row class="training" justify="center">
      <!-- Empty State: No Failed Puzzles -->
      <template v-if="failedPuzzles.length === 0">
        <v-col cols="12" class="text-center">
          <v-card class="pa-4 text-center empty-state">
            <v-card-text>
              <p class="text-h6 mb-2">No failed puzzles yet</p>
              <p class="text-body-1">Puzzles you get wrong will appear here for review</p>
            </v-card-text>
          </v-card>
        </v-col>
      </template>

      <!-- Main Interface: Displayed When There Are Failed Puzzles -->
      <template v-else>
        <!-- Left Column -->
        <v-col sm="6" md="3" cols="12" class="text-center" v-show="!zenMode">
          <v-card outlined class="mb-4">
            <v-card-title class="text-h6">Failed Puzzles Review</v-card-title>
            <v-card-subtitle>Practice the puzzles you got wrong</v-card-subtitle>
            <v-card-text>
              <v-btn color="white" @click="clearFailedPuzzles" class="ma-2" elevation="5" rounded x-large
                style="border: 2px solid white; background-color: rgba(0, 0, 0, 0.5);">
                <v-icon start>mdi-delete</v-icon>
                Clear All
              </v-btn>
            </v-card-text>
          </v-card>

          <!-- Enhanced Progress Card -->
          <v-card outlined class="progress-card mb-4">
            <v-card-title class="text-h6">Progress Dashboard</v-card-title>
            <v-card-text>
              <v-progress-linear :model-value="progressPercentage" max="100" color="success" height="20" rounded
                class="my-4">
                <template #default>
                  <strong>{{ Math.round(progressPercentage) }}%</strong>
                </template>
              </v-progress-linear>

              <!-- Stats Grid -->
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value success--text">{{ solvedPuzzlesCount }}</div>
                  <div class="stat-label">Solved</div>
                </div>

                <div class="stat-item">
                  <div class="stat-value error--text">{{ remainingPuzzles }}</div>
                  <div class="stat-label">Remaining</div>
                </div>

                <div class="stat-item">
                  <div class="stat-value primary--text">{{ totalPuzzles }}</div>
                  <div class="stat-label">Total</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Center Column - Chess Board -->
        <v-col sm="8" md="5" cols="12" class="board-container">
          <div class="board-wrapper">
            <ChessPuzzle ref="puzzleRef" :puzzle-data="failedPuzzles[currentPuzzleIndex]"
              :key="failedPuzzles[currentPuzzleIndex].PuzzleId" @failure="handleFailure" @solved="puzzleSolved" />
          </div>

          <!-- Navigation Controls -->
          <v-card class="navigation-controls mt-4">
            <v-card-text class="d-flex justify-space-between align-center py-2">
              <v-btn :disabled="currentPuzzleIndex === 0" @click="previousPuzzle" color="white" variant="outlined"
                elevation="5" rounded style="border: 2px solid white; background-color: rgba(0, 0, 0, 0.5);">
                <v-icon start>mdi-chevron-left</v-icon>
                Previous
              </v-btn>

              <span class="text-body-1 mx-4">
                {{ currentPuzzleIndex + 1 }} / {{ failedPuzzles.length }}
              </span>

              <v-btn :disabled="currentPuzzleIndex === failedPuzzles.length - 1" @click="nextPuzzle" color="white"
                variant="outlined" elevation="5" rounded
                style="border: 2px solid white; background-color: rgba(0, 0, 0, 0.5);">
                Next
                <v-icon end>mdi-chevron-right</v-icon>
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Right Column -->
        <v-col sm="6" md="3" cols="12" class="text-center" v-show="!zenMode">
          <v-card outlined class="mb-4">
            <v-card-title class="text-h6">Actions</v-card-title>
            <v-card-text class="d-flex flex-column gap-2">
              <v-btn color="white" :href="`https://lichess.org/training/${failedPuzzles[currentPuzzleIndex].PuzzleId}`"
                class="ma-2" elevation="5" rounded x-large
                style="border: 2px solid white; background-color: rgba(0, 0, 0, 0.5);" target="_blank">
                <v-icon start>mdi-chess-knight</v-icon>
                Open on Lichess
              </v-btn>

              <v-btn :disabled="!allowClue" color="white" @click="sendClue" class="ma-2" elevation="5" rounded x-large
                style="border: 2px solid white; background-color: rgba(0, 0, 0, 0.5);">
                <v-icon start>mdi-lightbulb</v-icon>
                Show Clue
              </v-btn>

              <v-btn color="white" @click="removePuzzle" class="ma-2" elevation="5" rounded x-large
                style="border: 2px solid white; background-color: rgba(0, 0, 0, 0.5);">
                <v-icon start>mdi-close</v-icon>
                Remove Puzzle
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Zen Mode Button -->
        <v-col cols="12" class="text-center">
          <v-btn color="white" variant="outlined" @click="zenMode = !zenMode" elevation="5" rounded
            style="border: 2px solid white; background-color: rgba(0, 0, 0, 0.5);">
            {{ zenMode ? 'Exit Zen Mode' : 'Enter Zen Mode' }}
          </v-btn>
        </v-col>
      </template>
    </v-row>
  </v-container>
</template>

<style scoped>
html,
body,
#app,
.v-application,
.v-container {
  height: 100%;
  overflow-y: auto;
}

.board-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
}

.board-wrapper {
  width: 100%;
  max-width: 600px;
  aspect-ratio: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.text-center {
  text-align: center;
  margin-top: 0;
}

.training {
  margin-top: 1vh;
  overflow-y: auto;
}

.navigation-controls {
  width: 100%;
  max-width: 500px;
  background-color: transparent;
  box-shadow: none;
}

.empty-state {
  max-width: 400px;
  margin: auto;
}

.progress-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.stat-item {
  text-align: center;
  padding: 0.5rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.8;
}

@media (max-width: 600px) {
  .board-wrapper {
    max-width: 100%;
    padding: 0 16px;
  }

  .navigation-controls {
    padding: 0.5rem;
  }

  .stats-grid {
    gap: 0.5rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }
}
</style>

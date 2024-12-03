<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import ChessPuzzle from './ChessPuzzle.vue'
import { VProgressLinear } from 'vuetify/components'
import puzzles0_500 from '@/puzzles/ratings_0_500.json'
import puzzles500_1000 from '@/puzzles/ratings_500_1000.json'
import puzzles1000_1500 from '@/puzzles/ratings_1000_1500.json'
import puzzles1500_2000 from '@/puzzles/ratings_1500_2000.json'
import puzzles2000_2500 from '@/puzzles/ratings_2000_2500.json'
import puzzles2500_3000 from '@/puzzles/ratings_2500_3000.json'
import puzzles3000_3500 from '@/puzzles/ratings_3000_3500.json'

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

// Get all puzzle collections
const puzzleCollections: Record<number, BasePuzzleData[]> = {
  0: puzzles0_500 as BasePuzzleData[],
  1: puzzles500_1000 as BasePuzzleData[],
  2: puzzles1000_1500 as BasePuzzleData[],
  3: puzzles1500_2000 as BasePuzzleData[],
  4: puzzles2000_2500 as BasePuzzleData[],
  5: puzzles2500_3000 as BasePuzzleData[],
  6: puzzles3000_3500 as BasePuzzleData[],
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
const totalPuzzles = ref(0)
const solvedPuzzlesCount = ref(0)
const showInfoModal = ref(false)

const remainingPuzzles = computed(() => failedPuzzles.value.length)
const progressPercentage = computed(() => {
  if (totalPuzzles.value === 0) return 0
  const percentage = (solvedPuzzlesCount.value / totalPuzzles.value) * 100
  return Math.min(percentage, 100)
})

const currentPuzzleSkillLevel = computed(() => {
  const rating = failedPuzzles.value[currentPuzzleIndex.value]?.Rating || 0

  if (rating < 500) return { level: 'Beginner', color: 'green' }
  if (rating < 1000) return { level: 'Novice', color: 'light-green' }
  if (rating < 1500) return { level: 'Intermediate', color: 'blue' }
  if (rating < 2000) return { level: 'Advanced', color: 'purple' }
  if (rating < 2500) return { level: 'Expert', color: 'orange' }
  if (rating < 3000) return { level: 'Master', color: 'deep-orange' }
  return { level: 'Grandmaster', color: 'red' }
})

onMounted(() => {
  loadFailedPuzzles()
})

const loadFailedPuzzles = () => {
  failedPuzzles.value = props.puzzleCollection as ExtendedPuzzleData[]
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

  const failedPuzzleIndices = JSON.parse(localStorage.getItem(`failedPuzzles_${level}`) || '[]') as number[]
  const updatedIndices = failedPuzzleIndices.filter(index => index !== currentPuzzle.originalIndex)

  localStorage.setItem(`failedPuzzles_${level}`, JSON.stringify(updatedIndices))

  failedPuzzles.value.splice(currentPuzzleIndex.value, 1)

  if (currentPuzzleIndex.value >= failedPuzzles.value.length && currentPuzzleIndex.value > 0) {
    currentPuzzleIndex.value = Math.max(0, failedPuzzles.value.length - 1)
  }

  allowClue.value = false
}

const removePuzzle = () => {
  const currentPuzzle = failedPuzzles.value[currentPuzzleIndex.value]
  const level = currentPuzzle.originalLevel

  const failedPuzzleIndices = JSON.parse(localStorage.getItem(`failedPuzzles_${level}`) || '[]') as number[]
  const updatedIndices = failedPuzzleIndices.filter(index => index !== currentPuzzle.originalIndex)

  localStorage.setItem(`failedPuzzles_${level}`, JSON.stringify(updatedIndices))

  failedPuzzles.value.splice(currentPuzzleIndex.value, 1)
  totalPuzzles.value -= 1

  if (currentPuzzleIndex.value >= failedPuzzles.value.length && currentPuzzleIndex.value > 0) {
    currentPuzzleIndex.value = Math.max(0, failedPuzzles.value.length - 1)
  }
}

const clearFailedPuzzles = () => {
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

definePage({
  meta: {
    icon: 'mdi-alert-circle',
    title: 'Failed Puzzles',
    drawerIndex: 7,
  },
})
</script>

<template>
  <v-container class="training" fluid>
    <v-row class="training" justify="center">
      <!-- Empty State -->
      <template v-if="failedPuzzles.length === 0">
        <v-col cols="12" class="text-center">
          <v-card class="empty-state" elevation="3">
            <v-card-text>
              <p class="text-h6 mb-2">No failed puzzles yet</p>
              <p class="text-body-1">Puzzles you get wrong will appear here for review</p>
            </v-card-text>
          </v-card>
        </v-col>
      </template>

      <!-- Main Interface -->
      <template v-else>
        <!-- Left Column -->
        <v-col sm="6" md="3" cols="12" class="text-center" v-show="!zenMode">
          <div class="cards-container">
            <v-card class="mb-4 stats-card" elevation="3">
              <v-card-title class="d-flex align-center justify-center">
                <v-icon left color="primary" class="mr-2">mdi-alert-circle</v-icon>
                Failed Puzzles Review
              </v-card-title>
              <v-card-subtitle>Practice the puzzles you got wrong</v-card-subtitle>
              <v-card-actions class="action-buttons">
                <v-btn color="error" @click="clearFailedPuzzles" class="action-button" elevation="5" rounded x-large>
                  <v-icon start>mdi-delete</v-icon>
                  Clear All
                </v-btn>
              </v-card-actions>
            </v-card>

            <v-card class="mb-4 progress-card" elevation="3">
              <v-card-title class="d-flex align-center justify-center">
                <v-icon left color="primary" class="mr-2">mdi-chart-line</v-icon>
                Progress Dashboard
              </v-card-title>
              <v-card-text>
                <v-progress-linear :model-value="progressPercentage" color="success" height="20" rounded class="my-4">
                  <template #default>
                    <strong>{{ Math.round(progressPercentage) }}%</strong>
                  </template>
                </v-progress-linear>

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
            <v-card class="navigation-controls mt-4" elevation="3">
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
          </div>
        </v-col>

        <!-- Center Column - Chess Board -->
        <v-col sm="8" md="5" cols="12" class="board-container">
          <div class="board-wrapper">
            <ChessPuzzle ref="puzzleRef" :puzzle-data="failedPuzzles[currentPuzzleIndex]"
              :key="failedPuzzles[currentPuzzleIndex].PuzzleId" @failure="handleFailure" @solved="puzzleSolved"
              class="chess-board" />
          </div>
        </v-col>

        <!-- Right Column -->
        <v-col sm="6" md="3" cols="12" class="text-center" v-show="!zenMode">
          <div class="cards-container">
            <v-card class="mb-4 level-card" elevation="3">
              <v-card-title class="d-flex align-center justify-center">
                <v-icon left color="primary" class="mr-2">mdi-chess-queen</v-icon>
                Puzzle Info
              </v-card-title>
              <v-card-text>
                <div class="level-display">
                  <div class="text-h4 mb-2" :class="`${currentPuzzleSkillLevel.color}--text`">
                    {{ currentPuzzleSkillLevel.level }}
                  </div>
                  <div class="text-h6">
                    Rating: {{ failedPuzzles[currentPuzzleIndex].Rating }}
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <v-card class="mb-4 action-card" elevation="3">
              <v-card-text>
                <v-card-actions class="action-buttons">
                  <v-btn color="info"
                    :href="`https://lichess.org/training/${failedPuzzles[currentPuzzleIndex].PuzzleId}`"
                    class="action-button" elevation="2" rounded target="_blank">
                    <v-icon left>mdi-chess-knight</v-icon>
                    Open on Lichess
                  </v-btn>

                  <v-btn :disabled="!allowClue" color="warning" @click="sendClue()" class="action-button" elevation="2"
                    rounded>
                    <v-icon left>mdi-lightbulb</v-icon>
                    Clue
                  </v-btn>

                  <v-btn color="error" @click="removePuzzle" class="action-button" elevation="2" rounded>
                    <v-icon left>mdi-close</v-icon>
                    Remove Puzzle
                  </v-btn>
                </v-card-actions>
              </v-card-text>
            </v-card>
          </div>
        </v-col>

        <!-- Zen Mode Toggle -->
        <v-col cols="12" class="text-center">
          <v-btn color="white" variant="outlined" @click="zenMode = !zenMode" class="zen-toggle" elevation="5" rounded
            style="border: 2px solid white; background-color: rgba(0, 0, 0, 0.5);">
            <v-icon start>{{ zenMode ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
            {{ zenMode ? 'Exit Zen Mode' : 'Enter Zen Mode' }}
          </v-btn>
        </v-col>
      </template>
    </v-row>
  </v-container>
</template>

<style scoped>
.v-container {
  height: 100%;
  overflow-y: auto;
  /* Ensure the container allows vertical scrolling */
}

.training {
  min-height: 100vh;
  padding: 0.5rem;
  width: 100%;
}

.cards-container {
  position: sticky;
  top: 2rem;
  padding-top: 0.85rem;
  /* Changed from 2rem to 1rem */
}

.stats-card,
.action-card,
.progress-card,
.level-card,
.navigation-controls {
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.empty-state {
  max-width: 400px;
  margin: auto;
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.board-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-top: 2.3rem;
  /* Changed from 2.7rem to 1.7rem to maintain consistency */
}

.board-wrapper {
  width: 100%;
  max-width: 600px;
  aspect-ratio: 1;
}

.chess-board {
  width: 100%;
  max-width: 600px;
  aspect-ratio: 1;
}

.level-display {
  text-align: center;
  padding: 1rem;
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

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
}

.action-button {
  width: 100%;
  height: 40px;
}

.navigation-controls {
  width: 100%;
  max-width: 500px;
  margin-top: 1rem;
}

.zen-toggle {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  min-width: 180px;
}

.v-btn {
  height: 35px !important;
  transition: all 0.3s ease;
}

.v-btn:not(:disabled):hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.v-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .board-container {
    padding-top: 1rem;
  }

  .cards-container {
    position: static;
    padding-top: 1rem;
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

  .action-buttons {
    gap: 0.5rem;
  }

  .zen-toggle {
    bottom: 0.5rem;
  }

  .navigation-controls {
    padding: 0.5rem;
  }

  .v-btn {
    height: 36px !important;
  }
}

.counter-text {
  font-size: 1.5rem;
  font-weight: bold;
}

.success-counter,
.error-counter {
  transition: transform 0.3s ease;
}

.success-counter {
  transform: scale(1.1);
}

.error-counter {
  transform: scale(1.1);
}
</style>

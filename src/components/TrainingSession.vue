<script setup lang="ts">
import ChessPuzzle from './ChessPuzzle.vue'
import { ref, onMounted, nextTick, watch, computed, onBeforeUnmount } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import '@datadog/browser-logs/bundle/datadog-logs'
import { useToggle, useDark } from '@vueuse/core'
import { useRoute } from 'vue-router'
import { sessionStorage } from '@/services/sessionStorage'

// Initialize theme and dark mode
const theme = useTheme()
const showNavIcon = ref(false)
const route = useRoute()

// Compute breadcrumbs from the route
const breadcrumbs = computed(() => {
  return route!.matched
    .slice(1)
    .filter(
      (item) =>
        item.meta && item.meta.title && !(item.meta?.breadcrumb === 'hidden'),
    )
    .map((r) => ({
      title: r.meta.title!,
      disabled:
        r.meta?.breadcrumb === 'disabled' || r.path === route.path || false,
      to: r.path,
    }))
})

const currentPuzzleSkillLevel = computed(() => {
  const puzzle = props.puzzleColection[currentPuzzle.value] as any
  const rating = puzzle?.Rating || 0

  if (rating < 500) return { level: 'Beginner', color: 'green' }
  if (rating < 1000) return { level: 'Novice', color: 'light-green' }
  if (rating < 1500) return { level: 'Intermediate', color: 'blue' }
  if (rating < 2000) return { level: 'Advanced', color: 'purple' }
  if (rating < 2500) return { level: 'Expert', color: 'orange' }
  if (rating < 3000) return { level: 'Master', color: 'deep-orange' }
  return { level: 'Grandmaster', color: 'red' }
})

// Handle theme changes
const isDark = useDark({
  onChanged(dark: boolean) {
    theme.global.name.value = dark ? 'dark' : 'light'
  },
})
isDark.value = true
const toggleDark = useToggle<true, false | null>(isDark)

// Initialize session token
const sessionToken = localStorage.getItem('sessionToken') || uuidv4()
localStorage.setItem('sessionToken', sessionToken)

// Declare global window interface for Datadog logs
declare global {
  interface Window {
    DD_LOGS: any
  }
}

// Initialize Datadog logs
window.DD_LOGS.init({
  clientToken: 'pubc17749f9323600ef9e82cfd995039870',
  site: 'us5.datadoghq.com',
  forwardErrorsToLogs: true,
  sessionSampleRate: 100,
})

// Log user connection
window.DD_LOGS.logger.info('User connected', { sessionToken: sessionToken })
console.log('User connected', { sessionToken: sessionToken })

// Define component props
const props = defineProps({
  level: {
    type: Number,
    required: true,
  },
  puzzleColection: {
    type: Array,
    required: true,
  },
})

// Define reactive variables
const auto = ref(true)
const totalErrors = ref(0)
const currentErrors = ref(0)
const allowClue = ref(false)
const errorOccurred = ref(false)
const successOccurred = ref(false)
const totalPuzzless = ref(0)
const maxIndex = props.puzzleColection.length - 1
const puzzleRankings = new Array(maxIndex).fill(-1)
const solved = ref(false)
const puzzleRef = ref()
const requiredTime = ref(0)
const currentPuzzle = ref()
const puzzleClockRef = ref({
  stop: () => {
    return 0
  },
  restart: () => {
    return 0
  },
})
const sessionClockRef = ref({
  stop: () => {
    return 0
  },
  restart: () => {
    return 0
  },
})
const zenMode = ref(false)
const showInfoModal = ref(false)

// Select the next puzzle
function nextPuzzle() {
  solved.value = false
  allowClue.value = false
  currentErrors.value = 0
  puzzleClockRef.value.restart()
  // Get an array of indices where puzzleRankings equals -1
  const unplayedPuzzles = puzzleRankings
    .map((ranking, index) => (ranking === -1 ? index : -1))
    .filter((index) => index !== -1)
  // If there are no unplayed puzzles, do nothing
  if (unplayedPuzzles.length === 0)
    Math.floor(Math.random() * puzzleRankings.length)
  // Get a random index from unplayedPuzzles
  const randomIndex = Math.floor(Math.random() * unplayedPuzzles.length)
  currentPuzzle.value = unplayedPuzzles[randomIndex]
}

// Call nextPuzzle function on component setup
nextPuzzle()

// Show error animation
async function showError() {
  errorOccurred.value = true
  await new Promise((resolve) => setTimeout(resolve, 1000))
  errorOccurred.value = false
}

// Show success animation
async function showSuccess() {
  successOccurred.value = true
  await new Promise((resolve) => setTimeout(resolve, 1000))
  successOccurred.value = false
}

// Calculate puzzle rank
function calculateRank(timeElapsed: number, moves: number, failures: number) {
  let rank = 0
  const averageTime = timeElapsed / moves
  if (failures > 1) rank = 0
  else if (failures == 1) rank = 1
  else if (averageTime < 3500) rank = 5
  else if (averageTime < 7000) rank = 4
  else if (averageTime < 10000) rank = 3
  else rank = 2
  return rank
}

// Handle puzzle failure
function handleFailure() {
  if (currentErrors.value == 0) {
    // Save current puzzle to failed puzzles list if not already there
    const failedPuzzles = JSON.parse(localStorage.getItem(`failedPuzzles_${props.level}`) || '[]')
    if (!failedPuzzles.includes(currentPuzzle.value)) {
      failedPuzzles.push(currentPuzzle.value)
      localStorage.setItem(`failedPuzzles_${props.level}`, JSON.stringify(failedPuzzles))
      console.log('Added puzzle to failed list:', {
        puzzleIndex: currentPuzzle.value,
        totalFailed: failedPuzzles.length
      })
    }

    totalErrors.value++
    showError()
  }
  currentErrors.value++
  if (currentErrors.value > 0) allowClue.value = true
  if (auto.value) nextPuzzle()
}

// Optional: Add a function to clear failed puzzles history
function clearFailedPuzzles() {
  localStorage.setItem(`failedPuzzles_${props.level}`, '[]')
  console.log('Cleared failed puzzles history')
}

// Handle puzzle solved
function puzzleSolved(moves: number, failures: number) {
  showSuccess()
  totalPuzzless.value++
  currentErrors.value = 0
  solved.value = true
  const timeElapsed = puzzleClockRef.value ? puzzleClockRef.value.stop() : 0
  requiredTime.value = timeElapsed
  puzzleRankings[currentPuzzle.value] = calculateRank(
    timeElapsed,
    moves,
    failures,
  )
  localStorage.setItem(
    `puzzleRankings_${props.level}`,
    JSON.stringify(puzzleRankings),
  )
  if (auto.value) nextPuzzle()
}

function saveCurrentSession() {
  if (totalPuzzless.value > 0 || totalErrors.value > 0) {
    const sessionTime = sessionClockRef.value.stop()
    const accuracyRate = (totalPuzzless.value / (totalPuzzless.value + totalErrors.value)) * 100

    sessionStorage.saveSession({
      skillLevel: props.level,
      totalTime: sessionTime,
      puzzlesSolved: totalPuzzless.value,
      puzzlesFailed: totalErrors.value,
      accuracyRate: accuracyRate
    })
  }
}

// Restart session
function restartSession() {
  // Save the current session before restarting
  saveCurrentSession()

  // Reset the session
  totalErrors.value = 0
  totalPuzzless.value = 0
  clearFailedPuzzles()
  sessionClockRef.value.restart()
  nextPuzzle()
}

// Send clue to puzzle
function sendClue() {
  puzzleRef.value.clue()
}

// Component mounted hook
onMounted(() => {
  nextTick(() => {
    // Force re-render to ensure the board is correctly sized
    nextPuzzle()
  })
})

onBeforeUnmount(() => {
  saveCurrentSession()
})

// Watch for touch events to show navigation icon
watchEffect(() => {
  showNavIcon.value = 'ontouchstart' in window
})

watch(() => props.level, (newLevel, oldLevel) => {
  if (oldLevel !== undefined) {  // Don't save on initial level set
    saveCurrentSession()
    // Reset for new level
    totalErrors.value = 0
    totalPuzzless.value = 0
    sessionClockRef.value.restart()
  }
})
</script>

<template>
  <v-container class="training" fluid>
    <v-row class="training" justify="center" align="start">
      <!-- Left Column -->
      <v-col sm="6" md="3" cols="12" class="text-center" v-show="!zenMode">
        <div class="cards-container">
          <v-card class="mb-4 stats-card" elevation="3">
            <v-card-title class="d-flex align-center justify-center">
              <v-icon left color="primary" class="mr-2">mdi-clock-outline</v-icon>
              Session Time
            </v-card-title>
            <v-card-text>
              <StopWatch ref="sessionClockRef" class="time-display" />
            </v-card-text>
          </v-card>

          <v-card class="mb-4 stats-card" elevation="3">
            <v-card-text class="counter-card">
              <div :class="{ 'success-counter': successOccurred }" class="counter">
                <v-icon color="success" size="32">mdi-check-circle</v-icon>
                <span class="counter-text">{{ totalPuzzless }}</span>
              </div>
              <div class="divider"></div>
              <div :class="{ 'error-counter': errorOccurred }" class="counter">
                <v-icon color="error" size="32">mdi-close-circle</v-icon>
                <span class="counter-text">{{ totalErrors }}</span>
              </div>
            </v-card-text>
          </v-card>

          <v-card class="mb-4 action-card" elevation="3">
            <v-card-actions class="action-buttons">
              <v-card-title class="d-flex align-center justify-center">
                <v-icon left color="primary" class="mr-2">mdi-lightning-bolt</v-icon>
                Actions
              </v-card-title>
              <v-btn color="primary" @click="restartSession()" class="action-button" elevation="2" rounded>
                <v-icon left>mdi-restart</v-icon>
                Restart Session
              </v-btn>

              <v-btn color="warning" to="/failed-puzzles" class="action-button" elevation="2" rounded>
                <v-icon left>mdi-alert-circle</v-icon>
                Failed Puzzles
              </v-btn>

              <v-btn color="info"
                :href="`https://lichess.org/training/${(puzzleColection[currentPuzzle] as any).PuzzleId}`"
                class="action-button" elevation="2" rounded target="_blank">
                <v-icon left>mdi-chess-knight</v-icon>
                Open on Lichess
              </v-btn>
            </v-card-actions>
          </v-card>

          <v-card class="social-card" elevation="3">
            <v-card-text class="d-flex justify-center">
              <v-btn icon="mdi-information" class="mx-2" variant="text" @click="showInfoModal = true" size="x-large">
              </v-btn>
              <v-btn icon="mdi-github" class="mx-2" variant="text" href="https://github.com/Fernando9200/chess"
                target="_blank" size="x-large">
              </v-btn>
              <v-btn icon="mdi-linkedin" class="mx-2" variant="text"
                href="https://www.linkedin.com/in/fernando-carretto/" target="_blank" size="x-large">
              </v-btn>
            </v-card-text>
          </v-card>
        </div>
      </v-col>

      <!-- Chess Board Column -->
      <v-col sm="8" md="5" cols="12" class="board-container">
        <ChessPuzzle ref="puzzleRef" @failure="handleFailure" @solved="puzzleSolved"
          :key="(puzzleColection[currentPuzzle] as any).PuzzleId" :puzzle-data="puzzleColection[currentPuzzle] as any"
          class="chess-board" />
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
                  Rating: {{ (puzzleColection[currentPuzzle] as any)?.Rating }}
                </div>
              </div>
            </v-card-text>
          </v-card>

          <v-card class="mb-4 settings-card" elevation="3">
            <v-card-title class="d-flex align-center justify-center">
              <v-icon left class="mr-2">mdi-cog</v-icon>
              Settings
            </v-card-title>
            <v-card-text>
              <div class="d-flex justify-space-around align-center">
                <v-switch v-model="auto" label="Auto Next" inset color="primary" />

              </div>
            </v-card-text>
          </v-card>

          <v-card class="mb-4 puzzle-time-card" elevation="3">
            <v-card-title class="d-flex align-center justify-center">
              <v-icon left class="mr-2">mdi-timer-outline</v-icon>
              Puzzle Time
            </v-card-title>
            <v-card-text>
              <StopWatch ref="puzzleClockRef" class="time-display" />
            </v-card-text>
          </v-card>

          <v-card class="control-card" elevation="3">
            <v-card-actions class="d-flex justify-space-around">
              <v-btn :disabled="!solved" color="white" @click="nextPuzzle()" elevation="2" rounded>
                <v-icon left>mdi-arrow-right-bold</v-icon>
                Next
              </v-btn>

              <v-btn :disabled="!allowClue" color="warning" @click="sendClue()" elevation="2" rounded>
                <v-icon left>mdi-lightbulb</v-icon>
                Clue
              </v-btn>
            </v-card-actions>
          </v-card>
        </div>
      </v-col>
    </v-row>

    <!-- Zen Mode Toggle -->
    <v-btn color="gray" variant="outlined" @click="zenMode = !zenMode" class="zen-toggle">
      <v-icon left>{{ zenMode ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
      {{ zenMode ? 'Exit Zen Mode' : 'Enter Zen Mode' }}
    </v-btn>

    <!-- Info Modal -->
    <v-dialog v-model="showInfoModal" max-width="600">
      <v-card class="info-modal" elevation="3">
        <v-card-title class="headline">Info</v-card-title>
        <v-card-text>
          This app uses chess puzzles from the Lichess database to help you improve your tactical skills. You can pick
          your skill level and stick with it, allowing you to practice as much as you need at a difficulty that feels
          right for you. Unlike Lichess, which automatically adjusts your level and sometimes pushes you into puzzles
          that are too challenging, this app focuses on steady, targeted improvement. By training at your own pace,
          you can see real progress in your tactics.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="showInfoModal = false" rounded elevation="2">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<style scoped>
.training {
  min-height: 100vh;
  padding: 0.5rem;
}

.cards-container {
  position: sticky;
  top: 2rem;
  /* Increased space from top */
  padding-top: 2rem;
  /* Added padding to match board spacing */
}

.stats-card,
.action-card,
.social-card,
.level-card,
.settings-card,
.puzzle-time-card,
.control-card {
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.counter-card {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 1rem;
}

.info-modal {
  background: rgba(0, 0, 0, 0.95) !important;
  /* Black background with high opacity */
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.counter-text {
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 0.5rem;
}

.divider {
  width: 1px;
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 1rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
}

.action-button {
  width: 100%;
  height: 48px;
}

.board-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 2.9rem;
  /* Increased space from top to match cards */
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

.time-display {
  font-family: 'Roboto Mono', monospace;
  font-size: 1.5rem;
  font-weight: bold;
}

.zen-toggle {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  min-width: 180px;
}

@media (max-width: 600px) {
  .counter-card {
    flex-direction: row;
  }

  .action-buttons {
    gap: 0.5rem;
  }

  .time-display {
    font-size: 1.25rem;
  }

  .board-container {
    padding-top: 1rem;
    /* Adjusted for mobile */
  }

  .cards-container {
    position: static;
    padding-top: 1rem;
    /* Adjusted for mobile */
  }

  .zen-toggle {
    bottom: 0.5rem;
  }
}
</style>

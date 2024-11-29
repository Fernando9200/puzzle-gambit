<script setup lang="ts">
import ChessPuzzle from './ChessPuzzle.vue'
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import '@datadog/browser-logs/bundle/datadog-logs'
import { useToggle, useDark } from '@vueuse/core'
import { useRoute } from 'vue-router'

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
    totalErrors.value++
    showError()
  }
  currentErrors.value++
  if (currentErrors.value > 0) allowClue.value = true
  if (auto.value) nextPuzzle()
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

// Restart session
function restartSession() {
  totalErrors.value = 0
  totalPuzzless.value = 0
  puzzleRankings.fill(-1)
  localStorage.setItem(
    `puzzleRankings_${props.level}`,
    JSON.stringify(puzzleRankings),
  )
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

// Watch for touch events to show navigation icon
watchEffect(() => {
  showNavIcon.value = 'ontouchstart' in window
})
</script>

<template>
  <v-container class="training" fluid>
    <v-row class="training" justify="center">
      <v-col sm="6" md="3" cols="12" class="text-center" v-show="!zenMode">
        <v-card outlined class="mb-4">
          <v-card-title>Session Time</v-card-title>
          <v-card-text>
            <StopWatch ref="sessionClockRef" />
          </v-card-text>
        </v-card>

        <v-card outlined class="mb-4">
          <v-card-actions class="justify-center" style="padding: 20px;">
            <v-btn color="white" @click="restartSession()" class="ma-2" elevation="5" rounded x-large
              style="border: 2px solid white; background-color: rgba(0, 0, 0, 0.5);">
              <v-icon left>mdi-restart</v-icon>
              Restart Session
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card outlined class="mb-4">
          <v-card-text class="counter-card">
            <div :class="{ success: successOccurred }" class="counter">
              <v-icon color="green" size="24">mdi-check-circle</v-icon>
              <span class="counter-text">Completed: {{ totalPuzzless }}</span>
            </div>
            <div :class="{ error: errorOccurred }" class="counter">
              <v-icon color="red" size="24">mdi-close-circle</v-icon>
              <span class="counter-text">Missed: {{ totalErrors }}</span>
            </div>
          </v-card-text>
        </v-card>

        <v-card outlined>
          <v-card-text>
            <v-btn icon size="small" class="ml-2" @click="showInfoModal = true">
              <v-icon size="30" icon="mdi-information"></v-icon>
            </v-btn>
            <v-btn icon href="https://github.com/Fernando9200/chess" size="small" class="ml-2" target="_blank">
              <v-icon size="30" icon="mdi-github"></v-icon>
            </v-btn>
            <v-btn icon href="https://www.linkedin.com/in/fernando-carretto/" size="small" class="ml-2" target="_blank">
              <v-icon size="30" icon="mdi-linkedin"></v-icon>
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Info Modal -->
      <v-dialog v-model="showInfoModal" max-width="600">
        <v-card>
          <v-card-title class="headline">Info</v-card-title>
          <v-card-text>
            This app uses chess puzzles from the Lichess database to help you improve your tactical skills. You can pick
            your skill level and stick with it, allowing you to practice as much as you need at a difficulty that feels
            right for you. Unlike Lichess, which automatically adjusts your level and sometimes pushes you into puzzles
            that are too challenging, this app focuses on steady, targeted improvement. By training at your own pace,
            you can build a solid foundation and see real progress in your tactics.
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="showInfoModal = false">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-col sm="8" md="5" cols="12" class="board">
        <ChessPuzzle ref="puzzleRef" @failure="handleFailure" @solved="puzzleSolved"
          :key="(puzzleColection[currentPuzzle] as any).PuzzleId"
          :puzzle-data="puzzleColection[currentPuzzle] as any" />
      </v-col>

      <v-col sm="6" md="3" cols="12" class="text-center" v-show="!zenMode">
        <v-card outlined class="mb-4">
          <v-card-title>Settings</v-card-title>
          <v-card-text>
            <v-row class="toggle-row" justify="center">
              <v-col cols="auto">
                <v-switch inset v-model="auto" label="Auto" />
              </v-col>
              <v-col cols="auto">
                <v-switch :model-value="isDark" color="" hide-details density="compact" inset
                  false-icon="mdi-white-balance-sunny" true-icon="mdi-weather-night" style="opacity: 0.8"
                  @update:model-value="toggleDark" class="dark-toggle"></v-switch>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card outlined class="mb-4">
          <v-card-title>Puzzle Time</v-card-title>
          <v-card-text>
            <StopWatch ref="puzzleClockRef" />
          </v-card-text>
        </v-card>

        <v-card outlined class="mb-4">
          <v-card-actions class="justify-center" style="padding: 20px;">
            <v-btn :disabled="!solved" color="white" @click="nextPuzzle()" class="ma-2" elevation="5" rounded x-large
              style="border: 2px solid white; background-color: rgba(0, 0, 0, 0.5);">
              <v-icon left>mdi-arrow-right-bold-circle-outline</v-icon>
              Next
            </v-btn>

            <v-btn :disabled="!allowClue" color="white" @click="sendClue()" class="ma-2" elevation="5" rounded x-large
              style="border: 2px solid white; background-color: rgba(0, 0, 0, 0.5);">
              <v-icon left>mdi-lightbulb</v-icon>
              Clue
            </v-btn>
          </v-card-actions>
        </v-card>
        <v-card outlined class="mb-4">
          <v-card-actions class="justify-center" style="padding: 20px;">
            <!-- Go to Lichess Button -->
            <v-btn color="gray"
              :href="`https://lichess.org/training/${(puzzleColection[currentPuzzle] as any).PuzzleId}`" class="ma-2"
              elevation="5" rounded x-large style="border: 2px solid white; background-color: rgba(0, 0, 0, 0.5);"
              target="_blank">
              <v-icon left>mdi-chess-knight</v-icon>
              Open on Lichess
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" class="text-center">
        <v-btn color="gray" variant="outlined" @click="zenMode = !zenMode">
          {{ zenMode ? 'Exit Zen Mode' : 'Enter Zen Mode' }}
        </v-btn>
      </v-col>
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
  /* Ensure the container allows vertical scrolling */
}

.success {
  color: green;
}

.error {
  color: red;
}

.board {
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 100vh;
  /* overflow: hidden;  <-- Ensure this is removed */
}

.text-center {
  text-align: center;
  margin-top: 0;
}

.training {
  margin-top: 1vh;
  overflow-y: auto;
  /* Ensure the container allows vertical scrolling */
}

.toggle-row {
  display: flex;
  align-items: center;
}

.dark-toggle {
  margin-top: -20px;
  /* Adjust this value as needed to align the switches */
}

.counter-card {
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  /* Allow wrapping on smaller screens */
}

.counter {
  display: flex;
  align-items: center;
  margin: 8px 0;
}

.counter-text {
  margin-left: 8px;
  text-transform: uppercase;
  font-weight: bold;
}
</style>

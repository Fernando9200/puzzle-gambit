// src/services/sessionStorage.ts
import { v4 as uuidv4 } from 'uuid'

export interface SessionResult {
  id: string
  date: string
  skillLevel: number
  totalTime: number
  puzzlesSolved: number
  puzzlesFailed: number
  accuracyRate: number
}

const STORAGE_KEY = 'chess_training_sessions'

export const sessionStorage = {
  saveSession(sessionData: Omit<SessionResult, 'id' | 'date'>): void {
    const sessions = this.getAllSessions()
    const newSession: SessionResult = {
      ...sessionData,
      id: uuidv4(),
      date: new Date().toISOString(),
    }
    sessions.push(newSession)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  },

  getAllSessions(): SessionResult[] {
    const sessions = localStorage.getItem(STORAGE_KEY)
    return sessions ? JSON.parse(sessions) : []
  },

  deleteSession(id: string): void {
    const sessions = this.getAllSessions()
    const updatedSessions = sessions.filter((session) => session.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions))
  },

  clearAllSessions(): void {
    localStorage.removeItem(STORAGE_KEY)
  },
}

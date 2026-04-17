import { useState, useCallback } from 'react'
import type { Annotation } from './types'

export interface Snapshot {
  /** Unique snapshot ID */
  id: string
  /** User-provided label */
  label: string
  /** ISO timestamp when snapshot was created */
  createdAt: string
  /** The content text at the time of snapshot (for text-based orphan detection) */
  content: string
  /** Annotations at the time of snapshot */
  annotations: Annotation[]
  /** Number of annotations at snapshot time */
  annotationCount: number
}

export interface UseVersionHistoryOptions {
  /** Callback when a snapshot is restored */
  onRestore?: (snapshot: Snapshot) => void
}

export interface UseVersionHistoryReturn {
  /** All saved snapshots, ordered newest first */
  snapshots: Snapshot[]
  /** Save a new snapshot of current state */
  saveSnapshot: (content: string, annotations: Annotation[], label?: string) => Snapshot
  /** Restore a snapshot by ID */
  restoreSnapshot: (id: string) => Snapshot | undefined
  /** Delete a snapshot */
  deleteSnapshot: (id: string) => void
  /** Get a snapshot by ID */
  getSnapshot: (id: string) => Snapshot | undefined
  /** Compare two snapshots' annotation counts */
  compare: (idA: string, idB: string) => { before: number; after: number; delta: number } | undefined
}

let snapshotCounter = 0

/**
 * Hook for managing document version snapshots.
 *
 * Users can save snapshots of the current document state (content + annotations),
 * view the history, and restore any previous snapshot.
 *
 * Snapshots are stored in memory (not persisted). For persistence,
 * consume the snapshots array and save to your backend.
 */
export function useVersionHistory(options: UseVersionHistoryOptions = {}): UseVersionHistoryReturn {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])

  const saveSnapshot = useCallback((content: string, annotations: Annotation[], label?: string): Snapshot => {
    const now = new Date().toISOString()
    const snapshot: Snapshot = {
      id: `snap_${Date.now()}_${++snapshotCounter}`,
      label: label || `Snapshot ${snapshots.length + 1}`,
      createdAt: now,
      content,
      annotations: [...annotations],
      annotationCount: annotations.length,
    }
    setSnapshots(prev => [snapshot, ...prev])
    return snapshot
  }, [snapshots.length])

  const restoreSnapshot = useCallback((id: string): Snapshot | undefined => {
    const snapshot = snapshots.find(s => s.id === id)
    if (snapshot) {
      options.onRestore?.(snapshot)
    }
    return snapshot
  }, [snapshots, options.onRestore])

  const deleteSnapshot = useCallback((id: string) => {
    setSnapshots(prev => prev.filter(s => s.id !== id))
  }, [])

  const getSnapshot = useCallback((id: string) => {
    return snapshots.find(s => s.id === id)
  }, [snapshots])

  const compare = useCallback((idA: string, idB: string) => {
    const a = snapshots.find(s => s.id === idA)
    const b = snapshots.find(s => s.id === idB)
    if (!a || !b) return undefined
    // idA is "before", idB is "after" (since newer is first in array)
    return {
      before: a.annotationCount,
      after: b.annotationCount,
      delta: b.annotationCount - a.annotationCount,
    }
  }, [snapshots])

  return {
    snapshots,
    saveSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    getSnapshot,
    compare,
  }
}

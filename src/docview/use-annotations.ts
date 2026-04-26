import { useState, useCallback, useRef } from 'react'
import type { Annotation, AnnotationColor } from './types'

let idCounter = 0

/** Generate a unique annotation ID */
function generateId(): string {
  return `ann_${Date.now()}_${++idCounter}`
}

export interface UseAnnotationsOptions {
  /** External controlled annotations (if provided, internal state is ignored) */
  annotations?: Annotation[]
  /** Callback when annotations change */
  onAnnotationsChange?: (annotations: Annotation[]) => void
}

export interface UseAnnotationsReturn {
  /** Current annotations list */
  annotations: Annotation[]
  /** Add a new annotation */
  addAnnotation: (text: string, note: string, color: AnnotationColor, init?: Partial<Annotation>) => Annotation
  /** Update an existing annotation */
  updateAnnotation: (id: string, updates: Partial<Pick<Annotation, 'note' | 'color' | 'status' | 'target'>>) => void
  /** Delete an annotation */
  deleteAnnotation: (id: string) => void
  /** Get a specific annotation by ID */
  getAnnotation: (id: string) => Annotation | undefined
  /** Check for orphaned annotations (text no longer found in content) */
  detectOrphans: (content: string) => Annotation[]
  /** Mark annotations as orphaned if their text is not found in content */
  markOrphans: (content: string) => void
}

/**
 * Hook for managing annotation state with CRUD operations and orphan detection.
 *
 * Supports both controlled (external annotations prop) and uncontrolled (internal state) modes.
 * Uses a ref to track latest annotations, avoiding stale closure bugs when
 * addAnnotation + updateAnnotation are called in sequence within the same handler.
 */
export function useAnnotations(options: UseAnnotationsOptions = {}): UseAnnotationsReturn {
  const [internalAnnotations, setInternalAnnotations] = useState<Annotation[]>([])

  // Ref to always have the latest annotations — avoids stale closure when
  // calling addAnnotation() then updateAnnotation() in the same handler.
  const latestRef = useRef<Annotation[]>([])

  const annotations = options.annotations ?? internalAnnotations
  latestRef.current = annotations

  const emitChange = useCallback((next: Annotation[]) => {
    latestRef.current = next // Update ref synchronously for subsequent calls
    if (!options.annotations) {
      setInternalAnnotations(next)
    }
    options.onAnnotationsChange?.(next)
  }, [options.annotations, options.onAnnotationsChange])

  const addAnnotation = useCallback((text: string, note: string, color: AnnotationColor, init: Partial<Annotation> = {}): Annotation => {
    const now = new Date().toISOString()
    const annotation: Annotation = {
      id: init.id || generateId(),
      text,
      note,
      color,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      ...init,
    }
    emitChange([...latestRef.current, annotation])
    return annotation
  }, [emitChange])

  const updateAnnotation = useCallback((id: string, updates: Partial<Pick<Annotation, 'note' | 'color' | 'status' | 'target'>>) => {
    const next = latestRef.current.map(a =>
      a.id === id
        ? { ...a, ...updates, updatedAt: new Date().toISOString() }
        : a
    )
    emitChange(next)
  }, [emitChange])

  const deleteAnnotation = useCallback((id: string) => {
    emitChange(latestRef.current.filter(a => a.id !== id))
  }, [emitChange])

  const getAnnotation = useCallback((id: string) => {
    return latestRef.current.find(a => a.id === id)
  }, [])

  const detectOrphans = useCallback((content: string): Annotation[] => {
    return latestRef.current.filter(a => a.status !== 'orphaned' && !content.includes(a.text))
  }, [])

  const markOrphans = useCallback((content: string) => {
    // Only check text-based annotations; skip target-based (chart/KPI/table) —
    // their "text" is a label, not actual document content
    const hasOrphans = latestRef.current.some(a => a.status !== 'orphaned' && !a.target && !content.includes(a.text))
    if (hasOrphans) {
      const next = latestRef.current.map(a => {
        if (a.status !== 'orphaned' && !a.target && !content.includes(a.text)) {
          return { ...a, status: 'orphaned' as const, updatedAt: new Date().toISOString() }
        }
        return a
      })
      emitChange(next)
    }
  }, [emitChange])

  return {
    annotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    getAnnotation,
    detectOrphans,
    markOrphans,
  }
}

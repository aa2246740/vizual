import { useState, useCallback } from 'react'
import type { Annotation, AnnotationColor, ANNOTATION_COLORS } from './types'

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
  addAnnotation: (text: string, note: string, color: AnnotationColor) => Annotation
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
 * Content-based matching ensures annotations survive minor text changes.
 */
export function useAnnotations(options: UseAnnotationsOptions = {}): UseAnnotationsReturn {
  const [internalAnnotations, setInternalAnnotations] = useState<Annotation[]>([])
  const annotations = options.annotations ?? internalAnnotations

  const emitChange = useCallback((next: Annotation[]) => {
    if (!options.annotations) {
      setInternalAnnotations(next)
    }
    options.onAnnotationsChange?.(next)
  }, [options.annotations, options.onAnnotationsChange])

  const addAnnotation = useCallback((text: string, note: string, color: AnnotationColor): Annotation => {
    const now = new Date().toISOString()
    const annotation: Annotation = {
      id: generateId(),
      text,
      note,
      color,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    }
    emitChange([...annotations, annotation])
    return annotation
  }, [annotations, emitChange])

  const updateAnnotation = useCallback((id: string, updates: Partial<Pick<Annotation, 'note' | 'color' | 'status' | 'target'>>) => {
    const next = annotations.map(a =>
      a.id === id
        ? { ...a, ...updates, updatedAt: new Date().toISOString() }
        : a
    )
    emitChange(next)
  }, [annotations, emitChange])

  const deleteAnnotation = useCallback((id: string) => {
    emitChange(annotations.filter(a => a.id !== id))
  }, [annotations, emitChange])

  const getAnnotation = useCallback((id: string) => {
    return annotations.find(a => a.id === id)
  }, [annotations])

  const detectOrphans = useCallback((content: string): Annotation[] => {
    return annotations.filter(a => a.status !== 'orphaned' && !content.includes(a.text))
  }, [annotations])

  const markOrphans = useCallback((content: string) => {
    const hasOrphans = annotations.some(a => a.status !== 'orphaned' && !content.includes(a.text))
    if (hasOrphans) {
      const next = annotations.map(a => {
        if (a.status !== 'orphaned' && !content.includes(a.text)) {
          return { ...a, status: 'orphaned' as const, updatedAt: new Date().toISOString() }
        }
        return a
      })
      emitChange(next)
    }
  }, [annotations, emitChange])

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

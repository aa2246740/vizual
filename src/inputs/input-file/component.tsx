import { useState, useRef, useCallback } from 'react'
import type { InputFileProps } from './schema'

interface FileInfo { name: string; size: string }

/**
 * File upload component with drag-and-drop support.
 *
 * Modes:
 * - Single file (maxFiles=1, default): Upload area → file card with delete button
 * - Multi file (maxFiles>1 or multiple=true): File list + always-visible upload area
 */
export function InputFile({ props }: { props: InputFileProps }) {
  const [dragOver, setDragOver] = useState(false)
  const [files, setFiles] = useState<FileInfo[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const maxFiles = props.maxFiles ?? 1
  const isMulti = props.multiple || maxFiles !== 1

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const newFiles = Array.from(fileList).map(f => ({ name: f.name, size: formatSize(f.size) }))
    if (isMulti) {
      setFiles(prev => {
        const combined = [...prev, ...newFiles]
        if (maxFiles > 0) return combined.slice(0, maxFiles)
        return combined
      })
    } else {
      setFiles(newFiles.slice(0, 1))
    }
  }, [isMulti, maxFiles])

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const showUploadArea = isMulti || files.length === 0

  return <div style={{ marginBottom: 12 }}>
    {props.label && <label style={{
      display: 'block', fontSize: 13, fontWeight: 500,
      color: 'var(--rk-text-secondary,#888)', marginBottom: 4,
    }}>
      {props.label}
    </label>}

    {/* File list */}
    {files.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: showUploadArea ? 8 : 0 }}>
      {files.map((f, i) => <div key={i} style={{
        fontSize: 13, color: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 10px', background: '#111', borderRadius: 6, border: '1px solid #1a1a2e',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <span style={{ fontSize: 16 }}>📎</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
          <span style={{ color: '#555', fontSize: 11, flexShrink: 0 }}>{f.size}</span>
        </div>
        <button onClick={() => removeFile(i)} style={{
          background: 'none', border: 'none', color: '#666', cursor: 'pointer',
          fontSize: 16, padding: '0 4px', lineHeight: 1, flexShrink: 0,
        }} title="Remove file"
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}>✕</button>
      </div>)}
    </div>}

    {/* Upload area — hidden in single mode when file is uploaded */}
    {showUploadArea && <div
      onClick={() => !props.disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
      style={{
        padding: '20px 16px', border: `2px dashed ${dragOver ? '#3b82f6' : props.error ? '#ef4444' : '#2a2a2a'}`,
        borderRadius: 8, textAlign: 'center',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        background: dragOver ? '#0a1628' : '#0a0a0a', opacity: props.disabled ? 0.5 : 1,
      }}
    >
      <div style={{ fontSize: 14, color: '#888' }}>
        {isMulti ? 'Drop files here or click to browse' : 'Drop a file here or click to browse'}
      </div>
      {props.accept && <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>Accepts: {props.accept}</div>}
      {isMulti && maxFiles > 0 && <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
        Max {maxFiles} files
      </div>}
    </div>}

    <input
      ref={inputRef}
      type="file"
      accept={props.accept}
      multiple={props.multiple}
      disabled={props.disabled}
      onChange={(e) => handleFiles(e.target.files)}
      style={{ display: 'none' }}
    />

    {(props.error || props.description) && <div style={{
      fontSize: 12, marginTop: 4,
      color: props.error ? '#ef4444' : '#666',
    }}>
      {props.error || props.description}
    </div>}
  </div>
}

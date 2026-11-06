import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'
import { API_URL, areJsonEqual } from '../utils/utils'
import Loader from './loader'

interface SchemaSummary {
  id: string
  name: string
  fileName: string
  updatedAt: string
}

interface SchemaDetail extends SchemaSummary {
  content: string
}

interface SchemaManagerModalProps {
  isOpen: boolean
  onClose: () => void
}

const formatUpdatedAt = (updatedAt: string) => {
  if (!updatedAt) return 'Not available'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(updatedAt))
}

export default function SchemaManagerModal({
  isOpen,
  onClose,
}: SchemaManagerModalProps) {
  const [schemas, setSchemas] = useState<SchemaSummary[]>([])
  const [selectedSchemaId, setSelectedSchemaId] = useState('')
  const [schemaContent, setSchemaContent] = useState('')
  const [originalSchemaContent, setOriginalSchemaContent] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [reloadRequired, setReloadRequired] = useState(false)

  const loadSchema = async (schemaId: string) => {
    setIsLoading(true)
    setReloadRequired(false)
    try {
      const response = await fetch(`${API_URL}/schemas/${schemaId}`)
      const data = (await response.json()) as SchemaDetail & {
        message?: string
      }
      if (!response.ok) throw new Error(data.message || 'Could not load schema')
      setSchemaContent(data.content)
      setOriginalSchemaContent(data.content)
      setUpdatedAt(data.updatedAt)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not load schema',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const loadSchemas = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`${API_URL}/schemas`)
        const data = (await response.json()) as SchemaSummary[] & {
          message?: string
        }
        if (!response.ok) {
          throw new Error(data.message || 'Could not load schemas')
        }
        setSchemas(data)
        const firstSchemaId = data[0]?.id || ''
        setSelectedSchemaId(firstSchemaId)
        if (firstSchemaId) await loadSchema(firstSchemaId)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Could not load schemas',
        )
        setIsLoading(false)
      }
    }
    loadSchemas()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen, isSaving, onClose])

  const hasSchemaChanges =
    Boolean(originalSchemaContent) &&
    !areJsonEqual(schemaContent, originalSchemaContent)
  const currentLineCount = schemaContent
    ? schemaContent.split(/\r?\n/).length
    : 0
  const originalLineCount = originalSchemaContent
    ? originalSchemaContent.split(/\r?\n/).length
    : 0

  if (!isOpen) return null

  const saveSchema = async () => {
    try {
      JSON.parse(schemaContent)
    } catch {
      toast.error('Schema must contain valid JSON')
      return
    }

    setIsSaving(true)
    setReloadRequired(false)
    try {
      const response = await fetch(`${API_URL}/schemas/${selectedSchemaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: schemaContent }),
      })
      const data = (await response.json()) as {
        message?: string
        updatedAt?: string
        reloadRequired?: boolean
      }
      if (!response.ok)
        throw new Error(data.message || 'Could not update schema')
      setUpdatedAt(data.updatedAt || '')
      setReloadRequired(Boolean(data.reloadRequired))
      setOriginalSchemaContent(schemaContent)
      toast.success(data.message || 'Schema updated successfully')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not update schema',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="schema-modal-backdrop">
      <section
        className="schema-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schema-modal-title"
      >
        <header className="schema-modal-header">
          <div>
            <h2 id="schema-modal-title">Update config schema</h2>
            <p>Paste the generated schema and rebuild the application.</p>
          </div>
          <button
            className="schema-modal-close"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close schema editor"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="schema-modal-meta">
          <label>
            Schema
            <select
              value={selectedSchemaId}
              onChange={(event) => {
                const schemaId = event.target.value
                setSelectedSchemaId(schemaId)
                loadSchema(schemaId)
              }}
              disabled={isLoading || isSaving}
            >
              {schemas.map((schema) => (
                <option key={schema.id} value={schema.id}>
                  {schema.name} — {schema.fileName}
                </option>
              ))}
            </select>
          </label>
          <div className="schema-version-info">
            <span>
              Lines: {currentLineCount}
              {hasSchemaChanges && ` · Loaded: ${originalLineCount}`}
            </span>
            <span>Last updated: {formatUpdatedAt(updatedAt)}</span>
          </div>
        </div>

        <div className="schema-content-wrap">
          {isLoading ? (
            <div className="schema-modal-loading">
              <Loader />
            </div>
          ) : (
            <Editor
              height="100%"
              width="100%"
              language="json"
              path={`inmemory://model/config-schema-${selectedSchemaId}.json`}
              theme="vs-dark"
              value={schemaContent}
              onChange={(value) => setSchemaContent(value ?? '')}
              options={{
                automaticLayout: true,
                fontFamily: 'Fira Code, monospace',
                fontSize: 13,
                tabSize: 2,
                insertSpaces: true,
                detectIndentation: false,
                lineNumbers: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
              }}
            />
          )}
        </div>

        <footer className="schema-modal-actions">
          {reloadRequired && (
            <button
              className="schema-reload-button"
              onClick={() => window.location.reload()}
            >
              <RefreshCw aria-hidden="true" />
              Reload application
            </button>
          )}
          <button
            className="schema-save-button"
            onClick={saveSchema}
            disabled={
              isLoading ||
              isSaving ||
              !selectedSchemaId ||
              !schemaContent ||
              !hasSchemaChanges
            }
          >
            {isSaving && <Loader />}
            {isSaving ? 'Building…' : 'Save and rebuild'}
          </button>
        </footer>
      </section>
    </div>
  )
}

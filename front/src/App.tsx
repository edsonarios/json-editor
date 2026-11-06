import './App.css'
import { useState } from 'react'
import { Toaster } from 'sonner'
import EditorWorkspace from './components/editorWorkspace'
import Footer from './components/footer'
import SchemaManagerModal from './components/schemaManagerModal'

export default function App() {
  const [isSplit, setIsSplit] = useState(false)
  const [isSchemaManagerOpen, setIsSchemaManagerOpen] = useState(false)

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-brand">
          <h1>Json Editor</h1>
        </div>
        <Footer />
      </header>

      <main className={`workspace-grid ${isSplit ? 'is-split' : ''}`}>
        <EditorWorkspace
          workspaceId="primary"
          isSplit={isSplit}
          onToggleSplit={() => setIsSplit((current) => !current)}
          onOpenSchemaManager={() => setIsSchemaManagerOpen(true)}
          showSplitControl
        />
        {isSplit && <EditorWorkspace workspaceId="secondary" isSplit />}
      </main>

      <SchemaManagerModal
        isOpen={isSchemaManagerOpen}
        onClose={() => setIsSchemaManagerOpen(false)}
      />
      <Toaster />
    </div>
  )
}

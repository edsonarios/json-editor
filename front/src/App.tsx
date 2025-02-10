import './App.css'
import { useEffect, useState } from 'react'
import { DateTime } from 'luxon'
import IconArrowLink from './components/ArrowLink'
import Editor, { useMonaco } from '@monaco-editor/react'

export default function App() {
  const [jsonData, setJsonData] = useState('{}')
  const [editorInstance, setEditorInstance] = useState(null)
  const monaco = useMonaco()

  const saveJson = () => {
    const data = JSON.parse(jsonData)
    console.log(data)
  }

  const formatJson = () => {
    if (editorInstance) {
      editorInstance.trigger('', 'editor.action.formatDocument', null)
    }
  }

  const collapseAll = () => {
    if (editorInstance) {
      editorInstance.trigger('', 'editor.foldAll', null)
    }
  }

  const unCollapseAll = () => {
    if (editorInstance) {
      editorInstance.trigger('', 'editor.unfoldAll', null)
    }
  }

  // useEffect(() => {
  //   if (monaco && editorInstance) {
  //     monaco.editor.addCommand(
  //       monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD,
  //       () => {
  //         editorInstance.trigger(
  //           'keyboard',
  //           'editor.action.addSelectionToNextFindMatch',
  //           null,
  //         )
  //       },
  //       'editorFocus',
  //     )
  //   }
  // }, [monaco, editorInstance])

  return (
    <div className="p-4 flex items-center flex-col">
      <h1 className="text-6xl mb-4">Json Editor</h1>
      <div className="flex flex-row w-full justify-between">
        <div className="flex flex-row space-x-4">
          <button
            className="p-2 bg-green-600 rounded-md hover:bg-green-500"
            onClick={formatJson}
          >
            Format
          </button>
          <button
            className="p-2 bg-green-600 rounded-md hover:bg-green-500"
            onClick={collapseAll}
          >
            Collapse
          </button>
          <button
            className="p-2 bg-green-600 rounded-md hover:bg-green-500"
            onClick={unCollapseAll}
          >
            UnCollapse
          </button>
        </div>
        <div className="flex flex-row space-x-4">
          <button
            className="p-2 bg-orange-600 rounded-md hover:bg-orange-500"
            onClick={saveJson}
          >
            Save
          </button>
        </div>
      </div>
      <div className="mt-2" style={{ height: '500px' }}>
        <Editor
          // height="800px"
          height="80vh"
          width="800px"
          language="json"
          theme="vs-dark"
          value={jsonData}
          onChange={(value) => setJsonData(value)}
          options={{
            minimap: { enabled: false },
            automaticLayout: true,
            fontFamily: 'Fira Code, monospace',
            fontSize: 14,
            lineNumbers: 'on',
          }}
          onMount={(editor) => setEditorInstance(editor)}
        />
      </div>
      {/* <footer className="absolute bottom-8 flex flex-col items-center">
        <p className="">Made By ⚡ Edson</p>
        <a
          className="text-gray-400 flex items-center group hover:text-gray-100 hover:transition-all"
          href="https://www.linkedin.com/in/edson-a%C3%B1awaya/"
          target="_blank"
          rel="noreferrer"
        >
          Linkedin
          <IconArrowLink />
        </a>
      </footer> */}
    </div>
  )
}

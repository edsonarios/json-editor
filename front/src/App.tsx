import './App.css'
import { useCallback, useEffect, useState } from 'react'
import IconArrowLink from './components/ArrowLink'
import Editor from '@monaco-editor/react'
// import Editor, { useMonaco } from '@monaco-editor/react'
import { API_URL, areJsonEqual, DB_ENVS } from './utils/utils'
import { IJsonEditor, useRepositoryStore } from './store/repositoryStore'
import IconReload from './components/reload'
import IconPlug from './components/plug'
import debounce from 'lodash.debounce'

export default function App() {
  const { clients, setClients } = useRepositoryStore<IJsonEditor>(
    (state) => state,
  )

  const [editorInstance, setEditorInstance] = useState<any>(null)
  //? DB Environments
  const [dbEnvs] = useState(DB_ENVS)
  const [selectedEnv, setSelectedEnv] = useState(dbEnvs[0])
  const [isGetClients, setIsGetClients] = useState('')
  //? Clients
  const [selectedClient, setSelectedClient] = useState('')
  const [jsonData, setJsonData] = useState('{}')
  const [jsonFromDB, setJsonFromDB] = useState('{}')
  const [isSaveDisabled, setIsSaveDisabled] = useState(true)
  // const monaco = useMonaco()

  const fetchClients = async () => {
    setJsonData('{}')
    setClients([])
    const response = await fetch(`${API_URL}/base/${selectedEnv}`)
    const data = await response.json()
    setClients(data)
    setIsGetClients(selectedEnv)
  }

  const fetchClientConfig = async () => {
    setJsonData('{}')
    if (!selectedClient) {
      setSelectedClient(clients[0])
    }
    const response = await fetch(
      `${API_URL}/base/${selectedEnv}/${selectedClient}`,
    )
    const data = await response.json()
    const jsonData = JSON.stringify(data.config, null, 2)
    setJsonData(jsonData)
    setJsonFromDB(jsonData)
  }

  useEffect(() => {
    fetchClientConfig()
  }, [selectedClient])

  const debouncedJsonData = useCallback(debounce(setJsonData, 300), [])
  useEffect(() => {
    setIsSaveDisabled(areJsonEqual(jsonData, jsonFromDB))
  }, [jsonData, jsonFromDB])

  const saveJson = async () => {
    await fetch(`${API_URL}/base/${selectedEnv}/${selectedClient}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonData,
    })
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
    <div className="flex items-center flex-col h-100vh">
      <h1 className="text-6xl mb-4">Json Editor</h1>
      <div className="flex flex-row h-full w-full">
        <section className="w-1/3 flex flex-col items-start h-full space-y-2">
          <div className="text-2xl text-center w-full">Config</div>
          <label className="">DB Environment</label>
          <div className="flex flex-row items-center space-x-2">
            <select
              className="p-2  bg-zinc-700 rounded-md"
              name="clients"
              id="clients"
              onChange={(e) => setSelectedEnv(e.target.value)}
              value={selectedEnv}
            >
              {dbEnvs.map((env) => (
                <option key={env} value={env}>
                  {env}
                </option>
              ))}
            </select>
            <button
              className={`p-2 bg-green-600 rounded-md hover:bg-green-500 ${isGetClients === selectedEnv ? 'cursor-not-allowed bg-zinc-500 hover:bg-zinc-400' : ''}`}
              onClick={() => fetchClients()}
              disabled={isGetClients === selectedEnv}
            >
              <IconPlug />
            </button>
          </div>
          <label className="">Clients</label>
          <div className="flex flex-row items-center space-x-2">
            <select
              className="p-2  bg-zinc-700 rounded-md"
              name="clients"
              id="clients"
              onChange={(e) => setSelectedClient(e.target.value)}
              value={selectedClient}
            >
              {clients.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
            <button
              className="p-2 bg-green-600 rounded-md hover:bg-green-500"
              onClick={() => fetchClientConfig()}
            >
              <IconReload />
            </button>
          </div>
          {/*//? {Footer} */}
          <footer className="absolute flex flex-col items-start bottom-6">
            <p className="">Made By ⚡ Edson</p>
            <a
              className="text-gray-400 flex items-center group hover:text-gray-100 hover:transition-all ml-7"
              href="https://www.linkedin.com/in/edson-a%C3%B1awaya/"
              target="_blank"
              rel="noreferrer"
            >
              Linkedin
              <IconArrowLink />
            </a>
          </footer>
        </section>
        <section className="w-2/3">
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
                className={`p-2 bg-orange-600 rounded-md hover:bg-orange-500 ${isSaveDisabled ? 'cursor-not-allowed bg-zinc-500 hover:bg-zinc-400' : ''}`}
                onClick={saveJson}
                disabled={isSaveDisabled}
              >
                Save
              </button>
            </div>
          </div>
          <div className="mt-2 w-full">
            <Editor
              height="75vh"
              width="100%"
              language="json"
              theme="vs-dark"
              value={jsonData}
              onChange={(value) => {
                if (!value) return
                debouncedJsonData(value)
              }}
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
        </section>
      </div>
    </div>
  )
}

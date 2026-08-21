import './App.css'
import { useCallback, useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { API_URL, areJsonEqual, DB_ENVS } from './utils/utils'
import IconReload from './components/reload'
import IconPlug from './components/plug'
import debounce from 'lodash.debounce'
import { toast, Toaster } from 'sonner'
import { Select } from './components/select'
import Loader from './components/loader'
import Footer from './components/footer'
import { TabHeader } from './components/tabHeader'
import { tablesAtributes } from './utils/clientTables'
import {
  BASE_CLIENT_CONFIG_MODEL_URI,
  CLIENT_DATA_MODEL_URI,
  configureJsonSchemas,
} from './schemas/schemaRegistry'

export default function App() {
  const [editorInstance, setEditorInstance] = useState<any>(null)
  //? DB Environments
  const [dbEnvs] = useState(DB_ENVS)
  const [selectedEnv, setSelectedEnv] = useState(dbEnvs[0])
  const [isGetClients, setIsGetClients] = useState('')
  const [loadingEnv, setLoadingEnv] = useState(false)
  //? Clients
  const [clients, setClients] = useState<string[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [jsonData, setJsonData] = useState('{}')
  const [jsonFromDB, setJsonFromDB] = useState('{}')
  const [isSaveDisabled, setIsSaveDisabled] = useState(true)
  const options = clients.map((client) => ({
    value: client,
    label: client,
  }))
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [loadingDatas, setLoadingDatas] = useState(false)
  //? Save Json
  const [isSaving, setIsSaving] = useState(false)

  //? clients tables datas
  const [table, setTable] = useState<string[]>([])
  const [selectedTable, setSelectedTable] =
    useState<keyof typeof tablesAtributes>('empty')
  const optionsTable = table.map((table) => ({
    value: table,
    label: table,
  }))
  const [tableDataOriginal, setTableDataOriginal] = useState<any[]>([])
  const [tableData, setTableData] = useState<any[]>([])
  const [selectedTableData, setSelectedTableData] = useState('')
  const optionsTableData = tableData.map((tableData) => ({
    value: tableData.value,
    label: tableData.label,
  }))
  const [tableDataAttribute, setTableDataAttribute] = useState<string[]>([])
  const [selectedTableDataAttribute, setSelectedTableDataAttribute] =
    useState('')
  const optionsTableDataAttribute = tableDataAttribute.map(
    (tableDataAttribute) => ({
      value: tableDataAttribute,
      label: tableDataAttribute,
    }),
  )

  const fetchClients = async () => {
    setLoadingEnv(true)
    setJsonData('{}')
    setClients([])
    setSelectedClient('')
    const response = await fetch(`${API_URL}/base/${selectedEnv}`)
    const data = await response.json()
    setClients(data)
    setIsGetClients(selectedEnv)
    setLoadingEnv(false)
  }

  const fetchClientConfig = async () => {
    if (selectTab !== 0) {
      const keysTable = Object.keys(tablesAtributes)
      setTable(keysTable)
      return
    }
    setLoadingConfig(true)
    setJsonData('{}')
    if (!selectedClient || selectedClient === '') {
      setLoadingConfig(false)
      return
    }

    const response = await fetch(
      `${API_URL}/base/${selectedEnv}/${selectedClient}`,
    )
    const data = await response.json()
    const jsonData = JSON.stringify(data.config, null, 2)
    setJsonData(jsonData)
    setJsonFromDB(jsonData)
    setLoadingConfig(false)
  }

  useEffect(() => {
    fetchClientConfig()
  }, [selectedClient])

  const debouncedJsonData = useCallback(debounce(setJsonData, 300), [])
  useEffect(() => {
    setIsSaveDisabled(areJsonEqual(jsonData, jsonFromDB))
  }, [jsonData, jsonFromDB])

  const saveJson = async () => {
    if (isSaving) return
    const currentJson = editorInstance?.getValue() ?? jsonData
    let updateBody
    try {
      updateBody = JSON.stringify({
        expected: JSON.parse(jsonFromDB),
        next: JSON.parse(currentJson),
      })
    } catch {
      toast.error('Invalid JSON')
      return
    }

    setIsSaving(true)
    console.log('selectTab', selectTab)
    let saved
    if (selectTab === 0) {
      saved = await fetch(`${API_URL}/base/${selectedEnv}/${selectedClient}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: updateBody,
      })
    }
    if (selectTab === 1) {
      saved = await fetch(
        `${API_URL}/clients/${selectedEnv}/${selectedClient}/${selectedTable}/${selectedTableDataAttribute}/${selectedTableData}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: updateBody,
        },
      )
    }
    if (!saved) {
      toast.error('Internal error', {
        style: {
          backgroundColor: 'var(--color-red-400)',
          color: 'var(--text-white)',
          width: '200px',
        },
      })
      setIsSaving(false)
      return
    }
    const data = await saved.json()
    if (saved.ok) {
      setJsonData(currentJson)
      setJsonFromDB(currentJson)
      setIsSaveDisabled(true)
      toast.success(data.message, {
        style: {
          backgroundColor: 'var(--color-green-600)',
          color: 'var(--text-white)',
          width: '110px',
        },
      })
      setIsSaving(false)
      return
    }
    toast.error(data.message, {
      style: {
        backgroundColor: 'var(--color-red-400)',
        color: 'var(--text-white)',
        width: '200px',
      },
    })
    setIsSaving(false)
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

  const [selectTab, setSelectTab] = useState(0)
  useEffect(() => {}, [selectedTable])

  const fetchTableDatas = async () => {
    if (selectedClient === '') return
    setLoadingDatas(true)
    // setLoadingEnv(true)
    // setJsonData('{}')
    // setClients([])
    // setSelectedClient('')
    const response = await fetch(
      `${API_URL}/clients/${selectedEnv}/${selectedClient}/${selectedTable}/`,
    )
    const data = (await response.json()) as any[]
    console.log('data', data)
    setTableDataOriginal(data)
    if (selectedTable === 'dashboards' || selectedTable === 'suites') {
      const nameTableDatas = data.map((data) => {
        return { value: data.id, label: data.name }
      })
      setTableData(nameTableDatas)
    }
    const keysTableData = tablesAtributes[selectedTable]
    setTableDataAttribute(keysTableData)
    // setTableData(data)
    // setIsGetClients(selectedEnv)
    // setLoadingEnv(false)
    setLoadingDatas(false)
  }
  useEffect(() => {
    fetchTableDatas()
  }, [selectedTable])

  useEffect(() => {
    if (selectedTableDataAttribute === '') return

    const tableData = tableDataOriginal.find(
      (data) => data.id === selectedTableData,
    )
    const jsonData = tableData[selectedTableDataAttribute] || {}
    const jsonDataParsed = JSON.stringify(jsonData, null, 2)
    setJsonData(jsonDataParsed)
    setJsonFromDB(jsonDataParsed)
  }, [selectedTableDataAttribute])

  const fetchTableDatasToReload = async () => {
    if (selectedClient === '') return
    setLoadingConfig(true)
    setJsonData('{}')
    const response = await fetch(
      `${API_URL}/clients/${selectedEnv}/${selectedClient}/${selectedTable}/`,
    )
    const data = (await response.json()) as any[]
    console.log('data', data)
    setTableDataOriginal(data)
    if (selectedTable === 'dashboards' || selectedTable === 'suites') {
      const nameTableDatas = data.map((data) => {
        return { value: data.id, label: data.name }
      })
      setTableData(nameTableDatas)
      const tableData = data.find((data) => data.id === selectedTableData)
      const jsonData = tableData[selectedTableDataAttribute] || {}
      const jsonDataParsed = JSON.stringify(jsonData, null, 2)
      setJsonData(jsonDataParsed)
      setJsonFromDB(jsonDataParsed)
    }
    setLoadingConfig(false)
    // setTableData(data)
    // setIsGetClients(selectedEnv)
    // setLoadingEnv(false)
  }

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
            {loadingEnv && <Loader />}
          </div>
          <div id="tabsId" className="flex flex-row min-w-[270px]">
            <TabHeader
              label="Base"
              selectTab={0}
              currentTab={selectTab}
              setSelectTab={setSelectTab}
            />
            <TabHeader
              label="Clients"
              selectTab={1}
              currentTab={selectTab}
              setSelectTab={setSelectTab}
            />
          </div>
          {selectTab === 0 ? (
            //? config bases
            <div>
              <label className="">Configs</label>
              <div className="flex flex-row items-center space-x-2">
                <Select
                  options={options}
                  setValue={setSelectedClient}
                  value={selectedClient}
                />
                <button
                  className="p-2 bg-green-600 rounded-md hover:bg-green-500"
                  onClick={() => fetchClientConfig()}
                >
                  <IconReload />
                </button>
                {loadingConfig && <Loader />}
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-2 items-start">
              {/* //? Clients */}
              <div>
                <label className="mr-2">Clients</label>
                <Select
                  options={options}
                  setValue={setSelectedClient}
                  value={selectedClient}
                />
              </div>
              {/* //? Tables */}
              <div className="flex flex-row">
                <label className="mr-2">Tables</label>
                <Select
                  options={optionsTable}
                  setValue={setSelectedTable}
                  value={selectedTable}
                />
                {loadingDatas && <Loader />}
              </div>
              {/* //? Tables Data */}
              <div>
                <label className="mr-2">Datas</label>
                <Select
                  options={optionsTableData}
                  setValue={setSelectedTableData}
                  value={selectedTableData}
                />
              </div>
              {/* //? Attributes */}
              <div className="flex flex-row items-center space-x-2">
                <label className="mr-2">Attributes</label>
                <Select
                  options={optionsTableDataAttribute}
                  setValue={setSelectedTableDataAttribute}
                  value={selectedTableDataAttribute}
                />
                <button
                  className="p-2 bg-green-600 rounded-md hover:bg-green-500"
                  onClick={() => fetchTableDatasToReload()}
                >
                  <IconReload />
                </button>
                {loadingConfig && <Loader />}
              </div>
            </div>
          )}
          {/*//? {Footer} */}
          <Footer />
        </section>
        {/*//? {Editor} */}
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
              {isSaving && <Loader />}
              <button
                className={`px-5 bg-orange-600 rounded-md hover:bg-orange-500 ${isSaveDisabled ? 'cursor-not-allowed bg-zinc-500 hover:bg-zinc-400' : ''}`}
                onClick={saveJson}
                disabled={isSaveDisabled || isSaving}
              >
                Save
              </button>
            </div>
          </div>
          <div className="mt-2 w-full">
            <Editor
              height="80vh"
              width="100%"
              language="json"
              path={
                selectTab === 0
                  ? BASE_CLIENT_CONFIG_MODEL_URI
                  : CLIENT_DATA_MODEL_URI
              }
              theme="vs-dark"
              value={jsonData}
              onChange={(value) => {
                if (!value) return
                debouncedJsonData(value)
              }}
              options={{
                automaticLayout: true,
                fontFamily: 'Fira Code, monospace',
                fontSize: 14,
                lineNumbers: 'on',
              }}
              beforeMount={configureJsonSchemas}
              onMount={(editor) => setEditorInstance(editor)}
            />
          </div>
        </section>
      </div>
      <Toaster />
    </div>
  )
}

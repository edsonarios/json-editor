import { useCallback, useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import debounce from 'lodash.debounce'
import {
  Columns2,
  FileCog,
  FoldHorizontal,
  FoldVertical,
  PanelRightClose,
  Save,
  UnfoldHorizontal,
  UnfoldVertical,
  WandSparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  configureJsonSchemas,
  getBaseClientConfigModelUri,
  getClientDataModelUri,
} from '../schemas/schemaRegistry'
import { tablesAtributes } from '../utils/clientTables'
import { API_URL, areJsonEqual, DB_ENVS } from '../utils/utils'
import Loader from './loader'
import IconPlug from './plug'
import IconReload from './reload'
import { Select } from './select'
import { TabHeader } from './tabHeader'

interface EditorWorkspaceProps {
  workspaceId: string
  isSplit: boolean
  onToggleSplit?: () => void
  onOpenSchemaManager?: () => void
  showSplitControl?: boolean
}

export default function EditorWorkspace({
  workspaceId,
  isSplit,
  onToggleSplit,
  onOpenSchemaManager,
  showSplitControl = false,
}: EditorWorkspaceProps) {
  const [editorInstance, setEditorInstance] = useState<any>(null)
  const [dbEnvs] = useState(DB_ENVS)
  const [selectedEnv, setSelectedEnv] = useState(dbEnvs[0])
  const [isGetClients, setIsGetClients] = useState('')
  const [loadingEnv, setLoadingEnv] = useState(false)
  const [clients, setClients] = useState<string[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [jsonData, setJsonData] = useState('{}')
  const [jsonFromDB, setJsonFromDB] = useState('{}')
  const [isSaveDisabled, setIsSaveDisabled] = useState(true)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [loadingDatas, setLoadingDatas] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectTab, setSelectTab] = useState(0)
  const [table, setTable] = useState<string[]>([])
  const [selectedTable, setSelectedTable] =
    useState<keyof typeof tablesAtributes>('empty')
  const [tableDataOriginal, setTableDataOriginal] = useState<any[]>([])
  const [tableData, setTableData] = useState<any[]>([])
  const [selectedTableData, setSelectedTableData] = useState('')
  const [tableDataAttribute, setTableDataAttribute] = useState<string[]>([])
  const [selectedTableDataAttribute, setSelectedTableDataAttribute] =
    useState('')

  const options = clients.map((client) => ({ value: client, label: client }))
  const optionsTable = table.map((item) => ({ value: item, label: item }))
  const optionsTableData = tableData.map((item) => ({
    value: item.value,
    label: item.label,
  }))
  const optionsTableDataAttribute = tableDataAttribute.map((attribute) => ({
    value: attribute,
    label: attribute,
  }))

  const fetchClients = async () => {
    setLoadingEnv(true)
    setJsonData('{}')
    setJsonFromDB('{}')
    setClients([])
    setSelectedClient('')
    try {
      const response = await fetch(`${API_URL}/base/${selectedEnv}`)
      const data = await response.json()
      setClients(data)
      setIsGetClients(selectedEnv)
    } catch {
      toast.error(`Could not connect to ${selectedEnv}`)
    } finally {
      setLoadingEnv(false)
    }
  }

  const fetchClientConfig = async () => {
    if (selectTab !== 0) {
      setTable(Object.keys(tablesAtributes))
      return
    }
    setLoadingConfig(true)
    setJsonData('{}')
    if (!selectedClient) {
      setLoadingConfig(false)
      return
    }

    const response = await fetch(
      `${API_URL}/base/${selectedEnv}/${selectedClient}`,
    )
    const data = await response.json()
    const nextJson = JSON.stringify(data.config, null, 2)
    setJsonData(nextJson)
    setJsonFromDB(nextJson)
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
    let saved
    if (selectTab === 0) {
      saved = await fetch(`${API_URL}/base/${selectedEnv}/${selectedClient}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: updateBody,
      })
    }
    if (selectTab === 1) {
      saved = await fetch(
        `${API_URL}/clients/${selectedEnv}/${selectedClient}/${selectedTable}/${selectedTableDataAttribute}/${selectedTableData}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: updateBody,
        },
      )
    }
    if (!saved) {
      toast.error('Internal error')
      setIsSaving(false)
      return
    }

    const data = await saved.json()
    if (saved.ok) {
      setJsonData(currentJson)
      setJsonFromDB(currentJson)
      setIsSaveDisabled(true)
      toast.success(data.message)
      setIsSaving(false)
      return
    }
    toast.error(data.message)
    setIsSaving(false)
  }

  const formatJson = () => {
    editorInstance?.trigger('', 'editor.action.formatDocument', null)
  }

  const collapseAll = () => {
    editorInstance?.trigger('', 'editor.foldAll', null)
  }

  const unCollapseAll = () => {
    editorInstance?.trigger('', 'editor.unfoldAll', null)
  }

  const runSectionAction = (
    action: 'editor.foldRecursively' | 'editor.unfoldRecursively',
    targetEditor = editorInstance,
  ) => {
    const selection = targetEditor?.getSelection()
    if (!selection) return
    if (!selection.isEmpty()) {
      targetEditor.setPosition({
        lineNumber: selection.startLineNumber,
        column: selection.startColumn,
      })
    }
    targetEditor.trigger('', action, null)
  }

  const toggleSectionAction = async (targetEditor = editorInstance) => {
    const selection = targetEditor?.getSelection()
    if (!selection) return
    const lineNumber = selection.startLineNumber
    if (!selection.isEmpty()) {
      targetEditor.setPosition({
        lineNumber,
        column: selection.startColumn,
      })
    }

    const foldingController = targetEditor.getContribution(
      'editor.contrib.folding',
    ) as any
    const foldingModel = await foldingController?.getFoldingModel()
    const currentRegion = foldingModel?.getRegionAtLine(lineNumber)
    const action = currentRegion?.isCollapsed
      ? 'editor.unfoldRecursively'
      : 'editor.foldRecursively'
    targetEditor.trigger('', action, null)
  }

  const collapseSection = () => {
    runSectionAction('editor.foldRecursively')
  }

  const unCollapseSection = () => {
    runSectionAction('editor.unfoldRecursively')
  }

  const fetchTableDatas = async () => {
    if (!selectedClient) return
    setLoadingDatas(true)
    const response = await fetch(
      `${API_URL}/clients/${selectedEnv}/${selectedClient}/${selectedTable}/`,
    )
    const data = (await response.json()) as any[]
    setTableDataOriginal(data)
    if (selectedTable === 'dashboards' || selectedTable === 'suites') {
      setTableData(data.map((item) => ({ value: item.id, label: item.name })))
    }
    setTableDataAttribute(tablesAtributes[selectedTable])
    setLoadingDatas(false)
  }

  useEffect(() => {
    fetchTableDatas()
  }, [selectedTable])

  useEffect(() => {
    if (!selectedTableDataAttribute) return
    const selectedData = tableDataOriginal.find(
      (item) => item.id === selectedTableData,
    )
    const nextJson = JSON.stringify(
      selectedData?.[selectedTableDataAttribute] || {},
      null,
      2,
    )
    setJsonData(nextJson)
    setJsonFromDB(nextJson)
  }, [selectedTableDataAttribute])

  const fetchTableDatasToReload = async () => {
    if (!selectedClient) return
    setLoadingConfig(true)
    setJsonData('{}')
    const response = await fetch(
      `${API_URL}/clients/${selectedEnv}/${selectedClient}/${selectedTable}/`,
    )
    const data = (await response.json()) as any[]
    setTableDataOriginal(data)
    if (selectedTable === 'dashboards' || selectedTable === 'suites') {
      setTableData(data.map((item) => ({ value: item.id, label: item.name })))
      const selectedData = data.find((item) => item.id === selectedTableData)
      const nextJson = JSON.stringify(
        selectedData?.[selectedTableDataAttribute] || {},
        null,
        2,
      )
      setJsonData(nextJson)
      setJsonFromDB(nextJson)
    }
    setLoadingConfig(false)
  }

  const envSelectId = `${workspaceId}-environment`

  return (
    <section className="workspace">
      <header className="workspace-header">
        <div className="config-bar">
          <div className="control-group">
            <label htmlFor={envSelectId}>Environment</label>
            <div className="control-row">
              <select
                className="environment-select"
                name={envSelectId}
                id={envSelectId}
                onChange={(event) => setSelectedEnv(event.target.value)}
                value={selectedEnv}
              >
                {dbEnvs.map((env) => (
                  <option key={env} value={env}>
                    {env}
                  </option>
                ))}
              </select>
              <button
                className="icon-action"
                onClick={fetchClients}
                disabled={loadingEnv || isGetClients === selectedEnv}
                title="Connect to environment"
                aria-label="Connect to environment"
              >
                {loadingEnv ? <Loader /> : <IconPlug />}
              </button>
            </div>
          </div>

          <div className="mode-tabs">
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
            <div className="control-group">
              <label>Config</label>
              <div className="control-row">
                <Select
                  options={options}
                  setValue={setSelectedClient}
                  value={selectedClient}
                />
                <button
                  className="icon-action"
                  onClick={fetchClientConfig}
                  title="Reload config"
                  aria-label="Reload config"
                >
                  <IconReload />
                </button>
                {loadingConfig && <Loader />}
              </div>
            </div>
          ) : (
            <div className="client-controls">
              <div className="control-group">
                <label>Client</label>
                <Select
                  options={options}
                  setValue={setSelectedClient}
                  value={selectedClient}
                />
              </div>
              <div className="control-group">
                <label>Table</label>
                <div className="control-row">
                  <Select
                    options={optionsTable}
                    setValue={setSelectedTable}
                    value={selectedTable}
                  />
                  {loadingDatas && <Loader />}
                </div>
              </div>
              <div className="control-group">
                <label>Data</label>
                <Select
                  options={optionsTableData}
                  setValue={setSelectedTableData}
                  value={selectedTableData}
                />
              </div>
              <div className="control-group">
                <label>Attribute</label>
                <div className="control-row">
                  <Select
                    options={optionsTableDataAttribute}
                    setValue={setSelectedTableDataAttribute}
                    value={selectedTableDataAttribute}
                  />
                  <button
                    className="icon-action"
                    onClick={fetchTableDatasToReload}
                    title="Reload data"
                    aria-label="Reload data"
                  >
                    <IconReload />
                  </button>
                  {loadingConfig && <Loader />}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="editor-panel">
        <div
          className="editor-toolbar"
          role="toolbar"
          aria-label={`Editor tools ${workspaceId}`}
        >
          <div className="editor-tool-tabs">
            <button
              className="editor-tool-tab"
              onClick={formatJson}
              aria-label="Format JSON"
              data-tooltip="Format JSON"
            >
              <WandSparkles aria-hidden="true" />
            </button>
            <button
              className="editor-tool-tab"
              onClick={collapseAll}
              aria-label="Collapse all"
              data-tooltip="Collapse all"
            >
              <FoldVertical aria-hidden="true" />
            </button>
            <button
              className="editor-tool-tab"
              onClick={unCollapseAll}
              aria-label="Expand all"
              data-tooltip="Expand all"
            >
              <UnfoldVertical aria-hidden="true" />
            </button>
            <div className="editor-section-tabs">
              <button
                className="editor-tool-tab"
                onClick={collapseSection}
                aria-label="Collapse selected section"
                data-tooltip="Collapse section · Alt+S toggles"
              >
                <FoldHorizontal aria-hidden="true" />
              </button>
              <button
                className="editor-tool-tab"
                onClick={unCollapseSection}
                aria-label="Expand selected section"
                data-tooltip="Expand section · Alt+S toggles"
              >
                <UnfoldHorizontal aria-hidden="true" />
              </button>
            </div>
          </div>

          {showSplitControl && (
            <div className="workspace-middle-tabs">
              <button
                className="editor-tool-tab split-tab"
                onClick={onToggleSplit}
                aria-label={
                  isSplit ? 'Close comparison' : 'Compare side by side'
                }
                data-tooltip={
                  isSplit ? 'Close comparison' : 'Compare side by side'
                }
              >
                {isSplit ? (
                  <PanelRightClose aria-hidden="true" />
                ) : (
                  <Columns2 aria-hidden="true" />
                )}
              </button>
              <button
                className="editor-tool-tab schema-tab"
                onClick={onOpenSchemaManager}
                aria-label="Update config schema"
                data-tooltip="Update config schema"
              >
                <FileCog aria-hidden="true" />
              </button>
            </div>
          )}

          <div className="save-area">
            {isSaving && <Loader />}
            <button
              className="save-tab"
              onClick={saveJson}
              disabled={isSaveDisabled || isSaving}
              aria-label="Save changes"
              data-tooltip="Save changes"
            >
              <Save aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="editor-frame">
          <Editor
            height="100%"
            width="100%"
            language="json"
            path={
              selectTab === 0
                ? getBaseClientConfigModelUri(workspaceId)
                : getClientDataModelUri(workspaceId)
            }
            theme="vs-dark"
            value={jsonData}
            onChange={(value) => {
              if (value === undefined) return
              debouncedJsonData(value)
            }}
            options={{
              automaticLayout: true,
              fontFamily: 'Fira Code, monospace',
              fontSize: 14,
              tabSize: 2,
              insertSpaces: true,
              detectIndentation: false,
              lineNumbers: 'on',
            }}
            beforeMount={configureJsonSchemas}
            onMount={(editor, monaco) => {
              setEditorInstance(editor)
              editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyS, () =>
                toggleSectionAction(editor),
              )
            }}
          />
        </div>
      </div>
    </section>
  )
}

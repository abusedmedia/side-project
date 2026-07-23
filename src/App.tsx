import { useCallback, useEffect, useRef, useState } from 'react'
import { generateMatterCode } from './generateMatterCode'
import {
  createMatterScript,
  installScriptTracking,
  type MatterScope,
  type MatterScript,
  type WallConfig,
} from './matterScripts'
import { LeftSidebar } from './components/LeftSidebar'
import { RightSidebar } from './components/RightSidebar'
import { MatterCanvas } from './components/MatterCanvas'
import {
  SIDEBAR_DEFAULT,
  SIDEBAR_MAX,
  SIDEBAR_MIN,
} from './constants/layout'

type WallSides = Pick<WallConfig, 'bottom' | 'top' | 'left' | 'right'>

const DEFAULT_WALL_SIDES: WallSides = {
  bottom: true,
  top: true,
  left: true,
  right: true,
}

function App() {
  const scopeRef = useRef<MatterScope | null>(null)
  const trackingRef = useRef(installScriptTracking())
  const scriptsRef = useRef<MatterScript[]>([])
  const [error, setError] = useState<string | null>(null)
  const [scripts, setScripts] = useState<MatterScript[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [codeDrafts, setCodeDrafts] = useState<Record<string, string>>({})
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT)
  const [rightSidebarWidth, setRightSidebarWidth] = useState(SIDEBAR_DEFAULT)
  const [sidebarsHidden, setSidebarsHidden] = useState(false)
  const [resizingLeft, setResizingLeft] = useState(false)
  const [resizingRight, setResizingRight] = useState(false)
  const [gravityEnabled, setGravityEnabled] = useState(true)
  const [gravityX, setGravityX] = useState(0)
  const [gravityY, setGravityY] = useState(1)
  const [gravityScale, setGravityScale] = useState(0.001)
  const [debugView, setDebugView] = useState(false)
  const [wallsEnabled, setWallsEnabled] = useState(true)
  const [wallSides, setWallSides] = useState(DEFAULT_WALL_SIDES)

  const resizing = resizingLeft || resizingRight

  const handleScopeChange = useCallback((scope: MatterScope | null) => {
    scopeRef.current = scope
  }, [])

  const handleScriptsCleanup = useCallback(() => {
    for (const script of scriptsRef.current) {
      script.remove()
    }
    scriptsRef.current = []
    setScripts([])
    setSelectedId(null)
    setCodeDrafts({})
  }, [])

  useEffect(() => {
    if (!resizingLeft) return

    const onMove = (e: PointerEvent) => {
      const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, e.clientX))
      setSidebarWidth(next)
    }
    const onUp = () => setResizingLeft(false)

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [resizingLeft])

  useEffect(() => {
    if (!resizingRight) return

    const onMove = (e: PointerEvent) => {
      const next = Math.min(
        SIDEBAR_MAX,
        Math.max(SIDEBAR_MIN, window.innerWidth - e.clientX),
      )
      setRightSidebarWidth(next)
    }
    const onUp = () => setResizingRight(false)

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [resizingRight])

  const addGeneratedCode = (source: string, title: string): boolean => {
    const scope = scopeRef.current
    if (!scope) {
      setError('Engine is not ready yet')
      return false
    }

    try {
      const script = createMatterScript(
        source,
        scope,
        trackingRef.current,
        title,
        [{ request: title, code: source }],
      )
      scriptsRef.current = [...scriptsRef.current, script]
      setScripts(scriptsRef.current)
      setError(null)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      return false
    }
  }

  const replaceGeneratedCode = (
    id: string,
    source: string,
    title: string,
    history: MatterScript['history'],
  ): boolean => {
    const scope = scopeRef.current
    if (!scope) {
      setError('Engine is not ready yet')
      return false
    }

    const index = scriptsRef.current.findIndex((s) => s.id === id)
    if (index === -1) {
      setError('Selected object no longer exists')
      return false
    }

    try {
      const script = createMatterScript(
        source,
        scope,
        trackingRef.current,
        title,
        history,
      )
      scriptsRef.current[index].remove()
      const next = [...scriptsRef.current]
      next[index] = script
      scriptsRef.current = next
      setScripts(next)
      setSelectedId((current) => (current === id ? script.id : current))
      setError(null)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      return false
    }
  }

  const removeScript = (id: string) => {
    const script = scriptsRef.current.find((s) => s.id === id)
    if (!script) return
    script.remove()
    scriptsRef.current = scriptsRef.current.filter((s) => s.id !== id)
    setScripts(scriptsRef.current)
    setSelectedId((current) => (current === id ? null : current))
    setCodeDrafts((prev) => {
      if (!(id in prev)) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const runObjectCode = (id: string) => {
    const script = scriptsRef.current.find((s) => s.id === id)
    if (!script) return
    const source = codeDrafts[id] ?? script.code
    const history =
      source === script.code
        ? script.history
        : [...script.history, { request: 'Manual edit', code: source }]
    const ok = replaceGeneratedCode(id, source, script.title, history)
    if (ok) {
      setCodeDrafts((prev) => {
        if (!(id in prev)) return prev
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  const selectObjectRevision = (id: string, revisionIndex: number) => {
    const script = scriptsRef.current.find((s) => s.id === id)
    const revision = script?.history[revisionIndex]
    if (!script || !revision) return

    const ok = replaceGeneratedCode(
      id,
      revision.code,
      script.title,
      script.history,
    )
    if (ok) {
      setCodeDrafts((prev) => {
        if (!(id in prev)) return prev
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  const clearAll = () => {
    for (const script of scriptsRef.current) {
      script.remove()
    }
    scriptsRef.current = []
    setScripts([])
    setSelectedId(null)
    setCodeDrafts({})
    setError(null)
  }

  const addEmptyObject = () => {
    const scope = scopeRef.current
    if (!scope) {
      setError('Engine is not ready yet')
      return
    }

    try {
      const title = 'Empty'
      const source = ''
      const script = createMatterScript(
        source,
        scope,
        trackingRef.current,
        title,
        [{ request: title, code: source }],
      )
      scriptsRef.current = [...scriptsRef.current, script]
      setScripts(scriptsRef.current)
      setSelectedId(script.id)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleCodeChange = (id: string, code: string) => {
    setCodeDrafts((prev) => ({ ...prev, [id]: code }))
  }

  const toggleSelection = (id: string) => {
    setSelectedId((current) => (current === id ? null : id))
  }

  const askForCode = async () => {
    const request = prompt.trim()
    if (!request || generating) return

    const editingId = selectedId
    const selectedScript = editingId
      ? scriptsRef.current.find((s) => s.id === editingId)
      : undefined

    if (editingId && !selectedScript) {
      setError('Selected object no longer exists')
      setSelectedId(null)
      return
    }

    setGenerating(true)
    setError(null)
    try {
      const generated = await generateMatterCode(
        request,
        {
          enabled: wallsEnabled,
          ...wallSides,
        },
        selectedScript ? { history: selectedScript.history } : undefined,
      )
      const ok = selectedScript
        ? replaceGeneratedCode(selectedScript.id, generated, request, [
            ...selectedScript.history,
            { request, code: generated },
          ])
        : addGeneratedCode(generated, request)
      if (ok) {
        setPrompt('')
        if (selectedScript) {
          setCodeDrafts((prev) => {
            if (!(selectedScript.id in prev)) return prev
            const next = { ...prev }
            delete next[selectedScript.id]
            return next
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setGenerating(false)
    }
  }

  const selectedScript =
    scripts.find((script) => script.id === selectedId) ?? null
  const objectCode = selectedScript
    ? (codeDrafts[selectedScript.id] ?? selectedScript.code)
    : ''
  const objectCodeDirty =
    selectedScript !== null && objectCode !== selectedScript.code

  const toggleSidebars = () => {
    setResizingLeft(false)
    setResizingRight(false)
    setSidebarsHidden((hidden) => !hidden)
  }

  return (
    <div className={`app${resizing ? ' app--resizing' : ''}`}>
      {sidebarsHidden ? (
        <button
          type="button"
          className="sidebar-toggle sidebar-toggle--collapsed"
          aria-label="Show sidebars"
          title="Show sidebars"
          onClick={toggleSidebars}
        >
          »
        </button>
      ) : (
        <LeftSidebar
          width={sidebarWidth}
          scripts={scripts}
          selectedId={selectedId}
          error={error}
          prompt={prompt}
          generating={generating}
          onClearAll={clearAll}
          onAddEmpty={addEmptyObject}
          onClearSelection={() => setSelectedId(null)}
          onToggleSelection={toggleSelection}
          onRunScript={runObjectCode}
          onRemoveScript={removeScript}
          onPromptChange={setPrompt}
          onSubmit={() => void askForCode()}
          onToggleSidebars={toggleSidebars}
          onResizeStart={() => setResizingLeft(true)}
        />
      )}

      <MatterCanvas
        wallsEnabled={wallsEnabled}
        wallSides={wallSides}
        gravityEnabled={gravityEnabled}
        gravityX={gravityX}
        gravityY={gravityY}
        gravityScale={gravityScale}
        debugView={debugView}
        selectedId={sidebarsHidden ? null : selectedId}
        scripts={scripts}
        onScopeChange={handleScopeChange}
        onScriptsCleanup={handleScriptsCleanup}
      />

      {!sidebarsHidden ? (
        <RightSidebar
          width={rightSidebarWidth}
          selectedScript={selectedScript}
          objectCode={objectCode}
          objectCodeDirty={objectCodeDirty}
          gravityEnabled={gravityEnabled}
          gravityX={gravityX}
          gravityY={gravityY}
          gravityScale={gravityScale}
          wallsEnabled={wallsEnabled}
          wallSides={wallSides}
          debugView={debugView}
          onGravityEnabledChange={setGravityEnabled}
          onGravityXChange={setGravityX}
          onGravityYChange={setGravityY}
          onGravityScaleChange={setGravityScale}
          onWallsEnabledChange={setWallsEnabled}
          onWallSidesChange={setWallSides}
          onDebugViewChange={setDebugView}
          onObjectCodeChange={(code) => {
            if (selectedScript) handleCodeChange(selectedScript.id, code)
          }}
          onRunObjectCode={() => {
            if (selectedScript) runObjectCode(selectedScript.id)
          }}
          onSelectObjectRevision={(index) => {
            if (selectedScript) selectObjectRevision(selectedScript.id, index)
          }}
          onResizeStart={() => setResizingRight(true)}
        />
      ) : null}
    </div>
  )
}

export default App

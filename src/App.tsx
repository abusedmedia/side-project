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
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT)
  const [rightSidebarWidth, setRightSidebarWidth] = useState(SIDEBAR_DEFAULT)
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
      setViewingId((current) => (current === id ? script.id : current))
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
    setViewingId((current) => (current === id ? null : current))
    setSelectedId((current) => (current === id ? null : current))
  }

  const reloadScript = (id: string) => {
    const script = scriptsRef.current.find((s) => s.id === id)
    if (!script) return
    replaceGeneratedCode(id, script.code, script.title, script.history)
  }

  const clearAll = () => {
    for (const script of scriptsRef.current) {
      script.remove()
    }
    scriptsRef.current = []
    setScripts([])
    setViewingId(null)
    setSelectedId(null)
    setError(null)
  }

  const toggleSelection = (id: string) => {
    setSelectedId((current) => (current === id ? null : id))
  }

  const toggleView = (id: string) => {
    setViewingId((current) => (current === id ? null : id))
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
      if (ok) setPrompt('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className={`app${resizing ? ' app--resizing' : ''}`}>
      <LeftSidebar
        width={sidebarWidth}
        scripts={scripts}
        viewingId={viewingId}
        selectedId={selectedId}
        error={error}
        prompt={prompt}
        generating={generating}
        onClearAll={clearAll}
        onToggleSelection={toggleSelection}
        onToggleView={toggleView}
        onReloadScript={reloadScript}
        onRemoveScript={removeScript}
        onPromptChange={setPrompt}
        onSubmit={() => void askForCode()}
        onResizeStart={() => setResizingLeft(true)}
      />

      <MatterCanvas
        wallsEnabled={wallsEnabled}
        wallSides={wallSides}
        gravityEnabled={gravityEnabled}
        gravityX={gravityX}
        gravityY={gravityY}
        gravityScale={gravityScale}
        debugView={debugView}
        selectedId={selectedId}
        scripts={scripts}
        onScopeChange={handleScopeChange}
        onScriptsCleanup={handleScriptsCleanup}
      />

      <RightSidebar
        width={rightSidebarWidth}
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
        onResizeStart={() => setResizingRight(true)}
      />
    </div>
  )
}

export default App

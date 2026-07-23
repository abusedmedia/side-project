import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import type { MatterScript, MatterScope, WallConfig } from '../matterScripts'

type MatterCanvasProps = {
  wallsEnabled: boolean
  wallSides: Pick<WallConfig, 'bottom' | 'top' | 'left' | 'right'>
  gravityEnabled: boolean
  gravityX: number
  gravityY: number
  gravityScale: number
  debugView: boolean
  selectedId: string | null
  scripts: MatterScript[]
  onScopeChange: (scope: MatterScope | null) => void
  onScriptsCleanup: () => void
}

export function MatterCanvas({
  wallsEnabled,
  wallSides,
  gravityEnabled,
  gravityX,
  gravityY,
  gravityScale,
  debugView,
  selectedId,
  scripts,
  onScopeChange,
  onScriptsCleanup,
}: MatterCanvasProps) {
  const sceneRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<Matter.Engine | null>(null)
  const renderRef = useRef<Matter.Render | null>(null)
  const scopeRef = useRef<MatterScope | null>(null)
  const wallsRef = useRef<{
    ground: Matter.Body
    ceiling: Matter.Body
    left: Matter.Body
    right: Matter.Body
  } | null>(null)
  const wallInWorldRef = useRef({
    ground: false,
    ceiling: false,
    left: false,
    right: false,
  })
  const wallConfigRef = useRef<WallConfig>({
    enabled: wallsEnabled,
    ...wallSides,
  })
  const selectedIdRef = useRef<string | null>(selectedId)
  const scriptsRef = useRef(scripts)
  const onScopeChangeRef = useRef(onScopeChange)
  const onScriptsCleanupRef = useRef(onScriptsCleanup)
  const [engineReady, setEngineReady] = useState(false)

  onScopeChangeRef.current = onScopeChange
  onScriptsCleanupRef.current = onScriptsCleanup

  useEffect(() => {
    wallConfigRef.current = {
      enabled: wallsEnabled,
      ...wallSides,
    }
    const scope = scopeRef.current
    if (scope) {
      scope.walls = { ...wallConfigRef.current }
    }
  }, [wallsEnabled, wallSides])

  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

  useEffect(() => {
    scriptsRef.current = scripts
  }, [scripts])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return

    if (gravityEnabled) {
      engine.gravity.x = gravityX
      engine.gravity.y = gravityY
      engine.gravity.scale = gravityScale
    } else {
      engine.gravity.x = 0
      engine.gravity.y = 0
    }
  }, [gravityEnabled, gravityX, gravityY, gravityScale])

  useEffect(() => {
    const render = renderRef.current
    if (!render) return
    render.options.wireframes = debugView
  }, [debugView])

  useEffect(() => {
    if (!engineReady) return

    const walls = wallsRef.current
    const world = engineRef.current?.world
    if (!walls || !world) return

    const { Composite } = Matter
    const config = wallConfigRef.current

    const syncBody = (
      body: Matter.Body,
      key: 'ground' | 'ceiling' | 'left' | 'right',
      enabled: boolean,
    ) => {
      const inWorld = wallInWorldRef.current[key]
      if (enabled && !inWorld) {
        Composite.add(world, body)
        wallInWorldRef.current[key] = true
      } else if (!enabled && inWorld) {
        Composite.remove(world, body)
        wallInWorldRef.current[key] = false
      }
    }

    syncBody(walls.ground, 'ground', config.enabled && config.bottom)
    syncBody(walls.ceiling, 'ceiling', config.enabled && config.top)
    syncBody(walls.left, 'left', config.enabled && config.left)
    syncBody(walls.right, 'right', config.enabled && config.right)
  }, [wallsEnabled, wallSides, engineReady])

  useEffect(() => {
    const container = sceneRef.current
    if (!container) return

    const {
      Engine,
      Render,
      Runner,
      Bodies,
      Body,
      Common,
      Composite,
      Composites,
      Constraint,
      Vector,
      Mouse,
      MouseConstraint,
    } = Matter

    const engine = Engine.create()
    engineRef.current = engine
    let width = container.clientWidth || window.innerWidth
    let height = container.clientHeight || window.innerHeight

    const render = Render.create({
      element: container,
      engine,
      options: {
        width,
        height,
        wireframes: false,
        background: '#000000',
      },
    })
    renderRef.current = render

    const ground = Bodies.rectangle(width / 2, height + 25, width, 50, {
      isStatic: true,
    })
    const leftWall = Bodies.rectangle(-25, height / 2, 50, height, {
      isStatic: true,
    })
    const rightWall = Bodies.rectangle(width + 25, height / 2, 50, height, {
      isStatic: true,
    })
    const ceiling = Bodies.rectangle(width / 2, -25, width, 50, {
      isStatic: true,
    })

    wallsRef.current = {
      ground,
      ceiling,
      left: leftWall,
      right: rightWall,
    }

    const mouse = Mouse.create(render.canvas)
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    })
    Composite.add(engine.world, mouseConstraint)
    render.mouse = mouse

    Render.run(render)
    const runner = Runner.create()
    Runner.run(runner, engine)

    const onAfterRender = () => {
      const id = selectedIdRef.current
      if (!id) return

      const script = scriptsRef.current.find((s) => s.id === id)
      if (!script) return

      const bodies = script.getBodies()
      if (bodies.length === 0) return

      const context = render.context
      // Matter ends the lookAt/bounds view transform before afterRender;
      // re-apply it so world-space vertices align with on-screen bodies.
      const hasBounds = Boolean(render.options.hasBounds)
      if (hasBounds) Render.startViewTransform(render)

      context.beginPath()
      for (const body of bodies) {
        const vertices = body.vertices
        context.moveTo(vertices[0].x, vertices[0].y)
        for (let i = 1; i < vertices.length; i++) {
          context.lineTo(vertices[i].x, vertices[i].y)
        }
        context.closePath()
      }
      context.lineWidth = 3
      context.strokeStyle = '#4da6ff'
      context.stroke()

      if (hasBounds) Render.endViewTransform(render)
    }

    Matter.Events.on(render, 'afterRender', onAfterRender)

    const syncScope = (w: number, h: number) => {
      const scope: MatterScope = {
        Matter,
        Engine,
        Bodies,
        Body,
        Common,
        Composite,
        Composites,
        Constraint,
        Mouse,
        MouseConstraint,
        Render,
        Vector,
        engine,
        world: engine.world,
        render,
        width: w,
        height: h,
        walls: { ...wallConfigRef.current },
      }
      scopeRef.current = scope
      onScopeChangeRef.current(scope)
    }
    syncScope(width, height)

    setEngineReady(true)

    const fitToContainer = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      if (w < 1 || h < 1) return

      const scaleX = w / width
      const scaleY = h / height

      Render.setSize(render, w, h)

      Body.setPosition(ground, { x: w / 2, y: h + 25 })
      Body.scale(ground, scaleX, 1)
      Body.setPosition(ceiling, { x: w / 2, y: -25 })
      Body.scale(ceiling, scaleX, 1)
      Body.setPosition(leftWall, { x: -25, y: h / 2 })
      Body.scale(leftWall, 1, scaleY)
      Body.setPosition(rightWall, { x: w + 25, y: h / 2 })
      Body.scale(rightWall, 1, scaleY)

      width = w
      height = h
      syncScope(w, h)
    }

    const resizeObserver = new ResizeObserver(fitToContainer)
    resizeObserver.observe(container)
    window.addEventListener('resize', fitToContainer)

    return () => {
      Matter.Events.off(render, 'afterRender', onAfterRender)
      resizeObserver.disconnect()
      window.removeEventListener('resize', fitToContainer)
      onScriptsCleanupRef.current()
      scopeRef.current = null
      onScopeChangeRef.current(null)
      wallsRef.current = null
      wallInWorldRef.current = {
        ground: false,
        ceiling: false,
        left: false,
        right: false,
      }
      engineRef.current = null
      renderRef.current = null
      setEngineReady(false)
      Render.stop(render)
      Runner.stop(runner)
      render.canvas.remove()
      Engine.clear(engine)
    }
  }, [])

  return <div ref={sceneRef} className="matter-scene" />
}

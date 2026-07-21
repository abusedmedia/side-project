import Matter from 'matter-js'

export type WallConfig = {
  enabled: boolean
  bottom: boolean
  top: boolean
  left: boolean
  right: boolean
}

export type MatterScope = {
  Matter: typeof Matter
  Engine: typeof Matter.Engine
  Bodies: typeof Matter.Bodies
  Body: typeof Matter.Body
  Composite: typeof Matter.Composite
  Constraint: typeof Matter.Constraint
  Vector: typeof Matter.Vector
  engine: Matter.Engine
  world: Matter.World
  width: number
  height: number
  walls: WallConfig
}

export type ScriptProps = MatterScope & {
  script: MatterScript
}

/** Controllable object for one submitted snippet. */
export type MatterScriptRevision = {
  request: string
  code: string
}

export type MatterScript = {
  id: string
  title: string
  code: string
  history: MatterScriptRevision[]
  getBodies: () => Matter.Body[]
  remove: () => void
}

type WorldObject =
  | Matter.Body
  | Matter.Composite
  | Matter.Constraint
  | Matter.MouseConstraint

type Listener = {
  obj: object
  name: string
  callback: (...args: unknown[]) => unknown
}

type TrackState = {
  id: string
  objects: WorldObject[]
  listeners: Listener[]
  removed: boolean
}

export type ScriptTracking = {
  begin: (id: string) => TrackState
  end: () => void
}

let trackingInstalled = false
let currentTrack: TrackState | null = null

function asObjectList(object: unknown): WorldObject[] {
  if (Array.isArray(object)) return object.filter(Boolean) as WorldObject[]
  if (object && typeof object === 'object') return [object as WorldObject]
  return []
}

function bodiesFromObjects(objects: WorldObject[]): Matter.Body[] {
  const bodies: Matter.Body[] = []
  for (const obj of objects) {
    if ('vertices' in obj && Array.isArray(obj.vertices)) {
      bodies.push(obj)
    } else if ('bodies' in obj && Array.isArray(obj.bodies)) {
      bodies.push(...Matter.Composite.allBodies(obj))
    }
  }
  return bodies
}

export function installScriptTracking(): ScriptTracking {
  if (!trackingInstalled) {
    trackingInstalled = true

    const origAdd = Matter.Composite.add
    Matter.Composite.add = ((composite, object) => {
      const result = origAdd(composite, object)
      if (currentTrack) {
        currentTrack.objects.push(...asObjectList(object))
      }
      return result
    }) as typeof Matter.Composite.add

    const origOn = Matter.Events.on
    Matter.Events.on = ((
      obj: object,
      name: string,
      callback: (...args: unknown[]) => unknown,
    ) => {
      if (!currentTrack) {
        return origOn(obj, name, callback)
      }

      const track = currentTrack
      const wrapped = function (this: unknown, ...args: unknown[]) {
        const prev = currentTrack
        currentTrack = track
        try {
          return callback.apply(this, args)
        } finally {
          currentTrack = prev
        }
      }

      track.listeners.push({ obj, name, callback: wrapped })
      return origOn(obj, name, wrapped)
    }) as typeof Matter.Events.on
  }

  return {
    begin(id) {
      const track: TrackState = {
        id,
        objects: [],
        listeners: [],
        removed: false,
      }
      currentTrack = track
      return track
    },
    end() {
      currentTrack = null
    },
  }
}

function removeTrackedFromWorld(track: TrackState, world: Matter.World): void {
  if (track.removed) return
  track.removed = true

  if (currentTrack === track) currentTrack = null

  for (const { obj, name, callback } of track.listeners) {
    Matter.Events.off(obj, name, callback)
  }
  track.listeners.length = 0

  for (let i = track.objects.length - 1; i >= 0; i--) {
    Matter.Composite.remove(world, track.objects[i])
  }
  track.objects.length = 0
}

export function createMatterScript(
  code: string,
  scope: MatterScope,
  tracking: ScriptTracking,
  title: string,
  history?: MatterScriptRevision[],
): MatterScript {
  const id = `script-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  const track = tracking.begin(id)

  const script: MatterScript = {
    id,
    title,
    code,
    history: history ?? [{ request: title, code }],
    getBodies: () => bodiesFromObjects(track.objects),
    remove: () => {
      removeTrackedFromWorld(track, scope.world)
    },
  }

  const props: ScriptProps = {
    ...scope,
    script,
  }

  try {
    const factory = new Function(
      `"use strict";
      return function setup(props) {
        const {
          Matter,
          Engine,
          Bodies,
          Body,
          Composite,
          Constraint,
          Vector,
          engine,
          world,
          width,
          height,
          walls,
          script,
        } = props;
        ${code}
      };`,
    ) as () => (props: ScriptProps) => void

    const setup = factory()
    setup(props)
  } catch (err) {
    tracking.end()
    removeTrackedFromWorld(track, scope.world)
    throw err
  }

  tracking.end()
  return script
}

import type { MatterScriptRevision, WallConfig } from './matterScripts'

const SYSTEM_PROMPT = `You write Matter.js snippets for a live physics sandbox called "matter-of-fact".

## Runtime
Your code is injected into this wrapper and executed once when the user clicks Add:

\`\`\`js
function setup(props) {
  const {
    Matter, Engine, Bodies, Body, Common, Composite, Composites, Constraint,
    Mouse, MouseConstraint, Render, Vector,
    engine, world, render, width, height, walls, script,
  } = props;
  // YOUR CODE HERE
}
\`\`\`

## Available bindings
- Matter, Engine, Bodies, Body, Common, Composite, Composites, Constraint, Mouse, MouseConstraint, Render, Vector
- engine — running Matter.Engine
- world — engine.world
- render — running Matter.Render instance (canvas, context, options)
- width, height — current canvas size in pixels
- walls — { enabled, bottom, top, left, right } booleans for which static boundaries exist
- script — { id, code, remove() } for this snippet (prefer not calling remove unless asked)

## World already present
- Static walls on sides where walls.<side> is true (bottom=ground, top=ceiling, left, right); respect the user's current wall config in each request
- Gravity is on (default Matter gravity)
- Mouse dragging is enabled globally
- Canvas origin is top-left; y increases downward
- Canvas background is black (#000000)

## Rules for generated code
1. Output ONLY raw JavaScript for the body of setup — no markdown fences, no imports, no export, no explanation.
2. Do NOT redefine setup, props, or shadow the provided bindings.
3. Add bodies with Composite.add(world, ...). Bodies and Matter.Events.on callbacks are auto-tracked so script.remove() can clean them up.
4. For continuous effects use Matter.Events.on(engine, 'beforeUpdate', handler) (or afterUpdate). Keep a bounded number of bodies; remove off-screen ones with Composite.remove(world, body).
5. Prefer Bodies.rectangle / circle / polygon / trapezoid and Constraint.create for joints.
6. Use width/height for placement (e.g. width * 0.5, height - 80). Avoid hardcoded huge coordinates.
7. Keep snippets self-contained and reasonably short.
8. If the user asks for motion, set velocity/angularVelocity or apply forces inside an event handler.
9. Color: unless the user explicitly requests a color, every body must use white — render: { fillStyle: '#ffffff' }. Only use other colors when the user specifies them.`

function stripCodeFences(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:javascript|js)?\s*([\s\S]*?)```$/i)
  if (fenced) return fenced[1].trim()
  return trimmed.replace(/^```(?:javascript|js)?\s*/i, '').replace(/\s*```$/, '').trim()
}

function formatWallConfig(walls: WallConfig): string {
  if (!walls.enabled) return 'walls disabled (open on all sides)'
  const active = (
    [
      ['bottom', walls.bottom],
      ['top', walls.top],
      ['left', walls.left],
      ['right', walls.right],
    ] as const
  )
    .filter(([, on]) => on)
    .map(([side]) => side)
  return active.length === 0
    ? 'walls enabled but no sides active (open on all sides)'
    : `walls on: ${active.join(', ')}`
}

function formatEditHistory(history: MatterScriptRevision[]): string {
  return history
    .map(
      (revision, index) =>
        `### Edit ${index + 1}\nRequest: ${revision.request}\nCode:\n${revision.code}`,
    )
    .join('\n\n')
}

export type GenerateMatterCodeOptions = {
  history?: MatterScriptRevision[]
}

function buildUserMessage(
  prompt: string,
  walls: WallConfig,
  history?: MatterScriptRevision[],
): string {
  const wallLine = formatWallConfig(walls)
  if (history && history.length > 0) {
    return [
      `Edit the existing Matter snippet below (${wallLine}).`,
      'Use the edit history to understand prior intent for this object.',
      'The last history entry is the current code. Apply the new user request and return the full updated setup body.',
      'Replace the previous snippet entirely — output only the new raw JavaScript.',
      '',
      '## Edit history (oldest → newest)',
      formatEditHistory(history),
      '',
      '## New user request',
      prompt.trim(),
    ].join('\n')
  }
  return `Add this to the Matter world (${wallLine}):\n${prompt.trim()}`
}

export async function generateMatterCode(
  prompt: string,
  walls: WallConfig,
  options: GenerateMatterCodeOptions = {},
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('Missing VITE_OPENAI_API_KEY in .env')
  }

  const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4.1-mini'

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildUserMessage(prompt, walls, options.history),
        },
      ],
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`OpenAI ${response.status}: ${detail.slice(0, 200)}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content
  if (!content?.trim()) {
    throw new Error('OpenAI returned an empty response')
  }

  return stripCodeFences(content)
}

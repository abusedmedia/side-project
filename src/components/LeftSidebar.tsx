import type { MatterScript } from '../matterScripts'
import { SIDEBAR_MAX, SIDEBAR_MIN } from '../constants/layout'

type LeftSidebarProps = {
  width: number
  scripts: MatterScript[]
  viewingId: string | null
  selectedId: string | null
  error: string | null
  prompt: string
  generating: boolean
  onClearAll: () => void
  onToggleSelection: (id: string) => void
  onToggleView: (id: string) => void
  onReloadScript: (id: string) => void
  onRemoveScript: (id: string) => void
  onCodeChange: (id: string, code: string) => void
  codeDrafts: Record<string, string>
  onPromptChange: (value: string) => void
  onSubmit: () => void
  onResizeStart: () => void
}

export function LeftSidebar({
  width,
  scripts,
  viewingId,
  selectedId,
  error,
  prompt,
  generating,
  onClearAll,
  onToggleSelection,
  onToggleView,
  onReloadScript,
  onRemoveScript,
  onCodeChange,
  codeDrafts,
  onPromptChange,
  onSubmit,
  onResizeStart,
}: LeftSidebarProps) {
  const isEditing = selectedId !== null

  return (
    <aside className="sidebar" style={{ width, flexBasis: width }}>
      <div className="sidebar__main">
        <div className="sidebar__section">
          <div className="sidebar__header">
            <h2 className="sidebar__title">Objects</h2>
            <button
              type="button"
              className="sidebar__clear"
              onClick={onClearAll}
              disabled={scripts.length === 0}
            >
              Clear all
            </button>
          </div>
          {scripts.length > 0 ? (
            <ul className="script-list">
              {scripts.map((script, index) => {
                const isOpen = viewingId === script.id
                const isSelected = selectedId === script.id
                return (
                  <li
                    key={script.id}
                    className={`script-list__item${isSelected ? ' script-list__item--selected' : ''}`}
                  >
                    <div
                      className="script-list__row"
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      onClick={() => onToggleSelection(script.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onToggleSelection(script.id)
                        }
                      }}
                    >
                      <div className="script-list__meta">
                        <span className="script-list__index">#{index + 1}</span>
                        <span className="script-list__preview">
                          {script.title.slice(0, 36)}
                          {script.title.length > 36 ? '…' : ''}
                        </span>
                      </div>
                      <div className="script-list__actions">
                        <button
                          type="button"
                          className="script-list__action"
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleView(script.id)
                          }}
                        >
                          {isOpen ? 'Hide' : 'View'}
                        </button>
                        <button
                          type="button"
                          className="script-list__action"
                          onClick={(e) => {
                            e.stopPropagation()
                            onReloadScript(script.id)
                          }}
                        >
                          Reload
                        </button>
                        <button
                          type="button"
                          className="script-list__action script-list__action--danger"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveScript(script.id)
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    {isOpen ? (
                      <textarea
                        className="script-list__code"
                        value={codeDrafts[script.id] ?? script.code}
                        spellCheck={false}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        onChange={(e) => onCodeChange(script.id, e.target.value)}
                      />
                    ) : null}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="sidebar__empty">No objects yet</p>
          )}
          {error ? <p className="sidebar__error">{error}</p> : null}
        </div>
      </div>

      <form
        className="prompt-bar"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <input
          className="prompt-bar__input"
          type="text"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          placeholder={
            isEditing ? 'Describe the change…' : 'Ask to add something…'
          }
          disabled={generating}
          autoComplete="off"
        />
        <button
          type="submit"
          className="prompt-bar__submit"
          disabled={generating || !prompt.trim()}
          aria-busy={generating}
        >
          {generating ? (
            <>
              <span className="prompt-bar__spinner" aria-hidden="true" />
              {isEditing ? 'Editing…' : 'Generating…'}
            </>
          ) : isEditing ? (
            'Edit'
          ) : (
            'Generate'
          )}
        </button>
      </form>

      <div
        className="sidebar__resize"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        aria-valuenow={width}
        aria-valuemin={SIDEBAR_MIN}
        aria-valuemax={SIDEBAR_MAX}
        onPointerDown={(e) => {
          e.preventDefault()
          onResizeStart()
        }}
      />
    </aside>
  )
}

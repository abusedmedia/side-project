import type { MatterScript } from '../matterScripts'
import { SIDEBAR_MAX, SIDEBAR_MIN } from '../constants/layout'

type LeftSidebarProps = {
  width: number
  scripts: MatterScript[]
  selectedId: string | null
  error: string | null
  prompt: string
  generating: boolean
  onClearAll: () => void
  onAddEmpty: () => void
  onClearSelection: () => void
  onToggleSelection: (id: string) => void
  onRunScript: (id: string) => void
  onRemoveScript: (id: string) => void
  onPromptChange: (value: string) => void
  onSubmit: () => void
  onToggleSidebars: () => void
  onResizeStart: () => void
}

export function LeftSidebar({
  width,
  scripts,
  selectedId,
  error,
  prompt,
  generating,
  onClearAll,
  onAddEmpty,
  onClearSelection,
  onToggleSelection,
  onRunScript,
  onRemoveScript,
  onPromptChange,
  onSubmit,
  onToggleSidebars,
  onResizeStart,
}: LeftSidebarProps) {
  const isEditing = selectedId !== null

  return (
    <aside className="sidebar" style={{ width, flexBasis: width }}>
      <div className="sidebar__main" onClick={onClearSelection}>
        <div className="sidebar__section">
          <div className="sidebar__header">
            <div className="sidebar__header-title">
              <button
                type="button"
                className="sidebar-toggle"
                aria-label="Hide sidebars"
                title="Hide sidebars"
                onClick={(event) => {
                  event.stopPropagation()
                  onToggleSidebars()
                }}
              >
                «
              </button>
              <h2 className="sidebar__title">Objects</h2>
            </div>
            <div className="sidebar__header-actions">
              <button
                type="button"
                className="sidebar__add"
                aria-label="Add empty object"
                title="Add empty object"
                onClick={(event) => {
                  event.stopPropagation()
                  onAddEmpty()
                }}
              >
                +
              </button>
              <button
                type="button"
                className="sidebar__clear"
                onClick={onClearAll}
                disabled={scripts.length === 0}
              >
                Clear all
              </button>
            </div>
          </div>
          {scripts.length > 0 ? (
            <ul className="script-list">
              {scripts.map((script, index) => {
                const isSelected = selectedId === script.id
                return (
                  <li
                    key={script.id}
                    className={`script-list__item${isSelected ? ' script-list__item--selected' : ''}`}
                    onClick={(event) => event.stopPropagation()}
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
                            onRunScript(script.id)
                          }}
                        >
                          Run
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

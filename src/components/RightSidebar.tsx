import Editor from '@monaco-editor/react'
import { useEffect, useState } from 'react'
import type { MatterScript, WallConfig } from '../matterScripts'
import { SIDEBAR_MAX, SIDEBAR_MIN } from '../constants/layout'

type RightTab = 'global' | 'object'

type WallSides = Pick<WallConfig, 'bottom' | 'top' | 'left' | 'right'>

type RightSidebarProps = {
  width: number
  selectedScript: MatterScript | null
  objectCode: string
  objectCodeDirty: boolean
  gravityEnabled: boolean
  gravityX: number
  gravityY: number
  gravityScale: number
  wallsEnabled: boolean
  wallSides: WallSides
  debugView: boolean
  onGravityEnabledChange: (enabled: boolean) => void
  onGravityXChange: (value: number) => void
  onGravityYChange: (value: number) => void
  onGravityScaleChange: (value: number) => void
  onWallsEnabledChange: (enabled: boolean) => void
  onWallSidesChange: (sides: WallSides) => void
  onDebugViewChange: (enabled: boolean) => void
  onObjectCodeChange: (code: string) => void
  onRunObjectCode: () => void
  onSelectObjectRevision: (index: number) => void
  onResizeStart: () => void
}

export function RightSidebar({
  width,
  selectedScript,
  objectCode,
  objectCodeDirty,
  gravityEnabled,
  gravityX,
  gravityY,
  gravityScale,
  wallsEnabled,
  wallSides,
  debugView,
  onGravityEnabledChange,
  onGravityXChange,
  onGravityYChange,
  onGravityScaleChange,
  onWallsEnabledChange,
  onWallSidesChange,
  onDebugViewChange,
  onObjectCodeChange,
  onRunObjectCode,
  onSelectObjectRevision,
  onResizeStart,
}: RightSidebarProps) {
  const [rightTab, setRightTab] = useState<RightTab>('global')

  useEffect(() => {
    if (!selectedScript && rightTab === 'object') {
      setRightTab('global')
    }
  }, [rightTab, selectedScript])

  const activeRevision = selectedScript
    ? selectedScript.history.findLastIndex(
        (revision) => revision.code === selectedScript.code,
      )
    : -1

  return (
    <aside
      className="sidebar sidebar--right"
      style={{ width, flexBasis: width }}
    >
      <div className="tabbar" role="tablist" aria-label="Settings">
        <button
          type="button"
          role="tab"
          aria-selected={rightTab === 'global'}
          className={`tabbar__tab${rightTab === 'global' ? ' tabbar__tab--active' : ''}`}
          onClick={() => setRightTab('global')}
        >
          Global
        </button>
        {selectedScript ? (
          <button
            type="button"
            role="tab"
            aria-selected={rightTab === 'object'}
            className={`tabbar__tab${rightTab === 'object' ? ' tabbar__tab--active' : ''}`}
            onClick={() => setRightTab('object')}
          >
            Object
          </button>
        ) : null}
      </div>

      <div
        className={`sidebar__main${rightTab === 'object' ? ' sidebar__main--object' : ''}`}
      >
        {rightTab === 'global' ? (
          <div className="settings">
            <section className="settings__group">
              <h3 className="settings__heading">Gravity</h3>

              <label className="settings__row settings__row--toggle">
                <span className="settings__label">Enabled</span>
                <input
                  type="checkbox"
                  className="settings__checkbox"
                  checked={gravityEnabled}
                  onChange={(e) => onGravityEnabledChange(e.target.checked)}
                />
              </label>

              <label className="settings__row">
                <span className="settings__label">X</span>
                <input
                  type="range"
                  className="settings__range"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={gravityX}
                  disabled={!gravityEnabled}
                  onChange={(e) => onGravityXChange(Number(e.target.value))}
                />
                <span className="settings__value">{gravityX.toFixed(2)}</span>
              </label>

              <label className="settings__row">
                <span className="settings__label">Y</span>
                <input
                  type="range"
                  className="settings__range"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={gravityY}
                  disabled={!gravityEnabled}
                  onChange={(e) => onGravityYChange(Number(e.target.value))}
                />
                <span className="settings__value">{gravityY.toFixed(2)}</span>
              </label>

              <label className="settings__row">
                <span className="settings__label">Scale</span>
                <input
                  type="range"
                  className="settings__range"
                  min={0}
                  max={0.01}
                  step={0.0001}
                  value={gravityScale}
                  disabled={!gravityEnabled}
                  onChange={(e) => onGravityScaleChange(Number(e.target.value))}
                />
                <span className="settings__value">{gravityScale.toFixed(4)}</span>
              </label>
            </section>

            <section className="settings__group">
              <h3 className="settings__heading">Walls</h3>

              <label className="settings__row settings__row--toggle">
                <span className="settings__label">Enabled</span>
                <input
                  type="checkbox"
                  className="settings__checkbox"
                  checked={wallsEnabled}
                  onChange={(e) => onWallsEnabledChange(e.target.checked)}
                />
              </label>

              <label className="settings__row settings__row--toggle">
                <span className="settings__label">Bottom</span>
                <input
                  type="checkbox"
                  className="settings__checkbox"
                  checked={wallSides.bottom}
                  disabled={!wallsEnabled}
                  onChange={(e) =>
                    onWallSidesChange({ ...wallSides, bottom: e.target.checked })
                  }
                />
              </label>

              <label className="settings__row settings__row--toggle">
                <span className="settings__label">Top</span>
                <input
                  type="checkbox"
                  className="settings__checkbox"
                  checked={wallSides.top}
                  disabled={!wallsEnabled}
                  onChange={(e) =>
                    onWallSidesChange({ ...wallSides, top: e.target.checked })
                  }
                />
              </label>

              <label className="settings__row settings__row--toggle">
                <span className="settings__label">Left</span>
                <input
                  type="checkbox"
                  className="settings__checkbox"
                  checked={wallSides.left}
                  disabled={!wallsEnabled}
                  onChange={(e) =>
                    onWallSidesChange({ ...wallSides, left: e.target.checked })
                  }
                />
              </label>

              <label className="settings__row settings__row--toggle">
                <span className="settings__label">Right</span>
                <input
                  type="checkbox"
                  className="settings__checkbox"
                  checked={wallSides.right}
                  disabled={!wallsEnabled}
                  onChange={(e) =>
                    onWallSidesChange({ ...wallSides, right: e.target.checked })
                  }
                />
              </label>
            </section>

            <section className="settings__group">
              <h3 className="settings__heading">Debug</h3>

              <label className="settings__row settings__row--toggle">
                <span className="settings__label">Wireframe view</span>
                <input
                  type="checkbox"
                  className="settings__checkbox"
                  checked={debugView}
                  onChange={(e) => onDebugViewChange(e.target.checked)}
                />
              </label>
            </section>
          </div>
        ) : selectedScript ? (
          <div className="object-editor">
            <div className="object-editor__toolbar">
              <label className="object-editor__history">
                <span className="object-editor__label">History</span>
                <select
                  className="object-editor__select"
                  value={objectCodeDirty ? '' : activeRevision}
                  onChange={(event) =>
                    onSelectObjectRevision(Number(event.target.value))
                  }
                >
                  {objectCodeDirty ? (
                    <option value="" disabled>
                      Unsaved edit
                    </option>
                  ) : null}
                  {selectedScript.history.map((revision, index) => (
                    <option key={index} value={index}>
                      {index + 1}. {revision.request}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="object-editor__run"
                disabled={!objectCodeDirty}
                onClick={onRunObjectCode}
              >
                Run
              </button>
            </div>
            <div className="object-editor__monaco">
              <Editor
                language="javascript"
                theme="vs-dark"
                value={objectCode}
                onChange={(value) => onObjectCodeChange(value ?? '')}
                options={{
                  automaticLayout: true,
                  fontSize: 12,
                  minimap: { enabled: false },
                  padding: { top: 10 },
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div
        className="sidebar__resize sidebar__resize--left"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize settings panel"
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

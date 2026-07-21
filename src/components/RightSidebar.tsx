import { useState } from 'react'
import type { WallConfig } from '../matterScripts'
import { SIDEBAR_MAX, SIDEBAR_MIN } from '../constants/layout'

type RightTab = 'global'

type WallSides = Pick<WallConfig, 'bottom' | 'top' | 'left' | 'right'>

type RightSidebarProps = {
  width: number
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
  onResizeStart: () => void
}

export function RightSidebar({
  width,
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
  onResizeStart,
}: RightSidebarProps) {
  const [rightTab, setRightTab] = useState<RightTab>('global')

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
      </div>

      <div className="sidebar__main">
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

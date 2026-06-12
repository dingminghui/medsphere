interface GraphMapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFit: () => void;
}

function IconReset() {
  return (
    <svg className="graph-map-controls__icon" viewBox="0 0 24 24" aria-hidden>
      <path d="M5 9V5h4" />
      <path d="M19 9V5h-4" />
      <path d="M5 15v4h4" />
      <path d="M19 15v4h-4" />
      <circle cx="12" cy="12" r="1.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconFit() {
  return (
    <svg className="graph-map-controls__icon" viewBox="0 0 24 24" aria-hidden>
      <path d="M8 4H4v4" />
      <path d="M4 16v4h4" />
      <path d="M16 20h4v-4" />
      <path d="M20 8V4h-4" />
    </svg>
  );
}

export function GraphMapControls({ onZoomIn, onZoomOut, onReset, onFit }: GraphMapControlsProps) {
  return (
    <div className="graph-map-controls" aria-label="画布缩放">
      <aside className="glass-card graph-map-controls__stack-card">
        <div className="glass-card__glow glass-card__glow--blue" aria-hidden />
        <div className="glass-card__inner graph-map-controls__stack">
          <button type="button" className="graph-map-controls__btn" aria-label="放大" onClick={onZoomIn}>
            <span className="graph-map-controls__glyph">+</span>
          </button>
          <button type="button" className="graph-map-controls__btn" aria-label="缩小" onClick={onZoomOut}>
            <span className="graph-map-controls__glyph">−</span>
          </button>
          <button type="button" className="graph-map-controls__btn" aria-label="复位" onClick={onReset}>
            <IconReset />
          </button>
        </div>
      </aside>
      <aside className="glass-card graph-map-controls__fit-card">
        <div className="glass-card__glow glass-card__glow--blue" aria-hidden />
        <div className="glass-card__inner graph-map-controls__fit-inner">
          <button type="button" className="graph-map-controls__btn" aria-label="适应屏幕" onClick={onFit}>
            <IconFit />
          </button>
        </div>
      </aside>
    </div>
  );
}

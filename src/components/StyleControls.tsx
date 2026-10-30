import {
  CONTRAST_PRESETS,
  FONT_OPTIONS,
  MAX_ZOOM_PERCENT,
  MIN_ZOOM_PERCENT,
} from '../lib/projectionStyle';
import type { ProjectionStyle } from '../lib/types';

interface StyleControlsProps {
  style: ProjectionStyle;
  onChange: (style: ProjectionStyle) => void;
}

export default function StyleControls({ style, onChange }: StyleControlsProps) {
  function update(patch: Partial<ProjectionStyle>) {
    onChange({ ...style, ...patch });
  }

  return (
    <div className="style-controls">
      <label className="field">
        <span className="field-label">Agrandissement : {style.zoomPercent} %</span>
        <input
          type="range"
          min={MIN_ZOOM_PERCENT}
          max={MAX_ZOOM_PERCENT}
          step={10}
          value={style.zoomPercent}
          onChange={(event) => update({ zoomPercent: Number(event.target.value) })}
        />
      </label>

      <div className="field">
        <span className="field-label">Contraste</span>
        <div className="preset-row">
          {CONTRAST_PRESETS.map((preset) => {
            const active = preset.textColor === style.textColor && preset.backgroundColor === style.backgroundColor;
            return (
              <button
                key={preset.label}
                type="button"
                className={`preset-swatch ${active ? 'is-active' : ''}`}
                style={{ color: preset.textColor, backgroundColor: preset.backgroundColor }}
                onClick={() => update({ textColor: preset.textColor, backgroundColor: preset.backgroundColor })}
                aria-label={preset.label}
                title={preset.label}
              >
                Aa
              </button>
            );
          })}
        </div>
      </div>

      <div className="field-row">
        <label className="field">
          <span className="field-label">Couleur du texte</span>
          <input
            type="color"
            className="color-input"
            value={style.textColor}
            onChange={(event) => update({ textColor: event.target.value })}
          />
        </label>
        <label className="field">
          <span className="field-label">Couleur du fond</span>
          <input
            type="color"
            className="color-input"
            value={style.backgroundColor}
            onChange={(event) => update({ backgroundColor: event.target.value })}
          />
        </label>
      </div>

      <label className="field">
        <span className="field-label">Police</span>
        <select
          className="input"
          value={style.fontFamily}
          onChange={(event) => update({ fontFamily: event.target.value })}
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font.label} value={font.label}>
              {font.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field-label">Interligne : {style.lineHeight.toFixed(1)}</span>
        <input
          type="range"
          min={1}
          max={2.5}
          step={0.1}
          value={style.lineHeight}
          onChange={(event) => update({ lineHeight: Number(event.target.value) })}
        />
      </label>

      <label className="checkbox-row">
        <input type="checkbox" checked={style.bold} onChange={(event) => update({ bold: event.target.checked })} />
        <span>Texte en gras</span>
      </label>
    </div>
  );
}

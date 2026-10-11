import { textStats } from '../lib/diff';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
}

export function TextPane({ label, value, onChange, placeholder, rows = 8 }: Props) {
  const s = textStats(value);
  return (
    <section className="panel editor-panel">
      <header className="panel-head">
        <h2>{label}</h2>
        <span className="muted stats-chip">
          {s.chars} chars · {s.words} words · {s.lines} lines
        </span>
      </header>
      <textarea
        className="mono editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        spellCheck={false}
      />
    </section>
  );
}

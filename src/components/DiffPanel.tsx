import type { DiffMode, ParagraphChange } from '../types';
import { computeDiff, countDiffStats, summarizeChanges, type DiffPart } from '../lib/diff';

interface Props {
  title: string;
  a: string;
  b: string;
  mode: DiffMode;
  onModeChange: (m: DiffMode) => void;
  paragraphChanges?: ParagraphChange[];
  emptyHint?: string;
}

function renderParts(parts: DiffPart[], mode: DiffMode) {
  if (mode === 'lines') {
    return parts.flatMap((p, i) => {
      const lines = p.value.replace(/\n$/, '').split('\n');
      // empty string edge
      if (p.value === '') return [];
      const trailing = p.value.endsWith('\n');
      const items = lines.map((line, j) => {
        // skip phantom empty from trailing newline on last chunk only when appropriate
        if (j === lines.length - 1 && line === '' && trailing && lines.length > 1) {
          return null;
        }
        const cls = p.added ? 'diff-add' : p.removed ? 'diff-del' : 'diff-same';
        const mark = p.added ? '+' : p.removed ? '−' : ' ';
        return (
          <div key={`${i}-${j}`} className={`diff-line ${cls}`}>
            <span className="diff-mark">{mark}</span>
            <span className="diff-text">{line || ' '}</span>
          </div>
        );
      });
      return items.filter(Boolean);
    });
  }

  // word / char: inline spans
  return (
    <div className="diff-inline">
      {parts.map((p, i) => {
        const cls = p.added ? 'diff-add' : p.removed ? 'diff-del' : 'diff-same';
        return (
          <span key={i} className={cls}>
            {p.value}
          </span>
        );
      })}
    </div>
  );
}

export function DiffPanel({
  title,
  a,
  b,
  mode,
  onModeChange,
  paragraphChanges,
  emptyHint,
}: Props) {
  const empty = !a.trim() && !b.trim();
  const parts = empty ? [] : computeDiff(a, b, mode);
  const stats = empty ? { added: 0, removed: 0, changed: 0 } : countDiffStats(parts);
  const meaningful = paragraphChanges?.filter((c) => c.kind !== 'same') ?? [];

  return (
    <section className="panel diff-panel">
      <header className="panel-head">
        <h2>{title}</h2>
        <div className="panel-head-right">
          <div className="mode-toggle" role="group" aria-label="Diff granularity">
            {(['lines', 'words', 'chars'] as DiffMode[]).map((m) => (
              <button
                key={m}
                type="button"
                className={mode === m ? 'active' : ''}
                onClick={() => onModeChange(m)}
              >
                {m === 'lines' ? 'Lines' : m === 'words' ? 'Words' : 'Chars'}
              </button>
            ))}
          </div>
          {!empty && (
            <span className="muted stats-chip">
              +{stats.added} / −{stats.removed}
            </span>
          )}
        </div>
      </header>

      {empty ? (
        <div className="empty-state">
          <p>{emptyHint ?? 'Paste text on both sides to see a diff.'}</p>
        </div>
      ) : (
        <>
          <div className="diff-body mono">{renderParts(parts, mode)}</div>
          {meaningful.length > 0 && (
            <div className="para-summary">
              <div className="para-summary-title">{summarizeChanges(paragraphChanges!)}</div>
              <ul>
                {meaningful.slice(0, 8).map((c, i) => (
                  <li key={i}>
                    {c.kind === 'added' && (
                      <span className="chg-add">+ ADD {c.b}</span>
                    )}
                    {c.kind === 'removed' && (
                      <span className="chg-del">− DEL {c.a}</span>
                    )}
                    {c.kind === 'changed' && (
                      <span className="chg-chg">
                        ~ CHG {c.a} → {c.b}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

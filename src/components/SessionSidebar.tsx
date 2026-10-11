import type { Experiment } from '../types';

interface Props {
  sessions: Experiment[];
  onSave: () => void;
  onLoad: (exp: Experiment) => void;
  onDelete: (id: string) => void;
}

export function SessionSidebar({ sessions, onSave, onLoad, onDelete }: Props) {
  return (
    <aside className="panel session-sidebar">
      <header className="panel-head">
        <h2>Saved sessions</h2>
        <button type="button" className="btn btn-sm" onClick={onSave}>
          Save now
        </button>
      </header>

      {sessions.length === 0 ? (
        <div className="empty-state compact">
          <p>No saved sessions yet. Click &quot;Save now&quot;.</p>
        </div>
      ) : (
        <ul className="session-list">
          {sessions.map((s) => (
            <li key={s.id} className="session-item">
              <button type="button" className="session-load" onClick={() => onLoad(s)}>
                <span className="session-name">{s.name}</span>
                <span className="muted session-time">
                  {new Date(s.updatedAt).toLocaleString()}
                </span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-label={`Delete ${s.name}`}
                onClick={() => onDelete(s.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="sidebar-note muted">
        Auto-saves drafts to localStorage. Last 20 named sessions kept. Everything stays on this
        device.
      </p>
    </aside>
  );
}

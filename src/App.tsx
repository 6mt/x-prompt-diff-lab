import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ComparisonCard } from './components/ComparisonCard';
import { DiffPanel } from './components/DiffPanel';
import { SessionSidebar } from './components/SessionSidebar';
import { TextPane } from './components/TextPane';
import { downloadElementPng } from './lib/exportCard';
import {
  lineStats,
  outputChangeSummary,
  paragraphSummary,
  promptChangeSummary,
  toUnifiedDiff,
} from './lib/diff';
import {
  clearDraft,
  deleteSession,
  exportAllJson,
  importFromJson,
  loadDraft,
  loadSessions,
  newId,
  saveDraft,
  upsertSession,
  type Draft,
} from './lib/storage';
import { SAMPLE } from './sample';
import type { DiffMode, Experiment } from './types';
import './App.css';

const emptyDraft = (): Draft => ({
  taskBlurb: '',
  promptA: '',
  promptB: '',
  outputA: '',
  outputB: '',
});

function App() {
  const [taskBlurb, setTaskBlurb] = useState('');
  const [promptA, setPromptA] = useState('');
  const [promptB, setPromptB] = useState('');
  const [outputA, setOutputA] = useState('');
  const [outputB, setOutputB] = useState('');
  const [promptMode, setPromptMode] = useState<DiffMode>('lines');
  const [outputMode, setOutputMode] = useState<DiffMode>('lines');
  const [sessions, setSessions] = useState<Experiment[]>([]);
  const [status, setStatus] = useState('');
  const [sampleNote, setSampleNote] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    setSessions(loadSessions());
    const params = new URLSearchParams(window.location.search);
    if (params.get('sample') === '1') {
      loadSample(true);
    } else {
      const d = loadDraft();
      if (d) {
        setTaskBlurb(d.taskBlurb);
        setPromptA(d.promptA);
        setPromptB(d.promptB);
        setOutputA(d.outputA);
        setOutputB(d.outputB);
      }
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const t = window.setTimeout(() => {
      saveDraft({ taskBlurb, promptA, promptB, outputA, outputB });
    }, 400);
    return () => window.clearTimeout(t);
  }, [taskBlurb, promptA, promptB, outputA, outputB]);

  const promptPara = useMemo(() => paragraphSummary(promptA, promptB), [promptA, promptB]);
  const outputPara = useMemo(() => paragraphSummary(outputA, outputB), [outputA, outputB]);
  const pSummary = useMemo(() => promptChangeSummary(promptA, promptB), [promptA, promptB]);
  const oSummary = useMemo(() => outputChangeSummary(outputA, outputB), [outputA, outputB]);
  const pLineStats = useMemo(() => lineStats(promptA, promptB), [promptA, promptB]);

  const flash = useCallback((msg: string) => {
    setStatus(msg);
    window.setTimeout(() => setStatus(''), 2500);
  }, []);

  function loadSample(fromQuery = false) {
    setTaskBlurb(SAMPLE.taskBlurb);
    setPromptA(SAMPLE.promptA);
    setPromptB(SAMPLE.promptB);
    setOutputA(SAMPLE.outputA);
    setOutputB(SAMPLE.outputB);
    setSampleNote(fromQuery ? 'Sample loaded via ?sample=1' : 'Sample loaded');
    if (!fromQuery) flash('Sample experiment loaded');
  }

  function swapAB() {
    setPromptA(promptB);
    setPromptB(promptA);
    setOutputA(outputB);
    setOutputB(outputA);
    flash('Swapped A ↔ B');
  }

  function clearAll() {
    const d = emptyDraft();
    setTaskBlurb(d.taskBlurb);
    setPromptA(d.promptA);
    setPromptB(d.promptB);
    setOutputA(d.outputA);
    setOutputB(d.outputB);
    clearDraft();
    setSampleNote('');
    flash('Cleared');
  }

  function copyUnifiedDiff() {
    const promptDiff = toUnifiedDiff(promptA, promptB, 'prompt-A', 'prompt-B');
    const outputDiff = toUnifiedDiff(outputA, outputB, 'output-A', 'output-B');
    const text = `# Prompt Diff Lab — unified diff\n\n## Prompts\n${promptDiff}\n## Outputs\n${outputDiff}\n`;
    void navigator.clipboard.writeText(text).then(
      () => flash('Unified diff copied'),
      () => flash('Clipboard failed'),
    );
  }

  function exportJson() {
    const blob = new Blob(
      [exportAllJson(sessions, { taskBlurb, promptA, promptB, outputA, outputB })],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-diff-lab-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash('JSON exported');
  }

  function onImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = importFromJson(String(reader.result));
        if (result.draft) {
          setTaskBlurb(result.draft.taskBlurb ?? '');
          setPromptA(result.draft.promptA ?? '');
          setPromptB(result.draft.promptB ?? '');
          setOutputA(result.draft.outputA ?? '');
          setOutputB(result.draft.outputB ?? '');
        }
        if (result.sessions.length) {
          let list = loadSessions();
          for (const s of result.sessions) {
            list = upsertSession({
              ...s,
              id: s.id || newId(),
              updatedAt: s.updatedAt || new Date().toISOString(),
              createdAt: s.createdAt || new Date().toISOString(),
            });
          }
          setSessions(list);
        }
        flash(`Imported (${result.sessions.length} sessions)`);
      } catch {
        flash('Import failed — invalid JSON');
      }
    };
    reader.readAsText(file);
  }

  function saveSession() {
    const name =
      taskBlurb.trim().slice(0, 48) ||
      `Experiment ${new Date().toLocaleString()}`;
    const now = new Date().toISOString();
    const exp: Experiment = {
      id: newId(),
      name,
      taskBlurb,
      promptA,
      promptB,
      outputA,
      outputB,
      createdAt: now,
      updatedAt: now,
    };
    setSessions(upsertSession(exp));
    flash('Session saved');
  }

  function loadSession(exp: Experiment) {
    setTaskBlurb(exp.taskBlurb);
    setPromptA(exp.promptA);
    setPromptB(exp.promptB);
    setOutputA(exp.outputA);
    setOutputB(exp.outputB);
    flash(`Loaded: ${exp.name}`);
  }

  function removeSession(id: string) {
    setSessions(deleteSession(id));
    flash('Session deleted');
  }

  async function exportPngCard() {
    if (!cardRef.current) return;
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      await downloadElementPng(cardRef.current, `prompt-diff-card-${stamp}.png`);
      flash('PNG card downloaded');
    } catch {
      flash('PNG export failed');
    }
  }

  const timestamp = new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const isEmpty =
    !promptA.trim() && !promptB.trim() && !outputA.trim() && !outputB.trim();

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">PD</span>
          <div>
            <h1>Prompt Diff Lab</h1>
            <p className="tagline">Local-first · no auth · no API keys · W2</p>
          </div>
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={() => loadSample(false)}>
            Sample
          </button>
          <button type="button" className="btn" onClick={swapAB}>
            Swap
          </button>
          <button type="button" className="btn" onClick={clearAll}>
            Clear
          </button>
          <button type="button" className="btn" onClick={exportJson}>
            Export JSON
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile(f);
              e.target.value = '';
            }}
          />
          <button type="button" className="btn" onClick={copyUnifiedDiff}>
            Copy diff
          </button>
          <button type="button" className="btn btn-primary" onClick={() => void exportPngCard()}>
            Export PNG card
          </button>
        </div>
      </header>

      {status && <div className="toast">{status}</div>}

      <div className="task-row">
        <label htmlFor="task">
          Task blurb
          <input
            id="task"
            type="text"
            value={taskBlurb}
            onChange={(e) => setTaskBlurb(e.target.value)}
            placeholder="What are you comparing? (shows on the export card)"
          />
        </label>
        {!isEmpty && (
          <span className="muted stats-chip">
            Prompt Δ +{pLineStats.added} / −{pLineStats.removed} lines
          </span>
        )}
      </div>

      <div className="layout">
        <main className="main-col">
          {isEmpty && (
            <div className="hero-empty">
              <h2>Compare two prompts. See what actually changed.</h2>
              <p>
                Paste Prompt A and Prompt B, then paste each model completion. Diffs stay on this
                device — no accounts, no API keys.
              </p>
              <button type="button" className="btn btn-primary" onClick={() => loadSample(false)}>
                Load sample experiment
              </button>
            </div>
          )}

          <div className="grid-2">
            <TextPane
              label="Prompt A"
              value={promptA}
              onChange={setPromptA}
              placeholder="Paste prompt version A…"
              rows={9}
            />
            <TextPane
              label="Prompt B"
              value={promptB}
              onChange={setPromptB}
              placeholder="Paste prompt version B…"
              rows={9}
            />
          </div>

          <div className="grid-2">
            <TextPane
              label="Output A"
              value={outputA}
              onChange={setOutputA}
              placeholder="Paste model completion for A…"
              rows={7}
            />
            <TextPane
              label="Output B"
              value={outputB}
              onChange={setOutputB}
              placeholder="Paste model completion for B…"
              rows={7}
            />
          </div>

          <div className="grid-2">
            <DiffPanel
              title="Prompt diff"
              a={promptA}
              b={promptB}
              mode={promptMode}
              onModeChange={setPromptMode}
              paragraphChanges={promptPara}
              emptyHint="Paste prompts above to see line / word / char diffs."
            />
            <DiffPanel
              title="Output diff"
              a={outputA}
              b={outputB}
              mode={outputMode}
              onModeChange={setOutputMode}
              paragraphChanges={outputPara}
              emptyHint="Paste outputs above to compare completions."
            />
          </div>
        </main>

        <SessionSidebar
          sessions={sessions}
          onSave={saveSession}
          onLoad={loadSession}
          onDelete={removeSession}
        />
      </div>

      <footer className="app-footer">
        <span>Week 2 · @cue4j · Prompt Diff Lab</span>
        <span className="muted">{sampleNote}</span>
      </footer>

      <ComparisonCard
        ref={cardRef}
        taskBlurb={taskBlurb}
        promptSummary={pSummary}
        outputSummary={oSummary}
        timestamp={timestamp}
      />
    </div>
  );
}

export default App;

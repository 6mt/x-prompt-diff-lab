import { forwardRef } from 'react';

interface Props {
  taskBlurb: string;
  promptSummary: string;
  outputSummary: string;
  timestamp: string;
}

export const ComparisonCard = forwardRef<HTMLDivElement, Props>(function ComparisonCard(
  { taskBlurb, promptSummary, outputSummary, timestamp },
  ref,
) {
  return (
    <div className="comparison-card-wrap" aria-hidden>
      <div ref={ref} className="comparison-card">
        <div className="card-brand">
          <span className="card-logo">PD</span>
          <div>
            <div className="card-title">Prompt Diff Lab</div>
            <div className="card-sub">Comparison card · @cue4j</div>
          </div>
        </div>

        <section className="card-block">
          <h3>Task</h3>
          <p>{taskBlurb || 'Untitled experiment'}</p>
        </section>

        <section className="card-block">
          <h3>Prompt changes</h3>
          <pre>{promptSummary}</pre>
        </section>

        <section className="card-block">
          <h3>Output changes</h3>
          <pre>{outputSummary}</pre>
        </section>

        <footer className="card-footer">
          <span>{timestamp}</span>
          <span>Local-first · no auth</span>
        </footer>
      </div>
    </div>
  );
});

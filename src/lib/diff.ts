import * as Diff from 'diff';
import type { DiffMode, DiffStats, ParagraphChange } from '../types';

export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export function computeDiff(a: string, b: string, mode: DiffMode): DiffPart[] {
  if (mode === 'lines') {
    return Diff.diffLines(a, b, { newlineIsToken: false });
  }
  if (mode === 'words') {
    return Diff.diffWordsWithSpace(a, b);
  }
  return Diff.diffChars(a, b);
}

export function countDiffStats(parts: DiffPart[]): DiffStats {
  let added = 0;
  let removed = 0;
  for (const p of parts) {
    if (!p.added && !p.removed) continue;
    const n = p.value.split('\n').filter((l, i, arr) => !(i === arr.length - 1 && l === '')).length || 1;
    // For word/char modes, count tokens roughly
    if (p.added) added += Math.max(1, n);
    if (p.removed) removed += Math.max(1, n);
  }
  return { added, removed, changed: Math.min(added, removed) };
}

export function lineStats(a: string, b: string): DiffStats {
  const parts = Diff.diffLines(a, b);
  let added = 0;
  let removed = 0;
  for (const p of parts) {
    const lines = p.value.replace(/\n$/, '').split('\n');
    const n = p.value === '' ? 0 : lines.length;
    if (p.added) added += n;
    else if (p.removed) removed += n;
  }
  return { added, removed, changed: Math.min(added, removed) };
}

export function toUnifiedDiff(a: string, b: string, labelA = 'A', labelB = 'B'): string {
  const patch = Diff.createTwoFilesPatch(labelA, labelB, a, b, undefined, undefined, {
    context: 3,
  });
  return patch;
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Heuristic paragraph-level change notes */
export function paragraphSummary(a: string, b: string): ParagraphChange[] {
  const pa = splitParagraphs(a);
  const pb = splitParagraphs(b);
  if (pa.length === 0 && pb.length === 0) return [];

  // Also fall back to line-level if no blank-line paragraphs
  const aLines = a.split('\n').map((l) => l.trim()).filter(Boolean);
  const bLines = b.split('\n').map((l) => l.trim()).filter(Boolean);
  const useLines = pa.length <= 1 && pb.length <= 1 && (aLines.length > 1 || bLines.length > 1);
  const left = useLines ? aLines : pa;
  const right = useLines ? bLines : pb;

  const changes: ParagraphChange[] = [];
  const max = Math.max(left.length, right.length);
  for (let i = 0; i < max; i++) {
    const la = left[i];
    const rb = right[i];
    if (la === undefined && rb !== undefined) {
      changes.push({ kind: 'added', b: rb });
    } else if (la !== undefined && rb === undefined) {
      changes.push({ kind: 'removed', a: la });
    } else if (la === rb) {
      changes.push({ kind: 'same', a: la, b: rb });
    } else {
      changes.push({ kind: 'changed', a: la, b: rb });
    }
  }
  return changes;
}

export function summarizeChanges(changes: ParagraphChange[]): string {
  const added = changes.filter((c) => c.kind === 'added').length;
  const removed = changes.filter((c) => c.kind === 'removed').length;
  const changed = changes.filter((c) => c.kind === 'changed').length;
  return `+${added} added · -${removed} removed · ~${changed} changed`;
}

export function promptChangeSummary(a: string, b: string): string {
  const changes = paragraphSummary(a, b).filter((c) => c.kind !== 'same');
  if (changes.length === 0) return 'No prompt changes.';
  const bits = changes.slice(0, 4).map((c) => {
    if (c.kind === 'added') return `+ ${truncate(c.b ?? '', 60)}`;
    if (c.kind === 'removed') return `- ${truncate(c.a ?? '', 60)}`;
    return `~ ${truncate(c.a ?? '', 40)} → ${truncate(c.b ?? '', 40)}`;
  });
  return bits.join('\n');
}

export function outputChangeSummary(a: string, b: string): string {
  const changes = paragraphSummary(a, b).filter((c) => c.kind !== 'same');
  if (!a.trim() && !b.trim()) return 'No outputs pasted yet.';
  if (changes.length === 0) return 'Outputs are identical.';
  const bits = changes.slice(0, 4).map((c) => {
    if (c.kind === 'added') return `+ ${truncate(c.b ?? '', 60)}`;
    if (c.kind === 'removed') return `- ${truncate(c.a ?? '', 60)}`;
    return `~ ${truncate(c.a ?? '', 40)} → ${truncate(c.b ?? '', 40)}`;
  });
  return bits.join('\n');
}

function truncate(s: string, n: number): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : t.slice(0, n - 1) + '…';
}

export function textStats(text: string): { chars: number; words: number; lines: number } {
  const chars = text.length;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const lines = text === '' ? 0 : text.split('\n').length;
  return { chars, words, lines };
}

export type DiffMode = 'lines' | 'words' | 'chars';

export interface Experiment {
  id: string;
  name: string;
  taskBlurb: string;
  promptA: string;
  promptB: string;
  outputA: string;
  outputB: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParagraphChange {
  kind: 'added' | 'removed' | 'changed' | 'same';
  a?: string;
  b?: string;
}

export interface DiffStats {
  added: number;
  removed: number;
  changed: number;
}

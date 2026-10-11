import { toPng } from 'html-to-image';

export async function downloadElementPng(el: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toPng(el, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#0f1419',
  });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

"use client";

/** 목업의 삭제 확인 창 · 토스트를 어디서든 부르기 */
type Ask = { t: string; sub?: string; yes?: string; resolve: (v: boolean) => void };
let askFn: ((a: Ask) => void) | null = null;
let toastFn: ((t: string) => void) | null = null;

export function bindUi(a: typeof askFn, t: typeof toastFn) {
  askFn = a;
  toastFn = t;
}

export function askDel(t: string, sub?: string, yes = "삭제"): Promise<boolean> {
  return new Promise((resolve) => {
    if (askFn) askFn({ t, sub, yes, resolve });
    else resolve(confirm(t));
  });
}

export function toast(t: string) {
  if (toastFn) toastFn(t);
}

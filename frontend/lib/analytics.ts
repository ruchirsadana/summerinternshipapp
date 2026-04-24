import type { Survey, Ratings, DeadHourEntry, PerformanceEntry } from './types';

export const computeNPS = (surveys: Survey[]) => {
  if (!surveys.length) return { score: 0, promoters: 0, passives: 0, detractors: 0, total: 0 };
  let p = 0, pa = 0, d = 0;
  surveys.forEach(s => {
    if (s.nps >= 9) p++;
    else if (s.nps >= 7) pa++;
    else d++;
  });
  const total = surveys.length;
  const score = Math.round(((p - d) / total) * 100);
  return { score, promoters: p, passives: pa, detractors: d, total };
};

export const avgRatings = (surveys: Survey[]): Ratings => {
  const init: Ratings = { quality: 0, style: 0, value: 0, prestige: 0, inStoreExperience: 0, staff: 0 };
  if (!surveys.length) return init;
  const sum = { ...init };
  surveys.forEach(s => {
    (Object.keys(sum) as (keyof Ratings)[]).forEach(k => { sum[k] += s.ratings[k] || 0; });
  });
  const n = surveys.length;
  return {
    quality: +(sum.quality / n).toFixed(2),
    style: +(sum.style / n).toFixed(2),
    value: +(sum.value / n).toFixed(2),
    prestige: +(sum.prestige / n).toFixed(2),
    inStoreExperience: +(sum.inStoreExperience / n).toFixed(2),
    staff: +(sum.staff / n).toFixed(2),
  };
};

export const countBy = <T extends string>(items: string[]): { label: T; count: number }[] => {
  const m = new Map<string, number>();
  items.forEach(i => { if (i) m.set(i, (m.get(i) || 0) + 1); });
  return Array.from(m.entries()).map(([label, count]) => ({ label: label as T, count }))
    .sort((a, b) => b.count - a.count);
};

export const isToday = (iso: string) => {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};

export const topWord = (surveys: Survey[]): string => {
  const words: string[] = [];
  surveys.forEach(s => {
    [s.word1, s.word2, s.word3].forEach(w => { if (w?.trim()) words.push(w.trim().toLowerCase()); });
  });
  const c = countBy(words);
  return c[0]?.label || '—';
};

export const unaidedRecallRate = (surveys: Survey[]) => {
  if (!surveys.length) return 0;
  const hits = surveys.filter(s =>
    s.unaidedRecall?.toLowerCase().includes('tommy') ||
    s.unaidedRecall?.toLowerCase().includes('hilfiger') ||
    s.unaidedRecall?.toLowerCase().trim() === 'th'
  ).length;
  return Math.round((hits / surveys.length) * 100);
};

export const repeatRate = (surveys: Survey[]) => {
  if (!surveys.length) return 0;
  const rep = surveys.filter(s => s.priorPurchase?.startsWith('Yes')).length;
  return Math.round((rep / surveys.length) * 100);
};

export const conversionPerHour = (entries: DeadHourEntry[]) => {
  const map = new Map<number, { footfall: number; bills: number }>();
  entries.forEach(e => {
    const cur = map.get(e.hour) || { footfall: 0, bills: 0 };
    cur.footfall += e.footfall;
    cur.bills += e.bills;
    map.set(e.hour, cur);
  });
  const out: { hour: number; footfall: number; bills: number; conv: number }[] = [];
  for (let h = 10; h <= 22; h++) {
    const v = map.get(h) || { footfall: 0, bills: 0 };
    out.push({ hour: h, ...v, conv: v.footfall ? Math.round((v.bills / v.footfall) * 100) : 0 });
  }
  return out;
};

export const weekOf = (iso: string, startIso: string) => {
  const start = new Date(startIso).getTime();
  const d = new Date(iso).getTime();
  const diffDays = Math.floor((d - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(diffDays / 7) + 1);
};

export const surveysInLastNDays = (surveys: Survey[], n: number) => {
  const cutoff = Date.now() - n * 24 * 60 * 60 * 1000;
  return surveys.filter(s => new Date(s.createdAt).getTime() >= cutoff);
};

export const bestDay = (entries: PerformanceEntry[]) => {
  if (!entries.length) return null;
  return [...entries].sort((a, b) => b.atv - a.atv)[0];
};

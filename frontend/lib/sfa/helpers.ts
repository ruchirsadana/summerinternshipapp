import { SFA_STAGE_WEIGHT, type SfaActivity, type SfaDeal, type SfaStage, type SfaTask } from '../types';

/** Local-time YYYY-MM-DD (avoids UTC off-by-one in IST mornings). */
export const ymd = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };

export const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

export const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const dueLabel = (date: string) => {
  if (!date) return 'No date';
  const today = ymd();
  if (date === today) return 'Today';
  if (date === addDays(1)) return 'Tomorrow';
  const diff = Math.round((new Date(date).getTime() - new Date(today).getTime()) / 86400000);
  if (diff < 0) return `${-diff}d overdue`;
  const [, m, d] = date.split('-');
  return `${parseInt(d, 10)} ${MON[parseInt(m, 10) - 1]}`;
};

export const isOverdue = (date: string) => !!date && date < ymd();

export const relTime = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
};

export const DUE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: '+3 days', days: 3 },
  { label: 'Next week', days: 7 },
] as const;

export const isOpen = (d: SfaDeal) => d.stage !== 'Won' && d.stage !== 'Lost';

export function sfaMetrics(deals: SfaDeal[], tasks: SfaTask[], acts: SfaActivity[]) {
  const today = ymd();
  const monthPrefix = today.slice(0, 7);
  const open = deals.filter(isOpen);
  const won = deals.filter(d => d.stage === 'Won');
  const lost = deals.filter(d => d.stage === 'Lost');
  const byStage = (s: SfaStage) => deals.filter(d => d.stage === s);
  const weekAgo = Date.now() - 7 * 86400000;
  return {
    open,
    pipeline: open.reduce((s, d) => s + d.value, 0),
    weighted: open.reduce((s, d) => s + d.value * SFA_STAGE_WEIGHT[d.stage], 0),
    winRate: won.length + lost.length ? Math.round((won.length / (won.length + lost.length)) * 100) : 0,
    wonCount: won.length,
    wonThisMonth: won
      .filter(d => (d.closedAt || d.createdAt).slice(0, 7) === monthPrefix)
      .reduce((s, d) => s + d.value, 0),
    byStage,
    overdueTasks: tasks.filter(t => !t.done && t.due < today),
    todayTasks: tasks.filter(t => !t.done && t.due === today),
    upcomingTasks: tasks.filter(t => !t.done && t.due > today),
    doneTasks: tasks.filter(t => t.done),
    dueFollowUps: open.filter(d => d.followUp && d.followUp <= today),
    weekActivities: acts.filter(a => new Date(a.createdAt).getTime() >= weekAgo),
  };
}

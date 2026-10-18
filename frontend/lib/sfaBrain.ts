/**
 * SFA brain for the Chat Assistant — rule-based, 100% offline, zero credits.
 * Reads/writes the personal SFA data in AsyncStorage and answers in natural language.
 * Returns null when the message isn't an SFA intent so the general knowledge base can answer.
 */
import { store } from './storage';
import type { BotReply } from './concierge';
import type { SfaActivityType, SfaTask } from './types';
import { addDays, dueLabel, inr, newId, sfaMetrics, ymd } from './sfa/helpers';

const SFA_CHIPS = ['Plan my day', 'Overdue follow-ups', 'Pipeline value', 'Top deals'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const cap = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase()).trim();
const bullet = (lines: string[]) => lines.map(l => `• ${l}`).join('\n');
const has = (q: string, words: string[]) => words.some(w => q.includes(w));

/** Pull a due date out of free text; returns the date and the text with the date words removed. */
function parseDue(text: string): { due: string; rest: string } {
  let rest = text;
  let due = ymd();
  const take = (re: RegExp, d: string) => { if (re.test(rest)) { due = d; rest = rest.replace(re, ' '); return true; } return false; };
  const inDays = /\bin (\d+) days?\b/.exec(rest);
  if (inDays) { due = addDays(parseInt(inDays[1], 10)); rest = rest.replace(inDays[0], ' '); }
  else if (take(/\bday after tomorrow\b/, addDays(2))) { /* matched */ }
  else if (take(/\b(tomorrow|tmrw|tmr)\b/, addDays(1))) { /* matched */ }
  else if (take(/\bnext week\b/, addDays(7))) { /* matched */ }
  else if (take(/\b(today|tonight)\b/, addDays(0))) { /* matched */ }
  else {
    const wd = WEEKDAYS.findIndex(w => new RegExp(`\\b(on )?${w}\\b`).test(rest));
    if (wd >= 0) {
      const diff = ((wd - new Date().getDay()) + 7) % 7 || 7;
      due = addDays(diff);
      rest = rest.replace(new RegExp(`\\b(on )?${WEEKDAYS[wd]}\\b`), ' ');
    }
  }
  return { due, rest: rest.replace(/\s+/g, ' ').trim() };
}

const contactFrom = (text: string) => {
  const m = /\b(?:call|whatsapp|message|text|meet|visit|ping|email|with|for|to)\s+([a-z]{2,})\b/.exec(text);
  const stop = ['the', 'my', 'about', 'him', 'her', 'them', 'a', 'an', 'back', 'up', 'store'];
  return m && !stop.includes(m[1]) ? cap(m[1]) : '';
};

const parseAmount = (text: string) => {
  const m = /(?:₹|rs\.?\s?|inr\s?)?(\d[\d,]*(?:\.\d+)?)\s*(k|l|lakh|lac)?\b/.exec(text);
  if (!m) return 0;
  const n = parseFloat(m[1].replace(/,/g, ''));
  return m[2] === 'k' ? n * 1000 : m[2] ? n * 100000 : n;
};

const taskLine = (t: SfaTask) => `${t.priority === 'High' ? '⚑ ' : ''}${t.title}${t.contactName ? ` (${t.contactName})` : ''} — ${dueLabel(t.due)}`;

async function load() {
  const [deals, tasks, acts] = await Promise.all([store.getSfaDeals(), store.getSfaTasks(), store.getSfaActivities()]);
  return { deals, tasks, acts, m: sfaMetrics(deals, tasks, acts) };
}

export async function answerSfa(raw: string): Promise<BotReply | null> {
  const q = raw.toLowerCase().replace(/[^a-z0-9₹., ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!q) return null;

  // ---------- ACTIONS ----------
  // Add task / reminder
  const addTask = /^(?:add|create|new|set)(?: a)? (?:task|reminder|todo|to do|follow ?up)(?: to| for)?[: ]+(.+)$/.exec(q)
    || /^remind me to (.+)$/.exec(q);
  if (addTask) {
    const { due, rest } = parseDue(addTask[1]);
    const high = /\b(urgent|asap|important|high priority)\b/.test(rest);
    const title = cap(rest.replace(/\b(urgent|asap|important|high priority)\b/g, '').trim()) || 'Follow up';
    await store.addSfaTask({
      id: newId('task'), createdAt: new Date().toISOString(), title, due, done: false,
      contactName: contactFrom(rest), priority: high ? 'High' : 'Normal',
    });
    return { text: `✅ Task added: "${title}" — due ${dueLabel(due).toLowerCase()}${high ? ' · high priority' : ''}. You'll find it under SFA → Tasks.`, followups: ['Plan my day', 'Show my tasks'] };
  }

  // Log activity
  const logAct = /^log(?: a| an)? (call|whatsapp|visit|walk ?in|email)(?: with| to| for| from)? ?([a-z]+)?(?:[ ,.]+(.*))?$/.exec(q);
  if (logAct) {
    const typeMap: Record<string, SfaActivityType> = { call: 'Call', whatsapp: 'WhatsApp', visit: 'Visit', walkin: 'Walk-in', 'walk in': 'Walk-in', email: 'Email' };
    const type = typeMap[logAct[1]] || 'Call';
    const contactName = logAct[2] ? cap(logAct[2]) : '';
    await store.addSfaActivity({ id: newId('act'), createdAt: new Date().toISOString(), type, contactName, note: logAct[3] ? cap(logAct[3]) : '' });
    return { text: `📝 Logged a ${type}${contactName ? ` with ${contactName}` : ''}. Want me to set a follow-up?`, followups: [`Add task follow up ${contactName || 'client'} in 3 days`, 'Recent activity'] };
  }

  // Add deal: "add deal Rahul 25000 wedding shirts"
  const addDeal = /^(?:add|new|create)(?: a)? (?:deal|opportunity|lead deal)(?: for| with)? (.+)$/.exec(q);
  if (addDeal) {
    const body = addDeal[1];
    const value = parseAmount(body);
    const words = body.replace(/(?:₹|rs\.?\s?|inr\s?)?\d[\d,]*(?:\.\d+)?\s*(k|l|lakh|lac)?\b/, ' ').replace(/\s+/g, ' ').trim().split(' ');
    const contactName = cap(words[0] || '');
    const title = cap(words.slice(1).join(' ')) || `Deal with ${contactName}`;
    await store.addSfaDeal({
      id: newId('deal'), createdAt: new Date().toISOString(), title, contactName, phone: '',
      value, stage: 'Prospect', followUp: addDays(1), notes: 'Added via Chat Assistant',
    });
    return { text: `💼 Deal created: ${title} for ${contactName || 'a new client'} worth ${inr(value)} — stage Prospect, follow-up tomorrow.`, followups: ['Pipeline value', 'Top deals'] };
  }

  // Complete a task: "done call rahul" / "complete task rahul"
  const doneTask = /^(?:done|complete|completed|finish|finished|mark done|tick)(?: task)?[: ]+(.+)$/.exec(q);
  if (doneTask) {
    const { tasks } = await load();
    const needle = doneTask[1].trim();
    const match = tasks.find(t => !t.done && (t.title.toLowerCase().includes(needle) || t.contactName.toLowerCase() === needle));
    if (!match) return { text: `I couldn't find an open task matching "${needle}". Try "show my tasks" to see the list.`, followups: ['Show my tasks'] };
    await store.updateSfaTask(match.id, { done: true });
    return { text: `🎉 Marked done: "${match.title}". Nice work!`, followups: ['Plan my day'] };
  }

  // WhatsApp script for a client
  const wa = /\b(?:whatsapp|message|text|msg)(?: script| template| draft)? (?:for|to) ([a-z]+)/.exec(q);
  if (wa) {
    const name = cap(wa[1]);
    const { deals } = await load();
    const deal = deals.find(d => d.contactName.toLowerCase() === wa[1]);
    const line = deal
      ? `Hi ${name}! This is from Tommy Hilfiger BKC 👋 Just following up on your ${deal.title.toLowerCase()}. I've kept a few options aside in your size — would you like to drop by this week? Happy to share photos on WhatsApp too.`
      : `Hi ${name}! This is from Tommy Hilfiger BKC 👋 Our new season polos and denim just landed and I thought of you. Would you like me to keep a few pieces aside in your size? Happy to share photos here.`;
    return { text: `Here's a ready-to-send message:\n\n"${line}"\n\nTip: send it between 11am-1pm or 6-8pm for best replies.`, followups: [`Log whatsapp ${wa[1]}`, 'Who should I call?'] };
  }

  // ---------- QUERIES ----------
  if (has(q, ['plan my day', 'my day', 'agenda', 'tasks today', 'today s tasks', 'todays tasks', 'today tasks', 'my tasks', 'show my tasks', 'to do list', 'todo'])) {
    const { m } = await load();
    const parts: string[] = [];
    if (m.overdueTasks.length) parts.push(`🔴 Overdue (${m.overdueTasks.length}):\n${bullet(m.overdueTasks.slice(0, 5).map(taskLine))}`);
    if (m.todayTasks.length) parts.push(`📌 Today (${m.todayTasks.length}):\n${bullet(m.todayTasks.slice(0, 6).map(taskLine))}`);
    if (m.dueFollowUps.length) parts.push(`📞 Deal follow-ups due:\n${bullet(m.dueFollowUps.slice(0, 5).map(d => `${d.contactName || d.title} — ${d.title}, ${inr(d.value)} (${d.stage})`))}`);
    if (!parts.length) {
      return { text: `Your day is clear 🙌 No tasks or follow-ups due. Upcoming: ${m.upcomingTasks.length} task(s). Good time to prospect — call 3 Gold/Platinum clients you haven't seen in a month.`, followups: ['Who should I call?', 'Add task call a VIP client tomorrow'] };
    }
    const top = m.dueFollowUps.sort((a, b) => b.value - a.value)[0];
    const tip = top ? `\n\n💡 Start with ${top.contactName || top.title} — it's your biggest due deal (${inr(top.value)}).` : '';
    return { text: `Here's your plan for today:\n\n${parts.join('\n\n')}${tip}`, followups: ['Overdue follow-ups', 'Pipeline value'] };
  }

  if (has(q, ['overdue', 'missed', 'pending follow', 'late follow', 'follow ups', 'follow-ups', 'followups', 'follow up list'])) {
    const { m } = await load();
    if (!m.overdueTasks.length && !m.dueFollowUps.length) return { text: 'Nothing overdue — you\'re fully on top of your follow-ups. 💪', followups: ['Plan my day', 'Top deals'] };
    const lines = [
      ...m.overdueTasks.map(taskLine),
      ...m.dueFollowUps.map(d => `${d.contactName || d.title}: ${d.title} (${inr(d.value)}) — ${dueLabel(d.followUp)}`),
    ];
    return { text: `You have ${lines.length} overdue item(s):\n${bullet(lines.slice(0, 8))}\n\nClear the oldest first — follow-ups lose ~20% close-rate for every day they slip.`, followups: ['Plan my day', 'Whatsapp script for client'] };
  }

  if (has(q, ['pipeline', 'forecast', 'deal value', 'deals value', 'how much in deals'])) {
    const { m, deals } = await load();
    if (!deals.length) return { text: 'Your pipeline is empty. Add your first deal — e.g. "add deal Rahul 25000 wedding wardrobe".', followups: ['Add deal Rahul 25000 wedding wardrobe'] };
    const stages = (['Prospect', 'Contacted', 'Trial'] as const).map(s => {
      const l = m.byStage(s);
      return `${s}: ${l.length} · ${inr(l.reduce((a, d) => a + d.value, 0))}`;
    });
    return { text: `📊 Open pipeline: ${inr(m.pipeline)} across ${m.open.length} deal(s).\nWeighted forecast: ${inr(m.weighted)}\n\n${bullet(stages)}\n\nWon this month: ${inr(m.wonThisMonth)} · Win rate ${m.winRate}%`, followups: ['Top deals', 'How can I improve win rate?'] };
  }

  if (has(q, ['top deals', 'biggest deal', 'big deals', 'hot deals', 'best deals', 'largest deal'])) {
    const { m } = await load();
    if (!m.open.length) return { text: 'No open deals yet. Add one from SFA → Deals or say "add deal <name> <amount> <what>".', followups: ['Pipeline value'] };
    const top = [...m.open].sort((a, b) => b.value - a.value).slice(0, 5);
    return { text: `🔥 Your top open deals:\n${bullet(top.map(d => `${d.title} — ${d.contactName || '—'} · ${inr(d.value)} · ${d.stage}${d.followUp ? ` · ${dueLabel(d.followUp)}` : ''}`))}\n\nPush the Trial-stage ones first — they're closest to the bill.`, followups: ['Plan my day', `Whatsapp script for ${(top[0].contactName || 'client').toLowerCase()}`] };
  }

  if (has(q, ['win rate', 'improve win', 'close rate', 'conversion sfa', 'losing deals'])) {
    const { m } = await load();
    return { text: `Your win rate is ${m.winRate}% (${m.wonCount} won). To lift it:\n${bullet([
      'Follow up within 24h of the first visit — memory of the fit fades fast.',
      'Move Prospects to Trial quickly: invite them for a fitting, not a "look around".',
      'Send a personalised WhatsApp with photos of pieces you kept aside.',
      'Mark lost deals honestly — clean data gives you a true picture.',
    ])}`, followups: ['Overdue follow-ups', 'Top deals'] };
  }

  if (has(q, ['who should i call', 'who to call', 'call list', 'who do i call', 'reach out'])) {
    const [{ m }, customers] = await Promise.all([load(), store.getCustomers()]);
    const thisMonth = MONTHS[new Date().getMonth()];
    const bdays = customers.filter(c => c.birthdayMonth === thisMonth).slice(0, 3);
    const cutoff = addDays(-45);
    const lapsed = customers.filter(c => c.visitDate && c.visitDate < cutoff && (c.totalSpend || 0) >= 10000).slice(0, 3);
    const lines = [
      ...m.dueFollowUps.slice(0, 3).map(d => `${d.contactName || d.title} — deal follow-up (${inr(d.value)})`),
      ...bdays.map(c => `${c.name} — 🎂 birthday this month`),
      ...lapsed.map(c => `${c.name} — hasn't visited since ${c.visitDate}`),
    ];
    if (!lines.length) return { text: 'No urgent calls right now. Add contacts with birthday months and visit dates — I\'ll surface birthdays and lapsed VIPs automatically.', followups: ['Plan my day'] };
    return { text: `📞 Your call list:\n${bullet(lines)}`, followups: ['Whatsapp script for client', 'Plan my day'] };
  }

  if (has(q, ['recent activity', 'activity log', 'last activities', 'my activity', 'what did i do'])) {
    const { acts, m } = await load();
    if (!acts.length) return { text: 'No activity logged yet. Try "log call Rahul liked the navy polo".', followups: ['Log call rahul liked the navy polo'] };
    return { text: `This week: ${m.weekActivities.length} activities.\n${bullet(acts.slice(0, 5).map(a => `${a.type}${a.contactName ? ` · ${a.contactName}` : ''}${a.note ? ` — ${a.note}` : ''}`))}`, followups: ['Plan my day'] };
  }

  if (has(q, ['sfa', 'sales force', 'my sales summary', 'sales summary'])) {
    const { m } = await load();
    return {
      text: `Your SFA at a glance:\n${bullet([
        `Pipeline ${inr(m.pipeline)} (forecast ${inr(m.weighted)})`,
        `Win rate ${m.winRate}% · Won this month ${inr(m.wonThisMonth)}`,
        `Tasks today ${m.todayTasks.length} · Overdue ${m.overdueTasks.length}`,
        `Activities this week ${m.weekActivities.length}`,
      ])}\n\nI can also act for you — try:\n${bullet([
        '"add task call Rahul tomorrow"',
        '"add deal Priya 40000 corporate gifting"',
        '"log whatsapp Rahul sent new polos"',
        '"done call Rahul"',
        '"whatsapp script for Priya"',
      ])}`,
      followups: SFA_CHIPS,
    };
  }

  return null;
}

export const SFA_STARTERS = SFA_CHIPS;

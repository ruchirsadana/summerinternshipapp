import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Survey, CompetitorVisit, PerformanceEntry, Customer, DeadHourEntry,
  FieldNote, PipelineLead, Milestone, Settings, InsightCard,
  Employee, DailyKPI, LFLBaseline,
  VMLog, VMScorecard, ZoneSales, BigBill, JogPromoEntry,
} from './types';

const KEYS = {
  surveys: 'th.surveys',
  competitors: 'th.competitors',
  performance: 'th.performance',
  customers: 'th.customers',
  deadHours: 'th.deadHours',
  fieldNotes: 'th.fieldNotes',
  pipeline: 'th.pipeline',
  milestones: 'th.milestones',
  settings: 'th.settings',
  insights: 'th.insights',
  employees: 'th.employees',
  dailyKpis: 'th.dailyKpis',
  lfl: 'th.lfl',
  vmLogs: 'th.vmLogs',
  vmScorecards: 'th.vmScorecards',
  zoneSales: 'th.zoneSales',
  bigBills: 'th.bigBills',
  jog: 'th.jog',
  storeSqft: 'th.storeSqft',
} as const;

async function getList<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try { return JSON.parse(raw) as T[]; } catch { return []; }
}

async function setList<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

async function addItem<T extends { id: string }>(key: string, item: T): Promise<T> {
  const items = await getList<T>(key);
  items.unshift(item);
  await setList(key, items);
  return item;
}

async function updateItem<T extends { id: string }>(key: string, id: string, patch: Partial<T>): Promise<void> {
  const items = await getList<T>(key);
  const idx = items.findIndex(i => i.id === id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...patch };
    await setList(key, items);
  }
}

async function deleteItem<T extends { id: string }>(key: string, id: string): Promise<void> {
  const items = await getList<T>(key);
  await setList(key, items.filter(i => i.id !== id));
}

export const store = {
  // Surveys
  getSurveys: () => getList<Survey>(KEYS.surveys),
  addSurvey: (s: Survey) => addItem(KEYS.surveys, s),

  // Competitors
  getCompetitors: () => getList<CompetitorVisit>(KEYS.competitors),
  addCompetitor: (c: CompetitorVisit) => addItem(KEYS.competitors, c),

  // Performance
  getPerformance: () => getList<PerformanceEntry>(KEYS.performance),
  addPerformance: (p: PerformanceEntry) => addItem(KEYS.performance, p),

  // Customers
  getCustomers: () => getList<Customer>(KEYS.customers),
  addCustomer: (c: Customer) => addItem(KEYS.customers, c),
  updateCustomer: (id: string, patch: Partial<Customer>) => updateItem<Customer>(KEYS.customers, id, patch),
  deleteCustomer: (id: string) => deleteItem<Customer>(KEYS.customers, id),

  // Dead hours
  getDeadHours: () => getList<DeadHourEntry>(KEYS.deadHours),
  addDeadHour: (d: DeadHourEntry) => addItem(KEYS.deadHours, d),

  // Field notes
  getFieldNotes: () => getList<FieldNote>(KEYS.fieldNotes),
  addFieldNote: (n: FieldNote) => addItem(KEYS.fieldNotes, n),

  // Pipeline
  getPipeline: () => getList<PipelineLead>(KEYS.pipeline),
  addLead: (l: PipelineLead) => addItem(KEYS.pipeline, l),
  updateLead: (id: string, patch: Partial<PipelineLead>) => updateItem<PipelineLead>(KEYS.pipeline, id, patch),
  deleteLead: (id: string) => deleteItem<PipelineLead>(KEYS.pipeline, id),

  // Milestones
  getMilestones: async (): Promise<Milestone[]> => {
    const items = await getList<Milestone>(KEYS.milestones);
    if (items.length) return items;
    const seed: Milestone[] = [
      { id: 'm1', week: 1, title: 'Onboarding & Store Familiarisation', done: false },
      { id: 'm2', week: 2, title: 'Begin Consumer Surveys', done: false },
      { id: 'm3', week: 4, title: 'Reach 50 Survey Responses', done: false },
      { id: 'm4', week: 6, title: 'Interim Report Submission', done: false },
      { id: 'm5', week: 8, title: 'Competitive Store Scan Complete', done: false },
      { id: 'm6', week: 10, title: 'Reach 150 Survey Target', done: false },
      { id: 'm7', week: 11, title: 'Draft Final Recommendations', done: false },
      { id: 'm8', week: 12, title: 'Final Report & Presentation', done: false },
    ];
    await setList(KEYS.milestones, seed);
    return seed;
  },
  setMilestones: (m: Milestone[]) => setList(KEYS.milestones, m),

  // Settings
  getSettings: async (): Promise<Settings> => {
    const raw = await AsyncStorage.getItem(KEYS.settings);
    if (raw) {
      const parsed = JSON.parse(raw) as Settings;
      let changed = false;
      // Migrate old default store name
      if (parsed.storeName === 'Tommy Hilfiger') { parsed.storeName = 'Tommy Hilfiger BKC'; changed = true; }
      // Migrate old default target
      if (parsed.target === 150) { parsed.target = 500; changed = true; }
      if (changed) await AsyncStorage.setItem(KEYS.settings, JSON.stringify(parsed));
      return parsed;
    }
    const def: Settings = {
      internName: '',
      storeName: 'Tommy Hilfiger BKC',
      target: 500,
      startDate: new Date().toISOString().slice(0, 10),
    };
    await AsyncStorage.setItem(KEYS.settings, JSON.stringify(def));
    return def;
  },
  setSettings: async (s: Settings): Promise<void> => {
    await AsyncStorage.setItem(KEYS.settings, JSON.stringify(s));
  },

  // Insights cache
  getInsights: () => getList<InsightCard>(KEYS.insights),
  setInsights: (ins: InsightCard[]) => setList(KEYS.insights, ins),

  // Employees
  getEmployees: async (): Promise<Employee[]> => {
    const list = await getList<Employee>(KEYS.employees);
    if (list.length) return list;
    const seed: Employee[] = ['Hannan', 'Priyanka', 'Ankita', 'Suhani', 'Aditya', 'Adarsh', 'Muskan', 'Ruchir', 'Harry', 'Somi']
      .map((name, i) => ({ id: `emp-${i}-${Date.now()}`, name, active: true, createdAt: new Date().toISOString() }));
    await setList(KEYS.employees, seed);
    return seed;
  },
  addEmployee: (e: Employee) => addItem(KEYS.employees, e),
  updateEmployee: (id: string, patch: Partial<Employee>) => updateItem<Employee>(KEYS.employees, id, patch),
  deleteEmployee: (id: string) => deleteItem<Employee>(KEYS.employees, id),

  // Daily KPIs (sale/bill/qty per employee per day)
  getDailyKpis: () => getList<DailyKPI>(KEYS.dailyKpis),
  addDailyKpi: (k: DailyKPI) => addItem(KEYS.dailyKpis, k),
  updateDailyKpi: (id: string, patch: Partial<DailyKPI>) => updateItem<DailyKPI>(KEYS.dailyKpis, id, patch),
  deleteDailyKpi: (id: string) => deleteItem<DailyKPI>(KEYS.dailyKpis, id),

  // LFL baseline (manual prior-year entry)
  getLFL: async (): Promise<LFLBaseline | null> => {
    const raw = await AsyncStorage.getItem(KEYS.lfl);
    return raw ? JSON.parse(raw) : null;
  },
  setLFL: async (l: LFLBaseline) => AsyncStorage.setItem(KEYS.lfl, JSON.stringify(l)),

  /* ---------- Visual Merchandising ---------- */
  getVMLogs: () => getList<VMLog>(KEYS.vmLogs),
  addVMLog: (v: VMLog) => addItem(KEYS.vmLogs, v),
  deleteVMLog: (id: string) => deleteItem<VMLog>(KEYS.vmLogs, id),

  getVMScorecards: () => getList<VMScorecard>(KEYS.vmScorecards),
  addVMScorecard: (s: VMScorecard) => addItem(KEYS.vmScorecards, s),
  deleteVMScorecard: (id: string) => deleteItem<VMScorecard>(KEYS.vmScorecards, id),

  getZoneSales: () => getList<ZoneSales>(KEYS.zoneSales),
  addZoneSale: (z: ZoneSales) => addItem(KEYS.zoneSales, z),
  deleteZoneSale: (id: string) => deleteItem<ZoneSales>(KEYS.zoneSales, id),

  getStoreSqft: async (): Promise<number> => {
    const raw = await AsyncStorage.getItem(KEYS.storeSqft);
    return raw ? parseFloat(raw) || 0 : 0;
  },
  setStoreSqft: async (n: number) => AsyncStorage.setItem(KEYS.storeSqft, String(n)),

  /* ---------- Big Bills (>₹20K single txn) ---------- */
  getBigBills: () => getList<BigBill>(KEYS.bigBills),
  addBigBill: (b: BigBill) => addItem(KEYS.bigBills, b),
  deleteBigBill: (id: string) => deleteItem<BigBill>(KEYS.bigBills, id),

  /* ---------- JOG Promo ---------- */
  getJogEntries: () => getList<JogPromoEntry>(KEYS.jog),
  addJogEntry: (j: JogPromoEntry) => addItem(KEYS.jog, j),
  deleteJogEntry: (id: string) => deleteItem<JogPromoEntry>(KEYS.jog, id),

  // Utility: full export
  getAll: async () => ({
    surveys: await getList<Survey>(KEYS.surveys),
    competitors: await getList<CompetitorVisit>(KEYS.competitors),
    performance: await getList<PerformanceEntry>(KEYS.performance),
    customers: await getList<Customer>(KEYS.customers),
    deadHours: await getList<DeadHourEntry>(KEYS.deadHours),
    fieldNotes: await getList<FieldNote>(KEYS.fieldNotes),
    pipeline: await getList<PipelineLead>(KEYS.pipeline),
  }),
};

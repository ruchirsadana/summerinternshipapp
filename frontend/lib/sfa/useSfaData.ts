import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { store, onSfaChange } from '../storage';
import type { SfaActivity, SfaDeal, SfaTask } from '../types';

export interface SfaData {
  deals: SfaDeal[];
  tasks: SfaTask[];
  activities: SfaActivity[];
}

/** Loads all SFA collections and refreshes on focus or whenever SFA data changes (incl. via chat). */
export function useSfaData(): SfaData {
  const [data, setData] = useState<SfaData>({ deals: [], tasks: [], activities: [] });
  const load = useCallback(async () => {
    const [deals, tasks, activities] = await Promise.all([
      store.getSfaDeals(), store.getSfaTasks(), store.getSfaActivities(),
    ]);
    setData({ deals, tasks, activities });
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => onSfaChange(load), [load]);
  return data;
}

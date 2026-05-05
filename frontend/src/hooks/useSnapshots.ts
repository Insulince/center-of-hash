import { useEffect, useState } from 'react';
import type { Snapshot } from '../types';

interface State {
  snapshots: Snapshot[];
  loading: boolean;
  error: string | null;
}

export function useSnapshots(): State {
  const [state, setState] = useState<State>({ snapshots: [], loading: true, error: null });

  useEffect(() => {
    fetch('/api/snapshots')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Snapshot[]>;
      })
      .then((snapshots) => setState({ snapshots, loading: false, error: null }))
      .catch((e) => setState({ snapshots: [], loading: false, error: String(e) }));
  }, []);

  return state;
}

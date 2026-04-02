import { useEffect, useState } from "react";

/**
 * State mirrored to sessionStorage so expand/collapse survives route changes
 * within the same tab (e.g. admin ↔ other pages).
 */
export function useSessionUiState(storageKey, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw === null) return initialValue;
      return JSON.parse(raw);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      /* quota or private mode */
    }
  }, [storageKey, state]);

  return [state, setState];
}

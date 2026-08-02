import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

// md files/UI-2.md "Navigation": leaving a dirty form (in-app nav, browser back, tab close/refresh)
// prompts "Stay" / "Leave". useBlocker needs a data router — see routes/AppRoutes.tsx.
export function useUnsavedChangesGuard(isDirty: boolean) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => isDirty && currentLocation.pathname !== nextLocation.pathname);

  useEffect(() => {
    if (!isDirty) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return blocker;
}

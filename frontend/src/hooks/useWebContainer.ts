import { useState, useEffect } from 'react';
import { WebContainer } from '@webcontainer/api';
import { WebContainerService } from '../webContainerService';
export function useWebContainer() {
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initializeWebContainer() {
      try {
        const instance = await WebContainerService.getInstance();
        if (mounted) {
          setWebcontainer(instance);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize WebContainer'));
          console.error('WebContainer initialization failed:', err);
        }
      }
    }

    initializeWebContainer();

    return () => {
      mounted = false;
    };
  }, []);

  return { webcontainer, error };
}
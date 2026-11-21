import { useEffect, useState } from 'react';
import * as authService from '../services/authService';

/**
 * Object URL for the signed-in user's own profile photo, or null when there is none. Stored names
 * are unique per upload, so passing the stored path re-fetches whenever the photo changes.
 */
export function useProfilePhotoUrl(storedPath: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!storedPath) {
      setUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    authService
      .getProfilePhotoObjectUrl()
      .then((created) => {
        objectUrl = created;
        if (cancelled) {
          URL.revokeObjectURL(created);
          return;
        }
        setUrl(created);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [storedPath]);

  return url;
}

import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | GymTrack`;
    return () => {
      document.title = 'GymTrack';
    };
  }, [title]);
}

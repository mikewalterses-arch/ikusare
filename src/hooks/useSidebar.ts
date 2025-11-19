// src/hooks/useSidebar.ts
import { useState, useEffect } from 'react';

export function useSidebar() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 768); // md: 768px
    };
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  return { isDesktop };
}
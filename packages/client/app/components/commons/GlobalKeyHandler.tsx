import React, { useEffect } from 'react';
import { useStackStore } from '@/app/store';

export const GlobalKeyHandler: React.FC = () => {
  const closeTopModal = useStackStore(state => state.closeTopStack);
  const stackCount = useStackStore(state => state.stackCount);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stackCount() > 0) {
        e.preventDefault();
        closeTopModal();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [stackCount, closeTopModal]);
  
  return null;
};

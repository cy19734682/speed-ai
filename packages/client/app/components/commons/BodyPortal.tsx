import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type ModalPortalProps = {
  children: ReactNode;
};

/**
 * 创建一个位于body下的元素
 * @param children
 * @constructor
 */
const BodyPortal = ({ children }: ModalPortalProps) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  if (typeof window === 'undefined') return null;
  
  const modalRoot = document.body
  if (!modalRoot) return null;
  return mounted ? createPortal(children, modalRoot) : null;
};

export default BodyPortal;
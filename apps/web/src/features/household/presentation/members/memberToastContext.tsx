import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { MemberToast } from './MemberToast';

type MemberToastContextValue = {
  showToast: (message: string) => void;
};

const MemberToastContext = createContext<MemberToastContextValue>({
  showToast: () => undefined,
});

export function MemberToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState({ message: '', sequence: 0 });
  const showToast = useCallback((message: string) => {
    setToast((current) => ({ message, sequence: current.sequence + 1 }));
  }, []);

  return (
    <MemberToastContext.Provider value={{ showToast }}>
      {children}
      <MemberToast message={toast.message} sequence={toast.sequence} />
    </MemberToastContext.Provider>
  );
}

export function useMemberToast() {
  return useContext(MemberToastContext);
}

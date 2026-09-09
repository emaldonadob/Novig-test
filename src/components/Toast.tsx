import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type Kind = 'ok' | 'bad';
interface ToastCtx {
  toast: (msg: string, kind?: Kind) => void;
}
const Ctx = createContext<ToastCtx>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<{ msg: string; kind: Kind; id: number } | null>(null);
  const toast = useCallback((msg: string, kind: Kind = 'ok') => setT({ msg, kind, id: Date.now() }), []);
  useEffect(() => {
    if (!t) return;
    const h = setTimeout(() => setT(null), 2600);
    return () => clearTimeout(h);
  }, [t]);
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {t && (
        <div className={`toast ${t.kind}`} role="status" key={t.id}>
          {t.msg}
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}

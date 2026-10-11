import type { PropsWithChildren } from 'react';
import { Button } from './Button';
export function PageHeader({ title, subtitle, onBack, children }: PropsWithChildren<{ title: string; subtitle?: string; onBack?: () => void }>) {
  return <header className="page-header">{onBack && <Button variant="ghost" className="back" onClick={onBack} aria-label="Voltar">←</Button>}<div><h1>{title}</h1>{subtitle && <div className="page-subtitle">{subtitle}</div>}</div>{children}</header>;
}

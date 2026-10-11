import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageHeader } from '../../components/PageHeader';
import type { DefesaCriada } from '../../types/api';

export function DefensePage({ defense, busy, onBack, onDownload }: { defense: DefesaCriada; busy: boolean; onBack: () => void; onDownload: () => void }) { return <section className="screen"><PageHeader title="Sua Defesa Prévia" subtitle="Revise antes de protocolar" onBack={onBack} /><div className="content"><Card className="document-card"><pre>{defense.texto}</pre></Card><div className="notice">{defense.orientacao}</div><Button variant="yellow" disabled={busy} onClick={onDownload}>{busy ? 'Gerando PDF…' : '📄 Emitir em PDF para protocolar'}</Button></div></section>; }

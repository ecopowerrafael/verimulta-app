import { useEffect } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageHeader } from '../../components/PageHeader';
import type { Recurso } from '../../types/api';

export function ResourcesPage({ resources, busy, onBack, onRefresh, onOpenExisting }: { resources: Recurso[]; busy: boolean; onBack: () => void; onRefresh: () => void; onOpenExisting: (resource: Recurso) => void }) {
  useEffect(() => { if (resources.length === 0) onRefresh(); }, [resources.length]);
  return <section className="screen"><PageHeader title="Meus recursos" subtitle="Acompanhamento em tempo real" onBack={onBack} /><div className="content"><Button variant="secondary" disabled={busy} onClick={onRefresh}>{busy ? 'Atualizando…' : 'Atualizar recursos'}</Button>{resources.length === 0 ? <Card><h2>Nenhum recurso gerado</h2><p className="muted">Gere uma Defesa Prévia a partir do diagnóstico de uma multa.</p></Card> : resources.map((resource) => <Card key={resource.id}><div className="summary-line"><strong>Recurso #{resource.id}</strong><span className="pill neutro">{resource.status}</span></div><p className="muted">Tipo: {resource.tipo} · Multa #{resource.multa_id}</p><Button variant="secondary" disabled={busy} onClick={() => onOpenExisting(resource)}>Abrir defesa existente (PDF)</Button></Card>)}</div></section>;
}

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageHeader } from '../../components/PageHeader';

export function FleetPage({ onBack, onPlans }: { onBack: () => void; onPlans: () => void }) {
  return <section className="screen"><PageHeader title="Painel de frota" subtitle="Para 10+ veículos · qualquer tipo" onBack={onBack} /><div className="content"><Card className="fleet-locked"><div className="demo-label">EXEMPLO VISUAL · SEM DADOS OPERACIONAIS CONECTADOS</div><div className="fleet-stats"><div><strong>12</strong><small>VEÍCULOS</small></div><div><strong>5</strong><small>MULTAS</small></div><div><strong>R$ 1.4k</strong><small>EM RISCO</small></div></div><div className="detail-row">🚛 QWE2R34 · radar <b>est. 81% · recorrer</b></div><div className="detail-row">🏍️ KLM3N45 · indicação <b>prazo 6 dias</b></div><div className="detail-row">Carlos M. <b>14 pts ⚠️</b></div><div className="fleet-lock"><span>🔒</span><strong>Painel Frota — a partir de R$ 12/veículo</strong><Button onClick={onPlans}>Conhecer o plano Frota</Button></div></Card><p className="muted centered">Motos, caminhões, vans, ônibus e utilitários — todo veículo autuável entra. A gestão operacional de frota ainda não possui contrato de backend.</p></div></section>;
}

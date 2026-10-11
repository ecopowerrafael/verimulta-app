import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageHeader } from '../../components/PageHeader';
import type { Multa } from '../../types/api';

const dateBR = (value: string | null | undefined) => value ? value.slice(0, 10).split('-').reverse().join('/') : '—';
const moneyBR = (value: number | null | undefined) => `R$ ${(value ?? 0).toFixed(2).replace('.', ',')}`;

export function DebtsPage({ fines, busy, onBack, onDiagnosis }: { fines: Multa[]; busy: boolean; onBack: () => void; onDiagnosis: (id: number) => void }) {
  return <section className="screen"><PageHeader title="Meus débitos" subtitle="Multas cadastradas neste aplicativo" onBack={onBack} /><div className="content">{fines.length === 0 ? <Card><h2>Nenhuma multa cadastrada</h2><p className="muted">Assim que você registrar uma notificação, ela aparece aqui com o valor e o prazo.</p></Card> : fines.map((fine) => <Card key={fine.id}><h2>{fine.descricao || 'Autuação'}</h2><div className="detail-list"><div><span>AIT</span><strong className="mono">{fine.ait || '—'}</strong></div><div><span>Valor integral</span><strong>{moneyBR(fine.valor)}</strong></div>{fine.valor ? <div><span>Simulação máxima SNE (até −40%)</span><strong className="success">{moneyBR(fine.valor * 0.6)}</strong></div> : null}{fine.prazo_defesa && <div><span>Prazo da defesa</span><strong className="warning">{dateBR(fine.prazo_defesa)}</strong></div>}<div><span>Origem</span><strong>{fine.origem || 'não informada'}</strong></div></div>{fine.valor ? <p className="muted">Simulação informativa. O desconto depende da adesão, do órgão e dos requisitos de elegibilidade do SNE; não é um desconto garantido.</p> : null}<p className="muted">Estes são registros cadastrados no aplicativo; não representam consulta oficial de débitos.</p><Button variant="secondary" disabled={busy} onClick={() => onDiagnosis(fine.id)}>Ver a auditoria</Button></Card>)}<Card className="notice"><h2>IPVA e licenciamento</h2><p>Estes valores vêm do órgão de trânsito e dependem do credenciamento oficial. O app não estima nem inventa essas parcelas.</p></Card></div></section>;
}

import { useState } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageHeader } from '../../components/PageHeader';

const plans = [{ label: 'Advogado — verificação OAB', monthly: 99, pix: 1069 }, { label: 'Despachante — documentação', monthly: 79, pix: 853 }, { label: 'Protocolo presencial — documentação', monthly: 59, pix: 637 }, { label: 'Motoboy — CNH + veículo', monthly: 39, pix: 421 }];
export function PartnerPage({ onBack }: { onBack: () => void }) {
  const [index, setIndex] = useState(0); const plan = plans[index];
  return <section className="screen"><PageHeader title="Seja um parceiro" subtitle="Credenciamento anual · 12 meses" onBack={onBack} /><div className="content"><Card className="form-card"><label htmlFor="pc-cat">Categoria</label><select id="pc-cat" value={index} onChange={(event) => setIndex(Number(event.target.value))}>{plans.map((item, itemIndex) => <option value={itemIndex} key={item.label}>{item.label}</option>)}</select><div className="detail-row"><span>12x no cartão</span><strong>12x R$ {plan.monthly}</strong></div><div className="detail-row"><span>PIX à vista (−10%)</span><strong className="success">R$ {plan.pix.toLocaleString('pt-BR')}</strong></div><p className="muted">Inclui: vitrine da sua região, selo verificado, solicitações de clientes, avaliações e painel de atendimentos.</p><Button disabled>Credenciamento indisponível</Button><p className="muted">Ainda não existe endpoint de credenciamento ou pagamento para parceiros. Nenhum dado pessoal é coletado e nenhum sucesso é simulado.</p></Card></div></section>;
}

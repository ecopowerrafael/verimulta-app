import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageHeader } from '../../components/PageHeader';

const categories = [['⚖️', 'Advogados', 'Trânsito · CNH'], ['📋', 'Despachantes', 'Docs · transferência'], ['🏍️', 'Motoboy', 'Coleta e entrega'], ['🏢', 'Protocolo', 'Detran · JARI · CET']];
const examples = [['⚖️', 'Exemplo de profissional — Direito de Trânsito', 'Região demonstrativa · resposta ilustrativa', 'Contatar'], ['🏍️', 'Exemplo de serviço — Motoboy', 'Região demonstrativa · valor ilustrativo', 'Solicitar']];

export function NetworkPage({ onBack, onPartner }: { onBack: () => void; onPartner: () => void }) {
  return <section className="screen"><PageHeader title="Rede credenciada" subtitle="Perto de você · Campinas/SP" onBack={onBack} /><div className="content"><div className="demo-label">EXEMPLOS DO HTML LEGADO · DIRETÓRIO NÃO CONECTADO</div><div className="category-grid">{categories.map(([icon, name, description]) => <button className="category-tile" key={name} disabled><span>{icon}</span><strong>{name}</strong><small>{description}</small></button>)}</div>{examples.map(([icon, name, location, action]) => <Card className="partner-card" key={name}><div className="partner-icon">{icon}</div><div><strong>{name}</strong><small>{location}</small><span className="verified">✓ EXEMPLO NÃO VERIFICADO</span></div><Button variant="secondary" disabled>{action}</Button></Card>)}<p className="muted">Os estabelecimentos acima são exemplos visuais, não parceiros reais ou credenciados. A contratação e os valores dependem de uma integração futura.</p><Button variant="yellow" onClick={onPartner}>Sou prestador — quero me credenciar</Button></div></section>;
}

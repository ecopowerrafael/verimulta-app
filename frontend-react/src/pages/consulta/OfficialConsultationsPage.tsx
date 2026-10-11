import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageHeader } from '../../components/PageHeader';
import { webExternalNavigation } from '../../integrations/externalNavigation';
import { officialConsultations } from '../../integrations/officialConsultations';

export function OfficialConsultationsPage({ onBack }: { onBack: () => void }) {
  return <section className="screen"><PageHeader title="Consultas oficiais" subtitle="Links diretos do governo" onBack={onBack} /><div className="content">{officialConsultations.map((section) => <Card key={section.group}><h2>{section.group}</h2><div className="official-links">{section.items.map(([label, url]) => <div className="official-link" key={url}><span>{label}</span><Button variant="ghost" onClick={() => webExternalNavigation.open(url)}>abrir ↗</Button></div>)}</div></Card>)}</div></section>;
}

import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageHeader } from '../../components/PageHeader';
import type { CnhResumo } from '../../types/api';

const dateBR = (value: string) => value.slice(0, 10).split('-').reverse().join('/');

export function CnhPage({ data, error, busy, onBack, onRetry, onSave }: { data: CnhResumo | null; error: string | null; busy: boolean; onBack: () => void; onRetry: () => void; onSave: (validade: string | null) => Promise<void> }) {
  const [validade, setValidade] = useState('');
  useEffect(() => { setValidade(data?.cnh_validade ?? ''); }, [data?.cnh_validade]);
  const percent = data ? Math.min(100, Math.round((data.pontos / Math.max(1, data.limite)) * 100)) : 0;
  const tone = data?.situacao === 'regular' ? 'ok' : 'alert';
  return <section className="screen"><PageHeader title="Minha CNH" subtitle="Pontos das multas cadastradas aqui" onBack={onBack} /><div className="content">
    {!data ? <Card><p className="muted">{busy ? 'Carregando dados da CNH…' : error || 'Não foi possível carregar os dados da CNH.'}</p>{!busy && <Button variant="secondary" onClick={onRetry}>Tentar novamente</Button>}</Card> : <><Card className="cnh-summary"><span className={`pill ${tone}`}>{data.situacao.toUpperCase()}</span><div className="cnh-points"><strong>{data.pontos}</strong><span>/ {data.limite} pts</span></div><p className="muted">Janela de 12 meses · {dateBR(data.janela.de)} a {dateBR(data.janela.ate)}</p><div className="progress"><i style={{ width: `${percent}%` }} /></div><p className="muted">{data.multas_consideradas} multa(s) na conta · {data.gravissimas} gravíssima(s) · restam {data.restam} ponto(s)</p></Card><Card><h2>De onde vem este número</h2><p className="muted">{data.aviso}</p><p className="muted">A pontuação oficial é a do Detran; esta tela soma somente multas cadastradas no aplicativo.</p></Card><Card><h2>Validade da sua CNH</h2><p className="muted">Informe a data que está no seu documento e o app passa a avisar antes de vencer.</p><div className="inline-form"><input aria-label="Validade da CNH" type="date" value={validade} onChange={(event) => setValidade(event.target.value)} /><Button disabled={busy} onClick={() => onSave(validade || null)}>{busy ? 'Salvando…' : 'Salvar'}</Button></div><p className="muted">{data.dias_para_vencer_cnh === null ? '' : data.dias_para_vencer_cnh < 0 ? `Sua CNH consta como vencida há ${Math.abs(data.dias_para_vencer_cnh)} dia(s).` : `Faltam ${data.dias_para_vencer_cnh} dia(s) para vencer.`}</p></Card></>}
  </div></section>;
}

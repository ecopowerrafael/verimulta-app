import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageHeader } from '../../components/PageHeader';
import type { Veiculo, VeiculoResumo } from '../../types/api';

const dateBR = (value: string | null | undefined) => value ? value.slice(0, 10).split('-').reverse().join('/') : '—';
const moneyBR = (value: number | null | undefined) => `R$ ${(value ?? 0).toFixed(2).replace('.', ',')}`;

export function VehiclePage({ vehicles, selectedVehicleId, summary, error, busy, onBack, onSelectVehicle, onScan }: { vehicles: Veiculo[]; selectedVehicleId: number | null; summary: VeiculoResumo | null; error: string | null; busy: boolean; onBack: () => void; onSelectVehicle: (id: number) => void; onScan: () => void }) {
  return <section className="screen"><PageHeader title="Meu veículo" subtitle={summary?.veiculo.placa ?? 'Selecione um veículo'} onBack={onBack} /><div className="content">
    {vehicles.length === 0 ? <Card><h2>Nenhum veículo cadastrado</h2><p className="muted">Cadastre uma placa para acompanhar as multas vinculadas a ela.</p></Card> : <Card><h2>Veículos cadastrados</h2><div className="vehicle-list">{vehicles.map((vehicle) => <button className={`vehicle-option ${selectedVehicleId === vehicle.id ? 'selected' : ''}`} key={vehicle.id} onClick={() => onSelectVehicle(vehicle.id)} disabled={busy}><span>🚗</span><span><strong>{vehicle.placa}</strong><small>{vehicle.modelo || 'Veículo'}</small></span><b>{selectedVehicleId === vehicle.id ? 'Selecionado' : 'Selecionar'}</b></button>)}</div></Card>}
    {busy && <Card><p className="muted">Carregando dados do veículo…</p></Card>}
    {!busy && error && <Card><h2>Não foi possível carregar o veículo</h2><p className="muted">{error}</p></Card>}
    {!busy && summary && <><Card><h2>{summary.veiculo.modelo || 'Veículo'}</h2><div className="detail-list"><div><span>Placa</span><strong className="mono">{summary.veiculo.placa}</strong></div><div><span>Multas cadastradas</span><strong>{summary.multas.quantidade}</strong></div><div><span>Valor somado</span><strong>{moneyBR(summary.multas.valor_total)}</strong></div></div></Card><Card>{summary.multas.ultimas.length > 0 && <><h2>Histórico neste aplicativo</h2><div className="detail-list">{summary.multas.ultimas.map((fine, index) => <div key={`${fine.ait ?? fine.descricao ?? 'multa'}-${index}`}><span>{dateBR(fine.data_infracao)}</span><strong>{fine.descricao || fine.ait || 'Autuação'} · {moneyBR(fine.valor)}</strong></div>)}</div></>}<div className="notice"><h2>Ainda não conectado</h2><p>{summary.nao_conectado.itens.join(', ')} dependem do credenciamento oficial. {summary.nao_conectado.motivo} {summary.nao_conectado.enquanto_isso}</p></div></Card><Button variant="secondary" onClick={onScan}>Verificar uma multa deste veículo</Button></>}
  </div></section>;
}

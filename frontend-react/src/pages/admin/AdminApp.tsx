import { FormEvent, useCallback, useState } from 'react';
import { AdminApi, AdminAuthError } from '../../services/adminApi';
import { isTaskAvailable, type AdminTask } from '../../services/adminTaskState';
import type { AdminFeedbackSummary, AdminSummary } from '../../types/admin';

const saoPaulo = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const normalized = String(value).includes('T') ? String(value) : `${String(value).replace(' ', 'T')}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? value : saoPaulo.format(date);
}

function formatDay(value: string | null | undefined): string {
  if (!value) return '—';
  const normalized = String(value).includes('T') ? String(value) : `${String(value).replace(' ', 'T')}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(date);
}

function formatMoney(value: number | string | null): string {
  if (value === null || value === '') return '—';
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric)
    ? numeric.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : String(value);
}

function display(value: unknown): string {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

export function AdminApp() {
  const [secretDraft, setSecretDraft] = useState('');
  const [api, setApi] = useState<AdminApi | null>(null);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [feedback, setFeedback] = useState<AdminFeedbackSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [runningTask, setRunningTask] = useState<AdminTask | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (client: AdminApi) => {
    setLoading(true);
    setError(null);
    try {
      const [nextSummary, nextFeedback] = await Promise.all([client.summary(), client.feedbacks()]);
      setSummary(nextSummary);
      setFeedback(nextFeedback);
    } catch (cause) {
      if (cause instanceof AdminAuthError) {
        client.clear();
        setApi(null);
        setSummary(null);
        setFeedback(null);
      }
      throw cause;
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate = secretDraft.trim();
    if (!candidate || loading) return;
    const client = new AdminApi(candidate);
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await loadDashboard(client);
      setApi(client);
      setSecretDraft('');
      setMessage('Painel carregado com dados retornados pelo servidor.');
    } catch (cause) {
      setError(cause instanceof AdminAuthError ? cause.message : 'Não foi possível autenticar o painel.');
    }
  }

  function handleLogout() {
    api?.clear();
    setApi(null);
    setSummary(null);
    setFeedback(null);
    setSecretDraft('');
    setMessage('Acesso administrativo encerrado.');
    setError(null);
  }

  async function runTask(task: AdminTask) {
    if (!api || runningTask || !isTaskAvailable(runningTask, task)) return;
    const confirmed = window.confirm(
      task === 'prazos'
        ? 'Executar agora a verificação de prazos e o envio de alertas?'
        : 'Executar agora a varredura das placas cadastradas?',
    );
    if (!confirmed) return;

    setRunningTask(task);
    setError(null);
    setMessage(null);
    try {
      const result = task === 'prazos' ? await api.runDeadlines() : await api.runPlateScan();
      await loadDashboard(api);
      if (task === 'prazos') {
        setMessage(`Alertas de prazo executados com sucesso. Disparados: ${display(result.disparados)}.`);
      } else {
        setMessage(`Varredura executada com sucesso. Placas: ${display(result.placas_verificadas)} · Novas multas: ${display(result.novas_multas)}.`);
      }
    } catch (cause) {
      setError(cause instanceof AdminAuthError ? cause.message : 'A tarefa não pôde ser concluída.');
    } finally {
      setRunningTask(null);
    }
  }

  if (!api) {
    return (
      <main className="admin-shell admin-login-shell">
        <header className="admin-header">
          <div>
            <div className="admin-brand"><span className="admin-brand-mark" aria-hidden="true">✓</span><h1>Painel Verimulta</h1></div>
          </div>
          <span className="admin-lock" aria-hidden="true">⌁</span>
        </header>
        <section className="admin-card admin-login-card">
          <h2>Acesso administrativo</h2>
          <p>Informe a chave fornecida pelo ambiente operacional. Ela permanece somente na memória desta página.</p>
          <form onSubmit={handleLogin}>
            <label htmlFor="admin-secret">Chave do administrador</label>
            <input
              id="admin-secret"
              type="password"
              value={secretDraft}
              onChange={(event) => setSecretDraft(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              required
            />
            <button type="submit" disabled={loading || !secretDraft.trim()}>{loading ? 'Entrando…' : 'Entrar'}</button>
          </form>
          {error && <p className="admin-error" role="alert">{error}</p>}
          <p className="admin-security-note">Esta autenticação por chave compartilhada é provisória; não substitui identidade individual, RBAC e auditoria de operações.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <div className="admin-brand"><span className="admin-brand-mark" aria-hidden="true">✓</span><h1>Painel Verimulta</h1></div>
          <p className="admin-subtitle">Dados administrativos retornados pelo backend.</p>
        </div>
        <button className="admin-secondary-button" type="button" onClick={handleLogout}>Sair</button>
      </header>

      {message && <p className="admin-success" role="status">{message}</p>}
      {error && <p className="admin-error" role="alert">{error}</p>}
      {loading && <p className="admin-loading" role="status">Atualizando painel…</p>}

      {summary && (
        <>
          <section className="admin-kpis" aria-label="Indicadores">
            <Kpi label="Usuários" value={summary.usuarios} />
            <Kpi label="Assinantes" value={summary.assinantes} />
            <Kpi label="MRR estimado" value={formatMoney(summary.mrr)} />
            <Kpi label="Multas auditadas" value={summary.multas} />
            <Kpi label="Defesas geradas" value={summary.recursos} />
          </section>
          <div className="admin-grid">
            <AdminTable title="Últimos usuários" headers={['Nome', 'E-mail', 'Plano', 'Desde']} rows={summary.ultimos_usuarios.map((item) => [display(item.nome), display(item.email), display(item.plano), formatDay(item.criado_em)])} />
            <AdminTable title="Movimentações de pagamento" headers={['Evento', 'Plano', 'Valor', 'Status']} rows={summary.pagamentos.map((item) => [display(item.evento), display(item.plano), formatMoney(item.valor), display(item.status)])} />
            <AdminTable title="Últimas multas auditadas" headers={['AIT', 'Órgão', 'Valor', 'Origem']} rows={summary.ultimas_multas.map((item) => [display(item.ait), display(item.orgao), formatMoney(item.valor), display(item.origem)])} />
            <AdminTable title="E-mails e tarefas" headers={['Tipo', 'Para', 'Status']} rows={summary.emails.map((item) => [display(item.tipo), display(item.para), item.enviado ? 'enviado' : 'log'])} />
            <section className="admin-card admin-actions">
              <h2>Tarefas operacionais</h2>
              <p>As tarefas são manuais e não são executadas ao abrir o painel.</p>
              <div className="admin-action-row">
                <button type="button" onClick={() => void runTask('prazos')} disabled={Boolean(runningTask)}>▶ {runningTask === 'prazos' ? 'Executando…' : 'Rodar alertas de prazo'}</button>
                <button type="button" onClick={() => void runTask('varredura')} disabled={Boolean(runningTask)}>📡 {runningTask === 'varredura' ? 'Executando…' : 'Varrer placas agora'}</button>
              </div>
              <AdminTable headers={['Varredura', 'Placas', 'Novas multas']} rows={summary.varreduras.map((item) => [`${formatDate(item.criado_em)} (${display(item.fonte)})`, display(item.placas_verificadas), display(item.novas_multas)])} />
            </section>
          </div>
        </>
      )}

      {feedback && (
        <section className="admin-card admin-feedback">
          <div className="admin-section-heading"><div><h2>Feedback do beta <span className="admin-feedback-summary">{feedback.total} relato(s) · nota média {display(feedback.nota_media)}{feedback.por_tela[0] ? ` · mais citada: ${feedback.por_tela[0][0]}` : ''}</span></h2></div></div>
          <AdminTable headers={['Quando', 'Quem', 'Tela', 'Nota', 'O que disse']} rows={feedback.itens.map((item) => [formatDate(item.criado_em), display(item.nome), display(item.tela), item.nota === null ? '—' : `${item.nota}/5`, display(item.texto)])} />
        </section>
      )}
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return <article className="admin-kpi"><span>{label}</span><strong>{value}</strong></article>;
}

function AdminTable({ title, headers, rows }: { title?: string; headers: string[]; rows: string[][] }) {
  return (
    <section className="admin-card admin-table-card">
      {title && <h2>{title}</h2>}
      <div className="admin-table-scroll">
        <table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>
          {rows.length === 0 ? <tr><td colSpan={headers.length} className="admin-empty">Nenhum registro retornado.</td></tr> : rows.map((row, index) => <tr key={`${title ?? 'feedback'}-${index}`}>{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`}>{cell}</td>)}</tr>)}
        </tbody></table>
      </div>
    </section>
  );
}

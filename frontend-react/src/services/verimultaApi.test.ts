import { describe, expect, it } from 'vitest';
import { createVerimultaApi } from './verimultaApi';

function fakeClient() {
  const calls: Array<{ path: string; options: Record<string, unknown> }> = [];
  return { calls, request: async <T>(path: string, options: Record<string, unknown> = {}) => { calls.push({ path, options }); return {} as T; } };
}

describe('contratos da jornada de multa', () => {
  it('faz leitura multipart sem chamar a rota que persiste a multa', async () => {
    const client = fakeClient(); const api = createVerimultaApi(client as never);
    await api.readDocument(new File(['documento'], 'multa.png', { type: 'image/png' }));
    expect(client.calls).toHaveLength(1);
    expect(client.calls[0].path).toBe('/v1/multas/ler');
    expect(client.calls[0].options.method).toBe('POST');
    expect(client.calls[0].options.body).toBeInstanceOf(FormData);
  });

  it('separa confirmação persistente da leitura e envia o veículo selecionado', async () => {
    const client = fakeClient(); const api = createVerimultaApi(client as never);
    await api.createFine({ ait: 'T1', origem: 'agente' }, 12);
    expect(client.calls[0].path).toBe('/v1/multas/scan');
    expect(client.calls[0].options.json).toEqual({ ait: 'T1', origem: 'agente', veiculo_id: 12 });
  });

  it('consulta o diagnóstico por id e preserva o paywall retornado pela API', async () => {
    const client = fakeClient(); const api = createVerimultaApi(client as never);
    await api.diagnosis(44);
    expect(client.calls[0].path).toBe('/v1/multas/44/diagnostico');
  });

  it('mantém recursos, planos, checkout e LGPD em endpoints separados', async () => {
    const client = fakeClient(); const api = createVerimultaApi(client as never);
    await api.listResources();
    await api.createDefense(7);
    await api.downloadDefensePdf(8);
    await api.listPlans();
    await api.checkout('combo1');
    await api.cancelSubscription();
    await api.downloadPersonalData();
    await api.deleteAccount();
    expect(client.calls.map((call) => call.path)).toEqual([
      '/v1/recursos', '/v1/recursos', '/v1/recursos/8/pdf', '/v1/planos',
      '/v1/checkout', '/v1/assinaturas/cancelar', '/v1/eu/dados', '/v1/eu/conta'
    ]);
    expect(client.calls[2].options.binary).toBe(true);
    expect(client.calls[4].options.json).toEqual({ plano: 'combo1' });
    expect(client.calls[7].options.method).toBe('DELETE');
  });
});

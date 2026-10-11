import { describe, expect, it } from 'vitest';
import { submitFeedbackFlow } from './feedbackFlow';

describe('fluxo de envio de feedback', () => {
  it('confirma e permite limpar o formulário somente após envio e histórico concluírem', async () => {
    await expect(submitFeedbackFlow(async () => undefined, async () => undefined)).resolves.toEqual({ ok: true });
  });

  it('preserva falha do envio como erro', async () => {
    await expect(submitFeedbackFlow(async () => { throw new Error('Falha de rede'); }, async () => undefined)).resolves.toEqual({ ok: false, message: 'Falha de rede' });
  });

  it('considera envio concluído e informa separadamente falha do histórico', async () => {
    const result = await submitFeedbackFlow(async () => undefined, async () => { throw new Error('Histórico indisponível'); });
    expect(result.ok).toBe(true);
    expect(result).toMatchObject({ warning: expect.stringContaining('Histórico indisponível') });
  });
});

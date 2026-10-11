import { describe, expect, it, vi } from 'vitest';
import { AdminApi } from './adminApi';
import { executeAdminTask, isCurrentAdminGeneration } from './adminTaskFlow';

describe('adminTaskFlow', () => {
  it('preserva a confirmação da tarefa quando a atualização falha', async () => {
    const api = new AdminApi('segredo', vi.fn<typeof fetch>());
    vi.spyOn(api, 'runDeadlines').mockResolvedValue({ disparados: 3 });
    const execution = await executeAdminTask(api, 'prazos', async () => { throw new Error('refresh indisponível'); });

    expect(execution.result).toEqual({ disparados: 3 });
    expect(execution.refreshed).toBe(false);
    expect(execution.refreshError).toBeInstanceOf(Error);
  });

  it('diferencia execução confirmada e refresh confirmado', async () => {
    const api = new AdminApi('segredo', vi.fn<typeof fetch>());
    vi.spyOn(api, 'runPlateScan').mockResolvedValue({ placas_verificadas: 4, novas_multas: 1 });
    const refresh = vi.fn().mockResolvedValue(undefined);
    const execution = await executeAdminTask(api, 'varredura', refresh);

    expect(execution).toMatchObject({ refreshed: true, result: { placas_verificadas: 4, novas_multas: 1 } });
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('não mascara falha da chamada operacional', async () => {
    const api = new AdminApi('segredo', vi.fn<typeof fetch>());
    vi.spyOn(api, 'runDeadlines').mockRejectedValue(new Error('tarefa falhou'));
    const refresh = vi.fn();

    await expect(executeAdminTask(api, 'prazos', refresh)).rejects.toThrow('tarefa falhou');
    expect(refresh).not.toHaveBeenCalled();
  });

  it('invalida respostas de uma geração administrativa anterior', () => {
    expect(isCurrentAdminGeneration(2, 2)).toBe(true);
    expect(isCurrentAdminGeneration(2, 3)).toBe(false);
  });
});

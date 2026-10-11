import { describe, expect, it } from 'vitest';
import { isTaskAvailable } from './adminTaskState';

describe('adminTaskState', () => {
  it('permite uma tarefa quando nenhuma outra está em execução', () => {
    expect(isTaskAvailable(null, 'prazos')).toBe(true);
    expect(isTaskAvailable(null, 'varredura')).toBe(true);
  });

  it('não considera disponível a mesma tarefa em execução', () => {
    expect(isTaskAvailable('prazos', 'prazos')).toBe(false);
    expect(isTaskAvailable('varredura', 'varredura')).toBe(false);
  });
});

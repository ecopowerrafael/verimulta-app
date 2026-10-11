import { describe, expect, it } from 'vitest';
import { responseBelongsToSession } from './sessionState';

describe('isolamento de respostas por sessão', () => {
  it('descarta resposta atrasada depois da troca de usuário', () => {
    expect(responseBelongsToSession('token-usuario-a', 'token-usuario-b')).toBe(false);
  });

  it('aceita somente resposta da sessão ainda ativa', () => {
    expect(responseBelongsToSession('token-usuario-a', 'token-usuario-a')).toBe(true);
    expect(responseBelongsToSession(undefined, 'token-usuario-a')).toBe(false);
  });
});

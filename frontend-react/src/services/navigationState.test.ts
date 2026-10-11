import { describe, expect, it } from 'vitest';
import { canRestoreScreen, shouldPushScreen } from './navigationState';

const authenticated = { hasSession: true, modelUserId: 7, sessionUserId: 7, hasDiagnosis: true, hasDefense: true };

describe('proteção do histórico de navegação', () => {
  it('bloqueia tela autenticada sem sessão ou com outro usuário', () => {
    expect(canRestoreScreen('profile', { ...authenticated, hasSession: false })).toBe(false);
    expect(canRestoreScreen('feedback', { ...authenticated, sessionUserId: 8 })).toBe(false);
  });

  it('bloqueia diagnóstico e defesa sem os dados dependentes', () => {
    expect(canRestoreScreen('diagnosis', { ...authenticated, hasDiagnosis: false })).toBe(false);
    expect(canRestoreScreen('defense', { ...authenticated, hasDefense: false })).toBe(false);
    expect(canRestoreScreen('home', authenticated)).toBe(true);
  });

  it('não cria entrada para a mesma tela já registrada', () => {
    expect(shouldPushScreen('profile', 'profile', 'profile')).toBe(false);
    expect(shouldPushScreen('profile', 'feedback', 'profile')).toBe(true);
  });
});

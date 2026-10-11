export interface NavigationContext {
  hasSession: boolean;
  modelUserId: number | null;
  sessionUserId: number | null;
  hasDiagnosis: boolean;
  hasDefense: boolean;
}

export function canRestoreScreen(screen: string, context: NavigationContext): boolean {
  if (screen === 'login' || screen === 'register') return true;
  if (!context.hasSession || context.modelUserId === null || context.sessionUserId === null || context.modelUserId !== context.sessionUserId) return false;
  if (screen === 'diagnosis' && !context.hasDiagnosis) return false;
  if (screen === 'defense' && !context.hasDefense) return false;
  return true;
}

export function shouldPushScreen(current: string, next: string, historyScreen: unknown): boolean {
  return current !== next || historyScreen !== next;
}

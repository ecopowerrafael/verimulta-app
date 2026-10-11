import type { AdminApi } from './adminApi';
import type { AdminTask } from './adminTaskState';
import type { AdminTaskResult } from '../types/admin';

export type AdminTaskExecution = {
  result: AdminTaskResult;
  refreshed: boolean;
  refreshError?: unknown;
};

export async function executeAdminTask(
  api: AdminApi,
  task: AdminTask,
  refresh: () => Promise<void>,
): Promise<AdminTaskExecution> {
  const result = task === 'prazos' ? await api.runDeadlines() : await api.runPlateScan();
  try {
    await refresh();
    return { result, refreshed: true };
  } catch (refreshError) {
    return { result, refreshed: false, refreshError };
  }
}

export function isCurrentAdminGeneration(startedAt: number, currentGeneration: number): boolean {
  return startedAt === currentGeneration;
}

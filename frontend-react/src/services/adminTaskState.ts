export type AdminTask = 'prazos' | 'varredura';

export function isTaskAvailable(runningTask: AdminTask | null, task: AdminTask): boolean {
  return runningTask === null || runningTask !== task;
}

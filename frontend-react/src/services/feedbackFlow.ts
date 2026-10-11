export type FeedbackFlowResult = { ok: true; warning?: string } | { ok: false; message: string };

const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Não foi possível enviar o feedback.';

export async function submitFeedbackFlow(submit: () => Promise<void>, refreshHistory: () => Promise<void>): Promise<FeedbackFlowResult> {
  try {
    await submit();
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
  try {
    await refreshHistory();
    return { ok: true };
  } catch (error) {
    return { ok: true, warning: `Feedback enviado, mas não foi possível atualizar o histórico: ${errorMessage(error)}` };
  }
}

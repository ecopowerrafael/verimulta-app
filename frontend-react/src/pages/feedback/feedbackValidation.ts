export function validateFeedback(nota: number | null, texto: string): string | null {
  const clean = texto.trim();
  if (!clean && nota === null) return 'Dê uma nota ou escreva um comentário.';
  if (clean.length > 4000) return 'O comentário pode ter no máximo 4000 caracteres.';
  if (nota !== null && (!Number.isInteger(nota) || nota < 1 || nota > 5)) return 'A nota deve estar entre 1 e 5.';
  return null;
}

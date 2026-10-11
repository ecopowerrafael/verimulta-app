import { describe, expect, it } from 'vitest';
import { validateFeedback } from './feedbackValidation';

describe('validação do feedback', () => {
  it('exige nota ou comentário e respeita o limite do backend', () => {
    expect(validateFeedback(null, '')).toBe('Dê uma nota ou escreva um comentário.');
    expect(validateFeedback(5, '')).toBeNull();
    expect(validateFeedback(null, 'x'.repeat(4001))).toContain('4000');
  });

  it('aceita somente notas inteiras de 1 a 5', () => {
    expect(validateFeedback(0, 'comentário')).toContain('1 e 5');
    expect(validateFeedback(3, 'comentário')).toBeNull();
  });
});

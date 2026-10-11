export type PublicPlateConsultation = {
  placa: string;
  consulta_oficial: boolean;
  situacao?: string;
  aviso?: string;
  o_que_ja_funciona?: string;
  proximo_passo?: string;
};

export function normalizePlate(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidBrazilianPlate(value: string): boolean {
  return /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(normalizePlate(value));
}

export async function consultPublicPlate(
  value: string,
  fetcher: typeof fetch = fetch,
): Promise<PublicPlateConsultation> {
  const placa = normalizePlate(value);
  if (!isValidBrazilianPlate(placa)) {
    throw new Error('Digite a placa no formato ABC1D23.');
  }

  const response = await fetcher(`/v1/consulta-placa/${encodeURIComponent(placa)}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (response.status === 429) throw new Error('Muitas consultas em pouco tempo. Tente novamente mais tarde.');
  if (!response.ok) throw new Error('A consulta pública está indisponível no momento.');
  return response.json() as Promise<PublicPlateConsultation>;
}

export function updatePrices(annual: boolean, root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('.plano .preco[data-m]').forEach((price) => {
    const monthly = price.dataset.m ?? '';
    const annualValue = price.dataset.a ?? '';
    const vehicle = price.dataset.veic === '1';
    price.textContent = `R$ ${annual ? annualValue : monthly}`;
    const suffix = document.createElement('small');
    suffix.textContent = vehicle ? (annual ? '/veículo/ano' : '/veículo/mês') : (annual ? '/ano' : '/mês');
    price.appendChild(suffix);
  });
  root.querySelectorAll<HTMLElement>('.anual-nota[data-nota]').forEach((note) => {
    note.textContent = annual ? note.dataset.nota ?? '' : '';
  });
}

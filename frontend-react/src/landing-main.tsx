import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { consultPublicPlate, updatePrices } from './services/publicLanding';

function LandingRuntime() {
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const plateInput = document.getElementById('cp-placa') as HTMLInputElement | null;
    const plateButton = document.querySelector<HTMLButtonElement>('#consulta-placa button');
    const result = document.getElementById('cp-resultado');
    const resultPlate = document.getElementById('cp-r-placa');
    const resultLines = document.getElementById('cp-r-linhas');
    const waitlist = document.getElementById('formEspera') as HTMLFormElement | null;
    const toast = document.getElementById('toast');
    let disposed = false;

    const showToast = (message: string) => {
      if (toast) {
        toast.textContent = message;
        toast.classList.add('mostra');
        window.setTimeout(() => toast.classList.remove('mostra'), 4200);
      }
      setNotice(message);
    };

    const renderConsultation = (data: Awaited<ReturnType<typeof consultPublicPlate>>, requestedPlate: string) => {
      if (disposed || !result || !resultPlate || !resultLines) return;
      resultPlate.textContent = data.placa || requestedPlate;
      resultLines.replaceChildren();
      const headline = document.createElement('b');
      headline.textContent = data.consulta_oficial ? 'Consulta oficial retornada pelo serviço.' : 'Ainda não consultamos bases oficiais para esta placa.';
      resultLines.appendChild(headline);
      for (const text of [data.aviso, data.o_que_ja_funciona, data.proximo_passo]) {
        if (!text) continue;
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        resultLines.appendChild(paragraph);
      }
      result.style.display = 'block';
    };

    const onPlateSubmit = async (event: Event) => {
      event.preventDefault();
      if (!plateInput || !plateButton) return;
      const requestedPlate = plateInput.value.trim().toUpperCase();
      plateButton.setAttribute('disabled', 'true');
      plateButton.textContent = 'Consultando…';
      try {
        const data = await consultPublicPlate(requestedPlate);
        renderConsultation(data, requestedPlate);
        showToast('Consulta concluída com os dados disponíveis no serviço.');
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'A consulta pública está indisponível no momento.');
      } finally {
        if (!disposed) {
          plateButton.removeAttribute('disabled');
          plateButton.textContent = 'Consultar';
        }
      }
    };

    const onWaitlistSubmit = (event: Event) => {
      event.preventDefault();
      showToast('A lista de espera ainda não está conectada a um endpoint de cadastro. Nenhum dado foi enviado.');
    };

    const priceButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.alterna button'));
    const onPriceClick = (event: Event) => {
      const button = event.currentTarget as HTMLButtonElement;
      const annual = button.dataset.per === 'anual';
      priceButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('ativo', active);
        item.setAttribute('aria-selected', String(active));
      });
      updatePrices(annual);
    };

    plateButton?.addEventListener('click', onPlateSubmit);
    waitlist?.addEventListener('submit', onWaitlistSubmit);
    priceButtons.forEach((button) => button.addEventListener('click', onPriceClick));
    updatePrices(false);

    return () => {
      disposed = true;
      plateButton?.removeEventListener('click', onPlateSubmit);
      waitlist?.removeEventListener('submit', onWaitlistSubmit);
      priceButtons.forEach((button) => button.removeEventListener('click', onPriceClick));
    };
  }, []);

  return <span className="landing-runtime-status" aria-live="polite">{notice}</span>;
}

const root = document.getElementById('landing-react-root');
if (root) {
  createRoot(root).render(<StrictMode><LandingRuntime /></StrictMode>);
}

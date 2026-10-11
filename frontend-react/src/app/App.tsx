import { useEffect, useMemo, useState } from 'react';
import { ApiClient } from '../services/apiClient';
import { createVerimultaApi } from '../services/verimultaApi';
import { webCredentialStorage } from '../services/storage';
import type { CamposMulta, Diagnostico, DefesaCriada, Multa, Planos, Recurso, Usuario, Veiculo } from '../types/api';
import { Toast } from '../components/Toast';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { HomePage } from '../pages/home/HomePage';
import { ScanPage } from '../pages/multa/ScanPage';
import { AnalysisPage } from '../pages/multa/AnalysisPage';
import { ConfirmPage } from '../pages/multa/ConfirmPage';
import { DiagnosisPage } from '../pages/multa/DiagnosisPage';
import { ResourcesPage } from '../pages/recurso/ResourcesPage';
import { DefensePage } from '../pages/recurso/DefensePage';
import { PlansPage } from '../pages/assinatura/PlansPage';
import { ProfilePage } from '../pages/perfil/ProfilePage';
import { webFileTransfer } from '../integrations/fileTransfer';
import { webExternalNavigation } from '../integrations/externalNavigation';

export type Screen = 'login' | 'register' | 'home' | 'scan' | 'analysis' | 'confirm' | 'diagnosis' | 'resources' | 'defense' | 'plans' | 'profile';

export interface AppModel {
  user: Usuario | null;
  vehicles: Veiculo[];
  fines: Multa[];
  fields: CamposMulta;
  diagnosis: Diagnostico | null;
  selectedFineId: number | null;
  resources: Recurso[];
  defense: DefesaCriada | null;
  plans: Planos | null;
}

export function App() {
  const client = useMemo(() => new ApiClient({ baseUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? '', storage: webCredentialStorage }), []);
  const api = useMemo(() => createVerimultaApi(client), [client]);
  const [screen, setScreen] = useState<Screen>('login');
  const [model, setModel] = useState<AppModel>({ user: null, vehicles: [], fines: [], fields: {}, diagnosis: null, selectedFineId: null, resources: [], defense: null, plans: null });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(null), 3800); };
  const setSession = async (user: Usuario, token: string) => {
    webCredentialStorage.write({ token, usuario: user });
    setModel((old) => ({ ...old, user }));
    await loadDashboard();
    setScreen('home');
  };
  const loadDashboard = async () => {
    const [vehicles, fines] = await Promise.all([api.listVehicles(), api.listFines()]);
    setModel((old) => ({ ...old, vehicles, fines }));
  };
  const logout = () => { webCredentialStorage.clear(); setModel({ user: null, vehicles: [], fines: [], fields: {}, diagnosis: null, selectedFineId: null, resources: [], defense: null, plans: null }); setScreen('login'); };

  useEffect(() => {
    const session = webCredentialStorage.read();
    if (!session) return;
    setModel((old) => ({ ...old, user: session.usuario ?? null }));
    loadDashboard().then(() => setScreen('home')).catch(() => logout());
    // A restauração real da identidade deve vir de um endpoint de sessão; a tela é protegida pelos endpoints.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const withBusy = async (action: () => Promise<void>) => { setBusy(true); try { await action(); } catch (error) { notify(error instanceof Error ? error.message : 'Falha inesperada.'); } finally { setBusy(false); } };

  return <>
    <main className="phone-shell">
      {screen === 'login' && <LoginPage busy={busy} onRegister={() => setScreen('register')} onSubmit={(email, senha) => withBusy(async () => { const result = await api.login(email, senha); await setSession(result.usuario, result.token); })} />}
      {screen === 'register' && <RegisterPage busy={busy} onBack={() => setScreen('login')} onSubmit={(input) => withBusy(async () => { const result = await api.register(input); if (input.placa) await api.createVehicle({ placa: input.placa, modelo: 'Meu veículo' }); await setSession(result.usuario, result.token); })} />}
      {screen === 'home' && model.user && <HomePage user={model.user} vehicles={model.vehicles} fines={model.fines} onScan={() => setScreen('scan')} onLogout={logout} onResources={() => withBusy(async () => { const resources = await api.listResources(); setModel((old) => ({ ...old, resources })); setScreen('resources'); })} onProfile={() => setScreen('profile')} onDiagnosis={(id) => withBusy(async () => { const result = await api.diagnosis(id); setModel((old) => ({ ...old, selectedFineId: id, diagnosis: result })); setScreen('diagnosis'); })} />}
      {screen === 'scan' && <ScanPage busy={busy} onBack={() => setScreen('home')} onManual={() => { setModel((old) => ({ ...old, fields: { origem: 'agente' } })); setScreen('confirm'); }} onFile={(file) => withBusy(async () => { setScreen('analysis'); const result = await api.readDocument(file); setModel((old) => ({ ...old, fields: result.campos })); setScreen('confirm'); if (!result.leu) notify(result.motivo ?? result.orientacao); })} />}
      {screen === 'analysis' && <AnalysisPage />}
      {screen === 'confirm' && <ConfirmPage busy={busy} initialFields={model.fields} onBack={() => setScreen('scan')} onSubmit={(fields) => withBusy(async () => { const result = await api.createFine(fields, model.vehicles[0]?.id); setModel((old) => ({ ...old, fields, selectedFineId: result.multa_id })); const diagnosis = await api.diagnosis(result.multa_id); setModel((old) => ({ ...old, diagnosis })); setScreen('diagnosis'); })} />}
      {screen === 'diagnosis' && model.diagnosis && <DiagnosisPage diagnosis={model.diagnosis} onBack={() => setScreen('home')} onPlans={() => setScreen('plans')} onDefense={() => withBusy(async () => { if (!model.selectedFineId) return; const defense = await api.createDefense(model.selectedFineId); setModel((old) => ({ ...old, defense })); setScreen('defense'); })} />}
      {screen === 'resources' && <ResourcesPage resources={model.resources} busy={busy} onBack={() => setScreen('home')} onRefresh={() => withBusy(async () => { const resources = await api.listResources(); setModel((old) => ({ ...old, resources })); })} onDefense={(id) => withBusy(async () => { const defense = await api.createDefense(id); setModel((old) => ({ ...old, defense })); setScreen('defense'); })} />}
      {screen === 'defense' && model.defense && <DefensePage defense={model.defense} busy={busy} onBack={() => setScreen('resources')} onDownload={() => withBusy(async () => { const blob = await api.downloadDefensePdf(model.defense!.recurso_id); webFileTransfer.download(blob, 'defesa-previa-verimulta.pdf'); })} />}
      {screen === 'plans' && <PlansPage plans={model.plans} busy={busy} onBack={() => setScreen('home')} onLoad={() => withBusy(async () => { const plans = await api.listPlans(); setModel((old) => ({ ...old, plans })); })} onCheckout={(key) => withBusy(async () => { const result = await api.checkout(key); if (result.checkout_url) webExternalNavigation.open(result.checkout_url); else notify(result.aviso ?? 'Checkout criado. A ativação depende do pagamento confirmado pelo backend.'); })} />}
      {screen === 'profile' && model.user && <ProfilePage user={model.user} busy={busy} onBack={() => setScreen('home')} onPlans={() => setScreen('plans')} onCancel={() => withBusy(async () => { const result = await api.cancelSubscription(); setModel((old) => ({ ...old, user: old.user ? { ...old.user, plano: 'gratis' } : null })); notify(result.mensagem); })} onDownloadData={() => withBusy(async () => { const blob = await api.downloadPersonalData(); webFileTransfer.download(blob, 'meus-dados-verimulta.json'); })} onDeleteAccount={() => withBusy(async () => { const result = await api.deleteAccount(); notify(result.mensagem); logout(); })} onLogout={logout} />}
    </main>
    <Toast message={toast} />
  </>;
}

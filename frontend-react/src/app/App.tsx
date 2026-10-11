import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiClient } from '../services/apiClient';
import { createVerimultaApi } from '../services/verimultaApi';
import { pendingVehicleStorage, webCredentialStorage } from '../services/storage';
import { ApiError } from '../types/api';
import type { CamposMulta, Diagnostico, DefesaCriada, Feedback, Multa, Planos, Recurso, Usuario, Veiculo, VeiculoPendente } from '../types/api';
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
import { VehiclePage } from '../pages/veiculo/VehiclePage';
import { CnhPage } from '../pages/cnh/CnhPage';
import { DebtsPage } from '../pages/debito/DebtsPage';
import { OfficialConsultationsPage } from '../pages/consulta/OfficialConsultationsPage';
import { ActiveDebtPage } from '../pages/divida/ActiveDebtPage';
import { FleetPage } from '../pages/frota/FleetPage';
import { NetworkPage } from '../pages/rede/NetworkPage';
import { PartnerPage } from '../pages/parceiro/PartnerPage';
import { webFileTransfer } from '../integrations/fileTransfer';
import { webExternalNavigation } from '../integrations/externalNavigation';
import { responseBelongsToSession } from '../services/sessionState';
import { FeedbackPage, type FeedbackSubmitResult } from '../pages/feedback/FeedbackPage';
import { TransparencyPage } from '../pages/transparencia/TransparencyPage';
import { AppBottomNavigation } from '../components/AppBottomNavigation';
import { canRestoreScreen, shouldPushScreen } from '../services/navigationState';
import { submitFeedbackFlow } from '../services/feedbackFlow';

export type Screen = 'login' | 'register' | 'home' | 'scan' | 'analysis' | 'confirm' | 'diagnosis' | 'resources' | 'defense' | 'plans' | 'profile' | 'vehicle' | 'cnh' | 'debts' | 'consultations' | 'active-debt' | 'fleet' | 'network' | 'partner' | 'feedback' | 'transparency';
const SCREEN_VALUES = new Set<string>(['login', 'register', 'home', 'scan', 'analysis', 'confirm', 'diagnosis', 'resources', 'defense', 'plans', 'profile', 'vehicle', 'cnh', 'debts', 'consultations', 'active-debt', 'fleet', 'network', 'partner', 'feedback', 'transparency']);
const isScreenValue = (value: unknown): value is Screen => typeof value === 'string' && SCREEN_VALUES.has(value);

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
  pendingVehicle: VeiculoPendente | null;
  selectedVehicleId: number | null;
  vehicleSummary: import('../types/api').VeiculoResumo | null;
  cnh: import('../types/api').CnhResumo | null;
  vehicleError: string | null;
  cnhError: string | null;
  feedback: Feedback[] | null;
  feedbackError: string | null;
}

const emptyModel = (): AppModel => ({ user: null, vehicles: [], fines: [], fields: {}, diagnosis: null, selectedFineId: null, resources: [], defense: null, plans: null, pendingVehicle: null, selectedVehicleId: null, vehicleSummary: null, cnh: null, vehicleError: null, cnhError: null, feedback: null, feedbackError: null });

export function App() {
  const sessionExpiredRef = useRef(false);
  const authOperationRef = useRef(0);
  const [screen, setScreenState] = useState<Screen>('login');
  const screenRef = useRef<Screen>('login');
  const modelRef = useRef<AppModel | null>(null);
  const [model, setModel] = useState<AppModel>(emptyModel);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [cancellationRequested, setCancellationRequested] = useState(false);
  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { modelRef.current = model; }, [model]);
  const replaceScreen = useCallback((next: Screen) => { window.history.replaceState({ screen: next }, '', window.location.href); screenRef.current = next; setScreenState(next); }, []);
  const setScreen = useCallback((next: Screen) => { if (!shouldPushScreen(screenRef.current, next, window.history.state?.screen)) return; window.history.pushState({ screen: next }, '', window.location.href); screenRef.current = next; setScreenState(next); }, []);
  useEffect(() => {
    window.history.replaceState({ screen: 'login' }, '', window.location.href);
    const onPopState = (event: PopStateEvent) => {
      const next = isScreenValue(event.state?.screen) ? event.state.screen : 'home';
      const session = webCredentialStorage.read();
      const currentModel = modelRef.current;
      const allowed = canRestoreScreen(next, { hasSession: Boolean(session), modelUserId: currentModel?.user?.id ?? null, sessionUserId: session?.usuario?.id ?? null, hasDiagnosis: Boolean(currentModel?.diagnosis), hasDefense: Boolean(currentModel?.defense) });
      const safeScreen = allowed ? next : session && currentModel?.user ? 'home' : 'login';
      if (!allowed) window.history.replaceState({ screen: safeScreen }, '', window.location.href);
      screenRef.current = safeScreen;
      setScreenState(safeScreen);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const invalidateSession = useCallback(() => {
    authOperationRef.current += 1;
    sessionExpiredRef.current = true;
    setModel(emptyModel());
    replaceScreen('login');
    setToast('Sua sessão expirou. Entre novamente para continuar.');
  }, [replaceScreen]);
  const client = useMemo(() => new ApiClient({ baseUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? '', storage: webCredentialStorage, onSessionInvalidated: invalidateSession }), [invalidateSession]);
  const api = useMemo(() => createVerimultaApi(client), [client]);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(null), 3800); };
  const currentSessionToken = () => webCredentialStorage.read()?.token;
  const isCurrentSession = (token: string | undefined) => responseBelongsToSession(token, currentSessionToken());
  const storeSession = (user: Usuario, token: string) => {
    webCredentialStorage.write({ token, usuario: user });
    setModel((old) => ({ ...old, user, pendingVehicle: pendingVehicleStorage.read(user.id) }));
  };
  const setSession = async (user: Usuario, token: string) => {
    storeSession(user, token);
    if (await loadDashboard(token)) setScreen('home');
  };
  const loadDashboard = async (expectedToken = webCredentialStorage.read()?.token): Promise<boolean> => {
    if (!expectedToken) return false;
    const [vehicles, fines] = await Promise.all([api.listVehicles(), api.listFines()]);
    if (webCredentialStorage.read()?.token !== expectedToken) return false;
    const userId = webCredentialStorage.read()?.usuario?.id;
    const pendingVehicle = userId ? pendingVehicleStorage.read(userId) : null;
    const resolvedPending = pendingVehicle && vehicles.some((vehicle) => vehicle.placa.toUpperCase() === pendingVehicle.placa.toUpperCase());
    if (resolvedPending && userId) pendingVehicleStorage.clear(userId);
    setModel((old) => ({ ...old, vehicles, fines, selectedVehicleId: old.selectedVehicleId && vehicles.some((vehicle) => vehicle.id === old.selectedVehicleId) ? old.selectedVehicleId : null, vehicleSummary: old.selectedVehicleId && vehicles.some((vehicle) => vehicle.id === old.selectedVehicleId) ? old.vehicleSummary : null, pendingVehicle: resolvedPending ? null : pendingVehicle ?? old.pendingVehicle }));
    return true;
  };
  const logout = () => { authOperationRef.current += 1; webCredentialStorage.clear(); setModel(emptyModel()); replaceScreen('login'); setCancellationRequested(false); };

  useEffect(() => {
    const session = webCredentialStorage.read();
    if (!session) return;
    setModel((old) => ({ ...old, user: session.usuario ?? null, pendingVehicle: session.usuario ? pendingVehicleStorage.read(session.usuario.id) : null }));
    loadDashboard(session.token).then((loaded) => { if (loaded && webCredentialStorage.read()?.token === session.token) setScreen('home'); }).catch(() => { if (webCredentialStorage.read()?.token === session.token) logout(); });
    // A restauração real da identidade deve vir de um endpoint de sessão; a tela é protegida pelos endpoints.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const withBusy = async (action: () => Promise<void>) => { setBusy(true); sessionExpiredRef.current = false; try { await action(); } catch (error) { if (!(sessionExpiredRef.current && error instanceof ApiError && error.status === 401)) notify(error instanceof Error ? error.message : 'Falha inesperada.'); } finally { setBusy(false); } };

  const register = (input: { nome: string; cpf: string; email: string; senha: string; consentimento: true; placa: string }) => withBusy(async () => {
    const operation = ++authOperationRef.current;
    const result = await api.register(input);
    if (authOperationRef.current !== operation) return;
    storeSession(result.usuario, result.token);
    const pendingVehicle = input.placa ? { placa: input.placa, modelo: 'Meu veículo' } : null;
    let vehiclePending = false;
    if (pendingVehicle) {
      pendingVehicleStorage.write(result.usuario.id, pendingVehicle);
      try { const vehicle = await api.ensureVehicle(pendingVehicle); pendingVehicleStorage.clear(result.usuario.id); setModel((old) => ({ ...old, pendingVehicle: null, selectedVehicleId: vehicle.id })); } catch { vehiclePending = true; setModel((old) => ({ ...old, pendingVehicle })); }
    }
    try { await loadDashboard(result.token); } catch (error) {
      if (webCredentialStorage.read()?.token !== result.token) return;
      notify('Conta criada. Não foi possível carregar os dados agora; tente novamente em instantes.');
    }
    if (webCredentialStorage.read()?.token !== result.token) return;
    setScreen('home');
    if (vehiclePending) notify('Conta criada, mas a placa poderá ser cadastrada pela tela inicial.');
  });

  const login = (email: string, senha: string) => withBusy(async () => {
    const operation = ++authOperationRef.current;
    const result = await api.login(email, senha);
    if (authOperationRef.current !== operation) return;
    await setSession(result.usuario, result.token);
  });

  const retryPendingVehicle = () => withBusy(async () => {
    const pendingVehicle = model.pendingVehicle;
    if (!pendingVehicle) return;
    const token = webCredentialStorage.read()?.token;
    const userId = webCredentialStorage.read()?.usuario?.id;
    if (!token || !userId) return;
    await api.ensureVehicle(pendingVehicle);
    if (webCredentialStorage.read()?.token !== token) return;
    pendingVehicleStorage.clear(userId);
    await loadDashboard(token);
    notify('Veículo cadastrado com sucesso.');
  });

  const openVehicle = () => setScreen('vehicle');
  const selectVehicle = (id: number) => withBusy(async () => {
    const token = currentSessionToken();
    setModel((old) => ({ ...old, vehicleError: null }));
    let summary;
    try { summary = await api.vehicleSummary(id); } catch (error) { if (!isCurrentSession(token)) return; setModel((old) => ({ ...old, vehicleError: error instanceof Error ? error.message : 'Falha ao carregar o veículo.' })); throw error; }
    if (!isCurrentSession(token)) return;
    setModel((old) => ({ ...old, selectedVehicleId: id, vehicleSummary: summary }));
  });
  const openCnh = () => {
    setScreen('cnh');
    void withBusy(async () => {
      const token = currentSessionToken();
      setModel((old) => ({ ...old, cnhError: null }));
      let cnh;
      try { cnh = await api.cnh(); } catch (error) { if (!isCurrentSession(token)) return; setModel((old) => ({ ...old, cnhError: error instanceof Error ? error.message : 'Falha ao carregar a CNH.' })); throw error; }
      if (!isCurrentSession(token)) return;
      setModel((old) => ({ ...old, cnh }));
    });
  };
  const saveCnh = (validade: string | null) => withBusy(async () => {
    const token = currentSessionToken();
    const result = await api.updateCnh(validade);
    if (!isCurrentSession(token)) return;
    const cnh = await api.cnh();
    if (!isCurrentSession(token)) return;
    setModel((old) => ({ ...old, cnh }));
    notify(result.ok ? 'Validade salva.' : 'Não foi possível salvar.');
  });
  const loadFeedback = async (expectedToken = currentSessionToken()): Promise<{ ok: true } | { ok: false; message: string }> => {
    if (!expectedToken) return { ok: false, message: 'Sua sessão expirou.' };
    setModel((old) => ({ ...old, feedbackError: null }));
    let items: Feedback[];
    try { items = await api.listFeedback(); } catch (error) { const message = error instanceof Error ? error.message : 'Falha ao carregar o feedback.'; if (!isCurrentSession(expectedToken)) return { ok: false, message: 'A sessão mudou.' }; setModel((old) => ({ ...old, feedbackError: message })); return { ok: false, message }; }
    if (!isCurrentSession(expectedToken)) return { ok: false, message: 'A sessão mudou.' };
    setModel((old) => ({ ...old, feedback: items }));
    return { ok: true };
  };
  const openFeedback = () => { setScreen('feedback'); void withBusy(async () => { await loadFeedback(); }); };
  const saveFeedback = async (nota: number | null, texto: string): Promise<FeedbackSubmitResult> => {
    if (busy) return { ok: false, message: 'Aguarde o envio atual terminar.' };
    const token = currentSessionToken();
    if (!token) return { ok: false, message: 'Sua sessão expirou. Entre novamente para enviar.' };
    setBusy(true); sessionExpiredRef.current = false;
    try {
      let responseMessage = 'Obrigado! Feedback recebido.';
      const flow = await submitFeedbackFlow(async () => { const response = await api.createFeedback({ tela: 't-feedback', nota, texto }); responseMessage = response.mensagem || responseMessage; if (!isCurrentSession(token)) throw new Error('A sessão mudou. Revise o feedback antes de enviar novamente.'); }, async () => { const history = await loadFeedback(token); if (!history.ok) throw new Error(history.message); });
      if (sessionExpiredRef.current) return { ok: false, message: 'Sua sessão expirou. Entre novamente para enviar.' };
      if (flow.ok && !flow.warning) notify(responseMessage);
      return flow;
    } catch (error) {
      if (sessionExpiredRef.current && error instanceof ApiError && error.status === 401) return { ok: false, message: 'Sua sessão expirou. Entre novamente para enviar.' };
      return { ok: false, message: error instanceof Error ? error.message : 'Não foi possível enviar o feedback.' };
    } finally { setBusy(false); }
  };
  const openResources = () => withBusy(async () => { const token = currentSessionToken(); const resources = await api.listResources(); if (!isCurrentSession(token)) return; setModel((old) => ({ ...old, resources })); setScreen('resources'); });

  return <>
    <main className="phone-shell">
      {screen === 'login' && <LoginPage busy={busy} onRegister={() => setScreen('register')} onSubmit={login} />}
      {screen === 'register' && <RegisterPage busy={busy} onBack={() => setScreen('login')} onSubmit={register} />}
      {screen === 'home' && model.user && <HomePage user={model.user} vehicles={model.vehicles} fines={model.fines} selectedVehicleId={model.selectedVehicleId} pendingVehicle={model.pendingVehicle} busy={busy} onRetryVehicle={retryPendingVehicle} onScan={() => setScreen('scan')} onLogout={logout} onResources={openResources} onVehicle={openVehicle} onCnh={openCnh} onDebts={() => setScreen('debts')} onActiveDebt={() => setScreen('active-debt')} onFleet={() => setScreen('fleet')} onNetwork={() => setScreen('network')} onConsultations={() => setScreen('consultations')} onPlans={() => setScreen('plans')} onProfile={() => setScreen('profile')} onDiagnosis={(id) => withBusy(async () => { const token = currentSessionToken(); const result = await api.diagnosis(id); if (!isCurrentSession(token)) return; setModel((old) => ({ ...old, selectedFineId: id, diagnosis: result })); setScreen('diagnosis'); })} />}
      {screen === 'scan' && <ScanPage busy={busy} onBack={() => setScreen('home')} onManual={() => { setModel((old) => ({ ...old, fields: { origem: 'agente' } })); setScreen('confirm'); }} onFile={(file) => withBusy(async () => { const token = currentSessionToken(); setScreen('analysis'); const result = await api.readDocument(file); if (!isCurrentSession(token)) return; setModel((old) => ({ ...old, fields: result.campos })); setScreen('confirm'); if (!result.leu) notify(result.motivo ?? result.orientacao); })} />}
      {screen === 'analysis' && <AnalysisPage />}
      {screen === 'confirm' && <ConfirmPage busy={busy} initialFields={model.fields} onBack={() => setScreen('scan')} onSubmit={(fields) => withBusy(async () => { const token = currentSessionToken(); const result = await api.createFine(fields, model.selectedVehicleId ?? undefined); if (!isCurrentSession(token)) return; setModel((old) => ({ ...old, fields, selectedFineId: result.multa_id })); const diagnosis = await api.diagnosis(result.multa_id); if (!isCurrentSession(token)) return; setModel((old) => ({ ...old, diagnosis })); setScreen('diagnosis'); })} />}
      {screen === 'diagnosis' && model.diagnosis && <DiagnosisPage diagnosis={model.diagnosis} onBack={() => setScreen('home')} onPlans={() => setScreen('plans')} onDefense={() => withBusy(async () => { if (!model.selectedFineId) return; const token = currentSessionToken(); const defense = await api.createDefense(model.selectedFineId); if (!isCurrentSession(token)) return; setModel((old) => ({ ...old, defense })); setScreen('defense'); })} />}
      {screen === 'resources' && <ResourcesPage resources={model.resources} busy={busy} onBack={() => setScreen('home')} onRefresh={openResources} onOpenExisting={(resource) => withBusy(async () => { const token = currentSessionToken(); const blob = await api.downloadDefensePdf(resource.id); if (!isCurrentSession(token)) return; webFileTransfer.download(blob, `defesa-previa-recurso-${resource.id}.pdf`); notify('Defesa existente aberta em PDF.'); })} />}
      {screen === 'defense' && model.defense && <DefensePage defense={model.defense} busy={busy} onBack={() => setScreen('resources')} onDownload={() => withBusy(async () => { const token = currentSessionToken(); const blob = await api.downloadDefensePdf(model.defense!.recurso_id); if (!isCurrentSession(token)) return; webFileTransfer.download(blob, 'defesa-previa-verimulta.pdf'); })} />}
      {screen === 'plans' && <PlansPage plans={model.plans} busy={busy} onBack={() => setScreen('home')} onLoad={() => withBusy(async () => { const token = currentSessionToken(); const plans = await api.listPlans(); if (!isCurrentSession(token)) return; setModel((old) => ({ ...old, plans })); })} onCheckout={(key) => withBusy(async () => { const token = currentSessionToken(); const result = await api.checkout(key); if (!isCurrentSession(token)) return; if (result.checkout_url) webExternalNavigation.open(result.checkout_url); else notify(result.aviso ?? 'Checkout criado. A ativação depende do pagamento confirmado pelo backend.'); })} />}
      {screen === 'profile' && model.user && <ProfilePage user={model.user} busy={busy} cancellationRequested={cancellationRequested} onBack={() => setScreen('home')} onPlans={() => setScreen('plans')} onConsultations={() => setScreen('consultations')} onFeedback={openFeedback} onTransparency={() => setScreen('transparency')} onCancel={() => withBusy(async () => { const token = currentSessionToken(); const result = await api.cancelSubscription(); if (!isCurrentSession(token)) return; setCancellationRequested(true); notify(result.mensagem); })} onDownloadData={() => withBusy(async () => { const token = currentSessionToken(); const blob = await api.downloadPersonalData(); if (!isCurrentSession(token)) return; webFileTransfer.download(blob, 'meus-dados-verimulta.json'); })} onDeleteAccount={() => withBusy(async () => { const token = currentSessionToken(); const result = await api.deleteAccount(); if (!isCurrentSession(token)) return; notify(result.mensagem); logout(); })} onLogout={logout} />}
      {screen === 'vehicle' && <VehiclePage vehicles={model.vehicles} selectedVehicleId={model.selectedVehicleId} summary={model.vehicleSummary} error={model.vehicleError} busy={busy} onBack={() => setScreen('home')} onSelectVehicle={selectVehicle} onScan={() => setScreen('scan')} />}
      {screen === 'cnh' && <CnhPage data={model.cnh} error={model.cnhError} busy={busy} onBack={() => setScreen('home')} onRetry={openCnh} onSave={saveCnh} />}
      {screen === 'debts' && <DebtsPage fines={model.fines} busy={busy} onBack={() => setScreen('home')} onDiagnosis={(id) => withBusy(async () => { const token = currentSessionToken(); const result = await api.diagnosis(id); if (!isCurrentSession(token)) return; setModel((old) => ({ ...old, selectedFineId: id, diagnosis: result })); setScreen('diagnosis'); })} />}
      {screen === 'consultations' && <OfficialConsultationsPage onBack={() => setScreen('home')} />}
      {screen === 'active-debt' && <ActiveDebtPage onBack={() => setScreen('home')} onConsultations={() => setScreen('consultations')} />}
      {screen === 'fleet' && <FleetPage onBack={() => setScreen('home')} onPlans={() => setScreen('plans')} />}
      {screen === 'network' && <NetworkPage onBack={() => setScreen('home')} onPartner={() => setScreen('partner')} />}
      {screen === 'partner' && <PartnerPage onBack={() => setScreen('network')} />}
      {screen === 'feedback' && <FeedbackPage items={model.feedback} busy={busy} error={model.feedbackError} onBack={() => setScreen('profile')} onRetry={openFeedback} onSubmit={saveFeedback} />}
      {screen === 'transparency' && <TransparencyPage onBack={() => setScreen('profile')} />}
      {model.user && !['login', 'register', 'analysis'].includes(screen) && <AppBottomNavigation screen={screen} onHome={() => setScreen('home')} onResources={openResources} onScan={() => setScreen('scan')} onNetwork={() => setScreen('network')} onProfile={() => setScreen('profile')} />}
    </main>
    <Toast message={toast} />
  </>;
}

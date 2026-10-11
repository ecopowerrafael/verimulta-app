import type { Screen } from '../app/App';

export const activeFor = (screen: Screen, section: 'home' | 'resources' | 'scan' | 'network' | 'profile') => {
  if (section === 'home') return screen === 'home';
  if (section === 'resources') return screen === 'resources' || screen === 'defense';
  if (section === 'scan') return screen === 'scan' || screen === 'analysis' || screen === 'confirm' || screen === 'diagnosis';
  if (section === 'network') return screen === 'network' || screen === 'partner';
  return screen === 'profile' || screen === 'plans' || screen === 'feedback' || screen === 'transparency';
};

export function AppBottomNavigation({ screen, onHome, onResources, onScan, onNetwork, onProfile }: { screen: Screen; onHome: () => void; onResources: () => void; onScan: () => void; onNetwork: () => void; onProfile: () => void }) {
  return <nav className="bottom-nav app-bottom-nav" aria-label="Navegação principal"><button className={activeFor(screen, 'home') ? 'active' : ''} aria-current={activeFor(screen, 'home') ? 'page' : undefined} onClick={onHome}>🏠<span>Início</span></button><button className={activeFor(screen, 'resources') ? 'active' : ''} aria-current={activeFor(screen, 'resources') ? 'page' : undefined} onClick={onResources}>📄<span>Recursos</span></button><button className={`scan-nav ${activeFor(screen, 'scan') ? 'active' : ''}`} aria-current={activeFor(screen, 'scan') ? 'page' : undefined} onClick={onScan}>📸<span>Verificar</span></button><button className={activeFor(screen, 'network') ? 'active' : ''} aria-current={activeFor(screen, 'network') ? 'page' : undefined} onClick={onNetwork}>🤝<span>Rede</span></button><button className={activeFor(screen, 'profile') ? 'active' : ''} aria-current={activeFor(screen, 'profile') ? 'page' : undefined} onClick={onProfile}>👤<span>Perfil</span></button></nav>;
}

import { useState } from 'react';
import { BrandLogo } from '../../components/BrandLogo';
import { Button } from '../../components/Button';

export function LoginPage({ busy, onRegister, onSubmit }: { busy: boolean; onRegister: () => void; onSubmit: (email: string, senha: string) => void }) {
  const [email, setEmail] = useState(''); const [senha, setSenha] = useState('');
  return <section className="screen login-screen"><div className="auth-inner"><BrandLogo /><p className="slogan">Verifique antes de pagar.</p><form className="login-card" onSubmit={(event) => { event.preventDefault(); if (!email || !senha) return; onSubmit(email.trim(), senha); }}><label htmlFor="login-email">E-mail ou CPF</label><input id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" autoComplete="username" /><label htmlFor="login-senha">Senha</label><input id="login-senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" autoComplete="current-password" /><Button type="submit" variant="yellow" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</Button><button type="button" className="biometric" onClick={() => undefined}>🙂 &nbsp;Entrar com biometria facial</button></form><button className="link-light" onClick={onRegister}>Criar minha conta grátis →</button><div className="login-seals">Seguro · LGPD · Sem cartão</div></div></section>;
}

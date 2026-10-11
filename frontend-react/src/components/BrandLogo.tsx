export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <div className={`brand-logo${compact ? ' compact' : ''}`} aria-label="Verimulta">
    <span className="brand-check" aria-hidden="true">✓</span><span>VERIMULTA</span>
  </div>;
}

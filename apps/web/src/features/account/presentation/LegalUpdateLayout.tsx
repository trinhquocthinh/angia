import type { ReactNode } from 'react';
import './legal-update-layout.css';
import './legal-update-details.css';
import './legal-update-motion.css';

export function LegalUpdateLayout({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <div className="legal-update-screen">
      <div className="legal-update-ambient" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="legal-update-container">
        <header className="legal-update-brand">
          <div className="legal-update-logo">
            <img src="/logo.webp" width="96" height="96" alt="" />
          </div>
          <h1>AN GIA</h1>
          <p>Sổ tay chăm sóc &amp; kết nối gia đình</p>
        </header>
        <section className="legal-update-card" aria-labelledby="legal-update-title">
          {children}
        </section>
        <footer className="legal-update-footer">{footer}</footer>
      </div>
    </div>
  );
}

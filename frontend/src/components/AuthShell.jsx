import React from 'react'
import { BadgeCheck, BarChart3, PackageCheck, ShieldCheck, Smartphone } from 'lucide-react'

export default function AuthShell({ eyebrow='Secure staff access', title, subtitle, children }) {
  return (
    <div className="auth-page auth-pro">
      <section className="auth-showcase">
        <div className="auth-showcase-inner">
          <div className="auth-wordmark">
            <div className="auth-mark"><img src="/applepoint-logo.png" alt="ApplePoint" /></div>
            <div>
              <strong>ApplePoint</strong>
              <span>Accessories • Sales • Repairs</span>
            </div>
          </div>

          <div className="showcase-copy">
            <div className="showcase-kicker">SHOP MANAGEMENT, REFINED</div>
            <h1>Everything in your shop.<br/>One clean workspace.</h1>
            <p>Track accessories, sales, repairs, stock warnings and daily reports from any device.</p>
          </div>

          <div className="feature-stack">
            <div><PackageCheck size={19}/><span><strong>Live inventory</strong><small>Automatic stock deduction after every sale</small></span></div>
            <div><Smartphone size={19}/><span><strong>Repair tracking</strong><small>Customer, phone and payment details in one place</small></span></div>
            <div><BarChart3 size={19}/><span><strong>Daily overview</strong><small>Sales, low stock and reports at a glance</small></span></div>
          </div>

          <div className="showcase-security"><ShieldCheck size={16}/> Protected with verified-email access</div>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-card auth-card-pro">
          <div className="mobile-brand">
            <img src="/applepoint-logo.png" alt="ApplePoint" />
            <div><strong>ApplePoint</strong><span>Shop Manager</span></div>
          </div>
          <div className="auth-eyebrow"><BadgeCheck size={15}/>{eyebrow}</div>
          <h2>{title}</h2>
          <p className="muted auth-subtitle">{subtitle}</p>
          {children}
          <div className="auth-trust"><ShieldCheck size={14}/> Your account is protected by email verification.</div>
        </div>
      </section>
    </div>
  )
}

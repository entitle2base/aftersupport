'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TIMREX_URL = 'https://timerex.net/s/entitle2base.atokabu_404c/32a499b2'

const MOB_NAV = [
  {
    href: TIMREX_URL,
    external: true,
    label: '講師とZoom',
    mobileIcon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14"/>
        <rect x="1" y="6" width="15" height="12" rx="2"/>
      </svg>
    ),
  },
  {
    href: '/tools/invoice',
    external: false,
    label: '請求書送付',
    mobileIcon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    href: '/tools/thumbnail',
    external: false,
    label: 'サムネ',
    mobileIcon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
  {
    href: '/dashboard',
    external: false,
    label: 'AI質問',
    mobileIcon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    href: '/dashboard',
    external: false,
    label: 'お気に入り',
    mobileIcon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
    ),
  },
]

const NAV_SIDEBAR = [
  { href: '/dashboard', label: 'ダッシュボード', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
  { href: '/tools/invoice', label: '請求書送付', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { href: '/tools/thumbnail', label: 'サムネ添削', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="ds-sidebar">
        <div className="ds-sb-logo">
          <div className="ds-sb-logo-ico">A</div>
          <span className="ds-sb-logo-text">AFTER SUPPORT</span>
        </div>

        <nav className="ds-sb-nav">
          {NAV_SIDEBAR.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className={`ds-sb-item${pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) ? ' active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="ds-sb-footer">
          <a
            href={TIMREX_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ds-sb-zoom"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14"/>
              <rect x="1" y="6" width="15" height="12" rx="2"/>
            </svg>
            講師にZoomで相談
          </a>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="ds-mob-nav">
        {MOB_NAV.map((item, i) => {
          const isActive = !item.external && (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))
          const cls = `ds-mob-nav-item${isActive ? ' active' : ''}`
          if (item.external) {
            return (
              <a key={i} href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>
                {item.mobileIcon}
                <span>{item.label}</span>
              </a>
            )
          }
          return (
            <Link key={i} href={item.href} className={cls}>
              {item.mobileIcon}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

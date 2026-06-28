'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Overview', code: '00' },
  { href: '/reconciliation', label: 'Bank Reconciliation', code: '01' },
  { href: '/telegram', label: 'Telegram Capture', code: '02' },
  { href: '/cashflow', label: 'Cash Flow & Risk', code: '03' },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="nav">
      {NAV.map((item) => {
        const active = item.href === '/' ? path === '/' : path.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${active ? ' is-active' : ''}`}
          >
            <span className="nav-code">{item.code}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

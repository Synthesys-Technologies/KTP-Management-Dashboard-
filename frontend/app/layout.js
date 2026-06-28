import './globals.css';
import Nav from '@/components/Nav';

export const metadata = {
  title: 'Hermes Ops',
  description: 'Agent task results — reconciliation, capture, cash flow',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <aside className="rail">
            <div className="brand">
              <span className="brand-mark">H</span>
              <span className="brand-text">
                Hermes<em>ops ledger</em>
              </span>
            </div>
            <Nav />
            <div className="rail-foot">
              <span className="flow">agent → api → db → view</span>
            </div>
          </aside>
          <main className="main">
            <div className="main-inner">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}

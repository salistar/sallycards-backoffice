import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, minWidth: 0 }}>
        <Header />
        <main style={{ flex: 1, padding: 32, overflow: 'auto' }}>{children}</main>
      </div>
    </div>
  );
}

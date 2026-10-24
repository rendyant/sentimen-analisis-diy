'use client';

import { LayoutDashboard, MessageSquare, FileText, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: MessageSquare, label: 'Analisis Sentimen', href: '/analisis' },
  { icon: FileText, label: 'Semua Ulasan', href: '/ulasan' },
  { icon: Settings, label: 'Pengaturan', href: '/pengaturan' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-red-800 to-red-950 text-white flex flex-col">
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">🏛️</div>
          <div>
            <h1 className="font-bold text-sm">ANALISIS OPD DIY</h1>
            <p className="text-xs text-white/70">Sentimen SV</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs text-white/60 uppercase mb-3 px-3">Menu Navigasi</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                active ? 'bg-white/10 border-l-4 border-white' : 'hover:bg-white/5'
              }`}>
              <Icon size={18} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"><User size={18} /></div>
          <div>
            <p className="text-sm font-medium">Admin Analyst</p>
            <p className="text-xs text-white/60">OPD Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
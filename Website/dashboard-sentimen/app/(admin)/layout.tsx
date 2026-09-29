import SidebarAdmin from "../../components/admin/sidebar";
import HeaderAdmin from "../../components/admin/header";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <SidebarAdmin />
      <main className="flex-1 ml-64">
        <HeaderAdmin />
        {children}
      </main>
    </div>
  );
}
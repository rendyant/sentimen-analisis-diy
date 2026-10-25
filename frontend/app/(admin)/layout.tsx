import SidebarAdmin from "@/components/layout/admin-sidebar";
import HeaderAdmin from "@/components/layout/admin-header";
import ChatWidget from "@/components/ai/chat-widget";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <SidebarAdmin />
      <main className="flex-1 ml-64">
        <HeaderAdmin />
        {children}
      </main>
      <ChatWidget fullPageHref="/admin/chatbot" />
    </div>
  );
}
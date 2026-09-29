import Sidebar from "@/components/sidebar";
import Header from "@/components/header";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64">
        <Header />
        {children}
      </main>
    </div>
  );
}
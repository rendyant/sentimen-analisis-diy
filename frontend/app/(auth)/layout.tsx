export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#f8fafc] flex items-center justify-center py-10 px-4">
      {/* Background watermark Tugu + Pendopo DIY */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-90"
        style={{ backgroundImage: "url('/bg-auth.png')" }}
      />

      {/* Konten Form di Tengah dengan Lebar Sesuai Desain */}
      <div className="relative z-10 w-full max-w-xl">
        {children}
      </div>
    </div>
  );
}
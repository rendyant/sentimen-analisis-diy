export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-screen overflow-hidden bg-[#f4f6f8]">
      {/* Background watermark Tugu + Gazebo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/bg-auth.png')" }}
      />

      {/* Konten: tinggi pas layar, scroll tersembunyi kalau layar kecil */}
      <div className="scrollbar-hide relative z-10 h-full overflow-y-auto flex flex-col items-center justify-center py-8">
        <div className="w-full max-w-md px-4">{children}</div>
      </div>
    </div>
  );
}
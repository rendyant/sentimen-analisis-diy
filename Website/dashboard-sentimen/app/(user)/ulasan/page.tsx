import UlasanTerbaru from "@/components/ulasanterbaru";

export default function UlasanPage() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Semua Ulasan</h1>
      <p className="text-sm text-gray-500 mb-6">Daftar lengkap ulasan masyarakat dari semua saluran</p>
      <UlasanTerbaru />
    </div>
  );
}
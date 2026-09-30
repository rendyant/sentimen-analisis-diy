import { Sparkles } from 'lucide-react';

export default function AIInsight() {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="text-green-700" size={20} />
        <h3 className="font-bold text-green-800 text-lg">AI Insight & Ringkasan Mingguan</h3>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed">
        Berdasarkan analisis minggu ini, sentimen negatif terkonsentrasi kuat pada kendala server PPDB Online (aspek Pelayanan) dengan tingkat keparahan tinggi. Sebaliknya, program beasiswa mencatatkan apresiasi positif yang signifikan. Kami merekomendasikan penanganan segera pada server untuk memitigasi puncak sentimen negatif berikutnya.
      </p>
    </div>
  );
}
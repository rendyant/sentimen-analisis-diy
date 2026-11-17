'use client';

export interface PopularWordItem {
  text: string;
  count: number;
  sentimen: string;
  parts: number[];
}

export default function WordCloud({ words = [] }: { words?: PopularWordItem[] }) {
  const maxCount = words.length > 0 ? Math.max(...words.map((w) => w.count), 1) : 1;

  function getSizeClass(count: number) {
    const ratio = count / maxCount;
    if (ratio > 0.8) return 'text-3xl font-extrabold';
    if (ratio > 0.6) return 'text-2xl font-bold';
    if (ratio > 0.4) return 'text-xl font-semibold';
    if (ratio > 0.25) return 'text-base font-semibold';
    return 'text-sm font-medium';
  }

  function getColorClass(sentimen: string) {
    if (sentimen === 'negatif') return 'text-red-600';
    if (sentimen === 'positif') return 'text-green-600';
    return 'text-teal-600';
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">Kata Kunci Populer (Database Live)</h3>
          <p className="text-xs text-gray-500">Diekstrak langsung dari frekuensi kata pada ulasan & berita di database</p>
        </div>
      </div>

      {words.length === 0 ? (
        <div className="py-10 text-center text-xs text-gray-400">
          Belum ada kata kunci dari ulasan pada filter ini.
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 py-6">
          {words.map((word, idx) => (
            <span
              key={`${word.text}-${idx}`}
              title={`Disebut ${word.count} kali di database`}
              className={`${getSizeClass(word.count)} ${getColorClass(word.sentimen)} hover:scale-110 transition-transform cursor-default`}
            >
              {word.text}{' '}
              <span className="text-[10px] font-normal text-gray-400 align-super">
                ({word.count})
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

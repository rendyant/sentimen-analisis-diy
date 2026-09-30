export default function WordCloud() {
  const words = [
    { text: 'Pelayanan', size: 'text-4xl', color: 'text-red-600', weight: 'font-bold' },
    { text: 'Ramah', size: 'text-lg', color: 'text-green-600', weight: 'font-medium' },
    { text: 'Harga', size: 'text-xl', color: 'text-orange-500', weight: 'font-semibold' },
    { text: 'Lambat', size: 'text-base', color: 'text-red-400', weight: 'font-medium' },
    { text: 'Cepat', size: 'text-sm', color: 'text-green-500', weight: 'font-normal' },
    { text: 'Mahal', size: 'text-sm', color: 'text-red-400', weight: 'font-normal' },
    { text: 'Bersih', size: 'text-base', color: 'text-teal-600', weight: 'font-medium' },
    { text: 'Kualitas', size: 'text-2xl', color: 'text-teal-600', weight: 'font-bold' },
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 text-lg mb-6">Kata Kunci Populer</h3>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 py-8">
        {words.map((word, idx) => (
          <span
            key={idx}
            className={`${word.size} ${word.color} ${word.weight} hover:scale-110 transition-transform cursor-pointer`}
          >
            {word.text}
          </span>
        ))}
      </div>
    </div>
  );
}
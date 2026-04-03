const FEATURES = [
  { icon: "🗓️", title: "Date Heatmap", desc: "See who's free when. Real-time updates as people vote." },
  { icon: "🔒", title: "Anonymous Budget", desc: "Everyone sets their range privately. Only the overlap is shown." },
  { icon: "🤖", title: "AI Destinations", desc: "3-5 suggestions filtered by your group's actual budget and vibe." },
  { icon: "🗺️", title: "Map Itinerary", desc: "Day-by-day plan with color-coded pins. Geographically clustered." },
  { icon: "💸", title: "Expense Splitting", desc: "Log expenses during the trip. No daily caps, no ads." },
  { icon: "📱", title: "UPI Settlement", desc: "Settle via GPay, PhonePe, or Paytm. One tap, done." },
];

export function FeatureGrid() {
  return (
    <section className="px-4 py-16 bg-orange-50">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
        Everything your group needs
      </h2>
      <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl bg-white border border-orange-100 p-4 flex flex-col gap-2"
          >
            <span className="text-2xl">{f.icon}</span>
            <h3 className="font-semibold text-sm text-gray-900">{f.title}</h3>
            <p className="text-xs text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-gray-400 mt-12">
        Made for Indian friend groups · ₹0 to plan your trip
      </p>
    </section>
  );
}

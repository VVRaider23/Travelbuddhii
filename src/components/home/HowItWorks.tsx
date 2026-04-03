const STEPS = [
  {
    icon: "💬",
    title: "Share link on WhatsApp",
    description: "Create a trip in 30 seconds. Share the link to your group. No one needs to download an app.",
  },
  {
    icon: "🗳️",
    title: "Everyone votes",
    description: "Tap dates you're free. Set your budget privately. Pick your vibe. 2 minutes per person.",
  },
  {
    icon: "✨",
    title: "AI builds the plan",
    description: "Day-by-day itinerary with real places, map view, booking links to MakeMyTrip and IRCTC.",
  },
];

export function HowItWorks() {
  return (
    <section className="px-4 py-16 bg-white">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
        How it works
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory max-w-2xl mx-auto">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className="snap-center shrink-0 w-64 rounded-2xl border border-gray-100 bg-gray-50 p-5 flex flex-col gap-3"
          >
            <div className="text-3xl">{step.icon}</div>
            <div>
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">
                Step {i + 1}
              </p>
              <h3 className="font-semibold text-gray-900">{step.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

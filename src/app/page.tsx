import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { TripStories } from "@/components/home/TripStories";
import { BottomCTA } from "@/components/home/BottomCTA";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FDF6EC" }}>
      <main
        className="flex flex-col"
        style={{
          maxWidth: 480,
          margin: "0 auto",
          overflow: "hidden",
          borderRadius: "0 0 28px 28px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.06)",
        }}
      >
        <HeroSection />
        <HowItWorks />
        <FeatureGrid />
        <TripStories />
        <BottomCTA />
      </main>
    </div>
  );
}

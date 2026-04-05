import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeatureGrid } from "@/components/home/FeatureGrid";

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      <HeroSection />
      <HowItWorks />
      <FeatureGrid />
    </main>
  );
}

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/landing/HeroSection";
import PlansSection from "@/components/landing/PlansSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import BoardSection from "@/components/landing/BoardSection";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <PlansSection />
        <BoardSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

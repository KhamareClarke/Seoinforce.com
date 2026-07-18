import Navigation from '@/components/home/Navigation';
import HeroSection from '@/components/home/HeroSection';
import AuthorityStats from '@/components/home/AuthorityStats';
import ProvenResults from '@/components/home/ProvenResults';
import CaseStudies from '@/components/home/CaseStudies';
import ServicesSection from '@/components/home/ServicesSection';
import PricingSection from '@/components/home/PricingSection';
import FAQSection from '@/components/home/FAQSection';
import FinalCTA from '@/components/home/FinalCTA';
import Footer from '@/components/home/Footer';
import ChatWidget from '@/components/home/ChatWidget';

export default function HomePage() {
  return (
    <div className="bg-[#0a0a0c] min-h-screen">
      <Navigation />
      {/* pt-16 offsets the fixed nav (h-16 = 64px) */}
      <div className="pt-16 animate-page-load">
        <main>
          <HeroSection />
          <AuthorityStats />
          <ServicesSection />
          <ProvenResults />
          <CaseStudies />
          <PricingSection />
          <FAQSection />
          <FinalCTA />
        </main>
        <Footer />
      </div>
      <ChatWidget />
    </div>
  );
}

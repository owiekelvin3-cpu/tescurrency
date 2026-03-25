import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, Zap } from "lucide-react";

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="hero-gradient text-secondary-foreground py-20 md:py-32">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm">
            <Zap className="h-4 w-4 text-primary" />
            <span>Trusted by 10,000+ Investors Worldwide</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight">
            Invest Smart. <span className="text-gradient">Grow Wealth.</span>
          </h1>
          <p className="text-lg md:text-xl opacity-80 max-w-2xl mx-auto">
            TCurrency offers secure cryptocurrency investment plans with guaranteed returns. Start building your financial future today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/register")} className="text-base px-8">
              Start Investing <TrendingUp className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/#plans")} className="text-base px-8 border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10">
              View Plans
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12">
            {[
              { icon: Shield, label: "Secure Platform", value: "256-bit SSL" },
              { icon: TrendingUp, label: "Total Invested", value: "$50M+" },
              { icon: Zap, label: "Instant Withdrawals", value: "24/7" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 justify-center sm:justify-start">
                <div className="rounded-lg bg-primary/20 p-2.5">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm opacity-60">{item.label}</p>
                  <p className="font-semibold">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

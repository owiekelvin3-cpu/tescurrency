import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { INVESTMENT_PLANS } from "@/lib/constants";
import { TrendingUp, Clock, DollarSign } from "lucide-react";

export default function PlansSection() {
  const navigate = useNavigate();

  return (
    <section id="plans" className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Investment Plans</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Choose the plan that matches your investment goals and start earning today.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {INVESTMENT_PLANS.map((plan, i) => (
            <div key={plan.name} className={`relative rounded-xl border p-6 card-elevated bg-card transition-all hover:-translate-y-1 ${i === 2 ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
              {i === 2 && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="font-display text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{plan.roi}% ROI</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{plan.duration} Days</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>${plan.min.toLocaleString()} - ${plan.max.toLocaleString()}</span>
                </div>
              </div>
              <Button className="w-full" variant={i === 2 ? "default" : "outline"} onClick={() => navigate("/register")}>
                Get Started
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

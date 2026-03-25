import { Shield, TrendingUp, Clock, Headphones } from "lucide-react";

const features = [
  { icon: Shield, title: "Bank-Grade Security", description: "Your investments are protected with industry-leading encryption and cold storage." },
  { icon: TrendingUp, title: "High Returns", description: "Our expert traders generate consistent returns on your cryptocurrency investments." },
  { icon: Clock, title: "Fast Processing", description: "Deposits and withdrawals are processed quickly so you can access your funds." },
  { icon: Headphones, title: "24/7 Support", description: "Our dedicated support team is always available to assist you." },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Why Choose TCurrency</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Built on trust, powered by technology.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-card rounded-xl p-6 border border-border card-elevated text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

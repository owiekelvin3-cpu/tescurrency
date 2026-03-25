import { BOARD_MEMBERS } from "@/lib/constants";
import { User } from "lucide-react";

export default function BoardSection() {
  return (
    <section id="about" className="py-20 bg-muted">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Our Board</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Meet the experienced professionals driving TCurrency's vision and growth.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BOARD_MEMBERS.map((member) => (
            <div key={member.name} className="bg-card rounded-xl p-6 text-center card-elevated border border-border">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {member.image ? (
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-display font-semibold text-lg">{member.name}</h3>
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

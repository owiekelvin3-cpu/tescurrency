import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard, LogOut, Shield } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="text-gradient">TCurrency</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
          <Link to="/#plans" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Plans</Link>
          <Link to="/#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
              </Button>
              {isAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
                  <Shield className="mr-2 h-4 w-4" /> Admin
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Login</Button>
              <Button size="sm" onClick={() => navigate("/register")}>Get Started</Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-card p-4 space-y-3">
          <Link to="/" className="block text-sm py-2" onClick={() => setOpen(false)}>Home</Link>
          <Link to="/#plans" className="block text-sm py-2" onClick={() => setOpen(false)}>Plans</Link>
          {user ? (
            <>
              <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate("/dashboard"); setOpen(false); }}>
                <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
              </Button>
              {isAdmin && (
                <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate("/admin"); setOpen(false); }}>
                  <Shield className="mr-2 h-4 w-4" /> Admin
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="w-full" onClick={() => { navigate("/login"); setOpen(false); }}>Login</Button>
              <Button className="w-full" onClick={() => { navigate("/register"); setOpen(false); }}>Get Started</Button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

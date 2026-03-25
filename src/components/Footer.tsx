import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-secondary text-secondary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-display text-lg font-bold mb-4 text-gradient">TCurrency</h3>
            <p className="text-sm opacity-80">Your trusted partner in cryptocurrency investment and wealth management.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider opacity-60">Quick Links</h4>
            <div className="space-y-2">
              <Link to="/" className="block text-sm opacity-80 hover:opacity-100 transition-opacity">Home</Link>
              <Link to="/#plans" className="block text-sm opacity-80 hover:opacity-100 transition-opacity">Investment Plans</Link>
              <Link to="/#about" className="block text-sm opacity-80 hover:opacity-100 transition-opacity">About Us</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider opacity-60">Legal</h4>
            <div className="space-y-2">
              <span className="block text-sm opacity-80">Terms of Service</span>
              <span className="block text-sm opacity-80">Privacy Policy</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider opacity-60">Contact</h4>
            <div className="space-y-2">
              <span className="block text-sm opacity-80">support@tcurrency.com</span>
              <span className="block text-sm opacity-80">24/7 Live Support</span>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-secondary-foreground/10 text-center text-sm opacity-60">
          © {new Date().getFullYear()} TCurrency. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

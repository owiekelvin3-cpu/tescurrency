import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BTC_WALLET_ADDRESS, INVESTMENT_PLANS } from "@/lib/constants";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, Copy, Clock,
  DollarSign, Activity, Bitcoin, Check
} from "lucide-react";

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositStep, setDepositStep] = useState<"amount" | "payment" | "processing">("amount");
  const [copied, setCopied] = useState(false);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");

  const [investOpen, setInvestOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [investAmount, setInvestAmount] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user]);

  useEffect(() => {
    if (!user) return;
    fetchAll();

    const ch = supabase.channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "deposits", filter: `user_id=eq.${user.id}` }, () => fetchDeposits())
      .on("postgres_changes", { event: "*", schema: "public", table: "withdrawals", filter: `user_id=eq.${user.id}` }, () => fetchWithdrawals())
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` }, () => fetchTransactions())
      .on("postgres_changes", { event: "*", schema: "public", table: "investments", filter: `user_id=eq.${user.id}` }, () => fetchInvestments())
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const fetchAll = () => { fetchDeposits(); fetchWithdrawals(); fetchInvestments(); fetchTransactions(); };

  const fetchDeposits = async () => {
    const { data } = await supabase.from("deposits").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    if (data) setDeposits(data);
  };
  const fetchWithdrawals = async () => {
    const { data } = await supabase.from("withdrawals").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    if (data) setWithdrawals(data);
  };
  const fetchInvestments = async () => {
    const { data } = await supabase.from("investments").select("*").eq("user_id", user!.id).order("start_date", { ascending: false });
    if (data) setInvestments(data);
  };
  const fetchTransactions = async () => {
    const { data } = await supabase.from("transactions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(20);
    if (data) setTransactions(data);
  };

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(BTC_WALLET_ADDRESS);
    setCopied(true);
    toast.success("Wallet address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDepositSubmit = async () => {
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    const { error } = await supabase.from("deposits").insert({
      user_id: user!.id, amount: amt, wallet_address: BTC_WALLET_ADDRESS,
    });
    if (error) { toast.error(error.message); return; }
    setDepositStep("processing");
    toast.success("Deposit submitted! Awaiting admin confirmation.");
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (amt > (profile?.balance || 0)) { toast.error("Insufficient balance"); return; }
    if (!withdrawAddress.trim()) { toast.error("Enter a withdrawal address"); return; }
    const { error } = await supabase.from("withdrawals").insert({
      user_id: user!.id, amount: amt, address: withdrawAddress,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Withdrawal request submitted!");
    setWithdrawOpen(false);
    setWithdrawAmount("");
    setWithdrawAddress("");
  };

  const handleInvest = async () => {
    const plan = INVESTMENT_PLANS.find((p) => p.name === selectedPlan);
    if (!plan) { toast.error("Select a plan"); return; }
    const amt = parseFloat(investAmount);
    if (!amt || amt < plan.min || amt > plan.max) {
      toast.error(`Amount must be between $${plan.min} and $${plan.max}`);
      return;
    }
    if (amt > (profile?.balance || 0)) { toast.error("Insufficient balance"); return; }

    // Use the server-side function that deducts balance + creates transaction
    const { error } = await supabase.rpc("start_investment", {
      p_user_id: user!.id,
      p_plan_name: plan.name,
      p_amount: amt,
      p_duration_days: plan.duration,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Investment started!");
    setInvestOpen(false);
    setSelectedPlan("");
    setInvestAmount("");
  };

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  }

  const statusColor = (s: string) =>
    s === "approved" || s === "completed" ? "text-success" :
    s === "rejected" ? "text-destructive" : "text-warning";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-6 px-4 sm:px-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-6">Welcome back, {profile.full_name || profile.email}</p>

        {/* Stats - responsive grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { icon: Wallet, label: "Balance", value: `$${(profile.balance || 0).toLocaleString()}`, color: "text-primary" },
            { icon: TrendingUp, label: "Total Earnings", value: `$${(profile.total_earnings || 0).toLocaleString()}`, color: "text-success" },
            { icon: ArrowUpRight, label: "Active Investments", value: investments.filter((i) => i.status === "active").length.toString(), color: "text-accent" },
            { icon: Activity, label: "Pending Deposits", value: deposits.filter((d) => d.status === "pending").length.toString(), color: "text-warning" },
          ].map((s) => (
            <div key={s.label} className="stat-card flex items-center gap-3 p-4 sm:p-6">
              <div className={`rounded-lg bg-muted p-2 sm:p-3 ${s.color} shrink-0`}>
                <s.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{s.label}</p>
                <p className="text-lg sm:text-xl font-bold font-display truncate">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button onClick={() => { setDepositOpen(true); setDepositStep("amount"); setDepositAmount(""); setCopied(false); }}>
            <ArrowDownRight className="mr-2 h-4 w-4" /> Deposit
          </Button>
          <Button variant="outline" onClick={() => setWithdrawOpen(true)}>
            <ArrowUpRight className="mr-2 h-4 w-4" /> Withdraw
          </Button>
          <Button variant="outline" onClick={() => setInvestOpen(true)}>
            <TrendingUp className="mr-2 h-4 w-4" /> Invest
          </Button>
        </div>

        {/* Transactions & Investments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Recent Transactions</h3>
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No transactions yet.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium capitalize truncate">{t.type.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ml-2 ${t.amount >= 0 ? "text-success" : "text-destructive"}`}>
                      {t.amount >= 0 ? "+" : ""}${Math.abs(t.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Active Investments</h3>
            {investments.filter((i) => i.status === "active").length === 0 ? (
              <p className="text-muted-foreground text-sm">No active investments.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {investments.filter((i) => i.status === "active").map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{inv.plan_name}</p>
                      <p className="text-xs text-muted-foreground">{inv.duration_days} days · Started {new Date(inv.start_date).toLocaleDateString()}</p>
                    </div>
                    <span className="text-sm font-semibold shrink-0 ml-2">${inv.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Deposit History */}
        <div className="mt-6 bg-card rounded-xl border border-border p-4 sm:p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Deposit History</h3>
          {deposits.length === 0 ? (
            <p className="text-muted-foreground text-sm">No deposits yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2">Date</th><th className="pb-2">Amount</th><th className="pb-2 hidden sm:table-cell">Method</th><th className="pb-2">Status</th>
                </tr></thead>
                <tbody>
                  {deposits.map((d) => (
                    <tr key={d.id} className="border-b border-border last:border-0">
                      <td className="py-2">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="py-2">${d.amount.toLocaleString()}</td>
                      <td className="py-2 hidden sm:table-cell">{d.method}</td>
                      <td className={`py-2 capitalize font-medium ${statusColor(d.status)}`}>{d.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Withdrawal History */}
        <div className="mt-6 bg-card rounded-xl border border-border p-4 sm:p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Withdrawal History</h3>
          {withdrawals.length === 0 ? (
            <p className="text-muted-foreground text-sm">No withdrawals yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2">Date</th><th className="pb-2">Amount</th><th className="pb-2 hidden sm:table-cell">Address</th><th className="pb-2">Status</th>
                </tr></thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="border-b border-border last:border-0">
                      <td className="py-2">{new Date(w.created_at).toLocaleDateString()}</td>
                      <td className="py-2">${w.amount.toLocaleString()}</td>
                      <td className="py-2 hidden sm:table-cell truncate max-w-[150px]">{w.address}</td>
                      <td className={`py-2 capitalize font-medium ${statusColor(w.status)}`}>{w.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {depositStep === "amount" && "Make a Deposit"}
              {depositStep === "payment" && "Send Bitcoin Payment"}
              {depositStep === "processing" && "Payment Submitted"}
            </DialogTitle>
            <DialogDescription>
              {depositStep === "amount" && "Enter the amount you want to deposit."}
              {depositStep === "payment" && "Send the exact amount to the wallet address below."}
              {depositStep === "processing" && "Your deposit is being reviewed by our team."}
            </DialogDescription>
          </DialogHeader>

          {depositStep === "amount" && (
            <div className="space-y-4">
              <div>
                <Label>Amount (USD)</Label>
                <Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="100" min="1" />
              </div>
              <Button className="w-full" onClick={() => { if (parseFloat(depositAmount) > 0) setDepositStep("payment"); else toast.error("Enter a valid amount"); }}>
                Continue <Bitcoin className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {depositStep === "payment" && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">Send exactly</p>
                <p className="text-2xl font-bold font-display text-primary">${depositAmount}</p>
                <p className="text-sm text-muted-foreground mt-1">in Bitcoin to:</p>
              </div>
              <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                <code className="text-xs flex-1 break-all">{BTC_WALLET_ADDRESS}</code>
                <Button size="sm" variant={copied ? "default" : "ghost"} onClick={handleCopyWallet} className="shrink-0">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button className="w-full" onClick={handleDepositSubmit}>
                I Have Made Payment
              </Button>
            </div>
          )}

          {depositStep === "processing" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-warning/20 flex items-center justify-center">
                <Clock className="h-8 w-8 text-warning" />
              </div>
              <p className="text-muted-foreground">Your deposit of <strong>${depositAmount}</strong> is being processed. You'll be notified once confirmed.</p>
              <Button variant="outline" onClick={() => setDepositOpen(false)}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Withdraw Funds</DialogTitle>
            <DialogDescription>Enter the amount and your wallet address.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount (USD)</Label>
              <Input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="100" />
              <p className="text-xs text-muted-foreground mt-1">Available: ${(profile?.balance || 0).toLocaleString()}</p>
            </div>
            <div>
              <Label>BTC Wallet Address</Label>
              <Input value={withdrawAddress} onChange={(e) => setWithdrawAddress(e.target.value)} placeholder="bc1q..." />
            </div>
            <Button className="w-full" onClick={handleWithdraw}>Submit Withdrawal</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invest Modal */}
      <Dialog open={investOpen} onOpenChange={setInvestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Start Investment</DialogTitle>
            <DialogDescription>Choose a plan and enter your investment amount.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Investment Plan</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
                <SelectContent>
                  {INVESTMENT_PLANS.map((p) => (
                    <SelectItem key={p.name} value={p.name}>
                      {p.name} — {p.roi}% ROI in {p.duration} days
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPlan && (
              <div className="bg-muted rounded-lg p-3 text-sm">
                {(() => { const p = INVESTMENT_PLANS.find((x) => x.name === selectedPlan); return p ? `Min: $${p.min.toLocaleString()} · Max: $${p.max.toLocaleString()} · ROI: ${p.roi}%` : ""; })()}
              </div>
            )}
            <div>
              <Label>Amount (USD)</Label>
              <Input type="number" value={investAmount} onChange={(e) => setInvestAmount(e.target.value)} placeholder="1000" />
              <p className="text-xs text-muted-foreground mt-1">Available: ${(profile?.balance || 0).toLocaleString()}</p>
            </div>
            <Button className="w-full" onClick={handleInvest}>Start Investment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

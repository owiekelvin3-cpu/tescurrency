import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Users, DollarSign, CheckCircle, XCircle, Search,
  ArrowDownRight, ArrowUpRight, Edit, Ban, TrendingUp, UserCheck
} from "lucide-react";

export default function AdminPanel() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [allInvestments, setAllInvestments] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"users" | "deposits" | "withdrawals" | "investments" | "transactions">("users");

  // User detail
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [userInvestments, setUserInvestments] = useState<any[]>([]);

  // Balance adjustment
  const [editBalanceOpen, setEditBalanceOpen] = useState(false);
  const [editUserId, setEditUserId] = useState("");
  const [balanceAdjustment, setBalanceAdjustment] = useState("");
  const [adjustmentDescription, setAdjustmentDescription] = useState("");

  // End investment
  const [endInvestOpen, setEndInvestOpen] = useState(false);
  const [endInvestData, setEndInvestData] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState("");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/");
  }, [loading, user, isAdmin]);

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  // Realtime for admin
  useEffect(() => {
    if (!isAdmin) return;
    const ch = supabase.channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "deposits" }, () => fetchDeposits())
      .on("postgres_changes", { event: "*", schema: "public", table: "withdrawals" }, () => fetchWithdrawals())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchUsers())
      .on("postgres_changes", { event: "*", schema: "public", table: "investments" }, () => fetchAllInvestments())
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => fetchAllTransactions())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin]);

  const fetchAll = () => { fetchUsers(); fetchDeposits(); fetchWithdrawals(); fetchAllInvestments(); fetchAllTransactions(); };

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setUsers(data);
  };
  const fetchDeposits = async () => {
    const { data } = await supabase.from("deposits").select("*, profiles(email, full_name)").order("created_at", { ascending: false });
    if (data) setDeposits(data);
  };
  const fetchWithdrawals = async () => {
    const { data } = await supabase.from("withdrawals").select("*, profiles(email, full_name)").order("created_at", { ascending: false });
    if (data) setWithdrawals(data);
  };
  const fetchAllInvestments = async () => {
    const { data } = await supabase.from("investments").select("*, profiles(email, full_name)").order("start_date", { ascending: false });
    if (data) setAllInvestments(data);
  };
  const fetchAllTransactions = async () => {
    const { data } = await supabase.from("transactions").select("*, profiles(email, full_name)").order("created_at", { ascending: false }).limit(100);
    if (data) setAllTransactions(data);
  };

  const openUserDetail = async (u: any) => {
    setSelectedUser(u);
    const [{ data: txs }, { data: invs }] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", u.id).order("created_at", { ascending: false }),
      supabase.from("investments").select("*").eq("user_id", u.id).order("start_date", { ascending: false }),
    ]);
    setUserTransactions(txs || []);
    setUserInvestments(invs || []);
  };

  const handleApproveDeposit = async (dep: any) => {
    const { error } = await supabase.rpc("approve_deposit", {
      p_deposit_id: dep.id, p_user_id: dep.user_id, p_amount: dep.amount,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Deposit approved! Balance updated.");
  };

  const handleRejectDeposit = async (dep: any) => {
    await supabase.from("deposits").update({ status: "rejected" }).eq("id", dep.id);
    toast.success("Deposit rejected");
  };

  const handleApproveWithdrawal = async (w: any) => {
    const { error } = await supabase.rpc("approve_withdrawal", {
      p_withdrawal_id: w.id, p_user_id: w.user_id, p_amount: w.amount,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Withdrawal approved!");
  };

  const handleRejectWithdrawal = async (w: any) => {
    await supabase.from("withdrawals").update({ status: "rejected" }).eq("id", w.id);
    toast.success("Withdrawal rejected");
  };

  const handleBalanceEdit = async () => {
    const amt = parseFloat(balanceAdjustment);
    if (isNaN(amt)) { toast.error("Enter a valid number"); return; }

    const { error } = await supabase.rpc("admin_adjust_balance", {
      p_user_id: editUserId, p_amount: amt, p_description: adjustmentDescription || "Admin balance adjustment",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Balance updated via transaction log");
    setEditBalanceOpen(false);
    setBalanceAdjustment("");
    setAdjustmentDescription("");
  };

  const handleSuspendUser = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    const { error } = await supabase.from("profiles").update({ status: newStatus } as any).eq("id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success(newStatus === "suspended" ? "User suspended" : "User reactivated");
    fetchUsers();
    if (selectedUser?.id === userId) setSelectedUser({ ...selectedUser, status: newStatus });
  };

  const handleEndInvestment = async () => {
    const amt = parseFloat(creditAmount);
    if (isNaN(amt) || amt < 0) { toast.error("Enter a valid credit amount"); return; }
    const { error } = await supabase.rpc("end_investment", {
      p_investment_id: endInvestData.id, p_user_id: endInvestData.user_id, p_credit_amount: amt,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Investment ended, user credited");
    setEndInvestOpen(false);
    setCreditAmount("");
    setEndInvestData(null);
  };

  const filteredUsers = users.filter((u) =>
    (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const pendingDeposits = deposits.filter((d) => d.status === "pending").length;
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending").length;

  const tabs = ["users", "deposits", "withdrawals", "investments", "transactions"] as const;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-6 px-4 sm:px-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-6">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="stat-card p-4 sm:p-6">
            <Users className="h-5 w-5 text-primary mb-2" />
            <p className="text-xs sm:text-sm text-muted-foreground">Total Users</p>
            <p className="text-lg sm:text-xl font-bold">{users.length}</p>
          </div>
          <div className="stat-card p-4 sm:p-6">
            <DollarSign className="h-5 w-5 text-primary mb-2" />
            <p className="text-xs sm:text-sm text-muted-foreground">Platform Balance</p>
            <p className="text-lg sm:text-xl font-bold">${users.reduce((a, u) => a + (u.balance || 0), 0).toLocaleString()}</p>
          </div>
          <div className="stat-card p-4 sm:p-6">
            <ArrowDownRight className="h-5 w-5 text-warning mb-2" />
            <p className="text-xs sm:text-sm text-muted-foreground">Pending Deposits</p>
            <p className="text-lg sm:text-xl font-bold">{pendingDeposits}</p>
          </div>
          <div className="stat-card p-4 sm:p-6">
            <ArrowUpRight className="h-5 w-5 text-warning mb-2" />
            <p className="text-xs sm:text-sm text-muted-foreground">Pending Withdrawals</p>
            <p className="text-lg sm:text-xl font-bold">{pendingWithdrawals}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-4 mb-6 border-b overflow-x-auto">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`pb-2 px-2 sm:px-3 capitalize text-sm whitespace-nowrap ${tab === t ? "border-b-2 border-primary text-primary font-medium" : "text-muted-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {tab === "users" && (
          <div className="bg-card rounded-xl border p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="max-w-sm" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left border-b text-muted-foreground"><th className="pb-2">Name</th><th className="pb-2">Email</th><th className="pb-2">Balance</th><th className="pb-2 hidden sm:table-cell">Status</th><th className="pb-2">Actions</th></tr></thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => openUserDetail(u)}>
                      <td className="py-3">{u.full_name || "—"}</td>
                      <td className="py-3 truncate max-w-[150px]">{u.email}</td>
                      <td className="py-3 font-medium">${(u.balance || 0).toLocaleString()}</td>
                      <td className={`py-3 hidden sm:table-cell capitalize ${u.status === "suspended" ? "text-destructive" : "text-success"}`}>{u.status || "active"}</td>
                      <td className="py-3">
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" title="Adjust Balance" onClick={() => { setEditUserId(u.id); setEditBalanceOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" title={u.status === "suspended" ? "Reactivate" : "Suspend"} onClick={() => handleSuspendUser(u.id, u.status || "active")}>
                            {u.status === "suspended" ? <UserCheck className="h-4 w-4 text-success" /> : <Ban className="h-4 w-4 text-destructive" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Deposits Tab */}
        {tab === "deposits" && (
          <div className="bg-card rounded-xl border p-4 sm:p-6 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr className="border-b text-muted-foreground"><th className="pb-2">User</th><th className="pb-2">Amount</th><th className="pb-2 hidden sm:table-cell">Date</th><th className="pb-2">Status</th><th className="pb-2">Actions</th></tr></thead>
              <tbody>
                {deposits.map((d) => (
                  <tr key={d.id} className="border-b">
                    <td className="py-3 truncate max-w-[120px]">{(d.profiles as any)?.email || d.user_id}</td>
                    <td className="py-3 font-bold">${d.amount.toLocaleString()}</td>
                    <td className="py-3 hidden sm:table-cell">{new Date(d.created_at).toLocaleDateString()}</td>
                    <td className={`py-3 capitalize font-medium ${d.status === "approved" ? "text-success" : d.status === "rejected" ? "text-destructive" : "text-warning"}`}>{d.status}</td>
                    <td className="py-3">
                      {d.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleApproveDeposit(d)}><CheckCircle className="h-4 w-4 mr-1" /> Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRejectDeposit(d)}><XCircle className="h-4 w-4 mr-1" /> Reject</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Withdrawals Tab */}
        {tab === "withdrawals" && (
          <div className="bg-card rounded-xl border p-4 sm:p-6 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr className="border-b text-muted-foreground"><th className="pb-2">User</th><th className="pb-2">Amount</th><th className="pb-2 hidden sm:table-cell">Address</th><th className="pb-2">Status</th><th className="pb-2">Actions</th></tr></thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b">
                    <td className="py-3 truncate max-w-[120px]">{(w.profiles as any)?.email || w.user_id}</td>
                    <td className="py-3 font-bold">${w.amount.toLocaleString()}</td>
                    <td className="py-3 hidden sm:table-cell truncate max-w-[150px]">{w.address}</td>
                    <td className={`py-3 capitalize font-medium ${w.status === "approved" ? "text-success" : w.status === "rejected" ? "text-destructive" : "text-warning"}`}>{w.status}</td>
                    <td className="py-3">
                      {w.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleApproveWithdrawal(w)}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRejectWithdrawal(w)}>Reject</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Investments Tab */}
        {tab === "investments" && (
          <div className="bg-card rounded-xl border p-4 sm:p-6 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr className="border-b text-muted-foreground"><th className="pb-2">User</th><th className="pb-2">Plan</th><th className="pb-2">Amount</th><th className="pb-2 hidden sm:table-cell">Duration</th><th className="pb-2">Status</th><th className="pb-2">Actions</th></tr></thead>
              <tbody>
                {allInvestments.map((inv) => (
                  <tr key={inv.id} className="border-b">
                    <td className="py-3 truncate max-w-[120px]">{(inv.profiles as any)?.email || inv.user_id}</td>
                    <td className="py-3">{inv.plan_name}</td>
                    <td className="py-3 font-bold">${inv.amount.toLocaleString()}</td>
                    <td className="py-3 hidden sm:table-cell">{inv.duration_days} days</td>
                    <td className={`py-3 capitalize font-medium ${inv.status === "active" ? "text-success" : "text-muted-foreground"}`}>{inv.status}</td>
                    <td className="py-3">
                      {inv.status === "active" && (
                        <Button size="sm" variant="outline" onClick={() => { setEndInvestData(inv); setCreditAmount(String(inv.amount)); setEndInvestOpen(true); }}>
                          End & Credit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Transactions Tab */}
        {tab === "transactions" && (
          <div className="bg-card rounded-xl border p-4 sm:p-6 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr className="border-b text-muted-foreground"><th className="pb-2">User</th><th className="pb-2">Type</th><th className="pb-2">Amount</th><th className="pb-2 hidden sm:table-cell">Description</th><th className="pb-2">Date</th></tr></thead>
              <tbody>
                {allTransactions.map((t) => (
                  <tr key={t.id} className="border-b">
                    <td className="py-3 truncate max-w-[120px]">{(t.profiles as any)?.email || t.user_id}</td>
                    <td className="py-3 capitalize">{t.type.replace(/_/g, " ")}</td>
                    <td className={`py-3 font-bold ${t.amount >= 0 ? "text-success" : "text-destructive"}`}>{t.amount >= 0 ? "+" : ""}${Math.abs(t.amount).toLocaleString()}</td>
                    <td className="py-3 hidden sm:table-cell truncate max-w-[200px]">{t.description}</td>
                    <td className="py-3">{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{selectedUser?.full_name || "User"}</DialogTitle>
            <DialogDescription>{selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Balance</p><p className="font-bold">${(selectedUser?.balance || 0).toLocaleString()}</p></div>
              <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Total Earnings</p><p className="font-bold">${(selectedUser?.total_earnings || 0).toLocaleString()}</p></div>
              <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Status</p><p className={`font-bold capitalize ${selectedUser?.status === "suspended" ? "text-destructive" : "text-success"}`}>{selectedUser?.status || "active"}</p></div>
              <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Joined</p><p className="font-bold text-sm">{selectedUser?.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : "—"}</p></div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setEditUserId(selectedUser.id); setEditBalanceOpen(true); }}>
                <Edit className="h-3 w-3 mr-1" /> Adjust Balance
              </Button>
              <Button size="sm" variant={selectedUser?.status === "suspended" ? "default" : "destructive"} onClick={() => handleSuspendUser(selectedUser.id, selectedUser.status || "active")}>
                {selectedUser?.status === "suspended" ? <><UserCheck className="h-3 w-3 mr-1" /> Reactivate</> : <><Ban className="h-3 w-3 mr-1" /> Suspend</>}
              </Button>
            </div>

            <h4 className="text-sm font-bold border-b pb-1">Transaction History</h4>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {userTransactions.length === 0 ? <p className="text-xs text-muted-foreground">No transactions</p> : userTransactions.map((tx) => (
                <div key={tx.id} className="flex justify-between text-xs border-b border-border py-1">
                  <div>
                    <span className="capitalize">{tx.type.replace(/_/g, " ")}</span>
                    {tx.description && <span className="text-muted-foreground ml-1">· {tx.description}</span>}
                  </div>
                  <span className={tx.amount >= 0 ? "text-success" : "text-destructive"}>${Math.abs(tx.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <h4 className="text-sm font-bold border-b pb-1">Investments</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {userInvestments.length === 0 ? <p className="text-xs text-muted-foreground">No investments</p> : userInvestments.map((inv) => (
                <div key={inv.id} className="flex justify-between text-xs border-b border-border py-1">
                  <span>{inv.plan_name} · {inv.duration_days}d</span>
                  <div className="flex gap-2 items-center">
                    <span className="font-medium">${inv.amount.toLocaleString()}</span>
                    <span className={`capitalize ${inv.status === "active" ? "text-success" : "text-muted-foreground"}`}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Balance Adjustment Dialog */}
      <Dialog open={editBalanceOpen} onOpenChange={setEditBalanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Adjust User Balance</DialogTitle>
            <DialogDescription>This creates a transaction record. Use positive values for credits and negative for debits.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Amount (+ credit, - debit)</Label><Input type="number" value={balanceAdjustment} onChange={(e) => setBalanceAdjustment(e.target.value)} placeholder="e.g. 500 or -200" /></div>
            <div><Label>Note / Reason</Label><Input value={adjustmentDescription} onChange={(e) => setAdjustmentDescription(e.target.value)} placeholder="e.g. Trading profit, Refund" /></div>
            <Button className="w-full" onClick={handleBalanceEdit}>Apply Adjustment</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* End Investment Dialog */}
      <Dialog open={endInvestOpen} onOpenChange={setEndInvestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">End Investment</DialogTitle>
            <DialogDescription>
              Ending {endInvestData?.plan_name} — Original: ${endInvestData?.amount?.toLocaleString()}. Enter the amount to credit the user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Credit Amount (USD)</Label><Input type="number" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="e.g. 1500" /></div>
            <Button className="w-full" onClick={handleEndInvestment}>End & Credit User</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

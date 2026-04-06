import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  CheckCircle,
  Clock,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { WithdrawalMethod } from "../backend.d";
import { WithdrawalStatus } from "../backend.d";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useActor } from "../hooks/useActor";

export default function WalletPage() {
  const { actor } = useActor();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["myProfile"],
    queryFn: () => actor!.getCallerUserProfile(),
    enabled: !!actor,
  });

  const { data: withdrawals } = useQuery({
    queryKey: ["myWithdrawals"],
    queryFn: () => actor!.getAllWithdrawals(),
    enabled: !!actor,
  });

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"upi" | "bank">("upi");
  const [upi, setUpi] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const withdrawMut = useMutation({
    mutationFn: async () => {
      const amtPaise = Math.round(Number.parseFloat(amount) * 100);
      if (Number.isNaN(amtPaise) || amtPaise < 10000)
        throw new Error("Minimum withdrawal is ₹100");
      const wMethod: WithdrawalMethod =
        method === "upi"
          ? { __kind__: "upi", upi }
          : { __kind__: "bank", bank: { ifsc, accountNumber } };
      await actor!.requestWithdrawal(BigInt(amtPaise), wMethod);
    },
    onSuccess: () => {
      toast.success("Withdrawal requested! Admin will review within 24 hours.");
      setAmount("");
      setUpi("");
      setIfsc("");
      setAccountNumber("");
      qc.invalidateQueries({ queryKey: ["myWithdrawals", "myProfile"] });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Request failed";
      toast.error(msg);
    },
  });

  const balance = Number(profile?.walletBalance ?? 0) / 100;
  const totalEarned = Number(profile?.totalEarnings ?? 0) / 100;
  const withdrawn =
    withdrawals
      ?.filter((w) => w.status === WithdrawalStatus.approved)
      .reduce((s, w) => s + Number(w.amount), 0) ?? 0;

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Wallet</h2>

      <div className="grid grid-cols-1 gap-3 mb-6">
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Wallet size={24} className="text-purple-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Available Balance</p>
            <p className="text-3xl font-bold text-white">
              ₹{balance.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-green-400" />
              <span className="text-xs text-gray-400">Total Earned</span>
            </div>
            <p className="text-xl font-bold text-green-400">
              ₹{totalEarned.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownToLine size={16} className="text-blue-400" />
              <span className="text-xs text-gray-400">Withdrawn</span>
            </div>
            <p className="text-xl font-bold text-blue-400">
              ₹{(withdrawn / 100).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6">
        <h3 className="font-semibold text-white mb-2">How you earn</h3>
        <div className="space-y-1 text-sm text-gray-400">
          <p>• ₹10 per 1,000 unique video views</p>
          <p>• Bonus rewards for viral content (10k+ views)</p>
          <p>• Earn from rewarded ads</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
        <h3 className="font-semibold text-white mb-4">Request Withdrawal</h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="withdraw-amount"
              className="block text-sm text-gray-400 mb-1"
            >
              Amount (₹) <span className="text-gray-600">min ₹100</span>
            </label>
            <Input
              id="withdraw-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              min="100"
              placeholder="Enter amount"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="flex gap-2">
            {(["upi", "bank"] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMethod(m)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${method === m ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
          {method === "upi" ? (
            <Input
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              placeholder="UPI ID (e.g. name@upi)"
              className="bg-gray-800 border-gray-700 text-white"
            />
          ) : (
            <div className="space-y-2">
              <Input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Account Number"
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Input
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value)}
                placeholder="IFSC Code"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          )}
          <Button
            type="button"
            onClick={() => withdrawMut.mutate()}
            disabled={
              withdrawMut.isPending ||
              !amount ||
              (method === "upi" ? !upi : !accountNumber || !ifsc)
            }
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-xl"
          >
            {withdrawMut.isPending ? "Submitting..." : "Request Withdrawal"}
          </Button>
        </div>
      </div>

      {withdrawals && withdrawals.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-3">Withdrawal History</h3>
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div
                key={w.id.toString()}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {w.status === WithdrawalStatus.approved ? (
                    <CheckCircle size={16} className="text-green-400" />
                  ) : w.status === WithdrawalStatus.rejected ? (
                    <XCircle size={16} className="text-red-400" />
                  ) : (
                    <Clock size={16} className="text-yellow-400" />
                  )}
                  <div>
                    <p className="text-sm text-white">
                      ₹{(Number(w.amount) / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {w.status}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-600">
                  {w.method.__kind__.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

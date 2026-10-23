import React, { useState } from "react";
import { Loan } from "@/types/loan";
import { Person } from "@/types/person";
import { Settings } from "@/types/settings";
import { formatMoney } from "@/utils/currency";
import { formatShortDate, getToday } from "@/utils/dates";
import { 
  ArrowLeft, 
  Check, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  FileText,
  CreditCard,
  FileCheck
} from "lucide-react";

interface LoanDetailViewProps {
  loan: Loan;
  person: Person;
  settings: Settings;
  onBack: () => void;
  onSettleLoan: () => void;
  onRecordRepayment: () => void;
  onDeleteLoan: (loanId: string) => void;
  onDeleteRepayment: (loanId: string, repaymentId: string) => void;
}

export const LoanDetailView: React.FC<LoanDetailViewProps> = ({
  loan,
  person,
  settings,
  onBack,
  onSettleLoan,
  onRecordRepayment,
  onDeleteLoan,
  onDeleteRepayment,
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deletingRepaymentId, setDeletingRepaymentId] = useState<string | null>(null);

  const todayStr = getToday();
  const isLent = loan.direction === "lent";

  // Calculations
  const totalRepaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0);
  const remainingBalance = Math.max(0, loan.amount - totalRepaid);
  const isSettled = remainingBalance === 0;
  const isOverdue = loan.dueDate && loan.dueDate < todayStr && !isSettled;

  const progressPercent = loan.amount > 0
    ? Math.min(100, Math.round((totalRepaid / loan.amount) * 100))
    : isSettled ? 100 : 0;

  // Chronologically sort repayments (most recent first)
  const sortedRepayments = [...loan.repayments].sort((a, b) => b.date.localeCompare(a.date));

  const loanTitle = loan.description?.trim() || (isLent ? "Money Lent" : "Money Borrowed");

  return (
    <div className="space-y-4 animate-in fade-in duration-200 max-w-6xl mx-auto pb-14">
      {/* 1. Header with Back Button, Loan Title & Subtitle */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1F2937]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[#121820] hover:bg-[#1E293B] border border-[#1F2937] flex items-center justify-center text-[#F5F5F5] transition cursor-pointer active:scale-95 shrink-0"
            title="Back to Person Profile"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#F5F5F5] truncate tracking-tight">
              {loanTitle}
            </h1>
            <p className="text-xs text-[#8E8E93] flex items-center gap-1.5 truncate">
              <span className={`font-bold ${isLent ? "text-rose-400" : "text-emerald-400"}`}>
                {isLent ? "Lent" : "Borrowed"}
              </span>
              <span>·</span>
              <span className="text-[#D4D4D8]">{person.name}</span>
            </p>
          </div>
        </div>

        {/* Delete Loan Button */}
        {isConfirmingDelete ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onDeleteLoan(loan.id)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer"
            >
              Confirm Delete
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(true)}
            className="w-9 h-9 rounded-full bg-[#121820] hover:bg-rose-500/10 hover:text-rose-400 border border-[#1F2937] flex items-center justify-center text-[#71717A] transition cursor-pointer shrink-0"
            title="Delete this loan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Responsive Layout: 12-column Grid on Desktop (PC), Stack on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        {/* Left Column: Metric Cards, Progress Bar, Action Buttons, Loan Details Card */}
        <div className="lg:col-span-5 space-y-4">
          {/* 3 Metric Cards (Screen 3): Total | Repaid | Remaining */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* Total */}
            <div className="rounded-2xl bg-[#0F1720] border border-[#1E293B] p-3 sm:p-4 text-center space-y-1 shadow-sm">
              <span className="text-[10px] sm:text-[11px] text-[#8E8E93] uppercase font-bold tracking-wider block">
                Total
              </span>
              <div className="text-sm sm:text-lg font-extrabold font-mono-num text-[#F5F5F5] truncate">
                {formatMoney(loan.amount, settings.currency, settings.numberFormat)}
              </div>
            </div>

            {/* Repaid */}
            <div className="rounded-2xl bg-[#0F1720] border border-[#1E293B] p-3 sm:p-4 text-center space-y-1 shadow-sm">
              <span className="text-[10px] sm:text-[11px] text-[#8E8E93] uppercase font-bold tracking-wider block">
                Repaid
              </span>
              <div className="text-sm sm:text-lg font-extrabold font-mono-num text-emerald-400 truncate">
                {formatMoney(totalRepaid, settings.currency, settings.numberFormat)}
              </div>
            </div>

            {/* Remaining */}
            <div className="rounded-2xl bg-[#0F1720] border border-[#1E293B] p-3 sm:p-4 text-center space-y-1 shadow-sm">
              <span className="text-[10px] sm:text-[11px] text-[#8E8E93] uppercase font-bold tracking-wider block">
                Remaining
              </span>
              <div
                className={`text-sm sm:text-lg font-extrabold font-mono-num truncate ${
                  isSettled ? "text-neutral-400" : "text-rose-400"
                }`}
              >
                {isSettled
                  ? formatMoney(0, settings.currency, settings.numberFormat)
                  : formatMoney(remainingBalance, settings.currency, settings.numberFormat)}
              </div>
            </div>
          </div>

          {/* Progress Bar (Screen 3) */}
          <div className="rounded-2xl bg-[#0F1720] border border-[#1E293B] p-4 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8E8E93] font-medium font-mono-num">
                {progressPercent}% repaid
              </span>
              <span className="font-mono-num text-xs text-[#8E8E93]">
                {formatMoney(totalRepaid, settings.currency, settings.numberFormat)} / {formatMoney(loan.amount, settings.currency, settings.numberFormat)}
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-[#1A2332] overflow-hidden">
              <div
                style={{ width: `${progressPercent}%` }}
                className={`h-full rounded-full transition-all duration-300 ${
                  isSettled
                    ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                    : "bg-emerald-500"
                }`}
              />
            </div>
          </div>

          {/* Action Buttons: Settle Loan (Primary) & + Record Repayment (Screen 3) */}
          {!isSettled ? (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onSettleLoan}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-black font-bold text-sm transition shadow-lg shadow-emerald-950/20 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Settle Loan</span>
              </button>

              <button
                type="button"
                onClick={onRecordRepayment}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#121820] hover:bg-[#1E293B] text-white border border-[#1E293B] font-semibold text-sm transition active:scale-[0.99] cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5] text-emerald-400" />
                <span>Record Repayment</span>
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>This loan is fully settled and cleared!</span>
            </div>
          )}

          {/* Loan Details Block (Screen 3) */}
          <div className="rounded-2xl bg-[#0F1720] border border-[#1E293B] p-4 sm:p-5 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-[#F5F5F5] tracking-tight">
              Loan Details
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#1A2332]">
                <span className="text-[#8E8E93]">Loan Date</span>
                <span className="font-semibold text-[#F5F5F5] font-mono-num">
                  {formatShortDate(loan.date)}
                </span>
              </div>

              {loan.dueDate && (
                <div className="flex items-center justify-between py-1 border-b border-[#1A2332]">
                  <span className="text-[#8E8E93]">Due Date</span>
                  <span className={`font-semibold font-mono-num ${isOverdue ? "text-rose-400" : "text-[#F5F5F5]"}`}>
                    {formatShortDate(loan.dueDate)} {isOverdue && "(Overdue)"}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-1 border-b border-[#1A2332]">
                <span className="text-[#8E8E93]">Payment Method</span>
                <span className="px-2 py-0.5 rounded bg-[#1A2332] text-[#F5F5F5] font-mono-num text-[11px] uppercase font-bold">
                  {loan.repayments[0]?.note?.includes("UPI") ? "UPI" : "Standard"}
                </span>
              </div>

              {loan.description && (
                <div className="flex items-start justify-between py-1">
                  <span className="text-[#8E8E93] shrink-0 pr-2">Notes</span>
                  <span className="font-medium text-[#D4D4D8] text-right truncate">
                    {loan.description}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Repayment History Timeline (Screens 3 & 7) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-[#F5F5F5] tracking-tight">
              Repayment History
            </h2>
            <span className="text-xs text-[#8E8E93] font-mono-num">
              {sortedRepayments.length} {sortedRepayments.length === 1 ? "installment" : "installments"}
            </span>
          </div>

          <div className="rounded-2xl bg-[#0F1720] border border-[#1E293B] overflow-hidden divide-y divide-[#1A2332] shadow-sm">
            {/* 1. Installment events */}
            {sortedRepayments.map((rep) => (
              <div
                key={rep.id}
                className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-[#15202E] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="text-xs sm:text-sm font-bold text-[#F5F5F5]">
                      Repayment received
                    </div>
                    <div className="text-xs text-[#8E8E93] font-mono-num flex items-center gap-1.5 truncate">
                      <span>{formatShortDate(rep.date)}</span>
                      <span>·</span>
                      <span>{rep.note || "Installment"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-sm font-bold font-mono-num text-emerald-400">
                    +{formatMoney(rep.amount, settings.currency, settings.numberFormat)}
                  </div>

                  {deletingRepaymentId === rep.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteRepayment(loan.id, rep.id);
                          setDeletingRepaymentId(null);
                        }}
                        className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingRepaymentId(null)}
                        className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeletingRepaymentId(rep.id)}
                      className="p-1 rounded text-[#71717A] hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Delete installment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* 2. Original 'Loan created' event (Screens 3 & 7) */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 bg-[#0B1017]">
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                <div className="w-8 h-8 rounded-full bg-[#1A2332] border border-[#2A374A] flex items-center justify-center text-[#8E8E93] shrink-0">
                  <FileCheck className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="text-xs sm:text-sm font-semibold text-[#A1A1AA]">
                    Loan created
                  </div>
                  <div className="text-xs text-[#71717A] font-mono-num truncate">
                    {formatShortDate(loan.date)} · Initial principal
                  </div>
                </div>
              </div>

              <div className="text-sm font-bold font-mono-num text-[#A1A1AA] shrink-0">
                {formatMoney(loan.amount, settings.currency, settings.numberFormat)}
              </div>
            </div>
          </div>

          {/* Bottom Summary Banner (Screen 7) */}
          <div className="p-3.5 rounded-xl bg-[#0F1720] border border-[#1E293B] text-center text-xs text-[#8E8E93] font-mono-num">
            This loan is <strong className="text-[#F5F5F5]">{progressPercent}% repaid</strong>.{" "}
            <strong className={isSettled ? "text-emerald-400" : "text-rose-400"}>
              {formatMoney(remainingBalance, settings.currency, settings.numberFormat)} remaining
            </strong>.
          </div>
        </div>
      </div>
    </div>
  );
};

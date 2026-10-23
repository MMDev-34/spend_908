import React, { useMemo } from "react";
import { Loan } from "@/types/loan";
import { Person } from "@/types/person";
import { Settings } from "@/types/settings";
import { formatMoney } from "@/utils/currency";
import { formatShortDate, getToday } from "@/utils/dates";
import { getAvatarColors, getInitials } from "@/utils/avatarUtils";
import { 
  ArrowLeft, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ChevronRight,
  MoreVertical,
  Calendar,
  AlertCircle
} from "lucide-react";

interface PersonProfileViewProps {
  person: Person;
  loans: Loan[];
  settings: Settings;
  onBack: () => void;
  onOpenNewTransaction: () => void;
  onOpenLoan: (loanId: string) => void;
}

export const PersonProfileView: React.FC<PersonProfileViewProps> = ({
  person,
  loans,
  settings,
  onBack,
  onOpenNewTransaction,
  onOpenLoan,
}) => {
  const avatarColors = getAvatarColors(person.name);
  const initials = getInitials(person.name);
  const todayStr = getToday();

  // Aggregate active lents and active borrows
  const lentLoans = useMemo(() => loans.filter((l) => l.direction === "lent"), [loans]);
  const borrowedLoans = useMemo(() => loans.filter((l) => l.direction === "borrowed"), [loans]);

  const activeLents = useMemo(() => {
    return lentLoans.filter((l) => {
      const repaid = l.repayments.reduce((sum, r) => sum + r.amount, 0);
      return l.amount - repaid > 0;
    });
  }, [lentLoans]);

  const activeBorrows = useMemo(() => {
    return borrowedLoans.filter((l) => {
      const repaid = l.repayments.reduce((sum, r) => sum + r.amount, 0);
      return l.amount - repaid > 0;
    });
  }, [borrowedLoans]);

  const totalLentOriginal = useMemo(() => lentLoans.reduce((sum, l) => sum + l.amount, 0), [lentLoans]);
  const totalLentRemaining = useMemo(() => {
    return activeLents.reduce((sum, l) => {
      const repaid = l.repayments.reduce((rSum, r) => rSum + r.amount, 0);
      return sum + Math.max(0, l.amount - repaid);
    }, 0);
  }, [activeLents]);

  const totalBorrowedOriginal = useMemo(() => borrowedLoans.reduce((sum, l) => sum + l.amount, 0), [borrowedLoans]);
  const totalBorrowedRemaining = useMemo(() => {
    return activeBorrows.reduce((sum, l) => {
      const repaid = l.repayments.reduce((rSum, r) => rSum + r.amount, 0);
      return sum + Math.max(0, l.amount - repaid);
    }, 0);
  }, [activeBorrows]);

  // Net Balance & Narrative (matching Screens 2 & 8)
  const netRemaining = totalLentRemaining - totalBorrowedRemaining;
  const isSettled = totalLentRemaining === 0 && totalBorrowedRemaining === 0;

  // Derive natural conversational statement (e.g. "Rahul owes you ₹3,000 more than you owe him.")
  const narrative = useMemo(() => {
    const firstName = person.name.split(" ")[0];
    if (isSettled) {
      return `All accounts with ${firstName} are fully settled.`;
    }
    if (netRemaining > 0) {
      const diffFormatted = formatMoney(netRemaining, settings.currency, settings.numberFormat);
      return `${firstName} owes you ${diffFormatted} more than you owe ${firstName}.`;
    }
    const diffFormatted = formatMoney(Math.abs(netRemaining), settings.currency, settings.numberFormat);
    return `You owe ${firstName} ${diffFormatted} more than ${firstName} owes you.`;
  }, [isSettled, netRemaining, person.name, settings.currency, settings.numberFormat]);

  // Chronologically sort loans (most recent first)
  const sortedLoans = useMemo(() => {
    return [...loans].sort((a, b) => b.date.localeCompare(a.date));
  }, [loans]);

  const addedDate = person.createdAt
    ? formatShortDate(person.createdAt.split("T")[0])
    : "Recently";

  return (
    <div className="space-y-4 animate-in fade-in duration-200 max-w-6xl mx-auto pb-14">
      {/* 1. Header with Back button, Avatar, Name & Options */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1F2937]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[#121820] hover:bg-[#1E293B] border border-[#1F2937] flex items-center justify-center text-[#F5F5F5] transition cursor-pointer active:scale-95 shrink-0"
            title="Back to Borrow & Lend"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${avatarColors.bg} ${avatarColors.text}`}
          >
            {initials}
          </div>

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#F5F5F5] truncate tracking-tight">
              {person.name}
            </h1>
            <p className="text-xs text-[#8E8E93]">Added on {addedDate}</p>
          </div>
        </div>

        <button
          type="button"
          className="w-9 h-9 rounded-full bg-[#121820] hover:bg-[#1E293B] border border-[#1F2937] flex items-center justify-center text-[#8E8E93] hover:text-[#F5F5F5] transition cursor-pointer shrink-0"
          title="More options"
          aria-label="More options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Responsive Layout: 12-column Grid on Desktop (PC), Stack on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        {/* Left Column: Quick Action, Active Cards, Net Balance Hero */}
        <div className="lg:col-span-5 space-y-4">
          {/* Button below name to initiate a new transaction */}
          <button
            type="button"
            onClick={onOpenNewTransaction}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-black font-bold text-sm transition shadow-lg shadow-emerald-950/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Transaction</span>
          </button>

          {/* Two Distinct Cards: 'Active Lents' and 'Active Borrows' */}
          <div className="grid grid-cols-2 gap-3 select-none">
            {/* Active Lents Card */}
            <div className="rounded-2xl bg-[#0F1720] border border-[#1E293B] p-3.5 sm:p-4 flex flex-col justify-between space-y-2 shadow-sm">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                </span>
                <span className="text-xs font-bold truncate">Active Lents</span>
              </div>

              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-[#F5F5F5]">
                  {activeLents.length} {activeLents.length === 1 ? "loan" : "loans"}
                </div>
                <div className="text-[11px] text-[#8E8E93] font-mono-num">
                  {formatMoney(totalLentOriginal, settings.currency, settings.numberFormat)} original
                </div>
                <div className="text-xs sm:text-sm font-bold font-mono-num text-emerald-400">
                  {formatMoney(totalLentRemaining, settings.currency, settings.numberFormat)} remaining
                </div>
              </div>
            </div>

            {/* Active Borrows Card */}
            <div className="rounded-2xl bg-[#0F1720] border border-[#1E293B] p-3.5 sm:p-4 flex flex-col justify-between space-y-2 shadow-sm">
              <div className="flex items-center gap-1.5 text-rose-400">
                <span className="w-5 h-5 rounded-full bg-rose-500/15 flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="w-3 h-3 stroke-[2.5]" />
                </span>
                <span className="text-xs font-bold truncate">Active Borrows</span>
              </div>

              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-[#F5F5F5]">
                  {activeBorrows.length} {activeBorrows.length === 1 ? "loan" : "loans"}
                </div>
                <div className="text-[11px] text-[#8E8E93] font-mono-num">
                  {formatMoney(totalBorrowedOriginal, settings.currency, settings.numberFormat)} original
                </div>
                <div className="text-xs sm:text-sm font-bold font-mono-num text-rose-400">
                  {formatMoney(totalBorrowedRemaining, settings.currency, settings.numberFormat)} remaining
                </div>
              </div>
            </div>
          </div>

          {/* Net Balance Section (Screens 2 & 8) */}
          <div className="rounded-2xl bg-[#0F1720] border border-[#1E293B] p-4 sm:p-5 space-y-3.5 shadow-sm">
            <div>
              <span className="text-xs text-[#8E8E93] font-semibold uppercase tracking-wider block">
                Net balance
              </span>
              <div
                className={`text-2xl sm:text-3xl font-extrabold font-mono-num mt-1 tracking-tight ${
                  isSettled
                    ? "text-neutral-400"
                    : netRemaining > 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {isSettled
                  ? formatMoney(0, settings.currency, settings.numberFormat)
                  : netRemaining > 0
                  ? `+${formatMoney(netRemaining, settings.currency, settings.numberFormat)}`
                  : `-${formatMoney(Math.abs(netRemaining), settings.currency, settings.numberFormat)}`}
              </div>
              <p className="text-xs text-[#8E8E93] mt-1.5 leading-relaxed">
                {narrative}
              </p>
            </div>

            {/* Bilateral Breakdown: They owe you vs You owe them */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1E293B]">
              <div>
                <span className="text-[11px] text-[#8E8E93] font-medium block">They owe you</span>
                <div className="text-sm sm:text-base font-bold font-mono-num text-emerald-400 mt-0.5">
                  {formatMoney(totalLentRemaining, settings.currency, settings.numberFormat)}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-[#8E8E93] font-medium block">You owe them</span>
                <div className="text-sm sm:text-base font-bold font-mono-num text-rose-400 mt-0.5">
                  {formatMoney(totalBorrowedRemaining, settings.currency, settings.numberFormat)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Transactions List (Matching Screen 2 & 8) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-[#F5F5F5] tracking-tight">
              Transactions
            </h2>
            <span className="text-xs text-[#8E8E93] font-mono-num">
              {sortedLoans.length} {sortedLoans.length === 1 ? "entry" : "entries"}
            </span>
          </div>

          {sortedLoans.length === 0 ? (
            <div className="rounded-2xl bg-[#0F1720] border border-[#1E293B] p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-[#F5F5F5]">No transactions recorded yet</p>
              <p className="text-xs text-[#8E8E93]">
                Tap &quot;New Transaction&quot; to log your first loan with {person.name}.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#0F1720] border border-[#1E293B] overflow-hidden divide-y divide-[#1A2332] shadow-sm">
              {sortedLoans.map((loan) => {
                const repaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0);
                const remaining = Math.max(0, loan.amount - repaid);
                const isLoanSettled = remaining === 0;
                const isLent = loan.direction === "lent";
                const isOverdue = loan.dueDate && loan.dueDate < todayStr && !isLoanSettled;

                // Status text (Settled, Remaining ₹X, 2 Repayments, To Receive, To Repay)
                let statusText = "Active";
                if (isLoanSettled) {
                  statusText = "Settled";
                } else if (repaid > 0) {
                  statusText = `Remaining ${formatMoney(remaining, settings.currency, settings.numberFormat)}`;
                } else if (isLent) {
                  statusText = "To Receive";
                } else {
                  statusText = "To Repay";
                }

                if (loan.repayments.length > 0 && !isLoanSettled) {
                  statusText += ` · ${loan.repayments.length} ${loan.repayments.length === 1 ? "repayment" : "repayments"}`;
                }

                return (
                  <div
                    key={loan.id}
                    onClick={() => onOpenLoan(loan.id)}
                    className="group flex items-center justify-between p-3.5 sm:p-4 hover:bg-[#15202E] transition-colors cursor-pointer select-none"
                  >
                    {/* Left: Direction Icon + Date + Status */}
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                      {/* Circular direction icon (Red for Lent, Green for Borrowed) */}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                          isLent
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/25"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                        }`}
                      >
                        {isLent ? (
                          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-bold ${
                              isLent ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {isLent ? "Lent" : "Borrowed"}
                          </span>
                          <span className="text-xs text-[#8E8E93]">·</span>
                          <span className="text-xs text-[#A1A1AA] font-mono-num flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#71717A]" />
                            <span>{formatShortDate(loan.date)}</span>
                          </span>

                          {isOverdue && (
                            <span className="text-[10px] text-rose-400 bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                              <AlertCircle className="w-3 h-3" />
                              <span>Overdue</span>
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-[#8E8E93] flex items-center gap-1.5 truncate">
                          <span className={isLoanSettled ? "text-emerald-400 font-medium" : ""}>
                            {statusText}
                          </span>
                          {loan.description && (
                            <>
                              <span className="text-[#52525B]">·</span>
                              <span className="truncate text-[#D4D4D8]">{loan.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Chevron */}
                    <div className="flex items-center gap-2.5 shrink-0 text-right">
                      <div className="text-sm sm:text-base font-bold font-mono-num text-[#F5F5F5]">
                        {formatMoney(loan.amount, settings.currency, settings.numberFormat)}
                      </div>
                      <div className="text-[#71717A] group-hover:text-white transition-colors">
                        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

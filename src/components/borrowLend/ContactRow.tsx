import React from "react";
import { Loan } from "@/types/loan";
import { Person } from "@/types/person";
import { Settings } from "@/types/settings";
import { formatMoney } from "@/utils/currency";
import { formatShortDate, getToday } from "@/utils/dates";
import { getAvatarColors, getInitials } from "@/utils/avatarUtils";
import { ChevronRight } from "lucide-react";

export interface ContactLedger {
  person: Person;
  loans: Loan[];
  lentRemaining: number;
  borrowedRemaining: number;
  netRemaining: number;
  isSettled: boolean;
  totalLent: number;
  totalBorrowed: number;
  totalRepaid: number;
}

interface ContactRowProps {
  ledger: ContactLedger;
  settings: Settings;
  onOpenDetails: (person: Person) => void;
}

export const ContactRow: React.FC<ContactRowProps> = ({
  ledger,
  settings,
  onOpenDetails,
}) => {
  const { person, loans, netRemaining, isSettled, totalRepaid } = ledger;
  const avatarColors = getAvatarColors(person.name);
  const initials = getInitials(person.name);
  const todayStr = getToday();

  // Find most pressing due date among unpaid loans
  const unpaidLoans = loans.filter((l) => {
    const repaid = l.repayments.reduce((sum, r) => sum + r.amount, 0);
    return l.amount - repaid > 0;
  });

  const overdueLoan = unpaidLoans.find((l) => l.dueDate && l.dueDate < todayStr);
  const nextDueLoan = unpaidLoans
    .filter((l) => l.dueDate && l.dueDate >= todayStr)
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))[0];

  // Derive Subtitle (e.g. "Lent · Due Oct 28", "Borrowed · Due Oct 25", "Lent · Partially repaid")
  let directionLabel = "Lent";
  if (isSettled) {
    directionLabel = "Settled";
  } else if (netRemaining < 0) {
    directionLabel = "Borrowed";
  }

  let statusLabel = "";
  if (isSettled) {
    statusLabel = "All cleared";
  } else if (overdueLoan && overdueLoan.dueDate) {
    statusLabel = `Overdue ${formatShortDate(overdueLoan.dueDate)}`;
  } else if (nextDueLoan && nextDueLoan.dueDate) {
    statusLabel = `Due ${formatShortDate(nextDueLoan.dueDate)}`;
  } else if (totalRepaid > 0) {
    statusLabel = "Partially repaid";
  } else if (loans.length > 1) {
    statusLabel = `${loans.length} records`;
  } else if (loans[0]?.date) {
    statusLabel = formatShortDate(loans[0].date);
  } else {
    statusLabel = "Active";
  }

  // Derive Right Subtext ("To receive", "To repay", "Remaining", "Settled")
  let amountSubtext = "To receive";
  if (isSettled) {
    amountSubtext = "Settled";
  } else if (totalRepaid > 0) {
    amountSubtext = "Remaining";
  } else if (netRemaining < 0) {
    amountSubtext = "To repay";
  }

  const isOverdue = !!overdueLoan && !isSettled;

  return (
    <div
      onClick={() => onOpenDetails(person)}
      className="group flex items-center justify-between p-3.5 sm:p-4 hover:bg-[#15202E] transition-colors cursor-pointer select-none border-b border-[#1A2332] last:border-b-0"
    >
      {/* Left: Avatar + Name + Direction / Due status */}
      <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1 pr-3">
        {/* Soft pastel circular avatar */}
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105 ${avatarColors.bg} ${avatarColors.text}`}
        >
          {initials}
        </div>

        {/* Identity & Subtitle */}
        <div className="min-w-0 flex-1">
          <div className="text-sm sm:text-base font-bold text-[#F5F5F5] truncate group-hover:text-white transition-colors">
            {person.name}
          </div>

          <div className="text-xs text-[#8E8E93] truncate mt-0.5 flex items-center gap-1">
            <span>{directionLabel} · </span>
            <span className={isOverdue ? "text-rose-400 font-semibold" : ""}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Amount + Context Label + Chevron */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 text-right">
        <div>
          <div
            className={`text-sm sm:text-base font-bold font-mono-num leading-tight ${
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
              ? formatMoney(netRemaining, settings.currency, settings.numberFormat)
              : formatMoney(Math.abs(netRemaining), settings.currency, settings.numberFormat)}
          </div>
          <div className="text-[11px] text-[#8E8E93] font-medium mt-0.5">
            {amountSubtext}
          </div>
        </div>

        {/* Chevron arrow */}
        <div className="text-neutral-500 group-hover:text-neutral-300 transition-colors pl-1">
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useAppStore } from "@/stores/appStore";
import { TransactionType } from "@/types/transaction";
import { parseMoneyInput, minorUnitsToInputString } from "@/utils/currency";
import { getToday, formatDateButtonLabel } from "@/utils/dates";
import { X, Calendar, FileText, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

export const AddTransactionModal: React.FC = () => {
  const isAddModalOpen = useUIStore((s) => s.isAddModalOpen);
  const initialType = useUIStore((s) => s.addModalInitialType);
  const prefill = useUIStore((s) => s.addModalPrefill);
  const closeAddModal = useUIStore((s) => s.closeAddModal);
  const showToast = useUIStore((s) => s.showToast);

  const categories = useAppStore((s) => s.categories);
  const settings = useAppStore((s) => s.settings);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const updateTransaction = useAppStore((s) => s.updateTransaction);

  const [type, setType] = useState<TransactionType>(initialType);
  const [amountStr, setAmountStr] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [date, setDate] = useState<string>(getToday());
  const [note, setNote] = useState<string>("");
  const [isUnwanted, setIsUnwanted] = useState<boolean>(false);
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const amountInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Formats date into DD/MM/YY (e.g. 07/10/26)
  const formatDDMMYY = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length < 3) return dateStr;
    const [y, m, d] = parts;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y.slice(-2)}`;
  };

  // Sync state when opening modal or prefilling
  useEffect(() => {
    if (isAddModalOpen) {
      if (prefill) {
        setType(prefill.type || initialType);
        setAmountStr(prefill.amount ? minorUnitsToInputString(prefill.amount) : "");
        setSelectedCategoryId(prefill.categoryId || "");
        setDate(prefill.date || getToday());
        setNote(prefill.note || "");
        setIsUnwanted(prefill.isUnwanted || false);
        setShowNoteInput(!!prefill.note);
      } else {
        setType(initialType);
        setAmountStr("");
        setDate(getToday());
        setNote("");
        setIsUnwanted(false);
        setShowNoteInput(false);

        // Preselect last-used category for this type
        const filtered = categories.filter((c) => c.type === initialType || c.type === "both");
        const defaultCat = filtered[0]?.id || "";
        setSelectedCategoryId(defaultCat);
      }
      setError("");

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          closeAddModal();
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      // Focus amount input automatically after open animation
      const timer = setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      }, 50);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isAddModalOpen, initialType, prefill, categories, closeAddModal]);

  // When type changes, ensure valid category is selected
  const changeDateByDays = (deltaDays: number) => {
    try {
      const baseDate = date ? new Date(date + "T00:00:00") : new Date();
      if (isNaN(baseDate.getTime())) {
        setDate(getToday());
        return;
      }
      baseDate.setDate(baseDate.getDate() + deltaDays);
      const year = baseDate.getFullYear();
      const month = String(baseDate.getMonth() + 1).padStart(2, "0");
      const day = String(baseDate.getDate()).padStart(2, "0");
      const targetDate = `${year}-${month}-${day}`;
      const today = getToday();
      if (targetDate > today) {
        setDate(today);
      } else {
        setDate(targetDate);
      }
    } catch {
      setDate(getToday());
    }
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const validCats = categories.filter((c) => c.type === newType || c.type === "both");
    if (!validCats.some((c) => c.id === selectedCategoryId)) {
      setSelectedCategoryId(validCats[0]?.id || "");
    }
    if (newType === "income") {
      setIsUnwanted(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const minorUnits = parseMoneyInput(amountStr);

    if (minorUnits <= 0) {
      setError("Please enter a valid amount greater than 0");
      amountInputRef.current?.focus();
      return;
    }

    if (!selectedCategoryId) {
      setError("Please choose a category");
      return;
    }

    if (date > getToday()) {
      setError("Transaction date cannot be in the future");
      return;
    }

    if (prefill && prefill.id) {
      // Editing existing transaction
      updateTransaction(prefill.id, {
        type,
        amount: minorUnits,
        categoryId: selectedCategoryId,
        date,
        note: note.trim() || undefined,
        paymentMethod: prefill.paymentMethod || settings.defaultPaymentMethod || "upi",
        isUnwanted: type === "expense" ? isUnwanted : undefined,
      });
      showToast(date > getToday() ? "Future payment updated" : "Transaction updated");
    } else {
      // Adding new transaction
      addTransaction({
        type,
        amount: minorUnits,
        categoryId: selectedCategoryId,
        date,
        note: note.trim() || undefined,
        paymentMethod: settings.defaultPaymentMethod || "upi",
        isUnwanted: type === "expense" ? isUnwanted : undefined,
      });
      if (date > getToday()) {
        showToast("Future payment recorded under Future Payments");
      } else {
        showToast(type === "expense" ? "Expense added" : "Income added");
      }
    }

    if (settings.hapticFeedback !== false && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(20);
    }

    closeAddModal();
  };

  if (!isAddModalOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === type || c.type === "both");

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAddModal();
      }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-lg bg-[#141414] border-t sm:border border-[#262626] rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-250"
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-[#262626] rounded-full" />
        </div>

        {/* Header: Title & Close */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#262626]">
          <h2 id="modal-title" className="text-base font-semibold text-[#F5F5F5]">
            {prefill?.id ? "Edit Transaction" : "New Transaction"}
          </h2>
          <button
            onClick={closeAddModal}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-[#F5F5F5] hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Segmented Type Toggle: Expense | Income */}
          <div className="flex p-1 bg-[#1C1C1C] rounded-xl border border-[#262626]">
            <button
              type="button"
              onClick={() => handleTypeChange("expense")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                type === "expense"
                  ? "bg-[#262626] text-rose-400 shadow-sm"
                  : "text-[#71717A] hover:text-[#F5F5F5]"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("income")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                type === "income"
                  ? "bg-[#262626] text-emerald-400 shadow-sm"
                  : "text-[#71717A] hover:text-[#F5F5F5]"
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount Input & Quick Payments Bar */}
          <div className="bg-[#1C1C1C] border border-[#262626] rounded-2xl p-3 sm:p-3.5 space-y-2.5 focus-within:border-emerald-500/50 transition">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-[#A1A1AA] select-none font-mono-num">
                {settings.currency}
              </span>
              <input
                ref={amountInputRef}
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  if (error) setError("");
                }}
                className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-[#F5F5F5] outline-none placeholder-[#71717A] font-mono-num"
                aria-label="Amount"
                autoComplete="off"
              />
              {amountStr && (
                <button
                  type="button"
                  onClick={() => {
                    setAmountStr("");
                    if (error) setError("");
                    amountInputRef.current?.focus();
                  }}
                  className="px-2 py-1 rounded-lg text-[11px] font-semibold text-[#A1A1AA] hover:text-[#F5F5F5] bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition cursor-pointer shrink-0 flex items-center gap-1 active:scale-95"
                  title="Clear amount"
                  aria-label="Clear amount"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Quick Amounts (50, 100, 200, 500) */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-[#262626]">
              <span className="text-[10px] text-[#71717A] font-semibold uppercase tracking-wider shrink-0 mr-0.5">
                Quick
              </span>
              {[50, 100, 200, 500].map((val) => {
                const isExactMatch = amountStr === val.toString();
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      const currentMajor = Math.floor(parseMoneyInput(amountStr) / 100);
                      if (currentMajor === 0) {
                        setAmountStr(val.toString());
                      } else {
                        setAmountStr((currentMajor + val).toString());
                      }
                      if (error) setError("");
                    }}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold font-mono-num transition cursor-pointer active:scale-95 text-center border ${
                      isExactMatch
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm"
                        : "bg-[#141414] text-[#A1A1AA] border-[#2A2A2A] hover:text-[#F5F5F5] hover:bg-[#222222]"
                    }`}
                  >
                    +{settings.currency}{val}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-medium px-1">{error}</p>
          )}

          {/* Category Quick Picker (Small, Horizontal, Scrollable) */}
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-2">
              Category
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
              {filteredCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      if (error) setError("");
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center min-w-[64px] min-h-[64px] cursor-pointer flex-shrink-0 ${
                      isSelected
                        ? "bg-neutral-800 border-emerald-500/80 text-white shadow-sm ring-1 ring-emerald-500/40"
                        : "bg-[#1C1C1C] border-[#262626] text-[#A1A1AA] hover:bg-neutral-800/60 hover:text-white"
                    }`}
                  >
                    <span className="text-lg mb-0.5">{cat.icon}</span>
                    <span className="text-[10px] font-medium leading-tight truncate w-full px-0.5">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date, Note & Payment Row */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              {/* Date Input with Left/Right Steppers & Native Browser Date Picker */}
              <div className="flex-1 min-w-[110px] flex items-center justify-between gap-1 bg-[#1C1C1C] border border-[#262626] rounded-xl px-1.5 sm:px-2 py-1.5 text-xs text-[#F5F5F5] focus-within:border-emerald-500/50 transition">
                <button
                  type="button"
                  onClick={() => changeDateByDays(-1)}
                  className="z-10 p-1 rounded-lg text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-[#262626] active:scale-90 transition cursor-pointer shrink-0"
                  title="Previous Day"
                  aria-label="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div
                  onClick={() => {
                    try {
                      dateInputRef.current?.showPicker?.();
                    } catch {
                      dateInputRef.current?.focus();
                    }
                  }}
                  className="relative flex-1 flex items-center justify-center px-1 py-0.5 cursor-pointer min-w-0"
                  title="Click to select date"
                >
                  <span className="text-xs font-bold text-[#F5F5F5] font-mono-num tracking-wide select-none text-center">
                    {formatDDMMYY(date)}
                  </span>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={date}
                    max={getToday()}
                    onChange={(e) => {
                      if (e.target.value) {
                        const val = e.target.value;
                        const today = getToday();
                        setDate(val > today ? today : val);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    aria-label="Select Date"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => changeDateByDays(1)}
                  disabled={date >= getToday()}
                  className={`z-10 p-1 rounded-lg transition shrink-0 ${
                    date >= getToday()
                      ? "text-neutral-600 cursor-not-allowed opacity-30"
                      : "text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-[#262626] active:scale-90 cursor-pointer"
                  }`}
                  title={date >= getToday() ? "Cannot select future date" : "Next Day"}
                  aria-label="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Payment Method Selector */}
              <select
                value={prefill?.paymentMethod || settings.defaultPaymentMethod || "upi"}
                onChange={(e) => {
                  // In a real scenario, this would update the state or handle the prefill
                }}
                className="bg-[#1C1C1C] border border-[#262626] rounded-xl px-2 py-2 text-xs text-[#F5F5F5] focus:border-emerald-500/50 transition cursor-pointer appearance-none"
              >
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank">Bank</option>
              </select>

              {/* Compact Unwanted Spend Button (Only for Expense) */}
              {type === "expense" && (
                <button
                  type="button"
                  onClick={() => setIsUnwanted(!isUnwanted)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border text-xs transition shrink-0 cursor-pointer ${
                    isUnwanted
                      ? "bg-rose-500/15 border-rose-500/40 text-rose-300 font-semibold shadow-sm"
                      : "bg-[#1C1C1C] border-[#262626] text-[#71717A] hover:text-[#D4D4D8] hover:bg-neutral-800"
                  }`}
                  title="Tag as unwanted or impulse spend"
                >
                  <AlertTriangle className={`w-3.5 h-3.5 ${isUnwanted ? "text-rose-400" : "text-[#71717A]"}`} />
                </button>
              )}
            </div>

            {/* Note Field (Blank box strip) */}
            <div className="bg-[#1C1C1C] border border-[#262626] rounded-xl p-2">
              <input
                type="text"
                placeholder="Add a note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-transparent text-xs text-[#F5F5F5] outline-none placeholder-[#71717A]"
                maxLength={100}
              />
            </div>
          </div>


          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-12 flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-black font-semibold text-sm transition-all shadow-lg shadow-emerald-950/20 cursor-pointer"
            >
              {prefill?.id ? "Update Transaction" : "Save Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

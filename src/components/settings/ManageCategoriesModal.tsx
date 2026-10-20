import React, { useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { useUIStore } from "@/stores/uiStore";
import { Category, CategoryType } from "@/types/category";
import { X, Plus, Trash2, Edit2, Check, Tag } from "lucide-react";

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_ICONS = [
  "🍔", "☕", "🍕", "🛒", "🚌", "🚗", "⛽", "✈️", 
  "🛍", "👕", "📱", "💻", "🧾", "🏠", "💡", "📶",
  "💊", "🏋️", "🎬", "🎮", "📚", "🎁", "💼", "📈", "💰"
];

const PRESET_COLORS = [
  "#10B981", // Emerald
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F43F5E", // Rose
  "#F97316", // Orange
  "#EAB308", // Amber
  "#64748B", // Slate
];

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const categories = useAppStore((s) => s.categories);
  const addCategory = useAppStore((s) => s.addCategory);
  const updateCategory = useAppStore((s) => s.updateCategory);
  const deleteCategory = useAppStore((s) => s.deleteCategory);
  const showToast = useUIStore((s) => s.showToast);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "expense" | "income">("all");

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("expense");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState(PRESET_ICONS[0]);

  React.useEffect(() => {
    if (!isOpen) {
      setIsAdding(false);
      setEditingId(null);
      setName("");
      setColor(PRESET_COLORS[0]);
      setIcon(PRESET_ICONS[0]);
      setType("expense");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color || PRESET_COLORS[0]);
    setIcon(cat.icon || PRESET_ICONS[0]);
    setIsAdding(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      showToast("Please enter a category name", "error");
      return;
    }

    if (editingId) {
      updateCategory(editingId, {
        name: trimmed,
        type,
        color,
        icon,
      });
      showToast(`Category "${trimmed}" updated`);
      setEditingId(null);
    } else {
      addCategory({
        name: trimmed,
        type,
        color,
        icon,
        isDefault: false,
      });
      showToast(`Category "${trimmed}" created`);
      setIsAdding(false);
    }

    setName("");
    setColor(PRESET_COLORS[0]);
    setIcon(PRESET_ICONS[0]);
    setType("expense");
  };

  const handleDelete = (cat: Category) => {
    const success = deleteCategory(cat.id);
    if (success) {
      showToast(`Category "${cat.name}" removed`);
    } else {
      showToast("Cannot delete default system category", "error");
    }
  };

  const visibleCategories = categories.filter((cat) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "expense") return cat.type === "expense" || cat.type === "both";
    return cat.type === "income" || cat.type === "both";
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#141414] border border-[#242424] shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#242424] bg-[#161616]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#F5F5F5]">Manage Categories</h3>
              <p className="text-xs text-[#71717A]">
                {categories.length} categories · Custom & system defaults
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Toolbar */}
        {!isAdding && !editingId && (
          <div className="p-3 sm:px-4 border-b border-[#242424] flex items-center justify-between gap-2 bg-[#111111]">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#1A1A1A] p-0.5 rounded-xl border border-[#282828]">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  activeFilter === "all"
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-[#71717A] hover:text-[#D4D4D8]"
                }`}
              >
                All ({categories.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("expense")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  activeFilter === "expense"
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-[#71717A] hover:text-[#D4D4D8]"
                }`}
              >
                Expenses
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("income")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  activeFilter === "income"
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-[#71717A] hover:text-[#D4D4D8]"
                }`}
              >
                Income
              </button>
            </div>

            {/* Add New Category Button */}
            <button
              onClick={() => {
                setIsAdding(true);
                setEditingId(null);
                setName("");
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition active:scale-95 cursor-pointer shrink-0 ml-auto shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New</span>
            </button>
          </div>
        )}

        {/* Add / Edit Form */}
        {(isAdding || editingId) && (
          <form onSubmit={handleSave} className="p-4 sm:p-5 border-b border-[#242424] bg-[#161616] space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
                {editingId ? "Edit Category" : "Create New Category"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className="text-xs text-[#71717A] hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-medium text-[#A1A1AA]">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Freelance, Gym, Pet Care"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1C1C1C] border border-[#2D2D2D] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] outline-none focus:border-emerald-500/50"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#A1A1AA]">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CategoryType)}
                  className="w-full bg-[#1C1C1C] border border-[#2D2D2D] rounded-xl px-3 py-2 text-xs text-[#F5F5F5] outline-none"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            {/* Icon Picker */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#A1A1AA]">Choose Icon</label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {PRESET_ICONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 transition ${
                      icon === i
                        ? "bg-emerald-500/20 border-2 border-emerald-400 scale-105"
                        : "bg-[#202020] border border-[#2D2D2D] hover:bg-[#282828]"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#A1A1AA]">Accent Color</label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition flex items-center justify-center ${
                      color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#141414] scale-110" : "opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition active:scale-95 cursor-pointer shadow-sm"
              >
                {editingId ? "Save Changes" : "Add Category"}
              </button>
            </div>
          </form>
        )}

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#242424] p-2 sm:p-3 space-y-1">
          {visibleCategories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all hover:bg-[#1A1A1A] bg-[#161616]/40 border border-transparent"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {/* Icon badge */}
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm sm:text-base shrink-0 shadow-inner"
                  style={{ backgroundColor: `${cat.color || "#10B981"}20`, border: `1px solid ${cat.color || "#10B981"}40` }}
                >
                  {cat.icon || "🏷️"}
                </div>

                {/* Title & Type */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-[#F5F5F5] truncate">
                      {cat.name}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-emerald-400/90 tracking-wider bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      {cat.type}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-[#71717A] block truncate">
                    {cat.isDefault ? "Default system category" : "Custom category"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Edit button */}
                <button
                  onClick={() => handleStartEdit(cat)}
                  className="p-1.5 rounded-lg text-[#71717A] hover:text-[#F5F5F5] hover:bg-[#252525] transition cursor-pointer"
                  title="Edit category"
                  aria-label="Edit category"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Delete button (if not default) */}
                {!cat.isDefault && (
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 rounded-lg text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    title="Delete category"
                    aria-label="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 sm:px-5 border-t border-[#242424] bg-[#111111] flex items-center justify-between">
          <span className="text-[11px] text-[#71717A]">
            {visibleCategories.length} categories shown
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

# Single-Line Category Carousel & Mobile Date Picker Fix

Streamline the New Transaction popup by converting the category selector into a single-line, icon-only horizontal scroll carousel and replacing the squished native date input with a clearly formatted, mobile-friendly date selector and calendar popover.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during the interactive interview:

- **Category Label Location**: The selected category name will be shown directly beside the Category header (e.g., `Category · Food 🍔`), keeping the carousel row pure icon-only, clean, and uncluttered.
- **Category Carousel**: Single-line horizontal scroll container with smooth touch scrolling (`overflow-x-auto`), circular/rounded-xl icon buttons, active colored indicator rings, and full 44px touch targets.
- **Date Selector Display**: Formatted clearly as `20 Oct` (with `Today` badge or prefix), ensuring high legibility on small mobile viewports (375px–430px) without cramped native browser controls or truncated text (`20 - 1📅`).
- **Date Picker Interaction**: Tapping the formatted date button opens a clean calendar popover for easy day selection, accompanied by quick `<` and `>` day stepper arrows.

---

## 1. Overview & Core Concept

- **The Problem**: 
  - The previous 4-column category grid pushed essential form controls down the mobile screen, requiring excessive vertical scrolling.
  - The date field used an unstyled native WebKit `<input type="date">` inside a narrow flex container, causing mobile browsers to squish and truncate the text into `< 20 - 1📅 >`.
- **The Solution**:
  - Transform categories into an ergonomic single-line horizontal scroller displaying icon-only circular tokens with active highlight rings.
  - Display the selected category name dynamically next to the heading (`Category · Food`).
  - Replace the compressed native date input with a custom responsive date control that displays `Today, 20 Oct` (or `20 Oct`) and opens an accessible calendar popover when tapped, with working left/right day steppers.

---

## 2. User Experience & Visual Design

### A. Layout Architecture & Component Hierarchy

```
┌────────────────────────────────────────────────────────┐
│ New Transaction Popup                                 │
├────────────────────────────────────────────────────────┤
│ [ Expense ] [ Income ]  <-- Segmented Type Toggle      │
│                                                        │
│ Amount: [ ₹ 0.00 ]      [+50] [+100] [+200] [+500]     │
│                                                        │
│ Category · Food                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ (🍔) (🚌) (🛍️) (🧾) (🏠) (💊) (🎬) (💰) (📦) ...   │ │ <-- 1-line icon scroll
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ Date & Method:                                         │
│ ┌───────────────────────────┐ ┌─────────┐ ┌──────────┐ │
│ │ ‹  Today, 20 Oct 📅  ›    │ │ [ UPI ] │ │ Unwanted │ │
│ └───────────────────────────┘ └─────────┘ └──────────┘ │
│       │ (tap opens calendar popover)                   │
│       ▼                                                │
│ ┌───────────────────────────┐                          │
│ │   October 2026            │                          │
│ │   Mo Tu We Th Fr Sa Su    │                          │
│ │    1  2  3  4  5  6  7    │                          │
│ │   ... 19 [20]             │                          │
│ └───────────────────────────┘                          │
│                                                        │
│ [ Add Transaction ]                                    │
└────────────────────────────────────────────────────────┘
```

### B. Category Scroller Specifications
- **Container**: `flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-0.5 scroll-smooth snap-x`.
- **Icon Buttons**:
  - Size: 44x44px touch target with `rounded-2xl` geometry.
  - Inactive State: Dark neutral surface (`bg-[#1C1C1C] border border-[#2A2A2A] text-[#A1A1AA] hover:border-[#383838]`).
  - Active State: Category brand color tint (`bg-opacity-20 border-opacity-100 ring-2 ring-emerald-500/50 shadow-md scale-105 transition-all`).
  - Emoji/Icon display: Centered 20px icon.
- **Header Line**:
  - `Category` label on the left in subtle uppercase neutral (`text-xs text-[#A1A1AA]`).
  - Selected category badge on the right: `· Food 🍔` in high-contrast text (`text-[#F5F5F5] font-semibold`).

### C. Date Selector Specifications
- **Trigger Element**:
  - Dedicated container with stepper controls: `< button [ChevronLeft]`, formatted label `20 Oct` with calendar icon, `button [ChevronRight] >`.
  - Date text styled with tabular figures (`font-mono-num font-semibold text-xs sm:text-sm text-[#F5F5F5] whitespace-nowrap`).
  - Clicking the center date label triggers the calendar dropdown/modal.
- **Calendar Popover**:
  - Clean floating modal or anchored dropdown with month navigation, weekday headers, and tap-to-select day grid.
  - Highlights today and currently selected date.
  - Enforces max date boundary (cannot select future dates unless allowed for recurring/future plans).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Icon-Only Single-Line Scroller vs. Multi-Line Grid**
  - *Chosen Approach*: Horizontal single-line scroller with 44px icon tokens and the category name reflected in the section header.
  - *Why*: Frees up over 120px of vertical screen space on mobile devices, ensuring the amount input, date, payment method, and submit button all fit comfortably in the primary thumb zone without vertical scrolling.
- **Decision 2: Formatted Date Button with Calendar Popover vs. Native `<input type="date">`**
  - *Chosen Approach*: Custom date trigger button displaying human-readable `Today, 20 Oct` backed by our existing interactive calendar selector.
  - *Why*: Eliminates browser-specific WebKit rendering bugs where narrow widths cause text truncation (`20 - 1📅`), guarantees consistent dark-theme styling, and provides effortless day-to-day stepping.

---

## 4. Technical Architecture & Implementation Steps

### Step 1: Update Category Selection in `AddTransactionModal.tsx`
- Refactor the Category section markup:
  - Header: Render `Category` with dynamic active category title: `Category · {selectedCategory?.name || "Select"}`.
  - Body: Replace `grid grid-cols-4` with `flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth`.
  - Buttons: Render compact icon buttons with category tooltip/aria-label and smooth active animations.

### Step 2: Implement Responsive Date Selector with Calendar Popover
- Replace the squeezed `<input type="date">` container with a custom responsive date component:
  - Formatted label: e.g. `formatDateButtonLabel(date)` -> `"Today, 20 Oct"` on desktop, `"20 Oct"` on very narrow screens.
  - Left & Right stepper buttons (`-1 day`, `+1 day` up to today).
  - Popover calendar integration: Leverage the tested popover calendar logic from `DateSelector.tsx` or a lightweight anchored calendar popup so users can tap and pick any date.

### Step 3: Verification & Polish
- Validate touch responsiveness and layout integrity across standard mobile viewport widths (375px, 390px, 412px, 430px) as well as desktop viewports.
- Run `compile_applet` and `lint_applet` to ensure zero compilation or type errors.

# Profile & Account Information Architecture

A dedicated, layered profile and account security management architecture for Spend Vault, translating the provided mobile-first reference flow into full-featured, responsive views for managing personal identity, credentials, and account settings.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product decisions were confirmed during the Phase 1 clarification interview and govern the technical and visual implementation:

- **Confirmed Decision 1 (Navigation Structure)**: Dedicated sub-routes (`/profile` and `/account-settings`) rather than constrained popups. Both desktop and mobile navigation (top bar avatar, sidebar profile card, and settings menu) will link directly to these sub-routes with persistent back-navigation.
- **Confirmed Decision 2 (Profile Field Scope)**: Full editable personal identity suite including **Full Name**, **Avatar / Profile Picture**, **Phone Number**, **Date of Birth**, and **Gender**, with inline edit modes and instant validation.
- **Confirmed Decision 3 (Account Security Scope)**: Dedicated Account Settings view featuring **Login Email**, **Password Change & Password Reset Email trigger**, and **Account Deletion** with double-confirmation dialog and credential verification.
- **Recommended Default (Settings Hub & Shortcuts)**: The Settings page (`/settings`) will feature top-level entry cards for **Profile** (showing avatar, name, and "View profile >") and **Account Settings**, matching the middle and bottom screens in the reference diagram, with cross-links between Profile and Account Settings.

---

## 1. Overview & Core Concept

### What It Does
Provides users with a structured, intuitive two-tier management center:
1. **Profile Screen (`/profile`)**: Focuses on personal identity and presentation. Displays the user's avatar (with an "Add / Change image" trigger), full name, date of birth, phone number, and gender. Includes a direct "Account settings" shortcut card at the bottom as shown in the design reference.
2. **Account Settings Screen (`/account-settings`)**: Focuses on authentication, security, and credentials. Enables users to view and update their login email address, trigger a password reset link or update password, toggle two-factor/security preferences, review connected session details, and safely delete their account.
3. **Settings Hub (`/settings`) Integration**: Upgrades the existing Settings page into a clean gateway matching the reference diagram's middle screen, featuring a prominent top Profile preview banner ("View profile >"), navigation list items ("Account settings >", "Appearance >", "Currency & Number Format >", "Help & Support >"), and a red "Log out" button.

### Target Audience & Persona
All Spend Vault personal finance users who want transparency over their account credentials, identity customization, and quick access to account recovery tools.

### Key Value
- Replaces disjointed modal popups with dedicated, accessible, deep-linkable URLs.
- Matches the mobile-first UX standard shown in the user's design reference with 44px+ touch targets and thumb-friendly ergonomics.
- Prevents accidental credential changes with dedicated confirmation modals and state feedback.

---

## 2. User Experience & Visual Design

### Key User Flows

```
[ Menu / Top Bar / Sidebar ]
          │
          ├──▶ [ Settings Hub (/settings) ]
          │          │
          │          ├──▶ [ Profile Header Card ] ──▶ [ Profile (/profile) ]
          │          │                                      │
          │          └──▶ [ Account Settings Row ] ─┐      └──▶ [ "Account settings" CTA ]
          │                                         │                     │
          ▼                                         ▼                     ▼
[ Top Avatar Click ] ──────────────────────▶ [ Account Settings (/account-settings) ]
```

1. **Viewing & Editing Profile (`/profile`)**:
   - Header with back arrow (`←`) returning to the previous screen (`/settings` or previous route) and "Profile" title.
   - Large centered avatar with an "Add image / Change" button. Users can upload an image URL or pick curated finance avatars.
   - List of personal fields with clean right-aligned pencil edit icons (`Edit2`):
     - **Name**: Display name with validation.
     - **Date of Birth**: Native date picker (`YYYY-MM-DD`).
     - **Phone Number**: International phone format with country code input.
     - **Gender**: Selectable options (`Male`, `Female`, `Non-binary`, `Prefer not to say`).
   - Bottom shortcut card: "Account settings — A shortcut link to change login, password" with chevron `→`.

2. **Managing Security & Credentials (`/account-settings`)**:
   - Header with back arrow (`←`) and "Account settings" title.
   - **Login Email**: Current email with verification badge ("Verified" in green or "Unverified" with resend link) and edit dialog.
   - **Password**: Masked `••••••••••••` with "Change password" button that triggers either in-app change or a Firebase reset link to the user's email.
   - **Connected Device & Session Info**: Clean display of current platform, browser, and last active timestamp.
   - **Delete Account**: Red destructive row at the bottom opening a confirmation modal requiring typed confirmation before deletion.

### Visual Identity & Theme
- **Color Discipline (60-30-10)**:
  - 60% Canvas: Deep `#0A0A0A` neutral dark background.
  - 30% Structural Surfaces: `#141414` card containers with `#262626` hairline borders and subtle hover states (`#1C1C1C`).
  - 10% Accents: Emerald `#10B981` for verified states and active toggles; Rose `#F43F5E` for destructive delete triggers.
- **Typography**: Clean tabular figures for phone numbers and dates; standard font weights (`font-semibold` titles, `font-medium` values, `text-neutral-400` labels).
- **Anti-Slop Discipline**: Zero unnecessary pill badges; clean text metadata separated by subtle spacing; no fake compiler/status indicators.

---

## 3. Key Product Decisions & Trade-Offs

- **Sub-Route Navigation vs. Multi-Step Modal**:
  - *Chosen Approach*: Sub-routes `/profile` and `/account-settings` integrated into `RouterProvider`.
  - *Why*: Allows browser history (`popstate`, back button), mobile swipe gestures, bookmarkable URLs, and matches standard responsive web app architectures without trapped modal scroll issues.
  - *Alternatives Considered*: Slide-over sheets or drawer modals were considered, but nested modals (e.g. edit dialog on top of profile modal) degrade on small mobile screens.
- **Profile Data Persistence**:
  - *Chosen Approach*: Store profile extensions (`phone`, `dateOfBirth`, `gender`, `avatarUrl`) in `users/{userId}` Firestore document and local storage cache, while syncing `displayName` and `photoURL` directly to Firebase Auth profile.
  - *Why*: Guarantees instant offline availability and cross-device synchronization without breaking existing Firestore security rules.
- **Password & Email Security Flows**:
  - *Chosen Approach*: Use Firebase Authentication standard `sendPasswordResetEmail` and `verifyBeforeUpdateEmail` with in-app status toasts and re-authentication safeguards.
  - *Why*: Ensures military-grade security without exposing plain passwords or bypassing Firebase security protocols.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Navigation Entry Points                       │
│     TopBar (Avatar)  │  Sidebar (Profile Card)  │  BottomNav (Settings)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Client Router (router.tsx)                       │
│    RoutePath: "/" | "/transactions" | "/settings" | "/profile" |       │
│               "/account-settings" | "/plans" | "/overview"             │
└───────────────┬───────────────────────────────────────┬────────────────┘
                │                                       │
                ▼                                       ▼
┌───────────────────────────────┐       ┌────────────────────────────────┐
│      ProfilePage.tsx          │       │    AccountSettingsPage.tsx     │
│  - Avatar picker / uploader   │       │  - Login email & verification  │
│  - Name, DOB, Phone, Gender   │       │  - Password reset / change     │
│  - Shortcut to AccountSettings│       │  - Connected session info      │
│  - Inline edit state handlers │       │  - Delete account modal flow   │
└───────────────┬───────────────┘       └───────────────┬────────────────┘
                │                                       │
                ▼                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     AuthContext & User Profile Store                   │
│   - Firebase Auth (user, updateProfile, sendPasswordReset, deleteUser) │
│   - Firestore `users/{userId}` profile synchronization                 │
│   - LocalStorage backup `spend_profile_{userId}`                       │
└────────────────────────────────────────────────────────────────────────┘
```

### Component & File Blueprint

1. **`src/app/router.tsx`**:
   - Add `"/profile"` and `"/account-settings"` to `RoutePath` union and URL path/hash parser.
2. **`src/types/user.ts`**:
   - Define `UserProfileData` interface:
     ```ts
     export interface UserProfileData {
       displayName: string;
       email: string;
       phone?: string;
       dateOfBirth?: string;
       gender?: "male" | "female" | "other" | "prefer_not_to_say" | "";
       photoURL?: string;
     }
     ```
3. **`src/pages/Profile/ProfilePage.tsx`**:
   - Implements Screen 3 ("Profile") from the reference diagram:
     - Header with back button to previous view.
     - Avatar circle with "Add image" button.
     - Form rows with field name, formatted value, and `Edit2` trigger.
     - Inline modal / sheet to edit fields with instant save.
     - Bottom banner: "Account settings — A shortcut link to change login, password".
4. **`src/pages/AccountSettings/AccountSettingsPage.tsx`**:
   - Implements Screen 5 ("Account settings") from the reference diagram:
     - Header with back button.
     - Login email row with edit / verification badge.
     - Password row with "Change" button (sends password reset link or opens password update dialog).
     - Connected session / device information.
     - Destructive "Delete my account" trigger with safety confirm dialog.
5. **`src/pages/Settings/SettingsPage.tsx`**:
   - Upgrades top section to include the Profile card banner ("Joh Alex, View profile >") matching Screen 4 of the reference diagram.
   - Provides quick link item for "Account settings >" and "Profile >".
6. **`src/components/navigation/TopBar.tsx` & `src/components/navigation/Sidebar.tsx`**:
   - Clicking avatar or profile card navigates to `/profile` instead of opening the legacy basic popup.
7. **`src/App.tsx`**:
   - Mount `<ProfilePage />` on route `"/profile"` and `<AccountSettingsPage />` on route `"/account-settings"`.

---

## 5. Verification & Rollout Plan

1. **Compilation & Type Check**:
   - Verify all TypeScript types and imports compile cleanly using `compile_applet` and `lint_applet`.
2. **Interactive Testing Across Flows**:
   - Test navigation: Home -> Settings -> Profile -> Account Settings -> Back navigation.
   - Test direct avatar click from TopBar and Sidebar.
   - Test editing Name, Phone, Date of Birth, and Gender; confirm changes persist on reload.
   - Test Password Reset email trigger and verify toast feedback.
   - Test Delete Account confirmation modal safeguard.
   - Verify mobile responsive display ($375\text{px}$) and desktop presence ($1440\text{px}$).

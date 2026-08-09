# Tally — personal expense & income tracker

A private, paper-ledger-styled finance tracker. Sign in with Google or email, log expenses and income, see monthly totals and category charts, browse past months, export CSV. Data lives in Lovable Cloud so it syncs across every device in real time.

## Screens

**Landing (`/`)** — short intro with the Tally wordmark, a signature stamp badge, and a Sign in call-to-action. Scroll-reveal animations on the way down.

**Auth (`/auth`)** — Google one-tap button first, then email + password with a sign-in / create-account toggle and a forgot-password link. `/reset-password` handles setting a new password.

**Dashboard (`/dashboard`, sign-in required)**
- Month switcher with prev/next arrows and the month + year in serif type
- Three summary cards: spent, income, net balance (monospace figures, animated count-up)
- Donut chart of the month's expenses by category, with a legend listing amount and share
- Trend chart: last 6 months of income vs expense as bars/area, so months can be compared
- Ledger list of the month's transactions — category icon, date, note, amount; brick-red minus for expenses, forest-green plus for income, dashed perforated dividers between rows
- Export CSV button for the viewed month
- Floating add button

**Add / edit entry** — a modal with an Expense/Income toggle that swaps the category list, amount, date, and optional note. Editing an entry offers delete.

## Categories

Expense: Food & Dining, Groceries, Transport, Shopping, Bills & Utilities, Entertainment, Health & Fitness, Housing & Rent, Education, Travel, Subscriptions, Personal Care, Gifts & Donations, Insurance, Other.
Income: Salary, Freelance, Business, Investment, Rental, Interest, Refund, Bonus, Gift, Other.

## Design

Warm paper background with a faint grain, ink near-black text, brick red for expenses, forest green for income, amber gold for balance highlights. Characterful serif for headings and the wordmark, clean sans for body, monospace with tabular figures for every money amount. Signature motif: a rotated stamp badge plus dashed perforated ledger dividers — used sparingly. Frosted-glass sticky header and modal surfaces. Motion: scroll-reveal sections, count-up numbers, chart draw-in, spring-y modal and row transitions, subtle tilt on summary cards. Fully responsive, phone-first ledger layout.

Footer on every page: "Built by Abhirai2006" with a GitHub icon link.

## Technical notes

- TanStack Start (already the project stack) + Lovable Cloud for database and auth. Google sign-in enabled via the managed broker plus email/password with reset.
- Table `transactions`: `id`, `user_id`, `amount numeric`, `type`, `category`, `occurred_on date`, `note`, `currency` (default INR), `created_at`, `updated_at`. Row-level security scoped to `auth.uid()` so each user only ever reads and writes their own rows; grants for `authenticated`.
- Forward-compatible without a rebuild: `currency` column already present, category stored as text (custom categories later), and separate future tables for budgets, recurring rules, and receipt attachments can join on `transactions`/`user_id`.
- Realtime subscription on `transactions` keeps two open devices in sync instantly; TanStack Query caches the month view.
- Dashboard lives under the authenticated route gate; charts use Recharts (already installed). CSV built client-side from the loaded month.
- Out of scope as requested: bank linking, shared accounts, admin, payments.

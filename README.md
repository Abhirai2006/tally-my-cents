# Tally: Your Personal Ledger

Tally, a personal expense tracker

Build me a personal expense and income tracker web app called Tally. Pick whatever stack, database, and auth provider you think is the best fit — I don't have a preference. Handle hosting and publishing yourself; I don't need a separate deployment step.

What it's for

A simple, personal finance ledger for someone who wants to log what they spend and earn day to day, see where their money goes by category, and check it from their phone or laptop with the same account — no manual password syncing, no spreadsheets.

Accounts & sign-in

Users must create an account and log in before seeing any data.

Support Google sign-in as the primary, one-tap option.

Also support plain email + password sign-in/sign-up, for anyone who doesn't want to use Google.

Include "forgot password" support for the email option.

Each user only ever sees their own data — no shared or public data by default.

Whatever a user logs in on one device should already be there when they log in on another device, in real time. That's the core "sync" requirement — I'm not asking for actual bank account linking, just that my own entries follow me across devices.

Core data

Each entry a user logs needs:

Amount (number, currency ₹ INR by default)

Type — expense or income

Category — a fixed list is fine to start:

Expense categories: Food & Dining, Groceries, Transport, Shopping, Bills & Utilities, Entertainment, Health & Fitness, Housing & Rent, Education, Travel, Other add if u know anything more

Income categories: Salary, Freelance, Investment, Gift, Other add if u know anything more

Date

Note — optional short free-text field

Created/updated timestamps for sorting

Core screens & features (build all of these)

Login / sign-up screen — Google button, email+password form with a toggle between sign-in and create-account, forgot-password link.

Dashboard / overview, scoped to a selected month, with:

Month switcher (previous/next arrows, current month + year shown clearly)

Three summary numbers: total spent, total income, and net balance for that month

A category breakdown chart (donut or bar) for that month's expenses, with a legend showing each category's amount and share

A scrollable list of that month's transactions, each row showing category icon/label, date, note, and amount — expenses and income should be visually distinct (e.g. different color, +/− sign)

Add / edit entry — a form (modal or dedicated screen) to add a new entry or edit/delete an existing one, with a clear toggle between "Expense" and "Income" that changes the category options shown.

Export — a button to export the currently viewed month's transactions as a CSV file.

Fully responsive — this needs to work well on a phone screen, since checking spending on the go is the main use case.

Design direction

Give it a distinct, considered visual identity — not a generic default dashboard template. Some direction to riff on (adapt freely, this is a starting point, not a spec):

Think "personal ledger / receipt book" rather than "corporate fintech dashboard." A calm, paper-like background, an ink-toned dark blue or near-black for primary text and structure, a muted brick-red for expenses, a forest green for income, and a warm gold/amber for balance or highlights.

Pair a characterful serif for headings/wordmark with a clean sans-serif for body text, and use a monospace font for all money amounts — real ledgers align figures, and tabular monospace numbers reinforce that feeling while making amounts easy to scan.

A small signature touch — like a rotated "stamp" badge, a dashed/perforated line motif, or ledger-style dividers between transaction rows — goes a long way toward making it feel designed rather than templated. Pick one and use it with restraint.

Keep it clean and uncluttered otherwise — the personality should come from a few deliberate details, not decoration everywhere.

Explicitly out of scope for this build

No real bank account connection or transaction auto-import. Everything is entered manually by the user. (This would need a licensed aggregator and backend infrastructure — not something to attempt here.)

No multi-user/shared accounts, no admin panel, no payments/subscriptions.

Keep in mind for later (don't build now, but don't design yourself into a corner)

Structure the data model loosely enough that these could be added later without a rebuild: monthly budgets per category with alerts, recurring/repeating entries, attaching a receipt photo to an entry, multi-currency support, free-text search and filters over transactions, user-defined custom categories, and month-over-month spending insights.

Definition of done

A logged-in user can sign in with Google or email, add and edit expense/income entries across categories, see an accurate monthly summary and category chart, browse past months, export a month to CSV, and get the exact same data back when they log into the same account from a different device or browser.

and one more thing add some graphs and charts so that user can visualy analys
and some animations so that it will help them to come again and again to this website
dont make a Ai slop be generic and nice
if possible add some scroll animations, glass morphisms and next level animations, 3d models or 3d animations something like that
at last add build by Abhirai2006 and github to move there

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8ddf2c21-3e95-464b-a4b9-2728aeed7d32).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

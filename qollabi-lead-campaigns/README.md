# Qollabi — Lead Campaigns

A Next.js front-end prototype for the Qollabi Lead Campaigns epic, built with TypeScript and Tailwind CSS.

## Pages

- **`/customers`** — Customer list with smart list tabs, search, sorting, bulk actions, stats bar, pagination, and "New customer" modal
- **`/leads`** — Lead list with advanced filters (all lead attributes + operators from the epic), bulk bar, offer PDF links, owner avatars, and "New lead" modal
- **`/campaigns`** — Campaign list with stats cards, target group badges (Customers/Leads), status pills, and Campaigns/Templates tabs
- **`/campaigns/create`** — 5-step campaign creation wizard:
  1. Campaign Details (name, target group selector, description, icon)
  2. Select Recipients (lead smart lists, flat recipient table, stats cards)
  3. Flow Builder (merge tag reference for lead campaigns)
  4. Settings (automation, CC/BCC with Lead Owner, recipient filters)
  5. Draft & Send (lead list panel, email preview with merge tags, Activate/Send CTA)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this folder to a GitHub/GitLab/Bitbucket repository
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository
3. Vercel auto-detects Next.js — click **Deploy**

Or use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Data:** Mock data (no backend)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── customers/          # Customers page
│   ├── leads/              # Leads page
│   ├── campaigns/          # Campaigns list + create wizard
│   ├── layout.tsx          # Root layout (sidebar + topbar)
│   └── globals.css         # Global styles + Tailwind
├── components/
│   ├── layout/             # Sidebar, Topbar
│   ├── ui/                 # Reusable components (BulkBar, FilterPanel, Modal, etc.)
│   └── campaigns/          # Wizard step components (5 steps)
├── data/                   # Mock data (customers, leads, campaigns)
└── types/                  # TypeScript type definitions
```

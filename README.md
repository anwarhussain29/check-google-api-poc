# Solar Leads POC

A small Next.js app that imports leads (customer name, phone and address), looks each address up with the [Google Solar API](https://developers.google.com/maps/documentation/solar/overview) and stores and displays the building's solar potential. The UI is modeled on the [Google Solar API demo](https://mapsplatform.google.com/demos/solar/).

## Features

- Add leads manually or import them from a CSV file.
- For each lead, the "Fetch Solar Data" button:
  1. geocodes the address with the Geocoding API, then
  2. calls `buildingInsights:findClosest`, trying `HIGH` imagery quality first and falling back to `MEDIUM` and then `LOW`.
- The lead detail page shows a satellite map centered on the building next to an info panel with:
  - sunshine hours per year, roof area, max panel count and CO2 offset factor
  - panel count and yearly energy output gauges
  - a panel count slider that saves the selected configuration and its energy output to the lead
  - an "API Response" dialog with the raw Solar API JSON
- Everything (metrics, selection and the raw response) is stored in Postgres (Neon).

## Stack

Next.js 15 (App Router, server actions), Tailwind CSS, shadcn/ui, Prisma with Neon Postgres, `@vis.gl/react-google-maps` and `papaparse`.

## Setup

1. In Google Cloud, enable these APIs for your project and create an API key:
   - Solar API
   - Geocoding API
   - Maps JavaScript API
2. Create a Neon Postgres database. The easiest way is from your Vercel project: Storage, then Create Database, then Neon. This sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED` on Vercel.
3. Copy the env file and fill in the values (or run `vercel env pull .env` to copy them from Vercel):

   ```bash
   cp .env.example .env
   ```

   | Variable | Used by |
   | --- | --- |
   | `DATABASE_URL` | Prisma at runtime (Neon pooled connection) |
   | `DATABASE_URL_UNPOOLED` | Prisma migrations (Neon direct connection) |
   | `GOOGLE_MAPS_API_KEY` | Server: Geocoding + Solar API |
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Browser: Maps JavaScript API |

   The same key works for both Google variables. For anything beyond local testing, use a separate browser key restricted by HTTP referrer.

4. Install, create the tables and run:

   ```bash
   npm install
   npx prisma migrate deploy
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

1. Import the GitHub repo in Vercel and attach the Neon database (step 2 above).
2. Add `GOOGLE_MAPS_API_KEY` and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` under Project Settings, then Environment Variables.
3. If the browser key is restricted by HTTP referrer, add your `*.vercel.app` domain to it.
4. Deploy. `npm run build` runs `prisma migrate deploy` first, so the tables are created on the first build.

## CSV format

The file needs a header row with `name,phone,address`. Header matching is case-insensitive, and rows missing any of the three fields are skipped. A sample is in [`public/sample-leads.csv`](public/sample-leads.csv):

```csv
name,phone,address
John Smith,+1 415 555 0101,"2101 Webster St, San Francisco, CA 94115"
```

Solar API coverage varies by country. If no building is found near an address, the lead is marked "No coverage".

## Project layout

```
app/
  actions.ts            server actions: createLead, importLeadsCsv, fetchSolarForLead, savePanelSelection
  page.tsx              leads list
  leads/[id]/page.tsx   lead detail (map + solar panel)
components/
  add-lead-dialog.tsx, csv-import.tsx, fetch-solar-button.tsx,
  solar-map.tsx, solar-panel-card.tsx, status-badge.tsx
lib/
  google.ts             Geocoding + Solar API calls (server only)
  solar.ts              response types and metric helpers
  db.ts                 Prisma client
prisma/schema.prisma    Lead model
```

`npm run db:studio` opens Prisma Studio so you can browse the stored leads.

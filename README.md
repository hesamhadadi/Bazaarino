# Bazaarino

[![Sponsor Bazaarino](https://img.shields.io/badge/Sponsor-GitHub%20Sponsors-EA4AAA?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/hesamhadadi)

Bazaarino is a marketplace and community platform for Persian-speaking users across Europe, focused on classifieds, housing, reservations, messaging, local services, articles, and user-to-user trust.

The product is built around a simple idea: make everyday life easier for Iranian and Persian-speaking communities in countries such as Italy, Germany, and the United Kingdom. Users can publish listings, search by country and city, chat with sellers or hosts, save searches, follow notifications, read local articles, and manage housing-related requests from one place.

Website: [bazaarino.com](https://bazaarino.com)

## Support

If Bazaarino helps your community or inspires your own marketplace work, you can support development through [GitHub Sponsors](https://github.com/sponsors/hesamhadadi). Sponsorship helps keep product work, maintenance, moderation tooling, and infrastructure improvements moving.

## What The Product Does

Bazaarino combines several related workflows into one platform:

- Classified listings for housing, vehicles, electronics, services, jobs, food, requests, and other everyday needs.
- Location-first search across supported European countries and cities.
- Real-time conversations between users, including unread counts and chat image upload.
- Housing and room reservation flows with date selection and host-side status management.
- Saved searches, favorites, profile pages, ratings, badges, and notifications.
- Persian-language news, articles, city landing pages, and SEO-friendly public content.
- Admin tooling for moderation, users, reports, banners, comments, articles, badges, landing pages, and city visuals.
- PWA support, web push notifications, and a companion mobile app scaffold under `mobile/`.

## Core Features

### Listings And Search

- Create, edit, moderate, and browse classified ads.
- Search by keyword, country, city, category, subcategory, price, listing mode, images, residence eligibility, availability, and housing-specific fields.
- Support for featured, urgent, bumped, sold, expired, approved, rejected, and pending listing states.
- Public ad detail pages with image galleries, seller context, rating actions, favorites, reports, and map previews for housing listings.
- Market-price enrichment for housing-related ads when price data is available.

### Countries, Cities, And Local Discovery

- City and country constants are centralized in `src/lib/constants.ts`.
- City-specific visual identity is managed through `src/lib/city-images.ts` and admin overrides.
- The public home page highlights categories, city groups, featured ads, recently viewed items, articles, and reservation entry points.
- City landing pages and generated sitemap/feed routes help the platform scale beyond a generic listing board.

### Messaging And Notifications

- Conversations and messages are modeled in MongoDB and surfaced through `/messages`.
- Socket.IO powers live chat behavior where the runtime supports it.
- Users can receive notification badges, unread counts, and push notifications.
- Chat image uploads are handled separately from listing image uploads.

### Housing Reservations

- The `/house-reservation` area supports reservation-oriented housing discovery.
- Reservation APIs track user requests and status changes.
- Date range selection supports localized calendar behavior.
- Housing listings include fields such as bills, agency fees, all-inclusive pricing, preferred roommate details, and availability.

### Admin Area

The admin area has been split into focused pages plus a legacy operations view:

- `/admin` gives a high-level operational overview.
- `/admin/legacy` keeps the heavier moderation tools for ads, users, reports, settings, banners, and housing city images.
- `/admin/banners` manages advertising placements.
- `/admin/articles` manages editorial content.
- `/admin/comments` moderates article comments.
- `/admin/badges` manages user badges.
- `/admin/pages` manages landing pages.
- `/admin/city-visuals` manages city imagery, gradients, accents, and image checks.

This gives operators both a fast dashboard and deeper operational controls without crowding every feature into one screen.

### Authentication And User Trust

- NextAuth handles user sessions.
- Users can register, log in, reset passwords, and manage profiles.
- Public profiles, ratings, badges, reports, and identity-related admin workflows help build marketplace trust.
- Middleware protects private and admin-only areas.

### Content And SEO

- News and article pages support public editorial content.
- Static informational pages include about, contact, FAQ, privacy, and terms.
- RSS/feed and sitemap routes are available.
- Metadata, Open Graph data, schema markup, and city/category pages support discoverability.

## Tech Stack

| Area | Technology |
| --- | --- |
| Web framework | Next.js 14, App Router |
| Language | TypeScript |
| UI | React, Tailwind CSS, lucide-react |
| Forms and validation | React Hook Form, Zod |
| Auth | NextAuth |
| Database | MongoDB, Mongoose |
| Realtime | Socket.IO |
| Maps | Leaflet, react-leaflet |
| Uploads | Cloudinary integration |
| Email | Nodemailer |
| Push | Web Push / VAPID |
| Dates | date-fns, react-multi-date-picker |
| Observability | Vercel Analytics, Speed Insights, optional Sentry integration |
| Mobile | Expo / React Native under `mobile/` |
| Deployment target | Vercel |

## Project Structure

```text
src/
  app/
    admin/                  Admin dashboard and management screens
    ads/                    Create, edit, and view listings
    api/                    App Router API routes
    auth/                   Login, registration, reset, phone login
    favorites/              Saved favorite listings
    house-reservation/      Housing reservation experience
    messages/               User conversations
    news/                   Articles and public editorial content
    notifications/          User notifications
    p/[slug]/               Dynamic landing pages
    profile/                User account pages
    saved-searches/         Saved search workflow
    search/                 Listing search and filters
    u/[id]/                 Public user profiles
  components/
    admin/                  Admin shell and command palette
    ads/                    Listing cards, galleries, actions
    articles/               Article rendering components
    home/                   Home page sections
    layout/                 Navbar, footer, bottom nav, banners
    maps/                   Housing map picker and preview
    notifications/          Notification UI
    providers/              Auth, brand, chat, push providers
    reservations/           Reservation UI
    search/                 Search-specific controls
    ui/                     Shared UI primitives
  lib/
    auth.ts                 NextAuth configuration
    mongodb.ts              Mongoose connection helper
    constants.ts            Countries, cities, categories
    city-images.ts          City visuals and fallbacks
    market-price.ts         Housing price enrichment
    notifications.ts        Notification helpers
    push-notifications.ts   Web push helpers
    socket-server.ts        Socket.IO server setup
    telegram.ts             Telegram integration helper
  models/                   Mongoose models
  pages/api/socket.ts       Socket.IO endpoint
  middleware.ts             Route protection

mobile/                     Expo / React Native app
scripts/                    Operational scripts
public/                     Static assets and PWA files
```

## Local Development

Install dependencies:

```bash
npm install
```

Optionally start the local MongoDB service:

```bash
npm run db:up
```

Create a local environment file using the project owner's private configuration as a reference. Do not commit environment files, secrets, API keys, tokens, database URLs, or production credentials.

Start the web app:

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Useful Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the production app |
| `npm start` | Start the production build |
| `npm run lint` | Run Next.js linting |
| `npm run db:up` | Start local MongoDB with Docker Compose |
| `npm run db:down` | Stop local MongoDB |
| `npm run db:logs` | Show local MongoDB logs |
| `npm run mobile:start` | Start the Expo development server |
| `npm run mobile:android` | Run the mobile app on Android |
| `npm run mobile:typecheck` | Type-check the mobile app |

## Mobile App

The `mobile/` directory contains the Expo / React Native client. It shares the same product domain as the web app and is intended to connect to the Bazaarino API.

See `mobile/README.md` for mobile-specific setup and build notes.

## Deployment Notes

Bazaarino is designed to run well on Vercel with MongoDB and external services configured through the hosting provider's secret management. Keep production configuration outside the repository.

Before deploying, verify:

- Required service credentials are configured in the deployment environment.
- MongoDB access is allowed from the deployment platform.
- File upload, email, push, auth, and optional analytics providers are available.
- Scheduled jobs and webhook endpoints are configured where needed.
- `npm run build` passes in the deployment environment.

## Operational Notes

- Admin pages are protected by server-side session checks and role checks.
- Public content routes should remain SEO-friendly and fast to render.
- Database-backed sitemap and feed routes should fail gracefully when the database is unavailable.
- Marketplace safety depends on moderation, reporting, ratings, and identity workflows working together.
- City visuals should always have safe fallbacks so broken external images do not break public pages.

## Author

Built by Hesam Hadadi.

- Website: [hesamhaddadi.com](https://hesamhaddadi.com)
- GitHub: [github.com/hesamhadadi](https://github.com/hesamhadadi)

# Dhampus Village Eco Lodge — Feature Requirements

**Product:** Public lodge website + Hotel / Restaurant / Accounts admin system  
**Property:** Dhampus Village Eco Lodge  
**Domain:** [dhampusecolodge.com](http://dhampusecolodge.com/)  
**Business email:** dhampusecolodge@gmail.com  
**Target go-live with staff:** 31 August 2026  
**Document date:** 24 August 2026  
**Status:** Gap analysis — requested vs built

---

## 1. Purpose

This document turns the lodge owner's product requests into a single requirements list, then marks each item against the current codebase.

**Sources**

- Owner feedback captured in chat (24 May–24 August 2026), mostly Nepali, filtered to website/system work only
- Current Next.js 16 app in this repo (`app/`, `components/`, `prisma/schema.prisma`)

**What this is not**

- A redesign of personal or office topics from that chat
- A promise that every screenshot-only request is fully specified — those are listed as open questions

---

## 2. Problem and goals

Dhampus Eco Lodge needs one live product that does two jobs:

1. **Guest website** — show the lodge, rooms, gallery, and take booking enquiries
2. **Operations system** — let lodge staff run rooms, restaurant/bar, inventory, checkout, and accounts without a second vendor tool

The owner has said another vendor was discussed internally, so this system has to be staff-ready, calculably correct, and live on the lodge domain.

### Business goals

- Staff can run daily operations from `/admin` by 31 August 2026
- Public site is live on `dhampusecolodge.com`
- Rates stay flexible: agents/companies get different prices than walk-in guests
- Nepal VAT (13%) is calculated as **inclusive** menu pricing, not added on top
- One booking can cover mixed room types and meal plans
- Kitchen, bar, and store stock stay connected so sales actually reduce inventory

### Product goals

- One booking workspace instead of several disconnected booking screens
- Dashboard shows *today* (check-ins, check-outs, occupied rooms, revenue), not only lifetime totals
- Site content (hero, gallery, logo) stays out of the operations workflow
- Staff get their own logins when the system is ready — not one shared admin account

---

## 3. Users

| User | Needs |
| --- | --- |
| Guest | Browse lodge, rooms, gallery; submit a booking request |
| Reception / lodge staff | Create bookings, assign rooms, check in/out, take restaurant orders, checkout bills |
| Restaurant / bar staff | Search menu, take orders, mark ready, attach to a room or take payment now |
| Store / inventory staff | Move stock from warehouse/store to bar; see low-stock alerts |
| Accounts | VAT-correct bills, company details on invoices, financial reports, credit |
| Owner / manager | Today's occupancy and revenue, business-partner rates, staff access |
| Admin / developer | Site CMS, media, domain, database, go-live |

---

## 4. What is already built

The repo is a working Next.js app with Prisma/PostgreSQL. A lot of the shell exists. Several owner rules are only partly implemented or calculated incorrectly.

### 4.1 Public website

| Area | Status | Where |
| --- | --- | --- |
| Home: hero, about, rooms, gallery, CTA, footer | Built | `app/page.tsx`, `components/hero.tsx`, `about.tsx`, `rooms.tsx`, `gallery.tsx`, `cta.tsx`, `footer.tsx` |
| Public booking form | Built | `app/booking/page.tsx` |
| Booking status page | Built | `app/booking/status/page.tsx` |
| Editable hero / gallery / logo | Built | `components/hero-media-manager.tsx`, `gallery-manager.tsx`, `site-settings-manager.tsx` |
| Room cards show **price per night** | Built (owner later asked to stop forcing this) | `components/rooms.tsx` |

### 4.2 Admin / operations

| Module | Status | Where |
| --- | --- | --- |
| Admin login (single shared account) | Built, not staff-ready | `app/admin/login/page.tsx` |
| Dashboard totals and charts | Built; missing today's ops summary | `components/dashboard-overview.tsx` |
| Bookings CRUD, room assign, status | Built | `components/bookings-manager.tsx` |
| Room types + room numbers | Built | `components/rooms-manager.tsx`, `room-inventory-manager.tsx` |
| Room status board (check-in/out today) | Built as its own page | `components/room-status-dashboard.tsx` |
| Business partners + rate cards (EP/BB/MAP/AP, SGL/DBL/TRPL) | Built | `components/business-partners.tsx`, `rate-card-manager.tsx` |
| Business / group-style bookings | Partial | `components/business-bookings.tsx` |
| Restaurant menu + orders | Built | `components/restaurant-manager.tsx` |
| Billing & checkout | Built; tax rules wrong | `components/billing-manager.tsx` |
| Inventory (single location) | Built | `components/inventory-manager.tsx` |
| Accounts + financial reports | Built | `components/accounts-manager.tsx`, `financial-reports.tsx` |
| Credits / vendors / purchases / sales | Built | Prisma models + related APIs |
| Notifications (browser + optional WhatsApp) | Partial | `lib/notifications.ts`, `lib/whatsapp.ts` |

### 4.3 Data model already in place

`prisma/schema.prisma` already has rooms, room numbers, bookings, businesses, rate cards with meal plans, restaurant orders, inventory, accounts, credits, staff, vendors.

Important gaps in that schema:

- `Booking.bookingType` only documents `"Bed Only" \| "Bed & Breakfast"` — no MAP/AP
- No occupancy type (`SGL` / `DBL` / `TRPL`) on the booking itself
- No group booking ID for “1 guest books 1 DBL + 2 SGL”
- Inventory has one `currentStock` and a free-text `storageLocation` — not store vs bar quantities
- `User.role` allows `"staff"` but login does not use it

---

## 5. Requirements vs current status

Status key: **Done** · **Partial** · **Missing** · **Broken**

### 5.1 Public website and go-live

| ID | Requirement (from owner) | Status | Notes |
| --- | --- | --- | --- |
| P1 | Public marketing site for the lodge | **Done** | Home + booking flow exist |
| P2 | Live on Vercel during development | **Done** | Multiple preview URLs were shared |
| P3 | Live on `dhampusecolodge.com` | **Missing** | Domain was confirmed 14 Aug; not wired as the production site from this repo's env |
| P4 | Real lodge photos on the site | **Partial** | Gallery CMS exists; owner asked staff to shoot photos at the property |
| P5 | Keep website CMS separate from HMS | **Partial** | Gallery / hero / settings exist, but they sit in the same admin sidebar as operations |
| P6 | Transfer / publish to the owner's website | **Missing** | Explicitly requested 2 Jun and again 24 Aug (“website mai live ni garihalam”) |
| P7 | Image hosting reliable enough for staff uploads | **Partial** | Image hosting failed during the 27 May deploy |

### 5.2 Access and staff readiness

| ID | Requirement | Status | Notes |
| --- | --- | --- | --- |
| A1 | Admin login | **Done** | `/admin` + `/admin/login` |
| A2 | Do not give the shared admin login to all staff until ready | **Partial** | Owner asked 27 May; still one hardcoded admin user |
| A3 | Staff-ready training / simple enough for lodge boys | **Missing** | Owner asked for a teachable handover before leaving Dhampus |
| A4 | Role-based users (admin vs staff) | **Missing** | `User.role` exists; login ignores it |

### 5.3 Rooms and occupancy

| ID | Requirement | Status | Notes |
| --- | --- | --- | --- |
| R1 | Room types + physical room numbers, used everywhere | **Partial** | Room numbers exist and are used in bookings / restaurant / billing. Occupancy flexibility is not. |
| R2 | A DBL (e.g. room 101, couple bed) can also be sold as single occupancy | **Missing** | Rate cards have SGL/DBL/TRPL rates, but bookings do not pick occupancy |
| R3 | Twin can be used as single; triple can be used by 2 guests | **Missing** | Public booking blocks guests above `room.capacity` |
| R4 | Remove forced “price per night” on admin / partner bookings | **Missing** | Owner: agents and direct guests have different rates. Admin booking still requires `price`. Public site still shows `$price per night`. Keep display price on the *public* site unless owner confirms otherwise. |

### 5.4 Bookings

| ID | Requirement | Status | Notes |
| --- | --- | --- | --- |
| B1 | Guest name, email, phone | **Done** | Public + admin forms |
| B2 | Room *type*, number of rooms, number of pax | **Partial** | Type exists. Pax and multi-room only on business bookings. Regular bookings are 1 room, no pax field. |
| B3 | Meal plan on every booking: EP, BB, MAP, AP | **Partial / Missing** | Rate cards have all four. Booking forms only have Bed Only and Bed & Breakfast. Owner repeated 23–24 Aug: “MAP-AP thapnu paryo”. |
| B4 | Meal plan meanings | Spec | **EP** room only · **BB** room + breakfast · **MAP** room + breakfast + dinner *or* lunch · **AP** room + breakfast + lunch + dinner |
| B5 | Booking source = Travel Agent or Company, then pick from business-partner list | **Partial** | Business bookings do this. Regular bookings only offer website / phone / walk-in. |
| B6 | Group booking: one guest books mixed rooms (1 DBL + 2 SGL) | **Partial** | Business form can add multiple rooms, but each room is saved as a separate booking with no group ID. Regular bookings cannot do this. |
| B7 | One booking page instead of separate booking + business + calendar screens | **Missing** | Sidebar still has Bookings, Business Bookings, and Room Status |
| B8 | Multi-currency rates: USD, NPR, INR | **Missing** | Accounts have a currency field. Bookings and rate cards do not. Owner repeated 23 Aug: “usd ra npr ma halna milne”. |
| B9 | Multi-select where the owner marked it (screenshot, 23 Aug) | **Missing** | Likely meal plans and/or currencies — confirm in review |
| B10 | Delete bookings / rates must work | **Broken** | Owner 24 Aug: cannot delete; rates are wrong |
| B11 | Booking calculations must match the entered rate | **Broken** | Owner 24 Aug: “calculation nai aile formula namilera thapera airako cha” |

### 5.5 Dashboard and notifications

| ID | Requirement | Status | Notes |
| --- | --- | --- | --- |
| D1 | Today's check-ins, today's check-outs, rooms occupied | **Missing** on Dashboard | Room Status has some of this. Overview only shows lifetime totals. |
| D2 | Copy like: “Today you have 1 check-in, 1 check-out and 3 rooms occupied” | **Missing** | Should feed the notification panel |
| D3 | Today's revenue on the dashboard | **Missing** | Overview revenue is all-time booking sum |
| D4 | Room Status can stay as a *summary*, not a second booking tool | **Partial** | Page exists; owner asked to fold booking actions into one bookings page |

### 5.6 Restaurant / bar

| ID | Requirement | Status | Notes |
| --- | --- | --- | --- |
| F1 | Menu upload and orders | **Done** | Menu + order dialogs exist |
| F2 | Search food items while taking an order | **Missing** | Order dialog lists all available items; no search. Asked 3 Jun and 23 Aug. |
| F3 | Attach an order to a room | **Done** | Linked to checked-in guests |
| F4 | Guest can pay now, or add to room bill and settle at checkout | **Partial** | `paymentMethod` includes `room_bill`. UX for “pay now vs later” is not a clear two-step. |
| F5 | Notify staff when order is marked **Ready** (for pickup) | **Missing** | Status value `ready` exists. Notification only fires on *new* order. |
| F6 | VAT-inclusive menu math (13%) | **Broken** | See §6. Current code *adds* 13% on top of the entered price. |
| F7 | Discount applies to the VAT-exclusive amount | **Broken** | Current code discounts the inclusive-looking subtotal, then adds tax again |
| F8 | Discount + VAT breakdown editable at **checkout**, not while taking the order | **Missing** | Discount/VAT are on the order form. Checkout hardcodes 10% service + 13% VAT. |
| F9 | Inventory deduction when items are sold | **Missing** | Code comment: “TODO: Inventory deduction…” |

### 5.7 Inventory (store + bar)

| ID | Requirement | Status | Notes |
| --- | --- | --- | --- |
| I1 | Two stock locations per item: **Store / warehouse** and **Bar** | **Missing** | One `currentStock` field only |
| I2 | Transfer store → bar (store minus, bar plus) | **Missing** | |
| I3 | Bar minus = a sale | **Missing** | |
| I4 | Stock room and menu stay connected | **Partial** | `InventoryItem.menuItemId` exists; sales do not decrement stock |

### 5.8 Billing / checkout

| ID | Requirement | Status | Notes |
| --- | --- | --- | --- |
| C1 | Combined room + restaurant bill at checkout | **Done** | `components/billing-manager.tsx` |
| C2 | Company name on the bill; if none, show **N/A** | **Missing** | Bill printout does not include `business` |
| C3 | Customize discount and VAT at checkout (same breakdown as §6) | **Missing** | Hardcoded 10% service charge + 13% VAT on (room + restaurant). Restaurant totals may already include tax → double tax. |
| C4 | Pay room and restaurant separately (cash / card / QR / credit) | **Partial** | Separate payment status/method fields exist |

### 5.9 Accounts and reports

| ID | Requirement | Status | Notes |
| --- | --- | --- | --- |
| $1 | Accounts module | **Done** | Income/expense, NPR conversion fields |
| $2 | Financial reports | **Done** | Purchase/sales VAT summaries exist |
| $3 | Reports must use the same VAT rules as restaurant/checkout | **Partial** | Reports exist; formulas are not the inclusive model the owner specified |

---

## 6. VAT and discount rules (must-fix)

Owner spec, 3 June 2026. Menu prices are **VAT inclusive**.

Example for a **NPR 550** menu item, 13% VAT, no discount:

1. Inclusive price = `550`
2. Exclusive amount = `550 / 1.13` = `486.726`
3. VAT amount = `486.726 * 0.13` = `63.274`
4. Line total (rounded) = `550`

If there is a discount:

1. Start from VAT-exclusive amount
2. Subtract discount from that exclusive amount
3. Recalculate VAT = `discounted_exclusive * 0.13`
4. Total = discounted exclusive + VAT (then round)

**Current code does the opposite**

```139:153:components/restaurant-manager.tsx
      const subtotal = orderData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
      // ...
      const afterDiscount = subtotal - discountAmount
      const tax = (afterDiscount * orderData.taxPercentage) / 100
      const total = afterDiscount + tax
```

Checkout then adds **another** 10% service + 13% VAT on room + restaurant (`components/billing-manager.tsx`). That is why totals “keep adding.”

**Acceptance**

- Entering 550 never becomes 550 + 13%
- Discount never reduces the VAT-inclusive figure first
- Checkout can override discount and VAT; it does not silently stack a second tax
- Printed bill shows: inclusive price, exclusive amount, discount, VAT amount, total

---

## 7. User stories for remaining work

### Go-live and website

- **As the owner**, I need the public site on `dhampusecolodge.com` so guests and agents stop using Vercel preview URLs.
- **As a guest**, I can browse rooms and send a booking request without seeing partner/agent rates.
- **As the owner**, I can edit hero, gallery, and logo without opening bookings or restaurant.

### Bookings

- **As reception**, I can create one booking with guest name, email, phone, pax, company (or N/A), meal plan (EP/BB/MAP/AP), currency (USD/NPR/INR), and one or more room types.
- **As reception**, I can sell room 101 (DBL couple bed) as single occupancy without changing the room type.
- **As reception**, I can enter a custom rate (or pick a partner rate card) instead of being forced to use the website nightly price.
- **As reception**, I can delete a booking or a bad rate without the action failing.
- **As a travel agent booking**, I pick the company from business partners and the bill shows that company.

### Dashboard

- **As the manager**, when I open Dashboard I see today's check-ins, check-outs, occupied rooms, and today's revenue.
- **As staff**, I get a notification in the form: “Today you have 1 check-in, 1 check-out and 3 rooms occupied.”

### Restaurant and inventory

- **As a waiter**, I can search the menu while taking an order.
- **As a waiter**, I attach the order to a room, or take payment now.
- **As kitchen/bar**, when I mark an order Ready, reception is notified to pick it up.
- **As store staff**, I transfer bottles from store to bar; bar sales reduce bar stock only.

### Billing

- **As accounts**, checkout lets me set discount and VAT using the inclusive formula.
- **As accounts**, the invoice shows company name or N/A.
- **As accounts**, room and F&B can be paid separately.

### Staff

- **As the owner**, I can give lodge staff a limited login that cannot wipe the site or see developer tools.
- **As staff**, I can be trained on one bookings page, not three.

---

## 8. Edge cases and error states

- Mixed occupancy: 2 guests in a triple; 1 guest in a DBL. Do not treat this as overbooking the *room number*.
- Group booking: if one of three rooms is cancelled, the other rooms stay under the same group.
- Overlap: two confirmed bookings cannot share the same room number on overlapping nights.
- Walk-in restaurant order: no room, pay now or leave unpaid; must still appear in billing.
- Checked-out guest: cannot add new room-service orders to that room number unless a new stay exists.
- Discount larger than exclusive amount: block the save and show an error.
- Zero-price admin booking: allowed (comp / house guest / rate entered later). Public site may still show a starting price.
- Missing company: bill prints **N/A**, never a blank company line.
- Currency: store the booking currency and the NPR equivalent (accounts already have `exchangeRate` / `amountNPR`).
- Delete: deleting a rate card or booking must fail clearly if invoices/orders exist; otherwise it must succeed.
- Empty dashboard day: show “0 check-ins, 0 check-outs, 0 occupied” — not an empty totals screen.

---

## 9. Suggested delivery order (before 31 August)

Must fix before staff go-live:

1. **VAT + checkout math** — stop double-adding tax; implement inclusive formula
2. **Meal plans MAP + AP** on booking forms (not only rate cards)
3. **Delete + rate edit** bugs the owner recorded on 24 Aug
4. **Dashboard today summary** + notification copy
5. **Menu search** on restaurant orders
6. **Company on bills** (or N/A)
7. **Occupancy + group booking** on one bookings page
8. **USD / NPR / INR** on rates and bookings
9. **Store vs bar stock** + sale deduction
10. **Order Ready** notification
11. **Staff logins** (after the above is stable)
12. **Domain + public site go-live** with real photos

---

## 10. Technical context

- **App:** Next.js 16 (App Router), React 19, Prisma 6, PostgreSQL
- **Public routes:** `/`, `/booking`, `/booking/status`
- **Admin:** `/admin` (tabbed shell), `/admin/login`
- **Schema:** `prisma/schema.prisma`
- **Likely schema changes for remaining work:**
  - `Booking`: `mealPlan` (`EP|BB|MAP|AP`), `occupancy` (`SGL|DBL|TRPL`), `currency`, `pax`, `groupId`, `businessId` on all booking types
  - `InventoryItem`: `storeStock` and `barStock` (or a location table)
  - `InventoryTransaction.type`: add `transfer`
  - `RestaurantOrder.status`: keep `ready`; notify on that transition
  - Shared VAT helper used by restaurant, billing, and reports — do not duplicate formulas
- **Auth today:** `sessionStorage` + hardcoded fallback in `app/admin/login/page.tsx`. Not safe for staff rollout.
- **Notifications today:** `localStorage` only, so they are per-browser, not shared across staff machines.

---

## 11. Open questions

1. Public room cards: keep “starting from $X / night” for guests, and only remove the forced price inside admin/partner bookings? (Developer said the frontend still needs a price; owner said remove the compulsion because agent rates differ.)
2. MAP: is “breakfast + dinner **or** lunch” a single MAP rate, or two MAP variants?
3. 23 Aug “multiple select” screenshot: meal plans, currencies, rooms, or all three?
4. Should checkout keep a **service charge**? Owner specified 13% VAT only. Current billing adds 10% service as well.
5. INR: same rate-card rows as USD/NPR, or convert from NPR with a daily rate?
6. Which HMS reference site from 3 Jun should we still match for layout?
7. What exactly should be removed from the public site (“yo ni hataidey”, 3 Jun screenshot)?
8. Production database: this repo has no `.env`; go-live needs `DATABASE_URL` and media hosting before staff use it for real.

---

## 12. Out of scope (unless owner reopens)

- Building a second system because another vendor was mentioned in the office
- Privacy / terms / cookie pages (footer links are placeholders)
- Online payment gateways (eSewa / Khalti were only mentioned in a personal transfer, not as a lodge checkout feature)
- Full rewrite of accounts if VAT and checkout are corrected first

---

## 13. Acceptance for “staff live”

The system is ready for lodge staff when all of the following are true:

- A staff member can create a mixed booking (rooms + meal plan + company + currency) and delete a mistaken one
- Restaurant search works; an order can go to a room bill or be paid now; Ready notifies pickup
- A 550 inclusive item never bills as 550 + VAT
- Checkout shows company or N/A, and discount/VAT can be adjusted there
- Dashboard answers “what is happening today?”
- Store and bar stock move correctly
- Public site is on `dhampusecolodge.com`
- Staff are not sharing one admin password

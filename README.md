# CyberPeace Cafe — Event Pass System

Next.js event entry platform with admin dashboard, QR pass emails, mobile staff scanner, and attendance reports.

## Modules

### Admin Dashboard
- Create attendees or bulk upload CSV/Excel
- Configure ticket categories and allowed event dates
- Generate QR passes and resend emails
- View total registered / checked-in / remaining

### Email & QR Pass
- Unique QR per attendee (`qrcode`)
- Email via ZeptoMail SMTP (`smtp.zeptomail.in`)
- Ticket ID, event date, venue, category
- Email status + resend

### Mobile Staff Scanner
- Staff login → camera scan (`html5-qrcode`)
- Instant verification result
- Authorized categories only
- Blocks duplicate scans and wrong-date entries

### Entry Reports
- Name, category, check-in time, verifying staff
- Category-wise attendance
- CSV export

## Ticket categories

| Pass type | Entry rule |
|---|---|
| VIP Pass | Assigned date + VIP authorization |
| Media Pass | Assigned date + Media authorization |
| Organiser Pass | Assigned date + Organiser authorization |
| Finalist Pass | Assigned date + Finalist authorization |
| Audience Pass | Assigned date + Audience authorization |

Admin can set a single day or a multi-day date range per pass.

## Stack

- Website: Next.js + Tailwind CSS
- Backend: Next.js API Routes
- Database: MongoDB Atlas (or local MongoDB)
- QR: `qrcode`
- Scanner: `html5-qrcode`
- Email: ZeptoMail SMTP
- Hosting: Vercel

## Setup

```bash
cp .env.example .env.local
# fill MONGODB_URI, JWT_SECRET, SMTP_* values

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. Login page pe jaake pehle **Seed Admin/Staff** dashboard se chalayein (admin login ke baad), ya:

```bash
curl -X POST http://localhost:3000/api/seed
```

Default accounts (override via `.env.local`):

- Admin: `admin@cyberpeace.org` / `Admin@12345`
- Staff: `staff@cyberpeace.org` / `Staff@12345`

## Bulk CSV columns

`name,email,phone,category,eventDate,validFrom,validTo,venue`

Valid categories: `VIP Pass`, `Media Pass`, `Organiser Pass`, `Finalist Pass`, `Audience Pass`

## Deploy (Vercel)

1. Push repo to GitHub
2. Import on Vercel
3. Add env vars from `.env.example`
4. Set `MONGODB_URI` to MongoDB Atlas connection string
5. Deploy

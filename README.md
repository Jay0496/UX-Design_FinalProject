# FinancePro - Financial Freedom Starts Here

A Next.js application with Supabase authentication and Google social sign-in. FinancePro gives you a complete, real-time picture of your money, making budgeting, goal setting, and debt payoff stress-free.

## Tech Stack

- **React** - UI library
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Backend, database, and authentication
- **Google OAuth** - Social sign-in

## Getting Started

### Prerequisites

- Node.js 18+ installed

### Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

   The landing page will be displayed with the Navbar and Footer automatically included on all pages.

## Current Status

**Note:** This project is currently set up for **frontend-only development** with mock data. All authentication and data operations are mocked. Supabase integrations have been removed for now and can be added back later when needed.

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/              # Authentication routes
│   │   ├── dashboard/         # Protected dashboard page
│   │   ├── login/             # Login page
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── Navbar.tsx        # Navigation bar (reusable)
│   │   ├── Footer.tsx        # Footer component (reusable)
│   │   └── LogoutButton.tsx
│   ├── lib/
│   │   └── supabase/          # Supabase client utilities
│   │       ├── client.ts      # Browser client
│   │       ├── server.ts      # Server client
│   │       └── middleware.ts  # Middleware utilities
│   └── middleware.ts          # Next.js middleware
├── .env.local.example          # Environment variables template
└── package.json
```

## Features

- ✅ Next.js 14 with App Router
- ✅ TypeScript configuration
- ✅ Tailwind CSS styling
- ✅ Beautiful landing page with hero, features, and testimonials
- ✅ Reusable Navbar and Footer components (included on all pages via layout)
- ✅ Mock authentication (frontend-only, ready for backend integration later)
- ✅ Mock user data for development

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Mock Data

Currently, all user data is mocked:
- User: Jane Doe (jane.doe@example.com)
- Authentication is simulated (no real backend calls)
- All routes are accessible without authentication

When ready to add backend functionality, you can integrate Supabase or another backend service.

## Next Steps

1. Continue building out frontend pages and components
2. Add more mock data as needed for development
3. When ready, integrate Supabase or your preferred backend
4. Deploy to Vercel or your preferred hosting platform

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)


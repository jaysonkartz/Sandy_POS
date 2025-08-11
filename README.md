# Sandy_POS

A modern Point of Sale (POS) web application built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- Customer and Admin dashboards
- Product and Category management
- Order and Cart functionality
- User authentication (login/signup)
- Pricing management
- Responsive UI with Tailwind CSS
- Supabase integration for backend and authentication

## Tech Stack

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)
- [PNPM](https://pnpm.io/)

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PNPM

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jaysonkartz/Sandy_POS.git
   cd Sandy_POS
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local` and fill in your Supabase credentials and other required variables.

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `app/` - Main application pages and routes
- `components/` - Shared React components
- `context/` - React context providers (e.g., CartContext)
- `types/` - TypeScript type definitions
- `public/` - Static assets and images
- `lib/` - Utility functions and Supabase client
- `ui/` - UI components and styles

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## License

MIT

---

Feel free to contribute or open issues!
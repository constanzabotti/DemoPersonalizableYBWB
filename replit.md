# You Better Work B*tch - Fitness Training Platform

## Overview

A fitness training platform connecting personal trainers with their students. The application features workout routine management, wellness check-ins with smart intensity adjustment, gamification through points and rewards, real-time messaging, and payment tracking. Built as a full-stack TypeScript application with React frontend and Express backend, using PostgreSQL for data persistence and Replit Auth for authentication.

## User Preferences

Preferred communication style: Simple, everyday language.
All content in Spanish with proper accents.
Copyright: Constanza Botti.

## Recent Changes

### January 2026 - Cyber-Boutique Theme & Gamification
- **Visual Design**: Updated to "Cyber-Boutique" aesthetic with pure black (#000000) background, neon green (#00FF41), electric cyan gradients, glassmorphism cards, and micro-animations
- **Wellness Check-ins**: Daily check-in page with sleep/stress/energy ratings (1-5 scale) that auto-calculate recommended workout intensity and award 10 points
- **Rewards System**: Points and rewards page with 3-tier unlock system (100/300/680 points), circular progress indicators, transaction history
- **Payments Enhancement**: Added period types (class/week/month) and Cash as fourth payment option alongside Card/Venmo/Zelle
- **Navigation**: Added Bienestar and Recompensas links for students
- **Branding**: Consistent "you better work b*tch!" branding across all pages

## Gamification System
- **Points Awards**: 25 pts per workout completion, 10 pts per wellness check-in
- **Reward Tiers**: 
  - 100 pts: Guía de Snacks Saludables
  - 300 pts: Rutina AB Premium  
  - 680 pts: Sesión 1:1 con tu Trainer

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state caching and synchronization
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom "Cyber-Boutique" theme (black background with neon green accents)
- **Build Tool**: Vite with hot module replacement
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **HTTP Server**: Node.js createServer wrapping Express
- **API Design**: REST endpoints defined in `shared/routes.ts` with Zod schema validation
- **Authentication**: Replit Auth via OpenID Connect with Passport.js strategy
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Managed via `drizzle-kit push` command

### Key Data Models
- **Users/Sessions**: Mandatory Replit Auth tables for user identity and session management
- **Profiles**: Role-based profiles (trainer or student) with bio, goals, and stats
- **Routines/Exercises**: Trainer-created workout plans assigned to students
- **Wellness Check-ins**: Daily sleep, stress, and energy tracking for smart intensity adjustment
- **Points/Rewards**: Gamification system with point transactions and workout completions
- **Messages**: Direct messaging between trainers and students
- **Payments**: Payment tracking with status management

### Authentication Flow
1. User initiates login via `/api/login` (Replit Auth)
2. OpenID Connect flow handled by Passport.js
3. User data upserted to `users` table on successful auth
4. Session stored in PostgreSQL `sessions` table
5. Protected routes check `req.isAuthenticated()` middleware
6. New users without profiles redirected to onboarding modal to select role

### Build & Development
- **Development**: `npm run dev` runs tsx for server with Vite middleware for client
- **Production Build**: `npm run build` compiles client with Vite and bundles server with esbuild
- **Database Sync**: `npm run db:push` pushes schema changes to PostgreSQL

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage adapter for Express sessions

### Authentication
- **Replit Auth**: OpenID Connect provider for user authentication
- **Required Environment Variables**: 
  - `ISSUER_URL` (defaults to https://replit.com/oidc)
  - `REPL_ID` (provided by Replit)
  - `SESSION_SECRET` (for session encryption)
  - `DATABASE_URL` (PostgreSQL connection string)

### UI Component Libraries
- **Radix UI**: Headless accessible component primitives (dialog, dropdown, tabs, etc.)
- **shadcn/ui**: Pre-styled component system using Radix + Tailwind
- **Lucide React**: Icon library

### Development Tooling
- **Replit Vite Plugins**: Runtime error overlay, cartographer, and dev banner for Replit environment
- **TypeScript**: Strict mode enabled with bundler module resolution
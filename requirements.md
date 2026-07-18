## Packages
framer-motion | Smooth animations for page transitions and modal entries
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging Tailwind classes efficiently

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["'Outfit', sans-serif"],
  body: ["'DM Sans', sans-serif"],
}

Auth:
- Login via /api/login (Replit Auth)
- Logout via /api/logout
- Protected routes require checking `useAuth()`
- If user has no profile, redirect to onboarding flow

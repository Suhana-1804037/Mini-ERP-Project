# Mini ERP System

A production-ready Mini ERP System built with React, TypeScript, Tailwind CSS, React Router, and Supabase.

## Live URL
- Placeholder: https://mini-erp-project-git-main-suhanabintarashid.vercel.app/login

## GitHub URL
- Placeholder: https://github.com/Suhana-1804037/Mini-ERP-Project

## Features
- Authentication with Supabase Auth
- Protected routes and app access control
- Dashboard with summary metrics
- Product CRUD with stock management
- Customer CRUD
- Supplier CRUD
- Purchase management with stock increase
- Sales management with stock reduction and sale validation
- Invoice preview after sale creation
- Reports with search capability

## Tech Stack
- React + Vite
- TypeScript
- Tailwind CSS
- React Router
- Supabase
- Shadcn-style UI components

## Setup Instructions
1. Clone the repository
2. Install dependencies with npm install
3. Create a Supabase project
4. Add environment variables
5. Run the app with npm run dev

## Supabase Setup
1. Create a new Supabase project
2. Open SQL Editor and run the contents of supabase-schema.sql
3. Enable email auth in Authentication > Providers
4. Set the environment variables below

## Environment Variables
Create a .env file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Architecture Overview
The app is organized into reusable UI components, route-based pages, shared types, and a Supabase client module. Core business flows live in the dashboard, inventory, purchasing, sales, and reporting pages.

## AI Tools Used
- GitHub Copilot for code generation and UI scaffolding
- Vite for project initialization
- Supabase for backend and auth

## Prompting Workflow Summary
- Generate project structure and dependencies
- Implement authentication and protected routes
- Build CRUD modules for products, customers, suppliers, purchases, and sales
- Add reports and invoice preview
- Polish UI and prepare deployment notes

## Challenges Faced and Solutions
- Supabase environment configuration was handled through a dedicated client module and environment variables
- Stock updates were implemented through purchase and sales handlers to keep inventory consistent
- Responsive UI was built with reusable Tailwind-based components for a clean assessment-ready experience

## Total Development Time
- Placeholder: 4-6 hours

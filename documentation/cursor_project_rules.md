## Project Overview

*   **Type:** cursor_project_rules
*   **Description:** Visiona is a web-based platform for creative professionals and enthusiasts to easily create AI clones of themselves using custom-trained models with their photos. The app streamlines AI model training, image generation, and gallery management with a modern, intuitive user interface that emphasizes creativity, security, and ease of use.
*   **Primary Goal:** Deliver a modern and user-friendly experience that encourages iterative creative exploration, automating complex AI model training and image generation processes while ensuring secure user authentication and scalable architecture.

## Project Structure

### Framework-Specific Routing

*   **Directory Rules:**

    *   **Next.js 14 (App Router):** Utilize the `app/` directory structure with nested route folders, following the `app/[route]/page.tsx` conventions.
    *   Example 1: "Next.js 14 (App Router)" → `app/[route]/page.tsx` conventions
    *   Example 2: "Next.js (Pages Router)" → `pages/[route].tsx` pattern
    *   Example 3: "React Router 6" → `src/routes/` with `createBrowserRouter`

### Core Directories

*   **Versioned Structure:**

    *   **app/api:** Used for API routes (Next.js 14 API routes with Route Handlers).
    *   **app:** Houses the main routing, authentication pages, and core layouts following Next.js 14 App Router conventions.
    *   **components:** Directory for reusable UI components and providers (e.g., Clerk and Tanstack clients) following the CodeGuide Starter Pro structure.

### Key Files

*   **Stack-Versioned Patterns:**

    *   **app/layout.tsx:** Next.js 14 root layout integrating global styles, authentication providers, and shared components.
    *   **app/page.tsx:** Main landing page for Visiona featuring modern UI and call-to-action elements.
    *   **app/api/webhooks/route.ts:** Example of Next.js API route using serverless functions for handling integrations such as Stripe webhooks.

## Tech Stack Rules

*   **Version Enforcement:**

    *   **next@14:** App Router is required. Do not use deprecated patterns like `getInitialProps`.
    *   **Tailwind CSS:** Utilize a utility-first approach with production optimizations in the Tailwind configuration.
    *   **Typescript:** Enforce strict type checking with clear interface definitions and documentation.
    *   **Supabase:** Follow row-level security, encryption, and backup guidelines to protect user data.
    *   **Shadcn UI:** Adhere strictly to component accessibility and theming guidelines provided by the library.
    *   **Clerk Auth:** Use Clerk's secure authentication patterns to protect user sessions and account data.
    *   **Open AI:** Securely manage API keys and integrate GPT-4/Claude for prompt enhancement with error handling.
    *   **React-Toastify:** Ensure non-intrusive notifications with proper placement and styling.
    *   **Replicate:** Integrate the Flux LoRA trainer using optimized defaults with proper asynchronous handling.
    *   **Vercel:** Deploy with serverless architecture, ensuring scalability and performance monitoring.

## PRD Compliance

*   **Non-Negotiable:**

    *   "Visiona is a web-based platform designed to empower creative professionals and enthusiasts to easily create AI clones of themselves using custom-trained models based on their photos." → Enforce secure authentication, streamlined AI model training, detailed image generation with prompt enhancement, and tiered usage quotas as described in the PRD.

## App Flow Integration

*   **Stack-Aligned Flow:**

    *   Example: "Next.js 14 Auth Flow" → Routes like `app/auth/login/page.tsx` and `app/auth/signup/page.tsx` are used for Clerk-powered authentication, while model training, image generation, and gallery management are seamlessly integrated within the app's nested folder structure.

## Best Practices

*   **Next js**

    *   Use the App Router and server components by default.
    *   Maintain a clear separation between server and client code.
    *   Leverage Next.js 14 features for optimized performance and SEO.

*   **Tailwind CSS**

    *   Use utility-first classes to build responsive designs quickly.
    *   Optimize CSS by purging unused classes in production.
    *   Extend default themes to match Visiona’s branding (deep black, dark grey, light blue, and pink gradients).

*   **Typescript**

    *   Enable strict type checking and linting.
    *   Use well-defined interfaces and types across the project.
    *   Document component and function contracts for maintainability.

*   **Supabase**

    *   Implement row-level security to ensure data privacy.
    *   Manage API interactions using Supabase Client libraries.
    *   Regularly backup data and monitor access logs for compliance.

*   **Shadcn UI**

    *   Follow component documentation for integration with Next.js.
    *   Ensure components adapt to dark mode and custom theming.
    *   Prioritize accessibility and responsiveness in UI design.

*   **Clerk Auth**

    *   Utilize secure authentication flows and manage user sessions.
    *   Regularly update Clerk configurations to reflect best security practices.
    *   Integrate Clerk providers seamlessly within the Next.js app layout.

*   **Open AI**

    *   Secure API keys and use environment variables for configuration.
    *   Handle prompt enhancement asynchronously with error handling.
    *   Optimize prompts for effective image generation results.

*   **React-Toastify**

    *   Use consistent notification styling and positioning.
    *   Provide clear user feedback without interrupting the user experience.
    *   Configure automatic dismissal timings for alerts.

*   **Replicate**

    *   Leverage default optimized training parameters for the Flux LoRA trainer.
    *   Implement asynchronous job handling and notify users via React-Toastify.
    *   Monitor training progress and handle errors gracefully.

*   **Vercel**

    *   Deploy with serverless architecture to enable scalability.
    *   Monitor performance with Vercel analytics and error tracking.
    *   Optimize build configurations for faster load times.

## Rules

*   Derive folder/file patterns directly from techStackDoc versions.
*   If Next.js 14 App Router: Enforce `app/` directory with nested route folders.
*   If Pages Router: Use `pages/*.tsx` flat structure.
*   Mirror this logic for React Router, SvelteKit, etc.
*   Never mix version patterns (e.g., no `pages/` in App Router projects).

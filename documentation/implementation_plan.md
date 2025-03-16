# Implementation plan

## Phase 1: Environment Setup

1.  Clone the CodeGuide Starter Pro repository to create a new project called “Visiona” using the CodeGuide Starter Pro Kit (Project Document: CodeGuide Starter Pro Kit).
2.  Verify the project uses Next.js 14 (app router) by checking the version in `package.json` (Project Document: Tech Stack). Note: Ensure it’s exactly Next.js 14 for compatibility with AI coding tools.
3.  Install required Node.js dependencies using `npm install` in the project root (Project Document: CodeGuide Starter Pro Kit).
4.  Set up a Git repository with `main` and `dev` branches and enable branch protection rules on GitHub (Project Document: CodeGuide Starter Pro Kit).
5.  **Validation**: Run `npm run dev` and confirm that the starter project loads at `http://localhost:3000`.

## Phase 2: Frontend Development

1.  Create the Landing Page component at `/app/page.tsx` and apply the deep black (primary) and dark grey (secondary) background color as specified (Project Document: Branding).

2.  Set up Clerk authentication pages by integrating Clerk components in `/app/auth/` for login, signup, and account management (Project Document: Core Features, Authentication Pages).

3.  Create the Dashboard page at `/app/dashboard/page.tsx` that provides areas for photo upload and model training status (Project Document: App Structure).

4.  Develop a photo upload component in `/app/components/PhotoUpload.tsx` with drag-and-drop functionality, validating JPEG/PNG files and file sizes (Project Document: User Workflow, Photo Upload).

5.  Add a form field in the photo upload component for entering a unique trigger word (3-15 chars, no spaces) with real-time validation in `/app/components/TriggerWordInput.tsx` (Project Document: User Workflow, Trigger Word).

6.  Create a progress indicator component in `/app/components/TrainingStatus.tsx` that displays statuses: Queued, Processing, and Finalizing (Project Document: User Workflow, Model Training).

7.  Integrate React-Toastify for notifications by configuring it in `/app/components/ToastContainer.tsx` and adding sample notifications for training completions (Project Document: Core Features, Notifications).

8.  Design an image generation interface in `/app/image-generation/page.tsx` which includes:

    *   Input fields for prompt description
    *   Dropdowns for Model Selection and Presets (e.g., Photorealistic, Artistic, Cinematic, Anime/Stylized)
    *   Fields for negative prompt, number of images, dimensions/aspect ratio, and guidance scale (Project Document: Image Generation - Prompt Requirements).

9.  Create an “Enhance Prompt” button in the image generation page that, when clicked, will call the AI prompt enhancement API endpoint (Project Document: GPT-4o/Claude Integration).

10. Build a Gallery page at `/app/gallery/page.tsx` displaying user images with details (thumbnail, prompt, date, model) and controls (download, delete) using shadcn/ui components (Project Document: Gallery Management).

11. Integrate Tailwind CSS and Shadcn UI to enforce the modern, minimalist aesthetic and the branding typography ("Inter" for all text with varying weights) and teal (#1eb8cd) as the primary accent color (Project Document: Branding).

12. Integrate React-Toastify notifications within all key UI actions (e.g., training completion, upload success) (Project Document: Core Features, Notifications).

13. **Validation**: Start the development server and manually verify that all pages (Landing, Auth, Dashboard, Image Generation, Gallery) render with correct styling and basic UI functionality.

## Phase 3: Backend Development

1.  Configure Next.js API routes under `/pages/api/` to handle backend logic (Project Document: Backend & Storage).
2.  Set up environment variables for connecting to Supabase (PostgreSQL and Storage), Clerk, Replicate, GPT-4o/Claude, and Stripe; add these to `.env.local` (Project Document: Backend & Storage).
3.  Create an API endpoint for photo uploads at `/pages/api/upload.ts` that performs server-side validation (JPEG/PNG, file size) and stores files in Supabase Storage (Project Document: Photo Upload Validation).
4.  Develop an API endpoint at `/pages/api/train-model.ts` to initiate AI model training via Replicate’s Flux LoRA trainer using fixed parameters (steps: 1000, LoRA rank: 16, optimizer: adamw8bit, batch size: 1, resolution options, learning rate: 0.0004, caption dropout: 0.05, autocaption enabled) (Project Document: Training Parameters).
5.  Implement an API endpoint at `/pages/api/generate-image.ts` that accepts text prompts (including the mandatory trigger word, scene description, style, etc.) and controls (model selection, negative prompt, number of images, dimensions, guidance scale) to generate images (Project Document: Image Generation - Prompt Requirements).
6.  Create an API endpoint at `/pages/api/enhance-prompt.ts` that integrates with GPT-4o/Claude for AI-powered prompt enrichment (Project Document: GPT-4o/Claude Integration).
7.  Develop Supabase integration logic to enforce user quotas and tiered limits (Free: 5 models lifetime, 20 daily generations; Premium: unlimited) in `/lib/quota.ts` (Project Document: User Quotas & Limits).
8.  Create a Stripe webhook endpoint at `/pages/api/stripe-webhook.ts` to handle subscription lifecycle events (e.g., upgrades, cancellations) and update user tiers accordingly (Project Document: Payment Integration).
9.  Build an API route at `/pages/api/gallery.ts` to fetch gallery data for authenticated users from Supabase (Project Document: Gallery Management).
10. Configure Supabase Row-Level Security (RLS) policies to restrict gallery and user data to authenticated owners (Project Document: Data Security & Compliance).
11. Apply encryption techniques for sensitive data (e.g., API keys) within backend functions (Project Document: Data Security & Compliance).
12. **Validation**: Use Postman or curl to test all API endpoints (upload, train-model, generate-image, enhance-prompt, stripe-webhook, gallery) ensuring they return expected results.

## Phase 4: Integration

1.  Integrate Clerk authentication in both frontend components and backend API routes so that endpoints confirm user identity (Project Document: Core Features, Authentication).
2.  Connect the Photo Upload component in the frontend to the `/api/upload.ts` endpoint via fetch or Axios (Project Document: User Workflow, Photo Upload).
3.  Wire the Dashboard training status component to fetch training progress updates from the `/api/train-model.ts` endpoint (Project Document: User Workflow, Model Training).
4.  Connect the Image Generation interface with the `/api/generate-image.ts` endpoint, ensuring proper transmission of all mandatory prompt fields and control parameters (Project Document: Image Generation - Prompt Requirements).
5.  Integrate the “Enhance Prompt” button to call the `/api/enhance-prompt.ts` endpoint and update the input field with the enhanced prompt returned (Project Document: GPT-4o/Claude Integration).
6.  Implement real-time quota checks by invoking the Supabase logic in `/lib/quota.ts` whenever users attempt model training or image generation (Project Document: User Quotas & Limits).
7.  Connect Stripe payment frontend actions (e.g., subscription upgrade buttons) with the Stripe webhook endpoint to reflect user subscription status (Project Document: Payment Integration).
8.  **Validation**: Perform an end-to-end test: Authenticate, upload photos, request model training, generate images, and simulate a Stripe event; verify that all components communicate correctly.

## Phase 5: Deployment

1.  Configure Vercel deployment by adding a `vercel.json` file at the project root with appropriate settings for Next.js (Project Document: Deployment).
2.  Set the required environment variables (Supabase, Clerk, Replicate, GPT-4o/Claude, Stripe) in the Vercel dashboard (Project Document: Backend & Storage).
3.  Deploy the project to Vercel using the command `vercel --prod` (Project Document: Deployment).
4.  **Validation**: Visit the deployed URL and ensure the Landing Page and key functionalities (authentication, dashboard, image generation) work as expected.
5.  Integrate Sentry for audit logging by configuring Sentry in the project as per guidelines and ensure error logging is active (Project Document: Data Security & Compliance).
6.  Implement exponential backoff retry logic on the backend API endpoints for Replicate and GPT-4o/Claude calls to handle API rate limits (Project Document: Key Considerations, API Rate Limits).
7.  Set up CORS middleware in the Next.js API routes to allow secure requests from the deployed frontend (Project Document: Data Security & Compliance).
8.  Schedule Supabase database backups and confirm the 30-day retention policy via Supabase settings (Project Document: Data Security & Compliance).

## Phase 6: Testing & Documentation

1.  Write unit tests for critical frontend components (PhotoUpload, TriggerWordInput, TrainingStatus) and place them in `/tests/components/` (Project Document: CodeGuide Starter Pro Kit).
2.  Write integration tests for API endpoints (upload, train-model, generate-image, enhance-prompt, stripe-webhook) in `/tests/api/` (Project Document: Backend & Storage).
3.  Document all API endpoints, environment configurations, and deployment steps in the repository README file (Project Document: CodeGuide Starter Pro Kit).
4.  **Validation**: Run the full test suite (both unit and integration tests) and verify that all tests pass, ensuring complete coverage of critical features such as quota enforcement and payment subscription updates (Project Document: Q&A, Pre-Launch Checklist).

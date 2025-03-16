# Project Requirements Document - Visiona

## 1. Project Overview

Visiona is a web-based platform designed to empower creative professionals and enthusiasts to easily create AI clones of themselves using custom-trained models based on their photos. The application simplifies the process of building personalized AI models so that users can generate images featuring their likeness. It is aimed at hobbyists, content creators, social media users, and anyone curious about AI-generated visual scenarios.

The platform is being built to bridge the gap between technology and self-expression. By automating complex processes such as AI model training and image generation, Visiona offers an intuitive experience that lets users focus on their creativity. Key success criteria include secure user authentication, seamless model training via photo uploads, an engaging interface for prompt-based image generation with AI enhancements, and a smooth upgrade path for premium features. The ultimate goal is to deliver a modern and user-friendly experience that encourages iterative creative exploration.

## 2. In-Scope vs. Out-of-Scope

**In-Scope:**

*   User authentication and account management using Clerk.
*   Intuitive onboarding with a sleek landing page and clear calls to action.
*   Dashboard with options for photo uploads, monitoring model training, and managing generated images.
*   Photo upload functionality with drag-and-drop support and guidelines.
*   AI model training interface using Replicate's Flux LoRA trainer with optimized default parameters.
*   Image generation feature based on text prompts that include a unique trigger word.
*   Prompt enhancement with GPT-4 or Claude to help refine user prompts.
*   Gallery management for viewing, organizing, and downloading generated images.
*   Implementation of user quotas and tiered daily usage limits (free and premium tiers).
*   Payment integration with Stripe for managing subscription models.
*   Data security measures including row-level security, encryption, and backup policies.
*   Deployment on Vercel with scalability considerations for Supabase.

**Out-of-Scope:**

*   Advanced user-customizable training parameters beyond the optimized defaults (reserved for a future version).
*   Complex sharing options or public/private toggles for images in the MVP (basic download and manual sharing only).
*   Extensive admin panels or additional roles beyond Free and Premium user levels.
*   Social sharing integrations or collections management in the gallery (will be addressed later).
*   Overly complex AI recommendation systems beyond prompt enhancement.
*   Support for payment providers other than Stripe in the initial release.

## 3. User Flow

When a user first visits Visiona, they are greeted by a modern landing page that highlights the platform’s unique ability to create personalized AI clones. New users are invited to sign up or log in via an intuitive authentication process powered by Clerk. After signing in, they are seamlessly onboarded to a personalized dashboard where they can see a clear overview of their accounts, including model training status and usage limits with friendly upgrade prompts.

From the dashboard, users can navigate to the Train Model section, where they upload a series of photos using an easy drag-and-drop interface. They are then prompted to assign a unique trigger word, which will later be used in image generation prompts. Once the user starts the training, a progress indicator keeps them informed about the process (queued, processing, finalizing), and notifications are sent via React-Toastify. Following successful training, users can enter the Image Generation section where they craft detailed prompts, enhance them with AI if needed, and view their generated images in an organized gallery.

## 4. Core Features

*   **User Authentication and Profile Management:**\
    Secure sign-up, login, and account personalization managed via Clerk.
*   **Photo Upload and Model Training:**\
    Drag-and-drop photo upload with guidelines; creation of a unique trigger word; initiation and monitoring of AI model training using Replicate’s Flux LoRA trainer.
*   **Image Generation:**\
    Text prompt-based generation including fields for trigger word, scene description, style, clothing, and lighting; controls for model selection, image dimensions, and guidance scale.
*   **AI Prompt Enhancement:**\
    Integration with GPT-4 or Claude to refine and enrich user prompts on demand.
*   **Gallery Management:**\
    Chronologically organized gallery displaying thumbnails, prompt details, dates, and models; options to view, download, and delete images.
*   **User Quotas and Tiered Access:**\
    Free tier with limits (5 models lifetime, 20 generations a day) and premium tier features (unlimited usage, higher processing priority) with clear UI indicators.
*   **Payment and Subscription Integration:**\
    Implementation of Stripe for secure payment processing; support for monthly and annual subscription models.
*   **Data Security & Compliance:**\
    Encryption, row-level security using Supabase, and backup policies in place; compliance with GDPR and CCPA standards.

## 5. Tech Stack & Tools

*   **Frontend:**

    *   Next.js 14 with the app router, React, and TypeScript.
    *   Tailwind CSS for rapid styling and responsive design.
    *   shadcn/ui for pre-built UI components.
    *   React-Toastify for notifications.

*   **Backend & Storage:**

    *   Next.js API Routes running on a serverless backend.
    *   Supabase for PostgreSQL database, storage for media files, and secure row-level security policies.

*   **AI Model Training & Integration:**

    *   Replicate’s Flux LoRA trainer to manage AI model training.
    *   Integration with GPT-4 or Claude for prompt enhancement and AI recommendations in the image generation process.

*   **Authentication:**

    *   Clerk for securing user authentication and account management.

*   **Deployment:**

    *   Vercel for hosting the web application.

*   **Development Tools:**

    *   Cursor for an AI-powered coding IDE with real-time suggestions.
    *   CodeGuide Starter Pro as the starter kit for project structure and best practices.

## 6. Non-Functional Requirements

*   **Performance:**

    *   Fast load times and responsive UI across devices; API calls (such as prompt enhancement) should process within 2 seconds for a smooth user experience.

*   **Scalability:**

    *   Leveraging Supabase configurations to handle growth in the number of users and model training demands.

*   **Security:**

    *   Implementation of encryption in data at rest and in transit; row-level security to ensure user data privacy.
    *   Use of Clerk to protect API routes and manage authentication dynamically.

*   **Compliance:**

    *   Adherence to GDPR/CCPA requirements with support for data deletion requests.

*   **Usability:**

    *   Clean and minimal design to facilitate an intuitive user experience; clear notifications and visual indicators for process stages.

## 7. Constraints & Assumptions

*   The project relies on the availability of key services such as Supabase, Clerk, Replicate, and Vercel; any downtime with these services could impact functionality.
*   APIs for Replicate’s Flux LoRA trainer, and GPT-4/Claude integrations, are assumed to be stable and scalable to meet user demand.
*   The free and premium tier quota system is assumed to function via real-time checks in the database using Supabase’s row-level security and Clerk's authentication system.
*   It is assumed that the initial user base will tolerate slightly longer model training times (approximately 5-10 minutes) and occasional network latency.
*   Payment integrations assume that Stripe’s API and webhooks will be correctly set up for secure and compliant transactions.

## 8. Known Issues & Potential Pitfalls

*   **API Rate Limits:**

    *   Both the Replicate and GPT-4/Claude APIs may impose rate limits. It is important to implement retry mechanisms and graceful degradation in cases of API overload.

*   **Photo Upload & Model Training:**

    *   Validating image file types and ensuring clear photo guidelines are met can be challenging. Clear on-screen instructions and error handling will be required to mitigate user errors.

*   **User Quota Enforcement:**

    *   Implementing real-time quota checks might be complex, especially during peak usage. Rigorous testing and monitoring in Supabase will be needed to ensure accuracy.

*   **Prompt Enhancement Variability:**

    *   The AI-powered prompt refinement might occasionally produce overly verbose or irrelevant suggestions. User controls to easily modify or revert these changes must be clear and accessible.

*   **Payment Integration Risks:**

    *   Integration with Stripe requires handling various edge cases (e.g., subscription cancellations, billing issues) gracefully. Webhook security and proper handling of asynchronous updates are critical.

*   **Data Security & Compliance:**

    *   Although Supabase provides foundational security measures, additional encryption and strict access controls are needed for API keys and sensitive metadata. Expect thorough testing to ensure compliance with GDPR/CCPA requirements.

This document serves as the main brain for the AI model and subsequent technical documents. Every detail mentioned here—from user authentication to payment integration—is crucial for building Visiona's platform with crystal clarity and no ambiguity.

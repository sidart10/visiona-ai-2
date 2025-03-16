# Visiona Backend Setup Guide

This guide will help you set up the backend services for the Visiona AI clone platform.

## Prerequisites

Before you begin, make sure you have:

1. Node.js (v18 or later) installed
2. A Clerk account for authentication
3. A Supabase account for database and storage
4. A Replicate account for AI model training and image generation
5. An OpenAI account for prompt enhancement (optional)

## Environment Variables

Copy the `.env.local` file and fill in your API keys and credentials:

```bash
cp .env.example .env.local
```

Then, update the following variables in `.env.local`:

### Clerk Authentication

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
- `CLERK_SECRET_KEY`: Your Clerk secret key
- `CLERK_WEBHOOK_SECRET`: Your Clerk webhook secret (for user synchronization)

### Supabase Database

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### Replicate AI

- `REPLICATE_API_TOKEN`: Your Replicate API token

### OpenAI (for prompt enhancement)

- `OPENAI_API_KEY`: Your OpenAI API key

## Supabase Setup

1. Create a new Supabase project
2. Run the SQL schema in `supabase/schema.sql` to create the necessary tables
3. Create two storage buckets:
   - `photos`: For storing user-uploaded photos
   - `generations`: For storing generated images

### Storage Bucket Configuration

For each bucket:

1. Enable public access (or configure RLS policies as needed)
2. Set up CORS configuration to allow requests from your frontend domain

## Clerk Setup

1. Create a new Clerk application
2. Configure the sign-in and sign-up URLs in the Clerk dashboard:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/dashboard`
   - After sign-up URL: `/dashboard`
3. Set up a webhook in the Clerk dashboard:
   - Endpoint URL: `https://your-domain.com/api/webhooks/clerk`
   - Events to send: `user.created`, `user.updated`, `user.deleted`
   - Get the webhook secret and add it to your `.env.local` file

## Replicate Setup

1. Create a Replicate account
2. Get your API token from the dashboard
3. Add the token to your `.env.local` file

## API Endpoints

The backend includes the following API endpoints:

### Authentication

- Clerk handles authentication through their SDK and middleware

### User Management

- `GET /api/user/profile`: Get user profile information and usage statistics

### Photos

- `POST /api/photos/upload`: Upload a photo
- `GET /api/photos`: Get a list of user's photos
- `DELETE /api/photos`: Delete a photo

### Models

- `POST /api/models/train`: Start training a new model
- `GET /api/models/status`: Check the status of a model
- `GET /api/models`: Get a list of user's models
- `DELETE /api/models`: Delete a model

### Generations

- `POST /api/generations`: Generate an image with a model
- `GET /api/generations`: Get a list of user's generated images

### Prompts

- `POST /api/prompts/enhance`: Enhance a prompt with AI

## Running the Application

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. The application will be available at `http://localhost:3000`

## Deployment

To deploy the application:

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Configure the environment variables in the Vercel dashboard
4. Deploy the application

## Troubleshooting

If you encounter issues:

1. Check that all API keys are correctly set in your `.env.local` file
2. Ensure Supabase tables are created correctly
3. Verify that Clerk webhooks are properly configured
4. Check the browser console and server logs for errors 
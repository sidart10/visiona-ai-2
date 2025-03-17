# Webhooks for Model Training

This project uses webhooks to receive notifications when model training is completed on Replicate.

## How Webhooks Work

1. When a model training job is started, we provide a webhook URL to Replicate.
2. When the job completes, Replicate sends a POST request to our webhook endpoint.
3. Our webhook handler (`/app/api/webhooks/replicate/completed/route.ts`) processes this notification and updates the model status in our database.

## Requirements

- For webhooks to function, the application must be deployed with a valid HTTPS URL.
- Local development environments typically cannot receive webhooks from external services.

## Environment Configuration

The webhook URL is constructed using the `NEXT_PUBLIC_APP_URL` environment variable:

```
${NEXT_PUBLIC_APP_URL}/api/webhooks/replicate/completed
```

- In **development**: The app falls back to polling for job status since webhooks won't work.
- In **production**: Set `NEXT_PUBLIC_APP_URL` to your deployed HTTPS URL (e.g., `https://yourapp.vercel.app`).

## Webhook Handler

The webhook handler performs these actions when a notification is received:

1. Validates that the request is from Replicate (basic verification)
2. Extracts the prediction ID and status from the payload
3. Updates the corresponding model record in the database:
   - For successful jobs: Sets status to "Ready" and stores output information
   - For failed jobs: Sets status to "Failed" and records the error message

## Manual Setup

If you're deploying to a new environment, make sure to:

1. Set the correct `NEXT_PUBLIC_APP_URL` environment variable
2. Ensure your server accepts POST requests at the webhook endpoint path
3. Configure any necessary CORS settings or security headers

## Troubleshooting

If webhooks aren't working:

1. Check that your `NEXT_PUBLIC_APP_URL` starts with `https://`
2. Verify that your server is publicly accessible
3. Look for errors in the server logs around webhook handling
4. Test the webhook endpoint manually using a tool like Postman

When running locally, you'll need to rely on polling methods to check job status, as webhooks won't reach your local environment. 
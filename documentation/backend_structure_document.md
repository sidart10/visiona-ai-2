# Backend Structure Document

This document outlines the backend architecture, database management, API design, hosting solutions, infrastructure components, and security measures for Visiona, an AI-driven web platform for creating personalized AI clones. The goal is to provide a clear overview of the backend setup in everyday language, ensuring anyone can understand how everything works, while including sufficient technical detail for tools like Cursor to generate the correct code.

## 1. Backend Architecture

The Visiona backend is built on a modern, serverless approach using Next.js API Routes. Here’s a detailed breakdown of the architecture:

*   Design Patterns and Frameworks:
    *   Uses serverless functions provided by Next.js API Routes for handling requests.
    *   Relies on established frameworks and integrations (e.g., Clerk for authentication, Supabase for database and storage, Replicate for AI model training and image generation).
    *   Business logic is separated into clear endpoints to enforce modularity and easier maintenance.

*   Key Responsibilities:
    *   User Authentication & Management: Integration with Clerk manages secure signups, logins, and account management.
    *   Photo Upload & AI Integration: 
        *   Users upload images via the web app, which are temporarily stored in Supabase Storage.
        *   These images are zipped and sent to Replicate’s Flux LoRA training service to create a custom AI model.
        *   After training, the images are deleted from Supabase Storage to ensure user privacy.
    *   Image Generation: 
        *   Users provide a text prompt, which may be enhanced by GPT-4o or Claude for better results.
        *   The enhanced prompt is used with the user’s trained model on Replicate to generate a new image.
        *   The generated image is stored in Supabase Storage and linked to the user’s account.
    *   Payment Processing: Manages subscription tiers and payments via Stripe.
    *   Gallery Management: Retrieves, sorts, and secures the display of generated images.

*   Scalability and Maintainability:
    *   The serverless nature ensures automatic scaling with traffic fluctuations.
    *   Separation of concerns (authentication, image generation, payment, gallery management) ensures updates in one component don’t disrupt others.
    *   Modern tools like Next.js, Supabase, and Replicate ensure performance as usage grows.

---

## 2. Database Management

Data management is a crucial part of Visiona. Here are the core details, updated to reflect Replicate integration:

*   Database Technologies Used:
    *   SQL Database: Supabase using PostgreSQL.
    *   Storage: Supabase Storage, managed with secure policies.

*   Data Structure and Management Practices:
    *   Structured Data: User accounts, image metadata, payment records, and Replicate-trained model details are stored in structured tables in PostgreSQL.
    *   Access Control: Supabase’s Row-Level Security (RLS) ensures users can only access their own data, including trained models and generated images.
    *   Backups and Retention: Regular, automated backups with a 30-day retention policy.
    *   Encryption: Sensitive data, such as API keys, user details, and Replicate model IDs, are encrypted to protect against unauthorized access.

---

## 3. Database Schema

Here’s the updated schema for Visiona’s PostgreSQL database via Supabase, with clarifications for Replicate integration:

```sql
-- Table: users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    clerk_id VARCHAR(255) UNIQUE NOT NULL, -- Identifier from Clerk
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: photos
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: models
CREATE TABLE models (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    model_id TEXT NOT NULL, -- Unique identifier of the trained model from Replicate
    trigger_word VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Processing', -- Statuses: Processing, Ready, Failed
    parameters JSONB NOT NULL, -- Stores training parameters for Replicate
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: generations
CREATE TABLE generations (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    model_id INT REFERENCES models(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    enhanced_prompt TEXT,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: payments
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    stripe_charge_id VARCHAR(255) UNIQUE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: audit_logs (for security and tracking events)
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Notes:
- The `model_id` field in the `models` table now explicitly stores the unique identifier returned by Replicate after training, used for subsequent image generation.
- The `parameters` field in JSONB format can store Replicate-specific training parameters (e.g., epochs, learning rate).

---
Below is an improved and comprehensive version of the documentation for connecting to Replicate in your application, tailored to your app’s UI (as shown in Image 2) and addressing both the training process (from the Replicate documentation and `test_flux.py`) and the prediction process (from your `handler` function). I’ve ensured that the details align with your app’s functionality, the Replicate API requirements, and the UI screenshot you provided. I’ve also highlighted what additional information I’d need from you to make it even more accurate.

---

## 4. Documentation for Connecting to Replicate in Visiona

This documentation provides a complete guide for integrating the Replicate API into the Visiona application. It covers two main processes:
1. Training a Model: Fine-tuning the FLUX.1 Dev LoRA Trainer with user-uploaded images and custom parameters, as configured in the app’s UI.
2. Generating Predictions: Using a trained model to generate images based on user prompts.

The instructions are written for a Node.js environment, matching your `handler` function and the Replicate documentation you provided.

---

### Prerequisites

- Replicate Account: You need a Replicate account and an API token, available from your [Replicate account settings](https://replicate.com/account/api-tokens).
- Replicate Node.js Client: Install the client in your project with:
  ```bash
  npm install replicate
  ```
- Supabase Account: Used for storing user data, uploaded images, and trained model information. Ensure you have a Supabase project set up with Storage and a database.
- Environment Variables: Store sensitive data like your Replicate API token in a `.env` file:
  ```env
  REPLICATE_API_TOKEN=your-replicate-api-token
  REPLICATE_USERNAME=your-replicate-username
  ```

---

## Part 1: Training a Model with Replicate

This section explains how to fine-tune a model using the FLUX.1 Dev LoRA Trainer in your app, reflecting the UI settings from your screenshot (Image 2).

### Step 1: Authenticate with Replicate

Initialize the Replicate client with your API token, securely stored in an environment variable.

```javascript
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});
```

- Security Note: Never hardcode your API token in the source code. Use `process.env.REPLICATE_API_TOKEN` as shown.

### Step 2: Upload Training Images to Supabase

Your app allows users to upload a zip file of images for training. Store this file in Supabase Storage and generate a signed URL.

```javascript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Example: Upload zip file and get signed URL
async function uploadTrainingImages(userId, file) {
  const filePath = `${userId}/training-images.zip`;
  const { error: uploadError } = await supabase.storage
    .from("training-images")
    .upload(filePath, file, { upsert: true });
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from("training-images")
    .createSignedUrl(filePath, 3600); // URL valid for 1 hour
  if (urlError) throw new Error(`Signed URL failed: ${urlError.message}`);

  return signedUrlData.signedUrl;
}
```

- Input: A zip file containing the user’s training images (e.g., `sid-portraits.zip` from your screenshot sidebar).
- Output: A signed URL (e.g., `https://your-supabase-url/storage/v1/object/sign/training-images/user-id/training-images.zip?...`), used as the `input_images` parameter.

### Step 3: Configure Training Parameters

The app’s UI (Image 2) allows users to configure training parameters. Map these UI inputs to the Replicate API’s expected format. Below are the parameters from your screenshot, with additional ones from the Replicate documentation where applicable.


Example Input Object:
```javascript
const input = {
  input_images: signedUrl, // From Step 2
  trigger_word: "Sid",
  steps: 1900,
  lora_rank: 32,
  optimizer: "adamw8bit",
  learning_rate: 0.0001,
  resolution: "512",
  batch_size: 1,
  autocaption: true,
  // Add other optional parameters as needed
};
```

- UI Alignment: The values above match your UI screenshot (Image 2). If your app allows users to adjust optional parameters (e.g., `autocaption`), include them dynamically based on user input.
- Validation: Ensure `steps` is between 100-4000, `lora_rank` is 1-128, and `learning_rate` is within 0.00001-0.001, as per your UI ranges and Replicate’s constraints.

### Step 4: Create a Training Job

Initiate the training process using `replicate.trainings.create`. You’ll need a destination model on Replicate to store the trained weights.

```javascript
const training = await replicate.trainings.create(
  "ostris", // Owner of the FLUX.1 Dev LoRA Trainer
  "flux-dev-lora-trainer",
  "b6af14222e6bd9be257cbc1ea4afda3cd0503e1133083b9d1de0364d8568e6ef", // Version ID
  {
    destination: `${process.env.REPLICATE_USERNAME}/visiona-model-${Date.now()}`, // Unique model name
    input: input, // From Step 3
  }
);
```

- Version ID: Use the latest version ID from [Replicate’s FLUX.1 Dev LoRA Trainer page](https://replicate.com/ostris/flux-dev-lora-trainer). The one shown (`b6af1422...`) is current as of this writing but may change.
- Destination: Format as `username/model-name`. Use your Replicate username (e.g., `sidart10`) and a unique model name (e.g., appending a timestamp prevents conflicts).
- Error Handling: Wrap this in a try-catch block:
  ```javascript
  try {
    const training = await replicate.trainings.create(/* ... */);
  } catch (error) {
    console.error("Training creation failed:", error.message);
    throw new Error("Failed to start training job");
  }
  ```

### Step 5: Monitor Training Progress

Track the training job until it completes, then store the result in Supabase.

```javascript
async function waitForTraining(trainingId) {
  let status = await replicate.trainings.get(trainingId);
  while (status.status !== "succeeded" && status.status !== "failed") {
    await new Promise((resolve) => setTimeout(resolve, 60000)); // Poll every minute
    status = await replicate.trainings.get(trainingId);
  }
  if (status.status === "failed") throw new Error(`Training failed: ${status.error}`);
  return status.output.version; // Trained model version ID
}

const trainedVersionId = await waitForTraining(training.id);

// Store in Supabase
const { error } = await supabase
  .from("models")
  .insert({
    user_id: userId,
    model_id: training.id,
    trigger_word: "Sid",
    status: "Ready",
    version_id: trainedVersionId,
    parameters: input,
    created_at: new Date().toISOString(),
  });
if (error) throw new Error(`Failed to save model: ${error.message}`);
```

- Webhook Option: Instead of polling, you can set a webhook in the `replicate.trainings.create` call to receive a notification when training completes.

---

## Part 2: Generating Predictions with a Trained Model

This section matches your `handler` function, using a trained model to generate images.

### Step 1: Initialize Replicate Client

Reuse the same client setup as in the training process.

```javascript
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});
```

### Step 2: Create a Prediction

Use the trained model’s version ID (from Step 5 of training) to generate an image based on a user prompt.

```javascript
export default async function handler(req, res) {
  const { userId } = auth(); // Your authentication logic
  const { modelId, prompt } = req.body;

  try {
    // Optionally enhance the prompt
    const enhancedPrompt = await enhancePrompt(prompt); // Your custom function

    const prediction = await replicate.predictions.create({
      version: modelId, // Trained model version ID
      input: {
        prompt: enhancedPrompt,
        // Add generation-specific parameters (e.g., from Replicate docs)
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "png",
      },
    });

    // Wait for prediction to complete
    const result = await replicate.wait(prediction);
    if (!result.output) throw new Error("Prediction failed: No output generated");

    // Store the generated image in Supabase Storage
    const imageUrl = await storeGeneratedImage(userId, result.output);

    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error("Prediction error:", error.message);
    res.status(500).json({ error: "Failed to generate image" });
  }
}

async function storeGeneratedImage(userId, imageOutput) {
  const imageUrl = Array.isArray(imageOutput) ? imageOutput[0] : imageOutput; // Handle array or string output
  const response = await fetch(imageUrl);
  const buffer = await response.buffer();

  const filePath = `${userId}/generated-${Date.now()}.png`;
  const { error } = await supabase.storage
    .from("generated-images")
    .upload(filePath, buffer, { contentType: "image/png" });
  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data: signedUrlData } = await supabase.storage
    .from("generated-images")
    .createSignedUrl(filePath, 3600);
  return signedUrlData.signedUrl;
}
```

- Model ID: The `modelId` should be the `version_id` from the trained model stored in Supabase.
- Input Parameters: Add generation-specific parameters as needed (e.g., `num_outputs`, `aspect_ratio`). Check [Replicate’s prediction docs](https://replicate.com/docs/predictions) for supported options.
- Error Handling: The 422 error from Image 1 ("Invalid version or not permitted") suggests an invalid `modelId`. Verify that the `modelId` matches a valid trained version ID and that your API token has permission to access it.

---

### Error Handling and Troubleshooting

- Authentication Issues: Ensure `REPLICATE_API_TOKEN` is valid and correctly loaded from `.env`.
- Invalid Version ID: Double-check the `version` (training) or `modelId` (prediction) against your Replicate account. Image 1’s 422 error indicates this is a common issue.
- Parameter Validation: Validate UI inputs (e.g., `steps`, `lora_rank`) before sending to Replicate to avoid API errors.
- Network Errors: Use try-catch blocks to catch timeouts or connectivity issues.

---

### Notes on UI and Documentation Alignment

- UI Values: The training parameters match your UI screenshot (Image 2: `trigger_word: "Sid"`, `steps: 1900`, etc.). If these differ from defaults, they’re intentional user choices.
- Missing UI Elements: The screenshot doesn’t show `input_images` or `destination`. I’ve assumed these are handled elsewhere in your app (e.g., file upload UI and backend logic).
- Prediction vs. Training: Your `handler` focuses on predictions, while the UI and Replicate docs focus on training. Both are covered here for completeness.

---


## 5. API Design and Endpoints

Visiona’s API endpoints follow RESTful principles, using Next.js API Routes. The following sections have been expanded to detail Replicate integration, including code examples for Cursor. This section ensures comprehensive coverage of authentication, photo uploads, model training, image generation, gallery management, and payment processing, with a focus on seamless integration with Replicate for AI-driven functionality.

- API Style: RESTful API using Next.js API Routes.

- Key Endpoints and Their Functions:
  - Authentication Endpoints:
    - `/api/auth/login` and `/api/auth/signup`: Facilitate secure login and registration via Clerk.

  - Photo and Model Endpoints:
    - `/api/photos/upload`:
      - Handles photo uploads, storing files securely in Supabase Storage.
    - `/api/models/train`:
      - Receives a request with the user’s Clerk ID, trigger word, and optional training parameters.
      - Retrieves uploaded images from Supabase Storage.
      - Creates a zip file of the images and generates a signed URL for access.
      - Calls Replicate’s training API with the zip file URL and specified training parameters.
      - Stores the training job ID in the database for status tracking.
      - Code Example:
        ```javascript
        // /api/models/train.js
        import { auth } from '@clerk/nextjs';
        import Replicate from 'replicate';
        import { createClient } from '@supabase/supabase-js';

        // Initialize Supabase client
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

        export default async function handler(req, res) {
          const { userId } = auth();
          const { triggerWord, steps, loraRank, optimizer, learningRate, resolution, batchSize } = req.body;

          // Retrieve user's uploaded images from Supabase Storage
          const imageUrls = await getUserImageUrls(userId);
          const zipFilePath = await createZip(imageUrls); // Assume this creates a zip file and returns its path

          // Upload zip file to Supabase and get a signed URL
          const { data, error } = await supabase.storage
            .from('training-zips')
            .upload(`${userId}/${Date.now()}.zip`, zipFilePath, { upsert: true });
          if (error) throw new Error('Failed to upload zip file');

          const signedUrl = await supabase.storage
            .from('training-zips')
            .createSignedUrl(data.path, 60 * 60); // URL valid for 1 hour

          // Initialize Replicate client
          const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

          // Start training on Replicate
          const training = await replicate.trainings.create(
            "ostris",
            "flux-dev-lora-trainer",
            "b6af14222e6bd9be257cbc1ea4afda3cd0503e1133083b9d1de0364d8568e6ef",
            {
              destination: `${process.env.REPLICATE_USERNAME}/visiona-model-${Date.now()}`,
              input: {
                input_images: signedUrl.signedUrl,
                trigger_word: triggerWord,
                steps: steps || 1000,
                lora_rank: loraRank || 16,
                optimizer: optimizer || "adamw8bit",
                learning_rate: learningRate || 0.0004,
                resolution: resolution || "512",
                batch_size: batchSize || 1,
                // Additional parameters can be added here as needed
              }
            }
          );

          // Store training job in Supabase
          await storeTrainingJob(userId, training.id);

          res.status(200).json({ message: 'Training started', trainingId: training.id });
        }
        ```
      - Notes:
        - The code now uses Supabase to upload the zip file and generate a signed URL, replacing the incorrect `replicate.files.create` approach.
        - The `replicate.trainings.create` call specifies the trainer’s owner, model, and version, along with a unique destination for the trained model.
        - Default training parameters are provided, which can be overridden via the request body.
    - `/api/models/status`:
      - Checks the status of a training job by querying Replicate’s API with the training ID.
      - Updates the `models` table and returns the status to the frontend.

  - Image Generation Endpoints:
    - `/api/generate`:
      - Receives a request with the user’s Clerk ID, trained model version ID, and text prompt.
      - Optionally enhances the prompt using GPT-4o or Claude.
      - Calls Replicate’s prediction API with the trained model version and prompt.
      - Stores the generated image in Supabase Storage and records it in the database.
      - Code Example:
        ```javascript
        // /api/generate.js
        import { auth } from '@clerk/nextjs';
        import Replicate from 'replicate';

        export default async function handler(req, res) {
          const { userId } = auth();
          const { versionId, prompt } = req.body; // versionId is the trained model version from Replicate

          // Optionally enhance prompt
          const enhancedPrompt = await enhancePrompt(prompt);

          // Initialize Replicate client
          const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

          // Create prediction with the trained model version
          const prediction = await replicate.predictions.create({
            version: versionId,
            input: {
              prompt: enhancedPrompt,
              // Additional generation parameters (e.g., num_outputs, guidance_scale)
            },
          });

          // Wait for prediction to complete
          const result = await replicate.wait(prediction);

          // Store generated image in Supabase
          const imageUrl = await storeGeneratedImage(userId, result.output);

          res.status(200).json({ imageUrl });
        }
        ```
      - Notes:
        - The `versionId` is assumed to be the specific version ID returned by Replicate after training, stored in the database during the `/api/models/train` process.
        - The `replicate.predictions.create` call uses `version` instead of `model` for clarity, aligning with Replicate’s documentation for fine-tuned models.

  - Gallery Endpoints:
    - `/api/gallery`: Fetches image details for the user’s gallery, sorted chronologically.
    - `/api/gallery/delete`: Allows users to delete images from their gallery.

  - Payment Endpoints:
    - `/api/payment/subscribe`: Manages subscription sign-ups via Stripe.
    - `/api/payment/webhook`: Listens for Stripe events to update payment status.

- Asynchronous Operations:
  - Model Training: Replicate training is asynchronous and may take minutes to hours. `/api/models/train` returns immediately with a training ID, and the frontend polls `/api/models/status` for updates.
  - Image Generation: If generation is slow, `/api/generate` can return a prediction ID for later polling.

---

## 6. Hosting Solutions

Visiona is hosted on modern cloud solutions for speed, scalability, and reliability:

*   Cloud Providers and Deployment:
    *   Vercel: Hosts the entire application, including frontend and serverless API routes. Benefits include:
        *   Reliability: Proven uptime and global distribution.
        *   Scalability: Automatically scales with traffic and API requests.
        *   Cost-Effectiveness: Optimized pricing for serverless deployments.
    *   Integration with external services like Replicate is managed via API calls from the backend.

---

## 7. Infrastructure Components

Key components ensure optimal performance and user experience:

*   Load Balancers: Managed by Vercel for even request distribution.
*   Caching Mechanisms: Vercel’s built-in caching, with potential API-level caching.
*   Content Delivery Networks (CDNs): Vercel’s integrated CDN delivers static assets and images globally.
*   Third-Party Integrations:
    *   Stripe: Payment processing.
    *   Replicate: AI model training and image generation.
    *   GPT-4o/Claude: Prompt enhancement.

---

## 8. Security Measures

Security is a top priority, with updates for Replicate integration:

*   Authentication & Authorization:
    *   Clerk manages secure user authentication.
    *   Role-based access (free vs. premium) enforced via API and RLS.

*   Data Encryption:
    *   Sensitive data (API keys, user details) encrypted in transit and at rest.
    *   User-uploaded images stored temporarily in Supabase Storage and deleted post-training.

*   Database Security:
    *   Supabase RLS ensures users only access their own data, including Replicate model IDs.
    *   Regular backups with a 30-day retention period.

*   API Token Security:
    *   The Replicate API token is stored as an environment variable (`process.env.REPLICATE_API_TOKEN`), accessible only to the backend.

*   Compliance and Auditing:
    *   Supports GDPR/CCPA data deletion requests.
    *   Sentry and audit logs track events, including Replicate interactions.

---

## 9. Monitoring and Maintenance

Continuous monitoring and maintenance keep the backend reliable:

*   Monitoring Tools:
    *   Vercel Analytics: Tracks serverless function performance.
    *   Sentry: Captures errors, including Replicate API failures, for quick resolution.
    *   Supabase Monitoring: Monitors database performance and security.

*   Maintenance Practices:
    *   Regular endpoint and database performance reviews.
    *   Automated backups and recovery minimize downtime.
    *   Scheduled updates and patches maintain security and efficiency.

---

## 10. Conclusion and Overall Backend Summary

The Visiona backend supports a dynamic, AI-driven web platform focused on scalability, security, and user experience. Key takeaways:

*   A serverless architecture with Next.js API Routes ensures scalability and maintainability.
*   A robust PostgreSQL database via Supabase manages users, photos, Replicate-trained models, generations, and payments.
*   A RESTful API design facilitates clear communication, with detailed Replicate integration for training and generation.
*   Vercel hosting provides global distribution, CDNs, and caching.
*   Comprehensive security measures (encryption, RLS, Clerk authentication) ensure data safety.
*   Monitoring with Vercel, Sentry, and Supabase tools maintains reliability.
*   Integration with Replicate enables users to train custom AI models and generate personalized images seamlessly.

This updated documentation provides a detailed foundation for Cursor to generate accurate backend code, aligning with Visiona’s goal of enabling creative users to effortlessly create personalized AI clones on a secure, scalable platform.

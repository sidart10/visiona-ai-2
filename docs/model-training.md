# Model Training Configuration

This document outlines the configuration options and troubleshooting steps for AI model training in the application.

## Replicate Configuration

The application uses [Replicate](https://replicate.com) for AI model training. Here are the key configuration parameters:

### Environment Variables

- `REPLICATE_API_TOKEN`: Your Replicate API token for authentication
- `REPLICATE_FLUX_VERSION`: The model version to use for training - this must be a full version ID including the hash (e.g., `ostris/flux-dev-lora-trainer:b6af14222e6bd9be257cbc1ea4afda3cd0503e1133083b9d1de0364d8568e6ef`)
- `NEXT_PUBLIC_APP_URL`: Used for webhook configuration (must be HTTPS for production)

### Model Training Parameters

The following parameters can be configured for model training:

- `triggerWord`: The word that triggers your custom style during image generation
- `trainingSteps`: Number of training steps (recommended: 1000-2000)
- `loraRank`: LoRA rank parameter (recommended: 32)
- `learningRate`: Learning rate (recommended: 0.0004)
- `resolution`: Training resolution (recommended: 512)
- `batchSize`: Batch size (recommended: 1)

## Troubleshooting Training Issues

### 422 Unprocessable Entity Error

If you see an error like:

```
Error: Request to https://api.replicate.com/v1/predictions failed with status 422
Unprocessable Entity: {"title":"Invalid version or not permitted"}
```

This indicates one of the following issues:

1. The model version (`REPLICATE_FLUX_VERSION`) is invalid or doesn't exist
2. Your Replicate account doesn't have permission to use the specified model
3. Your Replicate API token is invalid or has insufficient permissions

**Important**: Replicate requires a full version ID with a hash, not just the model name. For example:
- ❌ Wrong: `facebookresearch/flux-2`
- ✅ Correct: `ostris/flux-dev-lora-trainer:b6af14222e6bd9be257cbc1ea4afda3cd0503e1133083b9d1de0364d8568e6ef`

**Solution:**
- Check that your `REPLICATE_API_TOKEN` is correct and has the necessary permissions
- Verify that the model version exists on Replicate by browsing to its page on the Replicate website
- If using a custom or private model, ensure your account has access to it
- Make sure you're using a full version ID including the hash, not just the model name

### Validating Your Configuration

You can validate your Replicate configuration by running our test script:

```bash
node scripts/test-replicate.js
```

This will check:
- If your API token is valid
- If the specified model exists
- If the specified version exists
- List available versions if your version is not found

### Webhook Errors

Webhook-related errors typically indicate:

1. The `NEXT_PUBLIC_APP_URL` is not a valid HTTPS URL
2. The webhook endpoint is not accessible from the internet

**Solution:**
- In development: Webhooks will be skipped automatically
- In production: Ensure `NEXT_PUBLIC_APP_URL` is set to your deployed HTTPS URL

### ZIP File Creation Errors

If you encounter errors during ZIP file creation:

1. Check that your server has disk space for temporary files
2. Ensure your server environment has the necessary permissions to create temporary files

## Supported Input Formats

The training process supports the following image formats:
- JPEG/JPG
- PNG
- WebP

For best results:
- Use 10-20 high-quality images
- Include close-up images of faces (for portrait models)
- Use consistent lighting and style across images
- Include some variation in poses and expressions 
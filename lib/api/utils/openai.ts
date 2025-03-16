import OpenAI from 'openai';

// Initialize OpenAI client with API key from environment variables
export const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Missing OpenAI API key');
  }
  
  return new OpenAI({ apiKey });
};

/**
 * Enhance a user prompt for better image generation results
 * @param basePrompt The user's original prompt text
 * @param style Optional style direction (e.g., "realistic", "cartoon", "painting")
 * @returns Enhanced prompt text optimized for image generation
 */
export async function enhancePrompt(basePrompt: string, style?: string) {
  const openai = getOpenAIClient();
  
  try {
    const styleDirection = style ? `in ${style} style` : '';
    
    const systemPrompt = `You are a helpful assistant that enhances image generation prompts. 
      Take the user's basic prompt and expand it into a more detailed and descriptive 
      prompt that will produce better results with image generation AI models.
      Make sure the enhanced prompt maintains the original intent but adds details about 
      lighting, composition, mood, and artistic style. Keep the enhanced prompt to a 
      reasonable length (under 200 characters if possible).`;
    
    const userPrompt = `Enhance this image prompt: "${basePrompt}" ${styleDirection}`;
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const enhancedPrompt = completion.choices[0]?.message.content?.trim() || basePrompt;
    
    return enhancedPrompt;
  } catch (error) {
    console.error('Error enhancing prompt with OpenAI:', error);
    // In case of error, return the original prompt to ensure the flow continues
    return basePrompt;
  }
}

/**
 * Generate image caption or description from an image URL
 * @param imageUrl URL of the image to describe
 * @returns Text description of the image content
 */
export async function generateImageCaption(imageUrl: string) {
  const openai = getOpenAIClient();
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe this image in detail, focusing on subject, style, and composition.' },
            { type: 'image_url', image_url: { url: imageUrl } }
          ],
        },
      ],
      max_tokens: 300,
    });

    return response.choices[0]?.message.content || 'No description available';
  } catch (error) {
    console.error('Error generating image caption:', error);
    return 'Error generating caption';
  }
}

/**
 * Analyze prompt to detect potential content policy violations
 * @param prompt The prompt to analyze
 * @returns Object with flags for potentially problematic content
 */
export async function analyzePromptSafety(prompt: string) {
  const openai = getOpenAIClient();
  
  try {
    const systemPrompt = `You are a content safety assistant. Analyze the provided prompt 
      that will be used for AI image generation and detect any potentially problematic 
      content. Provide a JSON response with boolean flags for different problematic categories.`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this image generation prompt for safety concerns: "${prompt}"` }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 300,
      temperature: 0.2,
    });

    const content = response.choices[0]?.message.content || '';
    
    try {
      const safetyResult = JSON.parse(content);
      return safetyResult;
    } catch (parseError) {
      console.error('Error parsing safety result:', parseError);
      return { error: 'Failed to parse safety analysis' };
    }
  } catch (error) {
    console.error('Error analyzing prompt safety:', error);
    return { error: 'Failed to analyze prompt safety' };
  }
} 
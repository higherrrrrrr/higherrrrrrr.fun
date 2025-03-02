// Load environment variables from .env file
require('dotenv').config();

const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate an image using OpenAI's DALL-E model
 * @param {string} prompt - The text prompt to generate an image from
 * @param {Array} styleImages - Array of style reference image URLs
 * @param {Array} baseImages - Array of base image prompts to choose from
 * @param {string} userStyle - Optional user-specified style
 * @returns {Promise<string>} - URL of the generated image
 */
async function generateImage(prompt, styleImages = [], baseImages = [], userStyle = '') {
  try {
    // Select a random base image prompt if available
    let basePrompt = prompt;
    if (baseImages && baseImages.length > 0) {
      const randomIndex = Math.floor(Math.random() * baseImages.length);
      basePrompt = baseImages[randomIndex] || prompt;
      console.log(`Selected base image prompt: ${basePrompt}`);
    }
    
    // Construct the enhanced prompt
    let enhancedPrompt = basePrompt;
    
    // Add user-specified style if provided
    if (userStyle && userStyle.length > 0) {
      enhancedPrompt += `, in ${userStyle} style`;
    }
    
    console.log(`Generating image with prompt: ${enhancedPrompt}`);
    
    // Generate image with DALL-E
    const response = await openai.images.generate({
      model: "dall-e-2", // Cheaper option
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024", // For DALL-E 2, you can also use "512x512" for even lower cost
    });
    
    console.log("Image generated successfully");
    
    // Return the URL of the generated image
    return response.data[0].url;
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('Failed to generate image');
  }
}

module.exports = { generateImage }; 
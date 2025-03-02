require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const { Telegraf } = require('telegraf');
const fs = require('fs').promises;
const path = require('path');
const { generateImage } = require('../../imageGeneration');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Store active bot instances
const activeBots = new Map();

// Get bot configuration from JSON file
async function getBotConfig(botId) {
  try {
    // Try multiple possible paths for the config file
    const possiblePaths = [
      // Path relative to the server.js file
      path.join(__dirname, '..', '..', '..', 'app', 'bot-configs', `${botId}.json`),
      // Path relative to the current working directory
      path.join(process.cwd(), 'bot-configs', `${botId}.json`),
      // Path if running from the services/app directory
      path.join(process.cwd(), '..', '..', 'app', 'bot-configs', `${botId}.json`)
    ];
    
    let configData = null;
    let usedPath = null;
    
    // Try each path until we find the file
    for (const configPath of possiblePaths) {
      try {
        console.log(`Trying to read config from: ${configPath}`);
        configData = await fs.readFile(configPath, 'utf8');
        usedPath = configPath;
        break;
      } catch (err) {
        console.log(`File not found at: ${configPath}`);
        // Continue to the next path
      }
    }
    
    if (!configData) {
      throw new Error(`Bot configuration file not found for bot ID: ${botId}`);
    }
    
    console.log(`Successfully read config from: ${usedPath}`);
    return JSON.parse(configData);
  } catch (error) {
    console.error(`Error reading bot config for ${botId}:`, error);
    throw new Error('Bot configuration not found');
  }
}

// Create and launch a bot
async function createBot(botId, token) {
  try {
    // Get the bot configuration
    const config = await getBotConfig(botId);
    
    // Create a new Telegraf instance
    const bot = new Telegraf(token);
    
    // Set up commands based on configuration
    config.commands.forEach(cmd => {
      const commandName = cmd.command.replace('/', '');
      
      bot.command(commandName, async (ctx) => {
        // Get any arguments passed to the command
        const args = ctx.message.text.split(' ').slice(1).join(' ');
        const userSpecifiedStyle = args.trim();
        
        // Select a random response if multiple responses are available
        let response = cmd.response;
        if (cmd.responses && cmd.responses.length > 0) {
          const randomIndex = Math.floor(Math.random() * cmd.responses.length);
          response = cmd.responses[randomIndex];
        }
        
        // Send the text response
        await ctx.reply(response);
        
        // If this command should generate an image
        if (cmd.generateImage) {
          // Send "generating" message
          await ctx.reply("Generating your image...");
          
          try {
            // Generate the image, passing the user-specified style if provided
            const imageUrl = await generateImage(
              cmd.command, 
              config.styleImageUrls || [],
              cmd.baseImages || [],
              userSpecifiedStyle // Pass the user's style argument
            );
            
            // Send the image
            await ctx.replyWithPhoto({ url: imageUrl }, {
              caption: userSpecifiedStyle 
                ? `Generated with DALL-E in ${userSpecifiedStyle} style` 
                : `Generated with DALL-E`
            });
          } catch (error) {
            console.error("Error generating image:", error);
            await ctx.reply("Sorry, I couldn't generate an image right now.");
          }
        }
        
        // If this command has pre-uploaded images
        if (cmd.preUploadedImages && cmd.preUploadedImages.length > 0) {
          try {
            console.log(`Command ${commandName} has ${cmd.preUploadedImages.length} pre-uploaded images`);
            
            // Select a random pre-uploaded image
            const randomIndex = Math.floor(Math.random() * cmd.preUploadedImages.length);
            const selectedImage = cmd.preUploadedImages[randomIndex];
            
            console.log(`Selected pre-uploaded image: ${selectedImage.substring(0, 50)}...`);
            
            // Check if the image is a data URL
            if (selectedImage.startsWith('data:image')) {
              console.log('Image is a data URL, sending as buffer');
              
              // Convert data URL to buffer
              const base64Data = selectedImage.split(',')[1];
              const imageBuffer = Buffer.from(base64Data, 'base64');
              
              // Send the image as a buffer
              await ctx.replyWithPhoto({ source: imageBuffer }, {
                caption: userSpecifiedStyle 
                  ? `Pre-uploaded image (Style: ${userSpecifiedStyle})` 
                  : `Pre-uploaded image`
              });
            } else {
              console.log('Image is a URL, sending as URL');
              
              // Send the pre-uploaded image as URL
              await ctx.replyWithPhoto({ url: selectedImage }, {
                caption: userSpecifiedStyle 
                  ? `Pre-uploaded image (Style: ${userSpecifiedStyle})` 
                  : `Pre-uploaded image`
              });
            }
            
            console.log('Pre-uploaded image sent successfully');
          } catch (error) {
            console.error("Error sending pre-uploaded image:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            await ctx.reply(`Sorry, I couldn't send the image right now. Error: ${error.message}`);
          }
        }
      });
    });
    
    // Handle text messages
    bot.on('text', (ctx) => {
      ctx.reply(`You said: ${ctx.message.text}\nTry one of our commands!`);
    });
    
    // Launch the bot
    await bot.launch();
    console.log(`Bot ${botId} launched successfully`);
    
    // Store the bot instance
    activeBots.set(botId, bot);
    
    return true;
  } catch (error) {
    console.error(`Error creating bot ${botId}:`, error);
    throw new Error('Failed to create bot');
  }
}

// API endpoint to create and start a bot
app.post('/bots', async (req, res) => {
  try {
    const { botId, token } = req.body;
    
    if (!botId || !token) {
      return res.status(400).json({ success: false, message: 'Bot ID and token are required' });
    }
    
    // Check if bot is already running
    if (activeBots.has(botId)) {
      return res.json({ success: true, message: 'Bot is already running' });
    }
    
    // Create and start the bot
    await createBot(botId, token);
    
    res.json({ success: true, message: 'Bot started successfully' });
  } catch (error) {
    console.error('Error starting bot:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint to stop a bot
app.delete('/bots/:botId', (req, res) => {
  try {
    const { botId } = req.params;
    
    if (!activeBots.has(botId)) {
      return res.status(404).json({ success: false, message: 'Bot not found' });
    }
    
    // Stop the bot
    activeBots.get(botId).stop();
    activeBots.delete(botId);
    
    res.json({ success: true, message: 'Bot stopped successfully' });
  } catch (error) {
    console.error('Error stopping bot:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Bot service running on port ${PORT}`);
});
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

// Function to save bot configuration to a JSON file
// In a production app, you would use a database instead
async function saveBotConfig(botConfig) {
  try {
    // Generate a unique ID for the bot
    const botId = `bot_${Date.now()}`;
    
    // Create a directory for bot configurations if it doesn't exist
    const configDir = path.join(process.cwd(), 'bot-configs');
    await fs.mkdir(configDir, { recursive: true });
    
    // Save the configuration to a JSON file
    const configPath = path.join(configDir, `${botId}.json`);
    await fs.writeFile(configPath, JSON.stringify({
      ...botConfig,
      id: botId,
      createdAt: new Date().toISOString()
    }, null, 2));
    
    console.log(`Bot configuration saved to absolute path: ${path.resolve(configPath)}`);
    console.log(`Current working directory: ${process.cwd()}`);
    
    return botId;
  } catch (error) {
    console.error('Error saving bot configuration:', error);
    throw new Error('Failed to save bot configuration');
  }
}

// API handler for POST requests
export async function POST(request) {
  try {
    console.log('Received request to create bot');
    const botConfig = await request.json();
    
    // Validate required fields
    if (!botConfig.name || !botConfig.token || !botConfig.commands || botConfig.commands.length === 0) {
      console.log('Missing required fields');
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    
    console.log('Saving bot configuration');
    // Save the bot configuration
    const botId = await saveBotConfig(botConfig);
    
    // Start the bot by making a request to the bot service
    try {
      console.log(`Starting bot ${botId} with token ${botConfig.token.substring(0, 5)}...`);
      const response = await axios.post('http://localhost:3001/bots', {
        botId,
        token: botConfig.token
      });
      
      console.log('Bot service response:', response.data);
      
      if (response.data && response.data.success) {
        return NextResponse.json({ success: true, botId });
      } else {
        const message = response.data ? response.data.message : 'Unknown error from bot service';
        console.error('Bot service error:', message);
        return NextResponse.json({ success: false, message }, { status: 500 });
      }
    } catch (error) {
      console.error('Error starting bot:', error.message);
      return NextResponse.json({ 
        success: false, 
        message: `Failed to start bot service: ${error.message}` 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating bot:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Error creating bot: ${error.message}` 
    }, { status: 500 });
  }
}
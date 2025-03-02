'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlitchText } from '../../components/GlitchText';

export default function TGBotCreatorPage() {
  const router = useRouter();
  const [botName, setBotName] = useState('');
  const [botUsername, setBotUsername] = useState('');
  const [botDescription, setBotDescription] = useState('');
  const [botToken, setBotToken] = useState('');
  const [commands, setCommands] = useState([
    { command: '/start', response: 'Welcome to my bot!', responses: [], baseImages: [], isDefault: true },
    { command: '/help', response: 'Here are the available commands...', responses: [], baseImages: [], isDefault: true },
    { command: '', response: '', responses: [], baseImages: [], generateImage: false, isDefault: false }
  ]);
  const [styleImages, setStyleImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [expanded, setExpanded] = useState({
    botInfo: true,
    apiConfig: true,
    styleImages: true,
    commands: true
  });
  const [isComplete, setIsComplete] = useState({ apiConfig: false });
  const [apiProvider, setApiProvider] = useState('cloudflare');
  const [apiKey, setApiKey] = useState('');

  // Add a new command
  const addCommand = () => {
    setCommands([...commands, { command: '', response: '', responses: [], baseImages: [], generateImage: false, isDefault: false }]);
  };

  // Remove a command
  const removeCommand = (index) => {
    const updatedCommands = [...commands];
    updatedCommands.splice(index, 1);
    setCommands(updatedCommands);
  };

  // Update a command property
  const updateCommand = (index, property, value) => {
    const updatedCommands = [...commands];
    updatedCommands[index][property] = value;
    setCommands(updatedCommands);
  };

  // Add a response to a command
  const addResponse = (index) => {
    const updatedCommands = [...commands];
    if (!updatedCommands[index].responses) {
      updatedCommands[index].responses = [];
    }
    updatedCommands[index].responses.push('');
    setCommands(updatedCommands);
  };

  // Remove a response from a command
  const removeResponse = (cmdIndex, responseIndex) => {
    const updatedCommands = [...commands];
    updatedCommands[cmdIndex].responses.splice(responseIndex, 1);
    setCommands(updatedCommands);
  };

  // Update a response
  const updateResponse = (cmdIndex, responseIndex, value) => {
    const updatedCommands = [...commands];
    updatedCommands[cmdIndex].responses[responseIndex] = value;
    setCommands(updatedCommands);
  };

  // Add a base image to a command
  const addBaseImage = (index) => {
    const updatedCommands = [...commands];
    if (!updatedCommands[index].baseImages) {
      updatedCommands[index].baseImages = [];
    }
    updatedCommands[index].baseImages.push('');
    setCommands(updatedCommands);
  };

  // Remove a base image from a command
  const removeBaseImage = (cmdIndex, imageIndex) => {
    const updatedCommands = [...commands];
    updatedCommands[cmdIndex].baseImages.splice(imageIndex, 1);
    setCommands(updatedCommands);
  };

  // Update a base image
  const updateBaseImage = (cmdIndex, imageIndex, value) => {
    const updatedCommands = [...commands];
    updatedCommands[cmdIndex].baseImages[imageIndex] = value;
    setCommands(updatedCommands);
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImages = files.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setStyleImages([...styleImages, ...newImages]);
    }
  };

  // Remove a style image
  const removeStyleImage = (index) => {
    const updatedImages = [...styleImages];
    URL.revokeObjectURL(updatedImages[index].preview);
    updatedImages.splice(index, 1);
    setStyleImages(updatedImages);
  };

  // Add a pre-uploaded image URL to a command
  const addPreUploadedImage = (commandIndex, imageUrl) => {
    console.log(`Adding pre-uploaded image to command ${commandIndex}`);
    console.log(`Image URL starts with: ${imageUrl.substring(0, 50)}...`);
    
    const updatedCommands = [...commands];
    if (!updatedCommands[commandIndex].preUploadedImages) {
      updatedCommands[commandIndex].preUploadedImages = [];
    }
    
    // Only allow up to 3 pre-uploaded images
    if (updatedCommands[commandIndex].preUploadedImages.length < 3) {
      updatedCommands[commandIndex].preUploadedImages.push(imageUrl);
      console.log(`Command now has ${updatedCommands[commandIndex].preUploadedImages.length} pre-uploaded images`);
      setCommands(updatedCommands);
    }
  };

  // Remove a pre-uploaded image from a command
  const removePreUploadedImage = (commandIndex, imageIndex) => {
    const updatedCommands = [...commands];
    updatedCommands[commandIndex].preUploadedImages.splice(imageIndex, 1);
    setCommands(updatedCommands);
  };

  // Toggle pre-uploaded images for a command
  const togglePreUploadedImages = (commandIndex) => {
    const updatedCommands = [...commands];
    updatedCommands[commandIndex].usePreUploadedImages = !updatedCommands[commandIndex].usePreUploadedImages;
    setCommands(updatedCommands);
  };

  // Toggle section
  const toggleSection = (section) => {
    setExpanded({ ...expanded, [section]: !expanded[section] });
    setIsComplete({ ...isComplete, [section]: true });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTokenError('');
    
    try {
      // Validate bot token
      if (!/^\d+:/.test(botToken)) {
        setTokenError('Invalid bot token format. It should start with numbers followed by a colon.');
        setIsSubmitting(false);
        return;
      }
      
      // Upload style images if any
      const styleImageUrls = [];
      if (styleImages.length > 0) {
        // In a real app, you would upload these to a storage service
        // For now, we'll just use the preview URLs
        styleImages.forEach(img => {
          styleImageUrls.push(img.preview);
        });
      }
      
      // Prepare the bot data
      const botData = {
        name: botName,
        username: botUsername,
        description: botDescription,
        token: botToken,
        commands: commands.filter(cmd => cmd.command && cmd.response).map(cmd => {
          const processedCmd = {
            command: cmd.command,
            response: cmd.response,
            responses: cmd.responses || [],
            generateImage: cmd.generateImage || false,
            baseImages: cmd.baseImages || [],
            usePreUploadedImages: cmd.usePreUploadedImages || false,
            preUploadedImages: cmd.preUploadedImages || []
          };
          
          // Log pre-uploaded images
          if (cmd.usePreUploadedImages && cmd.preUploadedImages && cmd.preUploadedImages.length > 0) {
            console.log(`Command ${cmd.command} has ${cmd.preUploadedImages.length} pre-uploaded images`);
            console.log(`First image starts with: ${cmd.preUploadedImages[0].substring(0, 50)}...`);
          }
          
          return processedCmd;
        }),
        styleImageUrls
      };
      
      console.log(`Sending bot data with ${botData.commands.length} commands`);
      
      // Send the data to the API
      const response = await fetch('/api/TG-Bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(botData),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create bot');
      }
      
      // Redirect to success page
      router.push('/TG-Bot-Creator/TGB-Success');
    } catch (error) {
      console.error('Error creating bot:', error);
      alert(`Failed to create bot: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-500 p-4">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-center mb-8">
          <GlitchText>Create Your Telegram Bot</GlitchText>
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Bot Information Section */}
          <div className="border border-green-500/30 rounded-lg overflow-hidden mb-6">
            <button 
              type="button"
              onClick={() => {
                // Only allow toggling if required fields are filled
                if (!expanded.botInfo || (botName && botUsername && botToken)) {
                  toggleSection('botInfo');
                }
              }}
              className="w-full bg-black p-4 flex justify-between items-center text-left"
            >
              <h2 className="text-xl font-semibold">Bot Information</h2>
              <div className="flex items-center">
                {isComplete.botInfo && (
                  <span className="text-green-500 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 transition-transform ${expanded.botInfo ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {!expanded.botInfo && botName && botUsername && botToken && (
              <div className="px-4 py-3 bg-green-500/5 border-t border-green-500/20 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-green-500/70 mr-2">Name:</span>
                  <span className="text-green-500">{botName}</span>
                </div>
                <div>
                  <span className="text-green-500/70 mr-2">Username:</span>
                  <span className="text-green-500">@{botUsername}</span>
                </div>
                <div>
                  <span className="text-green-500/70 mr-2">Token:</span>
                  <span className="text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-1">Set</span>
                  </span>
                </div>
              </div>
            )}
            
            {expanded.botInfo && (
              <div className="p-6">
                {/* BotFather Instructions */}
                <div className="mb-6 bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                  <h3 className="text-green-500 font-semibold mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    How to Get Your Bot Token from BotFather
                  </h3>
                  <ol className="list-decimal list-inside text-green-500/80 space-y-1 ml-1">
                    <li>Open Telegram and search for <span className="text-green-500 font-mono">@BotFather</span></li>
                    <li>Start a chat and send <span className="text-green-500 font-mono">/newbot</span> command</li>
                    <li>Follow prompts to name your bot and create a username</li>
                    <li>BotFather will generate a token like <span className="text-green-500 font-mono">123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ</span></li>
                    <li>Copy this token and paste it below</li>
                  </ol>
                  <div className="mt-3 text-center">
                    <a 
                      href="https://t.me/botfather" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center text-green-500 hover:text-green-400 underline"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open BotFather in Telegram
                    </a>
                  </div>
                </div>
                
                {/* Bot Information Fields */}
                <div className="mb-4">
                  <label className="block text-green-500 mb-2">Bot Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    className="w-full p-3 bg-black border border-green-500/30 rounded-lg text-green-500 focus:outline-none focus:border-green-500"
                    placeholder="My Awesome Bot"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-green-500 mb-2">Bot Username <span className="text-red-500">*</span></label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-green-500/10 border border-r-0 border-green-500/30 rounded-l-lg text-green-500">@</span>
                    <input
                      type="text"
                      value={botUsername}
                      onChange={(e) => setBotUsername(e.target.value)}
                      className="flex-1 p-3 bg-black border border-green-500/30 rounded-r-lg text-green-500 focus:outline-none focus:border-green-500"
                      placeholder="my_awesome_bot"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-green-500 mb-2">Bot Description</label>
                  <textarea
                    value={botDescription}
                    onChange={(e) => setBotDescription(e.target.value)}
                    className="w-full p-3 bg-black border border-green-500/30 rounded-lg text-green-500 focus:outline-none focus:border-green-500"
                    placeholder="A brief description of what your bot does..."
                    rows={3}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-green-500 mb-2">Bot Token <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    className="w-full p-3 bg-black border border-green-500/30 rounded-lg text-green-500 focus:outline-none focus:border-green-500"
                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                    required
                  />
                </div>
                
                <div className="text-right text-sm text-green-500/70">
                  <span className="text-red-500">*</span> Required fields
                </div>
              </div>
            )}
          </div>
          
          {/* Image Generation API Section - MOVED UP */}
          <div className="border border-green-500/30 rounded-lg overflow-hidden mb-6">
            <button 
              type="button"
              onClick={() => toggleSection('apiConfig')}
              className="w-full bg-black p-4 flex justify-between items-center text-left"
            >
              <h2 className="text-xl font-semibold">Image Generation API (Req. for Image Generation)</h2>
              <div className="flex items-center">
                {isComplete.apiConfig && (
                  <span className="text-green-500 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 transition-transform ${expanded.apiConfig ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {!expanded.apiConfig && (
              <div className="px-4 py-2 bg-green-500/5 border-t border-green-500/20 text-sm">
                <div className="flex items-center">
                  <span className="text-green-500/70 mr-2">Provider:</span> 
                  <span className="text-green-500">
                    {apiProvider === 'cloudflare' ? 'Cloudflare Workers AI (Free)' : 
                     apiProvider === 'stability' ? 'Stability AI' : 
                     apiProvider === 'openai' ? 'OpenAI DALL-E' : 'Replicate'}
                  </span>
                  {apiKey && (
                    <span className="ml-4 text-green-500/70">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-1">API Key Set</span>
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {expanded.apiConfig && (
              <div className="p-6">
                <p className="text-green-500/80 mb-4">
                  Choose your image generation provider to create images for your bot commands. You can enable image generation for specific commands later.
                </p>
                
                <div className="mb-6">
                  <label className="block text-green-500 mb-2">Select Provider</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cloudflare Option */}
                    <div 
                      className={`border ${apiProvider === 'cloudflare' ? 'border-green-500 bg-green-500/5' : 'border-green-500/20'} rounded-lg p-4 cursor-pointer hover:bg-green-500/5`}
                      onClick={() => setApiProvider('cloudflare')}
                    >
                      <div className="flex items-start">
                        <div className={`w-5 h-5 rounded-full border ${apiProvider === 'cloudflare' ? 'border-green-500' : 'border-green-500/30'} flex-shrink-0 mr-3 mt-1 flex items-center justify-center`}>
                          {apiProvider === 'cloudflare' && (
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-green-500">Cloudflare Workers AI</h3>
                          <p className="text-green-500/70 text-sm mt-1">Free tier with 100K requests/day. No credit card required.</p>
                          <div className="mt-2 text-xs text-green-500/60">
                            <span className="inline-block px-2 py-1 bg-green-500/10 rounded mr-1 mb-1">Free</span>
                            <span className="inline-block px-2 py-1 bg-green-500/10 rounded mr-1 mb-1">Fast</span>
                            <span className="inline-block px-2 py-1 bg-green-500/10 rounded mr-1 mb-1">Simple Setup</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Stability AI Option */}
                    <div 
                      className={`border ${apiProvider === 'stability' ? 'border-green-500 bg-green-500/5' : 'border-green-500/20'} rounded-lg p-4 cursor-pointer hover:bg-green-500/5`}
                      onClick={() => setApiProvider('stability')}
                    >
                      <div className="flex items-start">
                        <div className={`w-5 h-5 rounded-full border ${apiProvider === 'stability' ? 'border-green-500' : 'border-green-500/30'} flex-shrink-0 mr-3 mt-1 flex items-center justify-center`}>
                          {apiProvider === 'stability' && (
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-green-500">Stability AI</h3>
                          <p className="text-green-500/70 text-sm mt-1">High-quality images with multiple model options.</p>
                          <div className="mt-2 text-xs text-green-500/60">
                            <span className="inline-block px-2 py-1 bg-green-500/10 rounded mr-1 mb-1">25 Free Credits</span>
                            <span className="inline-block px-2 py-1 bg-green-500/10 rounded mr-1 mb-1">High Quality</span>
                            <span className="inline-block px-2 py-1 bg-green-500/10 rounded mr-1 mb-1">Multiple Models</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* OpenAI Option */}
                    <div 
                      className={`border ${apiProvider === 'openai' ? 'border-green-500 bg-green-500/5' : 'border-green-500/20'} rounded-lg p-4 cursor-pointer hover:bg-green-500/5`}
                      onClick={() => setApiProvider('openai')}
                    >
                      <div className="flex items-start">
                        <div className={`w-5 h-5 rounded-full border ${apiProvider === 'openai' ? 'border-green-500' : 'border-green-500/30'} flex-shrink-0 mr-3 mt-1 flex items-center justify-center`}>
                          {apiProvider === 'openai' && (
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-green-500">OpenAI DALL-E</h3>
                          <p className="text-green-500/70 text-sm mt-1">Excellent quality with good prompt following.</p>
                          <div className="mt-2 text-xs text-green-500/60">
                            <span className="inline-block px-2 py-1 bg-green-500/10 rounded mr-1 mb-1">Premium</span>
                            <span className="inline-block px-2 py-1 bg-green-500/10 rounded mr-1 mb-1">Best Quality</span>
                            <span className="inline-block px-2 py-1 bg-green-500/10 rounded mr-1 mb-1">Complex Prompts</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Replicate Option */}
                    <div 
                      className={`border ${apiProvider === 'replicate' ? 'border-green-500 bg-green-500/5' : 'border-green-500/20'} rounded-lg p-4 cursor-pointer hover:bg-green-500/5`}
                      onClick={() => setApiProvider('replicate')}
                    >
                      <div className="flex items-start">
                        <div className={`w-5 h-5 rounded-full border ${apiProvider === 'replicate' ? 'border-green-500' : 'border-green-500/30'} flex-shrink-0 mr-3 mt-1 flex items-center justify-center`}>
                          {apiProvider === 'replicate' && (
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-green-500">Replicate</h3>
                          <p className="text-green-500/70 text-sm mt-1">Access to many different models for experimentation.</p>
                          <div className="mt-2 text-xs text-green-500/60">
                            <span className="inline-block px-2 py-1 bg-green-500/10 rounded mr-1 mb-1">$1 Free Credit</span>
                            <span className="inline-block px-2 py-1 bg-green-500/10 rounded mr-1 mb-1">Many Models</span>
                            <span className="inline-block px-2 py-1 bg-green-500/10 rounded mr-1 mb-1">Flexible</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-green-500">API Key</label>
                    <span className="text-green-500/70 text-sm">
                      {apiProvider === 'cloudflare' ? '(Optional for free tier)' : '(Required)'}
                    </span>
                  </div>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full p-3 bg-black border border-green-500/30 rounded-lg text-green-500 focus:outline-none focus:border-green-500"
                    placeholder={`Enter your ${
                      apiProvider === 'cloudflare' ? 'Cloudflare' : 
                      apiProvider === 'stability' ? 'Stability AI' : 
                      apiProvider === 'openai' ? 'OpenAI' : 'Replicate'
                    } API key`}
                  />
                </div>
                
                <div className="text-center mt-4">
                  <a
                    href={
                      apiProvider === 'cloudflare' ? 'https://developers.cloudflare.com/workers-ai/' :
                      apiProvider === 'stability' ? 'https://platform.stability.ai/' :
                      apiProvider === 'openai' ? 'https://platform.openai.com/' :
                      'https://replicate.com/'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:text-green-400 text-sm underline"
                  >
                    Get an API key from {
                      apiProvider === 'cloudflare' ? 'Cloudflare Workers AI' :
                      apiProvider === 'stability' ? 'Stability AI' : 
                      apiProvider === 'openai' ? 'OpenAI' : 'Replicate'
                    }
                  </a>
                </div>
              </div>
            )}
          </div>
          
          {/* Style Reference Images Section */}
          <div className="border border-green-500/30 rounded-lg overflow-hidden mb-6">
            <div className="bg-black/50 border border-green-500/30 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold mb-4">Style Reference Images</h2>
              <p className="text-green-500/70 mb-4">Upload images to influence the style of generated images</p>
              
              <div className="flex flex-wrap gap-4 mb-4">
                {styleImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img src={img.preview} alt={`Style ${index + 1}`} className="w-24 h-24 object-cover rounded-lg border border-green-500/30" />
                    <button
                      type="button"
                      onClick={() => removeStyleImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 flex items-center justify-center text-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                <label className="w-24 h-24 border-2 border-dashed border-green-500/30 rounded-lg flex items-center justify-center cursor-pointer hover:border-green-500/50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
          
          {/* Commands */}
          <div className="bg-black/50 border border-green-500/30 rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold mb-4">Bot Commands</h2>
            
            {commands.map((cmd, index) => (
              <div key={index} className="border border-green-500/20 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-10 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="block text-green-500 mb-2">Command</label>
                    <input
                      type="text"
                      value={cmd.command}
                      onChange={(e) => updateCommand(index, 'command', e.target.value)}
                      className="w-full p-3 bg-black border border-green-500/30 rounded-lg text-green-500 focus:outline-none focus:border-green-500"
                      placeholder="/command"
                      required={!cmd.isDefault}
                      disabled={cmd.isDefault}
                    />
                  </div>
                  
                  <div className="md:col-span-7">
                    <label className="block text-green-500 mb-2">Default Response</label>
                    <textarea
                      value={cmd.response}
                      onChange={(e) => updateCommand(index, 'response', e.target.value)}
                      className="w-full p-3 bg-black border border-green-500/30 rounded-lg text-green-500 focus:outline-none focus:border-green-500 h-24"
                      placeholder="Bot's response to this command..."
                      required
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-center pt-8">
                    {!cmd.isDefault && (
                      <button
                        type="button"
                        onClick={() => removeCommand(index)}
                        className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 flex items-center justify-center text-red-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Additional Responses */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-green-500">Additional Responses (Randomly Selected)</label>
                    <button
                      type="button"
                      onClick={() => addResponse(index)}
                      className="text-sm px-2 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded text-green-500 transition-colors"
                    >
                      Add Response
                    </button>
                  </div>
                  
                  {cmd.responses && cmd.responses.map((response, responseIndex) => (
                    <div key={responseIndex} className="flex gap-2 mb-2">
                      <textarea
                        value={response}
                        onChange={(e) => updateResponse(index, responseIndex, e.target.value)}
                        className="flex-grow p-3 bg-black border border-green-500/30 rounded-lg text-green-500 focus:outline-none focus:border-green-500 h-16"
                        placeholder="Alternative response..."
                      />
                      <button
                        type="button"
                        onClick={() => removeResponse(index, responseIndex)}
                        className="w-8 h-8 self-center rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 flex items-center justify-center text-red-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Simplified Image Options with fixed toggle */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-green-500">Include Images</label>
                    <label className="relative inline-block w-12 h-6 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cmd.includeImages || false}
                        onChange={() => {
                          const updatedCommands = [...commands];
                          updatedCommands[index].includeImages = !updatedCommands[index].includeImages;
                          
                          // Reset image option when toggling off
                          if (!updatedCommands[index].includeImages) {
                            updatedCommands[index].imageOption = null;
                          } else if (!updatedCommands[index].imageOption) {
                            // Default to generate if turning on
                            updatedCommands[index].imageOption = 'generate';
                          }
                          setCommands(updatedCommands);
                        }}
                        className="opacity-0 w-0 h-0 absolute"
                      />
                      <span className={`absolute top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-300 ${cmd.includeImages ? 'bg-green-500' : 'bg-green-500/30'}`}>
                        <span className={`absolute h-4 w-4 left-1 bottom-1 bg-black rounded-full transition-transform duration-300 ${cmd.includeImages ? 'transform translate-x-6' : ''}`}></span>
                      </span>
                    </label>
                  </div>
                  
                  {/* Expanded image options when includeImages is true */}
                  {cmd.includeImages && (
                    <div className="mt-4 ml-4 border-l-2 border-green-500/20 pl-4">
                      <div className="space-y-3 mb-4">
                        <div 
                          className="flex items-center cursor-pointer"
                          onClick={() => updateCommand(index, 'imageOption', 'generate')}
                        >
                          <div className={`w-5 h-5 rounded-full border ${cmd.imageOption === 'generate' ? 'border-green-500' : 'border-green-500/30'} flex-shrink-0 mr-3 flex items-center justify-center`}>
                            {cmd.imageOption === 'generate' && (
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                          <span className="text-green-500">Generate image with AI</span>
                        </div>
                        
                        <div 
                          className="flex items-center cursor-pointer"
                          onClick={() => updateCommand(index, 'imageOption', 'upload')}
                        >
                          <div className={`w-5 h-5 rounded-full border ${cmd.imageOption === 'upload' ? 'border-green-500' : 'border-green-500/30'} flex-shrink-0 mr-3 flex items-center justify-center`}>
                            {cmd.imageOption === 'upload' && (
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                          <span className="text-green-500">Use pre-uploaded images</span>
                        </div>
                      </div>
                      
                      {/* AI Image generation options */}
                      {cmd.imageOption === 'generate' && (
                        <div className="mb-4 ml-4">
                          <label className="block text-green-500 mb-2">Image Prompts (Random Selection)</label>
                          {cmd.baseImages && cmd.baseImages.length > 0 ? (
                            cmd.baseImages.map((image, imageIndex) => (
                              <div key={imageIndex} className="flex mb-2">
                                <input
                                  type="text"
                                  value={image}
                                  onChange={(e) => updateBaseImage(index, imageIndex, e.target.value)}
                                  className="flex-1 p-3 bg-black border border-green-500/30 rounded-lg text-green-500 focus:outline-none focus:border-green-500"
                                  placeholder="Describe the image you want to generate..."
                                />
                                <button
                                  type="button"
                                  onClick={() => removeBaseImage(index, imageIndex)}
                                  className="ml-2 text-red-500 hover:text-red-400"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-green-500/70 text-sm mb-2">
                              No image prompts added yet. Add one to generate images with this command.
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => addBaseImage(index)}
                            className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-green-500 text-sm flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Image Prompt
                          </button>
                        </div>
                      )}
                      
                      {/* Pre-uploaded images options */}
                      {cmd.imageOption === 'upload' && (
                        <div className="mb-4 ml-4">
                          <label className="block text-green-500 mb-2">Upload Images</label>
                          <div className="border-2 border-dashed border-green-500/30 rounded-lg p-4 text-center">
                            <input
                              type="file"
                              id={`uploadImages-${index}`}
                              accept="image/*"
                              multiple
                              onChange={(e) => handleCommandImageUpload(index, e)}
                              className="hidden"
                            />
                            <label htmlFor={`uploadImages-${index}`} className="cursor-pointer">
                              <div className="flex flex-col items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500/50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-green-500">Click to upload images</p>
                                <p className="text-green-500/50 text-sm mt-1">or drag and drop</p>
                              </div>
                            </label>
                          </div>
                          
                          {/* Display uploaded images */}
                          {cmd.uploadedImages && cmd.uploadedImages.length > 0 && (
                            <div className="mt-4 grid grid-cols-3 gap-2">
                              {cmd.uploadedImages.map((img, imgIndex) => (
                                <div key={imgIndex} className="relative group">
                                  <img 
                                    src={URL.createObjectURL(img)} 
                                    alt={`Uploaded ${imgIndex}`} 
                                    className="w-full h-24 object-cover rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeUploadedImage(index, imgIndex)}
                                    className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addCommand}
              className="w-full p-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-500 transition-colors"
            >
              Add Command
            </button>
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full p-4 bg-green-500 hover:bg-green-600 text-black font-bold rounded-lg flex items-center justify-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Your Bot...
              </>
            ) : (
              'Create Bot'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
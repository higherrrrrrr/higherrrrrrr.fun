'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const [expanded, setExpanded] = useState({ apiConfig: false });
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Create Your Telegram Bot</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Bot Information Section */}
          <div className="border border-green-500/30 rounded-lg overflow-hidden mb-6">
            <div className="bg-black/50 border border-green-500/30 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold mb-4">Bot Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-green-500 mb-2">Bot Name</label>
                  <input
                    type="text"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    className="w-full p-3 bg-black border border-green-500/30 rounded-lg text-green-500 focus:outline-none focus:border-green-500"
                    placeholder="My Awesome Bot"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-green-500 mb-2">Bot Username</label>
                  <input
                    type="text"
                    value={botUsername}
                    onChange={(e) => setBotUsername(e.target.value)}
                    className="w-full p-3 bg-black border border-green-500/30 rounded-lg text-green-500 focus:outline-none focus:border-green-500"
                    placeholder="my_awesome_bot"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-green-500 mb-2">Bot Description</label>
                <textarea
                  value={botDescription}
                  onChange={(e) => setBotDescription(e.target.value)}
                  className="w-full p-3 bg-black border border-green-500/30 rounded-lg text-green-500 focus:outline-none focus:border-green-500 h-24"
                  placeholder="A description of what your bot does..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-green-500 mb-2">Bot Token (from BotFather)</label>
                <input
                  type="text"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className={`w-full p-3 bg-black border ${tokenError ? 'border-red-500' : 'border-green-500/30'} rounded-lg text-green-500 focus:outline-none focus:border-green-500`}
                  placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  required
                />
                {tokenError && <p className="text-red-500 mt-1 text-sm">{tokenError}</p>}
                <p className="text-green-500/70 text-sm mt-1">Get this from <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="underline">@BotFather</a> on Telegram</p>
              </div>
            </div>
          </div>
          
          {/* Image Generation API Section - MOVED UP */}
          <div className="border border-green-500/30 rounded-lg overflow-hidden mb-6">
            <button 
              type="button"
              onClick={() => toggleSection('apiConfig')}
              className="w-full bg-black p-4 flex justify-between items-center text-left"
            >
              <h2 className="text-xl font-semibold">Image Generation API (Req. for Image Functionality)</h2>
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
                  Choose an image generation provider to create images for your bot commands. You can enable image generation for specific commands later.
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
                        <div className={`w-5 h-5 rounded-full border ${apiProvider === 'cloudflare' ? 'border-green-500' : 'border-green-500/30'} flex-shrink-0 mr-3 mt-1`}>
                          {apiProvider === 'cloudflare' && (
                            <div className="w-3 h-3 bg-green-500 rounded-full m-auto"></div>
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
                        <div className={`w-5 h-5 rounded-full border ${apiProvider === 'stability' ? 'border-green-500' : 'border-green-500/30'} flex-shrink-0 mr-3 mt-1`}>
                          {apiProvider === 'stability' && (
                            <div className="w-3 h-3 bg-green-500 rounded-full m-auto"></div>
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
                        <div className={`w-5 h-5 rounded-full border ${apiProvider === 'openai' ? 'border-green-500' : 'border-green-500/30'} flex-shrink-0 mr-3 mt-1`}>
                          {apiProvider === 'openai' && (
                            <div className="w-3 h-3 bg-green-500 rounded-full m-auto"></div>
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
                        <div className={`w-5 h-5 rounded-full border ${apiProvider === 'replicate' ? 'border-green-500' : 'border-green-500/30'} flex-shrink-0 mr-3 mt-1`}>
                          {apiProvider === 'replicate' && (
                            <div className="w-3 h-3 bg-green-500 rounded-full m-auto"></div>
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
                
                {/* Image generation toggle */}
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id={`generateImage-${index}`}
                    checked={cmd.generateImage || false}
                    onChange={(e) => updateCommand(index, 'generateImage', e.target.checked)}
                    className="w-4 h-4 text-green-500 bg-black border-green-500 rounded focus:ring-green-500"
                  />
                  <label htmlFor={`generateImage-${index}`} className="ml-2 text-green-500">
                    Generate image for this command
                  </label>
                </div>
                
                {/* Base Images for Image Generation */}
                {cmd.generateImage && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-green-500">Base Image Prompts (Randomly Selected)</label>
                      <button
                        type="button"
                        onClick={() => addBaseImage(index)}
                        className="text-sm px-2 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded text-green-500 transition-colors"
                        disabled={cmd.baseImages && cmd.baseImages.length >= 3}
                      >
                        Add Base Image
                      </button>
                    </div>
                    
                    {cmd.baseImages && cmd.baseImages.map((baseImage, imageIndex) => (
                      <div key={imageIndex} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={baseImage}
                          onChange={(e) => updateBaseImage(index, imageIndex, e.target.value)}
                          className="flex-grow p-3 bg-black border border-green-500/30 rounded-lg text-green-500 focus:outline-none focus:border-green-500"
                          placeholder="Base image prompt..."
                        />
                        <button
                          type="button"
                          onClick={() => removeBaseImage(index, imageIndex)}
                          className="w-8 h-8 self-center rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 flex items-center justify-center text-red-500 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    
                    {(!cmd.baseImages || cmd.baseImages.length === 0) && (
                      <p className="text-green-500/50 text-sm">
                        Add up to 3 base image prompts. One will be randomly selected when generating an image.
                      </p>
                    )}
                    
                    {cmd.baseImages && cmd.baseImages.length > 0 && (
                      <p className="text-green-500/50 text-sm mt-2">
                        Users can also specify a style by adding it after the command: /{cmd.command.replace('/', '')} cyberpunk
                      </p>
                    )}
                  </div>
                )}

                {/* Pre-Uploaded Images Section */}
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`use-pre-uploaded-${index}`}
                      checked={cmd.usePreUploadedImages || false}
                      onChange={() => togglePreUploadedImages(index)}
                      className="mr-2 h-5 w-5 accent-green-500"
                    />
                    <label htmlFor={`use-pre-uploaded-${index}`} className="text-green-500">
                      Include Pre-Uploaded Images
                    </label>
                  </div>
                  
                  {cmd.usePreUploadedImages && (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-green-500">Pre-Uploaded Images (Randomly Selected)</label>
                        <button
                          type="button"
                          onClick={() => document.getElementById(`image-upload-${index}`).click()}
                          className="text-sm px-2 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded text-green-500 transition-colors"
                          disabled={cmd.preUploadedImages && cmd.preUploadedImages.length >= 3}
                        >
                          Upload Image
                        </button>
                        <input
                          id={`image-upload-${index}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              console.log(`Selected file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
                              
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                console.log(`File read complete, result length: ${reader.result.length}`);
                                addPreUploadedImage(index, reader.result);
                              };
                              reader.onerror = (error) => {
                                console.error('Error reading file:', error);
                                alert('Error reading file. Please try again.');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {cmd.preUploadedImages && cmd.preUploadedImages.map((imageUrl, imageIndex) => (
                          <div key={imageIndex} className="relative">
                            <img 
                              src={imageUrl} 
                              alt={`Pre-uploaded image ${imageIndex + 1}`} 
                              className="w-full h-32 object-cover rounded-lg border border-green-500/30"
                            />
                            <button
                              type="button"
                              onClick={() => removePreUploadedImage(index, imageIndex)}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center text-white"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      {(!cmd.preUploadedImages || cmd.preUploadedImages.length === 0) && (
                        <p className="text-green-500/50 text-sm">
                          Upload up to 3 images. One will be randomly selected when the command is used.
                        </p>
                      )}
                    </>
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
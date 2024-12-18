import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useSignMessage } from 'wagmi';
import { getTokenCreator, getToken, updateToken, upsertToken, generateExampleTweet, connectTwitter, disconnectTwitter } from '../../../api/token';
import Link from 'next/link';
import posthog from 'posthog-js'
import Cookies from 'js-cookie';

function usePostHogFeatureFlag(flagName, defaultValue = true) {
  const [enabled, setEnabled] = useState(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Wait for PostHog to load feature flags
    const handleFlagsLoaded = () => {
      console.log('PostHog flags loaded');
      const isEnabled = posthog.isFeatureEnabled(flagName);
      console.log('Feature flag status after load:', { flagName, isEnabled });
      setEnabled(isEnabled ?? defaultValue);
      setIsLoaded(true);
    };

    // Check if flags are already loaded
    if (posthog && posthog.isFeatureEnabled) {
      const currentFlags = posthog.getFeatureFlag();
      if (currentFlags !== undefined) {
        console.log('Flags already loaded:', currentFlags);
        const isEnabled = posthog.isFeatureEnabled(flagName);
        console.log('Initial feature flag status:', { flagName, isEnabled });
        setEnabled(isEnabled ?? defaultValue);
        setIsLoaded(true);
      } else {
        // Wait for flags to load
        console.log('Waiting for flags to load...');
        posthog.onFeatureFlags(handleFlagsLoaded);
      }
    } else {
      console.log('PostHog not ready, using default:', defaultValue);
      setEnabled(defaultValue);
      setIsLoaded(true);
    }

    // Listen for changes
    const handleFlagChange = (key) => {
      if (key === flagName) {
        const newValue = posthog.isFeatureEnabled(flagName);
        console.log('Feature flag changed:', { flagName, newValue });
        setEnabled(newValue ?? defaultValue);
      }
    };

    if (posthog) {
      posthog.onFeatureFlags(handleFlagChange);
    }
  }, [flagName, defaultValue]);

  return isLoaded ? enabled : defaultValue;
}

function ListInput({ items = [], onChange, placeholder, label }) {
  const safeItems = Array.isArray(items) ? items : [];

  const addItem = () => {
    onChange([...safeItems, '']);
  };

  const removeItem = (index) => {
    const newItems = safeItems.filter((_, i) => i !== index);
    onChange(newItems.length ? newItems : ['']);
  };

  const updateItem = (index, value) => {
    const newItems = [...safeItems];
    newItems[index] = value;
    onChange(newItems);
  };

  useEffect(() => {
    if (!safeItems.length) {
      onChange(['']);
    }
  }, []);

  return (
    <div className="space-y-2">
      <label className="block text-sm text-green-500/70 mb-2">
        {label}
      </label>
      {safeItems.map((item, index) => (
        <div key={index} className="flex space-x-2">
          <input
            type="text"
            value={item || ''}
            onChange={(e) => updateItem(index, e.target.value)}
            className="flex-1 bg-black border border-green-500/30 text-green-500 p-2 rounded focus:border-green-500 focus:outline-none"
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="px-3 py-2 border border-green-500/30 text-green-500 hover:bg-green-500/10 rounded transition-colors"
            disabled={safeItems.length === 1}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="w-full mt-2 px-3 py-2 border border-green-500/30 text-green-500 hover:bg-green-500/10 rounded transition-colors flex items-center justify-center"
      >
        <span className="mr-2">+</span> Add Item
      </button>
    </div>
  );
}

export default function EditTokenPage() {
  const router = useRouter();
  const { address } = router.query;
  const { address: userAddress } = useAccount();
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const agentsEnabled = usePostHogFeatureFlag('agents', false);
  const [formData, setFormData] = useState({
    description: '',
    website: '',
    twitter: '',
    telegram: '',
    warpcast: '',
    aiCharacter: {
      name: '',
      bio: '',
      lore: '',
      messageExamples: [''],
      postExamples: [''],
      adjectives: [''],
      topics: [''],
      style: {
        all: [''],
        chat: [''],
        post: ['']
      },
      includeMarketData: false,
      tweetsPerDay: 7,
      model: 'llama-3'
    }
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [exampleTweet, setExampleTweet] = useState('');
  const [isGeneratingTweet, setIsGeneratingTweet] = useState(false);
  const [isConnectingTwitter, setIsConnectingTwitter] = useState(false);
  const [twitterUsername, setTwitterUsername] = useState('');
  const [showAutomationModal, setShowAutomationModal] = useState(false);

  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    const checkCreator = async () => {
      if (!address || !userAddress) return;
      
      try {
        const creatorData = await getTokenCreator(address);
        const isCreator = creatorData.creator.toLowerCase() === userAddress.toLowerCase();
        setIsCreator(isCreator);
        
        if (!isCreator) {
          router.push(`/token/${address}`);
        }
        
        // TODO: Fetch current token data and set form initial values
        setLoading(false);
      } catch (error) {
        console.error('Failed to verify creator:', error);
        router.push(`/token/${address}`);
      }
    };

    checkCreator();
  }, [address, userAddress]);

  useEffect(() => {
    const fetchTokenData = async () => {
      if (!address) return;
      try {
        const tokenData = await getToken(address);
        setTwitterUsername(tokenData.twitter_username || '');
        setFormData({
          description: tokenData.description || '',
          website: tokenData.website || '',
          twitter: tokenData.twitter || '',
          telegram: tokenData.telegram || '',
          warpcast: tokenData.warpcast_url || '',
          aiCharacter: {
            name: tokenData.ai_character?.name || '',
            bio: tokenData.ai_character?.bio || '',
            lore: tokenData.ai_character?.lore || '',
            messageExamples: tokenData.ai_character?.message_examples || [''],
            postExamples: tokenData.ai_character?.post_examples || [''],
            adjectives: tokenData.ai_character?.adjectives || [''],
            topics: tokenData.ai_character?.topics || [''],
            style: {
              all: tokenData.ai_character?.style?.all || [''],
              chat: tokenData.ai_character?.style?.chat || [''],
              post: tokenData.ai_character?.style?.post || ['']
            },
            includeMarketData: tokenData.ai_character?.include_market_data || false,
            tweetsPerDay: tokenData.ai_character?.tweets_per_day !== undefined 
              ? tokenData.ai_character.tweets_per_day 
              : 7,
            model: tokenData.ai_character?.model || 'llama-3',
          }
        });
      } catch (error) {
        console.error('Failed to fetch token data:', error);
        // Set default form data on error
        setFormData(prev => ({
          ...prev,
          aiCharacter: {
            ...prev.aiCharacter,
            tweetsPerDay: 7
          }
        }));
      }
    };
    fetchTokenData();
  }, [address, agentsEnabled]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Create and sign the message
      const timestamp = Math.floor(Date.now() / 1000);
      const message = `we're going higherrrrrrr`;
      const signature = await signMessageAsync({ message });

      // Update token with signed request
      await upsertToken(address, {
        website: formData.website,
        twitter: formData.twitter,
        telegram: formData.telegram,
        description: formData.description,
        warpcast_url: formData.warpcast,
        ai_character: {
          name: formData.aiCharacter.name,
          bio: formData.aiCharacter.bio,
          lore: formData.aiCharacter.lore,
          message_examples: formData.aiCharacter.messageExamples,
          post_examples: formData.aiCharacter.postExamples,
          adjectives: formData.aiCharacter.adjectives,
          topics: formData.aiCharacter.topics,
          style: {
            all: formData.aiCharacter.style.all,
            chat: formData.aiCharacter.style.chat,
            post: formData.aiCharacter.style.post
          },
          include_market_data: formData.aiCharacter.includeMarketData,
          tweets_per_day: formData.aiCharacter.tweetsPerDay,
          model: formData.aiCharacter.model,
        }
      }, signature);

      // Redirect back to token page on success
      router.push(`/token/${address}`);
    } catch (error) {
      console.error('Failed to update token:', error);
      setError(error.message || 'Failed to update token');
    } finally {
      setSaving(false);
    }
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const characterFile = JSON.parse(e.target.result);
          setFormData(prev => ({
            ...prev,
            aiCharacter: {
              name: characterFile.name || '',
              bio: characterFile.bio?.join('\n') || '',
              lore: characterFile.lore?.join('\n') || '',
              messageExamples: characterFile.messageExamples || [''],
              postExamples: characterFile.postExamples || [''],
              adjectives: characterFile.adjectives || [''],
              topics: characterFile.topics || [''],
              style: {
                all: characterFile.style?.all || [''],
                chat: characterFile.style?.chat || [''],
                post: characterFile.style?.post || ['']
              },
              includeMarketData: prev.aiCharacter.includeMarketData,
              tweetsPerDay: prev.aiCharacter.tweetsPerDay
            }
          }));
        } catch (error) {
          setError('Failed to parse character file');
          console.error('Failed to parse character file:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleGenerateExample = async () => {
    setIsGeneratingTweet(true);
    setError('');
    try {
      const tweet = await generateExampleTweet(formData.aiCharacter);
      setExampleTweet(tweet);
    } catch (error) {
      setError('Failed to generate example tweet');
      console.error('Failed to generate example tweet:', error);
    } finally {
      setIsGeneratingTweet(false);
    }
  };

  const handleTwitterConnect = async () => {
    setIsConnectingTwitter(true);
    setError('');
    try {
      if (twitterUsername) {
        // For disconnect, we still need signature
        const message = `we're going higherrrrrrr`;
        const signature = await signMessageAsync({ message });
        await disconnectTwitter(address, signature);
        setTwitterUsername('');
      } else {
        // Just get the auth URL and redirect - we'll use the cookie in the callback
        const authUrl = await connectTwitter(address);
        window.location.href = authUrl;
      }
    } catch (error) {
      console.error('Twitter connection error:', error);
      setError(error.message || 'Failed to connect Twitter');
    } finally {
      setIsConnectingTwitter(false);
    }
  };

  // Log when agentsEnabled changes
  useEffect(() => {
    console.log('Agents feature flag status in component:', agentsEnabled);
  }, [agentsEnabled]);

  // Store token address in cookie whenever the page loads
  useEffect(() => {
    if (address) {
      Cookies.set('last_token_address', address, { expires: 7 }); // Expires in 7 days
    }
  }, [address]);

  const AutomationModal = () => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-green-500/30 rounded-lg p-6 max-w-md w-full relative">
        <button
          onClick={() => setShowAutomationModal(false)}
          className="absolute top-4 right-4 text-green-500 hover:text-green-400"
        >
          ×
        </button>
        <h3 className="text-lg font-bold text-green-500 mb-4">How to Add Automated Tag</h3>
        <ol className="list-decimal list-inside space-y-2 text-green-500/90">
          <li>Go to your account settings</li>
          <li>Select "Your account"</li>
          <li>Select "Your account information"</li>
          <li>Select "Automation"</li>
          <li>Select "Managing account"</li>
          <li>Next, select the Twitter account, which runs your bot account</li>
          <li>Enter your password to log in</li>
          <li>Finally, you should see confirmation that the label has been applied to your account.</li>
        </ol>
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAutomationModal(false)}
            className="px-4 py-2 bg-green-500 text-black rounded hover:bg-green-400 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Token</h1>
          <Link
            href={`/token/${address}`}
            className="px-4 py-2 border border-green-500 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
          >
            Back to Token
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description Section */}
          <div className="border border-green-500/30 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Description</h2>
            <div>
              <div className="relative">
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    // Limit to 255 characters
                    if (e.target.value.length <= 255) {
                      setFormData({ ...formData, description: e.target.value });
                    }
                  }}
                  className="w-full bg-black border border-green-500/30 text-green-500 p-2 rounded focus:border-green-500 focus:outline-none h-32"
                  placeholder="Describe your token..."
                  maxLength={255}
                />
                <div className="absolute bottom-2 right-2 text-sm text-green-500/50">
                  {formData.description.length}/255
                </div>
              </div>
              <p className="mt-2 text-sm text-green-500/50">
                This description will appear on your token's page
              </p>
            </div>
          </div>

          {/* Social Links Section */}
          <div className="border border-green-500/30 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Social Links</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-green-500/70 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full bg-black border border-green-500/30 text-green-500 p-2 rounded focus:border-green-500 focus:outline-none"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm text-green-500/70 mb-2">
                  Twitter URL
                </label>
                <input
                  type="url"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  className="w-full bg-black border border-green-500/30 text-green-500 p-2 rounded focus:border-green-500 focus:outline-none"
                  placeholder="https://twitter.com/..."
                />
              </div>

              <div>
                <label className="block text-sm text-green-500/70 mb-2">
                  Telegram URL
                </label>
                <input
                  type="url"
                  value={formData.telegram}
                  onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                  className="w-full bg-black border border-green-500/30 text-green-500 p-2 rounded focus:border-green-500 focus:outline-none"
                  placeholder="https://t.me/..."
                />
              </div>

              <div>
                <label className="block text-sm text-green-500/70 mb-2">
                  Warpcast URL
                </label>
                <input
                  type="url"
                  value={formData.warpcast}
                  onChange={(e) => setFormData({ ...formData, warpcast: e.target.value })}
                  className="w-full bg-black border border-green-500/30 text-green-500 p-2 rounded focus:border-green-500 focus:outline-none"
                  placeholder="https://warpcast.com/..."
                />
              </div>
            </div>
          </div>

          {agentsEnabled && formData.aiCharacter && (
            /* AI Character Section */
            <div className="border border-green-500/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">AI Character</h2>
                <label className="px-4 py-2 border border-green-500 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors cursor-pointer">
                  Import Character File
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="space-y-6">
                {/* Name Input */}
                <div>
                  <label className="block text-sm text-green-500/70 mb-2">
                    Name
                  </label>
                  <p className="text-sm text-green-500/50 mb-2">
                    The name of your AI character that will represent your token
                  </p>
                  <input
                    type="text"
                    value={formData.aiCharacter?.name || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      aiCharacter: { 
                        ...(formData.aiCharacter || {}), 
                        name: e.target.value 
                      }
                    })}
                    className="w-full bg-black border border-green-500/30 text-green-500 p-2 rounded focus:border-green-500 focus:outline-none"
                    placeholder="Character name..."
                  />
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-sm text-green-500/70 mb-2">
                    AI Model
                  </label>
                  <p className="text-sm text-green-500/50 mb-2">
                    Select the AI model that will power your character
                  </p>
                  <select
                    value={formData.aiCharacter.model}
                    onChange={(e) => setFormData({
                      ...formData,
                      aiCharacter: {
                        ...formData.aiCharacter,
                        model: e.target.value
                      }
                    })}
                    className="w-full bg-black border border-green-500/30 text-green-500 p-2 rounded focus:border-green-500 focus:outline-none"
                  >
                    <option value="claude-3-sonnet">Claude 3.5 Sonnet</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="llama-3">Llama 3.1</option>
                  </select>
                </div>

                {/* Bio Input */}
                <div>
                  <label className="block text-sm text-green-500/70 mb-2">
                    Bio
                  </label>
                  <p className="text-sm text-green-500/50 mb-2">
                    A detailed biography of your character's personality, background, and motivations
                  </p>
                  <textarea
                    value={formData.aiCharacter.bio}
                    onChange={(e) => setFormData({
                      ...formData,
                      aiCharacter: {
                        ...formData.aiCharacter,
                        bio: e.target.value
                      }
                    })}
                    className="w-full bg-black border border-green-500/30 text-green-500 p-2 rounded focus:border-green-500 focus:outline-none h-32"
                    placeholder="Enter character bio..."
                  />
                </div>

                {/* Lore Input */}
                <div>
                  <label className="block text-sm text-green-500/70 mb-2">
                    Lore
                  </label>
                  <p className="text-sm text-green-500/50 mb-2">
                    Historical events, facts, and stories that shape your character's world and knowledge
                  </p>
                  <textarea
                    value={formData.aiCharacter.lore}
                    onChange={(e) => setFormData({
                      ...formData,
                      aiCharacter: {
                        ...formData.aiCharacter,
                        lore: e.target.value
                      }
                    })}
                    className="w-full bg-black border border-green-500/30 text-green-500 p-2 rounded focus:border-green-500 focus:outline-none h-32"
                    placeholder="Enter character lore..."
                  />
                </div>

                {/* Post Examples with updated ListInput */}
                <div>
                  <ListInput
                    items={formData.aiCharacter.postExamples}
                    onChange={(newItems) => setFormData({
                      ...formData,
                      aiCharacter: {
                        ...formData.aiCharacter,
                        postExamples: newItems
                      }
                    })}
                    placeholder="Enter an example post..."
                    label="Post Examples"
                  />
                  <p className="text-sm text-green-500/50 mt-1">
                    Example posts that demonstrate your character's writing style and typical content
                  </p>
                </div>

                {/* Adjectives with updated ListInput */}
                <div>
                  <ListInput
                    items={formData.aiCharacter.adjectives}
                    onChange={(newItems) => setFormData({
                      ...formData,
                      aiCharacter: {
                        ...formData.aiCharacter,
                        adjectives: newItems
                      }
                    })}
                    placeholder="Enter an adjective..."
                    label="Adjectives"
                  />
                  <p className="text-sm text-green-500/50 mt-1">
                    Words that describe your character's personality and traits
                  </p>
                </div>

                {/* Topics with updated ListInput */}
                <div>
                  <ListInput
                    items={formData.aiCharacter.topics}
                    onChange={(newItems) => setFormData({
                      ...formData,
                      aiCharacter: {
                        ...formData.aiCharacter,
                        topics: newItems
                      }
                    })}
                    placeholder="Enter a topic..."
                    label="Topics"
                  />
                  <p className="text-sm text-green-500/50 mt-1">
                    Subjects and themes your character frequently discusses or is knowledgeable about
                  </p>
                </div>

                {/* Style Guidelines */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Style Guidelines</h3>
                  <p className="text-sm text-green-500/50 mb-2">
                    Specific instructions for how your character should communicate and interact
                  </p>
                  <div>
                    <ListInput
                      items={formData.aiCharacter.style.all}
                      onChange={(newItems) => setFormData({
                        ...formData,
                        aiCharacter: {
                          ...formData.aiCharacter,
                          style: {
                            ...formData.aiCharacter.style,
                            all: newItems
                          }
                        }
                      })}
                      placeholder="Enter a style guideline..."
                      label="General Style Guidelines"
                    />
                    <p className="text-sm text-green-500/50 mt-1">
                      Instructions that define how your character should write and behave
                    </p>
                  </div>
                </div>

                {/* Market Data and Tweets Per Day section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="marketData"
                        checked={formData.aiCharacter.includeMarketData}
                        onChange={(e) => setFormData({
                          ...formData,
                          aiCharacter: {
                            ...formData.aiCharacter,
                            includeMarketData: e.target.checked
                          }
                        })}
                        className="appearance-none w-5 h-5 border border-green-500/30 rounded bg-black checked:bg-green-500 checked:border-green-500 focus:outline-none focus:ring-0 transition-colors"
                      />
                      <svg
                        className={`absolute left-0.5 top-0.5 w-4 h-4 pointer-events-none ${
                          formData.aiCharacter.includeMarketData ? 'text-black' : 'hidden'
                        }`}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div>
                      <label htmlFor="marketData" className="text-sm text-green-500/70 select-none cursor-pointer">
                        Include Market Data in Responses
                      </label>
                      <p className="text-sm text-green-500/50 mt-1">
                        Allow your character to reference current market data in their posts
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-green-500/70 mb-2">
                      Tweets Per Day
                    </label>
                    <p className="text-sm text-green-500/50 mb-2">
                      How many times your character should post each day (1-48)
                    </p>
                    <input
                      type="number"
                      min="1"
                      max="48"
                      value={formData.aiCharacter.tweetsPerDay || 7}
                      onChange={(e) => setFormData({
                        ...formData,
                        aiCharacter: {
                          ...formData.aiCharacter,
                          tweetsPerDay: parseInt(e.target.value) || 7
                        }
                      })}
                      className="w-32 bg-black border border-green-500/30 text-green-500 p-2 rounded focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Generate Test Tweet Button */}
                <div className="mt-8 border-t border-green-500/30 pt-6">
                  <button
                    type="button"
                    onClick={handleGenerateExample}
                    disabled={isGeneratingTweet}
                    className="px-4 py-2 bg-black border border-green-500 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingTweet ? 'Generating...' : 'Generate Test Tweet'}
                  </button>

                  {exampleTweet && (
                    <div className="mt-4 p-4 bg-green-500/5 border border-green-500/30 rounded-lg">
                      <div className="font-bold text-green-500 mb-2">
                        Example Tweet:
                      </div>
                      <div className="text-green-500">
                        {exampleTweet}
                      </div>
                    </div>
                  )}
                </div>

                {/* Connect to X Button */}
                <div className="mt-8 border-t border-green-500/30 pt-6">
                  <button
                    type="button"
                    onClick={handleTwitterConnect}
                    disabled={isConnectingTwitter}
                    className="w-full px-6 py-3 bg-black border border-green-500 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span>
                      {isConnectingTwitter 
                        ? 'Connecting...' 
                        : twitterUsername 
                          ? `Disconnect @${twitterUsername}` 
                          : 'Connect to X (Twitter)'}
                    </span>
                  </button>
                  {twitterUsername && (
                    <p className="mt-2 text-sm text-green-500/70 text-center">
                      Connected as @{twitterUsername}
                    </p>
                  )}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowAutomationModal(true)}
                      className="text-xs text-green-500/70 hover:text-green-500 underline"
                    >
                      How to Add Automated Tag to Account (Required)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="space-y-4">
            {error && (
              <div className="text-red-500 text-center text-sm">
                {error}
              </div>
            )}
            <div className="flex flex-col items-center space-y-5">
              <button
                type="submit"
                disabled={saving}
                className={`px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded transition-colors ${
                  saving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
        {showAutomationModal && <AutomationModal />}
      </div>
    </div>
  );
} 
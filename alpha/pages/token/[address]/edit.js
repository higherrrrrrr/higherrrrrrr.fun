import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useSignMessage } from 'wagmi';
import { getTokenCreator, getToken, updateToken, upsertToken } from '../../../api/token';
import Link from 'next/link';

export default function EditTokenPage() {
  const router = useRouter();
  const { address } = router.query;
  const { address: userAddress } = useAccount();
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    description: '',
    website: '',
    twitter: '',
    telegram: '',
    warpcast: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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
        setFormData({
          description: tokenData.description || '',
          website: tokenData.website || '',
          twitter: tokenData.twitter || '',
          telegram: tokenData.telegram || '',
          warpcast: tokenData.warpcast_url || '',
        });
      } catch (error) {
        console.error('Failed to fetch token data:', error);
      }
    };
    fetchTokenData();
  }, [address]);

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

          {/* Submit Button */}
          <div className="space-y-4">
            {error && (
              <div className="text-red-500 text-center text-sm">
                {error}
              </div>
            )}
            <div className="flex justify-center">
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
      </div>
    </div>
  );
} 
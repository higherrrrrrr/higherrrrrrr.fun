// pages/[address]/settings.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const { address: queryAddress } = router.query;
  const { address: userAddress, isConnected } = useAccount();

  // Default profile settings – these can be loaded from an API.
  const [profile, setProfile] = useState({
    twitter: '',
    twitch: '',
    higherTV: '',
    telegram: '',
    profilePicture: '/placeholder-profile.png', // default picture URL
    publicProfile: true,
    showSocials: true,
  });

  // Simulate fetching profile settings for the address.
  useEffect(() => {
    if (queryAddress) {
      // Replace this with a real API call.
      setProfile({
        twitter: '@your_twitter',
        twitch: 'your_twitch_channel',
        higherTV: 'Your Channel TV Name',
        telegram: 'https://t.me/yourtelegram',
        profilePicture: '/placeholder-profile.png',
        publicProfile: true,
        showSocials: true,
      });
    }
  }, [queryAddress]);

  // For security, only allow editing when the query address matches the connected user.
  if (isConnected && userAddress && queryAddress && userAddress.toLowerCase() !== queryAddress.toLowerCase()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-green-500 font-mono">
        <p>You are not authorized to edit this profile.</p>
      </div>
    );
  }

  // Handle text input and toggle changes.
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle profile picture file change.
  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, profilePicture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Simulate a submit action.
  const handleSubmit = (e) => {
    e.preventDefault();
    // Replace this with an API call to save the settings.
    console.log('Saved profile settings:', profile);
    alert('Profile settings saved!');
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-4">
      <div className="max-w-2xl mx-auto">
        <Link 
          href={`/${queryAddress}`}
          className="mb-4 inline-block px-4 py-2 border border-green-500/30 rounded hover:bg-green-500/10 transition-colors"
        >
          ← Back to Profile
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Profile Settings</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border border-green-500/30 mb-2">
              <img
                src={profile.profilePicture}
                alt="Profile Picture"
                className="w-full h-full object-cover"
              />
            </div>
            <label className="cursor-pointer bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded transition-colors">
              Change Profile Picture
              <input type="file" accept="image/*" className="hidden" onChange={handlePictureChange} />
            </label>
          </div>

          {/* Social Media Links */}
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Twitter Handle</label>
              <input
                type="text"
                name="twitter"
                value={profile.twitter}
                onChange={handleChange}
                placeholder="@your_twitter"
                className="w-full bg-black border border-green-500/30 p-2 rounded focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-1">Twitch Channel</label>
              <input
                type="text"
                name="twitch"
                value={profile.twitch}
                onChange={handleChange}
                placeholder="your_twitch_channel"
                className="w-full bg-black border border-green-500/30 p-2 rounded focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-1">Higher Channel TV Name</label>
              <input
                type="text"
                name="higherTV"
                value={profile.higherTV}
                onChange={handleChange}
                placeholder="Your Channel TV Name"
                className="w-full bg-black border border-green-500/30 p-2 rounded focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-1">Telegram Link</label>
              <input
                type="text"
                name="telegram"
                value={profile.telegram}
                onChange={handleChange}
                placeholder="https://t.me/yourtelegram"
                className="w-full bg-black border border-green-500/30 p-2 rounded focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Public Settings Toggles */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="publicProfile"
                checked={profile.publicProfile}
                onChange={handleChange}
                className="mr-2"
              />
              <label>Make my profile public</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="showSocials"
                checked={profile.showSocials}
                onChange={handleChange}
                className="mr-2"
              />
              <label>Show my social links publicly</label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded transition-colors"
          >
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
}

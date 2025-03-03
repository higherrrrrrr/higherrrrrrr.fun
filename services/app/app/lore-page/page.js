'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GlitchText } from '../../components/GlitchText';
import Image from 'next/image';

export default function CreateLorePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  // State for form data
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    loreText: '',
    telegramUrl: '',
    twitterUrl: '',
    websiteUrl: '',
  });
  
  // State for image preview
  const [imagePreview, setImagePreview] = useState(null);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  
  // Handle back to dashboard
  const handleBackToDashboard = () => {
    router.push('/creator-dashboard-MVP');
  };
  
  // Handle form submission
  const handleSubmit = () => {
    // In a real app, you would save this to a database and get an ID
    // For now, we'll use localStorage and a timestamp as the ID
    const loreId = Date.now().toString();
    
    // Save the lore data to localStorage
    const loreData = {
      id: loreId,
      ...formData,
      imageUrl: imagePreview,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(`lore_${loreId}`, JSON.stringify(loreData));
    
    // Navigate to the created lore page
    router.push(`/lore-page/${loreId}`);
  };

  return (
    <div className="min-h-screen bg-black text-green-500 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button 
          onClick={handleBackToDashboard}
          className="flex items-center text-green-500 hover:text-green-400 transition mb-8"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </button>
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <GlitchText>Token Lore</GlitchText>
          </h1>
          <p className="text-xl text-green-500/80">
            Create a compelling story for your token
          </p>
        </div>
        
        {/* Form */}
        <div className="space-y-8">
          {/* Project Name */}
          <div>
            <label className="block text-green-500 mb-2">Project Name</label>
            <input
              type="text"
              name="projectName"
              value={formData.projectName}
              onChange={handleInputChange}
              placeholder="Your token name"
              className="w-full bg-black border border-green-500/30 rounded-lg p-4 text-green-500 focus:border-green-500 focus:outline-none"
            />
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-green-500 mb-2">Short Description</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="A brief description of your token"
              className="w-full bg-black border border-green-500/30 rounded-lg p-4 text-green-500 focus:border-green-500 focus:outline-none"
            />
          </div>
          
          {/* Social Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-green-500 mb-2">Telegram</label>
              <input
                type="text"
                name="telegramUrl"
                value={formData.telegramUrl}
                onChange={handleInputChange}
                placeholder="https://t.me/yourgroup"
                className="w-full bg-black border border-green-500/30 rounded-lg p-4 text-green-500 focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-green-500 mb-2">Twitter</label>
              <input
                type="text"
                name="twitterUrl"
                value={formData.twitterUrl}
                onChange={handleInputChange}
                placeholder="https://twitter.com/yourhandle"
                className="w-full bg-black border border-green-500/30 rounded-lg p-4 text-green-500 focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-green-500 mb-2">Website</label>
              <input
                type="text"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleInputChange}
                placeholder="https://yourwebsite.com"
                className="w-full bg-black border border-green-500/30 rounded-lg p-4 text-green-500 focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>
          
          {/* Image Upload */}
          <div>
            <label className="block text-green-500 mb-2">Token Image</label>
            <div 
              onClick={triggerFileInput}
              className="border-2 border-dashed border-green-500/30 rounded-lg p-8 text-center cursor-pointer hover:border-green-500/50 transition"
            >
              {imagePreview ? (
                <div className="relative w-full h-64">
                  <Image 
                    src={imagePreview}
                    alt="Token preview"
                    fill
                    style={{ objectFit: 'contain' }}
                    className="rounded-lg"
                  />
                </div>
              ) : (
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-green-500/80">Click to upload an image</p>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
          
          {/* Lore Text */}
          <div>
            <label className="block text-green-500 mb-2">Token Lore</label>
            <textarea
              name="loreText"
              value={formData.loreText}
              onChange={handleInputChange}
              placeholder="Tell the story of your token..."
              className="w-full bg-black border border-green-500/30 rounded-lg p-4 text-green-500 focus:border-green-500 focus:outline-none min-h-[200px]"
            />
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-center mt-8">
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded-lg border border-green-500/30 transition"
            >
              Create Lore Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

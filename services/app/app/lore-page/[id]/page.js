'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GlitchText } from '../../../components/GlitchText';
import Image from 'next/image';

export default function LorePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const fileInputRef = useRef(null);
  
  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  
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
  const [loading, setLoading] = useState(true);
  
  // Load existing data
  useEffect(() => {
    const storedData = localStorage.getItem(`lore_${id}`);
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setFormData({
        projectName: parsedData.projectName || '',
        description: parsedData.description || '',
        loreText: parsedData.loreText || '',
        telegramUrl: parsedData.telegramUrl || '',
        twitterUrl: parsedData.twitterUrl || '',
        websiteUrl: parsedData.websiteUrl || '',
      });
      setImagePreview(parsedData.imageUrl || null);
    }
    setLoading(false);
  }, [id]);
  
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
  
  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };
  
  // Handle save changes
  const handleSaveChanges = () => {
    // Get existing data to preserve fields we're not updating
    const existingData = JSON.parse(localStorage.getItem(`lore_${id}`) || '{}');
    
    // Update the lore data
    const updatedLoreData = {
      ...existingData,
      ...formData,
      imageUrl: imagePreview,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(`lore_${id}`, JSON.stringify(updatedLoreData));
    
    // Exit edit mode
    setIsEditMode(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-500 flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!formData.projectName && !isEditMode) {
    return (
      <div className="min-h-screen bg-black text-green-500 flex flex-col items-center justify-center p-8">
        <p className="text-xl mb-4">Lore page not found</p>
        <button
          onClick={handleBackToDashboard}
          className="px-6 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded-lg border border-green-500/30 transition"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-500 p-4 md:p-8">
      {isEditMode ? (
        // Edit Mode
        <div className="max-w-4xl mx-auto">
          {/* Navigation */}
          <div className="flex justify-between items-center mb-8">
            <button 
              onClick={handleBackToDashboard}
              className="flex items-center text-green-500 hover:text-green-400 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Dashboard
            </button>
          </div>
          
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
            
            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                type="button"
                onClick={toggleEditMode}
                className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg border border-red-500/30 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                className="px-6 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded-lg border border-green-500/30 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : (
        // View Mode - Styled like Wen Lamboo
        <div className="flex flex-col items-center justify-center max-w-5xl mx-auto">
          {/* Back button - small and discreet */}
          <div className="self-start mb-8">
            <button 
              onClick={handleBackToDashboard}
              className="flex items-center text-green-500/70 hover:text-green-400 transition text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back
            </button>
          </div>
          
          {/* Edit button - clearly visible at the top */}
          <div className="self-end absolute top-8 right-8">
            <button
              onClick={toggleEditMode}
              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded-lg border border-green-500/30 transition flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit Lore
            </button>
          </div>
          
          {/* Project Title - Glitchy and prominent */}
          <div className="text-center mb-6">
            <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-green-500 to-pink-500">
              <GlitchText>{formData.projectName}</GlitchText>
            </h1>
          </div>
          
          {/* Project Description */}
          <div className="text-center mb-10 max-w-2xl">
            <p className="text-xl text-green-500">
              {formData.description}
            </p>
          </div>
          
          {/* Social Links */}
          <div className="flex justify-center space-x-8 mb-12">
            {formData.websiteUrl && (
              <a 
                href={formData.websiteUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-500 hover:text-green-400 transition rounded-full border border-green-500/30 p-3"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm6.918 6h-3.215a16.301 16.301 0 00-.852-3.204A8.005 8.005 0 0118.918 8zM12 4.25c.955 0 2.072 1.445 2.706 4.75H9.294C9.928 5.695 11.045 4.25 12 4.25zM4.25 12c0-.69.062-1.363.18-2h3.675a17.92 17.92 0 00-.1 2c0 .689.034 1.359.1 2H4.43c-.118-.637-.18-1.31-.18-2zm.832 4h3.215c.188 1.14.478 2.22.852 3.204A8.005 8.005 0 015.082 16zM5.082 8h3.215c.374-.984.664-2.064.852-3.204A8.005 8.005 0 015.082 8zM12 19.75c-.955 0-2.072-1.445-2.706-4.75h5.412c-.634 3.305-1.751 4.75-2.706 4.75zm3.328-6.75a16.043 16.043 0 00.1-2c0-.689-.034-1.359-.1-2h5.344c.118.637.18 1.31.18 2s-.062 1.363-.18 2h-5.344zm1.87 5.954a16.301 16.301 0 00-.852-3.204h3.215a8.005 8.005 0 01-2.363 3.204z"/>
                </svg>
              </a>
            )}
            
            {formData.twitterUrl && (
              <a 
                href={formData.twitterUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-500 hover:text-green-400 transition rounded-full border border-green-500/30 p-3"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                </svg>
              </a>
            )}
            
            {formData.telegramUrl && (
              <a 
                href={formData.telegramUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-500 hover:text-green-400 transition rounded-full border border-green-500/30 p-3"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.14 19.018c-.237 0-.47-.033-.696-.08l-1.92 1.176v-1.613a6.558 6.558 0 01-2.483-1.532 6.559 6.559 0 01-1.931-4.658c0-1.627.59-3.202 1.658-4.427a6.558 6.558 0 014.572-2.092c1.738 0 3.37.675 4.6 1.9 1.23 1.226 1.91 2.856 1.91 4.6 0 1.737-.68 3.373-1.91 4.6-1.23 1.226-2.862 1.9-4.6 1.9h-.2z"/>
                </svg>
              </a>
            )}
          </div>
          
          {/* Project Image - In a bordered container like Wen Lamboo */}
          {imagePreview && (
            <div className="mb-16 w-full max-w-2xl">
              <div className="relative w-full h-[400px] border border-green-500/30 rounded-lg overflow-hidden">
                <Image 
                  src={imagePreview}
                  alt={formData.projectName}
                  fill
                  style={{ objectFit: 'contain' }}
                  className="rounded-lg"
                />
              </div>
            </div>
          )}
          
          {/* Lore Text - Simple and clean */}
          <div className="w-full max-w-3xl mb-16">
            <div className="text-green-500 whitespace-pre-line leading-relaxed text-lg">
              {formData.loreText}
            </div>
          </div>
          
          {/* Share Button - Floating in bottom left */}
          <div className="fixed bottom-8 left-8">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
              }}
              className="p-3 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded-full border border-green-500/30 transition shadow-lg"
              title="Share Lore Page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
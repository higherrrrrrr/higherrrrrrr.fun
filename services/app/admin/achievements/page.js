'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function AchievementsAdmin() {
  const { data: session } = useSession();
  const [achievements, setAchievements] = useState([]);
  const [newAchievement, setNewAchievement] = useState({
    name: '',
    description: '',
    icon: '🏆',
    target_value: 1,
    target_type: 'COUNT',
    trigger_action: 'TRADE',
    active: true
  });
  
  // Fetch existing achievements
  useEffect(() => {
    async function fetchAchievements() {
      const res = await fetch('/api/admin/achievements');
      const data = await res.json();
      setAchievements(data);
    }
    
    if (session?.user?.role === 'ADMIN') {
      fetchAchievements();
    }
  }, [session]);
  
  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    
    const res = await fetch('/api/admin/achievements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAchievement)
    });
    
    if (res.ok) {
      // Reset form and refresh list
      setNewAchievement({
        name: '',
        description: '',
        icon: '🏆',
        target_value: 1,
        target_type: 'COUNT',
        trigger_action: 'TRADE',
        active: true
      });
      
      // Refetch achievements
      const data = await res.json();
      setAchievements([...achievements, data]);
    }
  }
  
  // Form change handler
  function handleChange(e) {
    setNewAchievement({
      ...newAchievement,
      [e.target.name]: e.target.value
    });
  }
  
  // Toggle achievement active status
  async function toggleActive(id, currentStatus) {
    await fetch(`/api/admin/achievements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !currentStatus })
    });
    
    // Update local state
    setAchievements(achievements.map(a => 
      a.id === id ? {...a, active: !a.active} : a
    ));
  }
  
  if (!session || session?.user?.role !== 'ADMIN') {
    return <div>Access denied</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Achievements Management</h1>
      
      {/* Achievement creation form */}
      <div className="bg-gray-800 p-4 rounded-lg mb-8">
        <h2 className="text-xl mb-4">Create New Achievement</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form fields - name, description, etc. */}
          
          <button 
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Create Achievement
          </button>
        </form>
      </div>
      
      {/* List of existing achievements */}
      <div className="space-y-4">
        <h2 className="text-xl mb-4">Existing Achievements</h2>
        
        {achievements.map(achievement => (
          <div 
            key={achievement.id}
            className="bg-gray-800 p-4 rounded-lg flex justify-between items-center"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{achievement.icon}</span>
                <h3 className="text-lg font-semibold">{achievement.name}</h3>
              </div>
              <p className="text-gray-400">{achievement.description}</p>
              <div className="text-sm text-gray-500 mt-2">
                Target: {achievement.target_value} {achievement.target_type}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => toggleActive(achievement.id, achievement.active)}
                className={`px-3 py-1 rounded ${
                  achievement.active ? 'bg-green-700' : 'bg-gray-600'
                }`}
              >
                {achievement.active ? 'Active' : 'Inactive'}
              </button>
              
              <button className="px-3 py-1 rounded bg-blue-700">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
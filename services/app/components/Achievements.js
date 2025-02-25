'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Keyboard, EffectCards } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-cards';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export default function Achievements({ walletAddress }) {
  const [achievements, setAchievements] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const { width, height } = useWindowSize();
  const [isMobile, setIsMobile] = useState(false);
  
  // References to Swiper instances
  const achievementSwiperRef = useRef(null);
  const progressSwiperRef = useRef(null);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useEffect(() => {
    if (!walletAddress) return;
    
    async function fetchAchievements() {
      try {
        const response = await fetch(`/api/users/${walletAddress}/achievements`);
        const data = await response.json();
        
        const completedIds = new Set(data.achievements?.map(a => a.achievement_type));
        const filteredProgress = data.progress?.filter(p => !completedIds.has(p.achievement_id)) || [];
        
        setAchievements(data.achievements || []);
        setProgress(filteredProgress);
        
        if (data.achievements && data.achievements.length > 0) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      } catch (error) {
        console.error('Failed to fetch achievements:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAchievements();
  }, [walletAddress]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="text-green-500 font-mono text-xl"
        >
          Loading achievements...
        </motion.div>
      </div>
    );
  }
  
  // Custom next/prev methods for tinder-like swiping
  const handleSwipeLeft = (swiperRef) => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slideNext();
    }
  };
  
  const handleSwipeRight = (swiperRef) => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slidePrev();
    }
  };
  
  return (
    <div className="achievements-container">
      {showConfetti && <Confetti width={width} height={height} recycle={false} />}
      
      {/* Achievement Guide Toggle */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setShowGuide(!showGuide)}
          className="text-xs text-green-400 bg-black/40 px-3 py-1 rounded-full border border-green-500/30 hover:bg-black/60 transition"
        >
          {showGuide ? "Hide Guide" : "How to Earn"}
        </button>
      </div>
      
      {/* Achievement Guide Panel - only shows when toggled */}
      <AnimatePresence>
        {showGuide && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-3 bg-black/40 border border-green-500/30 rounded-lg"
          >
            <h3 className="text-green-400 text-sm font-bold mb-2">How to Earn Achievements</h3>
            <ul className="text-xs text-gray-300 space-y-2">
              <li><span className="text-green-400">🔄 Frequent Trader:</span> Complete 5 trades</li>
              <li><span className="text-green-400">🐋 Whale:</span> Deposit more than 10,000 tokens</li>
              <li><span className="text-green-400">💎 Diamond Hands:</span> Hold tokens for more than 30 days</li>
              <li><span className="text-green-400">💰 High Volume Trader:</span> Trade more than 10,000 tokens in volume</li>
              <li><span className="text-green-400">🚀 Early Buyer:</span> Purchase tokens within 24 hours of listing</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="achievements-layout">
        {/* Completed Achievements Section */}
        <div className="achievements-section">
          <h2 className="text-2xl font-bold mb-4 text-green-400">Your Achievements</h2>
          
          {achievements.length > 0 ? (
            <div className="achievement-swiper-container relative">
              <Swiper
                ref={achievementSwiperRef}
                effect={isMobile ? 'cards' : ''}
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={1}
                spaceBetween={10}
                speed={400}
                loop={achievements.length > 1}
                keyboard={{
                  enabled: true,
                }}
                modules={[Pagination, Navigation, Keyboard, EffectCards]}
                pagination={{
                  dynamicBullets: true,
                  clickable: true,
                  el: '.pagination-completed',
                }}
                navigation={{
                  nextEl: '.swiper-button-next-completed',
                  prevEl: '.swiper-button-prev-completed',
                }}
                className="achievement-swiper"
                onSwiper={(swiper) => {
                  // Clean up previous event listeners to avoid duplicates
                  const handleKeydown = (e) => {
                    if (e.key === 'ArrowLeft') handleSwipeRight(achievementSwiperRef);
                    if (e.key === 'ArrowRight') handleSwipeLeft(achievementSwiperRef);
                  };
                  
                  document.addEventListener('keydown', handleKeydown);
                  
                  // Store the cleanup function
                  swiper.keyboard.onDestroy = () => {
                    document.removeEventListener('keydown', handleKeydown);
                  };
                }}
              >
                {achievements.map((achievement) => (
                  <SwiperSlide 
                    key={achievement.id || achievement.achievement_type} 
                    className="achievement-slide"
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={isMobile ? {} : { scale: 1.02 }}
                      className="achievement-card"
                    >
                      <div className="card-glow"></div>
                      
                      <div className="card-content">
                        <div className="flex items-start justify-between">
                          <div className="text-4xl mb-3">{achievement.icon}</div>
                          <div className="completed-badge">COMPLETED</div>
                        </div>
                        
                        <div className="achievement-title-row">
                          <h3 className="font-bold text-lg text-green-400 mb-1">{achievement.name}</h3>
                          {achievement.completion_count > 1 && (
                            <span className="completion-count">{achievement.completion_count}x</span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-4">{achievement.description}</p>
                        
                        <div className="mt-4 text-xs font-mono text-green-400/80">
                          Achieved on {
                            (() => {
                              try {
                                const date = new Date(achievement.completed_at || achievement.achieved_at);
                                return date.toString() !== 'Invalid Date' 
                                  ? date.toLocaleDateString()
                                  : 'Recently'; // Fallback text
                              } catch (e) {
                                return 'Recently'; // Fallback text
                              }
                            })()
                          }
                        </div>
                      </div>
                    </motion.div>
                  </SwiperSlide>
                ))}
                
                {achievements.length > 1 && (
                  <>
                    <div className="swiper-button-next-completed"></div>
                    <div className="swiper-button-prev-completed"></div>
                  </>
                )}
              </Swiper>
              
              {achievements.length > 1 && (
                <>
                  <div className="pagination-completed"></div>
                  <div className="swipe-hint completed-hint">
                    <span className="swipe-text">Swipe left or right</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="empty-achievements bg-black/30 border border-green-500/20 rounded-lg p-4 text-center">
              <p className="text-gray-300 mb-3">Complete challenges to earn achievements!</p>
              <button 
                onClick={() => setShowGuide(true)}
                className="text-xs bg-green-800/50 text-white px-3 py-1 rounded-full hover:bg-green-700/50 transition"
              >
                See available achievements
              </button>
            </div>
          )}
        </div>
        
        {/* In Progress Section */}
        {progress.length > 0 && (
          <div className="progress-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-blue-400">In Progress</h2>
              <div className="text-xs text-gray-400">Complete these to earn achievements</div>
            </div>
            
            <div className="progress-swiper-container relative">
              <Swiper
                ref={progressSwiperRef}
                effect={isMobile ? 'cards' : ''}
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={1}
                spaceBetween={10}
                speed={400}
                loop={progress.length > 1}
                keyboard={{
                  enabled: true,
                }}
                modules={[Pagination, Navigation, Keyboard, EffectCards]}
                pagination={{
                  dynamicBullets: true,
                  clickable: true,
                  el: '.pagination-progress',
                }}
                navigation={{
                  nextEl: '.swiper-button-next-progress',
                  prevEl: '.swiper-button-prev-progress',
                }}
                className="achievement-swiper progress-swiper"
                onSwiper={(swiper) => {
                  document.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowLeft') handleSwipeRight(progressSwiperRef);
                    if (e.key === 'ArrowRight') handleSwipeLeft(progressSwiperRef);
                  });
                }}
              >
                {progress.map((item) => (
                  <SwiperSlide 
                    key={item.achievement_id} 
                    className="progress-slide"
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={isMobile ? {} : { scale: 1.02 }}
                      className="progress-card"
                    >
                      <div className="card-glow blue-glow"></div>
                      
                      <div className="card-content">
                        <div className="flex items-start justify-between">
                          <div className="text-4xl mb-3">{item.icon}</div>
                          <motion.div className="percent-complete">
                            {Math.min(100, Math.round((item.progress / item.target_value) * 100))}% complete
                          </motion.div>
                        </div>
                        
                        <h3 className="font-bold text-lg text-blue-400 mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-300 mb-4">{item.description}</p>
                        
                        <div className="mt-4 w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                          <motion.div 
                            className="progress-bar-fill h-3 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${Math.min(100, (item.progress / item.target_value) * 100)}%` 
                            }}
                            transition={{ duration: 1, delay: 0.2 }}
                          />
                        </div>
                        
                        <div className="mt-2">
                          <p className="text-xs font-mono text-blue-300/80">
                            {item.progress} / {item.target_value} {item.target_type?.toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </SwiperSlide>
                ))}
                
                {progress.length > 1 && (
                  <>
                    <div className="swiper-button-next-progress"></div>
                    <div className="swiper-button-prev-progress"></div>
                  </>
                )}
              </Swiper>
              
              {progress.length > 1 && (
                <>
                  <div className="pagination-progress"></div>
                  <div className="swipe-hint progress-hint">
                    <span className="swipe-text">Swipe left or right</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AchievementCard({ achievement }) {
  return (
    <div className="achievement-card">
      <div className="achievement-icon">{achievement.icon}</div>
      <div className="achievement-title-row">
        <h3 className="achievement-title">{achievement.name}</h3>
        {achievement.completion_count > 1 && (
          <span className="completion-count">{achievement.completion_count}x</span>
        )}
      </div>
      <p className="achievement-description">{achievement.description}</p>
      {/* other card content */}
    </div>
  );
}
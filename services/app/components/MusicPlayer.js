"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import debounce from 'lodash/debounce';

// Constants
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mM8w8DwHwAEOQHNmnaaOAAAAABJRU5ErkJggg==';
const DEBOUNCE_MS = 200;
const PRELOAD_TIMEOUT_MS = 100;

export default function MusicPlayer() {
  const [spotifyQuery, setSpotifyQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    tracks: { items: [] },
    albums: { items: [] },
    artists: { items: [] },
    playlists: { items: [] }
  });
  const [currentContent, setCurrentContent] = useState(null);
  const [currentContentType, setCurrentContentType] = useState(null);
  const [activeTab, setActiveTab] = useState('tracks');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const playerRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Memoize the debounced search function
  const debouncedSearch = useMemo(
    () => debounce((query) => handleSpotifySearch(query), DEBOUNCE_MS), 
    []
  );

  // Preload images for better performance
  const preloadImage = useCallback((url) => {
    if (!url || url === PLACEHOLDER_IMAGE) return;
    const img = new Image();
    img.src = url;
  }, []);

  // Preload images for visible results
  useEffect(() => {
    if (!showAutocomplete) return;
    
    const items = searchResults[activeTab]?.items || [];
    const timeout = setTimeout(() => {
      items.slice(0, 10).forEach(item => {
        if (item.album?.images?.[0]?.url) {
          preloadImage(item.album.images[0].url);
        } else if (item.images?.[0]?.url) {
          preloadImage(item.images[0].url);
        }
      });
    }, PRELOAD_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [searchResults, activeTab, showAutocomplete, preloadImage]);

  // Cache image URLs
  const getImageUrl = useCallback((item) => {
    if (!item) return PLACEHOLDER_IMAGE;
    return item.album?.images?.[0]?.url || 
           item.images?.[0]?.url || 
           PLACEHOLDER_IMAGE;
  }, []);

  const handleSpotifySearch = async (query) => {
    if (!query.trim()) {
      setSearchResults({
        tracks: { items: [] },
        albums: { items: [] },
        artists: { items: [] },
        playlists: { items: [] }
      });
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search request failed');
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setSearchResults(data);
      setShowAutocomplete(true);
    } catch (error) {
      setError(error.message || 'Failed to search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (spotifyQuery) {
      debouncedSearch(spotifyQuery);
    }
    return () => debouncedSearch.cancel();
  }, [spotifyQuery, debouncedSearch]);

  const getSpotifyEmbedUrl = useCallback((content, type) => {
    if (!content?.id || !type) return null;
    return `https://open.spotify.com/embed/${type}/${content.id}?utm_source=generator&theme=0`;
  }, []);

  const handleContentSelect = useCallback((content, type) => {
    if (currentContent?.id === content.id) return;

    const wasPlaying = isPlayingRef.current;
    setCurrentContent(content);
    setCurrentContentType(type);
    setShowAutocomplete(false);
    setSpotifyQuery('');

    const newPlayer = document.createElement('iframe');
    newPlayer.src = getSpotifyEmbedUrl(content, type);
    newPlayer.width = '100%';
    newPlayer.height = '352';
    newPlayer.frameBorder = '0';
    newPlayer.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share';
    newPlayer.className = 'rounded-lg';

    newPlayer.onload = () => {
      if (playerRef.current) {
        playerRef.current.replaceWith(newPlayer);
      }
      playerRef.current = newPlayer;
      if (wasPlaying) {
        setTimeout(() => {
          newPlayer.contentWindow?.postMessage({ command: 'play' }, '*');
        }, 100);
      }
    };
  }, [currentContent, getSpotifyEmbedUrl]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'playback_update') {
        isPlayingRef.current = event.data.data?.isPlaying;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="relative p-4">
        <input
          type="text"
          value={spotifyQuery}
          onChange={(e) => setSpotifyQuery(e.target.value)}
          placeholder="Search Spotify..."
          className="w-full bg-black border border-green-500/30 rounded-lg p-4 
            text-green-500 placeholder-green-500/30 font-mono
            focus:outline-none focus:border-green-500"
        />

        {showAutocomplete && spotifyQuery && (
          <div className="absolute left-4 right-4 top-[calc(100%-8px)] z-50">
            <div className="bg-black border border-green-500/30 rounded-lg shadow-lg overflow-hidden">
              <div className="flex border-b border-green-500/30">
                {['tracks', 'albums', 'artists', 'playlists'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 p-2 text-xs font-mono transition-colors ${
                      activeTab === tab 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'text-green-500/50 hover:text-green-500/70'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-green-500/30">
                    Searching...
                  </div>
                ) : error ? (
                  <div className="p-4 text-center text-red-500/50">
                    {error}
                  </div>
                ) : (
                  <div className="p-2">
                    {searchResults[activeTab]?.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleContentSelect(item, activeTab.slice(0, -1))}
                        className="w-full flex items-center gap-4 p-2 hover:bg-green-500/10 
                          transition-colors rounded-lg"
                      >
                        <img 
                          src={getImageUrl(item)}
                          alt=""
                          className={`w-10 h-10 ${activeTab === 'artists' ? 'rounded-full' : 'rounded'}`}
                        />
                        <div className="flex-grow text-left">
                          <div className="text-green-500 font-mono truncate">
                            {item.name}
                          </div>
                          <div className="text-green-500/60 text-sm truncate">
                            {activeTab === 'tracks' ? item.artists?.map(a => a.name).join(', ') :
                             activeTab === 'albums' ? item.artists?.map(a => a.name).join(', ') :
                             activeTab === 'playlists' ? `by ${item.owner?.display_name || 'Unknown'}` :
                             'Artist'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-grow p-4 overflow-hidden">
        <div className="h-full flex items-center justify-center">
          {currentContent && currentContentType ? (
            <div className="w-full max-w-2xl">
              <iframe
                ref={playerRef}
                key={currentContent.id}
                src={getSpotifyEmbedUrl(currentContent, currentContentType)}
                width="100%"
                height="352"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share"
                loading="eager"
                className="rounded-lg"
              />
            </div>
          ) : (
            <div className="text-green-500/30 font-mono">
              Search for something to play...
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
"use server";

import { NextResponse } from 'next/server';

// Cache for Spotify access tokens
let tokenCache = {
  token: null,
  expires: 0
};

async function getSpotifyToken() {
  try {
    // Check if cached token is still valid
    if (tokenCache.token && tokenCache.expires > Date.now()) {
      return tokenCache.token;
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get Spotify access token: ${error.error_description || error.error}`);
    }

    const data = await response.json();
    
    tokenCache = {
      token: data.access_token,
      expires: Date.now() + (data.expires_in * 1000) - 60000 // 1 minute buffer
    };

    return data.access_token;
  } catch (error) {
    throw error;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ 
        tracks: { items: [] },
        playlists: { items: [] },
        albums: { items: [] },
        artists: { items: [] }
      });
    }

    const accessToken = await getSpotifyToken();
    
    console.log('Searching with query:', query); // Debug log

    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,artist,album,playlist&market=US&limit=25`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error('Search error:', errorData);
      throw new Error(errorData.error?.message || 'Spotify search failed');
    }

    const data = await searchResponse.json();
    
    // Debug log raw data
    console.log('Raw Spotify response:', JSON.stringify(data, null, 2));

    // Enhanced sorting with null checks
    const sortedData = {
      tracks: {
        items: (data.tracks?.items || [])
          .filter(track => track && track.name) // Filter out null items
          .map(track => ({
            ...track,
            relevanceScore: (track.popularity || 0) + 
              (track.name?.toLowerCase().includes(query.toLowerCase()) ? 30 : 0) +
              (track.artists?.some(a => a?.name?.toLowerCase().includes(query.toLowerCase())) ? 20 : 0)
          }))
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
      },
      albums: {
        items: (data.albums?.items || [])
          .filter(album => album && album.name)
          .map(album => ({
            ...album,
            relevanceScore: (new Date(album.release_date || 0).getTime() / 1000000000) +
              (album.name?.toLowerCase().includes(query.toLowerCase()) ? 30 : 0) +
              (album.artists?.some(a => a?.name?.toLowerCase().includes(query.toLowerCase())) ? 20 : 0)
          }))
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
      },
      artists: {
        items: (data.artists?.items || [])
          .filter(artist => artist && artist.name)
          .map(artist => ({
            ...artist,
            relevanceScore: (Math.log(artist.followers?.total || 0) * 10) +
              (artist.name?.toLowerCase().includes(query.toLowerCase()) ? 50 : 0)
          }))
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
      },
      playlists: {
        items: (data.playlists?.items || [])
          .filter(playlist => playlist && playlist.name) // Filter out invalid playlists
          .map(playlist => {
            try {
              return {
                ...playlist,
                relevanceScore: 
                  ((playlist.name?.toLowerCase().includes(query.toLowerCase()) || false) ? 30 : 0) +
                  ((playlist.description?.toLowerCase().includes(query.toLowerCase()) || false) ? 15 : 0) +
                  ((playlist.owner?.display_name?.toLowerCase().includes(query.toLowerCase()) || false) ? 20 : 0) +
                  (playlist.collaborative ? 5 : 0) +
                  (playlist.public ? 5 : 0)
              };
            } catch (error) {
              console.error('Error processing playlist:', playlist, error);
              return null;
            }
          })
          .filter(Boolean) // Remove any null results from errors
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
      }
    };

    // Remove the relevanceScore
    Object.keys(sortedData).forEach(key => {
      sortedData[key].items = sortedData[key].items.map(item => {
        const { relevanceScore, ...rest } = item;
        return rest;
      });
    });

    // Debug log processed data
    console.log('Processed data structure:', {
      trackCount: sortedData.tracks.items.length,
      albumCount: sortedData.albums.items.length,
      artistCount: sortedData.artists.items.length,
      playlistCount: sortedData.playlists.items.length
    });

    return NextResponse.json(sortedData);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: error.status || 500 }
    );
  }
}
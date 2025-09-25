'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Star, Search, Filter, Calendar, Copy, Instagram, Twitter, Music, Video, Smartphone, Settings } from 'lucide-react';
import { Caption } from '@/types';

interface CaptionLibraryProps {
  userId: number;
}

export default function CaptionLibrary({ userId }: CaptionLibraryProps) {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadCaptions();
  }, [userId, platformFilter, favoriteOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCaptions = async () => {
    try {
      const params = new URLSearchParams({
        userId: userId.toString(),
        ...(platformFilter !== 'all' && { platform: platformFilter }),
        ...(favoriteOnly && { favoriteOnly: 'true' }),
      });

      const response = await fetch(`/api/captions?${params}`);
      if (response.ok) {
        const { captions } = await response.json();
        setCaptions(captions);
      }
    } catch (error) {
      console.error('Error loading captions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (captionId: number) => {
    try {
      const response = await fetch(`/api/captions/${captionId}/favorite`, {
        method: 'POST',
      });

      if (response.ok) {
        setCaptions(captions.map(caption => 
          caption.id === captionId 
            ? { ...caption, is_favorite: !caption.is_favorite }
            : caption
        ));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const filteredCaptions = captions.filter(caption => {
    const matchesSearch = searchTerm === '' || 
      caption.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caption.topic.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const platforms = ['all', ...Array.from(new Set(captions.map(c => c.platform)))];

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-5 w-5 text-pink-500" />;
      case 'twitter':
      case 'x':
        return <Twitter className="h-5 w-5 text-blue-400" />;
      case 'tiktok':
        return <span className="text-lg">🎵</span>;
      default:
        return <div className="h-5 w-5 bg-gray-400 rounded" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Caption Library</h2>
        <p className="text-gray-600">Browse and manage your saved captions</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Captions
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search captions..."
                className="block w-full h-10 pl-10 pr-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Settings className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="block w-full h-10 pl-10 pr-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {platforms.map(platform => (
                  <option key={platform} value={platform}>
                    {platform === 'all' ? 'All Platforms' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Options
            </label>
            <div className="flex items-center pt-2">
              <input
                type="checkbox"
                checked={favoriteOnly}
                onChange={(e) => setFavoriteOnly(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Favorites only</span>
            </div>
          </div>
        </div>
      </div>

      {/* Captions List */}
      {filteredCaptions.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No captions found' : 'No captions yet'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Try adjusting your search terms or filters.'
              : 'Generate some captions to build your library.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredCaptions.length} of {captions.length} captions
            </p>
          </div>

          {filteredCaptions.map((caption, index) => (
            <div key={caption.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      {getPlatformIcon(caption.platform)}
                      <span className="text-lg font-semibold text-gray-900">
                        {caption.platform.charAt(0).toUpperCase() + caption.platform.slice(1)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-600">{caption.topic}</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-600">{caption.tone}</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-600">{caption.char_count} chars</span>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {new Date(caption.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(caption.text, index)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    <span>{copiedIndex === index ? 'Copied!' : 'Copy'}</span>
                  </button>
                  
                  <button
                    onClick={() => toggleFavorite(caption.id)}
                    className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-lg transition-colors ${
                      caption.is_favorite
                        ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Star className={`h-4 w-4 ${caption.is_favorite ? 'fill-current' : ''}`} />
                    <span>{caption.is_favorite ? 'Favorited' : 'Favorite'}</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 px-3 py-1 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">
                    <Calendar className="h-4 w-4" />
                    <span>Schedule</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Caption
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-gray-900">{caption.text}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hashtags
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-gray-900">
                      {caption.hashtags.map(tag => `#${tag}`).join(' ')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

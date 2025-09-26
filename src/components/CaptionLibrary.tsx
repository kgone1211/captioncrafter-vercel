'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Star, Search, Calendar, Copy, Instagram, Twitter, Settings } from 'lucide-react';
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

  const scheduleCaption = async (caption: Caption) => {
    try {
      // Show scheduling modal
      const schedulingData = await showSchedulingModal();
      if (!schedulingData) return;

      const { scheduledAt, notifyVia } = schedulingData;

      // Schedule the post
      const scheduleResponse = await fetch('/api/scheduled-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          captionId: caption.id,
          platform: caption.platform,
          scheduledAt: scheduledAt.toISOString(),
          notifyVia,
        }),
      });

      if (scheduleResponse.ok) {
        alert('Caption scheduled successfully!');
      } else {
        alert('Failed to schedule caption');
      }
    } catch (error) {
      console.error('Schedule error:', error);
      alert('Error scheduling caption');
    }
  };

  const showSchedulingModal = (): Promise<{ scheduledAt: Date; notifyVia: string } | null> => {
    return new Promise((resolve) => {
      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      
      // Create modal content
      const modal = document.createElement('div');
      modal.className = 'bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4';
      
      modal.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Schedule Caption</h3>
            <button id="close-modal" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input type="date" id="schedule-date" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Time</label>
            <input type="time" id="schedule-time" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
          </div>
          
          <div>
            <label class="flex items-center">
              <input type="checkbox" id="email-notification" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
              <span class="ml-2 text-sm text-gray-700">Send email notification when post is due</span>
            </label>
          </div>
          
          <div class="flex space-x-3 pt-4">
            <button id="cancel-schedule" class="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button id="confirm-schedule" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Schedule
            </button>
          </div>
        </div>
      `;
      
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      
      // Set minimum date to today
      const dateInput = modal.querySelector('#schedule-date') as HTMLInputElement;
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
      dateInput.value = today;
      
      // Set default time to 1 hour from now
      const timeInput = modal.querySelector('#schedule-time') as HTMLInputElement;
      const now = new Date();
      now.setHours(now.getHours() + 1);
      timeInput.value = now.toTimeString().slice(0, 5);
      
      // Event handlers
      const closeModal = () => {
        document.body.removeChild(overlay);
        resolve(null);
      };
      
      const confirmSchedule = () => {
        const date = dateInput.value;
        const time = timeInput.value;
        const emailNotification = (modal.querySelector('#email-notification') as HTMLInputElement).checked;
        
        if (!date || !time) {
          alert('Please select both date and time');
          return;
        }
        
        const scheduledAt = new Date(`${date}T${time}`);
        
        // Check if the date is in the future
        if (scheduledAt <= new Date()) {
          alert('Please schedule for a future date and time.');
          return;
        }
        
        document.body.removeChild(overlay);
        resolve({
          scheduledAt,
          notifyVia: emailNotification ? 'Email' : 'None'
        });
      };
      
      // Add event listeners
      overlay.querySelector('#close-modal')?.addEventListener('click', closeModal);
      overlay.querySelector('#cancel-schedule')?.addEventListener('click', closeModal);
      overlay.querySelector('#confirm-schedule')?.addEventListener('click', confirmSchedule);
      
      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
    });
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
      case 'threads':
        return <span className="text-lg">🧵</span>;
      case 'linkedin':
        return <span className="text-lg">💼</span>;
      case 'facebook':
        return <span className="text-lg">📘</span>;
      case 'telegram':
        return <span className="text-lg">✈️</span>;
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
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="block w-full h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
                {platforms.map(platform => (
                  <option key={platform} value={platform}>
                    {platform === 'all' ? 'All Platforms' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </option>
                ))}
            </select>
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
                  
                  <button
                    onClick={() => scheduleCaption(caption)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                  >
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

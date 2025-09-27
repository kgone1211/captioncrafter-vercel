'use client';

import { useState } from 'react';
import { Wand2, Copy, Star, Calendar, Hash, Clock } from 'lucide-react';
import { CaptionGenerationRequest, CaptionGenerationResponse } from '@/types';
import { PLATFORM_LIMITS, TONE_PRESETS, getLengthPresets } from '@/lib/presets';
import UsageCounter from './UsageCounter';

interface CaptionGeneratorProps {
  userId: number;
  onStatsUpdate: () => void;
}

export default function CaptionGenerator({ userId, onStatsUpdate }: CaptionGeneratorProps) {
  const [formData, setFormData] = useState<CaptionGenerationRequest>({
    platform: 'instagram',
    topic: '',
    tone: 'Authority',
    length: 'medium',
    num_variants: 5,
    keywords: '',
    cta: '',
    description: '',
    include_emojis: true,
  });

  const [captions, setCaptions] = useState<CaptionGenerationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleInputChange = (field: keyof CaptionGenerationRequest, value: string | number | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Reset length when platform changes to ensure it's valid for the new platform
      if (field === 'platform') {
        const lengthPresets = getLengthPresets(value as string);
        const validLengths = Object.keys(lengthPresets);
        if (!validLengths.includes(newData.length)) {
          newData.length = 'medium'; // Default to medium if current length is invalid
        }
      }
      
      return newData;
    });
  };

  const generateCaptions = async () => {
    if (!formData.topic.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: userId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle usage limit error
        if (response.status === 403 && errorData.canGenerate === false) {
          alert('You have used all 3 free captions. Please upgrade to continue.');
          return;
        }
        
        throw new Error(errorData.error || 'Failed to generate captions');
      }

      const { captions } = await response.json();
      setCaptions(captions);
      onStatsUpdate(); // Refresh usage counter after successful generation
      setRefreshTrigger(prev => prev + 1); // Trigger UsageCounter refresh
    } catch (error) {
      console.error('Generation error:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate captions');
    } finally {
      setLoading(false);
    }
  };

  const saveCaption = async (caption: CaptionGenerationResponse) => {
    try {
      const response = await fetch('/api/captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          platform: formData.platform,
          topic: formData.topic,
          tone: formData.tone,
          text: caption.caption,
          hashtags: caption.hashtags,
          charCount: caption.char_count,
        }),
      });

      if (response.ok) {
        onStatsUpdate();
        // Show success feedback
        alert('Caption saved successfully!');
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  // const copyToClipboard = async (text: string, index: number) => {
  //   try {
  //     await navigator.clipboard.writeText(text);
  //     setCopiedIndex(index);
  //     setTimeout(() => setCopiedIndex(null), 2000);
  //   } catch (error) {
  //     console.error('Copy error:', error);
  //   }
  // };

  const copyCaptionWithHashtags = async (caption: CaptionGenerationResponse, index: number) => {
    try {
      const fullText = `${caption.caption}\n\n${caption.hashtags.map(tag => `#${tag}`).join(' ')}`;
      await navigator.clipboard.writeText(fullText);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const copyAllCaptions = async () => {
    try {
      const allText = captions.map((caption, index) => 
        `Caption ${index + 1}:\n${caption.caption}\n\nHashtags: ${caption.hashtags.map(tag => `#${tag}`).join(' ')}\n\n---\n`
      ).join('');
      
      await navigator.clipboard.writeText(allText);
      // Show a brief success message
      const tempIndex = -1; // Use -1 to show "All Copied!" message
      setCopiedIndex(tempIndex);
      setTimeout(() => setCopiedIndex(null), 3000);
    } catch (error) {
      console.error('Copy all error:', error);
    }
  };

  const scheduleCaption = async (caption: CaptionGenerationResponse) => {
    try {
      // First save the caption if it hasn't been saved yet
      const saveResponse = await fetch('/api/captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          platform: formData.platform,
          topic: formData.topic,
          tone: formData.tone,
          text: caption.caption,
          hashtags: caption.hashtags,
          charCount: caption.char_count,
        }),
      });

      if (!saveResponse.ok) {
        alert('Failed to save caption for scheduling');
        return;
      }

      const { captionId } = await saveResponse.json();

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
          captionId,
          platform: formData.platform,
          scheduledAt: scheduledAt.toISOString(),
          notifyVia,
        }),
      });

      if (scheduleResponse.ok) {
        alert('Caption scheduled successfully!');
        onStatsUpdate();
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

  const platformConfig = PLATFORM_LIMITS[formData.platform];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Generate Captions</h2>
        <p className="text-gray-600 mb-4">Create engaging social media captions with AI</p>
        <UsageCounter userId={userId} className="justify-center" refreshTrigger={refreshTrigger} />
      </div>

      {/* Generation Form */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform
              </label>
              <select
                value={formData.platform}
                onChange={(e) => handleInputChange('platform', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.keys(PLATFORM_LIMITS).map(platform => (
                  <option key={platform} value={platform}>
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic/Niche
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                placeholder="fitness, cooking, travel..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Provide additional context, details, or specific points you want included in your captions..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Add context, specific details, or instructions to help generate more personalized captions
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone
              </label>
              <select
                value={formData.tone}
                onChange={(e) => handleInputChange('tone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {TONE_PRESETS.map(tone => (
                  <option key={tone} value={tone}>{tone}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Length
              </label>
              <select
                value={formData.length}
                onChange={(e) => handleInputChange('length', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(getLengthPresets(formData.platform)).map(([length, chars]) => (
                  <option key={length} value={length}>
                    {length.charAt(0).toUpperCase() + length.slice(1)} (~{chars} chars)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Variants
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={formData.num_variants}
                onChange={(e) => handleInputChange('num_variants', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600 mt-1">
                {formData.num_variants} variants
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords (optional)
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => handleInputChange('keywords', e.target.value)}
                placeholder="motivation, tips, success..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Call-to-Action (optional)
              </label>
              <input
                type="text"
                value={formData.cta}
                onChange={(e) => handleInputChange('cta', e.target.value)}
                placeholder="Follow for more tips!"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="emojis"
                checked={formData.include_emojis}
                onChange={(e) => handleInputChange('include_emojis', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="emojis" className="ml-2 block text-sm text-gray-700">
                Include emojis
              </label>
            </div>
          </div>
        </div>

        {/* Platform Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-800">
            <Hash className="h-5 w-5" />
            <span className="font-medium">
              {formData.platform.charAt(0).toUpperCase() + formData.platform.slice(1)}:
            </span>
            <span>
              {platformConfig.char_limit} char limit, {platformConfig.hashtag_range[0]}-{platformConfig.hashtag_range[1]} hashtags
            </span>
          </div>
        </div>

        <button
          onClick={generateCaptions}
          disabled={loading || !formData.topic.trim()}
          className="w-full mt-6 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Wand2 className="h-5 w-5" />
              <span>Generate Captions</span>
            </>
          )}
        </button>
      </div>

      {/* Generated Captions */}
      {captions.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Generated {captions.length} Captions
            </h3>
            <button
              onClick={copyAllCaptions}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Copy className="h-4 w-4" />
              <span>{copiedIndex === -1 ? 'All Copied!' : 'Copy All Captions'}</span>
            </button>
          </div>
          
          {captions.map((caption, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-500">Caption {index + 1}</span>
                  <span className="text-sm text-gray-400">•</span>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{caption.char_count} characters</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyCaptionWithHashtags(caption, index)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    <span>{copiedIndex === index ? 'Copied!' : 'Copy All'}</span>
                  </button>
                  
                  <button
                    onClick={() => saveCaption(caption)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Star className="h-4 w-4" />
                    <span>Save</span>
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Caption
                  </label>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-gray-900 whitespace-pre-wrap">{caption.caption}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hashtags
                  </label>
                  <div className="p-4 bg-gray-50 rounded-lg border">
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

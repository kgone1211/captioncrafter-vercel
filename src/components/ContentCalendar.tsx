'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Trash2, Edit, Mail } from 'lucide-react';
import { ScheduledPost } from '@/types';

interface ContentCalendarProps {
  userId: number;
}

export default function ContentCalendar({ userId }: ContentCalendarProps) {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'list' | 'week' | 'month'>('list');
  const [userTimezone, setUserTimezone] = useState<string>('');

  useEffect(() => {
    // Detect user's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(timezone);
    loadScheduledPosts();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadScheduledPosts = async () => {
    try {
      const response = await fetch(`/api/scheduled-posts?userId=${userId}`);
      if (response.ok) {
        const { posts } = await response.json();
        setPosts(posts);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this scheduled post?')) return;

    try {
      const response = await fetch(`/api/scheduled-posts/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPosts(posts.filter(post => post.id !== postId));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const formatDateWithTimezone = (dateString: string) => {
    const date = new Date(dateString);
    const localTime = date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
    
    const utcTime = date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
    
    return { localTime, utcTime };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'SENT': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Content Calendar</h2>
        <p className="text-gray-600">Manage your scheduled posts</p>
        {userTimezone && (
          <div className="mt-2 flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Times shown in your timezone: {userTimezone}</span>
          </div>
        )}
      </div>

      {/* View Controls */}
      <div className="flex justify-center">
        <div className="bg-white rounded-lg p-1 shadow-sm border">
          <button
            onClick={() => setViewType('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewType === 'list'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewType('week')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewType === 'week'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Week View
          </button>
          <button
            onClick={() => setViewType('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewType === 'month'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Month View
          </button>
        </div>
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled posts</h3>
          <p className="text-gray-600">
            Generate some captions and schedule them to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                      {post.status}
                    </span>
                    {post.notify_via === 'Email' && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Mail className="h-3 w-3" />
                        <span>Email</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(post.scheduled_at)}</span>
                      </div>
                      <span>•</span>
                      <span>{post.topic}</span>
                      <span>•</span>
                      <span>{post.tone}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      📅 {formatDateWithTimezone(post.scheduled_at).localTime} • 
                      🌍 UTC: {formatDateWithTimezone(post.scheduled_at).utcTime}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Caption Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 mb-2">{post.text}</p>
                <p className="text-sm text-gray-600">
                  {post.hashtags?.map(tag => `#${tag}`).join(' ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

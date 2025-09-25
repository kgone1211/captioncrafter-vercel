'use client';

import { useState } from 'react';
import { Target, Calendar, BookOpen, User } from 'lucide-react';
import CaptionGenerator from '@/components/CaptionGenerator';
import ContentCalendar from '@/components/ContentCalendar';
import CaptionLibrary from '@/components/CaptionLibrary';
import UserLogin from '@/components/UserLogin';
import NotificationToast, { useNotifications } from '@/components/NotificationToast';
import { UserStats } from '@/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'generate' | 'calendar' | 'library'>('generate');
  const [user, setUser] = useState<{ id: number; email: string } | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();

  const tabs = [
    { id: 'generate', label: 'Generate', icon: Target },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'library', label: 'Library', icon: BookOpen },
  ];

  const handleLogin = async (email: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const { userId } = await response.json();
        setUser({ id: userId, email });
        await loadUserStats(userId);
        showSuccess('Welcome back!', `Logged in as ${email}`);
      } else {
        showError('Login failed', 'Please try again with a valid email address');
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('Connection error', 'Unable to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async (userId: number) => {
    try {
      const response = await fetch(`/api/stats?userId=${userId}`);
      if (response.ok) {
        const { stats } = await response.json();
        setStats(stats);
      }
    } catch (error) {
      console.error('Stats error:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setStats(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Caption Crafter</h1>
              <p className="text-gray-600">AI-powered social media caption generator</p>
            </div>
            
            <UserLogin onLogin={handleLogin} loading={loading} />
            
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                No password required • Just enter your email to get started
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 py-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Caption Crafter</h1>
                <p className="text-sm text-gray-500">Welcome back, {user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {stats && (
                <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{stats.total_captions} captions</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{stats.scheduled_posts} scheduled</span>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b mt-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'generate' | 'calendar' | 'library')}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'generate' && <CaptionGenerator userId={user.id} onStatsUpdate={() => loadUserStats(user.id)} />}
        {activeTab === 'calendar' && <ContentCalendar userId={user.id} onStatsUpdate={() => loadUserStats(user.id)} />}
        {activeTab === 'library' && <CaptionLibrary userId={user.id} />}
      </main>

      {/* Notification Toasts */}
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          id={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          duration={notification.duration}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
}
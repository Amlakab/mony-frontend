'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { webSocketService } from '@/app/utils/websocket';
import { GamePage } from '@/components/collection/GamePage';

export default function CollectionGamePage() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [language] = useState<'en' | 'am'>('en');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && user?._id) {
      webSocketService.connect(token, user._id);
      
      const handleConnected = () => {
        console.log('Connected to WebSocket');
        setIsConnected(true);
      };
      
      webSocketService.on('connected', handleConnected);
      
      return () => {
        webSocketService.off('connected', handleConnected);
      };
    }
  }, [user]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">Connecting to game server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <GamePage webSocketService={webSocketService} language={language} user={user} />
    </div>
  );
}
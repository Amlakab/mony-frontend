'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { webSocketService } from '@/app/utils/websocket';
import { GamePage } from '@/components/collection/GamePage';

export default function CollectionGamePage() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [language] = useState<'en' | 'am'>('en');

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    console.log('User exists:', !!user);
    
    if (token && user?._id) {
      console.log('Connecting to WebSocket with userId:', user._id);
      
      // Connect to WebSocket
      webSocketService.connect(token, user._id);
      
      // Handle connection success
      const handleConnected = () => {
        console.log('Connected event received');
        setIsConnected(true);
        setConnectionError(null);
        
        // Request batches after connection
        setTimeout(() => {
          webSocketService.send('get-batches');
        }, 500);
      };
      
      // Handle connection error
      const handleError = (error: any) => {
        console.error('Connection error:', error);
        setConnectionError(error.message || 'Failed to connect');
        setIsConnected(false);
      };
      
      // Handle disconnect
      const handleDisconnected = () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      };
      
      webSocketService.on('connected', handleConnected);
      webSocketService.on('error', handleError);
      webSocketService.on('disconnected', handleDisconnected);
      
      return () => {
        webSocketService.off('connected', handleConnected);
        webSocketService.off('error', handleError);
        webSocketService.off('disconnected', handleDisconnected);
      };
    } else {
      console.log('Waiting for token or user...');
    }
  }, [user]);

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md">
          <div className="text-5xl mb-4">🔌</div>
          <h2 className="text-2xl font-bold text-white mb-2">Connection Failed</h2>
          <p className="text-purple-200 mb-4">{connectionError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-purple-100 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Connecting to game server...</p>
          <p className="text-purple-200 text-sm mt-2">Attempting to connect to {process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'}</p>
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
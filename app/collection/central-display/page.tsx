'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { webSocketService } from '@/app/utils/websocket';
import { CentralDisplay } from '@/components/collection/CentralDisplay';

export default function CentralDisplayPage() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4 text-xl">Connecting to display server...</p>
        </div>
      </div>
    );
  }

  return <CentralDisplay webSocketService={webSocketService} />;
}
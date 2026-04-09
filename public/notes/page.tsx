'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { webSocketService } from '@/app/utils/websocket';

interface Batch {
  _id: string;
  name: string;
  totalCollected: number;
  lastDonationTime: Date;
  boxes: {
    box_5: { total: number; noteCount: number };
    box_10: { total: number; noteCount: number };
    box_50: { total: number; noteCount: number };
    box_100: { total: number; noteCount: number };
    box_200: { total: number; noteCount: number };
  };
}

interface FlyingNote {
  id: string;
  noteType: number;
  targetBatchId: string;
  targetBox: string;
  image: string;
  startX: number;
  startY: number;
}

export default function CentralDisplayPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [flyingNotes, setFlyingNotes] = useState<FlyingNote[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [totalAllBatches, setTotalAllBatches] = useState(0);
  const [selectedBatchForDetail, setSelectedBatchForDetail] = useState<Batch | null>(null);
  const [showLiveFeed, setShowLiveFeed] = useState(true);
  const [lastReorderTime, setLastReorderTime] = useState<Date>(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && user?._id) {
      webSocketService.connect(token, user._id);
      
      const handleConnected = () => {
        console.log('Central Display - Connected');
        setIsConnected(true);
        setTimeout(() => {
          webSocketService.send('get-all-batch-totals');
          webSocketService.send('get-recent-transactions', { limit: 30 });
        }, 500);
      };
      
      const handleError = (error: any) => {
        console.error('Connection error:', error);
      };
      
      webSocketService.on('connected', handleConnected);
      webSocketService.on('error', handleError);
      
      return () => {
        webSocketService.off('connected', handleConnected);
        webSocketService.off('error', handleError);
      };
    }
  }, [user]);

  useEffect(() => {
    if (!isConnected) return;

    const handleMoneyCollected = (data: any) => {
      const { transaction, allBatchTotals } = data;
      console.log('Money collected:', transaction);
      
      // Update last donation time for the batch
      const updatedBatches = allBatchTotals.map((batch: Batch) => {
        if (batch._id === transaction.batchId) {
          return { ...batch, lastDonationTime: new Date() };
        }
        return batch;
      });
      
      // Sort batches by last donation time (newest first)
      const sortedBatches = [...updatedBatches].sort((a, b) => {
        const dateA = new Date(a.lastDonationTime || 0);
        const dateB = new Date(b.lastDonationTime || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setBatches(sortedBatches);
      setLastReorderTime(new Date());
      
      const grandTotal = updatedBatches.reduce((sum: number, batch: Batch) => sum + batch.totalCollected, 0);
      setTotalAllBatches(grandTotal);
      
      setRecentTransactions(prev => [transaction, ...prev].slice(0, 30));
      
      // Create flying notes animation
      const notes = transaction.breakdown.map((note: any, index: number) => ({
        id: `${transaction.sequenceId}-${index}`,
        noteType: note.noteType,
        targetBatchId: transaction.batchId,
        targetBox: note.targetBox,
        image: note.image,
        startX: Math.random() * 80 + 10,
        startY: -10
      }));
      
      notes.forEach((note: FlyingNote, idx: number) => {
        setTimeout(() => {
          setFlyingNotes(prev => [...prev, note]);
          setTimeout(() => {
            setFlyingNotes(prev => prev.filter(n => n.id !== note.id));
          }, 1200);
        }, idx * 250);
      });
    };

    const handleAllBatchTotals = (data: Batch[]) => {
      console.log('All batch totals:', data);
      // Sort batches by last donation time (newest first)
      const sortedBatches = [...data].sort((a, b) => {
        const dateA = new Date(a.lastDonationTime || 0);
        const dateB = new Date(b.lastDonationTime || 0);
        return dateB.getTime() - dateA.getTime();
      });
      setBatches(sortedBatches);
      const grandTotal = data.reduce((sum, batch) => sum + batch.totalCollected, 0);
      setTotalAllBatches(grandTotal);
    };

    const handleRecentTransactions = (data: any[]) => {
      setRecentTransactions(data);
    };

    webSocketService.on('money-collected', handleMoneyCollected);
    webSocketService.on('all-batch-totals', handleAllBatchTotals);
    webSocketService.on('recent-transactions', handleRecentTransactions);

    return () => {
      webSocketService.off('money-collected', handleMoneyCollected);
      webSocketService.off('all-batch-totals', handleAllBatchTotals);
      webSocketService.off('recent-transactions', handleRecentTransactions);
    };
  }, [isConnected]);

  const getBoxIcon = (boxName: string) => {
    const icons: Record<string, string> = {
      box_5: '💚',
      box_10: '💙',
      box_50: '💛',
      box_100: '🧡',
      box_200: '❤️'
    };
    return icons[boxName] || '📦';
  };

  const getBoxGradient = (boxName: string) => {
    const gradients: Record<string, string> = {
      box_5: 'from-green-500 to-green-700',
      box_10: 'from-blue-500 to-blue-700',
      box_50: 'from-yellow-500 to-yellow-700',
      box_100: 'from-orange-500 to-orange-700',
      box_200: 'from-red-500 to-red-700'
    };
    return gradients[boxName] || 'from-gray-500 to-gray-700';
  };

  const getBoxLabel = (boxName: string) => {
    const labels: Record<string, string> = {
      box_5: '5 Br',
      box_10: '10 Br',
      box_50: '50 Br',
      box_100: '100 Br',
      box_200: '200 Br'
    };
    return labels[boxName] || boxName;
  };

  const getBoxPositions = (radius: number) => {
    const angles = [-72, -36, 0, 36, 72];
    return angles.map(angle => ({
      angle,
      x: Math.sin((angle * Math.PI) / 180) * radius,
      y: -Math.cos((angle * Math.PI) / 180) * radius
    }));
  };

  const boxPositions = getBoxPositions(130);

  // Helper to format time difference
  const getTimeAgo = (date: Date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Connecting to display server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header with Grand Total */}
      <div className="sticky top-0 z-30 bg-black/50 backdrop-blur-md border-b border-yellow-500/30">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
                <span>🎯</span> Live Money Collection
              </h1>
              <button
                onClick={() => setShowLiveFeed(!showLiveFeed)}
                className="md:hidden bg-yellow-500/20 px-3 py-1 rounded-full text-xs text-yellow-400"
              >
                {showLiveFeed ? 'Hide Feed' : 'Show Feed'}
              </button>
            </div>
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl px-5 py-2 shadow-2xl">
              <p className="text-yellow-100 text-xs">Grand Total</p>
              <p className="text-2xl font-bold text-white">{totalAllBatches.toFixed(2)} Br</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Flex Layout */}
      <div className="flex flex-col lg:flex-row gap-6 p-6">
        {/* Batches Grid - Dynamic ordering based on recent donations */}
        <div className={`flex-1 transition-all duration-300 ${showLiveFeed ? 'lg:mr-0' : ''}`}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-[1600px] mx-auto">
            <AnimatePresence mode="popLayout">
              {batches.map((batch, batchIndex) => (
                <motion.div
                  key={batch._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -50 }}
                  transition={{ 
                    duration: 0.5,
                    delay: batchIndex * 0.05,
                    layout: { duration: 0.3 }
                  }}
                  whileHover={{ scale: 1.02 }}
                  className="relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-3xl p-4 border border-yellow-500/20 shadow-2xl hover:shadow-yellow-500/10 transition-all duration-300"
                >
                  {/* Batch Header - Center Top */}
                  <div className="text-center mb-6 relative">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="inline-block cursor-pointer"
                      onClick={() => setSelectedBatchForDetail(batch)}
                    >
                      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-3 w-20 h-20 mx-auto flex items-center justify-center shadow-2xl border-2 border-yellow-400">
                        <span className="text-3xl">🏫</span>
                      </div>
                    </motion.div>
                    <h2 className="text-lg font-bold text-yellow-400 mt-2">{batch.name}</h2>
                    <div className="absolute -top-2 -right-2 bg-purple-600 rounded-full px-2 py-0.5 shadow-lg">
                      <p className="text-white font-bold text-xs">{batch.totalCollected.toFixed(0)} Br</p>
                    </div>
                    
                    {/* Last Donation Time Badge */}
                    {batch.lastDonationTime && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-green-500/90 rounded-full px-2 py-0.5 text-[10px] text-white whitespace-nowrap shadow-lg z-10"
                      >
                        🕐 {getTimeAgo(batch.lastDonationTime)}
                      </motion.div>
                    )}
                    
                    {/* Hot indicator for recent donation */}
                    {batch.lastDonationTime && new Date().getTime() - new Date(batch.lastDonationTime).getTime() < 5000 && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -top-1 -right-1"
                      >
                        <div className="relative">
                          <span className="text-xl animate-pulse">🔥</span>
                          <div className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-75"></div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Circular Boxes Container */}
                  <div className="relative h-[280px] flex items-center justify-center">
                    {/* Center glow effect */}
                    <div className="absolute w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl animate-pulse" />
                    
                    {/* Center Batch Icon */}
                    <div className="absolute z-10 w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center shadow-2xl border-2 border-yellow-500/50">
                      <div className="text-center">
                        <div className="text-2xl">💰</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Total</div>
                        <div className="text-xs font-bold text-yellow-400">{batch.totalCollected.toFixed(0)}</div>
                      </div>
                    </div>

                    {/* 5 Boxes in Circular Layout */}
                    {Object.entries(batch.boxes).map(([boxKey, boxData], boxIndex) => {
                      const position = boxPositions[boxIndex];
                      return (
                        <motion.div
                          key={boxKey}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: batchIndex * 0.1 + boxIndex * 0.05 }}
                          whileHover={{ scale: 1.1, zIndex: 20 }}
                          className="absolute cursor-pointer"
                          style={{
                            left: `calc(50% + ${position.x}px)`,
                            top: `calc(50% + ${position.y}px)`,
                            transform: 'translate(-50%, -50%)'
                          }}
                          id={`box-${batch._id}-${boxKey}`}
                        >
                          <div className="relative group">
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-black/30 rounded-full blur-sm" />
                            
                            <div className={`
                              absolute -top-1.5 left-0 w-full h-3 
                              bg-gradient-to-r ${getBoxGradient(boxKey)} 
                              rounded-t-lg transform rotate-x-12 origin-bottom
                              shadow-lg
                            `} />
                            
                            <div className={`
                              w-16 h-16 
                              bg-gradient-to-br ${getBoxGradient(boxKey)} 
                              rounded-xl shadow-2xl 
                              flex flex-col items-center justify-center
                              border border-yellow-400/30
                              relative overflow-hidden
                              transition-all duration-300
                              group-hover:shadow-yellow-500/50
                            `}>
                              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-gray-800 rounded-full opacity-50" />
                              
                              <div className="text-xl mb-0.5 drop-shadow-lg">
                                {getBoxIcon(boxKey)}
                              </div>
                              
                              <div className="bg-black/50 rounded-full px-1.5 py-0">
                                <p className="text-white font-bold text-[10px]">{getBoxLabel(boxKey)}</p>
                              </div>
                              
                              <p className="text-xs font-bold text-white drop-shadow-lg">
                                {boxData.total.toFixed(0)}
                              </p>
                              
                              <div className="absolute -top-1.5 -right-1.5 bg-yellow-500 rounded-full w-4 h-4 flex items-center justify-center shadow-lg">
                                <span className="text-[8px] font-bold text-gray-900">{boxData.noteCount}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Rank Badges based on current order */}
                  {batchIndex === 0 && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full w-8 h-8 flex items-center justify-center shadow-xl"
                    >
                      <span className="text-white font-bold text-sm">👑</span>
                    </motion.div>
                  )}
                  {batchIndex === 1 && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -left-2 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full w-7 h-7 flex items-center justify-center shadow-xl"
                    >
                      <span className="text-white font-bold text-xs">2</span>
                    </motion.div>
                  )}
                  {batchIndex === 2 && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -left-2 bg-gradient-to-r from-amber-600 to-amber-700 rounded-full w-7 h-7 flex items-center justify-center shadow-xl"
                    >
                      <span className="text-white font-bold text-xs">3</span>
                    </motion.div>
                  )}
                  
                  {/* New donation ripple effect */}
                  {batch.lastDonationTime && new Date().getTime() - new Date(batch.lastDonationTime).getTime() < 1000 && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 rounded-3xl border-2 border-yellow-400 pointer-events-none"
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {batches.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4 animate-bounce">📦</div>
              <p className="text-gray-400 text-xl">No batches available</p>
              <p className="text-gray-500 mt-2">Create a batch to start collecting money</p>
            </div>
          )}
        </div>

        {/* Recent Transactions Sidebar - Also ordered by most recent */}
        {showLiveFeed && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-80 bg-black/60 backdrop-blur-md rounded-xl border border-yellow-500/30 shadow-2xl overflow-hidden flex-shrink-0"
          >
            <div className="p-3 border-b border-yellow-500/30 bg-gradient-to-r from-yellow-600/20 to-orange-600/20">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-yellow-400 flex items-center gap-2">
                  <span className="text-xl">📜</span>
                  Live Feed
                  <span className="text-xs text-green-400 ml-2 animate-pulse">● LIVE</span>
                </h3>
                <button
                  onClick={() => setShowLiveFeed(false)}
                  className="lg:hidden text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
              <AnimatePresence mode="popLayout">
                {recentTransactions.map((tx, idx) => (
                  <motion.div
                    key={tx.id || idx}
                    layout
                    initial={{ opacity: 0, x: 20, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: idx * 0.03 }}
                    className="bg-white/10 rounded-lg p-2 hover:bg-white/20 transition-all duration-300 cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-yellow-400 font-semibold text-sm truncate">{tx.batchName}</p>
                        <p className="text-gray-300 text-xs truncate">{tx.donorName}</p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-green-400 font-bold text-sm animate-pulse">+{tx.totalAmount} Br</p>
                        <p className="text-gray-500 text-[10px]">
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {tx.breakdown?.map((note: any, noteIdx: number) => (
                        <motion.span
                          key={noteIdx}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: noteIdx * 0.1 }}
                          className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full"
                        >
                          {note.noteType} Br
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {recentTransactions.length === 0 && (
                <p className="text-gray-500 text-center py-4 text-sm">Waiting for donations...</p>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Batch Detail Modal */}
      <AnimatePresence>
        {selectedBatchForDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedBatchForDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-2xl w-full p-6 border-2 border-yellow-500"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                  <span>🏫</span> {selectedBatchForDetail.name}
                </h2>
                <button
                  onClick={() => setSelectedBatchForDetail(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {Object.entries(selectedBatchForDetail.boxes).map(([boxKey, boxData]) => (
                  <div key={boxKey} className="text-center">
                    <div className={`
                      bg-gradient-to-br ${getBoxGradient(boxKey)} 
                      rounded-xl p-2 text-white
                    `}>
                      <div className="text-xl">{getBoxIcon(boxKey)}</div>
                      <div className="font-bold text-xs">{getBoxLabel(boxKey)}</div>
                      <div className="text-lg font-bold mt-1">{boxData.total.toFixed(0)}</div>
                      <div className="text-[10px] opacity-80">{boxData.noteCount} notes</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-purple-600/30 rounded-xl p-4 text-center">
                <p className="text-gray-300">Total Collected</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {selectedBatchForDetail.totalCollected.toFixed(2)} Br
                </p>
                {selectedBatchForDetail.lastDonationTime && (
                  <p className="text-xs text-gray-400 mt-2">
                    Last donation: {getTimeAgo(selectedBatchForDetail.lastDonationTime)}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flying Notes Animation Layer */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {flyingNotes.map((note) => {
            const targetElement = document.getElementById(`box-${note.targetBatchId}-${note.targetBox}`);
            const targetRect = targetElement?.getBoundingClientRect();
            
            if (!targetRect) return null;
            
            return (
              <motion.div
                key={note.id}
                initial={{
                  x: `${note.startX}vw`,
                  y: '-10vh',
                  rotate: 0,
                  scale: 0.3,
                  opacity: 0
                }}
                animate={{
                  x: targetRect.left + targetRect.width / 2 - 30,
                  y: targetRect.top + targetRect.height / 2 - 30,
                  rotate: [0, 15, -15, 10, -10, 5, -5, 0],
                  scale: [0.3, 1.2, 1, 0.8],
                  opacity: [0, 1, 1, 0.8]
                }}
                transition={{
                  duration: 1,
                  ease: [0.4, 0, 0.2, 1]
                }}
                className="fixed"
                style={{ left: 0, top: 0 }}
              >
                <div className="relative">
                  <img 
                    src={note.image} 
                    alt={`${note.noteType} Birr`}
                    className="w-12 h-auto rounded-lg shadow-2xl border-2 border-yellow-400"
                  />
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-lg">
                    +{note.noteType}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .rotate-x-12 {
          transform: rotateX(12deg);
          transform-origin: bottom;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        
        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(255, 215, 0, 0.4);
          border-radius: 2px;
        }
        
        @media (max-width: 1024px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (min-width: 1280px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Batch {
  _id: string;
  name: string;
  totalCollected: number;
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
  targetBox: string;
  image: string;
}

interface CentralDisplayProps {
  webSocketService: any;
}

const boxPositions: Record<string, { x: number; y: number }> = {
  box_5: { x: 15, y: 50 },
  box_10: { x: 35, y: 50 },
  box_50: { x: 50, y: 50 },
  box_100: { x: 65, y: 50 },
  box_200: { x: 85, y: 50 }
};

export const CentralDisplay = ({ webSocketService }: CentralDisplayProps) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [flyingNotes, setFlyingNotes] = useState<FlyingNote[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!webSocketService) return;

    // Handle money collected event
    const handleMoneyCollected = (data: any) => {
      console.log('Money collected:', data);
      const { transaction, allBatchTotals } = data;
      
      setBatches(allBatchTotals);
      
      if (selectedBatch?._id === transaction.batchId) {
        const updatedBatch = allBatchTotals.find((b: Batch) => b._id === transaction.batchId);
        if (updatedBatch) setSelectedBatch(updatedBatch);
      }
      
      setRecentTransactions(prev => [transaction, ...prev].slice(0, 20));
      
      // Create flying notes with sequential delays
      const notes = transaction.breakdown.map((note: any, index: number) => ({
        id: `${transaction.sequenceId}-${index}`,
        noteType: note.noteType,
        targetBox: note.targetBox,
        image: note.image,
      }));
      
      notes.forEach((note: FlyingNote, idx: number) => {
        setTimeout(() => {
          setFlyingNotes(prev => [...prev, note]);
          setTimeout(() => {
            setFlyingNotes(prev => prev.filter(n => n.id !== note.id));
          }, 1500);
        }, idx * 300);
      });
    };

    const handleAllBatchTotals = (data: Batch[]) => {
      console.log('All batch totals:', data);
      setBatches(data);
      if (data.length > 0 && !selectedBatch) {
        setSelectedBatch(data[0]);
      }
    };

    const handleRecentTransactions = (data: any[]) => {
      console.log('Recent transactions:', data);
      setRecentTransactions(data);
    };

    webSocketService.on('money-collected', handleMoneyCollected);
    webSocketService.on('all-batch-totals', handleAllBatchTotals);
    webSocketService.on('recent-transactions', handleRecentTransactions);
    
    // Request initial data
    webSocketService.send('get-all-batch-totals');
    webSocketService.send('get-recent-transactions', { limit: 20 });

    return () => {
      webSocketService.off('money-collected', handleMoneyCollected);
      webSocketService.off('all-batch-totals', handleAllBatchTotals);
      webSocketService.off('recent-transactions', handleRecentTransactions);
    };
  }, [webSocketService, selectedBatch]);

  const getBoxColor = (boxName: string) => {
    const colors: Record<string, string> = {
      box_5: 'from-green-500 to-green-600',
      box_10: 'from-blue-500 to-blue-600',
      box_50: 'from-yellow-500 to-yellow-600',
      box_100: 'from-orange-500 to-orange-600',
      box_200: 'from-red-500 to-red-600'
    };
    return colors[boxName] || 'from-gray-500 to-gray-600';
  };

  const getBoxLabel = (boxName: string) => {
    const labels: Record<string, string> = {
      box_5: '5 Birr',
      box_10: '10 Birr',
      box_50: '50 Birr',
      box_100: '100 Birr',
      box_200: '200 Birr'
    };
    return labels[boxName] || boxName;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center">
            🎯 Live Money Collection Display
          </h1>
          <p className="text-purple-200 text-center mt-2">
            Real-time donations from all batches
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Batch Selector */}
        <div className="mb-6 flex flex-wrap gap-2 justify-center">
          {batches.map((batch) => (
            <button
              key={batch._id}
              onClick={() => setSelectedBatch(batch)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedBatch?._id === batch._id
                  ? 'bg-yellow-500 text-gray-900'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {batch.name}
            </button>
          ))}
        </div>

        {/* Selected Batch Total */}
        {selectedBatch && (
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl px-8 py-4 shadow-2xl">
              <p className="text-yellow-100 text-sm">Total Collected</p>
              <p className="text-4xl font-bold text-white">
                {selectedBatch.totalCollected.toFixed(2)} Birr
              </p>
            </div>
          </div>
        )}

        {/* 5 Boxes Grid */}
        <div 
          ref={containerRef}
          className="relative bg-black/40 backdrop-blur-sm rounded-2xl p-6 mb-8 border-2 border-yellow-500/30"
        >
          <h2 className="text-xl font-bold text-yellow-400 text-center mb-6">
            📦 Collection Boxes
          </h2>
          
          <div className="flex flex-wrap justify-center gap-4">
            {selectedBatch && Object.entries(selectedBatch.boxes).map(([boxKey, boxData]) => (
              <motion.div
                key={boxKey}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-40"
              >
                <div className={`
                  bg-gradient-to-br ${getBoxColor(boxKey)} 
                  rounded-xl p-4 text-center text-white shadow-lg
                  transform transition-all hover:scale-105
                `}>
                  <div className="text-2xl mb-2">💰</div>
                  <p className="font-bold text-lg">{getBoxLabel(boxKey)}</p>
                  <p className="text-2xl font-bold mt-2">{boxData.total.toFixed(2)}</p>
                  <p className="text-xs opacity-80 mt-1">{boxData.noteCount} notes</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Flying Notes Animation Layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            <AnimatePresence>
              {flyingNotes.map((note) => {
                const targetPos = boxPositions[note.targetBox];
                return (
                  <motion.div
                    key={note.id}
                    initial={{
                      x: `${Math.random() * 80 + 10}%`,
                      y: '-10%',
                      rotate: 0,
                      scale: 0.3,
                      opacity: 0
                    }}
                    animate={{
                      x: `${targetPos.x}%`,
                      y: `${targetPos.y}%`,
                      rotate: [0, 15, -15, 10, -10, 0],
                      scale: [0.3, 1.2, 1],
                      opacity: [0, 1, 1, 0]
                    }}
                    transition={{
                      duration: 1,
                      ease: "easeOut"
                    }}
                    className="absolute"
                    style={{ left: 0, top: 0 }}
                  >
                    <img 
                      src={note.image} 
                      alt={`${note.noteType} Birr`}
                      className="w-20 h-auto rounded-lg shadow-2xl"
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">📜 Recent Donations</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentTransactions.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/10 rounded-lg p-3 flex justify-between items-center flex-wrap gap-2"
              >
                <div>
                  <span className="text-yellow-400 font-bold">{tx.batchName}</span>
                  <span className="text-gray-300 text-sm ml-2">by {tx.donorName}</span>
                </div>
                <div>
                  <span className="text-green-400 font-bold">{tx.totalAmount} Birr</span>
                  <span className="text-gray-400 text-sm ml-2">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex gap-1">
                  {tx.breakdown.map((note: any, idx: number) => (
                    <span key={idx} className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      {note.noteType} Br
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
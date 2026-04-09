'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CollectionLobbyProps {
  batchId: string;
  batchName: string;
  webSocketService: any;
  language: 'en' | 'am';
  onStartCollection: () => void;
  onBack: () => void;
}

interface BoxInfo {
  boxNumber: number;
  totalAmount: number;
}

export const CollectionLobby = ({
  batchId,
  batchName,
  webSocketService,
  language,
  onStartCollection,
  onBack
}: CollectionLobbyProps) => {
  const [boxes, setBoxes] = useState<BoxInfo[]>([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!webSocketService) return;

    const handleBatchData = (data: any) => {
      if (data.batchId === batchId) {
        setBoxes(data.boxes);
        setTotalCollected(data.totalCollected);
        setLoading(false);
      }
    };

    webSocketService.on('batch-data', handleBatchData);
    webSocketService.send('join-batch', batchId);
    webSocketService.send('get-batch-details', batchId);

    return () => {
      webSocketService.off('batch-data', handleBatchData);
      webSocketService.send('leave-batch', batchId);
    };
  }, [webSocketService, batchId]);

  const getText = (key: string) => {
    const texts: Record<string, { en: string; am: string }> = {
      readyToCollect: { en: 'Ready to Collect Money', am: 'ገንዘብ ለመሰብሰብ ዝግጁ' },
      boxes: { en: 'Collection Boxes', am: 'የስብስብ ሳጥኖች' },
      totalCollected: { en: 'Total Collected', am: 'ጠቅላላ የተሰበሰበ' },
      startCollecting: { en: 'Start Collecting', am: 'መሰብሰብ ጀምር' },
      back: { en: 'Back', am: 'ተመለስ' },
      loading: { en: 'Loading boxes...', am: 'ሳጥኖች በመጫን ላይ...' }
    };
    return texts[key]?.[language] || texts[key]?.en || key;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-2 text-gray-500">{getText('loading')}</span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Stats */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-4 mb-6 text-white">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <p className="text-purple-100 text-sm">{getText('boxes')}</p>
              <p className="text-2xl font-bold">{boxes.length}</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">{getText('totalCollected')}</p>
              <p className="text-2xl font-bold">{totalCollected.toFixed(2)} Br</p>
            </div>
          </div>
        </div>

        {/* Boxes Preview */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">{getText('boxes')}</h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {boxes.map((box) => (
              <div
                key={box.boxNumber}
                className="bg-white rounded-lg shadow-md p-3 text-center w-24"
              >
                <div className="text-2xl font-bold text-purple-600">#{box.boxNumber}</div>
                <div className="text-sm text-gray-500 mt-1">{box.totalAmount.toFixed(2)} Br</div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStartCollection}
            className="bg-green-500 text-white py-3 px-6 rounded-lg font-semibold shadow-lg hover:bg-green-600 transition-colors"
          >
            {getText('startCollecting')}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            className="bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
          >
            {getText('back')}
          </motion.button>
        </div>
      </div>
    </div>
  );
};
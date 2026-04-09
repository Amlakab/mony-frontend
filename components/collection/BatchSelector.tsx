'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Batch {
  id: string;
  name: string;
  description: string;
  boxCount: number;
  totalCollected: number;
}

interface BatchSelectorProps {
  webSocketService: any;
  language: 'en' | 'am';
  onSelectBatch: (batchId: string, batchName: string) => void;
}

export const BatchSelector = ({ webSocketService, language, onSelectBatch }: BatchSelectorProps) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!webSocketService) return;

    const handleBatchesList = (data: Batch[]) => {
      setBatches(data);
      setLoading(false);
    };

    webSocketService.on('batches-list', handleBatchesList);
    webSocketService.send('get-batches');

    return () => {
      webSocketService.off('batches-list', handleBatchesList);
    };
  }, [webSocketService]);

  const getText = (key: string) => {
    const texts: Record<string, { en: string; am: string }> = {
      noBatches: { en: 'No batches available', am: 'ምንም ባች የለም' },
      boxes: { en: 'Boxes', am: 'ሳጥኖች' },
      collected: { en: 'Collected', am: 'የተሰበሰበ' },
      select: { en: 'Select Batch', am: 'ባች ይምረጡ' }
    };
    return texts[key]?.[language] || texts[key]?.en || key;
  };

  if (loading) {
    return (
      <div className="flex flex-wrap justify-center gap-4 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-72 h-48 bg-white rounded-xl shadow-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-center gap-4">
          <AnimatePresence>
            {batches.map((batch, index) => (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="w-72 cursor-pointer"
                onClick={() => onSelectBatch(batch.id, batch.name)}
              >
                <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4">
                    <h3 className="text-white font-bold text-lg">{batch.name}</h3>
                    {batch.description && (
                      <p className="text-purple-100 text-sm mt-1">{batch.description}</p>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">{getText('boxes')}:</span>
                        <span className="font-bold text-gray-800">{batch.boxCount}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">{getText('collected')}:</span>
                        <span className="font-bold text-green-600">{batch.totalCollected.toFixed(2)} Br</span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 rounded-full h-2 transition-all"
                        style={{ width: `${Math.min(100, (batch.totalCollected / 10000) * 100)}%` }}
                      />
                    </div>
                    
                    <button className="w-full mt-4 bg-purple-500 text-white py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors">
                      {getText('select')}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {batches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">{getText('noBatches')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
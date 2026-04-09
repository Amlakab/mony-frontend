'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Batch {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface GamePageProps {
  webSocketService: any;
  language: 'en' | 'am';
  user: any;
}

const moneyOptions = [
  { amount: 5, label: '5 Br', color: 'from-green-500 to-green-600' },
  { amount: 10, label: '10 Br', color: 'from-blue-500 to-blue-600' },
  { amount: 20, label: '20 Br', color: 'from-cyan-500 to-cyan-600' },
  { amount: 30, label: '30 Br', color: 'from-teal-500 to-teal-600' },
  { amount: 50, label: '50 Br', color: 'from-yellow-500 to-yellow-600' },
  { amount: 60, label: '60 Br', color: 'from-orange-500 to-orange-600' },
  { amount: 100, label: '100 Br', color: 'from-red-500 to-red-600' },
  { amount: 150, label: '150 Br', color: 'from-pink-500 to-pink-600' },
  { amount: 200, label: '200 Br', color: 'from-purple-500 to-purple-600' },
  { amount: 250, label: '250 Br', color: 'from-indigo-500 to-indigo-600' },
  { amount: 300, label: '300 Br', color: 'from-violet-500 to-violet-600' },
  { amount: 350, label: '350 Br', color: 'from-fuchsia-500 to-fuchsia-600' },
  { amount: 400, label: '400 Br', color: 'from-rose-500 to-rose-600' },
  { amount: 450, label: '450 Br', color: 'from-amber-500 to-amber-600' },
  { amount: 500, label: '500 Br', color: 'from-emerald-500 to-emerald-600' }
];

export const GamePage = ({ webSocketService, language, user }: GamePageProps) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDonorModal, setShowDonorModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [donorName, setDonorName] = useState('');

  useEffect(() => {
    if (!webSocketService) return;

    // Listen for batches list
    const handleBatchesList = (data: Batch[]) => {
      console.log('Received batches:', data);
      setBatches(data);
    };

    // Listen for collection success
    const handleCollectionSuccess = (data: any) => {
      console.log('Collection success:', data);
      setToast({ 
        message: `✓ ${data.amount} Birr added to ${data.batchName}!`, 
        type: 'success' 
      });
      setSelectedAmount(null);
      setDonorName('');
      setLoading(false);
      
      // Auto hide toast after 3 seconds
      setTimeout(() => setToast(null), 3000);
    };

    // Listen for errors
    const handleError = (error: any) => {
      console.error('WebSocket error:', error);
      setToast({ message: error.message || 'Collection failed', type: 'error' });
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    };

    webSocketService.on('batches-list', handleBatchesList);
    webSocketService.on('collection-success', handleCollectionSuccess);
    webSocketService.on('error', handleError);
    
    // Request batches
    webSocketService.send('get-batches');

    return () => {
      webSocketService.off('batches-list', handleBatchesList);
      webSocketService.off('collection-success', handleCollectionSuccess);
      webSocketService.off('error', handleError);
    };
  }, [webSocketService]);

  const handleAmountClick = (amount: number) => {
    if (!selectedBatch) {
      setToast({ message: 'Please select a batch first', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setSelectedAmount(amount);
    setDonorName(user?.name || '');
    setShowDonorModal(true);
  };

  const handleConfirmCollection = () => {
    if (!selectedBatch || !selectedAmount) return;
    
    setLoading(true);
    setShowDonorModal(false);
    
    // Send collection event via WebSocket
    webSocketService.send('collect-money', {
      batchId: selectedBatch._id,
      batchName: selectedBatch.name,
      amount: selectedAmount,
      donorName: donorName.trim() || 'Anonymous',
      donorPhone: user?.phone || ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            💰 Money Collection Game
          </h1>
          <p className="text-gray-600">Select a batch and click on any amount to donate</p>
        </div>

        {/* Batch Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
            Select Batch
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {batches.map((batch) => (
              <motion.button
                key={batch._id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedBatch(batch)}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${
                  selectedBatch?._id === batch._id
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:shadow-md border border-gray-200'
                }`}
              >
                {batch.name}
              </motion.button>
            ))}
          </div>
          {batches.length === 0 && (
            <p className="text-center text-gray-500 mt-4">No batches available. Please contact admin.</p>
          )}
        </div>

        {/* Selected Batch Display */}
        {selectedBatch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 mb-8 text-white text-center"
          >
            <p className="text-purple-200 text-sm">Selected Batch</p>
            <p className="text-2xl font-bold">{selectedBatch.name}</p>
          </motion.div>
        )}

        {/* Money Amounts Grid */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
            Select Amount
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {moneyOptions.map((option) => (
              <motion.button
                key={option.amount}
                whileHover={{ scale: 1.05, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAmountClick(option.amount)}
                disabled={!selectedBatch}
                className={`
                  relative overflow-hidden rounded-xl p-4 text-center font-bold text-white
                  bg-gradient-to-r ${option.color}
                  ${!selectedBatch ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  transition-all shadow-lg hover:shadow-xl
                `}
              >
                <span className="text-xl">{option.amount}</span>
                <span className="text-xs block opacity-90">Birr</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Donor Name Modal */}
      <AnimatePresence>
        {showDonorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDonorModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Confirm Donation</h3>
              
              <div className="bg-purple-50 rounded-xl p-4 mb-4">
                <p className="text-gray-600">Batch: <strong className="text-purple-600">{selectedBatch?.name}</strong></p>
                <p className="text-gray-600 mt-1">Amount: <strong className="text-green-600">{selectedAmount} Birr</strong></p>
              </div>
              
              <label className="block text-gray-700 mb-2">
                Donor Name <span className="text-gray-400 text-sm">(Optional)</span>
              </label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Enter your name"
                className="w-full border rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDonorModal(false)}
                  className="flex-1 bg-gray-200 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCollection}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Confirm Donation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 rounded-xl text-white z-50 ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-3 text-gray-600">Processing donation...</p>
          </div>
        </div>
      )}
    </div>
  );
};
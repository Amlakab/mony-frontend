'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CollectionGameInterfaceProps {
  batchId: string;
  batchName: string;
  webSocketService: any;
  language: 'en' | 'am';
  onBack: () => void;
  onGameEnd: () => void;
}

interface BoxInfo {
  boxNumber: number;
  totalAmount: number;
}

const denominations = [5, 10, 20, 30, 50, 100, 150, 200, 300, 500];

export const CollectionGameInterface = ({
  batchId,
  batchName,
  webSocketService,
  language,
  onBack,
  onGameEnd
}: CollectionGameInterfaceProps) => {
  const [boxes, setBoxes] = useState<BoxInfo[]>([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [animateBox, setAnimateBox] = useState<number | null>(null);
  const [animateAmount, setAnimateAmount] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDonorModal, setShowDonorModal] = useState(false);
  const [pendingBox, setPendingBox] = useState<number | null>(null);
  const [donorName, setDonorName] = useState('');
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!webSocketService) return;

    const handleBatchData = (data: any) => {
      if (data.batchId === batchId) {
        setBoxes(data.boxes);
        setTotalCollected(data.totalCollected);
        setLoading(false);
      }
    };

    const handleMoneyCollected = (data: any) => {
      if (data.batchId === batchId) {
        setBoxes(prev => prev.map(box =>
          box.boxNumber === data.boxNumber
            ? { ...box, totalAmount: data.newTotal }
            : box
        ));
        setTotalCollected(data.batchTotal);
        setAnimateBox(data.boxNumber);
        setAnimateAmount(data.amount);
        
        setToastMessage(`${data.donorName} donated ${data.amount} Br to Box ${data.boxNumber}`);
        setShowToast(true);
        
        setRecentTransactions(prev => [{
          boxNumber: data.boxNumber,
          amount: data.amount,
          donorName: data.donorName,
          timestamp: new Date()
        }, ...prev].slice(0, 10));
        
        setTimeout(() => {
          setAnimateBox(null);
          setAnimateAmount(0);
        }, 1000);
      }
    };

    webSocketService.on('batch-data', handleBatchData);
    webSocketService.on('money-collected', handleMoneyCollected);
    webSocketService.send('join-batch', batchId);
    webSocketService.send('get-batch-details', batchId);

    return () => {
      webSocketService.off('batch-data', handleBatchData);
      webSocketService.off('money-collected', handleMoneyCollected);
      webSocketService.send('leave-batch', batchId);
    };
  }, [webSocketService, batchId]);

  const getAmountColor = (amount: number): string => {
    if (amount <= 20) return 'bg-green-500';
    if (amount <= 50) return 'bg-blue-500';
    if (amount <= 150) return 'bg-orange-500';
    if (amount <= 300) return 'bg-purple-500';
    return 'bg-red-500';
  };

  const handleBoxClick = (boxNumber: number) => {
    if (!selectedAmount) {
      setToastMessage(language === 'en' ? 'Please select an amount first' : 'እባክዎ መጀመሪያ ገንዘብ ይምረጡ');
      setShowToast(true);
      return;
    }
    setPendingBox(boxNumber);
    setShowDonorModal(true);
  };

  const handleConfirmCollection = async () => {
    if (!pendingBox || !selectedAmount) return;
    
    setShowDonorModal(false);
    setLoading(true);
    
    try {
      const response = await fetch('/api/collection/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          boxNumber: pendingBox,
          amount: selectedAmount,
          donorName: donorName.trim() || 'Anonymous'
        })
      });
      
      if (response.ok) {
        setSelectedAmount(null);
        setPendingBox(null);
        setDonorName('');
      } else {
        const error = await response.json();
        setToastMessage(error.message || 'Collection failed');
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage('Network error. Please try again.');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const getText = (key: string) => {
    const texts: Record<string, { en: string; am: string }> = {
      selectAmount: { en: 'Select Amount', am: 'ገንዘብ ይምረጡ' },
      collectionBoxes: { en: 'Collection Boxes', am: 'የስብስብ ሳጥኖች' },
      total: { en: 'Total', am: 'ጠቅላላ' },
      back: { en: 'Back', am: 'ተመለስ' },
      endGame: { en: 'End Game', am: 'ጨዋታ አቁም' },
      donorName: { en: 'Donor Name', am: 'ለጋሽ ስም' },
      confirm: { en: 'Confirm', am: 'አረጋግጥ' },
      cancel: { en: 'Cancel', am: 'ሰርዝ' },
      recent: { en: 'Recent Transactions', am: 'የቅርብ ጊዜ ግብይቶች' }
    };
    return texts[key]?.[language] || texts[key]?.en || key;
  };

  if (loading && boxes.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-4 mb-4 text-white">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <p className="text-purple-100 text-sm">{getText('total')}</p>
            <p className="text-2xl font-bold">{totalCollected.toFixed(2)} Br</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="bg-white/20 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
            >
              {getText('back')}
            </button>
            <button
              onClick={onGameEnd}
              className="bg-red-500/80 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              {getText('endGame')}
            </button>
          </div>
        </div>
      </div>

      {/* Money Denominations */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <h3 className="font-bold text-gray-800 mb-3 text-center">{getText('selectAmount')}</h3>
        <div className="flex flex-wrap justify-center gap-2">
          {denominations.map((amount) => (
            <motion.button
              key={amount}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedAmount(amount)}
              className={`
                px-4 py-3 rounded-lg font-bold text-white transition-all
                ${selectedAmount === amount ? 'ring-2 ring-offset-2 ring-purple-500 scale-105' : ''}
                ${getAmountColor(amount)}
              `}
              style={{ minWidth: '65px' }}
            >
              {amount}
            </motion.button>
          ))}
        </div>
        
        {selectedAmount && (
          <div className="text-center mt-3">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
              Selected: {selectedAmount} Br
            </span>
          </div>
        )}
      </div>

      {/* Collection Boxes - Flexbox Layout */}
      <div className="mb-4">
        <h3 className="font-bold text-gray-800 mb-3">{getText('collectionBoxes')}</h3>
        <div className="flex flex-wrap justify-center gap-3">
          <AnimatePresence>
            {boxes.map((box) => (
              <motion.div
                key={box.boxNumber}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                className="w-36 cursor-pointer"
                onClick={() => handleBoxClick(box.boxNumber)}
              >
                <div className={`
                  bg-white rounded-xl shadow-md p-4 text-center transition-all relative overflow-hidden
                  ${selectedAmount ? 'hover:shadow-lg' : 'opacity-70'}
                  ${animateBox === box.boxNumber ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''}
                `}>
                  {/* Animation Ripple */}
                  {animateBox === box.boxNumber && (
                    <div className="absolute inset-0 bg-yellow-400 animate-ping opacity-30 rounded-xl" />
                  )}
                  
                  {/* Particles */}
                  {animateBox === box.boxNumber && (
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 bg-yellow-500 rounded-full animate-float"
                          style={{
                            left: '50%',
                            top: '50%',
                            animationDelay: `${i * 0.05}s`,
                            animationDuration: '0.6s'
                          }}
                        />
                      ))}
                    </div>
                  )}
                  
                  <div className="text-3xl font-bold text-purple-600">#{box.boxNumber}</div>
                  <div className="text-2xl font-bold text-gray-800 mt-2">
                    {box.totalAmount.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">Birr</div>
                  
                  {/* Amount Added Badge */}
                  <AnimatePresence>
                    {animateBox === box.boxNumber && animateAmount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: 1, y: -30 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-0 left-1/2 transform -translate-x-1/2"
                      >
                        <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                          +{animateAmount}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="font-bold text-gray-800 mb-2">{getText('recent')}</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentTransactions.map((tx, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm border-b pb-2">
                <div>
                  <span className="font-medium">Box {tx.boxNumber}</span>
                  <span className="text-gray-500 ml-2">- {tx.donorName}</span>
                </div>
                <div>
                  <span className="text-green-600 font-bold">+{tx.amount} Br</span>
                  <span className="text-gray-400 text-xs ml-2">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Donor Name Modal */}
      {showDonorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-sm w-full p-6"
          >
            <h3 className="text-xl font-bold mb-4">{getText('donorName')}</h3>
            <input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder={language === 'en' ? 'Enter donor name' : 'የለጋሽ ስም ያስገቡ'}
              className="w-full border rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
            {pendingBox && selectedAmount && (
              <div className="bg-gray-100 rounded-lg p-3 mb-4 text-center">
                <p className="text-sm text-gray-600">
                  Box #{pendingBox} - {selectedAmount} Br
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDonorModal(false)}
                className="flex-1 bg-gray-200 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                {getText('cancel')}
              </button>
              <button
                onClick={handleConfirmCollection}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                {getText('confirm')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-4 right-4 bg-gray-800 text-white rounded-lg p-3 text-center z-50"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Processing...</p>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -80px) scale(0);
            opacity: 0;
          }
        }
        .animate-float {
          animation: float 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
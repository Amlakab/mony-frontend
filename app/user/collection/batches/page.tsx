'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import MobileHeader from '@/components/Layout/MobileHeader';
import MobileNavigation from '@/components/Layout/MobileNavigation';
import Footer from '@/components/ui/Footer';
import api from '@/app/utils/api';
import { motion, AnimatePresence } from 'framer-motion';

interface Batch {
  _id: string;
  name: string;
  description: string;
  boxCount: number;
  totalCollected: number;
  isActive: boolean;
  createdAt: string;
  createdBy: {
    _id: string;
    name: string;
    phone: string;
  };
}

export default function BatchManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [language, setLanguage] = useState<'en' | 'am'>('en');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    boxCount: 5
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showStatsModal, setShowStatsModal] = useState<Batch | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!user) {
      router.push('/auth/login');
    } else if (user.role !== 'admin') {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (isClient && user?.role === 'admin') {
      fetchBatches();
    }
  }, [isClient, user]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/batches');
      setBatches(response.data.data);
    } catch (error) {
      console.error('Error fetching batches:', error);
      setToast({ message: 'Failed to load batches', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchStats = async (batchId: string) => {
    try {
      setStatsLoading(true);
      const response = await api.get(`/batches/${batchId}/stats`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setToast({ message: 'Failed to load statistics', type: 'error' });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setToast({ message: getText('nameRequired'), type: 'error' });
      return;
    }

    if (formData.boxCount < 1 || formData.boxCount > 50) {
      setToast({ message: getText('boxCountInvalid'), type: 'error' });
      return;
    }

    try {
      if (editingBatch) {
        await api.put(`/batches/${editingBatch._id}`, formData);
        setToast({ message: getText('updateSuccess'), type: 'success' });
      } else {
        await api.post('/batches', formData);
        setToast({ message: getText('createSuccess'), type: 'success' });
      }
      
      setShowModal(false);
      setEditingBatch(null);
      setFormData({ name: '', description: '', boxCount: 5 });
      fetchBatches();
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || getText('operationFailed'), type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/batches/${id}`);
      setToast({ message: getText('deleteSuccess'), type: 'success' });
      fetchBatches();
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || getText('deleteFailed'), type: 'error' });
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleToggleStatus = async (batch: Batch) => {
    try {
      await api.put(`/batches/${batch._id}`, { isActive: !batch.isActive });
      setToast({ message: batch.isActive ? getText('deactivated') : getText('activated'), type: 'success' });
      fetchBatches();
    } catch (error: any) {
      setToast({ message: error.response?.data?.message || getText('statusFailed'), type: 'error' });
    }
  };

  const openCreateModal = () => {
    setEditingBatch(null);
    setFormData({ name: '', description: '', boxCount: 5 });
    setShowModal(true);
  };

  const openEditModal = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      description: batch.description || '',
      boxCount: batch.boxCount
    });
    setShowModal(true);
  };

  const openStatsModal = async (batch: Batch) => {
    setShowStatsModal(batch);
    await fetchBatchStats(batch._id);
  };

  const getText = (key: string) => {
    const texts: Record<string, { en: string; am: string }> = {
      title: { en: 'Batch Management', am: 'ባች አስተዳደር' },
      createNew: { en: 'Create New Batch', am: 'አዲስ ባች ፍጠር' },
      edit: { en: 'Edit', am: 'አርትዕ' },
      delete: { en: 'Delete', am: 'ሰርዝ' },
      deactivate: { en: 'Deactivate', am: 'አቁም' },
      activate: { en: 'Activate', am: 'አንቃ' },
      stats: { en: 'Statistics', am: 'ስታቲስቲክስ' },
      name: { en: 'Batch Name', am: 'የባች ስም' },
      description: { en: 'Description', am: 'መግለጫ' },
      boxCount: { en: 'Number of Boxes', am: 'የሳጥኖች ብዛት' },
      totalCollected: { en: 'Total Collected', am: 'ጠቅላላ የተሰበሰበ' },
      status: { en: 'Status', am: 'ሁኔታ' },
      active: { en: 'Active', am: 'ንቁ' },
      inactive: { en: 'Inactive', am: 'ያልነቃ' },
      cancel: { en: 'Cancel', am: 'ሰርዝ' },
      save: { en: 'Save', am: 'አስቀምጥ' },
      confirmDelete: { en: 'Delete Batch', am: 'ባች ሰርዝ' },
      confirmDeleteMsg: { en: 'Are you sure you want to delete this batch? This action cannot be undone.', am: 'ይህን ባች መሰረዝ እንደሚፈልጉ እርግጠኛ ነዎት? ይህ ተግባር ሊቀለበስ አይችልም።' },
      yesDelete: { en: 'Yes, Delete', am: 'አዎ, ሰርዝ' },
      nameRequired: { en: 'Batch name is required', am: 'የባች ስም ያስፈልጋል' },
      boxCountInvalid: { en: 'Box count must be between 1 and 50', am: 'የሳጥን ብዛት ከ1 እስከ 50 መሆን አለበት' },
      createSuccess: { en: 'Batch created successfully', am: 'ባች በተሳካ ሁኔታ ተፈጠረ' },
      updateSuccess: { en: 'Batch updated successfully', am: 'ባች በተሳካ ሁኔታ ተሻሽሏል' },
      deleteSuccess: { en: 'Batch deleted successfully', am: 'ባች በተሳካ ሁኔታ ተሰርዟል' },
      operationFailed: { en: 'Operation failed', am: 'ክዋኔው አልተሳካም' },
      deleteFailed: { en: 'Failed to delete batch', am: 'ባች መሰረዝ አልተቻለም' },
      deactivated: { en: 'Batch deactivated', am: 'ባች ቆሟል' },
      activated: { en: 'Batch activated', am: 'ባች ነቅቷል' },
      statusFailed: { en: 'Failed to update status', am: 'ሁኔታ ማሻሻል አልተቻለም' },
      back: { en: 'Back to Game', am: 'ወደ ጨዋታ ተመለስ' },
      statistics: { en: 'Batch Statistics', am: 'የባች ስታቲስቲክስ' },
      totalBoxes: { en: 'Total Boxes', am: 'ጠቅላላ ሳጥኖች' },
      avgPerBox: { en: 'Average per Box', am: 'አማካይ በሳጥን' },
      topBox: { en: 'Top Box', am: 'ከፍተኛ ሳጥን' },
      transactions: { en: 'Transactions', am: 'ግብይቶች' },
      dailyStats: { en: 'Daily Collection (Last 7 Days)', am: 'በየቀኑ ስብስብ (ያለፉ 7 ቀናት)' },
      recentTransactions: { en: 'Recent Transactions', am: 'የቅርብ ጊዜ ግብይቶች' },
      amount: { en: 'Amount', am: 'ገንዘብ' },
      donor: { en: 'Donor', am: 'ለጋሽ' },
      date: { en: 'Date', am: 'ቀን' },
      box: { en: 'Box', am: 'ሳጥን' },
      loading: { en: 'Loading...', am: 'በመጫን ላይ...' }
    };
    return texts[key]?.[language] || texts[key]?.en || key;
  };

  if (!isClient || (user && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-500 mt-4">{getText('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title={getText('title')} showWallet={true} />
      
      <main className="pt-16 pb-24">
        <div className="max-w-6xl mx-auto p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{getText('title')}</h1>
              <p className="text-gray-500 text-sm mt-1">
                {language === 'en' ? 'Create and manage collection batches' : 'የስብስብ ባችዎችን ይፍጠሩ እና ያስተዳድሩ'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/collection')}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                {getText('back')}
              </button>
              <button
                onClick={openCreateModal}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors flex items-center gap-2"
              >
                <span>+</span> {getText('createNew')}
              </button>
            </div>
          </div>

          {/* Batches List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-md p-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="flex gap-4">
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : batches.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {language === 'en' ? 'No Batches Yet' : 'ምንም ባች የለም'}
              </h3>
              <p className="text-gray-500 mb-4">
                {language === 'en' 
                  ? 'Create your first batch to start collecting money' 
                  : 'ገንዘብ መሰብሰብ ለመጀመር የመጀመሪያ ባችዎን ይፍጠሩ'}
              </p>
              <button
                onClick={openCreateModal}
                className="bg-purple-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors"
              >
                + {getText('createNew')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {batches.map((batch) => (
                  <motion.div
                    key={batch._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`bg-white rounded-xl shadow-md overflow-hidden ${!batch.isActive ? 'opacity-60' : ''}`}
                  >
                    <div className="p-4">
                      <div className="flex flex-wrap justify-between items-start gap-3">
                        {/* Left Section */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="font-bold text-lg text-gray-800">{batch.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              batch.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {batch.isActive ? getText('active') : getText('inactive')}
                            </span>
                          </div>
                          
                          {batch.description && (
                            <p className="text-gray-500 text-sm mb-3">{batch.description}</p>
                          )}
                          
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">{getText('boxCount')}:</span>
                              <strong className="text-gray-800">{batch.boxCount}</strong>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">{getText('totalCollected')}:</span>
                              <strong className="text-green-600">{batch.totalCollected.toFixed(2)} Br</strong>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Created:</span>
                              <span className="text-gray-600 text-xs">
                                {new Date(batch.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => openStatsModal(batch)}
                            className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors"
                          >
                            📊 {getText('stats')}
                          </button>
                          <button
                            onClick={() => handleToggleStatus(batch)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              batch.isActive 
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {batch.isActive ? getText('deactivate') : getText('activate')}
                          </button>
                          <button
                            onClick={() => openEditModal(batch)}
                            className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                          >
                            ✏️ {getText('edit')}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(batch._id)}
                            className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                          >
                            🗑️ {getText('delete')}
                          </button>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 rounded-full h-2 transition-all"
                            style={{ width: `${Math.min(100, (batch.totalCollected / 10000) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNavigation />

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold mb-4">
              {editingBatch ? getText('edit') : getText('createNew')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {getText('name')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Batch 2024"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {getText('description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {getText('boxCount')}
                </label>
                <input
                  type="number"
                  value={formData.boxCount}
                  onChange={(e) => setFormData({ ...formData, boxCount: parseInt(e.target.value) || 5 })}
                  className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min={1}
                  max={50}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {language === 'en' ? 'Between 1 and 50 boxes' : 'ከ1 እስከ 50 ሳጥኖች'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-200 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                {getText('cancel')}
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-purple-500 text-white py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors"
              >
                {getText('save')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-sm w-full p-6"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold mb-2">{getText('confirmDelete')}</h3>
              <p className="text-gray-500 text-sm mb-6">
                {getText('confirmDeleteMsg')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-gray-200 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  {getText('cancel')}
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  {getText('yesDelete')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStatsModal && stats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {showStatsModal.name} - {getText('statistics')}
              </h3>
              <button
                onClick={() => setShowStatsModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {statsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-3 text-white text-center">
                    <p className="text-xs opacity-80">{getText('totalBoxes')}</p>
                    <p className="text-2xl font-bold">{stats.boxCount}</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-3 text-white text-center">
                    <p className="text-xs opacity-80">{getText('totalCollected')}</p>
                    <p className="text-2xl font-bold">{stats.totalCollected.toFixed(2)} Br</p>
                  </div>
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-3 text-white text-center">
                    <p className="text-xs opacity-80">{getText('avgPerBox')}</p>
                    <p className="text-2xl font-bold">{stats.averagePerBox.toFixed(2)} Br</p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-3 text-white text-center">
                    <p className="text-xs opacity-80">{getText('transactions')}</p>
                    <p className="text-2xl font-bold">{stats.transactionCount}</p>
                  </div>
                </div>

                {/* Top Box */}
                {stats.topBox && stats.topBox.number > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-yellow-700 mb-1">{getText('topBox')}</p>
                    <p className="text-2xl font-bold text-yellow-800">
                      Box #{stats.topBox.number} - {stats.topBox.amount.toFixed(2)} Br
                    </p>
                  </div>
                )}

                {/* Daily Stats Chart */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">{getText('dailyStats')}</h4>
                  <div className="space-y-2">
                    {stats.dailyStats?.map((day: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-24">{day.date}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                          <div 
                            className="bg-green-500 h-full flex items-center justify-end px-2 text-xs text-white font-medium"
                            style={{ width: `${Math.min(100, (day.total / stats.totalCollected) * 100)}%` }}
                          >
                            {day.total > 0 && `${day.total} Br`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Transactions */}
                {stats.recentTransactions && stats.recentTransactions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">{getText('recentTransactions')}</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {stats.recentTransactions.map((tx: any) => (
                        <div key={tx._id} className="flex justify-between items-center text-sm border-b pb-2">
                          <div>
                            <span className="font-medium">Box {tx.boxNumber}</span>
                            <span className="text-gray-500 ml-2">- {tx.donorName}</span>
                          </div>
                          <div>
                            <span className="text-green-600 font-bold">+{tx.amount} Br</span>
                            <span className="text-gray-400 text-xs ml-2">
                              {new Date(tx.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 p-3 rounded-lg text-white z-50 ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/app/utils/api';

interface Batch {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  totalCollected: number;
  boxes: {
    box_5: { total: number; noteCount: number };
    box_10: { total: number; noteCount: number };
    box_50: { total: number; noteCount: number };
    box_100: { total: number; noteCount: number };
    box_200: { total: number; noteCount: number };
  };
  createdAt: string;
  createdBy: { name: string; phone: string };
}

interface BatchManagementProps {
  onBatchUpdated?: () => void;
}

export const BatchManagement = ({ onBatchUpdated }: BatchManagementProps) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showStatsModal, setShowStatsModal] = useState<Batch | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await api.get('/batches/all');
      setBatches(response.data.data);
    } catch (error) {
      console.error('Error fetching batches:', error);
      showToast('Failed to load batches', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchStats = async (batchId: string) => {
    try {
      const response = await api.get(`/batches/${batchId}/stats`);
      setStats(response.data.data);
    } catch (error) {
      showToast('Failed to load statistics', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast('Batch name is required', 'error');
      return;
    }

    try {
      if (editingBatch) {
        await api.put(`/batches/${editingBatch._id}`, formData);
        showToast('Batch updated successfully', 'success');
      } else {
        await api.post('/batches', formData);
        showToast('Batch created successfully', 'success');
      }
      
      setShowModal(false);
      setEditingBatch(null);
      setFormData({ name: '', description: '' });
      fetchBatches();
      if (onBatchUpdated) onBatchUpdated();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/batches/${id}`);
      showToast('Batch deleted successfully', 'success');
      fetchBatches();
      if (onBatchUpdated) onBatchUpdated();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleToggleStatus = async (batch: Batch) => {
    try {
      await api.put(`/batches/${batch._id}`, { isActive: !batch.isActive });
      showToast(batch.isActive ? 'Batch deactivated' : 'Batch activated', 'success');
      fetchBatches();
      if (onBatchUpdated) onBatchUpdated();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Status update failed', 'error');
    }
  };

  const openStatsModal = async (batch: Batch) => {
    setShowStatsModal(batch);
    await fetchBatchStats(batch._id);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Batch Management</h2>
            <p className="text-gray-500 text-sm">Create and manage collection batches</p>
          </div>
          <button
            onClick={() => {
              setEditingBatch(null);
              setFormData({ name: '', description: '' });
              setShowModal(true);
            }}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            + Create Batch
          </button>
        </div>

        {/* Batches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => (
            <motion.div
              key={batch._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-xl shadow-md overflow-hidden ${!batch.isActive ? 'opacity-60' : ''}`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{batch.name}</h3>
                    {batch.description && (
                      <p className="text-gray-500 text-sm mt-1">{batch.description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    batch.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {batch.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="border-t border-gray-100 my-4"></div>

                {/* Boxes Preview */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {Object.entries(batch.boxes).map(([key, box]) => (
                    <div key={key} className="text-center">
                      <div className="text-xs text-gray-500">{key.replace('box_', '')} Br</div>
                      <div className="font-bold text-gray-800">{box.total}</div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">
                    Created: {new Date(batch.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {batch.totalCollected.toFixed(2)} Br
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openStatsModal(batch)}
                    className="flex-1 bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors"
                  >
                    Statistics
                  </button>
                  <button
                    onClick={() => handleToggleStatus(batch)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      batch.isActive
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {batch.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingBatch(batch);
                      setFormData({ name: batch.name, description: batch.description });
                      setShowModal(true);
                    }}
                    className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(batch._id)}
                    className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {batches.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500">No batches found. Create your first batch!</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">
                {editingBatch ? 'Edit Batch' : 'Create New Batch'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Computer Science 2024"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Optional description"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  {editingBatch ? 'Update' : 'Create'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl max-w-sm w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-5xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold mb-2">Delete Batch</h3>
                <p className="text-gray-500 text-sm mb-6">
                  Are you sure you want to delete this batch? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 bg-gray-200 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteConfirm)}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics Modal */}
      <AnimatePresence>
        {showStatsModal && stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowStatsModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{showStatsModal.name} - Statistics</h3>
                <button onClick={() => setShowStatsModal(null)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-3 text-white text-center">
                  <p className="text-xs opacity-80">Total Collected</p>
                  <p className="text-2xl font-bold">{stats.batch.totalCollected.toFixed(2)} Br</p>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-3 text-white text-center">
                  <p className="text-xs opacity-80">Transactions</p>
                  <p className="text-2xl font-bold">{stats.stats.totalTransactions}</p>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-3 text-white text-center">
                  <p className="text-xs opacity-80">Status</p>
                  <p className="text-2xl font-bold">{stats.batch.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-3 text-white text-center">
                  <p className="text-xs opacity-80">Created</p>
                  <p className="text-sm font-bold">{new Date(stats.batch.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Box Details */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Box Collection Details</h4>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(stats.batch.boxes).map(([key, box]: [string, any]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-sm font-bold text-purple-600">{key.replace('box_', '')} Br</div>
                      <div className="text-lg font-bold">{box.total.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">{box.noteCount} notes</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Stats */}
              {stats.stats.dailyTotals && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Daily Collection (Last 7 Days)</h4>
                  <div className="space-y-2">
                    {stats.stats.dailyTotals.map((day: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-24">{day.date}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                          <div 
                            className="bg-green-500 h-full flex items-center justify-end px-2 text-xs text-white font-medium"
                            style={{ width: `${Math.min(100, (day.total / stats.batch.totalCollected) * 100)}%` }}
                          >
                            {day.total > 0 && `${day.total} Br`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Transactions */}
              {stats.stats.recentTransactions && stats.stats.recentTransactions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Recent Transactions</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {stats.stats.recentTransactions.map((tx: any) => (
                      <div key={tx._id} className="flex justify-between items-center text-sm border-b pb-2">
                        <div>
                          <span className="font-medium">{tx.donorName}</span>
                          <span className="text-gray-500 text-xs ml-2">
                            {new Date(tx.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-green-600 font-bold">+{tx.totalAmount} Br</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-3 rounded-lg text-white z-50 ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
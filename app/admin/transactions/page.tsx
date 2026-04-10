'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  useTheme,
  useMediaQuery,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Search,
  FilterList,
  ExpandMore,
  ExpandLess,
  Delete,
  Refresh,
  Person
} from '@mui/icons-material';
import api from '@/app/utils/api';

interface Transaction {
  _id: string;
  batchId: { _id: string; name: string } | string;
  batchName: string;
  totalAmount: number;
  breakdown: Array<{ noteType: number; targetBox: string; image: string }>;
  donorName: string;
  donorPhone: string;
  timestamp: string;
  sequenceId: number;
}

export default function TransactionsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [filters, setFilters] = useState({
    donorName: '',
    search: ''
  });

  // Calculate stats from all transactions
  const [calculatedStats, setCalculatedStats] = useState({
    totalCollected: 0,
    totalTransactions: 0,
    uniqueDonors: 0,
    uniqueBatches: 0
  });

  // Get current page transactions
  const getCurrentPageTransactions = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  };

  // Filter transactions based on search
  const filteredTransactions = transactions.filter(t => {
    const matchesDonor = filters.donorName === '' || 
      t.donorName.toLowerCase().includes(filters.donorName.toLowerCase());
    const matchesSearch = filters.search === '' || 
      t.batchName.toLowerCase().includes(filters.search.toLowerCase()) ||
      t.donorName.toLowerCase().includes(filters.search.toLowerCase());
    return matchesDonor && matchesSearch;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const currentTransactions = getCurrentPageTransactions();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/transactions?limit=10000');
      
      // Handle both response formats
      let transactionsData = [];
      if (response.data.data) {
        transactionsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        transactionsData = response.data;
      } else {
        transactionsData = [];
      }
      
      setTransactions(transactionsData);
      setAllTransactions(transactionsData);
      calculateStats(transactionsData);
      setError('');
    } catch (error: any) {
      console.error('Fetch error:', error);
      setError(error.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (transactionsData: Transaction[]) => {
    const totalCollected = transactionsData.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const totalTransactions = transactionsData.length;
    const uniqueDonors = new Set(transactionsData.map(t => t.donorName)).size;
    const uniqueBatches = new Set(transactionsData.map(t => t.batchName)).size;
    
    setCalculatedStats({
      totalCollected,
      totalTransactions,
      uniqueDonors,
      uniqueBatches
    });
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;
    
    setDeleting(true);
    try {
      await api.delete(`/transactions/${selectedTransaction._id}`);
      setSuccess('Transaction deleted successfully');
      fetchTransactions();
      setDeleteDialogOpen(false);
      setSelectedTransaction(null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete transaction');
    } finally {
      setDeleting(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchTransactions();
    setSuccess('Data refreshed');
    setTimeout(() => setSuccess(''), 3000);
  };

  const toggleExpandTransaction = (transactionId: string) => {
    setExpandedTransaction(expandedTransaction === transactionId ? null : transactionId);
  };

  const openDeleteDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={isMobile ? 40 : 60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>
              Collection Transactions
            </Typography>
            <Typography variant={isMobile ? 'body2' : 'body1'} color="text.secondary">
              Track all money collection transactions from all batches
            </Typography>
          </Box>
          <IconButton onClick={handleRefresh} sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f5f5f5' } }}>
            <Refresh />
          </IconButton>
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Card sx={{ flex: '1 1 180px', background: 'linear-gradient(145deg, #2196F3, #21CBF3)', color: 'white', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', opacity: 0.9 }}>Total Collected</Typography>
              <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold' }}>
                {formatCurrency(calculatedStats.totalCollected)}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 180px', background: 'linear-gradient(145deg, #4CAF50, #8BC34A)', color: 'white', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', opacity: 0.9 }}>Total Transactions</Typography>
              <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold' }}>
                {calculatedStats.totalTransactions}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 180px', background: 'linear-gradient(145deg, #FF9800, #FFC107)', color: 'white', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', opacity: 0.9 }}>Unique Donors</Typography>
              <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold' }}>
                {calculatedStats.uniqueDonors}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 180px', background: 'linear-gradient(145deg, #9C27B0, #E91E63)', color: 'white', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', opacity: 0.9 }}>Active Batches</Typography>
              <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold' }}>
                {calculatedStats.uniqueBatches}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </motion.div>

      {/* Filter Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <FilterList sx={{ mr: 1, fontSize: 20 }} /> Filters
              </Typography>
              <IconButton size="small" onClick={() => setShowFilters(!showFilters)} sx={{ display: { sm: 'none' } }}>
                {showFilters ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>

            <Collapse in={showFilters || !isMobile}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: '1 1 200px' }}
                  size="small"
                  label="Donor Name"
                  value={filters.donorName}
                  onChange={e => handleFilterChange('donorName', e.target.value)}
                  InputProps={{ startAdornment: <Person sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
                />

                <TextField
                  sx={{ flex: '1 1 200px' }}
                  size="small"
                  label="Search (Batch/Donor)"
                  value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
                />

                <FormControl sx={{ width: 120 }} size="small">
                  <InputLabel>Per page</InputLabel>
                  <Select value={itemsPerPage} label="Per page" onChange={e => setItemsPerPage(Number(e.target.value))}>
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions Table */}
      {currentTransactions.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No transactions found.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {filters.donorName || filters.search ? 'Try changing your filters.' : 'No transactions recorded yet.'}
          </Typography>
        </Box>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
          {/* Mobile Cards */}
          {isMobile && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {currentTransactions.map(t => {
                const isExpanded = expandedTransaction === t._id;
                return (
                  <Card key={t._id} sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                            {t.batchName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            by {t.donorName}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" onClick={() => openDeleteDialog(t)} sx={{ color: 'error.main' }}>
                            <Delete fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => toggleExpandTransaction(t._id)}>
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Amount:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          +{formatCurrency(t.totalAmount)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        {t.breakdown?.map((note, idx) => (
                          <Chip key={idx} label={`${note.noteType} Br`} size="small" variant="outlined" />
                        ))}
                      </Box>

                      {isExpanded && (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Phone:</Typography>
                            <Typography variant="body2">{t.donorPhone || 'N/A'}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Date:</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                              {formatDate(t.timestamp)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Sequence ID:</Typography>
                            <Typography variant="body2">#{t.sequenceId}</Typography>
                          </Box>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}

          {/* Desktop Table View */}
          {!isMobile && (
            <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ background: 'linear-gradient(145deg, #3498db, #2980b9)' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Batch</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Donor</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Breakdown</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentTransactions.map(t => (
                      <TableRow key={t._id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {t.batchName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{t.donorName}</Typography>
                          {t.donorPhone && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {t.donorPhone}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            +{formatCurrency(t.totalAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {t.breakdown?.map((note, idx) => (
                              <Chip key={idx} label={`${note.noteType} Br`} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                            {formatDate(t.timestamp)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => openDeleteDialog(t)} sx={{ color: 'error.main' }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                variant="outlined"
                size="small"
              >
                Previous
              </Button>
              <Typography variant="body2">
                Page {currentPage} of {totalPages}
              </Typography>
              <Button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                variant="outlined"
                size="small"
              >
                Next
              </Button>
            </Box>
          )}

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {currentTransactions.length} of {filteredTransactions.length} transactions
            </Typography>
          </Box>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Transaction</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this transaction?
          </Typography>
          {selectedTransaction && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2"><strong>Batch:</strong> {selectedTransaction.batchName}</Typography>
              <Typography variant="body2"><strong>Donor:</strong> {selectedTransaction.donorName}</Typography>
              <Typography variant="body2"><strong>Amount:</strong> {formatCurrency(selectedTransaction.totalAmount)}</Typography>
              <Typography variant="body2"><strong>Breakdown:</strong> {selectedTransaction.breakdown?.map(n => `${n.noteType} Br`).join(', ')}</Typography>
            </Box>
          )}
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteTransaction} color="error" variant="contained" disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
        <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
      </Snackbar>
    </Box>
  );
}
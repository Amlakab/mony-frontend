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
  Paper,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Pagination,
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
  AccountBalanceWallet,
  ArrowUpward,
  ArrowDownward,
  Casino,
  EmojiEvents,
  Search,
  FilterList,
  ExpandMore,
  ExpandLess,
  Delete,
  Refresh
} from '@mui/icons-material';
import api from '@/app/utils/api';

interface Transaction {
  _id: string;
  userId: { _id: string; phone: string; name?: string };
  type: 'deposit' | 'withdrawal' | 'game_purchase' | 'winning';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  description: string;
  transactionId?: string;
  senderPhone?: string;
  senderName?: string;
  receiverPhone?: string;
  receiverName?: string;
  method?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface TransactionStats {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalWinnings: number;
  totalGamePurchases: number;
  netBalance: number;
  recentTransactions: Transaction[];
}

interface PaginationData {
  current: number;
  total: number;
  count: number;
  totalRecords: number;
}

export default function TransactionsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    current: 1,
    total: 1,
    count: 0,
    totalRecords: 0
  });
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  });

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      const response = await api.get(`/transactions?${params}`);
      setTransactions(response.data.data);
      setPagination(response.data.pagination);
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/transactions/stats/overview');
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;
    
    setDeleting(true);
    try {
      // Check transaction type to use appropriate endpoint
      let endpoint = '';
      if (selectedTransaction.type === 'deposit') {
        endpoint = `/transactions/deposit/${selectedTransaction._id}`;
      } else if (selectedTransaction.type === 'withdrawal') {
        endpoint = `/transactions/withdrawal/${selectedTransaction._id}`;
      } else {
        endpoint = `/transactions/${selectedTransaction._id}`;
      }
      
      await api.delete(endpoint);
      setSuccess('Transaction deleted successfully');
      fetchTransactions();
      fetchStats();
      setDeleteDialogOpen(false);
      setSelectedTransaction(null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete transaction');
    } finally {
      setDeleting(false);
    }
  };

  const handleFilterChange = (field: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: field !== 'page' ? 1 : prev.page
    }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    handleFilterChange('page', value);
  };

  const handleRefresh = () => {
    fetchTransactions();
    fetchStats();
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
      currency: 'ETB'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownward sx={{ color: 'success.main', fontSize: 18 }} />;
      case 'withdrawal':
        return <ArrowUpward sx={{ color: 'error.main', fontSize: 18 }} />;
      case 'game_purchase':
        return <Casino sx={{ color: 'warning.main', fontSize: 18 }} />;
      case 'winning':
        return <EmojiEvents sx={{ color: 'success.main', fontSize: 18 }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'game_purchase':
        return 'Game Purchase';
      case 'winning':
        return 'Winning';
      default:
        return type;
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>
              Transaction History
            </Typography>
            <Typography variant={isMobile ? 'body2' : 'body1'} color="text.secondary">
              Track all your financial activities and game transactions
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
              <Typography variant="body2" sx={{ fontWeight: 'medium', opacity: 0.9 }}>Net Balance</Typography>
              <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold' }}>
                {formatCurrency(stats?.netBalance || 0)}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 180px', background: 'linear-gradient(145deg, #4CAF50, #8BC34A)', color: 'white', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', opacity: 0.9 }}>Total Deposits</Typography>
              <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold' }}>
                {formatCurrency(stats?.totalDeposits || 0)}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 180px', background: 'linear-gradient(145deg, #F44336, #FF5722)', color: 'white', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', opacity: 0.9 }}>Total Withdrawals</Typography>
              <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold' }}>
                {formatCurrency(stats?.totalWithdrawals || 0)}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 180px', background: 'linear-gradient(145deg, #9C27B0, #E91E63)', color: 'white', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', opacity: 0.9 }}>Total Transactions</Typography>
              <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold' }}>
                {stats?.totalTransactions || 0}
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
                <FormControl sx={{ flex: '1 1 180px' }} size="small">
                  <InputLabel>Type</InputLabel>
                  <Select value={filters.type} label="Type" onChange={e => handleFilterChange('type', e.target.value)}>
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="deposit">Deposit</MenuItem>
                    <MenuItem value="withdrawal">Withdrawal</MenuItem>
                    <MenuItem value="game_purchase">Game Purchase</MenuItem>
                    <MenuItem value="winning">Winning</MenuItem>
                  </Select>
                </FormControl>

                <FormControl sx={{ flex: '1 1 180px' }} size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={filters.status} label="Status" onChange={e => handleFilterChange('status', e.target.value)}>
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  sx={{ flex: '1 1 200px' }}
                  size="small"
                  label="Search Reference"
                  value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
                />

                <FormControl sx={{ flex: '1 1 120px' }} size="small">
                  <InputLabel>Per page</InputLabel>
                  <Select value={filters.limit} label="Per page" onChange={e => handleFilterChange('limit', e.target.value)}>
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
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={isMobile ? 40 : 60} />
        </Box>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
          {/* Mobile Cards */}
          {isMobile && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {transactions.map(t => {
                const isExpanded = expandedTransaction === t._id;
                return (
                  <Card key={t._id} sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getTypeIcon(t.type)}
                          <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold', textTransform: 'capitalize' }}>
                            {getTypeLabel(t.type)}
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
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: t.type === 'withdrawal' || t.type === 'game_purchase' ? 'error.main' : 'success.main' }}>
                          {t.type === 'withdrawal' || t.type === 'game_purchase' ? `-${formatCurrency(t.amount)}` : `+${formatCurrency(t.amount)}`}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Status:</Typography>
                        <Chip label={t.status} color={getStatusColor(t.status)} size="small" sx={{ height: 24 }} />
                      </Box>

                      {isExpanded && (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Reference:</Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                              {t.reference}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Date:</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                              {formatDate(t.createdAt)}
                            </Typography>
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
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Reference</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>User</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map(t => (
                      <TableRow key={t._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getTypeIcon(t.type)}
                            <Typography variant="body2" sx={{ ml: 1, textTransform: 'capitalize' }}>
                              {getTypeLabel(t.type)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: t.type === 'withdrawal' || t.type === 'game_purchase' ? 'error.main' : 'success.main' }}>
                            {t.type === 'withdrawal' || t.type === 'game_purchase' ? `-${formatCurrency(t.amount)}` : `+${formatCurrency(t.amount)}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={t.status} color={getStatusColor(t.status)} size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {t.reference}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            {t.userId?.phone || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                            {formatDate(t.createdAt)}
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

              {transactions.length === 0 && !loading && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    No transactions found.
                  </Typography>
                </Box>
              )}
            </Card>
          )}

          {/* Pagination */}
          {pagination.total > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination count={pagination.total} page={pagination.current} onChange={handlePageChange} color="primary" size={isMobile ? 'small' : 'medium'} />
            </Box>
          )}

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {transactions.length} of {pagination.totalRecords} transactions
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
              <Typography variant="body2"><strong>Type:</strong> {getTypeLabel(selectedTransaction.type)}</Typography>
              <Typography variant="body2"><strong>Amount:</strong> {formatCurrency(selectedTransaction.amount)}</Typography>
              <Typography variant="body2"><strong>Reference:</strong> {selectedTransaction.reference}</Typography>
              <Typography variant="body2"><strong>Status:</strong> {selectedTransaction.status}</Typography>
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
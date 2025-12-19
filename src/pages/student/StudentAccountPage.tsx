import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import StudentLayout from '@/components/student/StudentLayout';
import { format } from 'date-fns';
import { useStudentAuth } from '@/contexts/StudentAuthContext';
import api from '@/lib/api';

interface Transaction {
  id: number;
  type: 'deposit' | 'expense';
  amount: number;
  purpose: string;
  description: string;
  balance_after: number;
  transaction_date: string;
}

type FilterType = 'all' | 'credit' | 'debit';

export default function StudentAccountPage() {
  const { student, isLoading: isAuthLoading } = useStudentAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [stats, setStats] = useState({ totalCredits: 0, totalDebits: 0 });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      fetchTransactions(1);
    }
  }, [student]);

  const fetchTransactions = async (page = 1) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/student/transactions?page=${page}`);

      // Update data and pagination info
      setTransactions(data.data || []);
      setCurrentPage(data.current_page || 1);
      setLastPage(data.last_page || 1);
      setNextPageUrl(data.next_page_url);
      setPrevPageUrl(data.prev_page_url);

      // Use backend stats if available (for total credits/debits)
      if (data.stats) {
        setStats({
          totalCredits: Number(data.stats.total_credits),
          totalDebits: Number(data.stats.total_debits)
        });
      }

    } catch (error) {
      console.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'credit') return t.type === 'deposit';
    if (filter === 'debit') return t.type === 'expense';
    return true;
  });

  // Add opening balance as virtual last transaction (oldest chronologically) if on last page and showing all/credits
  const transactionsWithOpening = React.useMemo(() => {
    if (currentPage === lastPage && student?.opening_balance && (filter === 'all' || filter === 'credit')) {
      const openingTransaction: Transaction = {
        id: -1, // Negative ID to indicate virtual transaction
        type: 'deposit',
        amount: student.opening_balance,
        purpose: 'Opening Balance',
        description: 'Opening Balance (Last Year Total)',
        balance_after: student.opening_balance,
        transaction_date: '2024-01-01T00:00:00.000000Z',
      };
      return [...filteredTransactions, openingTransaction];
    }
    return filteredTransactions;
  }, [currentPage, lastPage, student, filter, filteredTransactions]);

  // Adjust stats to include opening balance in credits
  const adjustedStats = React.useMemo(() => {
    const openingBalanceAmount = student?.opening_balance || 0;
    return {
      totalCredits: stats.totalCredits + openingBalanceAmount,
      totalDebits: stats.totalDebits,
    };
  }, [stats, student]);

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'credit', label: 'Credits' },
    { value: 'debit', label: 'Debits' },
  ];

  if (isAuthLoading || !student) return null;

  return (
    <StudentLayout title="Account" showBack>
      <div className="space-y-6 pb-24">
        {/* Balance Card */}
        <Card variant="elevated" className="animate-slide-up overflow-hidden">
          <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-primary-foreground/80">Current Balance</p>
                <p className={`text-3xl font-bold`}>
                  ₹{(Number(student.walletBalance) || 0).toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                </p>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/70">
              Last updated: {format(new Date(), 'MMM d, yyyy')}
            </p>
          </div>

          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-success">₹{adjustedStats.totalCredits.toLocaleString('en-IN')}</p>
                <p className="text-sm text-muted-foreground">Total Credits</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-destructive">₹{adjustedStats.totalDebits.toLocaleString('en-IN')}</p>
                <p className="text-sm text-muted-foreground">Total Debits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.value)}
              className="flex-shrink-0"
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground px-1 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Transactions
          </h2>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center p-8 text-muted-foreground">Loading transactions...</div>
            ) : transactionsWithOpening.map((transaction, index) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                index={index}
              />
            ))}
          </div>

          {!loading && transactionsWithOpening.length === 0 && (
            <Card variant="flat">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No transactions found</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && (
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              disabled={!prevPageUrl}
              onClick={() => fetchTransactions(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {lastPage}
            </span>
            <Button
              variant="outline"
              disabled={!nextPageUrl}
              onClick={() => fetchTransactions(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        )}

        {/* Info Note */}
        <Card variant="flat" className="animate-fade-in">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              💡 Account data is synced from the school finance system.
              For any discrepancies, please contact the accounts office.
            </p>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}

function TransactionCard({ transaction, index }: { transaction: Transaction; index: number }) {
  const isCredit = transaction.type === 'deposit';

  return (
    <Card
      variant="interactive"
      className={`animate-slide-up stagger-${Math.min(index + 1, 5)}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCredit ? 'bg-success/10' : 'bg-destructive/10'
              }`}>
              {isCredit ? (
                <ArrowDownRight className="w-5 h-5 text-success" />
              ) : (
                <ArrowUpRight className="w-5 h-5 text-destructive" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">{transaction.description || transaction.purpose}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{transaction.purpose}</Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(transaction.transaction_date), 'MMM d, yyyy')}
                </span>
                <span className="text-xs text-muted-foreground">
                  Bal: ₹{Number(transaction.balance_after).toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-semibold ${isCredit ? 'text-success' : 'text-destructive'
              }`}>
              {isCredit ? '+' : '-'}₹{Number(transaction.amount).toLocaleString('en-IN', { maximumFractionDigits: 4 })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

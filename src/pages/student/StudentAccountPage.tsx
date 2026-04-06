import React, { useState, useEffect } from 'react';
import {
    Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
    Calendar, ChevronLeft, ChevronRight as ChevronRightIcon, Activity
} from 'lucide-react';
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
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
    const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (student) fetchTransactions(1);
    }, [student]);

    const fetchTransactions = async (page = 1) => {
        try {
            setLoading(true);
            const { data } = await api.get(`/student/transactions?page=${page}`);
            setTransactions(data.data || []);
            setCurrentPage(data.current_page || 1);
            setLastPage(data.last_page || 1);
            setNextPageUrl(data.next_page_url);
            setPrevPageUrl(data.prev_page_url);
            if (data.stats) {
                setStats({
                    totalCredits: Number(data.stats.total_credits),
                    totalDebits: Number(data.stats.total_debits),
                });
            }
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    const filteredTransactions = transactions.filter(t => {
        if (filter === 'credit') return t.type === 'deposit';
        if (filter === 'debit') return t.type === 'expense';
        return true;
    });

    const transactionsWithOpening = React.useMemo(() => {
        if (currentPage === lastPage && student?.opening_balance && (filter === 'all' || filter === 'credit')) {
            return [...filteredTransactions, {
                id: -1, type: 'deposit' as const,
                amount: student.opening_balance,
                purpose: 'Opening Balance',
                description: 'Opening Balance (Last Year Total)',
                balance_after: student.opening_balance,
                transaction_date: '2024-01-01T00:00:00.000000Z',
            }];
        }
        return filteredTransactions;
    }, [currentPage, lastPage, student, filter, filteredTransactions]);

    const adjustedStats = React.useMemo(() => ({
        totalCredits: stats.totalCredits + (student?.opening_balance || 0),
        totalDebits: stats.totalDebits,
    }), [stats, student]);

    const balance = Number(student?.walletBalance) || 0;
    const fmt = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

    if (isAuthLoading || !student) return null;

    return (
        <StudentLayout title="My Account">
            {/* ══════════════════════════════
                DESKTOP LAYOUT (lg+)
            ══════════════════════════════ */}
            <div className="hidden lg:flex gap-7 pb-8 items-start">

                {/* ── Left: Sticky stats sidebar ── */}
                <div className="w-72 shrink-0 space-y-4 sticky top-24">

                    {/* Balance card */}
                    <div className="bg-[#008f6c] rounded-2xl p-6 text-white shadow-lg shadow-[#008f6c]/20">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Current Balance</p>
                                <p className={`text-2xl font-black leading-tight ${balance < 0 ? 'text-red-300' : 'text-white'}`}>
                                    ₹{fmt(Math.abs(balance))}
                                </p>
                            </div>
                        </div>
                        <p className="text-[11px] text-emerald-100/70">Updated: {format(new Date(), 'MMM d, yyyy')}</p>
                    </div>

                    {/* Stats */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                        <div className="p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#008f6c]/10 flex items-center justify-center shrink-0">
                                <TrendingUp className="w-4 h-4 text-[#008f6c]" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Credits</p>
                                <p className="text-lg font-black text-[#008f6c]">₹{fmt(adjustedStats.totalCredits)}</p>
                            </div>
                        </div>
                        <div className="p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                                <TrendingDown className="w-4 h-4 text-red-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Debits</p>
                                <p className="text-lg font-black text-red-500">₹{fmt(adjustedStats.totalDebits)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Info note */}
                    <div className="bg-slate-50 rounded-2xl p-4 text-[11px] text-slate-400 leading-relaxed border border-slate-100">
                        💡 Account data is synced from the school finance system. For discrepancies, contact the accounts office.
                    </div>
                </div>

                {/* ── Right: Transaction table ── */}
                <div className="flex-1 min-w-0 space-y-4">

                    {/* Header row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-slate-400" />
                            <h2 className="font-black text-slate-800">Transaction History</h2>
                        </div>
                        {/* Filter pills */}
                        <div className="flex gap-2">
                            {(['all', 'credit', 'debit'] as FilterType[]).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border ${
                                        filter === f
                                            ? 'bg-[#008f6c] text-white border-[#008f6c] shadow-sm'
                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    {f === 'all' ? 'All' : f === 'credit' ? 'Credits' : 'Debits'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {/* Table header */}
                        <div className="grid grid-cols-[2fr,1fr,1fr,1fr] px-5 py-3 border-b border-slate-50 bg-slate-50/60">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Balance</span>
                        </div>

                        {loading ? (
                            <div className="divide-y divide-slate-50">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="grid grid-cols-[2fr,1fr,1fr,1fr] px-5 py-4 animate-pulse">
                                        <div className="h-3 bg-slate-100 rounded w-2/3" />
                                        <div className="h-3 bg-slate-100 rounded w-1/2" />
                                        <div className="h-3 bg-slate-100 rounded w-1/2 ml-auto" />
                                        <div className="h-3 bg-slate-100 rounded w-1/2 ml-auto" />
                                    </div>
                                ))}
                            </div>
                        ) : transactionsWithOpening.length === 0 ? (
                            <div className="py-16 text-center">
                                <Wallet className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                <p className="font-bold text-slate-400 text-sm">No transactions found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {transactionsWithOpening.map(t => {
                                    const isCredit = t.type === 'deposit';
                                    return (
                                        <div key={t.id} className="grid grid-cols-[2fr,1fr,1fr,1fr] px-5 py-4 hover:bg-slate-50/60 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? 'bg-[#008f6c]/10' : 'bg-red-50'}`}>
                                                    {isCredit
                                                        ? <ArrowDownRight className="w-4 h-4 text-[#008f6c]" />
                                                        : <ArrowUpRight className="w-4 h-4 text-red-500" />
                                                    }
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-bold text-slate-700 truncate">{t.description || t.purpose}</p>
                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                                        {t.purpose}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-[12px] text-slate-400 font-medium">
                                                    {format(new Date(t.transaction_date), 'MMM d, yyyy')}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-end">
                                                <span className={`text-[13px] font-black ${isCredit ? 'text-[#008f6c]' : 'text-red-500'}`}>
                                                    {isCredit ? '+' : '-'}₹{fmt(Number(t.amount))}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-end">
                                                <span className="text-[12px] font-bold text-slate-500">
                                                    ₹{fmt(Number(t.balance_after))}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && lastPage > 1 && (
                            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-50 bg-slate-50/40">
                                <button
                                    disabled={!prevPageUrl}
                                    onClick={() => fetchTransactions(currentPage - 1)}
                                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[12px] font-black text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                                </button>
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                    Page {currentPage} of {lastPage}
                                </span>
                                <button
                                    disabled={!nextPageUrl}
                                    onClick={() => fetchTransactions(currentPage + 1)}
                                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[12px] font-black text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next <ChevronRightIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════
                MOBILE LAYOUT (unchanged)
            ══════════════════════════════ */}
            <div className="lg:hidden space-y-5 pb-24">

                {/* Balance banner */}
                <div className="bg-[#008f6c] rounded-2xl p-5 text-white shadow-lg shadow-[#008f6c]/20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Current Balance</p>
                            <p className={`text-3xl font-black leading-tight ${balance < 0 ? 'text-red-300' : 'text-white'}`}>
                                ₹{fmt(Math.abs(balance))}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/10 rounded-xl p-3 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200 mb-0.5">Credits</p>
                            <p className="font-black text-white">₹{fmt(adjustedStats.totalCredits)}</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200 mb-0.5">Debits</p>
                            <p className="font-black text-white">₹{fmt(adjustedStats.totalDebits)}</p>
                        </div>
                    </div>
                </div>

                {/* Filter pills */}
                <div className="flex gap-2">
                    {(['all', 'credit', 'debit'] as FilterType[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border ${
                                filter === f
                                    ? 'bg-[#008f6c] text-white border-[#008f6c] shadow-sm'
                                    : 'bg-white text-slate-500 border-slate-200'
                            }`}
                        >
                            {f === 'all' ? 'All' : f === 'credit' ? 'Credits' : 'Debits'}
                        </button>
                    ))}
                </div>

                {/* Transaction list */}
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Recent Transactions</p>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-slate-100 rounded w-2/3" />
                                        <div className="h-2.5 bg-slate-50 rounded w-1/3" />
                                    </div>
                                </div>
                            ))
                        ) : transactionsWithOpening.length === 0 ? (
                            <div className="py-12 text-center">
                                <Wallet className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                <p className="font-bold text-slate-400 text-sm">No transactions found</p>
                            </div>
                        ) : transactionsWithOpening.map(t => {
                            const isCredit = t.type === 'deposit';
                            return (
                                <div key={t.id} className="flex items-center gap-3 p-4 hover:bg-slate-50/60 transition-colors">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? 'bg-[#008f6c]/10' : 'bg-red-50'}`}>
                                        {isCredit
                                            ? <ArrowDownRight className="w-5 h-5 text-[#008f6c]" />
                                            : <ArrowUpRight className="w-5 h-5 text-red-500" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-bold text-slate-700 truncate">{t.description || t.purpose}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">{t.purpose}</span>
                                            <span className="text-[10px] text-slate-300">{format(new Date(t.transaction_date), 'MMM d, yyyy')}</span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`text-[13px] font-black ${isCredit ? 'text-[#008f6c]' : 'text-red-500'}`}>
                                            {isCredit ? '+' : '-'}₹{fmt(Number(t.amount))}
                                        </p>
                                        <p className="text-[10px] text-slate-300 mt-0.5">Bal: ₹{fmt(Number(t.balance_after))}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Mobile Pagination */}
                {!loading && lastPage > 1 && (
                    <div className="flex items-center justify-between pt-1">
                        <button
                            disabled={!prevPageUrl}
                            onClick={() => fetchTransactions(currentPage - 1)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-black text-slate-600 border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" /> Prev
                        </button>
                        <span className="text-[11px] font-black text-slate-400">{currentPage} / {lastPage}</span>
                        <button
                            disabled={!nextPageUrl}
                            onClick={() => fetchTransactions(currentPage + 1)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-black text-slate-600 border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Next <ChevronRightIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* Info note */}
                <p className="text-[11px] text-slate-400 text-center px-4 leading-relaxed">
                    💡 Account data is synced from the school finance system. For discrepancies, contact the accounts office.
                </p>
            </div>
        </StudentLayout>
    );
}

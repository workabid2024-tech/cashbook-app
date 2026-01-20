import React, { useState, useEffect } from 'react';
import { Plus, Search, Download, Trash2, Edit2, TrendingUp, TrendingDown, DollarSign, Calendar, Filter, FileText, X, Check } from 'lucide-react';

export default function CashbookApp() {
  const [accounts, setAccounts] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [accountForm, setAccountForm] = useState({ name: '', type: 'personal' });
  const [transactionForm, setTransactionForm] = useState({
    type: 'income',
    amount: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Load data from persistent storage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const accountsData = await window.storage.get('cashbook-accounts');
      const transactionsData = await window.storage.get('cashbook-transactions');
      
      if (accountsData) {
        const parsedAccounts = JSON.parse(accountsData.value);
        setAccounts(parsedAccounts);
        if (parsedAccounts.length > 0 && !currentAccount) {
          setCurrentAccount(parsedAccounts[0].id);
        }
      }
      
      if (transactionsData) {
        setTransactions(JSON.parse(transactionsData.value));
      }
    } catch (error) {
      console.log('No previous data found, starting fresh');
    }
  };

  const saveData = async (newAccounts, newTransactions) => {
    try {
      await window.storage.set('cashbook-accounts', JSON.stringify(newAccounts || accounts));
      await window.storage.set('cashbook-transactions', JSON.stringify(newTransactions || transactions));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const addAccount = () => {
    if (!accountForm.name.trim()) return;
    
    const newAccount = {
      id: Date.now().toString(),
      name: accountForm.name,
      type: accountForm.type,
      createdAt: new Date().toISOString()
    };
    
    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    saveData(updatedAccounts, transactions);
    
    if (!currentAccount) setCurrentAccount(newAccount.id);
    setAccountForm({ name: '', type: 'personal' });
    setShowAddAccount(false);
  };

  const addTransaction = () => {
    if (!transactionForm.amount || !currentAccount) return;
    
    const newTransaction = {
      id: Date.now().toString(),
      accountId: currentAccount,
      type: transactionForm.type,
      amount: parseFloat(transactionForm.amount),
      note: transactionForm.note,
      date: transactionForm.date,
      createdAt: new Date().toISOString()
    };
    
    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    saveData(accounts, updatedTransactions);
    
    setTransactionForm({
      type: 'income',
      amount: '',
      note: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowAddTransaction(false);
  };

  const updateTransaction = () => {
    if (!editingTransaction || !transactionForm.amount) return;
    
    const updatedTransactions = transactions.map(t => 
      t.id === editingTransaction.id 
        ? { ...t, ...transactionForm, amount: parseFloat(transactionForm.amount) }
        : Tr
    );
    
    setTransactions(updatedTransactions);
    saveData(accounts, updatedTransactions);
    setEditingTransaction(null);
    setTransactionForm({
      type: 'income',
      amount: '',
      note: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const deleteTransaction = (id) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    saveData(accounts, updatedTransactions);
  };

  const startEdit = (transaction) => {
    setEditingTransaction(transaction);
    setTransactionForm({
      type: transaction.type,
      amount: transaction.amount.toString(),
      note: transaction.note,
      date: transaction.date
    });
    setShowAddTransaction(true);
  };

  const cancelEdit = () => {
    setEditingTransaction(null);
    setTransactionForm({
      type: 'income',
      amount: '',
      note: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const currentAccountTransactions = transactions.filter(t => t.accountId === currentAccount);
  
  const filteredTransactions = currentAccountTransactions.filter(t => {
    const matchesSearch = t.note.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const totalIncome = currentAccountTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = currentAccountTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpense;

  const downloadReport = () => {
    const csvContent = [
      ['Date', 'Type', 'Amount', 'Note'],
      ...filteredTransactions.map(t => [
        t.date,
        t.type === 'income' ? 'আয়' : 'খরচ',
        t.amount,
        t.note
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashbook-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
        <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
          <DollarSign className="w-8 h-8" />
          Cashbook - হিসাব খাতা
        </h1>
        
        {/* Account Selector */}
        <div className="flex gap-2 flex-wrap">
          {accounts.map(acc => (
            <button
              key={acc.id}
              onClick={() => setCurrentAccount(acc.id)}
              className={`px-4 py-2 rounded-lg transition ${
                currentAccount === acc.id
                  ? 'bg-white text-blue-600 font-semibold'
                  : 'bg-blue-500 hover:bg-blue-400'
              }`}
            >
              {acc.name}
            </button>
          ))}
          <button
            onClick={() => setShowAddAccount(true)}
            className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-400 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> নতুন একাউন্ট
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      {currentAccount && (
        <div className="max-w-6xl mx-auto px-4 -mt-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">মোট ব্যালেন্স</p>
                  <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ৳{balance.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">মোট আয়</p>
                  <p className="text-3xl font-bold text-green-600">৳{totalIncome.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">মোট খরচ</p>
                  <p className="text-3xl font-bold text-red-600">৳{totalExpense.toFixed(2)}</p>
                </div>
                <TrendingDown className="w-12 h-12 text-red-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        {!currentAccount ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <DollarSign className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">শুরু করুন</h2>
            <p className="text-gray-600 mb-6">প্রথমে একটি একাউন্ট তৈরি করুন</p>
            <button
              onClick={() => setShowAddAccount(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              নতুন একাউন্ট যোগ করুন
            </button>
          </div>
        ) : (
          <>
            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="নোট দিয়ে খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">সব দেখান</option>
                  <option value="income">শুধু আয়</option>
                  <option value="expense">শুধু খরচ</option>
                </select>
                
                <button
                  onClick={downloadReport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> রিপোর্ট ডাউনলোড
                </button>
                
                <button
                  onClick={() => setShowAddTransaction(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> নতুন লেনদেন
                </button>
              </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {filteredTransactions.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">কোনো লেনদেন নেই</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)).map(transaction => (
                    <div key={transaction.id} className="p-4 hover:bg-gray-50 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-3 rounded-full ${
                            transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {transaction.type === 'income' ? (
                              <TrendingUp className="w-6 h-6 text-green-600" />
                            ) : (
                              <TrendingDown className="w-6 h-6 text-red-600" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{transaction.note || 'নোট নেই'}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {new Date(transaction.date).toLocaleDateString('bn-BD')}
                            </p>
                          </div>
                          
                          <p className={`text-xl font-bold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}৳{transaction.amount.toFixed(2)}
                          </p>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => startEdit(transaction)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteTransaction(transaction.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">নতুন একাউন্ট</h3>
              <button onClick={() => setShowAddAccount(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">একাউন্টের নাম</label>
                <input
                  type="text"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({...accountForm, name: e.target.value})}
                  placeholder="যেমন: ব্যক্তিগত, ব্যবসা"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ধরন</label>
                <select
                  value={accountForm.type}
                  onChange={(e) => setAccountForm({...accountForm, type: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="personal">ব্যক্তিগত</option>
                  <option value="business">ব্যবসা</option>
                </select>
              </div>
              
              <button
                onClick={addAccount}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                একাউন্ট যোগ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Transaction Modal */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {editingTransaction ? 'লেনদেন সম্পাদনা' : 'নতুন লেনদেন'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddTransaction(false);
                  cancelEdit();
                }} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ধরন</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTransactionForm({...transactionForm, type: 'income'})}
                    className={`px-4 py-3 rounded-lg font-semibold transition ${
                      transactionForm.type === 'income'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    আয়
                  </button>
                  <button
                    onClick={() => setTransactionForm({...transactionForm, type: 'expense'})}
                    className={`px-4 py-3 rounded-lg font-semibold transition ${
                      transactionForm.type === 'expense'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    খরচ
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">টাকার পরিমাণ</label>
                <input
                  type="number"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">নোট</label>
                <input
                  type="text"
                  value={transactionForm.note}
                  onChange={(e) => setTransactionForm({...transactionForm, note: e.target.value})}
                  placeholder="যেমন: বাজার খরচ"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">তারিখ</label>
                <input
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm({...transactionForm, date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-2">
                {editingTransaction && (
                  <button
                    onClick={cancelEdit}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                  >
                    বাতিল
                  </button>
                )}
                <button
                  onClick={editingTransaction ? updateTransaction : addTransaction}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  {editingTransaction ? 'আপডেট করুন' : 'যোগ করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
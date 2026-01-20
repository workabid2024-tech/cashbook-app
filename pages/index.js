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
      console.log('Starting fresh');
    }
  };

  const saveData = async (newAccounts, newTransactions) => {
    try {
      await window.storage.set('cashbook-accounts', JSON.stringify(newAccounts || accounts));
      await window.storage.set('cashbook-transactions', JSON.stringify(newTransactions || transactions));
    } catch (error) {
      console.error('Error saving:', error);
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
        : t
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

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #EBF4FF, #E0E7FF)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      background: 'linear-gradient(to right, #2563EB, #4F46E5)',
      color: 'white',
      padding: '24px',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
    },
    title: {
      fontSize: '30px',
      fontWeight: 'bold',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    accountBtn: {
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      transition: 'all 0.2s',
      marginRight: '8px',
      marginBottom: '8px'
    },
    activeAccount: {
      background: 'white',
      color: '#2563EB'
    },
    inactiveAccount: {
      background: '#3B82F6',
      color: 'white'
    },
    addAccountBtn: {
      background: '#10B981',
      color: 'white'
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      padding: '24px'
    },
    balanceCard: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #D1D5DB',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none'
    },
    button: {
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s'
    },
    primaryBtn: {
      background: '#2563EB',
      color: 'white'
    },
    successBtn: {
      background: '#10B981',
      color: 'white'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 50
    },
    modalContent: {
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
      maxWidth: '500px',
      width: '100%',
      padding: '24px'
    },
    transaction: {
      padding: '16px',
      borderBottom: '1px solid #E5E7EB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'background 0.2s'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          <DollarSign size={32} />
          Cashbook - হিসাব খাতা
        </h1>
        
        <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
          {accounts.map(acc => (
            <button
              key={acc.id}
              onClick={() => setCurrentAccount(acc.id)}
              style={{
                ...styles.accountBtn,
                ...(currentAccount === acc.id ? styles.activeAccount : styles.inactiveAccount)
              }}
            >
              {acc.name}
            </button>
          ))}
          <button
            onClick={() => setShowAddAccount(true)}
            style={{...styles.accountBtn, ...styles.addAccountBtn}}
          >
            <Plus size={16} style={{display: 'inline', marginRight: '4px'}} /> নতুন একাউন্ট
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      {currentAccount && (
        <div style={{maxWidth: '1200px', margin: '0 auto', padding: '0 16px', marginTop: '-32px', marginBottom: '24px'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px'}}>
            <div style={styles.card}>
              <div style={styles.balanceCard}>
                <div>
                  <p style={{color: '#6B7280', fontSize: '14px', marginBottom: '8px'}}>মোট ব্যালেন্স</p>
                  <p style={{fontSize: '30px', fontWeight: 'bold', color: balance >= 0 ? '#10B981' : '#EF4444'}}>
                    ৳{balance.toFixed(2)}
                  </p>
                </div>
                <DollarSign size={48} color="#3B82F6" />
              </div>
            </div>
            
            <div style={styles.card}>
              <div style={styles.balanceCard}>
                <div>
                  <p style={{color: '#6B7280', fontSize: '14px', marginBottom: '8px'}}>মোট আয়</p>
                  <p style={{fontSize: '30px', fontWeight: 'bold', color: '#10B981'}}>৳{totalIncome.toFixed(2)}</p>
                </div>
                <TrendingUp size={48} color="#10B981" />
              </div>
            </div>
            
            <div style={styles.card}>
              <div style={styles.balanceCard}>
                <div>
                  <p style={{color: '#6B7280', fontSize: '14px', marginBottom: '8px'}}>মোট খরচ</p>
                  <p style={{fontSize: '30px', fontWeight: 'bold', color: '#EF4444'}}>৳{totalExpense.toFixed(2)}</p>
                </div>
                <TrendingDown size={48} color="#EF4444" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{maxWidth: '1200px', margin: '0 auto', padding: '0 16px 32px'}}>
        {!currentAccount ? (
          <div style={{...styles.card, textAlign: 'center', padding: '48px'}}>
            <DollarSign size={96} color="#D1D5DB" style={{margin: '0 auto 16px'}} />
            <h2 style={{fontSize: '24px', fontWeight: 'bold', color: '#374151', marginBottom: '8px'}}>শুরু করুন</h2>
            <p style={{color: '#6B7280', marginBottom: '24px'}}>প্রথমে একটি একাউন্ট তৈরি করুন</p>
            <button
              onClick={() => setShowAddAccount(true)}
              style={{...styles.button, ...styles.primaryBtn, margin: '0 auto'}}
            >
              নতুন একাউন্ট যোগ করুন
            </button>
          </div>
        ) : (
          <>
            {/* Search and Actions */}
            <div style={{...styles.card, marginBottom: '24px'}}>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '16px'}}>
                <div style={{flex: 1, minWidth: '200px', position: 'relative'}}>
                  <Search size={20} style={{position: 'absolute', left: '12px', top: '10px', color: '#9CA3AF'}} />
                  <input
                    type="text"
                    placeholder="নোট দিয়ে খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{...styles.input, paddingLeft: '40px'}}
                  />
                </div>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  style={styles.input}
                >
                  <option value="all">সব দেখান</option>
                  <option value="income">শুধু আয়</option>
                  <option value="expense">শুধু খরচ</option>
                </select>
                
                <button onClick={downloadReport} style={{...styles.button, ...styles.successBtn}}>
                  <Download size={16} /> রিপোর্ট
                </button>
                
                <button onClick={() => setShowAddTransaction(true)} style={{...styles.button, ...styles.primaryBtn}}>
                  <Plus size={16} /> নতুন লেনদেন
                </button>
              </div>
            </div>

            {/* Transactions */}
            <div style={styles.card}>
              {filteredTransactions.length === 0 ? (
                <div style={{textAlign: 'center', padding: '48px'}}>
                  <FileText size={64} color="#D1D5DB" style={{margin: '0 auto 16px'}} />
                  <p style={{color: '#6B7280'}}>কোনো লেনদেন নেই</p>
                </div>
              ) : (
                filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => (
                  <div key={t.id} style={styles.transaction}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '16px', flex: 1}}>
                      <div style={{
                        padding: '12px',
                        borderRadius: '50%',
                        background: t.type === 'income' ? '#D1FAE5' : '#FEE2E2'
                      }}>
                        {t.type === 'income' ? (
                          <TrendingUp size={24} color="#10B981" />
                        ) : (
                          <TrendingDown size={24} color="#EF4444" />
                        )}
                      </div>
                      
                      <div style={{flex: 1}}>
                        <p style={{fontWeight: '600', color: '#1F2937'}}>{t.note || 'নোট নেই'}</p>
                        <p style={{fontSize: '14px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '8px'}}>
                          <Calendar size={16} />
                          {new Date(t.date).toLocaleDateString('bn-BD')}
                        </p>
                      </div>
                      
                      <p style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: t.type === 'income' ? '#10B981' : '#EF4444'
                      }}>
                        {t.type === 'income' ? '+' : '-'}৳{t.amount.toFixed(2)}
                      </p>
                    </div>
                    
                    <div style={{display: 'flex', gap: '8px', marginLeft: '16px'}}>
                      <button onClick={() => startEdit(t)} style={{padding: '8px', border: 'none', background: '#DBEAFE', borderRadius: '8px', cursor: 'pointer'}}>
                        <Edit2 size={20} color="#2563EB" />
                      </button>
                      <button onClick={() => deleteTransaction(t.id)} style={{padding: '8px', border: 'none', background: '#FEE2E2', borderRadius: '8px', cursor: 'pointer'}}>
                        <Trash2 size={20} color="#EF4444" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddAccount && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
              <h3 style={{fontSize: '24px', fontWeight: 'bold'}}>নতুন একাউন্ট</h3>
              <button onClick={() => setShowAddAccount(false)} style={{border: 'none', background: 'none', cursor: 'pointer'}}>
                <X size={24} color="#6B7280" />
              </button>
            </div>
            
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px'}}>একাউন্টের নাম</label>
              <input
                type="text"
                value={accountForm.name}
                onChange={(e) => setAccountForm({...accountForm, name: e.target.value})}
                placeholder="যেমন: ব্যক্তিগত"
                style={styles.input}
              />
            </div>
            
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px'}}>ধরন</label>
              <select
                value={accountForm.type}
                onChange={(e) => setAccountForm({...accountForm, type: e.target.value})}
                style={styles.input}
              >
                <option value="personal">ব্যক্তিগত</option>
                <option value="business">ব্যবসা</option>
              </select>
            </div>
            
            <button onClick={addAccount} style={{...styles.button, ...styles.primaryBtn, width: '100%', justifyContent: 'center', padding: '12px'}}>
              একাউন্ট যোগ করুন
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Transaction Modal */}
      {showAddTransaction && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
              <h3 style={{fontSize: '24px', fontWeight: 'bold'}}>
                {editingTransaction ? 'লেনদেন সম্পাদনা' : 'নতুন লেনদেন'}
              </h3>
              <button onClick={() => { setShowAddTransaction(false); cancelEdit(); }} style={{border: 'none', background: 'none', cursor: 'pointer'}}>
                <X size={24} color="#6B7280" />
              </button>
            </div>
            
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px'}}>ধরন</label>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
                <button
                  onClick={() => setTransactionForm({...transactionForm, type: 'income'})}
                  style={{
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: transactionForm.type === 'income' ? '#10B981' : '#E5E7EB',
                    color: transactionForm.type === 'income' ? 'white' : '#374151'
                  }}
                >
                  আয়
                </button>
                <button
                  onClick={() => setTransactionForm({...transactionForm, type: 'expense'})}
                  style={{
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: transactionForm.type === 'expense' ? '#EF4444' : '#E5E7EB',
                    color: transactionForm.type === 'expense' ? 'white' : '#374151'
                  }}
                >
                  খরচ
                </button>
              </div>
            </div>
            
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px'}}>টাকার পরিমাণ</label>
              <input
                type="number"
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                placeholder="0.00"
                style={styles.input}
              />
            </div>
            
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px'}}>নোট</label>
              <input
                type="text"
                value={transactionForm.note}
                onChange={(e) => setTransactionForm({...transactionForm, note: e.target.value})}
                placeholder="যেমন: বাজার খরচ"
                style={styles.input}
              />
            </div>
            
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px'}}>তারিখ</label>
              <input
                type="date"
                value={transactionForm.date}
                onChange={(e) => setTransactionForm({...transactionForm, date: e.target.value})}
                style={styles.input}
              />
            </div>
            
            <button
              onClick={editingTransaction ? updateTransaction : addTransaction}
              style={{...styles.button, ...styles.primaryBtn, width: '100%', justifyContent: 'center', padding: '12px'}}
            >
              <Check size={20} />
              {editingTransaction ? 'আপডেট করুন' : 'যোগ করুন'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```index.tsx
import './index.css'
import React from "react";
import { render } from "react-dom";
import { App } from "./App";

render(<App />, document.getElementById("root"));

```
```App.tsx
import React, { useEffect, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { Header } from './components/Header'
import { Navigation } from './components/Navigation'
import { BudgetTracker } from './components/BudgetTracker'
import { Assets } from './components/Assets'
import {
  FinanceContext,
  Category,
  Account,
  Transaction,
  Budget,
} from './context/FinanceContext'
import { v4 as uuidv4 } from 'uuid'
export function App() {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [cashBalance, setCashBalance] = useState(8245.0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [activeCurrency, setActiveCurrency] = useState('USD')
  // Initialize default categories
  useEffect(() => {
    const defaultCategories: Category[] = [
      // Income categories
      {
        id: uuidv4(),
        name: 'Salary',
        type: 'income',
        isCustom: false,
      },
      {
        id: uuidv4(),
        name: 'Investments',
        type: 'income',
        isCustom: false,
      },
      {
        id: uuidv4(),
        name: 'Freelance',
        type: 'income',
        isCustom: false,
      },
      {
        id: uuidv4(),
        name: 'Gifts',
        type: 'income',
        isCustom: false,
      },
      {
        id: uuidv4(),
        name: 'Other Income',
        type: 'income',
        isCustom: false,
      },
      // Expense categories
      {
        id: uuidv4(),
        name: 'Food',
        type: 'expense',
        isCustom: false,
      },
      {
        id: uuidv4(),
        name: 'Housing',
        type: 'expense',
        isCustom: false,
      },
      {
        id: uuidv4(),
        name: 'Transportation',
        type: 'expense',
        isCustom: false,
      },
      {
        id: uuidv4(),
        name: 'Entertainment',
        type: 'expense',
        isCustom: false,
      },
      {
        id: uuidv4(),
        name: 'Shopping',
        type: 'expense',
        isCustom: false,
      },
      {
        id: uuidv4(),
        name: 'Utilities',
        type: 'expense',
        isCustom: false,
      },
      {
        id: uuidv4(),
        name: 'Healthcare',
        type: 'expense',
        isCustom: false,
      },
      {
        id: uuidv4(),
        name: 'Education',
        type: 'expense',
        isCustom: false,
      },
      {
        id: uuidv4(),
        name: 'Other Expense',
        type: 'expense',
        isCustom: false,
      },
    ]
    setCategories(defaultCategories)
    // Initialize default accounts
    const defaultAccounts: Account[] = [
      {
        id: uuidv4(),
        name: 'Cash',
        type: 'cash',
        balance: 2000,
        currency: 'USD',
      },
      {
        id: uuidv4(),
        name: 'Bank Account',
        type: 'bank',
        balance: 6245,
        currency: 'USD',
      },
      {
        id: uuidv4(),
        name: 'Credit Card',
        type: 'credit',
        balance: 0,
        currency: 'USD',
      },
    ]
    setAccounts(defaultAccounts)
  }, [])
  const addTransaction = (transaction: Transaction) => {
    const newTransactions = [...transactions, transaction]
    setTransactions(newTransactions)
    // Update account balance
    updateAccount(
      transaction.accountId,
      transaction.amount,
      transaction.type === 'expense',
    )
    // Update cash balance (legacy support)
    if (transaction.type === 'income') {
      setCashBalance((prevBalance) => prevBalance + transaction.amount)
    } else {
      setCashBalance((prevBalance) => prevBalance - transaction.amount)
    }
    // Update budget if exists
    if (transaction.type === 'expense') {
      const relatedBudget = budgets.find(
        (budget) => budget.category === transaction.category,
      )
      if (relatedBudget) {
        const updatedBudgets = budgets.map((budget) => {
          if (budget.id === relatedBudget.id) {
            return {
              ...budget,
              spent: budget.spent + transaction.amount,
            }
          }
          return budget
        })
        setBudgets(updatedBudgets)
      }
    }
  }
  const addCategory = (category: Category) => {
    setCategories([...categories, category])
  }
  const addAccount = (account: Account) => {
    setAccounts([...accounts, account])
  }
  const updateAccount = (
    accountId: string,
    amount: number,
    isExpense: boolean,
  ) => {
    setAccounts((prevAccounts) =>
      prevAccounts.map((account) => {
        if (account.id === accountId) {
          return {
            ...account,
            balance: isExpense
              ? account.balance - amount
              : account.balance + amount,
          }
        }
        return account
      }),
    )
  }
  const addBudget = (budget: Budget) => {
    setBudgets([...budgets, budget])
  }
  return (
    <FinanceContext.Provider
      value={{
        cashBalance,
        transactions,
        categories,
        accounts,
        budgets,
        activeCurrency,
        addTransaction,
        addCategory,
        addAccount,
        updateAccount,
        addBudget,
        setActiveCurrency,
      }}
    >
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col md:flex-row flex-1">
          <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="flex-1 p-4 md:p-6">
            {activeTab === 'Dashboard' && <Dashboard />}
            {activeTab === 'Budget' && <BudgetTracker />}
            {activeTab === 'Assets' && <Assets />}
            {activeTab === 'History' && (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-600">
                  History Page
                </h2>
                <p className="text-gray-500 mt-2">
                  Transaction history will be displayed here.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </FinanceContext.Provider>
  )
}

```
```AppRouter.tsx
import React from "react";
  import { BrowserRouter, Routes, Route } from "react-router-dom";
  import { App } from "./App";

  export function AppRouter() {
    return (
      <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
          </Routes>
      </BrowserRouter>
    );
  }
```
```tailwind.config.js
export default {}
```
```index.css
/* PLEASE NOTE: THESE TAILWIND IMPORTS SHOULD NEVER BE DELETED */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';
/* DO NOT DELETE THESE TAILWIND IMPORTS, OTHERWISE THE STYLING WILL NOT RENDER AT ALL */
```
```components/Header.tsx
import React from 'react'
import { Bell, Settings, User } from 'lucide-react'
export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-blue-600">FinPortfolio</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-gray-100">
          <Bell size={20} className="text-gray-600" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <Settings size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
            <User size={16} />
          </div>
        </div>
      </div>
    </header>
  )
}

```
```components/Navigation.tsx
import React, { useState } from 'react'
import {
  LayoutDashboard,
  HelpCircle,
  Menu,
  X,
  DollarSign,
  Clock,
  BarChart3,
} from 'lucide-react'
type NavigationProps = {
  activeTab: string
  setActiveTab: (tab: string) => void
}
export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const navItems = [
    {
      icon: <LayoutDashboard size={20} />,
      label: 'Dashboard',
    },
    {
      icon: <DollarSign size={20} />,
      label: 'Budget',
    },
    {
      icon: <BarChart3 size={20} />,
      label: 'Assets',
    },
    {
      icon: <Clock size={20} />,
      label: 'History',
    },
  ]
  return (
    <>
      <button
        className="md:hidden fixed top-4 right-4 z-20 p-2 rounded-md bg-blue-500 text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <nav
        className={`
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 fixed md:static top-0 left-0 h-full w-64 
        bg-white border-r border-gray-200 z-10
        transform transition-transform duration-200 ease-in-out
      `}
      >
        <div className="p-6">
          <div className="space-y-6">
            {navItems.map((item, index) => (
              <div
                key={index}
                className={`
                  flex items-center space-x-3 p-2 rounded-lg cursor-pointer
                  ${item.label === activeTab ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}
                `}
                onClick={() => setActiveTab(item.label)}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer text-gray-600 hover:bg-gray-100">
              <HelpCircle size={20} />
              <span className="font-medium">Help & Support</span>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

```
```components/Dashboard.tsx
import React from 'react'
import { PortfolioSummary } from './PortfolioSummary'
import { PerformanceChart } from './PerformanceChart'
import { AssetAllocation } from './AssetAllocation'
import { AssetList } from './AssetList'
import { MarketOverview } from './MarketOverview'
export function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <div className="flex space-x-2">
          <select className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>Last year</option>
            <option>All time</option>
          </select>
        </div>
      </div>
      <PortfolioSummary />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PerformanceChart />
        </div>
        <div>
          <AssetAllocation />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AssetList />
        </div>
        <div>
          <MarketOverview />
        </div>
      </div>
    </div>
  )
}

```
```components/PortfolioSummary.tsx
import React, { useContext } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react'
import { FinanceContext } from '../context/FinanceContext'
export function PortfolioSummary() {
  const { cashBalance } = useContext(FinanceContext)
  const portfolioData = {
    totalValue: 124567.89,
    change: 1243.56,
    changePercent: 2.3,
    positive: true,
  }
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500">
            Total Portfolio Value
          </h3>
          <div className="mt-2 flex items-baseline">
            <span className="text-3xl font-bold text-gray-900">
              $
              {portfolioData.totalValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Today's Change</h3>
          <div className="mt-2 flex items-baseline">
            <span
              className={`text-2xl font-semibold ${portfolioData.positive ? 'text-green-600' : 'text-red-600'}`}
            >
              {portfolioData.positive ? '+' : '-'}$
              {Math.abs(portfolioData.change).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span
              className={`ml-2 text-sm font-medium ${portfolioData.positive ? 'text-green-600' : 'text-red-600'}`}
            >
              {portfolioData.positive ? '+' : '-'}
              {Math.abs(portfolioData.changePercent)}%
            </span>
            {portfolioData.positive ? (
              <TrendingUp className="ml-2 text-green-600" size={20} />
            ) : (
              <TrendingDown className="ml-2 text-red-600" size={20} />
            )}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Annual Return</h3>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-semibold text-gray-900">12.8%</span>
            <Percent className="ml-1 text-gray-600" size={16} />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Cash Balance</h3>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-semibold text-gray-900">
              $
              {cashBalance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <DollarSign className="ml-1 text-gray-600" size={16} />
          </div>
        </div>
      </div>
    </div>
  )
}

```
```components/PerformanceChart.tsx
import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
export function PerformanceChart() {
  const performanceData = [
    {
      date: 'Jan',
      portfolio: 100000,
      benchmark: 100000,
    },
    {
      date: 'Feb',
      portfolio: 105000,
      benchmark: 102000,
    },
    {
      date: 'Mar',
      portfolio: 103000,
      benchmark: 103000,
    },
    {
      date: 'Apr',
      portfolio: 106000,
      benchmark: 102500,
    },
    {
      date: 'May',
      portfolio: 110000,
      benchmark: 104000,
    },
    {
      date: 'Jun',
      portfolio: 112000,
      benchmark: 106000,
    },
    {
      date: 'Jul',
      portfolio: 118000,
      benchmark: 107000,
    },
    {
      date: 'Aug',
      portfolio: 120000,
      benchmark: 108000,
    },
    {
      date: 'Sep',
      portfolio: 118000,
      benchmark: 109000,
    },
    {
      date: 'Oct',
      portfolio: 123000,
      benchmark: 110000,
    },
    {
      date: 'Nov',
      portfolio: 122000,
      benchmark: 111000,
    },
    {
      date: 'Dec',
      portfolio: 124567,
      benchmark: 112000,
    },
  ]
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Portfolio Performance
      </h3>
      <div className="flex space-x-4 mb-4">
        <button className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-md">
          1M
        </button>
        <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
          3M
        </button>
        <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
          6M
        </button>
        <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
          YTD
        </button>
        <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
          1Y
        </button>
        <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
          ALL
        </button>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={performanceData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip
              formatter={(value) => [`$${value.toLocaleString()}`, undefined]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="portfolio"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              name="Your Portfolio"
            />
            <Line
              type="monotone"
              dataKey="benchmark"
              stroke="#9CA3AF"
              strokeWidth={2}
              dot={false}
              name="S&P 500"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

```
```components/AssetAllocation.tsx
import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
export function AssetAllocation() {
  const allocationData = [
    {
      name: 'Stocks',
      value: 65,
      color: '#3B82F6',
    },
    {
      name: 'Bonds',
      value: 15,
      color: '#10B981',
    },
    {
      name: 'Cash',
      value: 10,
      color: '#F59E0B',
    },
    {
      name: 'Real Estate',
      value: 5,
      color: '#8B5CF6',
    },
    {
      name: 'Crypto',
      value: 5,
      color: '#EC4899',
    },
  ]
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 h-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Asset Allocation
      </h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={allocationData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {allocationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend layout="vertical" align="right" verticalAlign="middle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-500 mb-2">
          Diversification Score
        </h4>
        <div className="flex items-center">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{
                width: '75%',
              }}
            ></div>
          </div>
          <span className="ml-2 text-sm font-medium text-gray-700">Good</span>
        </div>
      </div>
    </div>
  )
}

```
```components/AssetList.tsx
import React from 'react'
import { ArrowUpRight, ArrowDownRight, Search } from 'lucide-react'
export function AssetList() {
  const assets = [
    {
      name: 'Apple Inc.',
      symbol: 'AAPL',
      price: 182.63,
      change: 1.25,
      shares: 15,
      value: 2739.45,
    },
    {
      name: 'Microsoft Corp.',
      symbol: 'MSFT',
      price: 417.88,
      change: 2.36,
      shares: 8,
      value: 3343.04,
    },
    {
      name: 'Amazon.com Inc.',
      symbol: 'AMZN',
      price: 178.75,
      change: -0.89,
      shares: 12,
      value: 2145.0,
    },
    {
      name: 'Tesla Inc.',
      symbol: 'TSLA',
      price: 172.63,
      change: -2.15,
      shares: 10,
      value: 1726.3,
    },
    {
      name: 'Alphabet Inc.',
      symbol: 'GOOGL',
      price: 165.9,
      change: 0.75,
      shares: 14,
      value: 2322.6,
    },
  ]
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Your Assets</h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Search assets..."
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search
            className="absolute left-2.5 top-2.5 text-gray-400"
            size={16}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asset
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                24h
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shares
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {assets.map((asset, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-semibold text-xs">
                      {asset.symbol.substring(0, 2)}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {asset.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {asset.symbol}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                  ${asset.price.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                  <div
                    className={`flex items-center justify-end ${asset.change >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {asset.change >= 0 ? (
                      <ArrowUpRight size={16} />
                    ) : (
                      <ArrowDownRight size={16} />
                    )}
                    <span className="ml-1">{Math.abs(asset.change)}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                  {asset.shares}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                  ${asset.value.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

```
```components/MarketOverview.tsx
import React from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
export function MarketOverview() {
  const marketData = [
    {
      name: 'S&P 500',
      value: '4,927.11',
      change: 0.41,
    },
    {
      name: 'NASDAQ',
      value: '15,451.31',
      change: 0.97,
    },
    {
      name: 'DOW',
      value: '38,239.98',
      change: -0.16,
    },
    {
      name: 'Bitcoin',
      value: '67,312.45',
      change: 2.33,
    },
    {
      name: 'Gold',
      value: '2,389.10',
      change: 0.58,
    },
  ]
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 h-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Market Overview
      </h3>
      <div className="space-y-4">
        {marketData.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              {item.name}
            </span>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900 mr-2">
                {item.value}
              </span>
              <div
                className={`flex items-center ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {item.change >= 0 ? (
                  <ArrowUpRight size={16} />
                ) : (
                  <ArrowDownRight size={16} />
                )}
                <span className="text-xs font-medium">
                  {Math.abs(item.change)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Market News</h4>
        <div className="space-y-3">
          <div className="text-xs">
            <p className="font-medium text-gray-900">
              Fed Signals Potential Rate Cut
            </p>
            <p className="text-gray-500 mt-1">
              Federal Reserve hints at easing monetary policy in the coming
              months as inflation cools.
            </p>
          </div>
          <div className="text-xs">
            <p className="font-medium text-gray-900">
              Tech Earnings Beat Expectations
            </p>
            <p className="text-gray-500 mt-1">
              Major tech companies report stronger than anticipated quarterly
              results.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

```
```context/FinanceContext.tsx
import React, { createContext } from 'react'
export type Category = {
  id: string
  name: string
  type: 'income' | 'expense'
  isCustom: boolean
}
export type Account = {
  id: string
  name: string
  type: 'cash' | 'bank' | 'credit'
  balance: number
  currency: string
}
export type Transaction = {
  id: string
  date: Date
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  accountId: string
  currency: string
  isRecurring?: boolean
  recurringInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly'
}
export type Budget = {
  id: string
  category: string
  amount: number
  period: 'monthly' | 'yearly'
  spent: number
}
type FinanceContextType = {
  cashBalance: number
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
  budgets: Budget[]
  activeCurrency: string
  addTransaction: (transaction: Transaction) => void
  addCategory: (category: Category) => void
  addAccount: (account: Account) => void
  updateAccount: (accountId: string, amount: number, isExpense: boolean) => void
  addBudget: (budget: Budget) => void
  setActiveCurrency: (currency: string) => void
}
export const FinanceContext = createContext<FinanceContextType>({
  cashBalance: 0,
  transactions: [],
  categories: [],
  accounts: [],
  budgets: [],
  activeCurrency: 'USD',
  addTransaction: () => {},
  addCategory: () => {},
  addAccount: () => {},
  updateAccount: () => {},
  addBudget: () => {},
  setActiveCurrency: () => {},
})

```
```components/BudgetTracker.tsx
import React, { useEffect, useState, useContext } from 'react'
import {
  FinanceContext,
  Transaction,
  Category,
  Account,
  Budget,
} from '../context/FinanceContext'
import {
  PlusCircle,
  MinusCircle,
  Calendar,
  Tag,
  DollarSign,
  FileText,
  Search,
  Filter,
  Wallet,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Repeat,
  Plus,
  CreditCard,
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
const COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#6366F1',
  '#14B8A6',
  '#F43F5E',
  '#84CC16',
  '#0EA5E9',
]
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'HKD', 'TWD']
export function BudgetTracker() {
  const {
    transactions,
    addTransaction,
    categories,
    addCategory,
    accounts,
    addAccount,
    budgets,
    addBudget,
    activeCurrency,
    setActiveCurrency,
  } = useContext(FinanceContext)
  // Transaction form state
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [accountId, setAccountId] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringInterval, setRecurringInterval] = useState<
    'daily' | 'weekly' | 'monthly' | 'yearly'
  >('monthly')
  // UI state
  const [activeView, setActiveView] = useState<
    'transactions' | 'reports' | 'accounts' | 'budgets'
  >('transactions')
  const [newCategory, setNewCategory] = useState('')
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>(
    'expense',
  )
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showAddBudget, setShowAddBudget] = useState(false)
  // Account form state
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountType, setNewAccountType] = useState<
    'cash' | 'bank' | 'credit'
  >('cash')
  const [newAccountBalance, setNewAccountBalance] = useState('')
  const [newAccountCurrency, setNewAccountCurrency] = useState(activeCurrency)
  // Budget form state
  const [budgetCategory, setBudgetCategory] = useState('')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [budgetPeriod, setBudgetPeriod] = useState<'monthly' | 'yearly'>(
    'monthly',
  )
  // Filtering state
  const [filterDate, setFilterDate] = useState<
    'all' | 'thisMonth' | 'lastMonth' | 'custom'
  >('thisMonth')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterAccount, setFilterAccount] = useState('all')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>(
    'all',
  )
  const [searchTerm, setSearchTerm] = useState('')
  // Initialize default values
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id)
    }
  }, [accounts, accountId])
  // Handle transaction submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !description || !category || !accountId) {
      alert('Please fill in all required fields')
      return
    }
    const newTransaction: Transaction = {
      id: uuidv4(),
      date: new Date(date),
      description,
      amount: parseFloat(amount),
      type,
      category,
      accountId,
      currency: activeCurrency,
      isRecurring,
      recurringInterval: isRecurring ? recurringInterval : undefined,
    }
    addTransaction(newTransaction)
    // Reset form
    setAmount('')
    setDescription('')
    setCategory('')
    setDate(new Date().toISOString().split('T')[0])
    setIsRecurring(false)
  }
  // Handle category creation
  const handleAddCategory = () => {
    if (!newCategory) return
    const categoryExists = categories.some(
      (cat) =>
        cat.name.toLowerCase() === newCategory.toLowerCase() &&
        cat.type === newCategoryType,
    )
    if (categoryExists) {
      alert('This category already exists')
      return
    }
    const newCat: Category = {
      id: uuidv4(),
      name: newCategory,
      type: newCategoryType,
      isCustom: true,
    }
    addCategory(newCat)
    setNewCategory('')
    setShowAddCategory(false)
  }
  // Handle account creation
  const handleAddAccount = () => {
    if (!newAccountName || !newAccountBalance) {
      alert('Please fill in all required fields')
      return
    }
    const newAcc: Account = {
      id: uuidv4(),
      name: newAccountName,
      type: newAccountType,
      balance: parseFloat(newAccountBalance),
      currency: newAccountCurrency,
    }
    addAccount(newAcc)
    setNewAccountName('')
    setNewAccountType('cash')
    setNewAccountBalance('')
    setShowAddAccount(false)
  }
  // Handle budget creation
  const handleAddBudget = () => {
    if (!budgetCategory || !budgetAmount) {
      alert('Please fill in all required fields')
      return
    }
    const budgetExists = budgets.some((b) => b.category === budgetCategory)
    if (budgetExists) {
      alert('A budget for this category already exists')
      return
    }
    const newBudget: Budget = {
      id: uuidv4(),
      category: budgetCategory,
      amount: parseFloat(budgetAmount),
      period: budgetPeriod,
      spent: 0,
    }
    addBudget(newBudget)
    setBudgetCategory('')
    setBudgetAmount('')
    setShowAddBudget(false)
  }
  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  // Filter transactions based on current filters
  const getFilteredTransactions = () => {
    return transactions.filter((transaction) => {
      // Filter by date
      const transactionDate = new Date(transaction.date)
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const firstDayOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      )
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      let dateMatches = true
      if (filterDate === 'thisMonth') {
        dateMatches =
          transactionDate >= firstDayOfMonth &&
          transactionDate <= lastDayOfMonth
      } else if (filterDate === 'lastMonth') {
        dateMatches =
          transactionDate >= firstDayOfLastMonth &&
          transactionDate <= lastDayOfLastMonth
      } else if (filterDate === 'custom' && filterStartDate && filterEndDate) {
        const startDate = new Date(filterStartDate)
        const endDate = new Date(filterEndDate)
        dateMatches = transactionDate >= startDate && transactionDate <= endDate
      }
      // Filter by category
      const categoryMatches =
        filterCategory === 'all' || transaction.category === filterCategory
      // Filter by account
      const accountMatches =
        filterAccount === 'all' || transaction.accountId === filterAccount
      // Filter by type
      const typeMatches =
        filterType === 'all' || transaction.type === filterType
      // Filter by search term
      const searchMatches =
        !searchTerm ||
        transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
      return (
        dateMatches &&
        categoryMatches &&
        accountMatches &&
        typeMatches &&
        searchMatches
      )
    })
  }
  const filteredTransactions = getFilteredTransactions()
  // Prepare data for charts
  const prepareExpensePieChartData = () => {
    const categoryTotals: {
      [category: string]: number
    } = {}
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((transaction) => {
        if (!categoryTotals[transaction.category]) {
          categoryTotals[transaction.category] = 0
        }
        categoryTotals[transaction.category] += transaction.amount
      })
    return Object.keys(categoryTotals).map((category, index) => ({
      name: category,
      value: categoryTotals[category],
      color: COLORS[index % COLORS.length],
    }))
  }
  const prepareIncomeVsExpenseData = () => {
    const monthlyData: {
      [key: string]: {
        month: string
        income: number
        expense: number
      }
    } = {}
    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.date)
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`
      const monthName = date.toLocaleString('default', {
        month: 'short',
      })
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthName,
          income: 0,
          expense: 0,
        }
      }
      if (transaction.type === 'income') {
        monthlyData[monthKey].income += transaction.amount
      } else {
        monthlyData[monthKey].expense += transaction.amount
      }
    })
    return Object.values(monthlyData)
  }
  const prepareBudgetData = () => {
    return budgets.map((budget) => {
      const percentage = (budget.spent / budget.amount) * 100
      return {
        category: budget.category,
        spent: budget.spent,
        remaining: Math.max(0, budget.amount - budget.spent),
        percentage: Math.min(100, percentage),
      }
    })
  }
  const expensePieChartData = prepareExpensePieChartData()
  const incomeVsExpenseData = prepareIncomeVsExpenseData()
  const budgetData = prepareBudgetData()
  // Get total income and expense for the filtered transactions
  const getTotalIncome = () => {
    return filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0)
  }
  const getTotalExpense = () => {
    return filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0)
  }
  const totalIncome = getTotalIncome()
  const totalExpense = getTotalExpense()
  // Render the transaction form
  const renderTransactionForm = () => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Add Transaction
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="flex space-x-2 mb-4">
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center space-x-2 ${type === 'expense' ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}
              onClick={() => setType('expense')}
            >
              <MinusCircle size={16} />
              <span>Expense</span>
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center space-x-2 ${type === 'income' ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}
              onClick={() => setType('income')}
            >
              <PlusCircle size={16} />
              <span>Income</span>
            </button>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign size={16} className="text-gray-400" />
            </div>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-10 block w-full border border-gray-300 rounded-md py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>
        </div>
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
          </div>
          <select
            value={activeCurrency}
            onChange={(e) => setActiveCurrency(e.target.value)}
            className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account
            </label>
            <button
              type="button"
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={() => setShowAddAccount(true)}
            >
              + Add Account
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Wallet size={16} className="text-gray-400" />
            </div>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="pl-10 block w-full border border-gray-300 rounded-md py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select an account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency}{' '}
                  {account.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FileText size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="pl-10 block w-full border border-gray-300 rounded-md py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What was this for?"
              required
            />
          </div>
        </div>
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <button
              type="button"
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={() => setShowAddCategory(true)}
            >
              + Add Category
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag size={16} className="text-gray-400" />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="pl-10 block w-full border border-gray-300 rounded-md py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a category</option>
              {categories
                .filter((cat) => cat.type === type)
                .map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 block w-full border border-gray-300 rounded-md py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>
        <div className="mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={() => setIsRecurring(!isRecurring)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="recurring"
              className="ml-2 block text-sm text-gray-700"
            >
              Recurring transaction
            </label>
          </div>
        </div>
        {isRecurring && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recurrence
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Repeat size={16} className="text-gray-400" />
              </div>
              <select
                value={recurringInterval}
                onChange={(e) => setRecurringInterval(e.target.value as any)}
                className="pl-10 block w-full border border-gray-300 rounded-md py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
        )}
        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Transaction
        </button>
      </form>
    </div>
  )
  // Render the transaction list with filters
  const renderTransactionList = () => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-3 md:space-y-0">
        <h3 className="text-lg font-semibold text-gray-800">Transactions</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value as any)}
            className="border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="custom">Custom Range</option>
          </select>
          {filterDate === 'custom' && (
            <>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </>
          )}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Income</p>
          <p className="text-xl font-semibold text-green-600">
            {activeCurrency} {totalIncome.toFixed(2)}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Expenses</p>
          <p className="text-xl font-semibold text-red-600">
            {activeCurrency} {totalExpense.toFixed(2)}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Net Balance</p>
          <p
            className={`text-xl font-semibold ${totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {activeCurrency} {(totalIncome - totalExpense).toFixed(2)}
          </p>
        </div>
      </div>
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No transactions found with the current filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => {
                const account = accounts.find(
                  (a) => a.id === transaction.accountId,
                )
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.date)}
                      {transaction.isRecurring && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          <Repeat size={12} className="mr-1" />
                          {transaction.recurringInterval}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {account?.name}
                    </td>
                    <td
                      className={`px-4 py-3 whitespace-nowrap text-sm font-medium text-right ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {transaction.currency} {transaction.amount.toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
  // Render the reports view
  const renderReports = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Expense Breakdown
        </h3>
        <div className="h-64">
          {expensePieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensePieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {expensePieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    `${activeCurrency} ${value.toFixed(2)}`,
                    'Amount',
                  ]}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No expense data available for the selected period.
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Income vs Expenses
        </h3>
        <div className="h-64">
          {incomeVsExpenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsExpenseData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value}`} />
                <Tooltip
                  formatter={(value) => [
                    `${activeCurrency} ${value.toFixed(2)}`,
                    undefined,
                  ]}
                />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#10B981" />
                <Bar dataKey="expense" name="Expense" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No data available for the selected period.
            </div>
          )}
        </div>
      </div>
    </div>
  )
  // Render the accounts view
  const renderAccounts = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Accounts</h3>
          <button
            type="button"
            onClick={() => setShowAddAccount(true)}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus size={16} className="mr-1" />
            Add Account
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`p-4 rounded-lg border ${account.type === 'cash' ? 'border-green-200 bg-green-50' : account.type === 'bank' ? 'border-blue-200 bg-blue-50' : 'border-purple-200 bg-purple-50'}`}
            >
              <div className="flex items-center mb-2">
                {account.type === 'cash' && (
                  <DollarSign size={20} className="text-green-600 mr-2" />
                )}
                {account.type === 'bank' && (
                  <Wallet size={20} className="text-blue-600 mr-2" />
                )}
                {account.type === 'credit' && (
                  <CreditCard size={20} className="text-purple-600 mr-2" />
                )}
                <h4 className="font-medium">{account.name}</h4>
              </div>
              <p
                className={`text-xl font-semibold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {account.currency} {account.balance.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {account.type === 'cash'
                  ? 'Cash Account'
                  : account.type === 'bank'
                    ? 'Bank Account'
                    : 'Credit Card'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
  // Render the budgets view
  const renderBudgets = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Budgets</h3>
          <button
            type="button"
            onClick={() => setShowAddBudget(true)}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus size={16} className="mr-1" />
            Add Budget
          </button>
        </div>
        {budgets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No budgets set up yet. Add your first budget to start tracking your
            spending.
          </div>
        ) : (
          <div className="space-y-4">
            {budgetData.map((budget, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{budget.category}</span>
                  <span className="text-sm text-gray-600">
                    {activeCurrency} {budget.spent.toFixed(2)} /{' '}
                    {activeCurrency}{' '}
                    {(budget.spent + budget.remaining).toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                  <div
                    className={`h-2.5 rounded-full ${budget.percentage < 70 ? 'bg-green-600' : budget.percentage < 90 ? 'bg-yellow-500' : 'bg-red-600'}`}
                    style={{
                      width: `${budget.percentage}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{budget.percentage.toFixed(0)}% used</span>
                  <span>
                    {budget.remaining.toFixed(2)} {activeCurrency} remaining
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Budget Manager</h2>
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 text-sm rounded-md ${activeView === 'transactions' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => setActiveView('transactions')}
          >
            Transactions
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md ${activeView === 'reports' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => setActiveView('reports')}
          >
            Reports
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md ${activeView === 'accounts' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => setActiveView('accounts')}
          >
            Accounts
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md ${activeView === 'budgets' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => setActiveView('budgets')}
          >
            Budgets
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeView === 'transactions' && (
          <>
            <div className="lg:col-span-2">{renderTransactionList()}</div>
            <div>{renderTransactionForm()}</div>
          </>
        )}
        {activeView === 'reports' && (
          <div className="lg:col-span-3">{renderReports()}</div>
        )}
        {activeView === 'accounts' && (
          <div className="lg:col-span-3">{renderAccounts()}</div>
        )}
        {activeView === 'budgets' && (
          <div className="lg:col-span-3">{renderBudgets()}</div>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Category</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name
              </label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter category name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={newCategoryType === 'expense'}
                    onChange={() => setNewCategoryType('expense')}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Expense</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={newCategoryType === 'income'}
                    onChange={() => setNewCategoryType('income')}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Income</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddCategory(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Account</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name
              </label>
              <input
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter account name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Type
              </label>
              <select
                value={newAccountType}
                onChange={(e) => setNewAccountType(e.target.value as any)}
                className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Account</option>
                <option value="credit">Credit Card</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Balance
              </label>
              <input
                type="number"
                step="0.01"
                value={newAccountBalance}
                onChange={(e) => setNewAccountBalance(e.target.value)}
                className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={newAccountCurrency}
                onChange={(e) => setNewAccountCurrency(e.target.value)}
                className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddAccount(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddAccount}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Budget Modal */}
      {showAddBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Budget</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={budgetCategory}
                onChange={(e) => setBudgetCategory(e.target.value)}
                className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories
                  .filter((cat) => cat.type === 'expense')
                  .map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period
              </label>
              <select
                value={budgetPeriod}
                onChange={(e) => setBudgetPeriod(e.target.value as any)}
                className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddBudget(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddBudget}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Budget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

```
```components/Assets.tsx
import React, { useState } from 'react'
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Plus,
  Trash2,
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
type Asset = {
  id: string
  name: string
  symbol: string
  price: number
  change: number
  shares: number
  value: number
  assetType: 'stock' | 'crypto' | 'bond' | 'real_estate' | 'other'
}
export function Assets() {
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: uuidv4(),
      name: 'Apple Inc.',
      symbol: 'AAPL',
      price: 182.63,
      change: 1.25,
      shares: 15,
      value: 2739.45,
      assetType: 'stock',
    },
    {
      id: uuidv4(),
      name: 'Microsoft Corp.',
      symbol: 'MSFT',
      price: 417.88,
      change: 2.36,
      shares: 8,
      value: 3343.04,
      assetType: 'stock',
    },
    {
      id: uuidv4(),
      name: 'Bitcoin',
      symbol: 'BTC',
      price: 68250.75,
      change: 3.15,
      shares: 0.15,
      value: 10237.61,
      assetType: 'crypto',
    },
    {
      id: uuidv4(),
      name: 'Treasury Bond',
      symbol: 'T-BOND',
      price: 1000,
      change: 0.25,
      shares: 5,
      value: 5000,
      assetType: 'bond',
    },
    {
      id: uuidv4(),
      name: 'Rental Property',
      symbol: 'REAL-EST',
      price: 350000,
      change: 5.5,
      shares: 1,
      value: 350000,
      assetType: 'real_estate',
    },
  ])
  const [showAddAsset, setShowAddAsset] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAssetType, setFilterAssetType] = useState<string>('all')
  // Form state for adding new asset
  const [newAsset, setNewAsset] = useState<{
    name: string
    symbol: string
    price: string
    shares: string
    assetType: 'stock' | 'crypto' | 'bond' | 'real_estate' | 'other'
  }>({
    name: '',
    symbol: '',
    price: '',
    shares: '',
    assetType: 'stock',
  })
  const handleAddAsset = () => {
    if (
      !newAsset.name ||
      !newAsset.symbol ||
      !newAsset.price ||
      !newAsset.shares
    ) {
      alert('Please fill in all fields')
      return
    }
    const price = parseFloat(newAsset.price)
    const shares = parseFloat(newAsset.shares)
    const asset: Asset = {
      id: uuidv4(),
      name: newAsset.name,
      symbol: newAsset.symbol.toUpperCase(),
      price,
      change: 0,
      shares,
      value: price * shares,
      assetType: newAsset.assetType,
    }
    setAssets([...assets, asset])
    setShowAddAsset(false)
    setNewAsset({
      name: '',
      symbol: '',
      price: '',
      shares: '',
      assetType: 'stock',
    })
  }
  const handleDeleteAsset = (id: string) => {
    setAssets(assets.filter((asset) => asset.id !== id))
  }
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType =
      filterAssetType === 'all' || asset.assetType === filterAssetType
    return matchesSearch && matchesType
  })
  const totalValue = filteredAssets.reduce((sum, asset) => sum + asset.value, 0)
  // Calculate asset allocation percentages
  const assetAllocation = assets.reduce(
    (acc, asset) => {
      if (!acc[asset.assetType]) {
        acc[asset.assetType] = 0
      }
      acc[asset.assetType] += asset.value
      return acc
    },
    {} as Record<string, number>,
  )
  const assetTypeLabels: Record<string, string> = {
    stock: 'Stocks',
    crypto: 'Cryptocurrency',
    bond: 'Bonds',
    real_estate: 'Real Estate',
    other: 'Other',
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Asset Management</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">
            Total Assets Value
          </h3>
          <div className="mt-2">
            <span className="text-2xl font-bold text-gray-900">
              $
              {totalValue.toLocaleString('en-US', {
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
        {Object.entries(assetAllocation).map(([type, value]) => (
          <div
            key={type}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <h3 className="text-sm font-medium text-gray-500">
              {assetTypeLabels[type]}
            </h3>
            <div className="mt-2">
              <span className="text-2xl font-bold text-gray-900">
                $
                {value.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                ({((value / totalValue) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-3 md:space-y-0">
          <h3 className="text-lg font-semibold text-gray-800">Your Assets</h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterAssetType}
              onChange={(e) => setFilterAssetType(e.target.value)}
              className="border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="stock">Stocks</option>
              <option value="crypto">Cryptocurrency</option>
              <option value="bond">Bonds</option>
              <option value="real_estate">Real Estate</option>
              <option value="other">Other</option>
            </select>
            <button
              onClick={() => setShowAddAsset(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus size={16} className="mr-1" />
              Add Asset
            </button>
          </div>
        </div>
        {filteredAssets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No assets found. Add your first asset to start tracking your
            investments.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    24h
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-semibold text-xs">
                          {asset.symbol.substring(0, 2)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {asset.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {asset.symbol}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      $
                      {asset.price.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <div
                        className={`flex items-center justify-end ${asset.change >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {asset.change >= 0 ? (
                          <ArrowUpRight size={16} />
                        ) : (
                          <ArrowDownRight size={16} />
                        )}
                        <span className="ml-1">{Math.abs(asset.change)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {asset.shares}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      $
                      {asset.value.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {assetTypeLabels[asset.assetType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Add Asset Modal */}
      {showAddAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Asset</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Name
              </label>
              <input
                type="text"
                value={newAsset.name}
                onChange={(e) =>
                  setNewAsset({
                    ...newAsset,
                    name: e.target.value,
                  })
                }
                className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Apple Inc."
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symbol
              </label>
              <input
                type="text"
                value={newAsset.symbol}
                onChange={(e) =>
                  setNewAsset({
                    ...newAsset,
                    symbol: e.target.value,
                  })
                }
                className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. AAPL"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Type
              </label>
              <select
                value={newAsset.assetType}
                onChange={(e) =>
                  setNewAsset({
                    ...newAsset,
                    assetType: e.target.value as any,
                  })
                }
                className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="stock">Stock</option>
                <option value="crypto">Cryptocurrency</option>
                <option value="bond">Bond</option>
                <option value="real_estate">Real Estate</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Per Unit
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newAsset.price}
                onChange={(e) =>
                  setNewAsset({
                    ...newAsset,
                    price: e.target.value,
                  })
                }
                className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity/Shares
              </label>
              <input
                type="number"
                min="0"
                step="0.000001"
                value={newAsset.shares}
                onChange={(e) =>
                  setNewAsset({
                    ...newAsset,
                    shares: e.target.value,
                  })
                }
                className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddAsset(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddAsset}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

```
const API_BASE_URL = 'http://localhost:8000/api';

interface TransactionData {
    transaction_type: string;
    amount: string;
    currency: string;
    description: string;
    category: string;
    date: string;
    is_recurring: boolean;
    recurring_interval?: string | null;
    account: number;
}

interface AccountData {
    name: string;
    account_type: string;
    balance: string | number;
    currency: string;
}

interface AssetData {
    name: string;
    symbol: string;
    asset_type: string;
    price: string;
    quantity: string;
    account: number | '';
    cost: string;
}

interface BalanceSnapshotData {
    account: number;
    balance: number;
    date: string;
}

interface UserProfileData {
    preferred_currency?: string;
    display_name?: string;
    age?: number;
    gender?: string;
    risk_preference?: string;
}

interface Transaction {
    id: number;
    date: string;
    description: string;
    amount: number;
    category: string;
    transaction_type: string;
    is_recurring: boolean;
    recurring_interval?: string | null;
    account: number;
    currency: string;
}

interface Account {
  id: number;
  name: string;
  account_type: string;
  balance: number;
  currency: string;
}

interface Asset {
    id: number;
    name: string;
    symbol: string;
    asset_type: string;
    price: string | number;
    quantity: string | number;
    account: number;
    cost: string | number;
    market_price: string | number;
  }

const getAuthHeaders = (token: string) => {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

export const getTransactions = async (token: string, params: URLSearchParams) => {
    const response = await fetch(`${API_BASE_URL}/transactions/?${params.toString()}`, {
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch transactions');
    }
    return response.json();
};

export const createTransaction = async (token: string, transactionData: TransactionData) => {
    const response = await fetch(`${API_BASE_URL}/transactions/`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(transactionData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(Object.values(errorData).flat().join(' ') || 'Failed to create transaction');
    }
    return response.json();
};

export const deleteTransaction = async (token: string, transactionId: number) => {
    const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to delete transaction');
    }
    return response;
};

export const getAccounts = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/accounts/`, {
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch accounts');
    }
    return response.json();
};

export const createAccount = async (token: string, accountData: AccountData) => {
    const response = await fetch(`${API_BASE_URL}/accounts/`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(accountData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(Object.values(errorData).flat().join(' ') || 'Failed to create account');
    }
    return response.json();
};

export const updateAccount = async (token: string, accountId: number, accountData: Partial<Account>) => {
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(accountData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(Object.values(errorData).flat().join(' ') || 'Failed to update account');
    }
}
export const getAccountDetails = async (token: string, id: string) => {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}/`, {
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch account details');
    }
    return response.json();
};

export const deleteAccount = async (token: string, accountId: number) => {
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to delete account');
    }
    return response;
};

export const getAssets = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/assets/`, {
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch assets');
    }
    return response.json();
}
export const getAccountTransactions = async (token: string, id: string) => {
    const response = await fetch(`${API_BASE_URL}/transactions/?account=${id}`, {
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch account transactions');
    }
    return response.json();
};

export const createAsset = async (token: string, assetData: AssetData) => {
    const response = await fetch(`${API_BASE_URL}/assets/`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(assetData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(Object.values(errorData).flat().join(' ') || 'Failed to create asset');
    }
    return response.json();
}
export const createBalanceSnapshot = async (token: string, data: BalanceSnapshotData) => {
    const response = await fetch(`${API_BASE_URL}/balance-snapshots/`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(Object.values(errorData).flat().join(' ') || 'Failed to create balance snapshot');
    }
    return response.json();
};

export const updateAsset = async (token: string, assetId: number, assetData: Partial<Asset>) => {
    const response = await fetch(`${API_BASE_URL}/assets/${assetId}/`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(assetData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(Object.values(errorData).flat().join(' ') || 'Failed to update asset');
    }
    return response.json();
};

export const deleteAsset = async (token: string, assetId: number) => {
    const response = await fetch(`${API_BASE_URL}/assets/${assetId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to delete asset');
    }
    return response;
};


export const getAssetDetails = async (token: string, symbol: string, assetType: string) => {
    const url = `${API_BASE_URL}/get_asset_details/?symbol=${symbol}&type=${assetType}`;
    const response = await fetch(url, {
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        if (response.status === 404) {
            return null;
        }
        throw new Error('Failed to fetch asset details');
    }
    return response.json();
};

export const searchSymbols = async (token: string, keywords: string, assetType: string) => {
    const response = await fetch(`${API_BASE_URL}/search_symbols/?keywords=${keywords}&type=${assetType}`, {
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search symbols');
    }
    const data = await response.json();
    if (data.message) {
        alert(data.message);
        return [];
    }
    return data;
};

export const getAllTransactions = async (token: string) => {
    let allTransactions: Transaction[] = [];
    let page = 1;
    while (true) {
        const response = await fetch(`${API_BASE_URL}/transactions/?page=${page}&page_size=100`, {
            headers: getAuthHeaders(token),
        });
        if (response.ok) {
            const data = await response.json();
            allTransactions = [...allTransactions, ...data.results];
            if (!data.next) {
                break;
            }
            page++;
        } else {
            throw new Error('Failed to fetch all transactions');
        }
    }
    return allTransactions;
};

export const getUserProfile = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/users/profile/`, {
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch user profile');
    }
    return response.json();
};

export const updateUserProfile = async (token: string, profileData: UserProfileData) => {
    const response = await fetch(`${API_BASE_URL}/users/profile/`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(profileData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(Object.values(errorData).flat().join(' ') || 'Failed to update user profile');
    }
    return response.json();
};

export const loginUser = async (credentials: Record<string, string>) => {
    const response = await fetch(`${API_BASE_URL}/users/login/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
    }
    return response.json();
};

export const registerUser = async (userInfo: Record<string, string>) => {
    const response = await fetch(`${API_BASE_URL}/users/register/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userInfo),
    });
    if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = Object.values(errorData).flat().join(' ');
        throw new Error(errorMessage || 'Registration failed');
    }
    return response.json();
};

export const getPortfolioSummary = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/get_portfolio_summary/`, {
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch portfolio summary');
    }
    return response.json();
};

export const getAssetAllocation = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/get_asset_allocation/`, {
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch asset allocation');
    }
    return response.json();
};

export const getTransactionSummary = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/get_transaction_summary/`, {
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch transaction summary');
    }
    return response.json();
}
export const getBalanceSnapshots = async (token: string, accountId: string) => {
    const response = await fetch(`${API_BASE_URL}/balance-snapshots/?account=${accountId}`, {
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch balance snapshots');
    }
    return response.json();
};

export const updateBalanceSnapshot = async (token: string, id: string, data: Partial<BalanceSnapshotData>) => {
    const response = await fetch(`${API_BASE_URL}/balance-snapshots/${id}/`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(Object.values(errorData).flat().join(' ') || 'Failed to update balance snapshot');
    }
    return response.json();
};

export const getPortfolioGrowth = async (token: string, timeframe: string = 'all') => {
    const response = await fetch(`${API_BASE_URL}/get_portfolio_growth/?timeframe=${timeframe}`, {
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch portfolio growth data');
    }
    return response.json();
};

export interface Budget {
    id: number;
    category: string;
    budgeted_amount: number;
    spent_amount: number;
    currency: string;
    period: string;
}

export interface BudgetData {
    category: string;
    budgeted_amount: string;
    currency: string;
    period: string;
}

interface RawBudget {
    id: number;
    category: string;
    budgeted_amount: string;
    spent_amount: string;
    currency: string;
    period: string;
}

export const getBudgets = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/budgets/`, {
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch budgets');
    }
    const data = await response.json();
    return {
        ...data,
        results: data.results.map((budget: RawBudget) => ({
            ...budget,
            budgeted_amount: parseFloat(budget.budgeted_amount),
            spent_amount: parseFloat(budget.spent_amount),
        })),
    };
};

export const createBudget = async (token: string, budgetData: BudgetData) => {
    const response = await fetch(`${API_BASE_URL}/budgets/`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(budgetData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(Object.values(errorData).flat().join(' ') || 'Failed to create budget');
    }
    return response.json();
};

export const updateBudget = async (token: string, budgetId: number, budgetData: Partial<BudgetData>) => {
    const response = await fetch(`${API_BASE_URL}/budgets/${budgetId}/`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(budgetData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(Object.values(errorData).flat().join(' ') || 'Failed to update budget');
    }
    return response.json();
};

export const deleteBudget = async (token: string, budgetId: number) => {
    const response = await fetch(`${API_BASE_URL}/budgets/${budgetId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to delete budget');
    }
    return response;
};

export const convertCurrency = async (token: string, amount: number, fromCurrency: string, toCurrency: string) => {
    const response = await fetch(`${API_BASE_URL}/convert_currency/`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
            amount,
            from_currency: fromCurrency,
            to_currency: toCurrency,
        }),
    });
    if (!response.ok) {
        throw new Error('Failed to convert currency');
    }
    const data = await response.json();
    return data.converted_amount;
};

export const getBudgetSummary = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/get_budget_summary/`, {
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch budget summary');
    }
    return response.json();
};

export const uploadProfilePicture = async (token: string, file: File) => {
    console.log('API: uploadProfilePicture called');
    console.log('API: file:', file);
    console.log('API: token:', token ? 'present' : 'missing');
    console.log('API: API_BASE_URL:', API_BASE_URL);

    const formData = new FormData();
    formData.append('profile_picture', file);
    console.log('API: FormData created');

    const url = `${API_BASE_URL}/users/profile-picture/`;
    console.log('API: Making request to:', url);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // Don't set Content-Type header when using FormData, it will be set automatically with boundary
            },
            body: formData,
        });

        console.log('API: Response status:', response.status);
        console.log('API: Response ok:', response.ok);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API: Error response:', errorData);
            throw new Error(errorData.error || 'Failed to upload profile picture');
        }

        const result = await response.json();
        console.log('API: Success response:', result);
        return result;
    } catch (error) {
        console.error('API: Upload error:', error);
        throw error;
    }
};

export const deleteProfilePicture = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/users/profile-picture/`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete profile picture');
    }
    return response.json();
};

export const changePassword = async (token: string, currentPassword: string, newPassword: string) => {
    console.log('API: changePassword called');
    console.log('API: token:', token ? 'present' : 'missing');

    const response = await fetch(`${API_BASE_URL}/users/change-password/`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
        }),
    });

    console.log('API: Response status:', response.status);
    console.log('API: Response ok:', response.ok);

    if (!response.ok) {
        const errorData = await response.json();
        console.error('API: Error response:', errorData);
        throw new Error(errorData.error || 'Failed to change password');
    }

    const result = await response.json();
    console.log('API: Success response:', result);
    return result;
};
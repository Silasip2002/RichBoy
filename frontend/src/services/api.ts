const API_BASE_URL = 'http://localhost:8000/api';

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

export const createTransaction = async (token: string, transactionData: any) => {
    const response = await fetch(`${API_BASE_URL}/transactions/`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(transactionData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create transaction');
    }
    return response.json();
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

export const createAccount = async (token: string, accountData: any) => {
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

export const updateAccount = async (token: string, accountId: number, accountData: any) => {
    const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(accountData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(Object.values(errorData).flat().join(' ') || 'Failed to update account');
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
};

export const createAsset = async (token: string, assetData: any) => {
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
};

export const updateAsset = async (token: string, assetId: number, assetData: any) => {
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
    let allTransactions: any[] = [];
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

export const loginUser = async (credentials: any) => {
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

export const registerUser = async (userInfo: any) => {
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
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
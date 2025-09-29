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
        throw new Error(Object.values(errorData).flat().join(' ') || 'Failed to create transaction');
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

export const getAccountDetails = async (token: string, id: string) => {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}/`, {
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch account details');
    }
    return response.json();
};

export const getAccountTransactions = async (token: string, id: string) => {
    const response = await fetch(`${API_BASE_URL}/transactions/?account=${id}`, {
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch account transactions');
    }
    return response.json();
};

export const createBalanceSnapshot = async (token: string, data: any) => {
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

export const getBalanceSnapshots = async (token: string, accountId: string) => {
    const response = await fetch(`${API_BASE_URL}/balance-snapshots/?account=${accountId}`, {
        headers: getAuthHeaders(token),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch balance snapshots');
    }
    return response.json();
};

export const updateBalanceSnapshot = async (token: string, id: string, data: any) => {
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
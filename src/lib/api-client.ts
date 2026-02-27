/**
 * API Client for backend communication
 * Uses cookie-based session authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

interface BackendUser {
    id: string;
    email: string;
    name: string;
    department: string;
    position: string;
    roles?: string[];
}

export interface Policy {
    policy_id: string;
    policy_number: string;
    insured_name: string;
    binder_date: Date;
    effective_date: Date;
    exp_date: Date;
    carrier: string;
    premium: number | null;
    csr: string;
    assigned_user_name?: string | null;
    assigned_user_id?: string | null;
    assigned_user_email?: string | null;
}

export interface Carrier {
    id: string;
    name: string;
}

export interface HeadCarrier {
    id: string;
    name: string;
    carriersId: string[];
}

export interface UserCarrierLink {
    carrierId: string;
    carrierName: string | null;
}

export interface UserCarrierRow {
    userId: string;
    name: string;
    email: string;
    department?: string | null;
    position?: string | null;
    carriers: UserCarrierLink[];
    photoPath?: string | null;
}

export interface UserCarriersResponse {
    success: boolean;
    count: number;
    page: number;
    limit: number;
    totalPages: number;
    data: UserCarrierRow[];
}

class ApiClient {
    private baseURL: string;

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    /**
     * Make HTTP request with cookie authentication
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;

        const config: RequestInit = {
            credentials: 'include', // Always include cookies for session
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                console.error(`❌ API Error: ${data.error || data.message}`);
                throw new Error(data.error || data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error(`💥 API Request Failed:`, error);
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    /**
     * Authentication Methods
     */

    /**
     * Create session with user data from Microsoft authentication
     */
    async createSession(user: {
        email: string;
        microsoftId: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        position?: string;
        department?: string;
        roles?: string[];
    }): Promise<{
        success: boolean;
        message: string;
        user: BackendUser;
    }> {
        const result = await this.request<{
            success: boolean;
            message: string;
            user: BackendUser;
        }>('/auth/session', {
            method: 'POST',
            body: JSON.stringify({ user }),
        });
        return result;
    }

    /**
     * Validate current session
     */
    async validateSession(): Promise<{
        success: boolean;
        valid: boolean;
        user: BackendUser;
    }> {
        return this.request('/auth/validate');
    }

    /**
     * Get current user information
     */
    async getCurrentUser(): Promise<{ success: boolean; user: BackendUser }> {
        return this.request('/auth/me');
    }

    /**
     * Logout
     */
    async logout(): Promise<{ success: boolean; message: string }> {
        // Session cookie is cleared by backend
        return this.request('/auth/logout', { method: 'POST' });
    }

    /**
     * Policies Methods
     */

    /**
     * Get all policies with pagination and search
     */
    async getNewBusiness(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        success: boolean;
        count: number;
        page: number;
        limit: number;
        totalPages: number;
        data: Policy[];
    }> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const endpoint = `/policies/new-business${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return this.request(endpoint);
    }

    async getRenewals(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        success: boolean;
        count: number;
        page: number;
        limit: number;
        totalPages: number;
        data: Policy[];
    }> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const endpoint = `/policies/renewals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return this.request(endpoint);
    }

    async getUnassigned(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        success: boolean;
        count: number;
        page: number;
        limit: number;
        totalPages: number;
        data: Policy[];
    }> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const endpoint = `/policies/unassigned${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return this.request(endpoint);
    }

    async getUserCarriers(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<UserCarriersResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const endpoint = `/users/carriers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return this.get(endpoint);
    }

    async getAvailableCarriers(userId?: string): Promise<{ success: boolean; carriers: Carrier[] }> {
        const endpoint = userId ? `/carriers/available?userId=${encodeURIComponent(userId)}` : '/carriers/available';
        return this.get(endpoint);
    }

    async getAvailableHeadCarriers(userId?: string): Promise<{ success: boolean; headCarriers: HeadCarrier[] }> {
        const endpoint = userId ? `/carriers/head-carriers?userId=${encodeURIComponent(userId)}` : '/carriers/head-carriers';
        return this.get(endpoint);
    }

    async updateUserCarriers(userId: string, carrierIds: string[]): Promise<{
        success: boolean;
        userId: string;
        carrierIds: string[];
    }> {
        return this.put(`/user/${userId}/carriers`, { carrierIds });
    }

    async assignPolicy(policyId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }> {
        return this.put(`/policies/${policyId}/assign`, { userId });
    }

    async parsePolicy(policyId: string): Promise<{
        success: boolean;
        message: string;
    }> {
        return this.get(`/parse/policy/${policyId}`);
    }

    /**
     * Generic API methods for other endpoints
     */

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

export const apiClient = new ApiClient();
export default apiClient;
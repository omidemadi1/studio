// API client configuration and utilities for JWT authentication
import { sessionManager, User } from './session-manager';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

class ApiClient {
  private getToken(): string | null {
    return sessionManager.getToken();
  }

  private setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('authToken', token);
  }

  private clearToken(): void {
    sessionManager.clearSession();
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = this.getHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      this.clearToken();
      
      // Check if it's a token expiration
      const errorData = await response.json().catch(() => ({ message: 'Unauthorized' }));
      const message = errorData.message || errorData.error || '';
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('token') || lowerMessage.includes('expired') || lowerMessage.includes('session')) {
        console.log('[ApiClient] Session expired, redirecting to login');
        if (typeof window !== 'undefined') {
          window.location.href = '/login?expired=true';
        }
        throw new Error('Session expired. Please login again.');
      }
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  // Auth methods
  async signup(name: string, email: string, password: string, rememberMe: boolean = false): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    // Save session with SessionManager
    sessionManager.saveSession(response.user, response.token, rememberMe);
    
    return response;
  }

  async signin(email: string, password: string, rememberMe: boolean = false): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Save session with SessionManager
    sessionManager.saveSession(response.user, response.token, rememberMe);
    
    return response;
  }

  logout(): void {
    this.clearToken();
  }

  getCurrentUser(): User | null {
    return sessionManager.getCurrentUser();
  }
  
  /**
   * Check if session is valid
   */
  hasValidSession(): boolean {
    return sessionManager.hasValidSession();
  }
  
  /**
   * Get session info
   */
  getSessionInfo() {
    return sessionManager.getSessionInfo();
  }
  
  /**
   * Update activity
   */
  updateActivity(): void {
    sessionManager.updateActivity();
  }

  // Users
  async getUser(): Promise<any> {
    return this.request('/api/users/me');
  }

  async updateUser(updates: any): Promise<any> {
    return this.request('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Tasks
  async getTasks(): Promise<any[]> {
    return this.request('/api/tasks');
  }

  async getTask(id: string): Promise<any> {
    return this.request(`/api/tasks/${id}`);
  }

  async createTask(task: any): Promise<any> {
    return this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: string, updates: any): Promise<any> {
    return this.request(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(id: string): Promise<void> {
    return this.request(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Projects
  async getProjects(): Promise<any[]> {
    return this.request('/api/projects');
  }

  async getProject(id: string): Promise<any> {
    return this.request(`/api/projects/${id}`);
  }

  async createProject(project: any): Promise<any> {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(id: string, updates: any): Promise<any> {
    return this.request(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Skills
  async getSkills(): Promise<any[]> {
    return this.request('/api/skills');
  }

  async getSkill(id: string): Promise<any> {
    return this.request(`/api/skills/${id}`);
  }

  async createSkill(skill: any): Promise<any> {
    return this.request('/api/skills', {
      method: 'POST',
      body: JSON.stringify(skill),
    });
  }

  async updateSkill(id: string, updates: any): Promise<any> {
    return this.request(`/api/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteSkill(id: string): Promise<void> {
    return this.request(`/api/skills/${id}`, {
      method: 'DELETE',
    });
  }

  // Areas
  async getAreas(): Promise<any[]> {
    return this.request('/api/areas');
  }

  async getArea(id: string): Promise<any> {
    return this.request(`/api/areas/${id}`);
  }

  async createArea(area: any): Promise<any> {
    return this.request('/api/areas', {
      method: 'POST',
      body: JSON.stringify(area),
    });
  }

  async updateArea(id: string, updates: any): Promise<any> {
    return this.request(`/api/areas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteArea(id: string): Promise<void> {
    return this.request(`/api/areas/${id}`, {
      method: 'DELETE',
    });
  }

  // Missions
  async getMissions(): Promise<any[]> {
    return this.request('/api/missions');
  }

  async getMission(id: string): Promise<any> {
    return this.request(`/api/missions/${id}`);
  }

  async createMission(mission: any): Promise<any> {
    return this.request('/api/missions', {
      method: 'POST',
      body: JSON.stringify(mission),
    });
  }

  async updateMission(id: string, updates: any): Promise<any> {
    return this.request(`/api/missions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteMission(id: string): Promise<void> {
    return this.request(`/api/missions/${id}`, {
      method: 'DELETE',
    });
  }

  async generateMissions(level: number, skills: string[], weekIdentifier: string): Promise<any[]> {
    return this.request('/api/missions/generate', {
      method: 'POST',
      body: JSON.stringify({ level, skills, weekIdentifier }),
    });
  }

  // User
  async getUserProfile(): Promise<any> {
    return this.request('/api/users/me');
  }
}

export const apiClient = new ApiClient();

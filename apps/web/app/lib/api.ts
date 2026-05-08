const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface FetchOptions extends RequestInit {
  includeToken?: boolean;
}

type ApiError = {
  message: string;
  code?: string;
  statusCode?: number;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetchApi(endpoint: string, options: FetchOptions = {}): Promise<Response> {
    const { includeToken = true, ...fetchOptions } = options;
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string> || {}),
    };

    if (includeToken) {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle 401 Unauthorized — only redirect if not a refresh/login call
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      throw new Error('Unauthorized');
    }

    return response;
  }

  private async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    try {
      const response = await this.fetchApi(endpoint, options);

      if (!response.ok) {
        const error: ApiError = {
          message: `HTTP ${response.status}`,
          statusCode: response.status,
        };
        try {
          const data = await response.json();
          error.message = data.error?.message || data.message || error.message;
          error.code = data.error?.error || data.code;
        } catch {
          // Response wasn't JSON
        }
        throw error;
      }

      const json = await response.json();
      // API wraps responses in { success, data, timestamp } — unwrap
      return json.data !== undefined ? json.data : json;
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error as ApiError;
      }
      const message =
        error instanceof Error
          ? error.message === 'Failed to fetch'
            ? 'Impossible de contacter le serveur. Vérifiez que l\'API est lancée.'
            : error.message
          : 'Erreur inconnue';
      throw { message, statusCode: 0 } as ApiError;
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; username: string; email: string };
  }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      includeToken: false,
    });
  }

  async register(username: string, email: string, password: string): Promise<{
    user: { id: string; username: string; email: string };
  }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
      includeToken: false,
    });
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {
      // Continue logout even if API call fails
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      includeToken: false,
    });
  }

  async getMe(): Promise<{
    id: string;
    username: string;
    email: string;
    avatar?: string;
    elo?: number;
  }> {
    return this.request('/auth/me');
  }

  async createGuestSession(): Promise<{
    accessToken: string;
    guestId: string;
  }> {
    return this.request('/auth/guest', {
      method: 'POST',
      includeToken: false,
    });
  }

  // User endpoints
  async getProfile(userId: string): Promise<{
    id: string;
    username: string;
    email: string;
    avatar?: string;
    elo: number;
    gamesPlayed: number;
    joinedAt: string;
  }> {
    return this.request(`/users/${userId}`);
  }

  async updateProfile(userId: string, data: {
    username?: string;
    avatar?: string;
  }): Promise<{
    id: string;
    username: string;
    avatar?: string;
  }> {
    return this.request(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Game endpoints
  async getGames(): Promise<Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
  }>> {
    return this.request('/games');
  }

  async getGame(gameId: string): Promise<{
    id: string;
    name: string;
    icon: string;
    description: string;
    rules: string;
  }> {
    return this.request(`/games/${gameId}`);
  }

  async getGameHistory(userId: string): Promise<Array<{
    id: string;
    gameType: string;
    roomCode: string;
    players: string[];
    duration: number;
    result: 'win' | 'loss' | 'draw';
    timestamp: string;
  }>> {
    return this.request(`/users/${userId}/game-history`);
  }

  // Room endpoints
  async createRoom(gameType: string, config: any): Promise<{
    roomCode: string;
    gameType: string;
    createdAt: string;
  }> {
    return this.request('/rooms', {
      method: 'POST',
      body: JSON.stringify({ gameType, config }),
    });
  }

  async listRooms(gameType?: string): Promise<Array<{
    roomCode: string;
    gameType: string;
    players: number;
    maxPlayers: number;
    status: string;
  }>> {
    const url = gameType ? `/rooms?gameType=${gameType}` : '/rooms';
    return this.request(url);
  }

  async joinRoom(roomCode: string): Promise<{
    roomCode: string;
    gameType: string;
    players: Array<{ id: string; username: string }>;
  }> {
    return this.request(`/rooms/${roomCode}/join`, {
      method: 'POST',
    });
  }

  async leaveRoom(roomCode: string): Promise<void> {
    await this.request(`/rooms/${roomCode}/leave`, {
      method: 'POST',
    });
  }

  // Leaderboard endpoints
  async getLeaderboard(gameType?: string, limit = 100): Promise<Array<{
    rank: number;
    username: string;
    score: number;
    games: number;
    winrate: string;
  }>> {
    const params = new URLSearchParams();
    if (gameType) params.append('gameType', gameType);
    params.append('limit', limit.toString());
    return this.request(`/leaderboard?${params.toString()}`);
  }

  async getMyRank(gameType?: string): Promise<{
    rank: number;
    score: number;
    games: number;
    winrate: string;
  }> {
    const url = gameType ? `/leaderboard/my-rank?gameType=${gameType}` : '/leaderboard/my-rank';
    return this.request(url);
  }

  // Bot endpoints
  async listBots(): Promise<Array<{
    id: string;
    name: string;
    avatar: string;
    personality: string;
    difficulty: 'Facile' | 'Moyen' | 'Difficile' | 'Expert';
    gamesPlayed: number;
    winRate: number;
    active: boolean;
  }>> {
    return this.request('/bots');
  }

  async getBot(botId: string): Promise<{
    id: string;
    name: string;
    avatar: string;
    personality: string;
    difficulty: 'Facile' | 'Moyen' | 'Difficile' | 'Expert';
    gamesPlayed: number;
    winRate: number;
    active: boolean;
  }> {
    return this.request(`/bots/${botId}`);
  }

  // Asset endpoints
  async getAssetStatus(): Promise<{
    sources: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'down';
      lastCheck: string;
      cards: number;
    }>;
    storageUsed: number;
    storageTotal: number;
  }> {
    return this.request('/assets/status');
  }

  async getCardManifest(): Promise<{
    suits: string[];
    values: string[];
    total: number;
  }> {
    return this.request('/assets/cards');
  }

  // Admin endpoints
  async listUsers(params?: { page?: number; limit?: number; search?: string; status?: string; gameType?: string }): Promise<{
    users: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const qs = new URLSearchParams();
    if (params?.page) qs.append('page', params.page.toString());
    if (params?.limit) qs.append('limit', params.limit.toString());
    if (params?.search) qs.append('search', params.search);
    if (params?.status) qs.append('status', params.status);
    if (params?.gameType) qs.append('gameType', params.gameType);
    return this.request(`/admin/users?${qs.toString()}`);
  }

  async updateUserById(userId: string, data: any): Promise<any> {
    return this.request(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async createUser(data: { username: string; email: string; password: string; role?: string; gameType?: string }): Promise<any> {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteUserById(userId: string): Promise<void> {
    await this.request(`/admin/users/${userId}`, { method: 'DELETE' });
  }

  async getDashboardStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    gamesToday: number;
    avgSessionMinutes: number;
  }> {
    return this.request('/admin/stats');
  }

  async getActivityStats(): Promise<Array<{ date: string; users: number; games: number }>> {
    return this.request('/admin/stats/activity');
  }

  async getGamesByType(): Promise<Array<{ gameType: string; count: number }>> {
    return this.request('/admin/stats/games-by-type');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;

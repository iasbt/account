export const API_CONFIG = {
  // Nginx 代理地址 (使用相对路径以适配同源策略)
  // 如果在 Vercel 部署，需要设置为后端完整地址 (注意 Mixed Content 问题)
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api/rest',
};

/**
 * 通用 API 请求函数
 * @param endpoint API 端点 (例如 '/profiles')
 * @param options fetch 选项
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // TODO: 如果需要鉴权，在这里添加 Authorization 头
  // const token = useAuthStore.getState().token;
  // if (token) {
  //   headers['Authorization'] = `Bearer ${token}`;
  // }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * 获取用户资料列表 (测试用)
 */
export async function getProfiles() {
  return apiFetch<any[]>('/profiles?select=*&limit=5');
}

/**
 * 获取系统状态/统计信息
 */
export async function getSystemStats() {
  // 假设有一个 metrics 表或者只是为了测试连接
  // 这里我们尝试获取 profiles 的数量作为测试
  const response = await fetch(`${API_CONFIG.baseUrl}/profiles?select=count`, {
    headers: { 'Prefer': 'count=exact', 'Range-Unit': 'items' }
  });
  
  if (!response.ok) return { userCount: 0 };
  
  const contentRange = response.headers.get('Content-Range');
  const count = contentRange ? parseInt(contentRange.split('/')[1]) : 0;
  
  return { userCount: count };
}

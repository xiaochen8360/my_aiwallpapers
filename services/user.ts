import { wechatConfig } from '@/config/wechat';
import { User } from '@/types/user';

export class UserService {
  private static async callApi<T>(path: string, options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
  }): Promise<T> {
    const url = `${wechatConfig.WX_CLOUD_BASE_URL}${path}`;
    console.log('正在调用 API:', {
      url,
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        'X-WX-SERVICE': wechatConfig.WX_SERVICE_NAME,
      },
      data: options.data
    });

    try {
      const response = await fetch(url, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          'X-WX-SERVICE': wechatConfig.WX_SERVICE_NAME,
        },
        ...(options.data ? { body: JSON.stringify(options.data) } : {}),
        credentials: 'include', // 包含 cookies
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 调用失败: ${response.status} ${response.statusText}\n${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API 调用错误 (${path}):`, error);
      throw error;
    }
  }

  /**
   * 获取当前登录用户信息
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const user = await this.callApi<User>('/api/auth/user', {
        method: 'GET'
      });
      return user;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  }

  /**
   * 检查用户是否已登录
   */
  static async isLoggedIn(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }

  /**
   * 使用微信 code 登录
   */
  static async loginWithCode(code: string): Promise<User> {
    return this.callApi<User>('/api/auth/login', {
      method: 'POST',
      data: { code }
    });
  }
}

import { wechatConfig } from '@/config/wechat';
import { WallpaperRecord } from '@/types/user';

export class WallpaperService {
  private static async callApi<T>(path: string, options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
  }): Promise<T> {
    try {
      const response = await fetch(`${wechatConfig.WX_CLOUD_BASE_URL}${path}`, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          'X-WX-SERVICE': wechatConfig.WX_SERVICE_NAME,
        },
        ...(options.data ? { body: JSON.stringify(options.data) } : {}),
        credentials: 'include', // 包含 cookies
      });

      if (!response.ok) {
        throw new Error(`API 调用失败: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API 调用错误 (${path}):`, error);
      throw error;
    }
  }

  /**
   * 保存壁纸记录
   */
  static async saveWallpaper(params: {
    prompt: string;
    imageUrl: string;
    style?: string;
    isPublic?: boolean;
  }): Promise<WallpaperRecord> {
    return this.callApi<WallpaperRecord>('/api/wallpapers', {
      method: 'POST',
      data: params,
    });
  }

  /**
   * 获取用户的壁纸记录
   */
  static async getUserWallpapers(page = 1, limit = 10): Promise<{
    items: WallpaperRecord[];
    total: number;
    currentPage: number;
    totalPages: number;
  }> {
    return this.callApi(`/api/wallpapers/user?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  /**
   * 获取公开的壁纸记录
   */
  static async getPublicWallpapers(page = 1, limit = 10): Promise<{
    items: WallpaperRecord[];
    total: number;
    currentPage: number;
    totalPages: number;
  }> {
    return this.callApi(`/api/wallpapers/public?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  }

  /**
   * 更新壁纸记录
   */
  static async updateWallpaper(id: string, params: {
    isPublic?: boolean;
    prompt?: string;
    style?: string;
  }): Promise<WallpaperRecord> {
    return this.callApi<WallpaperRecord>(`/api/wallpapers/${id}`, {
      method: 'PUT',
      data: params,
    });
  }

  /**
   * 删除壁纸记录
   */
  static async deleteWallpaper(id: string): Promise<void> {
    return this.callApi<void>(`/api/wallpapers/${id}`, {
      method: 'DELETE',
    });
  }
}

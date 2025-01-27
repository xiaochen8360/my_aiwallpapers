import axios, { AxiosError } from 'axios';
import { wechatConfig } from '@/config/wechat';

// 定义HTTP方法类型
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// 定义API响应类型
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 定义错误类型
export class WechatServiceError extends Error {
  constructor(
    message: string,
    public code: number,
    public details?: any
  ) {
    super(message);
    this.name = 'WechatServiceError';
  }
}

interface WechatError {
  errmsg?: string;
  message?: string;
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  description: string;
}

export interface PaymentResult {
  orderId: string;
  status: 'success' | 'pending' | 'failed';
  paymentTime?: Date;
  errorMessage?: string;
}

export class WechatService {
  private static instance: WechatService;

  private constructor() {}

  public static getInstance(): WechatService {
    if (!WechatService.instance) {
      WechatService.instance = new WechatService();
    }
    return WechatService.instance;
  }

  /**
   * 统一错误处理
   */
  private handleError(error: unknown, orderId?: string): PaymentResult | never {
    let errorMessage = '未知错误';
    
    if (error instanceof AxiosError) {
      const wechatError = error.response?.data as WechatError;
      errorMessage = wechatError?.errmsg || wechatError?.message || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }

    // 如果提供了 orderId，返回支付错误结果
    if (orderId) {
      return {
        orderId,
        status: 'failed',
        errorMessage
      };
    }

    // 其他错误直接抛出
    throw new Error(`请求失败：${errorMessage}`);
  }

  /**
   * 创建支付订单
   * 使用云托管的云调用接口，自动处理鉴权
   */
  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    try {
      const response = await fetch('http://api.weixin.qq.com/pay/unifiedorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          out_trade_no: order.orderId,
          total_fee: Math.floor(order.amount * 100), // 转换为分
          body: order.description,
          trade_type: 'JSAPI',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.errcode !== 0) {
        return {
          orderId: order.orderId,
          status: 'failed',
          errorMessage: result.errmsg
        };
      }

      return {
        orderId: order.orderId,
        status: 'pending'
      };
    } catch (error) {
      return this.handleError(error, order.orderId);
    }
  }

  /**
   * 查询支付订单状态
   * 使用云托管的云调用接口，自动处理鉴权
   */
  async queryPaymentStatus(orderId: string): Promise<PaymentResult> {
    try {
      const response = await fetch('http://api.weixin.qq.com/pay/orderquery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          out_trade_no: orderId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.errcode !== 0) {
        return {
          orderId,
          status: 'failed',
          errorMessage: result.errmsg
        };
      }

      // 根据微信支付订单状态转换
      const status = result.trade_state === 'SUCCESS' ? 'success' : 
                    result.trade_state === 'NOTPAY' ? 'pending' : 'failed';

      return {
        orderId,
        status,
        paymentTime: result.success_time ? new Date(result.success_time) : undefined,
        errorMessage: status === 'failed' ? result.trade_state_desc : undefined
      };
    } catch (error) {
      return this.handleError(error, orderId);
    }
  }

  /**
   * 获取用户信息
   * 使用云托管的云调用接口，自动处理鉴权
   */
  async getUserInfo(code: string) {
    try {
      const response = await fetch('http://api.weixin.qq.com/sns/oauth2/access_token', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * 生成微信扫码登录URL
   */
  getWechatQRLoginUrl(redirectPath: string = '/auth/callback'): string {
    // 确保在客户端环境
    if (typeof window === 'undefined') {
      throw new WechatServiceError('此方法只能在客户端调用', 400);
    }

    // 使用配置的域名或当前域名
    const baseUrl = wechatConfig.IS_DEV
      ? window.location.origin
      : wechatConfig.WX_CLOUD_BASE_URL;

    const redirectUri = encodeURIComponent(`${baseUrl}${redirectPath}`);
    const state = Math.random().toString(36).substring(2) + Date.now().toString(36); // 使用随机数作为state

    // 将state保存到sessionStorage，用于回调验证
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('wxLoginState', state);
    }

    return `https://open.weixin.qq.com/connect/qrconnect?appid=${wechatConfig.WX_APP_ID}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;
  }

  /**
   * 验证微信回调状态
   */
  validateCallbackState(state: string): boolean {
    if (typeof sessionStorage === 'undefined') {
      return false;
    }
    const savedState = sessionStorage.getItem('wxLoginState');
    sessionStorage.removeItem('wxLoginState'); // 使用后立即删除
    return savedState === state;
  }
}

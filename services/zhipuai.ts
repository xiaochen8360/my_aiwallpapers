import axios from 'axios';

// 定义文生图 API 的配置
const API_KEY = process.env.ZHIPUAI_API_KEY;
if (!API_KEY) {
  throw new Error('ZHIPUAI_API_KEY 未定义，请检查 .env 文件');
}

const API_URL = 'https://open.bigmodel.cn/api/paas/v4/images/generations';

// 定义文生图 API 的请求参数类型
interface GenerateImageParams {
  model: string; // 模型编码
  prompt: string; // 文本提示
  width?: number; // 图片宽度（可选）
  height?: number; // 图片高度（可选）
}

// 定义文生图 API 的响应类型
interface GenerateImageResponse {
  code: number;
  message: string;
  data: {
    img_url: string; // 生成的图片 URL
  };
}

// 创建文生图 API 客户端
export class ZhipuAIClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // 生成图片的方法
  async generateImage(prompt: string, width?: number, height?: number): Promise<GenerateImageResponse> {
    try {
      const requestData: GenerateImageParams = {
        model: 'cogview-3-plus', // 模型编码
        prompt, // 文本提示
        width, // 图片宽度
        height, // 图片高度
      };

      // 发送 POST 请求
      const response = await axios.post(API_URL, requestData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`, // 添加 API Key 认证
        },
      });

      // 返回生成的图片 URL
      return {
        code: 0,
        message: 'ok',
        data: {
          img_url: response.data.data[0].url,
        },
      };
    } catch (error) {
      // 处理错误
      console.error('文生图 API 调用失败:', error);
      throw new Error('文生图 API 调用失败');
    }
  }
}

// 导出一个默认的客户端实例
export const zhipuAIClient = new ZhipuAIClient(API_KEY);
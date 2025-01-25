import { zhipuAIClient } from "@/services/zhipuai";
import { uploadFromUrl } from "@/lib/s3";
import { getDb } from "@/model/db";
import { Wallpaper } from "@/types/wallpaper";

// 随机风格列表
const styles = [
  "水彩风格",
  "油画风格",
  "插画风格",
  "中国画风格",
  "现代艺术风格",
  "极简主义风格",
  "赛博朋克风格",
  "复古风格",
  "可爱卡通风格",
  "写实风格"
];

// 随机修饰词列表
const modifiers = [
  "充满活力的",
  "温暖的",
  "清新的",
  "梦幻的",
  "精致的",
  "优雅的",
  "时尚的",
  "创意的",
  "独特的",
  "自然的"
];

function getRandomElement(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomSeed(): string {
  return Math.random().toString(36).substring(2, 10);
}

export async function POST(req: Request) {
  try {
    // 解析请求体
    const body = await req.json();
    console.log('收到请求体:', JSON.stringify(body, null, 2));
    
    const { description, user_email } = body;
    console.log('解析后的参数:', { description, user_email });

    if (!description) {
      return Response.json(
        {
          code: -1,
          message: '图片描述不能为空',
          data: null,
        },
        { status: 400 }
      );
    }

    // 构造 prompt 参数，添加随机风格和修饰词
    const style = getRandomElement(styles);
    const modifier = getRandomElement(modifiers);
    const seed = generateRandomSeed();
    const prompt = `生成一个${modifier}的${description}的微信红包封面，使用${style}，随机种子:${seed}`;
    console.log('构造的 prompt:', prompt);

    // 调用文生图 API
    console.log('开始调用智谱 AI...');
    const aiResult = await zhipuAIClient.generateImage(prompt, 957, 1278);
    console.log('智谱 AI 返回结果:', JSON.stringify(aiResult, null, 2));

    // 如果生成成功，上传到 COS
    if (aiResult?.data?.img_url) {
      try {
        // 生成唯一的文件名，包含时间戳和随机数
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const key = `wallpapers/${timestamp}-${randomStr}-${style.replace(/[^a-zA-Z0-9]/g, '')}.png`;
        console.log('准备上传到 COS, key:', key);
        console.log('图片 URL:', aiResult.data.img_url);
        
        // 上传到 COS 并获取永久访问链接
        const cosUrl = await uploadFromUrl(aiResult.data.img_url, key);
        console.log('上传成功，COS URL:', cosUrl);

        // 准备数据库记录
        const wallpaperData = {
          user_email: user_email || 'anonymous@aiwallpaper.com', // 使用默认邮箱
          img_description: description,
          img_size: '957x1278',
          img_url: cosUrl,
          llm_name: 'zhipuai',
          llm_params: JSON.stringify({
            prompt,
            style,
            modifier,
            seed
          })
        };

        console.log('准备插入数据库的数据:', JSON.stringify(wallpaperData, null, 2));

        // 插入数据库
        const supabase = getDb();
        const { data: savedWallpaper, error: dbError } = await supabase
          .from('wallpapers')
          .insert(wallpaperData)
          .select()
          .single();

        if (dbError) {
          throw dbError;
        }

        console.log('保存到数据库成功:', savedWallpaper);

        // 返回成功响应
        return Response.json({
          code: 0,
          message: '生成成功',
          data: {
            ...savedWallpaper,
            originalUrl: aiResult.data.img_url,
            prompt,
            style,
            modifier
          }
        });
      } catch (error: any) {
        console.error('操作失败，详细错误:', {
          message: error?.message,
          stack: error?.stack,
          code: error?.code,
          detail: error?.detail,
          where: error?.where,
          hint: error?.hint,
          position: error?.position
        });
        
        return Response.json(
          {
            code: -1,
            message: `操作失败: ${error?.message || '未知错误'}`,
            data: null,
          },
          { status: 500 }
        );
      }
    } else {
      console.error('智谱 AI 返回数据格式不正确:', aiResult);
      return Response.json(
        {
          code: -1,
          message: '图片生成失败: 返回数据格式不正确',
          data: null,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('API 调用失败，详细错误:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code
    });
    
    return Response.json(
      {
        code: -1,
        message: `文生图 API 调用失败: ${error?.message || '未知错误'}`,
        data: null,
      },
      { status: 500 }
    );
  }
}
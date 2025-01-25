import COS from 'cos-nodejs-sdk-v5';
import { createReadStream } from 'fs';
import { Readable } from 'stream';

// COS 配置
const config = {
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY,
    Bucket: process.env.COS_BUCKET,
    Region: process.env.COS_REGION,
};

// 打印配置信息（注意不要泄露完整的密钥）
console.log('COS 配置信息:', {
    SecretId: config.SecretId ? '已设置' : '未设置',
    SecretKey: config.SecretKey ? '已设置' : '未设置',
    Bucket: config.Bucket,
    Region: config.Region
});

// 检查配置
if (!config.SecretId || !config.SecretKey || !config.Bucket || !config.Region) {
    throw new Error('COS 配置不完整，请检查环境变量');
}

// 创建 COS 实例
const cos = new COS({
    SecretId: config.SecretId,
    SecretKey: config.SecretKey,
    FileParallelLimit: 3,
    ChunkParallelLimit: 3,
    ChunkSize: 1024 * 1024,
});

interface COSError extends Error {
    code?: string;
    region?: string;
    statusCode?: number;
    headers?: Record<string, any>;
}

/**
 * 从 URL 上传文件到 COS
 */
export async function uploadFromUrl(url: string, key: string): Promise<string> {
    console.log('=== 开始上传流程 ===');
    console.log('源文件 URL:', url);
    console.log('目标文件键:', key);

    try {
        // 1. 获取图片数据
        console.log('1. 正在获取图片数据...');
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`获取图片失败: HTTP ${response.status} ${response.statusText}`);
        }

        // 2. 获取内容类型
        const contentType = response.headers.get('content-type');
        console.log('2. 图片信息:', {
            contentType,
            size: response.headers.get('content-length'),
            type: response.type
        });

        // 3. 转换为可读流
        console.log('3. 正在转换为可读流...');
        const buffer = await response.arrayBuffer();
        const stream = Readable.from(Buffer.from(buffer));
        console.log('   数据大小:', buffer.byteLength, 'bytes');

        // 4. 上传到 COS
        console.log('4. 开始上传到 COS...');
        console.log('   上传参数:', {
            Bucket: config.Bucket,
            Region: config.Region,
            Key: key,
            ContentType: contentType || 'image/png'
        });

        const result = await new Promise<COS.PutObjectResult>((resolve, reject) => {
            cos.putObject({
                Bucket: config.Bucket!,
                Region: config.Region!,
                Key: key,
                Body: stream,
                ContentType: contentType || 'image/png',
                onProgress: (progressData) => {
                    console.log('   上传进度:', {
                        loaded: progressData.loaded,
                        total: progressData.total,
                        speed: progressData.speed,
                        percent: progressData.percent
                    });
                }
            }, (err, data) => {
                if (err) {
                    const errorObj = err as Record<string, any>;
                    console.error('   COS 上传错误:', {
                        message: errorObj?.message || '未知错误',
                        code: errorObj?.code,
                        region: errorObj?.region,
                        statusCode: errorObj?.statusCode,
                        headers: errorObj?.headers
                    });
                    reject(err);
                } else {
                    console.log('   上传成功:', data);
                    resolve(data);
                }
            });
        });

        // 5. 生成访问 URL
        const finalUrl = `https://${config.Bucket}.cos.${config.Region}.myqcloud.com/${key}`;
        console.log('5. 上传完成');
        console.log('   访问 URL:', finalUrl);
        return finalUrl;

    } catch (error) {
        console.error('=== 上传失败 ===');
        if (error instanceof Error) {
            console.error('错误类型:', error.constructor.name);
            console.error('错误消息:', error.message);
            console.error('错误堆栈:', error.stack);
            
            const response = (error as any).response;
            if (response) {
                console.error('响应状态:', response.status);
                console.error('响应头:', response.headers);
                try {
                    const body = await response.text();
                    console.error('响应体:', body);
                } catch (e) {
                    console.error('无法读取响应体');
                }
            }
        } else {
            console.error('未知错误:', error);
        }
        throw error;
    }
}

/**
 * 从本地文件上传到 COS
 */
export async function uploadFromFile(filePath: string, key: string): Promise<string> {
    try {
        const result = await new Promise<COS.PutObjectResult>((resolve, reject) => {
            cos.putObject({
                Bucket: config.Bucket!,
                Region: config.Region!,
                Key: key,
                Body: createReadStream(filePath),
                onProgress: (progressData) => {
                    console.log('上传进度:', progressData);
                }
            }, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });

        return `https://${config.Bucket}.cos.${config.Region}.myqcloud.com/${key}`;
    } catch (error) {
        console.error('上传失败:', error);
        throw error;
    }
}

/**
 * 删除 COS 中的文件
 */
export async function deleteFile(key: string): Promise<void> {
    try {
        await new Promise<void>((resolve, reject) => {
            cos.deleteObject({
                Bucket: config.Bucket!,
                Region: config.Region!,
                Key: key,
            }, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    } catch (error) {
        console.error('删除失败:', error);
        throw error;
    }
}

/**
 * 生成文件临时访问链接
 */
export async function getTemporaryUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
        const result = await new Promise<string>((resolve, reject) => {
            cos.getObjectUrl({
                Bucket: config.Bucket!,
                Region: config.Region!,
                Key: key,
                Expires: expiresIn,
                Sign: true,
            }, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data.Url);
                }
            });
        });

        return result;
    } catch (error) {
        console.error('获取临时URL失败:', error);
        throw error;
    }
}
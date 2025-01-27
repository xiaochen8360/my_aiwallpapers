// 微信配置
export const wechatConfig = {
  // 微信应用ID
  WX_APP_ID: process.env.NEXT_PUBLIC_WX_APP_ID || 'wx6dacf17d05554143',
  // 云托管环境ID
  WX_CLOUD_ENV_ID: process.env.NEXT_PUBLIC_WX_CLOUD_ENV_ID || 'prod-9g64r0936b326f1a',
  // 微信云托管服务域名
  WX_CLOUD_BASE_URL: process.env.NEXT_PUBLIC_WX_CLOUD_BASE_URL || 'https://express-uz4b-137154-10-1339197524.sh.run.tcloudbase.com',
  // 是否是开发环境
  IS_DEV: process.env.NODE_ENV === 'development',
};

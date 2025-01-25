import { getWallpapers } from "@/model/wallpaper";

export async function GET(req: Request) {
  try {
    // 从 URL 获取查询参数
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('user_email');

    // 从数据库获取壁纸列表
    const wallpapers = await getWallpapers(userEmail || undefined);

    return Response.json({
      code: 0,
      message: "success",
      data: wallpapers
    });
  } catch (error: any) {
    console.error('获取壁纸列表失败:', error);
    return Response.json({
      code: -1,
      message: `获取壁纸列表失败: ${error.message}`,
      data: null
    }, { status: 500 });
  }
}
"use client";

import { useEffect, useState } from "react";
import { Wallpaper } from "@/types/wallpaper";

export default function Wallpapers() {
  const [data, setData] = useState<Wallpaper[]>([]);
  const [loading, setLoading] = useState(true);

  // 定义获取数据的函数
  const fetchData = async () => {
    try {
      const result = await fetch('/api/get_wallpaper');
      if (!result.ok) {
        throw new Error('API 请求失败');
      }
      const response = await result.json();
      if (response.code === 0 && Array.isArray(response.data)) {
        // 按创建时间倒序排序，确保最新的在最前面
        const sortedData = [...response.data].sort((a: Wallpaper, b: Wallpaper) => {
          // 如果没有创建时间，使用当前时间
          const timeA = a.created_at ? new Date(a.created_at).getTime() : Date.now();
          const timeB = b.created_at ? new Date(b.created_at).getTime() : Date.now();
          return timeB - timeA;
        });
        setData(sortedData);
      } else {
        console.error('API 返回格式错误:', response);
        setData([]);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和定时刷新
  useEffect(() => {
    fetchData();

    // 每 5 秒刷新一次数据
    const intervalId = setInterval(fetchData, 5000);

    // 清理定时器
    return () => clearInterval(intervalId);
  }, []);

  // 监听生成壁纸的自定义事件
  useEffect(() => {
    const handleWallpaperGenerated = () => {
      console.log('检测到新壁纸生成，刷新列表');
      fetchData();
    };

    // 添加事件监听
    window.addEventListener('wallpaperGenerated', handleWallpaperGenerated);

    // 清理事件监听
    return () => {
      window.removeEventListener('wallpaperGenerated', handleWallpaperGenerated);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <section className="w-full bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center">
          <h2 className="text-center text-3xl font-bold md:text-4xl mb-2">AI 生成的壁纸</h2>
          <p className="mb-8 text-center text-sm text-gray-500 sm:text-base">
            使用人工智能生成的精美壁纸
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
            {data && data.length > 0 ? (
              data.map((wallpaper: Wallpaper, idx: number) => (
                <div key={wallpaper.id || idx} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={wallpaper.img_url}
                      alt={wallpaper.img_description || '壁纸图片'}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-gray-800 font-medium line-clamp-2">
                      {wallpaper.img_description || '未命名壁纸'}
                    </p>
                    {wallpaper.created_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(wallpaper.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">暂无壁纸数据</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
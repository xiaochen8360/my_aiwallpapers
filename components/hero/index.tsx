export default function Header() {
  return (
    <header>
      <div className="mx-auto w-full max-w-7xl px-5 py-16 md:px-10 md:py-20">
        <div className="flex flex-col gap-8 sm:gap-16 lg:flex-row">
          <div className="overflow-hidden rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl">
            <img 
              src="https://aigc-files.bigmodel.cn/api/cogview/20250122114306f97386d3bf314337_0.png" 
              alt="AI生成的微信红包封面" 
              className="inline-block h-full w-full max-w-2xl lg:max-w-xl transform transition-transform duration-500 hover:scale-105" 
            />
          </div>
          <div className="flex flex-col items-start">
            <p className="mb-2 text-sm font-semibold uppercase text-blue-600"> AI 红包封面生成器 </p>
            <h1 className="mb-4 text-4xl font-bold md:text-6xl"> 让生成你的微信红包封面变得简单 </h1>
            <p className="mb-6 max-w-lg text-sm text-gray-500 sm:text-xl md:mb-10 lg:mb-12"> 
              使用先进的 AI 技术，轻松生成独特、精美的微信红包封面，让您的红包更有创意和个性。
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
import { useState } from "react";
import { Image, Moon } from "lucide-react";

const navItems = [
  { key: "task", label: "任务", iconSrc: "/icon_task.svg" },
  { key: "team", label: "协作", iconSrc: "/icon_team.svg" },
  { key: "inspiration", label: "灵感", active: true, iconSrc: "/icon_inspiration.svg" },
];

const sidebarAvatarSrc =
  "https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=realistic%20professional%20headshot%20of%20a%20young%20Asian%20product%20designer%2C%20neutral%20expression%2C%20soft%20studio%20lighting%2C%20light%20gray%20background%2C%20subtle%20natural%20colors%2C%20minimal%20clean%20portrait%2C%20cropped%20face%2C%20high%20detail&image_size=square";

export function Sidebar() {
  const [active, setActive] = useState("inspiration");

  return (
    <aside className="flex flex-col items-center w-[56px] h-full bg-[#f5f5f5] border-r border-gray-200 py-3 shrink-0">
      {/* 顶部 Logo（40x40） */}
      <div className="mb-4">
        <img src="/icon_40.svg" width="40" height="40" className="block" alt="logo" />
      </div>

      {/* 导航项 —— 44x44，圆角 6px，激活态背景 rgba(136,136,136,0.10)，垂直居中 */}
      <nav className="flex flex-col items-center justify-center gap-1.5 flex-1">
        {navItems.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className={
                "flex flex-col items-center justify-center w-11 h-11 gap-0.5 rounded-[6px] transition-colors " +
                (isActive
                  ? "bg-[rgba(136,136,136,0.10)] text-gray-900"
                  : "text-gray-400 hover:bg-[rgba(136,136,136,0.08)] hover:text-gray-700")
              }
              title={item.label}
            >
              <img src={item.iconSrc} width="16" height="16" alt={item.label} />
              <span className="text-[10px] leading-none font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 底部 —— 图片/月亮/头像 */}
      <div className="flex flex-col items-center gap-2 pt-2">
        {/* 图片按钮 */}
        <button className="w-9 h-9 rounded-[6px] text-gray-400 hover:bg-[rgba(136,136,136,0.10)] hover:text-gray-700 flex items-center justify-center transition-colors">
          <Image size={16} strokeWidth={1.6} />
        </button>

        {/* 月亮按钮 */}
        <button className="w-9 h-9 rounded-[6px] text-gray-400 hover:bg-[rgba(136,136,136,0.10)] hover:text-gray-700 flex items-center justify-center transition-colors">
          <Moon size={16} strokeWidth={1.6} />
        </button>

        {/* 头像 (32x32 真人头像) */}
        <button className="mt-1 flex h-8 w-8 overflow-hidden rounded-full ring-1 ring-black/6">
          <img
            src={sidebarAvatarSrc}
            width="32"
            height="32"
            alt="用户头像"
            className="h-8 w-8 object-cover"
          />
        </button>
      </div>
    </aside>
  );
}

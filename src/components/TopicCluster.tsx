import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";

// 4 套半透明底色（来自 card-style-params.md §3）
const PALETTES: Record<string, { bg: string; label: string }> = {
  blue: { bg: "rgba(204, 235, 255, 0.7)", label: "blue" },
  green: { bg: "rgba(213, 255, 243, 0.7)", label: "green" },
  yellow: { bg: "rgba(255, 230, 156, 0.7)", label: "yellow" },
  orange: { bg: "rgba(255, 232, 223, 0.7)", label: "orange" },
};

// 8 张卡片排布参数（来自 card-style-params.md §5）
interface CardLayout {
  id: string;
  title: string;
  subtitle: string;
  owner: "mine" | "suggested";
  palette: string;
  rotate: number;
  offsetX: number;
  offsetY: number;
  z: number;
  count: number;
  time: string;
  evolution?: {
    nextCount: number;
    nextSubtitle: string;
    updatedAt: string;
    label: string;
  };
}

// 统一的花瓣式坐标排布（8 张一组，两屏复用，保证视觉均衡）
const LAYOUT: { rotate: number; offsetX: number; offsetY: number; z: number }[] = [
  { rotate: 6, offsetX: -295, offsetY: -44, z: 1 },
  { rotate: -29, offsetX: -231, offsetY: 71, z: 2 },
  { rotate: -49, offsetX: -109, offsetY: -47, z: 3 },
  { rotate: 0, offsetX: 13, offsetY: -84, z: 4 },
  { rotate: 37, offsetX: 297, offsetY: 0, z: 5 },
  { rotate: -17, offsetX: 179, offsetY: -57, z: 6 },
  { rotate: 17, offsetX: 187, offsetY: 79, z: 7 },
  { rotate: -18, offsetX: -39, offsetY: 82, z: 8 },
];

const RAW_DATA: CardLayout[] = [
  // 第 1 屏
  { id: "t-1", title: "视觉叙事系统", subtitle: "梳理品牌主视觉、故事板与动态海报规范，统一对外传播叙事。", owner: "mine", palette: "blue", ...LAYOUT[0], count: 18, time: "12:00" },
  {
    id: "t-2",
    title: "增长活动素材中台",
    subtitle: "沉淀活动 banner、短视频脚本和投放话术，支持多渠道快速复用。",
    owner: "mine",
    palette: "green",
    ...LAYOUT[1],
    count: 24,
    time: "09:45",
    evolution: {
      nextCount: 31,
      nextSubtitle: "新增投放复盘、爆款视频拆解与转化素材，摘要会随检索结果自动刷新。",
      updatedAt: "刚刚更新",
      label: "AI Summary",
    },
  },
  { id: "t-3", title: "企业知识问答工作台", subtitle: "整合制度文档、FAQ 与工单案例，提升员工自助问答命中率。", owner: "suggested", palette: "yellow", ...LAYOUT[2], count: 31, time: "11:20" },
  { id: "t-4", title: "客服陪练语料库", subtitle: "汇总高频咨询、优秀话术与质检点评，训练一线客服的响应稳定性。", owner: "suggested", palette: "orange", ...LAYOUT[3], count: 27, time: "13:10" },
  { id: "t-5", title: "新品发布会内容包", subtitle: "收集发布会讲稿、媒体通稿和亮点拆解，便于会后传播二次加工。", owner: "mine", palette: "blue", ...LAYOUT[4], count: 15, time: "15:05" },
  { id: "t-6", title: "设计评审案例集", subtitle: "整理高频评审意见、修改前后稿和设计原则，减少重复沟通成本。", owner: "mine", palette: "green", ...LAYOUT[5], count: 19, time: "10:15" },
  { id: "t-7", title: "销售提案资料库", subtitle: "归档行业方案、客户案例与 ROI 证明材料，支撑不同阶段的商机推进。", owner: "suggested", palette: "orange", ...LAYOUT[6], count: 22, time: "16:25" },
  { id: "t-8", title: "品牌语气词手册", subtitle: "总结品牌文案语气、禁用表达和示例句式，统一各端内容调性。", owner: "mine", palette: "blue", ...LAYOUT[7], count: 12, time: "14:30" },
  // 第 2 屏 — 同样的 8 张排布，视觉均衡
  { id: "t-9", title: "知识图谱构建", subtitle: "从合同、报告到流程文档抽取实体关系，形成可维护的业务知识网络。", owner: "suggested", palette: "blue", ...LAYOUT[0], count: 22, time: "10:30" },
  { id: "t-10", title: "海外市场本地化包", subtitle: "汇集多语种文案、文化禁忌与落地页素材，减少海外投放返工。", owner: "suggested", palette: "orange", ...LAYOUT[1], count: 14, time: "08:55" },
  { id: "t-11", title: "设计系统 3.0", subtitle: "统一 token、组件行为与文档示例，保证多端体验一致。", owner: "mine", palette: "yellow", ...LAYOUT[2], count: 16, time: "14:05" },
  { id: "t-12", title: "高层汇报素材池", subtitle: "沉淀季度亮点、经营数据图表与里程碑事件，方便快速组装汇报。", owner: "mine", palette: "green", ...LAYOUT[3], count: 11, time: "17:20" },
  { id: "t-13", title: "行业研究速览", subtitle: "聚合竞品动态、趋势文章和专家观点，支撑方案方向判断。", owner: "suggested", palette: "orange", ...LAYOUT[4], count: 29, time: "09:20" },
  { id: "t-14", title: "多智能体协作", subtitle: "记录任务拆解、工具链路和评测样本，优化 Agent 编排质量。", owner: "suggested", palette: "green", ...LAYOUT[5], count: 20, time: "16:40" },
  { id: "t-15", title: "招聘品牌内容库", subtitle: "整理雇主品牌故事、员工采访和招聘海报素材，支持校招与社招传播。", owner: "suggested", palette: "orange", ...LAYOUT[6], count: 17, time: "11:55" },
  { id: "t-16", title: "产品教育案例库", subtitle: "沉淀 onboarding 示例、功能教学和常见误用案例，提升产品学习效率。", owner: "suggested", palette: "blue", ...LAYOUT[7], count: 26, time: "13:35" },
];

interface Props {
  onAddMaterial?: (topic: string) => void;
  onSelect?: (topic: string) => void;
  selectedTopic?: string | null;
}

const PAGE_SIZE = 8;
const EVOLVING_CARD_ID = "t-2";

export function TopicCluster({ onAddMaterial, onSelect, selectedTopic }: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [evolvedCardIds, setEvolvedCardIds] = useState<string[]>([]);

  const totalPages = Math.max(1, Math.ceil(RAW_DATA.length / PAGE_SIZE));
  const cards = useMemo(
    () => RAW_DATA.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [page]
  );

  const pageContainsEvolvingCard = cards.some((card) => card.id === EVOLVING_CARD_ID);

  useEffect(() => {
    if (!pageContainsEvolvingCard || evolvedCardIds.includes(EVOLVING_CARD_ID)) return;
    const timer = window.setTimeout(() => {
      setEvolvedCardIds((prev) => (prev.includes(EVOLVING_CARD_ID) ? prev : [...prev, EVOLVING_CARD_ID]));
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [pageContainsEvolvingCard, evolvedCardIds]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPage((p) => (p - 1 + totalPages) % totalPages);
  };
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPage((p) => (p + 1) % totalPages);
  };

  const handleCardClick = (e: React.MouseEvent, title: string) => {
    e.stopPropagation();
    onSelect?.(title);
  };

  const handleAddMaterial = (e: React.MouseEvent, title: string) => {
    e.stopPropagation();
    e.preventDefault();
    onAddMaterial?.(title);
  };

  return (
    <div className="flex flex-col items-center w-full select-none">
      <style>{`
        @keyframes topic-card-edge-flow {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -120; }
        }
      `}</style>
      {/* 卡片堆叠容器：扩大高度让整组在 flex 布局中上下居中 */}
      <div
        className="relative w-full flex items-center justify-center flex-1"
        style={{ maxWidth: "900px", minHeight: "420px" }}
      >
        {/* 左翻页箭头 */}
        <button
          onClick={handlePrev}
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "1px solid #E4E4E4",
            background: "#FFFFFF",
            color: "#1A1A1A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 12,
          }}
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
        {/* 右翻页箭头 */}
        <button
          onClick={handleNext}
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "1px solid #E4E4E4",
            background: "#FFFFFF",
            color: "#1A1A1A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 12,
          }}
        >
          <ChevronRight size={18} strokeWidth={2} />
        </button>

        <div
          className="relative origin-center"
          style={{ width: "750px", height: "315px", transform: "scale(0.85)" }}
        >
          {cards.map((card) => {
            const isHover = hoverId === card.id;
            const isSelected = selectedTopic === card.title;
            const isMine = card.owner === "mine";
            const isEvolved = evolvedCardIds.includes(card.id) && !!card.evolution;
            const paletteKey = card.palette as keyof typeof PALETTES;
            const bg = PALETTES[paletteKey].bg;
            const displaySubtitle =
              isEvolved && card.evolution ? card.evolution.nextSubtitle : card.subtitle;
            const displayCount =
              isEvolved && card.evolution ? card.evolution.nextCount : card.count;
            const displayTime =
              isEvolved && card.evolution ? card.evolution.updatedAt : card.time;
            const edgeGradientId = `edge-gradient-${card.id}`;

            return (
              <div
                key={card.id}
                onMouseEnter={() => setHoverId(card.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={(e) => handleCardClick(e, card.title)}
                className="absolute cursor-pointer overflow-hidden"
                style={{
                  // 尺寸：200 × 280
                  width: "200px",
                  height: "280px",
                  // 定位：以中心点为参考
                  left: "50%",
                  top: "50%",
                  // 圆角：12px
                  borderRadius: "12px",
                  // 边框统一，避免“我创建的”卡片单独发灰
                  border: "1px solid #FFFFFF",
                  // 背景：半透明色
                  background: bg,
                  // 背景模糊
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)",
                  // flex column，上下两端对齐
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  // transform 公式：translate(-50%, -50%) + translate(offset) + rotate
                  // hover 时：offsetY - 14, rotate * 0.6, scale 1.03
                  transform: isHover
                    ? `translate(-50%, -50%) translate(${card.offsetX}px, ${card.offsetY - 14}px) rotate(${card.rotate * 0.6}deg) scale(1.03)`
                    : `translate(-50%, -50%) translate(${card.offsetX}px, ${card.offsetY}px) rotate(${card.rotate}deg)`,
                  // 过渡：300ms ease-out
                  transition: "all 300ms ease-out",
                  // 阴影
                  boxShadow: isHover
                    ? "0 18px 40px -10px rgba(20, 30, 60, 0.24), 0 4px 12px -2px rgba(20, 30, 60, 0.12)"
                    : isEvolved
                      ? "0 10px 26px -10px rgba(20, 30, 60, 0.16), 0 2px 8px -4px rgba(20, 30, 60, 0.08)"
                      : "0 8px 24px -8px rgba(20, 30, 60, 0.16), 0 2px 6px -2px rgba(20, 30, 60, 0.08)",
                  zIndex: isHover ? 100 : card.z,
                  willChange: "transform",
                }}
              >
                {isEvolved && (
                  <svg
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      overflow: "hidden",
                    }}
                    viewBox="0 0 200 280"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id={edgeGradientId} x1="0.5" y1="0.5" x2="199.5" y2="279.5" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FFFFFF" stopOpacity="0" />
                        <stop offset="0.28" stopColor="#FFFFFF" stopOpacity="0" />
                        <stop offset="0.5" stopColor="#F7FEFF" stopOpacity="0.96" />
                        <stop offset="0.68" stopColor="#CFEFFF" stopOpacity="0.92" />
                        <stop offset="0.84" stopColor="#E6FFF6" stopOpacity="0.74" />
                        <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <rect
                      x="0.5"
                      y="0.5"
                      width="199"
                      height="279"
                      rx="11.5"
                      stroke="rgba(255,255,255,0.56)"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                      shapeRendering="geometricPrecision"
                    />
                    <rect
                      x="0.5"
                      y="0.5"
                      width="199"
                      height="279"
                      rx="11.5"
                      stroke={`url(#${edgeGradientId})`}
                      strokeOpacity="0.42"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength="120"
                      strokeDasharray="18 102"
                      vectorEffect="non-scaling-stroke"
                      shapeRendering="geometricPrecision"
                      style={{
                        animation: "topic-card-edge-flow 7.4s linear infinite",
                      }}
                    />
                    <rect
                      x="0.5"
                      y="0.5"
                      width="199"
                      height="279"
                      rx="11.5"
                      stroke={`url(#${edgeGradientId})`}
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength="120"
                      strokeDasharray="6 114"
                      vectorEffect="non-scaling-stroke"
                      shapeRendering="geometricPrecision"
                      style={{
                        animation: "topic-card-edge-flow 7.4s linear infinite",
                        opacity: 0.84,
                      }}
                    />
                  </svg>
                )}

                {/* 顶部标题区：padding 11px 15px */}
                <div style={{ padding: "11px 15px" }}>
                  {isMine && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        height: "22px",
                        padding: "0 8px",
                        borderRadius: "999px",
                        background: "rgba(255,255,255,0.66)",
                        backdropFilter: "blur(6px)",
                        WebkitBackdropFilter: "blur(6px)",
                        fontSize: "11px",
                        lineHeight: "16px",
                        color: "#1A1A1A",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#1A1A1A",
                          opacity: 0.7,
                        }}
                      />
                      我创建的
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      lineHeight: "22px",
                      color: "#1A1A1A",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {card.title}
                  </div>
                  <div
                    style={{
                      width: "168px",
                      fontSize: "12px",
                      lineHeight: "18px",
                      color: "#666666",
                      marginTop: "6px",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {isEvolved ? card.subtitle : displaySubtitle}
                  </div>
                </div>

                {/* 底部信息 */}
                <div
                  style={{
                    padding: "11px 15px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        lineHeight: "20px",
                        color: "#666666",
                      }}
                    >
                      {displayCount}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        lineHeight: "14px",
                        color: "#666666",
                      }}
                    >
                      个来源
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      lineHeight: "18px",
                      color: "#666666",
                      fontFamily: "monospace",
                    }}
                  >
                    {displayTime}
                  </span>
                </div>

                {isEvolved && card.evolution && (
                  <div
                    style={{
                      position: "absolute",
                      left: "12px",
                      right: "12px",
                      bottom: "50px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.72)",
                      border: "1px solid rgba(255,255,255,0.6)",
                      padding: "9px 11px",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "11px",
                        lineHeight: "16px",
                        color: "#1A1A1A",
                        marginBottom: "4px",
                      }}
                    >
                      <img src="/icon_summary.svg" width="12" height="12" alt="AI Summary" />
                      AI Summary
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        lineHeight: "18px",
                        color: "#1A1A1A",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {card.evolution.nextSubtitle}
                    </div>
                  </div>
                )}

                {/* hover 时出现的 chat 图标 —— 跟随卡片角度，无底色，默认灰 hover 深 */}
                <button
                  onClick={(e) => handleAddMaterial(e, card.title)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    bottom: "12px",
                    width: "22px",
                    height: "22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isHover ? "#1A1A1A" : "#8A8A8A",
                    opacity: isHover ? 1 : 0,
                    pointerEvents: isHover ? "auto" : "none",
                    transform: isHover ? "translateY(0)" : "translateY(2px)",
                    transition: "all 300ms ease-out",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                  title={`给「${card.title}」补素材`}
                >
                  <MessageCircle size={18} strokeWidth={1.8} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 分页指示器 —— 轮播小圆点 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "24px",
        }}
      >
        {Array.from({ length: totalPages }).map((_, idx) => (
          <span
            key={idx}
            style={{
              width: idx === page ? "20px" : "6px",
              height: "6px",
              borderRadius: "3px",
              background: idx === page ? "#1A1A1A" : "rgba(26,26,26,0.18)",
              transition: "all 300ms ease-out",
              cursor: "pointer",
            }}
            onClick={() => setPage(idx)}
          />
        ))}
      </div>

      {/* see all —— 与卡片拉开距离 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "40px",
          fontSize: "13px",
          color: "#666666",
          cursor: "pointer",
          transition: "color 300ms ease-out",
        }}
        className="hover:text-gray-900"
      >
        <span>see all</span>
        <ChevronRight size={14} strokeWidth={2} />
      </div>
    </div>
  );
}

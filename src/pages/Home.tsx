import { useEffect, useRef, useState } from "react";
import { Search, Plus, Check, X } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopicCluster } from "../components/TopicCluster";
import { ChatInput } from "../components/ChatInput";
import selectedTriggerImage from "../../icon/✅选中 (1).webp";

// 子阶段描述：一个完整的补素材流程会按顺序经过这些步骤
const PHASES: { label: string; duration: number }[] = [
  { label: "解析主题关键词并匹配知识域", duration: 700 },
  { label: "检索内部知识库与规范文档", duration: 900 },
  { label: "拉取相关协作会话记录", duration: 1000 },
  { label: "去重、打标签、整理摘要", duration: 700 },
];

interface SearchTask {
  id: number;
  topic: string;
  originalText: string;
  status: "running" | "done" | "error";
  timestamp: number;
  phase: number; // 0..PHASES.length
  result?: string;
  materials?: FoundMaterial[];
}

interface UploadedAsset {
  id: string;
  name: string;
  sizeLabel: string;
  kindLabel: string;
}

interface FoundMaterial {
  id: string;
  title: string;
  source: string;
  meta: string;
}

type StreamItem =
  | {
      id: number;
      type: "assistant" | "user";
      text: string;
      timestamp: number;
    }
  | {
      id: number;
      type: "upload";
      files: UploadedAsset[];
      timestamp: number;
    }
  | {
      id: number;
      type: "task";
      taskId: number;
      timestamp: number;
    };

function buildMaterials(topic: string): FoundMaterial[] {
  return [
    {
      id: `${topic}-spec`,
      title: `${topic}需求梳理与范围定义`,
      source: "团队文档",
      meta: "产品 PRD · 2.1 MB",
    },
    {
      id: `${topic}-meeting`,
      title: `${topic}项目例会纪要`,
      source: "协作记录",
      meta: "会议纪要 · 860 KB",
    },
    {
      id: `${topic}-design`,
      title: `${topic}视觉与交互参考`,
      source: "设计规范",
      meta: "Figma 说明 · 1.4 MB",
    },
  ];
}

function buildResult(topic: string, materials: FoundMaterial[]): string {
  return `找到 ${materials.length} 条与「${topic}」相关的素材`;
}

function createTaskForTopic(
  topic: string,
  setTasks: React.Dispatch<React.SetStateAction<SearchTask[]>>,
  opts?: { text?: string }
): number {
  const taskId = Date.now() + Math.floor(Math.random() * 1000);
  const newTask: SearchTask = {
    id: taskId,
    topic,
    originalText: opts?.text || `给「${topic}」补充素材`,
    status: "running",
    timestamp: Date.now(),
    phase: 0,
  };
  setTasks((prev) => [newTask, ...prev]);

  // 按阶段逐步推进，再合并完成
  const tick = (idx: number) => {
    if (idx >= PHASES.length) {
      const materials = buildMaterials(topic);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: "done" as const,
                phase: idx,
                result: buildResult(topic, materials),
                materials,
              }
            : t
        )
      );
      return;
    }
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, phase: idx } : t))
    );
    window.setTimeout(() => tick(idx + 1), PHASES[idx].duration);
  };
  // 先显示第一阶段（无需延迟），之后按各阶段推进
  window.setTimeout(() => tick(1), 400);
  return taskId;
}

export function Home() {
  const now = Date.now();
  const panelRef = useRef<HTMLDivElement>(null);
  const streamViewportRef = useRef<HTMLDivElement>(null);
  const [tasks, setTasks] = useState<SearchTask[]>([
    {
      id: 1,
      topic: "Multi-Agent 编排",
      originalText: "给「Multi-Agent 编排」补充素材",
      status: "done",
      timestamp: now - 18 * 1000,
      phase: PHASES.length,
      result: "找到 3 条与「Multi-Agent 编排」相关的素材",
      materials: buildMaterials("Multi-Agent 编排"),
    },
    {
      id: 2,
      topic: "设计系统 3.0",
      originalText: "给「设计系统 3.0」补充素材",
      status: "done",
      timestamp: now - 23 * 1000,
      phase: PHASES.length,
      result: "找到 3 条与「设计系统 3.0」相关的素材",
      materials: buildMaterials("设计系统 3.0"),
    },
  ]);
  const [importedTaskIds, setImportedTaskIds] = useState<number[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [streamItems, setStreamItems] = useState<StreamItem[]>([
    {
      id: now - 1000,
      type: "assistant",
      text: "直接描述主题，或上传素材，我会持续反馈进度。",
      timestamp: now - 1000,
    },
  ]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  useEffect(() => {
    if (!panelOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setPanelOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanelOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [panelOpen]);

  useEffect(() => {
    if (!panelOpen) return;
    window.setTimeout(() => {
      if (!streamViewportRef.current) return;
      streamViewportRef.current.scrollTo({
        top: streamViewportRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 0);
  }, [panelOpen, streamItems, tasks]);

  // 输入框输入文本后提交
  const handleSubmit = (text: string) => {
    const submitTime = Date.now();
    const topic = extractTopic(text);
    const taskId = createTaskForTopic(topic, setTasks, { text });

    setStreamItems((prev) => [
      ...prev,
      {
        id: submitTime,
        type: "user",
        text,
        timestamp: submitTime,
      },
      {
        id: taskId + 1,
        type: "task",
        taskId,
        timestamp: submitTime + 1,
      },
    ]);

    setSelectedTopic(null);
    setPanelOpen(true);
  };

  // 点击卡片的 chat 图标 —— 把主题引用到输入框的 pill，不自动发送
  const handleAddMaterial = (topic: string) => {
    setSelectedTopic(topic);
    setPanelOpen(true);
    setStreamItems((prev) => {
      const last = prev[prev.length - 1];
      if (
        last &&
        last.type === "assistant" &&
        last.text === `已切换到「${topic}」，现在可以继续上传素材或补充要求。`
      ) {
        return prev;
      }
      return [
        ...prev,
        {
          id: Date.now() + Math.floor(Math.random() * 1000),
          type: "assistant",
          text: `已切换到「${topic}」，现在可以继续上传素材或补充要求。`,
          timestamp: Date.now(),
        },
      ];
    });
  };

  // 点击卡片主体 —— 切换主题选中状态
  const handleSelectTopic = (topic: string) => {
    setSelectedTopic((prev) => (prev === topic ? null : prev));
  };

  const handleClearTopic = () => setSelectedTopic(null);
  const handleImportMaterials = (task: SearchTask) => {
    if (importedTaskIds.includes(task.id)) return;

    setImportedTaskIds((prev) => [...prev, task.id]);
    setStreamItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "assistant",
        text: `已将 ${task.materials?.length || 0} 条素材导入「${task.topic}」素材区。`,
        timestamp: Date.now(),
      },
    ]);
  };

  const handleUploadFiles = (files: File[]) => {
    const uploadTime = Date.now();
    const uploadedAssets = files.map((file, index) => ({
      id: `${uploadTime}-${index}-${file.name}`,
      name: file.name,
      sizeLabel: formatFileSize(file.size),
      kindLabel: inferFileKindLabel(file),
    }));

    setPanelOpen(true);
    setStreamItems((prev) => [
      ...prev,
      {
        id: uploadTime,
        type: "upload",
        files: uploadedAssets,
        timestamp: uploadTime,
      },
      {
        id: uploadTime + 1,
        type: "assistant",
        text: selectedTopic
          ? `已收到 ${files.length} 份素材，将结合「${selectedTopic}」继续整理。`
          : `已收到 ${files.length} 份素材，你可以继续补充主题或直接发送整理要求。`,
        timestamp: uploadTime + 1,
      },
    ]);
  };

  const latestUserItem = (() => {
    for (let i = streamItems.length - 1; i >= 0; i -= 1) {
      const item = streamItems[i];
      if (item.type === "user") return item;
    }
    return undefined;
  })();
  const isOnboardingState = !streamItems.some(
    (item) => item.type === "user" || item.type === "upload" || item.type === "task"
  );
  const introText = streamItems[0]?.type === "assistant"
    ? streamItems[0].text
    : "第一次见面，我先带你快速上手。";
  const conversationItems = streamItems.filter((item, index) => {
    if (index === 0 && item.type === "assistant") return false;
    if (latestUserItem && item.type === "user" && item.id === latestUserItem.id) return false;
    return true;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-gray-900">
      <Sidebar />

      <main
        className="flex-1 flex flex-col min-w-0 bg-white relative isolate"
        style={{ scrollbarGutter: "stable" }}
      >
        {/* 顶栏 */}
        <header className="relative z-[300] flex items-center justify-between h-14 px-5 shrink-0 bg-white">
          <h1 className="text-[14px] font-medium text-[#1a1a1a]">灵感主题</h1>
          <div ref={panelRef} className="relative flex items-center gap-2">
            <button
              onClick={() => setPanelOpen((prev) => !prev)}
              className="flex h-7 items-center justify-center transition-transform hover:scale-[1.03]"
              title="素材搜寻"
              style={{ width: "auto" }}
            >
              <img
                src={selectedTriggerImage}
                alt="素材搜寻"
                className="h-7 w-auto object-contain"
              />
            </button>
            <button className="flex items-center gap-1.5 h-7 px-3 rounded-[6px] bg-[rgba(136,136,136,0.10)] text-[13px] font-medium text-[#1a1a1a] hover:bg-[rgba(136,136,136,0.15)] transition-colors">
              <img src="/icon_summary.svg" width="14" height="14" alt="查看素材库" />
              <span>查看素材库</span>
            </button>
            <button className="w-7 h-7 rounded-[6px] bg-[rgba(136,136,136,0.10)] flex items-center justify-center hover:bg-[rgba(136,136,136,0.15)] transition-colors text-gray-700">
              <Search size={14} strokeWidth={1.8} />
            </button>

            {panelOpen && (
              <div
                className="absolute right-0 top-[calc(100%+10px)] z-[320] flex h-[426px] w-[418px] flex-col overflow-hidden rounded-[12px] border border-[#E9EAED] bg-white px-[9px] pt-[9px] pb-[17px] shadow-[0_2px_2px_0_rgba(134,138,152,0.12),0_2px_12px_0_rgba(134,138,152,0.12)]"
              >
                <div
                  ref={streamViewportRef}
                  className="flex flex-1 flex-col overflow-y-auto px-5"
                >
                  {latestUserItem && (
                    <div className="flex shrink-0 items-center justify-end gap-2 pb-6">
                      <div className="inline-flex max-w-[246px] items-center rounded-[8px] bg-[rgba(147,219,255,0.16)] px-3 py-2.5">
                        <p className="truncate text-[14px] leading-[22px] text-[#1A1A1A]">
                          {latestUserItem.text}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="inline-flex h-5 shrink-0 items-center gap-[6px]">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#EF7B53] text-[10px] text-white">
                      ✳
                    </span>
                    <span className="text-[14px] font-medium leading-[22px] text-[#0C0C0C]">
                      Flux.Claude Code
                    </span>
                  </div>

                  <p className="mt-3 shrink-0 text-[14px] leading-[22px] text-[#1A1A1A]">
                    {introText}
                  </p>

                  <div className="mt-3 flex flex-col gap-3 pb-2">
                  {isOnboardingState && (
                    <div className="rounded-[8px] bg-[#F6F7F8] px-3 py-3">
                      <div className="text-[13px] font-medium leading-[20px] text-[#1A1A1A]">
                        你可以这样开始
                      </div>
                      <div className="mt-2 text-[13px] leading-[20px] text-[#666666]">
                        1. 直接输入你想补充的主题
                      </div>
                      <div className="text-[13px] leading-[20px] text-[#666666]">
                        2. 上传文档、图片或会议纪要
                      </div>
                      <div className="text-[13px] leading-[20px] text-[#666666]">
                        3. 我会检索相关素材，并支持批量导入
                      </div>
                    </div>
                  )}
                  {conversationItems.map((item) => {
                    if (item.type === "assistant") {
                      return (
                        <div key={item.id} className="flex justify-start">
                          <div className="max-w-full rounded-[8px] bg-[#F6F7F8] px-3 py-2.5">
                            <div className="text-[13px] leading-[20px] text-[#1A1A1A]">
                              {item.text}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (item.type === "user") {
                      return (
                        <div key={item.id} className="flex justify-end">
                          <div className="max-w-[246px] rounded-[8px] bg-[rgba(147,219,255,0.16)] px-3 py-2.5">
                            <div className="text-[13px] leading-[20px] text-[#1A1A1A]">
                              {item.text}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (item.type === "upload") {
                      return (
                        <div key={item.id} className="flex justify-start">
                          <div className="w-full rounded-[12px] border border-[#E8ECF0] bg-white px-3 py-3">
                            <div className="text-[12px] font-medium leading-[18px] text-[#1A1A1A]">
                              已上传素材
                            </div>
                            <div className="mt-2 flex flex-col gap-2">
                              {item.files.map((file) => (
                                <div
                                  key={file.id}
                                  className="flex items-center justify-between rounded-[12px] bg-[#F6F7F8] px-3 py-2"
                                >
                                  <div className="min-w-0">
                                    <div className="truncate text-[12px] leading-[18px] text-[#1A1A1A]">
                                      {file.name}
                                    </div>
                                    <div className="text-[11px] leading-[16px] text-[#8A8A8A]">
                                      {file.kindLabel} · {file.sizeLabel}
                                    </div>
                                  </div>
                                  <span className="ml-3 shrink-0 rounded-full bg-white px-2 py-[2px] text-[11px] leading-none text-[#666666]">
                                    已接收
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (item.type !== "task") return null;

                    const task = tasks.find((entry) => entry.id === item.taskId);
                    if (!task) return null;

                    const isRunning = task.status === "running";
                    const isDone = task.status === "done";
                    const isError = task.status === "error";

                    return (
                      <div key={item.id} className="flex justify-start">
                        <div className="w-full rounded-[12px] border border-[#E8ECF0] bg-white px-3 py-3">
                          <div className="flex items-start gap-[10px]">
                            <div
                              className="mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center"
                              style={{
                                color: isDone ? "#10B981" : isError ? "#ef4444" : "#9ca3af",
                              }}
                            >
                              {isRunning && (
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeDasharray="3 3"
                                  className="animate-spin"
                                >
                                  <circle cx="12" cy="12" r="8" />
                                </svg>
                              )}
                              {isDone && (
                                <span
                                  className="flex h-5 w-5 items-center justify-center rounded-full"
                                  style={{ background: "#ECFDF5" }}
                                >
                                  <Check size={14} color="#10B981" strokeWidth={2.5} />
                                </span>
                              )}
                              {isError && <X size={18} strokeWidth={2} />}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="text-[13px] leading-[20px] text-[#1A1A1A]">
                                {task.originalText}
                              </div>
                              <div className="mt-1 text-[12px] leading-[18px] text-[#8A8A8A]">
                                {isRunning &&
                                  (task.phase > 0 && task.phase < PHASES.length
                                    ? `${PHASES[task.phase].label}…`
                                    : "准备中…")}
                                {isDone && task.result}
                                {isError && "获取失败，请稍后重试"}
                              </div>

                              {isRunning && (
                                <div
                                  className="mt-2 h-[3px] w-full overflow-hidden rounded-full"
                                  style={{ background: "rgba(136,136,136,0.12)" }}
                                >
                                  <div
                                    style={{
                                      height: "100%",
                                      width: `${Math.min(
                                        100,
                                        Math.round((Math.max(task.phase, 0) / PHASES.length) * 100)
                                      )}%`,
                                      background: "#1A1A1A",
                                      transition: "width 500ms ease-out",
                                    }}
                                  />
                                </div>
                              )}

                              {isDone && task.materials && task.materials.length > 0 && (
                                <div className="mt-3 flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] leading-[16px] text-[#8A8A8A]">
                                      共 {task.materials.length} 条素材
                                    </span>
                                    <button
                                      onClick={() => handleImportMaterials(task)}
                                      disabled={importedTaskIds.includes(task.id)}
                                      className={
                                        "shrink-0 rounded-full px-3 py-1 text-[11px] leading-none transition-colors " +
                                        (importedTaskIds.includes(task.id)
                                          ? "bg-[#E9EEF3] text-[#8A8A8A] cursor-not-allowed"
                                          : "bg-[#1A1A1A] text-white hover:bg-[#303030]")
                                      }
                                    >
                                      {importedTaskIds.includes(task.id) ? "已全部导入" : "全部导入"}
                                    </button>
                                  </div>

                                  {task.materials.map((material) => {
                                    return (
                                      <div
                                        key={material.id}
                                        className="flex items-center rounded-[12px] bg-[#F6F7F8] px-3 py-2.5"
                                      >
                                        <div className="min-w-0">
                                          <div className="truncate text-[12px] leading-[18px] text-[#1A1A1A]">
                                            {material.title}
                                          </div>
                                          <div className="text-[11px] leading-[16px] text-[#8A8A8A]">
                                            {material.source} · {material.meta}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <span className="ml-2 shrink-0 whitespace-nowrap text-[11px] leading-[16px] text-[#9CA3AF]">
                              {formatHumanTime(task.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>

                <div className="mt-2 shrink-0 px-2">
                  <ChatInput
                    onSubmit={handleSubmit}
                    onUploadFiles={handleUploadFiles}
                    selectedTopic={selectedTopic}
                    onClearTopic={handleClearTopic}
                    autoFocus={panelOpen}
                  />
                </div>
              </div>
            )}
          </div>
        </header>

        {/* 中央内容区 */}
        <section
          className="flex-1 overflow-y-auto px-6"
          style={{ scrollbarGutter: "stable" }}
        >
          <div className="flex flex-col items-center w-full py-10 gap-10">
            <div className="flex flex-col items-center">
              <p className="text-[14px] text-gray-500 mb-3">创建你的灵感主题</p>
              <button className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-500 text-white text-[14px] font-medium shadow-[0_6px_14px_-4px_rgba(14,165,233,0.5)]">
                <Plus size={16} strokeWidth={2.2} />
                <span>添加主题</span>
              </button>
            </div>

            <TopicCluster
              onAddMaterial={handleAddMaterial}
              onSelect={handleSelectTopic}
              selectedTopic={selectedTopic}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function formatHumanTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds} s 后自动消失`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min 后自动消失`;
}

function extractTopic(text: string): string {
  const patterns = [
    /给(.+?)补/,
    /为(.+?)补充/,
    /(?:补充|添加|搜索|找|补)(.+?)(?:的|素材|主题)/,
    /(.+?)的素材/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return text.trim();
}

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function inferFileKindLabel(file: File): string {
  if (file.type.startsWith("image/")) return "图片";
  if (file.type.includes("pdf")) return "PDF";
  if (file.type.startsWith("video/")) return "视频";
  if (file.type.startsWith("audio/")) return "音频";
  if (file.type.includes("sheet") || file.name.match(/\.(xlsx|xls|csv)$/i)) return "表格";
  if (file.type.includes("word") || file.name.match(/\.(docx?|md|txt)$/i)) return "文档";
  return "文件";
}

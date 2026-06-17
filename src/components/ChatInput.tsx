import { useEffect, useRef, useState, KeyboardEvent } from "react";
import sendIcon from "../../icon/send.svg";

interface Props {
  onSubmit?: (text: string) => void;
  onUploadFiles?: (files: File[]) => void;
  selectedTopic?: string | null;
  onClearTopic?: () => void;
  autoFocus?: boolean;
}

export function ChatInput({
  onSubmit,
  onUploadFiles,
  selectedTopic,
  onClearTopic,
  autoFocus = false,
}: Props) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedTopic || autoFocus) {
      inputRef.current?.focus();
    }
  }, [selectedTopic, autoFocus]);

  const nonEmpty = value.trim().length > 0 || !!selectedTopic;

  const handleSend = () => {
    let text = value.trim();
    if (selectedTopic) {
      if (text.length === 0) {
        text = `给「${selectedTopic}」补素材`;
      } else {
        text = `给「${selectedTopic}」${text}`;
      }
    }
    if (!text) return;
    onSubmit?.(text);
    setValue("");
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Backspace" && value.length === 0 && selectedTopic) {
      e.preventDefault();
      onClearTopic?.();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    onUploadFiles?.(files);
    event.target.value = "";
  };

  return (
    <div
      className="flex w-full flex-col rounded-[16px] border border-[#E4E6E8] bg-white px-[11px] py-[11px]"
      style={{ minHeight: "108px" }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex min-w-0 flex-wrap items-start gap-x-2 gap-y-1">
        {selectedTopic && (
          <button
            onClick={onClearTopic}
            className="inline-flex h-6 max-w-full items-center gap-1.5 rounded-[6px] border border-[#E5E7EB] bg-[#F5F5F5] px-2 text-[#1A1A1A] transition-colors hover:bg-[#EEEEEE]"
            title="点击移除"
          >
            <span className="flex h-[10px] w-[10px] shrink-0 items-center justify-center rounded-[3px] border border-[#9A7BFF]">
              <span className="h-1 w-1 rounded-[1px] bg-[#9A7BFF]" />
            </span>
            <span className="truncate text-[12px] font-normal leading-none">
              {selectedTopic}
            </span>
          </button>
        )}

        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          rows={1}
          placeholder={
            selectedTopic
              ? "回车直接补素材，也可以输入具体要求"
              : "描述你想补充的主题,例如「给视觉叙事系统补素材」"
          }
          className="min-h-[22px] flex-1 resize-none bg-transparent outline-none text-[14px] leading-[22px] text-[#1A1A1A] placeholder:text-[#666666]"
        />
        </div>
      </div>

      <div className="mt-1 flex justify-end">
        <button
          onClick={handleSend}
          disabled={!nonEmpty}
          title="发送"
          className={
            "flex h-7 w-7 items-center justify-center rounded-full transition-all " +
            (nonEmpty ? "" : "opacity-60 cursor-not-allowed")
          }
        >
          <img src={sendIcon} width="28" height="28" alt="发送" />
        </button>
      </div>
    </div>
  );
}

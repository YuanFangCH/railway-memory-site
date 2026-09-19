"use client";

/* Layer images use native elements to preserve transparent PSD boundaries exactly. */
/* eslint-disable @next/next/no-img-element */

import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Pause,
  Play,
  RotateCcw,
  Send,
  Volume2,
  VolumeX,
  Waves
} from "lucide-react";
import Link from "next/link";
import {
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  buildDigitalHumanPageContext,
  buildDigitalHumanTourContext,
  buildTourHandoff,
  isSafeAgentHref,
  parseSseBlock,
  takeSpeechChunks
} from "@/lib/digital-human";
import type { GuidedTour } from "@/lib/tour";

import styles from "./digital-human.module.css";

type MotionState = "idle" | "thinking" | "speaking" | "waving";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type LayerManifest = {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  motion: string;
  pivot: { x: number; y: number };
};

const manifestJson = {
  canvas: { width: 900, height: 1400 },
  body: { src: "" },
  layers: [] as LayerManifest[]
};

type DigitalHumanExperienceProps = {
  tour: GuidedTour;
  apiBase: string;
};

const QUICK_PROMPTS = [
  "这个网站可以做什么？",
  "如何配置知识库？",
  "网页讲解助手有哪些工具？",
  "如何启用主题参观？"
];

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function hrefForMarkdown(value: string) {
  return isSafeAgentHref(value) ? value : null;
}

function renderInline(value: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const token =
    /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let cursor = 0;
  let match = token.exec(value);

  while (match) {
    if (match.index > cursor) {
      nodes.push(value.slice(cursor, match.index));
    }
    const part = match[0];
    if (part.startsWith("**")) {
      nodes.push(<strong key={`${match.index}-strong`}>{part.slice(2, -2)}</strong>);
    } else if (part.startsWith("`")) {
      nodes.push(<code key={`${match.index}-code`}>{part.slice(1, -1)}</code>);
    } else {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
      const href = linkMatch ? hrefForMarkdown(linkMatch[2]) : null;
      nodes.push(
        href ? (
          <a
            key={`${match.index}-link`}
            href={href}
            target={href.startsWith("/") ? undefined : "_blank"}
            rel={href.startsWith("/") ? undefined : "noreferrer"}
          >
            {linkMatch?.[1]}
          </a>
        ) : (
          linkMatch?.[1] ?? part
        )
      );
    }
    cursor = match.index + part.length;
    match = token.exec(value);
  }

  if (cursor < value.length) {
    nodes.push(value.slice(cursor));
  }
  return nodes;
}

function MarkdownMessage({ content }: { content: string }) {
  const lines = content.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`list-${blocks.length}`}>
        {list.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    list = [];
  };

  lines.forEach((line, index) => {
    const value = line.trim();
    if (!value) {
      flushList();
      return;
    }
    if (/^[-*]\s+/.test(value)) {
      list.push(value.replace(/^[-*]\s+/, ""));
      return;
    }
    flushList();
    if (/^#{1,3}\s+/.test(value)) {
      blocks.push(
        <p key={`heading-${index}`}>
          <strong>{renderInline(value.replace(/^#{1,3}\s+/, ""))}</strong>
        </p>
      );
    } else {
      blocks.push(<p key={`paragraph-${index}`}>{renderInline(value)}</p>);
    }
  });
  flushList();
  return <>{blocks}</>;
}

function layerStyle(layer: LayerManifest) {
  return {
    left: `${(layer.x / manifestJson.canvas.width) * 100}%`,
    top: `${(layer.y / manifestJson.canvas.height) * 100}%`,
    width: `${(layer.width / manifestJson.canvas.width) * 100}%`,
    height: `${(layer.height / manifestJson.canvas.height) * 100}%`,
    zIndex: layer.zIndex,
    "--dh-pivot-x": `${layer.pivot.x * 100}%`,
    "--dh-pivot-y": `${layer.pivot.y * 100}%`
  } as React.CSSProperties;
}

const LAYER_CLASS: Record<string, string> = {
  head: styles.head,
  hairBack: styles.hairBack,
  hairFront: styles.hairFront,
  brow: styles.brow,
  eye: styles.eye,
  mouth: styles.mouth,
  cloth: styles.cloth,
  smoke: styles.smoke,
  leftArmUpper: styles.leftArmUpper,
  leftArmLower: styles.leftArmLower,
  leftHand: styles.leftHand,
  rightForearm: styles.rightForearm,
  rightHand: styles.rightHand
};

const LEG_CLASS: Record<string, string> = {
  "leg-left": styles.legLeft,
  "leg-right": styles.legRight
};

function AvatarStage({
  motion,
  speaking,
  speechEnabled,
  speechSupported,
  statusText
}: {
  motion: MotionState;
  speaking: boolean;
  speechEnabled: boolean;
  speechSupported: boolean;
  statusText: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const characterRef = useRef<HTMLDivElement>(null);
  const waveTimer = useRef<number | null>(null);
  const frame = useRef<number | null>(null);
  const [waving, setWaving] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(
    () => () => {
      if (waveTimer.current) window.clearTimeout(waveTimer.current);
      if (frame.current) window.cancelAnimationFrame(frame.current);
    },
    []
  );

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reducedMotion || event.pointerType === "touch" || !stageRef.current) {
      return;
    }
    const rect = stageRef.current.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
    const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
    if (frame.current) window.cancelAnimationFrame(frame.current);
    frame.current = window.requestAnimationFrame(() => {
      characterRef.current?.style.setProperty("--dh-look-x", `${(x * 4).toFixed(2)}px`);
      characterRef.current?.style.setProperty("--dh-look-y", `${(y * 3).toFixed(2)}px`);
    });
  }

  function resetPointer() {
    characterRef.current?.style.setProperty("--dh-look-x", "0px");
    characterRef.current?.style.setProperty("--dh-look-y", "0px");
  }

  function wave() {
    if (reducedMotion) return;
    setWaving(false);
    window.requestAnimationFrame(() => setWaving(true));
    if (waveTimer.current) window.clearTimeout(waveTimer.current);
    waveTimer.current = window.setTimeout(() => setWaving(false), 2500);
  }

  return (
    <section
      ref={stageRef}
      className={styles.stageShell}
      data-dark="true"
      data-speaking={speaking || motion === "speaking"}
      aria-label="网页讲解助手数字人"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <div className={styles.stageHeader}>
        <span className={styles.liveDot} />
        <div>
          <p className={styles.stageEyebrow}>GuideAgent Digital Human</p>
          <strong className="text-sm text-white">网页讲解助手 · 铁路数字讲解员</strong>
        </div>
      </div>
      <div className={styles.stageActions}>
        <button className={styles.stageAction} type="button" onClick={wave}>
          <Waves className="size-3.5" />
          挥挥手
        </button>
      </div>
      <div className={styles.stageFrame}>
        <div
          ref={characterRef}
          className={styles.character}
          data-motion={motion}
          data-waving={waving}
        >
          {manifestJson.body.src ? (
            <>
              <img
                className={`${styles.layer} ${styles.body}`}
                src={manifestJson.body.src}
                alt="网页讲解助手虚拟形象全身立绘"
                width={manifestJson.canvas.width}
                height={manifestJson.canvas.height}
                decoding="async"
              />
              {manifestJson.layers
                .slice()
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((layer) => (
                  <img
                    key={layer.id}
                    className={`${styles.layer} ${
                      LEG_CLASS[layer.id] ?? LAYER_CLASS[layer.motion] ?? ""
                    }`}
                    src={layer.src}
                    alt=""
                    width={layer.width}
                    height={layer.height}
                    style={layerStyle(layer)}
                    decoding="async"
                  />
                ))}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-white/80">
              <div>
                <div className="mx-auto grid size-28 place-items-center rounded-full border border-white/20 bg-white/10 text-4xl font-semibold text-[#f0c66a]">
                  WA
                </div>
                <p className="mt-4 text-sm">使用 PSD 构建器生成角色图层</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={styles.speechBubble}>
        <strong>{motion === "thinking" ? "正在查找资料" : "网页讲解助手"}</strong>
        <div>{statusText}</div>
      </div>
      <div className={styles.stageCaption}>
        {reducedMotion
          ? "已根据系统设置减少动态效果"
          : speechSupported
            ? speechEnabled
              ? "朗读已开启"
              : "朗读默认关闭"
            : "当前浏览器未提供语音朗读"}
      </div>
    </section>
  );
}

export function DigitalHumanExperience({
  tour,
  apiBase
}: DigitalHumanExperienceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "你好，我是网页讲解助手。你可以询问站内内容、网站功能，也可以在配置主题参观后让我带你浏览页面。"
    }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [motion, setMotion] = useState<MotionState>("idle");
  const [conversationId, setConversationId] = useState("");
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechSpeaking, setSpeechSpeaking] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [tourPaused, setTourPaused] = useState(true);
  const [tourQuestionPause, setTourQuestionPause] = useState(false);
  const [tourRemaining, setTourRemaining] = useState(tour.stops[0]?.dwellSeconds ?? 30);
  const [tourComplete, setTourComplete] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState("dh-chat");
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const speechQueueRef = useRef(0);
  const speechEnabledRef = useRef(false);
  const currentStop = tour.stops[tourIndex] ?? tour.stops[0];
  const statusText = useMemo(() => {
    if (motion === "thinking") return "正在查找站内资料和相关铁路史料。";
    if (tourActive && currentStop) return `${currentStop.eyebrow} · ${currentStop.title}`;
    return "询问站内内容、网站功能或主题资料。";
  }, [currentStop, motion, tourActive]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    load();
    const readyTimer = window.setTimeout(() => setSpeechSupported(true), 0);
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.clearTimeout(readyTimer);
      window.speechSynthesis.removeEventListener("voiceschanged", load);
    };
  }, []);

  useEffect(() => {
    const node = messagesRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (
      !tourActive ||
      tourPaused ||
      busy ||
      speechSpeaking ||
      tourComplete
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setTourRemaining((remaining) => {
        if (remaining <= 1) {
          if (tourIndex >= tour.stops.length - 1) {
            setTourActive(false);
            setTourPaused(true);
            setTourComplete(true);
            return 0;
          }
          setTourIndex((value) => value + 1);
          return tour.stops[tourIndex + 1]?.dwellSeconds ?? 30;
        }
        return remaining - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [
    busy,
    currentStop,
    speechSpeaking,
    tour.stops,
    tourActive,
    tourComplete,
    tourIndex,
    tourPaused
  ]);

  const speakText = useCallback((text: string, replace = false) => {
    if (
      !speechEnabledRef.current ||
      !speechSupported ||
      !("speechSynthesis" in window) ||
      !text.trim()
    ) {
      return;
    }
    if (replace) {
      window.speechSynthesis.cancel();
      speechQueueRef.current = 0;
    }
    const utterance = new SpeechSynthesisUtterance(text.trim());
    const chineseVoice =
      voicesRef.current.find((voice) => /^zh(-|_)/i.test(voice.lang)) ??
      voicesRef.current.find((voice) => /Chinese|中文|普通话/i.test(voice.name));
    if (chineseVoice) utterance.voice = chineseVoice;
    utterance.lang = chineseVoice?.lang || "zh-CN";
    utterance.rate = 0.96;
    utterance.pitch = 1.02;
    speechQueueRef.current += 1;
    setSpeechSpeaking(true);
    const finish = () => {
      speechQueueRef.current = Math.max(0, speechQueueRef.current - 1);
      if (speechQueueRef.current === 0) {
        setSpeechSpeaking(false);
      }
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
  }, [speechSupported]);

  useEffect(() => {
    if (!tourActive || !speechEnabled || !speechSupported || !currentStop) return;
    speakText(
      `${currentStop.eyebrow}，${currentStop.title}。${currentStop.narration}`,
      true
    );
  }, [currentStop, speakText, speechEnabled, speechSupported, tourActive]);

  function cancelSpeech() {
    window.speechSynthesis?.cancel();
    speechQueueRef.current = 0;
    setSpeechSpeaking(false);
  }

  function handleAgentAction(action: Record<string, unknown>) {
    const type = String(action.type ?? "");
    if (type === "scroll" || type === "highlight") {
      const anchor = String(action.anchor ?? "");
      const target = anchor ? document.getElementById(anchor) : null;
      if (target) {
        setActiveAnchor(anchor);
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.remove(styles.highlight);
        void target.offsetWidth;
        target.classList.add(styles.highlight);
        window.setTimeout(() => target.classList.remove(styles.highlight), 1500);
      }
    } else if (type === "open_link") {
      const href = String(action.url ?? "");
      if (isSafeAgentHref(href)) {
        if (href.startsWith("/")) window.location.assign(href);
        else window.open(href, "_blank", "noopener,noreferrer");
      }
    }
  }

  async function sendQuestion(question: string) {
    const value = question.trim();
    if (!value || busy) return;

    const askingDuringTour = tourActive && !tourComplete;
    if (askingDuringTour) {
      setTourPaused(true);
      setTourQuestionPause(true);
    }
    cancelSpeech();
    setBusy(true);
    setMotion("thinking");
    setInput("");
    setMessages((current) => [
      ...current,
      { id: createId("user"), role: "user", content: value },
      { id: createId("assistant"), role: "assistant", content: "" }
    ]);

    const controller = new AbortController();
    abortRef.current = controller;
    let answer = "";
    let speechBuffer = "";
    let canceled = false;

    try {
      const response = await fetch(`${apiBase}/chat/stream`, {
        method: "POST",
        credentials: "include",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: value,
          mode: askingDuringTour ? "tour" : "chat",
          conversationId: conversationId || undefined,
          pageContext: buildDigitalHumanPageContext(activeAnchor),
          tourContext: askingDuringTour
            ? buildDigitalHumanTourContext(
                tour,
                tourIndex,
                "window",
                true
              )
            : undefined
        })
      });
      if (!response.ok || !response.body) {
        throw new Error(`网页讲解助手请求失败：${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let firstToken = true;

      const consume = (block: string) => {
        const event = parseSseBlock(block);
        if (event.event === "meta" && typeof event.data.conversationId === "string") {
          setConversationId(event.data.conversationId);
        } else if (event.event === "token" && typeof event.data.text === "string") {
          if (firstToken) {
            firstToken = false;
            setMotion("speaking");
          }
          answer += event.data.text;
          speechBuffer += event.data.text;
          const speech = takeSpeechChunks(speechBuffer);
          speechBuffer = speech.rest;
          speech.chunks.forEach((chunk) => speakText(chunk));
          setMessages((current) => {
            const next = [...current];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, content: answer };
            }
            return next;
          });
        } else if (event.event === "actions" && Array.isArray(event.data.items)) {
          event.data.items.forEach((item) => {
            if (item && typeof item === "object") {
              handleAgentAction(item as Record<string, unknown>);
            }
          });
        } else if (event.event === "error") {
          throw new Error(String(event.data.message || "网页讲解助手暂时无法回答"));
        }
      };

      while (true) {
        const result = await reader.read();
        if (result.done) break;
        buffer += decoder.decode(result.value, { stream: true });
        let boundary = buffer.indexOf("\n\n");
        while (boundary >= 0) {
          consume(buffer.slice(0, boundary));
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf("\n\n");
        }
      }
      if (buffer.trim()) consume(buffer);
      const finalSpeech = takeSpeechChunks(speechBuffer, true);
      finalSpeech.chunks.forEach((chunk) => speakText(chunk));
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        canceled = true;
      } else {
        const message = `网页讲解助手暂时无法回答：${(error as Error).message}`;
        setMessages((current) => {
          const next = [...current];
          const last = next[next.length - 1];
          if (last?.role === "assistant") {
            next[next.length - 1] = { ...last, content: message };
          } else {
            next.push({ id: createId("assistant"), role: "assistant", content: message });
          }
          return next;
        });
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
      if (motion !== "speaking") setMotion("idle");
      if (canceled) {
        setMessages((current) => {
          const next = [...current];
          const last = next[next.length - 1];
          if (last?.role === "assistant" && !last.content) {
            next[next.length - 1] = { ...last, content: "已停止生成。" };
          }
          return next;
        });
      }
    }
  }

  function onChatSubmit(event: FormEvent) {
    event.preventDefault();
    void sendQuestion(input);
  }

  function onChatKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function startWindowTour(initialIndex = 0) {
    const safeIndex = Math.max(0, Math.min(initialIndex, tour.stops.length - 1));
    cancelSpeech();
    setTourComplete(false);
    setTourIndex(safeIndex);
    setTourRemaining(tour.stops[safeIndex]?.dwellSeconds ?? 30);
    setTourActive(true);
    setTourPaused(false);
    setTourQuestionPause(false);
    document.getElementById("dh-tour")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handoffToPageTour() {
    if (!currentStop) return;
    sessionStorage.setItem(
      "cwt-tour-state",
      JSON.stringify(buildTourHandoff(tour.id, tourIndex, true))
    );
    window.location.assign(currentStop.href);
  }

  function goToTourStep(index: number) {
    if (index < 0 || index >= tour.stops.length) return;
    cancelSpeech();
    setTourIndex(index);
    setTourRemaining(tour.stops[index]?.dwellSeconds ?? 30);
    setTourPaused(false);
    setTourQuestionPause(false);
    setTourComplete(false);
  }

  function resumeTour() {
    setTourPaused(false);
    setTourQuestionPause(false);
  }

  function toggleSpeech() {
    if (!speechSupported) return;
    if (speechEnabled) {
      cancelSpeech();
      speechEnabledRef.current = false;
      setSpeechEnabled(false);
    } else {
      speechEnabledRef.current = true;
      setSpeechEnabled(true);
    }
  }

  return (
    <div className="route-pattern min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <section id="dh-intro" className={styles.intro}>
          <p className="text-xs font-bold tracking-[0.2em] text-[#c8901f]">
            WEB GUIDE AGENT
          </p>
          <h1>让网页讲解助手走到你面前</h1>
          <p>
            一套会看、会讲、会回应的网页讲解台。文字对话、页面定位与可选主题路线共用同一个
            Agent，默认安静，朗读由你主动开启。
          </p>
        </section>

        <div className={styles.layout}>
          <AvatarStage
            motion={motion}
            speaking={speechSpeaking}
            speechEnabled={speechEnabled}
            speechSupported={speechSupported}
            statusText={statusText}
          />

          <section id="dh-chat" className={styles.chatPanel} aria-label="与网页讲解助手对话">
            <div className={styles.chatHeader}>
              <div className={styles.chatIdentity}>
                <span className="grid size-9 place-items-center rounded-full bg-[#0a2745] text-xs font-semibold text-[#f0c66a]">
                  WA
                </span>
                <div>
                  <strong>网页讲解助手</strong>
                  <span>站内资料与铁路文化问答</span>
                </div>
              </div>
              <button
                className={styles.speechToggle}
                data-active={speechEnabled}
                type="button"
                onClick={toggleSpeech}
                disabled={!speechSupported}
                aria-pressed={speechEnabled}
              >
                {speechEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
                {speechEnabled ? "朗读中" : "开启朗读"}
              </button>
            </div>

            <div ref={messagesRef} className={styles.messages} aria-live="polite">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={styles.message}
                  data-role={message.role}
                >
                  {message.role === "assistant" && !message.content ? (
                    <span className={styles.thinking}>
                      正在查找
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : message.role === "assistant" ? (
                    <MarkdownMessage content={message.content} />
                  ) : (
                    message.content
                  )}
                </div>
              ))}
            </div>

            <div className={styles.quickPrompts}>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  className={styles.quickPrompt}
                  type="button"
                  disabled={busy}
                  onClick={() => void sendQuestion(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form className={styles.composer} onSubmit={onChatSubmit}>
              <textarea
                rows={2}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onChatKeyDown}
                placeholder="问问网页讲解助手：如何使用这个网站？"
                aria-label="输入问题"
              />
              {busy ? (
                <button
                  type="button"
                  onClick={() => {
                    abortRef.current?.abort();
                    cancelSpeech();
                  }}
                >
                  停止
                </button>
              ) : (
                <button type="submit" disabled={!input.trim()}>
                  <Send className="mr-1 size-3.5" />
                  发送
                </button>
              )}
            </form>
          </section>
        </div>

        <section id="dh-tour" className={styles.tourPanel} aria-label="主题参观">
          <div className={styles.tourHeader}>
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-[#f0c66a]">
                {tour.stops.length
                  ? `${tour.stops.length} 站 · 约 ${tour.durationMinutes} 分钟`
                  : "尚未配置路线"}
              </p>
              <h2>{tour.title}</h2>
              <p>{tour.summary}</p>
            </div>
            {tour.stops.length ? (
              <div className={styles.tourStartActions}>
                <button
                  className={styles.tourButton}
                  data-primary="true"
                  type="button"
                  onClick={() => startWindowTour()}
                >
                  <Play className="size-3.5" />
                  页内讲解
                </button>
                <button
                  className={styles.tourButton}
                  type="button"
                  onClick={handoffToPageTour}
                >
                  <ExternalLink className="size-3.5" />
                  网页参观
                </button>
              </div>
            ) : null}
          </div>

          <div className={styles.tourBody}>
            {!tour.stops.length ? (
              <div className={styles.tourComplete}>
                <strong>尚未配置路线</strong>
                <p>在工作区数据源中配置参观路线后，此区域会自动启用。</p>
              </div>
            ) : tourComplete ? (
              <div className={styles.tourComplete}>
                <strong>参观完成</strong>
                <p>{tour.completion}</p>
                <div className={styles.tourLinks}>
                  {tour.extensions.map((item) => (
                    <Link key={item.href} href={item.href}>
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.tourCard}>
                <img src={currentStop.image.src} alt={currentStop.image.alt} />
                <div>
                  <div className={styles.tourStep}>
                    {currentStop.eyebrow || `第 ${tourIndex + 1} 站`}
                  </div>
                  <h3>{currentStop.title}</h3>
                  <p>{currentStop.narration}</p>
                  <div className={styles.tourControls}>
                    <button
                      className={styles.tourControl}
                      type="button"
                      onClick={() => goToTourStep(tourIndex - 1)}
                      disabled={tourIndex <= 0}
                    >
                      <ArrowLeft className="mr-1 inline size-3" />
                      上一站
                    </button>
                    {tourActive ? (
                      <button
                        className={styles.tourControl}
                        type="button"
                        onClick={() => {
                          if (tourPaused) resumeTour();
                          else {
                            cancelSpeech();
                            setTourPaused(true);
                          }
                        }}
                      >
                        {tourPaused ? (
                          <Play className="mr-1 inline size-3" />
                        ) : (
                          <Pause className="mr-1 inline size-3" />
                        )}
                        {tourPaused ? "继续" : "暂停"}
                      </button>
                    ) : (
                      <button
                        className={styles.tourControl}
                        type="button"
                        onClick={() => startWindowTour()}
                      >
                        <Play className="mr-1 inline size-3" />
                        开始
                      </button>
                    )}
                    <button
                      className={styles.tourControl}
                      type="button"
                      onClick={() => {
                        if (tourIndex >= tour.stops.length - 1) {
                          cancelSpeech();
                          setTourActive(false);
                          setTourPaused(true);
                          setTourComplete(true);
                        } else {
                          goToTourStep(tourIndex + 1);
                        }
                      }}
                    >
                      {tourIndex >= tour.stops.length - 1 ? "结束" : "下一站"}
                      <ArrowRight className="ml-1 inline size-3" />
                    </button>
                    {tourQuestionPause ? (
                      <button
                        className={styles.tourControl}
                        type="button"
                        onClick={resumeTour}
                      >
                        <RotateCcw className="mr-1 inline size-3" />
                        回到参观
                      </button>
                    ) : null}
                    <span className={styles.countdown}>
                      {tourActive && !tourPaused ? `${tourRemaining} 秒` : "已暂停"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.tourList} aria-label="主题参观路线">
              {tour.stops.map((stop, index) => (
                <button
                  key={stop.id}
                  className={styles.tourListItem}
                  type="button"
                  aria-current={index === tourIndex && tourActive}
                  onClick={() => {
                    if (tourActive) goToTourStep(index);
                    else startWindowTour(index);
                  }}
                >
                  <span>{index + 1}</span>
                  <strong>{stop.title}</strong>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

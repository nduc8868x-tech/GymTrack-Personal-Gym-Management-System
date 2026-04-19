'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { API_URL } from '@/lib/constants';
import { useT } from '@/lib/i18n';
import { usePageTitle } from '@/hooks/usePageTitle';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string | null;
  context_type: string;
  messages: Message[];
}

// Streaming helper: reads SSE from the response body
async function* readSSEStream(response: Response): AsyncGenerator<{ text: string; error?: boolean }> {
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') return;
        try {
          yield JSON.parse(raw) as { text: string; error?: boolean };
        } catch {
          // ignore malformed chunks
        }
      }
    }
  }
}

function MessageBubble({ message }: { message: Message | { role: 'assistant'; content: string; streaming?: boolean; error?: boolean } }) {
  const isUser = message.role === 'user';
  const isError = 'error' in message && message.error;

  if (isUser) {
    return (
      <div className="flex gap-3 flex-row-reverse">
        {/* User avatar */}
        <div className="flex-shrink-0 h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>
        {/* Bubble */}
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap bg-blue-600 text-white">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 flex-row">
      {/* AI avatar */}
      <div className="flex-shrink-0 h-8 w-8 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center">
        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      {/* Bubble */}
      <div className={`max-w-[75%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
        isError
          ? 'bg-red-500/10 border border-red-500/20 text-red-400'
          : 'bg-white/6 border border-white/8 text-slate-200'
      }`}>
        {isError && (
          <svg className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {message.content}
        {'streaming' in message && message.streaming && (
          <span className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}

export default function AiChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { t } = useT();
  usePageTitle('Trò chuyện AI');
  const CONTEXT_LABELS: Record<string, string> = {
    general: t.aiCoach.contextTypes.general,
    workout_analysis: t.aiCoach.contextTypes.workout_analysis,
    nutrition_advice: t.aiCoach.contextTypes.nutrition_advice,
    progress_review: t.aiCoach.contextTypes.progress_review,
  };

  const [input, setInput] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: conv, isLoading } = useQuery({
    queryKey: queryKeys.ai.messages(id),
    queryFn: () =>
      api.get<{ data: Conversation }>(`/ai/conversations/${id}/messages`).then((r) => r.data.data),
  });

  // Sync DB messages → localMessages (skip during streaming to preserve optimistic state)
  useEffect(() => {
    if (conv?.messages && !isStreaming) {
      setLocalMessages(conv.messages);
    }
  }, [conv, isStreaming]);

  // Scroll to bottom on new messages / streaming
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, streamingContent]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || isStreaming) return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setStreamError(false);

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, tempUserMsg]);
    setStreamingContent('');
    setIsStreaming(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/ai/conversations/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      let accumulated = '';
      let hasError = false;

      for await (const chunk of readSSEStream(response)) {
        accumulated += chunk.text;
        setStreamingContent(accumulated);
        if (chunk.error) hasError = true;
      }

      // Commit streaming message to local state
      const assistantMsg: Message = {
        id: `temp-ai-${Date.now()}`,
        role: 'assistant',
        content: accumulated,
        created_at: new Date().toISOString(),
      };
      setLocalMessages((prev) => [...prev, assistantMsg]);
      setStreamError(hasError);

      // Refresh conversation to get real message IDs + updated title
      qc.invalidateQueries({ queryKey: queryKeys.ai.messages(id) });
      qc.invalidateQueries({ queryKey: queryKeys.ai.conversations() });
    } catch {
      setStreamError(true);
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Đã xảy ra lỗi. Vui lòng thử lại.',
        created_at: new Date().toISOString(),
      };
      setLocalMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const displayMessages = localMessages;

  return (
    <div className="flex flex-col h-screen max-h-screen bg-[#1a1b2e]">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#1a1b2e] flex-shrink-0">
        <button
          onClick={() => router.push('/ai-coach')}
          className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-600/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">
            {conv?.title ?? CONTEXT_LABELS[conv?.context_type ?? 'general'] ?? 'AI Coach'}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <p className="text-xs text-slate-500 capitalize">
              {CONTEXT_LABELS[conv?.context_type ?? 'general']}
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-2 text-slate-500">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">{t.common.loading}</span>
            </div>
          </div>
        )}

        {!isLoading && displayMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-white">{t.aiCoach.chat.howCanIHelp}</p>
              <p className="text-sm text-slate-500 mt-1 max-w-xs">{t.aiCoach.chat.subtitle}</p>
            </div>
            <div className="w-full max-w-sm space-y-2 mt-1">
              {t.aiCoach.chat.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}
                  className="w-full text-left rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-300 hover:bg-white/6 hover:border-white/12 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {displayMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming in progress */}
        {isStreaming && streamingContent && (
          <MessageBubble
            message={{ role: 'assistant', content: streamingContent, streaming: true }}
          />
        )}

        {/* Loading dots while waiting for first chunk */}
        {isStreaming && !streamingContent && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="bg-white/6 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Error state with retry */}
        {streamError && !isStreaming && (
          <div className="flex items-center justify-center">
            <button
              onClick={sendMessage}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg bg-white/4 border border-white/8 hover:bg-white/6"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t.aiCoach.chat.errorRetry}
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-white/5 bg-[#1a1b2e] px-4 py-4">
        <div className="flex items-end gap-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-3 focus-within:border-blue-600/40 focus-within:bg-white/6 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t.aiCoach.chat.placeholder}
            disabled={isStreaming}
            className="flex-1 resize-none bg-transparent text-sm text-white outline-none placeholder:text-slate-600 disabled:opacity-50 max-h-28"
            style={{ lineHeight: '1.5rem' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="flex-shrink-0 h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isStreaming ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-[10px] text-slate-700 text-center mt-2">
          {t.aiCoach.chat.hint}
        </p>
      </div>
    </div>
  );
}

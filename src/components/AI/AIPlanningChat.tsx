import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Brain,
  ListChecks,
  Clock,
  DollarSign,
  Send,
  X,
  Sparkles,
  ChevronDown,
  Bot,
  User as UserIcon,
  Zap,
  Copy,
  Check,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as SupabaseUser } from '@supabase/supabase-js';
import {
  streamChatMessage,
  saveChatMessage,
  loadChatHistory,
  estimateCost,
} from '../../services/aiService';
import type {
  PlanningAspect,
  ChatMessage,
  TripContext,
  QuickAction,
} from '../../types/ai';
import { PLANNING_MODELS, QUICK_ACTIONS } from '../../types/ai';

const ASPECT_ICONS: Record<string, React.ReactNode> = {
  strategic: <Brain className="h-3.5 w-3.5" />,
  tasks: <ListChecks className="h-3.5 w-3.5" />,
  schedule: <Clock className="h-3.5 w-3.5" />,
  resources: <DollarSign className="h-3.5 w-3.5" />,
};

interface AIPlanningChatProps {
  isOpen: boolean;
  onClose: () => void;
  user: SupabaseUser;
  tripContext: TripContext | null;
  apiKey: string;
  onNeedApiKey: () => void;
}

export function AIPlanningChat({
  isOpen,
  onClose,
  user,
  tripContext,
  apiKey,
  onNeedApiKey,
}: AIPlanningChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aspect, setAspect] = useState<PlanningAspect>('strategic');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [copied, setCopied] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && user && !historyLoaded) {
      loadChatHistory(user.id, sessionId).then((history) => {
        if (history.length > 0) setMessages(history);
        setHistoryLoaded(true);
      });
    }
  }, [isOpen, user, sessionId, historyLoaded]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async (text?: string, overrideAspect?: PlanningAspect) => {
    const content = text || input.trim();
    if (!content || loading) return;

    if (!apiKey) {
      onNeedApiKey();
      return;
    }

    const selectedAspect = overrideAspect || aspect;
    const modelConfig = PLANNING_MODELS.find((m) => m.id === selectedAspect)!;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
      model_used: '',
      aspect: selectedAspect,
      tokens_used: 0,
      created_at: new Date().toISOString(),
    };

    const assistantMsg: ChatMessage = {
      id: `assistant_${Date.now()}`,
      role: 'assistant',
      content: '',
      model_used: modelConfig.model,
      aspect: selectedAspect,
      tokens_used: 0,
      created_at: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setLoading(true);

    const contextMessages = messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    contextMessages.push({ role: 'user', content });

    try {
      const { model, fullText } = await streamChatMessage(
        contextMessages,
        selectedAspect,
        tripContext,
        (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.isStreaming) {
              updated[updated.length - 1] = {
                ...last,
                content: last.content + chunk,
              };
            }
            return updated;
          });
        },
        apiKey,
      );

      const estimatedTokens = Math.ceil((content.length + fullText.length) / 4);
      setTotalTokens((prev) => prev + estimatedTokens);

      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.isStreaming) {
          updated[updated.length - 1] = {
            ...last,
            content: fullText,
            model_used: model,
            tokens_used: estimatedTokens,
            isStreaming: false,
          };
        }
        return updated;
      });

      saveChatMessage(user.id, sessionId, {
        role: 'user',
        content,
        model_used: '',
        tokens_used: 0,
      });
      saveChatMessage(user.id, sessionId, {
        role: 'assistant',
        content: fullText,
        model_used: model,
        tokens_used: estimatedTokens,
      });
    } catch (err) {
      const errorText =
        err instanceof Error ? err.message : 'Failed to get response';
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.isStreaming) {
          updated[updated.length - 1] = {
            ...last,
            content: `Error: ${errorText}`,
            isStreaming: false,
          };
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    setAspect(action.aspect);
    handleSend(action.prompt, action.aspect);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
    setTotalTokens(0);
  };

  const totalCost = estimateCost(totalTokens, 'gpt-4o');
  const currentModel = PLANNING_MODELS.find((m) => m.id === aspect)!;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-stretch justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col border-l border-gray-200"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="bg-white/10 p-2 rounded-xl">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base">AI Trip Planner</h3>
                  <p className="text-xs text-slate-400">
                    {totalTokens > 0
                      ? `${totalTokens.toLocaleString()} tokens / ~$${totalCost.toFixed(4)}`
                      : 'Ask anything about your trip'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearChat}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Clear chat"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Model Selector */}
            <div className="border-b border-gray-100 px-4 py-3 flex-shrink-0">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl bg-gradient-to-r ${currentModel.color} text-white text-sm font-semibold shadow-md w-full justify-between`}
              >
                <div className="flex items-center space-x-2">
                  {ASPECT_ICONS[aspect]}
                  <span>{currentModel.name}</span>
                  <span className="text-white/70 text-xs">({currentModel.model})</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showModelSelector ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {showModelSelector && (
                  <motion.div
                    className="mt-2 space-y-1.5"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {PLANNING_MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setAspect(model.id);
                          setShowModelSelector(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                          aspect === model.id
                            ? 'bg-gray-100 ring-2 ring-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg bg-gradient-to-r ${model.color} text-white`}
                        >
                          {ASPECT_ICONS[model.id]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900">
                            {model.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {model.description}
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {model.model}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/50">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                  <div className="bg-gradient-to-br from-slate-100 to-gray-100 p-5 rounded-2xl mb-4">
                    <Sparkles className="h-10 w-10 text-slate-400" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">
                    AI-Powered Trip Planning
                  </h4>
                  <p className="text-sm text-gray-500 mb-6 max-w-sm leading-relaxed">
                    {tripContext
                      ? `Ask me anything about your trip to ${tripContext.destination}. I can help with strategy, tasks, scheduling, and budgeting.`
                      : 'Select a planning model and ask me about destinations, budgets, scheduling, or anything travel-related.'}
                  </p>

                  <div className="w-full space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Quick Actions
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => handleQuickAction(action)}
                          className="flex items-center space-x-2 px-3 py-2.5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group"
                        >
                          <div
                            className={`p-1 rounded-md bg-gradient-to-r ${PLANNING_MODELS.find((m) => m.id === action.aspect)?.color} text-white`}
                          >
                            {ASPECT_ICONS[action.aspect]}
                          </div>
                          <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">
                            {action.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className={`flex items-start gap-2.5 max-w-[90%] ${
                      msg.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-blue-600 to-teal-600'
                          : 'bg-gradient-to-br from-slate-700 to-slate-800'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <UserIcon className="h-3.5 w-3.5 text-white" />
                      ) : (
                        <Bot className="h-3.5 w-3.5 text-white" />
                      )}
                    </div>

                    <div className="flex flex-col gap-1 min-w-0">
                      {msg.role === 'assistant' && msg.model_used && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400 font-medium">
                            {PLANNING_MODELS.find((m) => m.model === msg.model_used)?.name || msg.model_used}
                          </span>
                          {msg.tokens_used > 0 && (
                            <span className="text-[10px] text-gray-300">
                              {msg.tokens_used} tokens
                            </span>
                          )}
                        </div>
                      )}

                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-br-md'
                            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm'
                        }`}
                      >
                        {msg.isStreaming && !msg.content && (
                          <div className="flex space-x-1 py-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                            <div
                              className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                              style={{ animationDelay: '0.1s' }}
                            />
                            <div
                              className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                              style={{ animationDelay: '0.2s' }}
                            />
                          </div>
                        )}
                        <div className="whitespace-pre-wrap break-words">
                          {msg.content}
                          {msg.isStreaming && msg.content && (
                            <span className="inline-block w-1.5 h-4 bg-slate-400 ml-0.5 animate-pulse rounded-sm" />
                          )}
                        </div>
                      </div>

                      {msg.role === 'assistant' && !msg.isStreaming && msg.content && (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="p-1 rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Copy"
                          >
                            {copied === msg.id ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setInput(`Can you elaborate on: "${msg.content.slice(0, 80)}..."`);
                              inputRef.current?.focus();
                            }}
                            className="p-1 rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Follow up"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions (when messages exist) */}
            {messages.length > 0 && !loading && (
              <div className="px-4 py-2 border-t border-gray-100 flex-shrink-0">
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {QUICK_ACTIONS.slice(0, 4).map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleQuickAction(action)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-600 whitespace-nowrap transition-colors"
                    >
                      <Zap className="h-3 w-3" />
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-gray-200 px-4 py-3 bg-white flex-shrink-0">
              <div className="flex items-end space-x-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    apiKey
                      ? `Ask ${currentModel.name}...`
                      : 'Set your OpenAI API key in Settings first'
                  }
                  disabled={loading || !apiKey}
                  rows={1}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 focus:bg-white transition-all disabled:opacity-50 resize-none max-h-28 overflow-y-auto"
                  style={{ minHeight: '42px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 112) + 'px';
                  }}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim() || !apiKey}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

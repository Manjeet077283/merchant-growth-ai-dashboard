import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Send,
  Sparkles,
  AlertCircle,
  RotateCcw,
  Languages,
  ArrowUpRight,
  Trash2,
  Activity,
  ShieldAlert,
  Info
} from 'lucide-react';
import { useVoiceAssistant, VoiceLanguage } from '../../hooks/useVoiceAssistant';
import { api } from '../../services/api';
import { GroundedCitation, ActionItem } from '../../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: GroundedCitation[];
  actions?: ActionItem[];
  model?: string;
  timestamp: string;
}

interface VoiceAiAssistantProps {
  onActionTrigger?: (action: ActionItem) => void;
  isStandalonePage?: boolean;
}

export const VoiceAiAssistant: React.FC<VoiceAiAssistantProps> = ({
  onActionTrigger,
  isStandalonePage = false,
}) => {
  const initialWelcomeMessage: Message = {
    id: 'welcome-01',
    role: 'assistant',
    content:
      "Hello Alex! I am your Merchant Growth AI voice copilot. I am connected directly to your live SQLite database. You can speak to me in English or Hindi by clicking the microphone, or type your business questions below.",
    citations: [
      { metric: 'Database Status', value: 'Live SQLite Ledger', context: '30-day verified merchant orders' },
      { metric: 'Payment Sandbox', value: 'PayPal Verified', context: 'Server-side capture calculations' },
    ],
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState<Message[]>([initialWelcomeMessage]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentlyPlayingMsgId, setCurrentlyPlayingMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isSupported,
    isListening,
    isSpeaking,
    isMuted,
    isPermissionDenied,
    voiceState,
    language,
    voiceError,
    setLanguage,
    setVoiceState,
    toggleMute,
    startListening,
    stopListening,
    speak,
    replay,
    stopSpeaking,
    clearError,
  } = useVoiceAssistant();

  const suggestedQuestions = [
    'What is my total revenue?',
    'Why did my sales decrease?',
    'Which days had the highest sales?',
    'What are my top-performing products?',
    'How can I increase repeat purchases?',
  ];

  const suggestedQuestionsHindi = [
    'मेरा कुल रेवेन्यू कितना है?',
    'बिक्री क्यों कम हुई?',
    'सबसे ज्यादा बिक्री किस दिन हुई?',
    'शीर्ष बिकने वाले उत्पाद कौन से हैं?',
    'ग्राहक दोबारा खरीदारी कैसे बढ़ाएं?',
  ];

  const activeQuestions = language === 'hi-IN' ? suggestedQuestionsHindi : suggestedQuestions;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, voiceState, isProcessing]);

  // Handle Clear Chat
  const handleClearChat = () => {
    stopListening();
    stopSpeaking();
    setCurrentlyPlayingMsgId(null);
    clearError();
    setIsProcessing(false);
    setVoiceState('idle');
    setMessages([
      {
        ...initialWelcomeMessage,
        id: `welcome-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || inputText;
    // Prevent duplicate requests while processing
    if (!textToSend.trim() || isProcessing) return;

    // Stop listening if user manually triggered send
    if (isListening) {
      stopListening();
    }
    // Stop ongoing speech
    stopSpeaking();
    setCurrentlyPlayingMsgId(null);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textOverride) setInputText('');
    setIsProcessing(true);
    setVoiceState('processing');
    clearError();

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await api.chatWithAgent(textToSend, history);

      const assistantMsgId = `asst-${Date.now()}`;
      const assistantMsg: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: response.reply,
        citations: response.citations,
        actions: response.suggested_actions,
        model: response.model,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setVoiceState('idle');

      // Automatically read response aloud if voice output is active and supported
      if (!isMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        setCurrentlyPlayingMsgId(assistantMsgId);
        speak(response.reply);
      }
    } catch (err: any) {
      setVoiceState('error');
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Unable to obtain AI response: ${err.message || 'Check backend connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      // Guarantee loading indicators always stop and state resets
      setIsProcessing(false);
      setVoiceState('idle');
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      clearError();
      stopSpeaking();
      setCurrentlyPlayingMsgId(null);
      startListening(
        (interim) => {
          // Stream live recognized speech directly into the input field
          setInputText(interim);
        },
        (final) => {
          // Place final recognized transcript in input field for user review or immediate submission
          setInputText(final);
        }
      );
    }
  };

  const handleReplayMessage = (msg: Message) => {
    stopSpeaking();
    setCurrentlyPlayingMsgId(msg.id);
    replay(msg.content);
  };

  const handleStopAudio = () => {
    stopSpeaking();
    setCurrentlyPlayingMsgId(null);
  };

  // Compute Voice Status Badge
  const renderStatusBadge = () => {
    if (!isSupported) {
      return (
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-slate-100 text-slate-600 border-slate-200 flex items-center gap-1">
          <Info className="w-3 h-3 text-slate-400" />
          <span>Text Only (Voice Unsupported)</span>
        </span>
      );
    }

    if (isPermissionDenied) {
      return (
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-300 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3 text-rose-500" />
          <span>Microphone Blocked</span>
        </span>
      );
    }

    if (voiceState === 'listening') {
      return (
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-300 animate-pulse flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>Listening ({language === 'hi-IN' ? 'Hindi' : 'English'})...</span>
        </span>
      );
    }

    if (voiceState === 'speaking') {
      return (
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
          <span>Speaking Aloud</span>
        </span>
      );
    }

    if (isProcessing || voiceState === 'processing') {
      return (
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-300 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
          <span>Analyzing Ledger...</span>
        </span>
      );
    }

    if (voiceState === 'error') {
      return (
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-300 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-red-500" />
          <span>Voice Error</span>
        </span>
      );
    }

    // Only display Voice Ready when speech recognition is truly supported and permission is not denied
    return (
      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-[#EAF3FC] text-[#0070E0] border-blue-200/50 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0070E0]" />
        <span>Voice Ready</span>
      </span>
    );
  };

  return (
    <div
      className={`bg-white rounded-3xl border border-slate-100 shadow-[0_4px_25px_rgba(23,43,77,0.04)] flex flex-col overflow-hidden ${
        isStandalonePage ? 'h-[calc(100vh-140px)]' : 'h-full'
      }`}
    >
      {/* 1. Voice Assistant Control Header */}
      <div className="p-3 sm:p-4 px-4 sm:px-6 border-b border-slate-100 bg-[#F5F7FA]/70 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-[#003087] to-[#0070E0] text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-[#172B4D]">Merchant Growth AI Voice Copilot</h3>
              {renderStatusBadge()}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400">
              Grounded SQLite metrics &bull; English &amp; Hindi speech recognition
            </p>
          </div>
        </div>

        {/* Controls: Language Selector, Mute, Stop Audio, Clear Chat */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-white p-0.5 sm:p-1 rounded-xl border border-slate-200/80 shadow-2xs">
            <Languages className="w-3.5 h-3.5 text-slate-400 ml-1 hidden xs:block" />
            <button
              onClick={() => setLanguage('en-US')}
              className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all ${
                language === 'en-US'
                  ? 'bg-[#0070E0] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi-IN')}
              className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all ${
                language === 'hi-IN'
                  ? 'bg-[#0070E0] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              हिन्दी
            </button>
          </div>

          {/* Mute/Unmute Toggle */}
          <button
            onClick={toggleMute}
            className={`p-2 rounded-xl border transition-all text-xs font-semibold flex items-center gap-1.5 shadow-2xs ${
              isMuted
                ? 'bg-slate-100 text-slate-400 border-slate-200'
                : 'bg-white text-[#0070E0] border-blue-200 hover:bg-blue-50'
            }`}
            title={isMuted ? 'Voice output muted (click to unmute)' : 'Voice output active (click to mute)'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Stop Speaking button if audio is currently playing */}
          {isSpeaking && (
            <button
              onClick={handleStopAudio}
              className="px-2.5 sm:px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Square className="w-3.5 h-3.5 fill-rose-600" />
              <span className="hidden xs:inline">Stop Audio</span>
            </button>
          )}

          {/* Clear Chat Button */}
          <button
            onClick={handleClearChat}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200/80 transition-all shadow-2xs"
            title="Clear conversation history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Real-time Status Notification Bars */}
      {isListening && (
        <div className="bg-[#EAF3FC] border-b border-blue-200 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-[#0070E0]">
          <div className="flex items-center gap-2 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span>Listening in {language === 'hi-IN' ? 'Hindi (हिंदी)' : 'English'}... Speak now</span>
          </div>
          <button
            onClick={stopListening}
            className="text-[11px] font-bold text-slate-600 underline hover:no-underline"
          >
            Done
          </button>
        </div>
      )}

      {isSpeaking && !isListening && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2 font-semibold">
            <Volume2 className="w-4 h-4 text-emerald-600 animate-bounce" />
            <span>Reading AI response aloud...</span>
          </div>
          <button
            onClick={handleStopAudio}
            className="text-[11px] font-bold text-emerald-900 underline hover:no-underline"
          >
            Stop Audio
          </button>
        </div>
      )}

      {voiceError && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{voiceError}</span>
          </div>
          <button onClick={clearError} className="font-bold underline text-xs shrink-0 ml-2">
            Dismiss
          </button>
        </div>
      )}

      {!isSupported && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2 text-xs text-amber-800 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Speech-to-text is not supported in this browser. Use Google Chrome, Microsoft Edge, or Safari for voice input, or type below.
          </span>
        </div>
      )}

      {/* 3. Suggested Prompt Chips */}
      <div className="px-4 sm:px-6 py-2 bg-white border-b border-slate-100 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        <span className="text-[11px] font-bold text-[#6B7A90] shrink-0">Suggested:</span>
        {activeQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={isProcessing}
            className="text-[11px] px-3 py-1 bg-[#F5F7FA] hover:bg-[#EAF3FC] text-[#172B4D] hover:text-[#0070E0] rounded-xl font-medium border border-slate-200/70 shrink-0 transition-all shadow-2xs whitespace-nowrap disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* 4. Conversation Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 bg-[#F5F7FA]/40">
        {messages.map((msg) => {
          const isCurrentlySpeakingThis = isSpeaking && currentlyPlayingMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 sm:px-5 py-3.5 text-xs leading-relaxed shadow-2xs ${
                  msg.role === 'user'
                    ? 'bg-[#0070E0] text-white font-medium rounded-tr-xs'
                    : 'bg-white text-[#172B4D] border border-slate-100 rounded-tl-xs shadow-[0_2px_12px_rgba(23,43,77,0.03)]'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Database Metric Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-slate-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-[#0070E0]" />
                      <span>Grounded SQLite Ledger Citations</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.citations.map((c, i) => (
                        <div
                          key={i}
                          className="bg-[#F5F7FA] p-2 rounded-xl border border-slate-200/60 text-[11px]"
                        >
                          <div className="font-bold text-[#172B4D]">{c.metric}</div>
                          <div className="text-[#0070E0] font-extrabold text-xs">{c.value}</div>
                          <div className="text-[10px] text-slate-400">{c.context}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actionable Strategy Cards */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Recommended Actions
                    </div>
                    {msg.actions.map((act, i) => (
                      <div
                        key={i}
                        className="bg-[#F5F7FA] p-3 rounded-xl border border-blue-100 text-[11px]"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#172B4D]">{act.title}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            {act.impact}
                          </span>
                        </div>
                        <p className="text-slate-600 mb-2">{act.action}</p>
                        <button
                          onClick={() => onActionTrigger && onActionTrigger(act)}
                          className="text-[10px] font-bold text-[#0070E0] hover:text-[#005bb8] flex items-center gap-1"
                        >
                          <span>Apply Strategy</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Metadata & Replay Control */}
              <div className="text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-3">
                <span>{msg.timestamp}</span>
                {msg.model && <span>&bull; {msg.model}</span>}

                {/* Replay or Stop Audio Controls for Assistant Messages */}
                {msg.role === 'assistant' && (
                  isCurrentlySpeakingThis ? (
                    <button
                      onClick={handleStopAudio}
                      className="flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                      title="Stop audio playback"
                    >
                      <Square className="w-3 h-3 fill-rose-600" />
                      <span>Stop Audio</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReplayMessage(msg)}
                      className="flex items-center gap-1 font-semibold text-[#0070E0] hover:text-[#005bb8] transition-colors"
                      title="Listen to this response aloud"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Replay Audio</span>
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center gap-2.5 p-3.5 bg-white rounded-2xl border border-slate-100 max-w-xs text-xs text-slate-600 shadow-2xs">
            <Sparkles className="w-4 h-4 animate-spin text-[#0070E0]" />
            <span className="font-medium">Querying SQLite transactions...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 5. Input Form with Real Microphone and Touch Targets */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 sm:p-4 bg-white border-t border-slate-100 flex items-center gap-2 sm:gap-3 shrink-0"
      >
        {/* Real Microphone button with ripple animation */}
        <div className="relative shrink-0">
          {isListening && (
            <span className="absolute -inset-1 rounded-2xl bg-red-400/40 animate-ping pointer-events-none" />
          )}
          <button
            type="button"
            onClick={handleMicClick}
            disabled={!isSupported || isPermissionDenied}
            className={`w-11 h-11 rounded-2xl transition-all shadow-sm flex items-center justify-center shrink-0 ${
              isListening
                ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : isSupported && !isPermissionDenied
                ? 'bg-[#EAF3FC] text-[#0070E0] hover:bg-blue-100 active:scale-95'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
            title={
              !isSupported
                ? 'Speech recognition not supported in this browser'
                : isPermissionDenied
                ? 'Microphone permission blocked. Allow in browser settings.'
                : isListening
                ? 'Listening... Click to stop'
                : `Click to speak (${language === 'hi-IN' ? 'Hindi' : 'English'})`
            }
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>

        {/* Text Input (displays transcript in real-time and allows manual edit) */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing}
            placeholder={
              isListening
                ? 'Listening to speech... your voice transcript appears here'
                : language === 'hi-IN'
                ? 'हिंदी या अंग्रेजी में पूछें (उदा. मेरा कुल रेवेन्यू कितना है)...'
                : 'Ask about revenue, dips, repeat buys (e.g. What is my total revenue?)...'
            }
            className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#F5F7FA] border border-slate-200/80 rounded-2xl text-xs sm:text-sm text-[#172B4D] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0070E0] focus:bg-white transition-all disabled:opacity-60"
          />
        </div>

        {/* Send Button with min 44x44px touch target */}
        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="w-11 h-11 bg-[#0070E0] hover:bg-[#005bb8] text-white rounded-2xl shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 active:scale-95 flex items-center justify-center"
          title="Send Question"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

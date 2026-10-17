import { useEffect, useRef, useState } from "react";
import { getChatHistory, sendChatMessage } from "../../api/chat";
import { confirmationReplies } from "../../utils/itineraryPresentation";
import "../../styles/apiAdditions.css";
import PlaceArtwork from "./PlaceArtwork";
import { chatOptions, chatMessageTime } from "../../utils/chatPresentation";

import { shouldGenerateFromChat } from "../../utils/chatGeneration";

const MAX_LENGTH = 1000;
const QUICK_GATHERING = ["음식은 아무거나 괜찮아요", "조용한 곳이 좋아요", "도착·출발 시각은 아직 몰라요"];


export default function ChatPanel({ tripId, initialPrompt, initialReady, tripStatus, disabled = false, readOnly = false,
  isOpen = true, onTurn, onGenerate, onSendStart, onSendEnd, refreshVersion = 0 }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState(() => initialPrompt || "");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [historyReady, setHistoryReady] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(initialReady);
  const [replyState, setReplyState] = useState(null);
  const [retry, setRetry] = useState(0);
  const bottomRef = useRef(null);
  const sendingRef = useRef(false);
  const nextMessageId = useRef(0);
  const loadedRef = useRef(false);
  const editMode = replyState?.mode === "EDIT" || ["AWAITING_CONFIRMATION", "GENERATED", "EDITING"].includes(tripStatus);

  const send = async (text) => {
    const content = text.trim();
    if (!content || content.length > MAX_LENGTH || sendingRef.current || disabled || readOnly || !loadedRef.current) return;
    if (onSendStart?.() === false) return;
    sendingRef.current = true;
    setSending(true);
    setError("");
    setDraft("");
    const tempId = `temp-${tripId}-${++nextMessageId.current}`;
    setMessages((previous) => [...previous, { id: tempId, role: "USER", content }]);
    let shouldGenerate = false;
    try {
      const reply = await sendChatMessage(tripId, content);
      setMessages((previous) => [...previous.filter((message) => message.id !== tempId), reply.userMessage, reply.assistantMessage].filter(Boolean));
      setReady(reply.readyToGenerate);
      setReplyState(reply);
      onTurn?.(reply);
      shouldGenerate = shouldGenerateFromChat(reply, tripStatus);
    } catch (err) {
      setMessages((previous) => previous.filter((message) => message.id !== tempId));
      setDraft(content);
      setError(err.message);
    } finally {
      sendingRef.current = false;
      setSending(false);
      onSendEnd?.();
    }
    if (shouldGenerate) onGenerate?.();
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    // Defer until after StrictMode cleanup so opening an empty history creates one greeting.
    Promise.resolve().then(async () => {
      if (cancelled || sendingRef.current) return;
      loadedRef.current = false;
      setHistoryReady(false);
      setLoading(true);
      setError("");
      try {
        const history = await getChatHistory(tripId);
        if (cancelled) return;
        // A POST may still be completing while the dock is reopened.
        if (sendingRef.current) return;
        setMessages(history);
        loadedRef.current = true;
        setHistoryReady(true);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [tripId, refreshVersion, isOpen, retry]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  const blocked = sending || loading || disabled || readOnly || !historyReady;
  const choices = confirmationReplies(replyState);
  const lastAssistant = messages.findLast((message) => message.role === 'ASSISTANT');
  const options = choices.length ? chatOptions(replyState?.assistantMessage?.content) : [];
  const quickReplies = editMode ? [] : QUICK_GATHERING;
  const aiAvatar = <span className="premium-ai-avatar" aria-hidden="true"><img src="/assets/ui-v2/ai-spark.svg" alt="" /></span>;
  return <aside className="chat premium-chat">
    <header>
      <img className="tabi-chat-logo" src="/assets/chat/tabi-avatar-v2.png" alt="" />
      <div><b>Tabi AI</b><small>여행을 함께 다듬어요</small></div>
      <span className="chat-mode-label">{readOnly ? '읽기 전용' : editMode ? '일정 수정' : '취향 대화'}</span>
    </header>
    <div className="messages" aria-live="polite" aria-busy={sending || loading}>
      {loading && <div className="premium-chat-note" role="status">대화를 불러오고 있어요...</div>}
      {messages.map((message) => {
        const time = chatMessageTime(message.createdAt);
        if (message.role === 'USER') return <div key={message.id} className="premium-user-message"><p className="user">{message.content}</p>{time && <time>{time}</time>}</div>;
        const pending = !sending && message.id === replyState?.assistantMessage?.id && choices.length > 0;
        const applied = message.id === replyState?.assistantMessage?.id && replyState?.itinerary != null;
        const hasOptions = pending && options.length > 0;
        const content = hasOptions ? message.content.split('\n').filter((line) => !/^\s*\d+[.)、]\s*\S/.test(line)).join('\n') : message.content;
        return <div key={message.id} className="ai-msg">
          {aiAvatar}<div className="premium-ai-content"><div className="chat-author">Tabi AI{time && <time>{time}</time>}</div>
          <div className={`chat-answer${applied ? ' is-applied' : ''}`}>
            {applied && <img className="chat-success-icon" src="/assets/ui-v2/success.svg" alt="일정 반영 완료" />}
            <p>{content}</p>
            {hasOptions && <div className="chat-option-list" aria-label="서버가 제안한 선택지">{options.map((option) => <button key={option.number} type="button" disabled={blocked || readOnly} onClick={() => send(option.number)} className="chat-option-card">
              <span className="chat-option-number">{option.number}</span>
              <PlaceArtwork place={{ name: option.name, genreLabels: option.genreLabels, labels: option.genreLabels }} type={/식당|끼니|점심|저녁|타베로그|스시|라멘|돈카츠|장어/.test(message.content) ? 'LUNCH' : 'ATTRACTION'} />
              <span className="chat-option-copy"><b>{option.name}</b>{option.detail && <small>{option.detail}</small>}</span><span aria-hidden="true">›</span>
            </button>)}</div>}
            {pending && <div className="chat-inline-confirmation">{(hasOptions ? ['그대로'] : choices).map((text) => <button key={text} type="button" disabled={blocked} className={text === '그대로' ? 'chat-keep-action' : 'chat-confirm-action'} onClick={() => send(text)}>{text === '그대로' ? '그대로 둘게요' : text === '네' ? '네, 바꿔주세요' : text}</button>)}</div>}
          </div>
          {!editMode && !readOnly && !pending && !sending && message.id === lastAssistant?.id && !ready && <div className="chat-inline-suggestions">{quickReplies.map((text) => <button key={text} type="button" disabled={blocked} onClick={() => send(text)}>{text}</button>)}</div>}
        </div></div>;
      })}
      {sending && <div className="ai-msg">{aiAvatar}<div className="premium-ai-content"><div className="chat-author">Tabi AI</div><div className="chat-answer chat-working" role="status"><span className="chat-working-dots" aria-hidden="true"><i /><i /><i /></span><p>{editMode ? '일정을 확인하고 있어요' : '답변을 준비하고 있어요'}</p></div></div></div>}
      {ready && !editMode && !readOnly && !sending && <div className="premium-chat-note">취향을 더 알려주거나, “일정 만들어줘”라고 말씀해주세요.</div>}
      {readOnly && <div className="premium-chat-note">현재 일정으로 돌아온 뒤 수정 요청을 보내주세요.</div>}
      {error && <div className="premium-chat-note chat-error" role="alert">{error}{!historyReady && <button type="button" onClick={() => setRetry((value) => value + 1)}>다시 불러오기</button>}</div>}
      <div ref={bottomRef} />
    </div>
    <form onSubmit={(event) => { event.preventDefault(); send(draft); }}>
      <div className="chat-composer"><textarea aria-label="Tabi AI에 메시지 보내기" value={draft} maxLength={MAX_LENGTH} rows={2} placeholder={readOnly ? '과거 일정은 읽기 전용이에요' : editMode ? '예) 2일차 저녁을 스시로 바꿔줘' : '예: 도쿄 3박 4일, 혼자 가는 미식 여행을 짜줘'} disabled={blocked} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(draft); } }} />
      <button type="submit" aria-label="메시지 전송" disabled={blocked || !draft.trim()}><img src="/assets/ui-v2/send.svg" alt="" /></button></div>
      <small><span>Enter 전송 · Shift+Enter 줄바꿈</span><span>{draft.length} / {MAX_LENGTH}</span></small>
    </form>
  </aside>;
}

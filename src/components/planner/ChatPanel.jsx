import { useEffect, useRef, useState } from "react";
import { getChatHistory, sendChatMessage } from "../../api/chat";
import { confirmationReplies } from "../../utils/itineraryPresentation";
import "../../styles/apiAdditions.css";

const MAX_LENGTH = 1000;
const QUICK_GATHERING = ["음식은 아무거나 괜찮아요", "조용한 곳이 좋아요", "도착·출발 시각은 아직 몰라요"];
const QUICK_READY = ["네, 일정 만들어주세요", "조금 더 이야기할게요"];

export default function ChatPanel({ tripId, initialPrompt, initialReady, tripStatus, disabled = false, readOnly = false,
  isOpen = true, onTurn, onGenerate, onSendStart, onSendEnd, refreshVersion = 0 }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [historyReady, setHistoryReady] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(initialReady);
  const [wantsGeneration, setWantsGeneration] = useState(false);
  const [replyState, setReplyState] = useState(null);
  const [retry, setRetry] = useState(0);
  const bottomRef = useRef(null);
  const autoSentRef = useRef(false);
  const sendingRef = useRef(false);
  const loadedRef = useRef(false);
  const editMode = replyState?.mode === "EDIT" || ["GENERATED", "EDITING"].includes(tripStatus);

  const send = async (text) => {
    const content = text.trim();
    if (!content || content.length > MAX_LENGTH || sendingRef.current || disabled || readOnly || !loadedRef.current) return;
    if (onSendStart?.() === false) return;
    sendingRef.current = true;
    setSending(true);
    setError("");
    setDraft("");
    const tempId = `temp-${Date.now()}`;
    setMessages((previous) => [...previous, { id: tempId, role: "USER", content }]);
    try {
      const reply = await sendChatMessage(tripId, content);
      setMessages((previous) => [...previous.filter((message) => message.id !== tempId), reply.userMessage, reply.assistantMessage].filter(Boolean));
      setReady(reply.readyToGenerate);
      setWantsGeneration(reply.userWantsGeneration);
      setReplyState(reply);
      onTurn?.(reply);
    } catch (err) {
      setMessages((previous) => previous.filter((message) => message.id !== tempId));
      setDraft(content);
      setError(err.message);
    } finally {
      sendingRef.current = false;
      setSending(false);
      onSendEnd?.();
    }
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
        if (refreshVersion === 0 && initialPrompt && !history.some((message) => message.role === "USER") && !autoSentRef.current) {
          autoSentRef.current = true;
          send(initialPrompt);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => { cancelled = true; };
    // send depends on the current input lock; reloading on every draft or busy change would lose pending turns.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, refreshVersion, isOpen, retry]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  const blocked = sending || loading || disabled || readOnly || !historyReady;
  const choices = confirmationReplies(replyState);
  const quickReplies = choices.length ? choices : editMode ? [] : ready ? QUICK_READY : QUICK_GATHERING;
  return <aside className="chat">
    <header><span>✦</span><div><b>Tabi AI</b><small>{readOnly ? "과거 일정은 읽기 전용이에요" : editMode ? "바꾸고 싶은 일정을 말씀해주세요" : "대화로 여행 취향을 알려주세요"}</small></div></header>
    <div className="messages" aria-live="polite" aria-busy={sending || loading}>
      {loading && <div className="ai-msg"><span>✦</span><p>대화를 불러오고 있어요...</p></div>}
      {messages.map((message) => message.role === "USER"
        ? <p key={message.id} className="user" style={{ whiteSpace: "pre-wrap" }}>{message.content}</p>
        : <div key={message.id} className="ai-msg"><span>✦</span><p style={{ whiteSpace: "pre-line" }}>{message.content}</p></div>)}
      {sending && <div className="ai-msg"><span>✦</span><p>{editMode ? "일정을 확인하고 답변을 준비하고 있어요..." : "답변을 작성하고 있어요..."}</p></div>}
      {wantsGeneration && !editMode && !readOnly && <div className="system-msg chat-generation-prompt"><b>여행 일정을 만들 준비가 됐어요</b><span>지금까지 이야기한 취향으로 일정을 만들어요.</span><button type="button" className="tabi-button tabi-button-primary tabi-button-wide" disabled={blocked} onClick={onGenerate}>일정 만들기 →</button></div>}
      {readOnly && <div className="system-msg">현재 일정으로 돌아온 뒤 수정 요청을 보내주세요.</div>}
      {error && <div className="system-msg" role="alert" style={{ color: "#d64545" }}>{error}{!historyReady && <button type="button" className="tabi-button" onClick={() => setRetry((value) => value + 1)}>다시 불러오기</button>}</div>}
      <div ref={bottomRef} />
    </div>
    {!readOnly && quickReplies.length > 0 && <div className={`quick${choices.length ? " chat-confirmation" : ""}`} aria-label={choices.length ? "일정 수정 확인" : "빠른 답변"}>{quickReplies.map((text) => <button key={text} type="button" className="tabi-button chat-quick-button" disabled={blocked} onClick={() => send(text)}>{text}</button>)}</div>}
    <form onSubmit={(event) => { event.preventDefault(); send(draft); }}>
      <textarea value={draft} maxLength={MAX_LENGTH} placeholder={readOnly ? "과거 일정은 읽기 전용이에요" : editMode ? "예) 2일차 저녁을 스시로 바꿔줘" : "여행 취향을 알려주세요"} disabled={blocked} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(draft); } }} />
      <button type="submit" aria-label="전송" disabled={blocked || !draft.trim()}>↑</button>
      <small>Enter로 전송, Shift+Enter로 줄바꿈 · {draft.length}/{MAX_LENGTH}</small>
    </form>
  </aside>;
}

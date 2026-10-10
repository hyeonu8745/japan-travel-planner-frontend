import { useEffect, useRef, useState } from "react";
import { getChatHistory, sendChatMessage } from "../../api/chat";

const MAX_LENGTH = 1000;

const QUICK_GATHERING = [
  "음식은 아무거나 괜찮아요",
  "조용한 곳이 좋아요",
  "도착·출발 시각은 아직 몰라요",
];
const QUICK_READY = ["네, 일정 만들어주세요", "조금 더 이야기할게요"];

/**
 * AI 취향 대화 패널
 * - 대화 이력 불러오기, 메시지 전송, 메인에서 입력한 요청 자동 전송
 * - onTurn(reply): 한 번 주고받을 때마다 부모에게 알림 (정리본·상태 갱신용)
 * - locked: 일정이 이미 완성된 여행 (서버가 취향 대화를 막으므로 입력도 닫는다)
 * - onGenerate: 사용자가 일정 만들기를 원했을 때 보여주는 버튼의 동작
 */
export default function ChatPanel({
  tripId,
  initialPrompt,
  initialReady,
  locked,
  onTurn,
  onGenerate,
  refreshVersion = 0,
}) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(initialReady);
  const [wantsGeneration, setWantsGeneration] = useState(false);

  const bottomRef = useRef(null);
  const autoSentRef = useRef(false);

  const send = async (text) => {
    const content = text.trim();
    if (!content || sending || locked) return;

    setSending(true);
    setError("");
    setDraft("");

    // 답이 오기 전에 내 메시지를 먼저 화면에 표시
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, role: "USER", content }]);

    try {
      const reply = await sendChatMessage(tripId, content);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        reply.userMessage,
        reply.assistantMessage,
      ]);
      setReady(reply.readyToGenerate);
      setWantsGeneration(reply.userWantsGeneration);
      onTurn?.(reply);
    } catch (err) {
      // 실패하면 임시 메시지를 지우고, 입력 내용을 되돌려 다시 보낼 수 있게
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(content);
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  // 처음 열 때: 대화 이력 불러오기 + 메인에서 입력한 요청이 있으면 첫 메시지로 전송
  useEffect(() => {
    let cancelled = false;
    getChatHistory(tripId)
      .then((history) => {
        if (cancelled) return;
        setMessages(history);

        if (refreshVersion === 0 && initialPrompt && history.length === 0 && !autoSentRef.current) {
          autoSentRef.current = true;
          send(initialPrompt);
        }
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, refreshVersion]);

  // 새 메시지가 생기면 맨 아래로 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSubmit = (e) => {
    e.preventDefault();
    send(draft);
  };

  const handleKeyDown = (e) => {
    // Enter는 전송, Shift+Enter는 줄바꿈. 한글 조합 중 Enter는 무시
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(draft);
    }
  };

  const quickReplies = ready ? QUICK_READY : QUICK_GATHERING;

  return (
    <aside className="chat">
      <header>
        <span>✦</span>
        <div>
          <b>Tabi AI</b>
          <small>
            {locked
              ? "일정이 완성되어 취향 대화는 닫혀 있어요"
              : "대화로 여행 취향을 알려주세요"}
          </small>
        </div>
      </header>

      <div className="messages">
        {messages.length === 0 && !sending && (
          <div className="ai-msg">
            <span>✦</span>
            <p>
              안녕하세요! 어떤 도쿄 여행을 원하시나요? 좋아하는 음식이나 원하는
              분위기를 편하게 말씀해주세요.
            </p>
          </div>
        )}

        {messages.map((m) =>
          m.role === "USER" ? (
            <p key={m.id} className="user" style={{ whiteSpace: "pre-wrap" }}>
              {m.content}
            </p>
          ) : (
            <div key={m.id} className="ai-msg">
              <span>✦</span>
              <p style={{ whiteSpace: "pre-line" }}>{m.content}</p>
            </div>
          ),
        )}

        {sending && (
          <div className="ai-msg">
            <span>✦</span>
            <p>답변을 작성하고 있어요...</p>
          </div>
        )}

        {wantsGeneration && !locked && (
          <div className="system-msg chat-generation-prompt">
            <b>여행 일정을 만들 준비가 됐어요</b>
            <span>지금까지 이야기한 취향으로 일정을 만들어요.</span>
            <button type="button" className="tabi-button tabi-button-primary tabi-button-wide" onClick={onGenerate}>
              일정 만들기 <span aria-hidden="true">→</span>
            </button>
          </div>
        )}

        {locked && (
          <div className="system-msg">
            일정을 고치는 대화는 다음 단계에서 열릴 예정이에요.
          </div>
        )}

        {error && (
          <div className="system-msg" style={{ color: "#d64545" }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {!locked && (
        <div className="quick">
          {quickReplies.map((text) => (
            <button
              key={text}
              type="button"
              className="tabi-button chat-quick-button"
              disabled={sending}
              onClick={() => send(text)}
            >
              {text}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          value={draft}
          maxLength={MAX_LENGTH}
          placeholder={
            locked ? "일정이 완성되었어요" : "여행 취향을 알려주세요"
          }
          disabled={sending || locked}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="submit"
          aria-label="전송"
          disabled={sending || locked || !draft.trim()}
        >
          ↑
        </button>
        <small>
          Enter로 전송, Shift+Enter로 줄바꿈 · {draft.length}/{MAX_LENGTH}
        </small>
      </form>
    </aside>
  );
}

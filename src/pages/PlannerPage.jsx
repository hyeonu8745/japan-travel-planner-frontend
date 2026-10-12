import { confirmItinerary, allowRestaurantAgain } from "../api/itineraryExtras";
import { HAS_ITINERARY, STATUS_LABELS, statusAfterEdit } from "../utils/tripStatus";
import useTripExtras from "../hooks/useTripExtras";
import BudgetPanel from "../components/planner/BudgetPanel";
import ExcludedRestaurants from "../components/planner/ExcludedRestaurants";
import "../styles/api1012.css";
import PanelIcon from "../components/planner/PanelIcon";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { getPreferences } from "../api/chat";
import {
  generateItinerary, getItinerary, getRestaurantCandidates, replaceRestaurant,
  getAttractionCandidates, replaceAttraction, getItineraryVersions,
  getItineraryVersion, restoreItineraryVersion, deleteItineraryStop,
  reorderDay, getAttractionInsertionCandidates, addAttraction,
} from "../api/itinerary";
import { getTrip, updateTrip, deleteTrip } from "../api/trips";
import { getUser } from "../auth/token";
import Brand from "../components/Brand";
import TripConditionsForm from "../components/TripConditionsForm";
import ChatPanel from "../components/planner/ChatPanel";
import DayTimeline from "../components/planner/DayTimeline";
import PreferencePanel from "../components/planner/PreferencePanel";
import GeneratingOverlay from "../components/planner/GeneratingOverlay";
import ItineraryMap from "../components/planner/ItineraryMap";
import PlaceDetail from "../components/planner/PlaceDetail";
import RestaurantCandidates from "../components/planner/RestaurantCandidates";
import AttractionCandidates from "../components/planner/AttractionCandidates";
import ItineraryHistory from "../components/planner/ItineraryHistory";
import { DELETE_TRIP_MESSAGE, REGENERATE_CONDITIONS_MESSAGE, requiresRegeneration } from "../utils/tripEditing";

import { dayZonesLabel, displayName, retainedSelection } from "../utils/itineraryPresentation";

const CLOSED_CANDIDATES = { kind: null, loading: false, data: null, error: "" };

function tripDays(trip) {
  const parse = (value) => { const [y, m, d] = value.split("-").map(Number); return new Date(y, m - 1, d); };
  const end = parse(trip.endDate);
  const days = [];
  for (let date = parse(trip.startDate); date <= end; date.setDate(date.getDate() + 1)) {
    days.push(`${date.getMonth() + 1}월 ${date.getDate()}일`);
  }
  return days;
}

export default function PlannerPage() {
  const { tripId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();
  const [trip, setTrip] = useState(null);
  const [preference, setPreference] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [itinerary, setItinerary] = useState(null);
  const [panel, setPanel] = useState("plan");
  const [chatOpen, setChatOpen] = useState(true);
  const [chatRefreshVersion, setChatRefreshVersion] = useState(0);
  const [dayNumber, setDayNumber] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [timelineSelection, setTimelineSelection] = useState(null);
  const [generation, setGeneration] = useState({ status: "idle", error: null });
  const [attempt, setAttempt] = useState(0);
  const [wantsGeneration, setWantsGeneration] = useState(false);
  const [busy, setBusy] = useState(false);
  const [extrasRevision, setExtrasRevision] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [allowingRestaurant, setAllowingRestaurant] = useState(null);
  const mutationRef = useRef(false);
  // Candidate/preview responses must never reopen stale panels after navigation or a mutation.
  const requestEpoch = useRef(0);
  const [candidates, setCandidates] = useState(CLOSED_CANDIDATES);
  const [replacingId, setReplacingId] = useState(null);
  const [history, setHistory] = useState({ open: false, loading: false, versions: [], error: "" });
  const [previewItinerary, setPreviewItinerary] = useState(null);
  const [restoringVersion, setRestoringVersion] = useState(null);
  const [conditions, setConditions] = useState(null);
  const [initialPrompt] = useState(() => location.state?.initialPrompt);
  const extras = useTripExtras(tripId, `${itinerary?.version}:${extrasRevision}`, itinerary != null);
  const displayedItinerary = previewItinerary ?? itinerary;
  const previewVersion = previewItinerary?.version ?? null;
  const currentDay = displayedItinerary?.days.find((day) => day.dayNumber === dayNumber)
    ?? displayedItinerary?.days[0];
  const selectedStop = currentDay?.stops.find((stop) => stop.order === selectedOrder);
  const mapSelectedOrder = selectedOrder ?? (timelineSelection?.dayNumber === currentDay?.dayNumber && currentDay?.stops.some((stop) => stop.order === timelineSelection.order) ? timelineSelection.order : null);
  const nextStop = selectedStop ? currentDay.stops[currentDay.stops.indexOf(selectedStop) + 1] : null;
  const editable = !previewItinerary && !busy && trip?.status !== "READY_TO_GENERATE";

  useEffect(() => {
    if (location.state?.initialPrompt) navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getTrip(tripId), getPreferences(tripId)]).then(async ([data, preferences]) => {
      if (cancelled) return;
      if (HAS_ITINERARY.includes(data.status)) {
        try {
          const latest = await getItinerary(tripId);
          if (!cancelled) setItinerary(latest);
        } catch (err) {
          if (!cancelled && err.status !== 404) setNotice(err.message);
        }
      }
      if (!cancelled) { setTrip(data); setPreference(preferences); }
    }).catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; requestEpoch.current += 1; };
  }, [tripId]);

  useEffect(() => {
    if (!conditions) return undefined;
    const previousFocus = document.activeElement;
    const dialog = document.querySelector(".conditions-editor");
    const controls = () => [...dialog.querySelectorAll("button, input, select, textarea, a[href]")].filter((element) => !element.disabled && !element.closest("fieldset:disabled"));
    controls()[0]?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape" && !mutationRef.current) setConditions(null);
      if (event.key !== "Tab") return;
      const items = controls();
      const first = items[0], last = items[items.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("keydown", handleKey); previousFocus?.focus(); };
  }, [conditions]);

  const closeCandidates = () => {
    requestEpoch.current += 1;
    setCandidates(CLOSED_CANDIDATES);
  };

  const applyItinerary = (updated) => {
    setItinerary(updated);
    setExtrasRevision((value) => value + 1); // Refresh computed food and exclusions after every mutation.
    // IDs and dropped/warnings belong to the new version as a whole.
    setDayNumber((previous) => updated?.days.some((day) => day.dayNumber === previous)
      ? previous : updated?.days[0]?.dayNumber ?? 1);
    setSelectedOrder((previous) => retainedSelection(updated, { dayNumber, order: previous })?.order ?? null);
    setTimelineSelection((previous) => retainedSelection(updated, previous));
    closeCandidates();
  };

  const handleApiError = async (err) => {
    if (err.status !== 409) { setNotice(err.message); return; }
    closeCandidates();
    try {
      const [latest, latestTrip] = await Promise.all([getItinerary(tripId), getTrip(tripId)]);
      applyItinerary(latest);
      setTrip(latestTrip);
      setNotice(err.message);
    } catch (reloadError) {
      setNotice(err.message);
      // Preserve the original server conflict message.
      void reloadError;
      // Discard unusable IDs if resynchronization fails.
      setItinerary(null);
    }
  };

  const acquireMutation = () => {
    if (mutationRef.current) return false;
    mutationRef.current = true;
    setBusy(true);
    requestEpoch.current += 1;
    return true;
  };
  const releaseMutation = () => { mutationRef.current = false; setBusy(false); };

  const handleTurn = (reply) => {
    setTrip((previous) => ({ ...previous, status: reply.tripStatus }));
    setWantsGeneration(reply.userWantsGeneration);
    if (reply.itinerary != null) {
      applyItinerary(reply.itinerary);
      setPanel("plan");
      setHistory((previous) => ({ ...previous, open: false }));
      setNotice("");
    }
    if (reply.mode !== "EDIT") getPreferences(tripId).then(setPreference).catch(() => {});
  };

  const startGeneration = async () => {
    if (previewItinerary || !acquireMutation()) return;
    closeCandidates();
    setAttempt((value) => value + 1);
    setGeneration({ status: "running", error: null });
    try {
      applyItinerary(await generateItinerary(tripId));
      setChatRefreshVersion((value) => value + 1);
      setTrip((previous) => ({ ...previous, status: "AWAITING_CONFIRMATION" }));
      setPreviewItinerary(null);
      setSelectedOrder(null);
      setPanel("plan");
      setNotice("");
      setGeneration({ status: "idle", error: null });
    } catch (err) {
      await handleApiError(err);
      setGeneration({ status: "failed", error: { status: err.status, message: err.message } });
    } finally { releaseMutation(); }
  };

  const handleRegenerate = () => {
    if (window.confirm("일정을 다시 만들까요?\n새 버전이 만들어지고 이전 일정은 남아 있어요. 여행당 하루 5번까지 만들 수 있어요.")) startGeneration();
  };

  const openConditions = async () => {
    if (!acquireMutation()) return;
    closeCandidates();
    try { setConditions(await getTrip(tripId)); }
    catch (err) { await handleApiError(err); }
    finally { releaseMutation(); }
  };

  const saveConditions = async (payload) => {
    const regenerates = requiresRegeneration(conditions, payload);
    if (regenerates && !window.confirm(REGENERATE_CONDITIONS_MESSAGE)) return;
    if (!acquireMutation()) return;
    if (regenerates && itinerary) {
      setAttempt((value) => value + 1);
      setGeneration({ status: "running", error: null });
    }
    try {
      const response = await updateTrip(tripId, payload);
      const update = response.itineraryUpdate;
      setTrip(update.result === "FAILED"
        ? { ...response.trip, status: "READY_TO_GENERATE" } : response.trip);
      if (update.result === "RETIMED" || update.result === "REGENERATED") applyItinerary(update.itinerary);
      if (update.result === "NO_ITINERARY" || update.result === "FAILED") applyItinerary(null);
      setPreviewItinerary(null);
      closeCandidates();
      setConditions(null);
      setNotice(update.result === "FAILED"
        ? update.message || "일정을 갱신하지 못했어요. 조건은 저장됐어요."
        : update.message || "여행 조건을 저장했어요.");
    } catch (err) {
      await handleApiError(err);
      throw err;
    } finally {
      setGeneration({ status: "idle", error: null });
      releaseMutation();
    }
  };

  const handleDeleteTrip = async () => {
    if (mutationRef.current || !window.confirm(DELETE_TRIP_MESSAGE) || !acquireMutation()) return;
    try { await deleteTrip(tripId); navigate("/trips", { replace: true }); }
    catch (err) { await handleApiError(err); }
    finally { releaseMutation(); }
  };

  const selectDay = (number) => {
    if (busy) return;
    setDayNumber(number);
    setSelectedOrder(null);
    closeCandidates();
    setPanel("plan");
    setHistory((previous) => ({ ...previous, open: false }));
  };

  const openCandidates = async (kind, position) => {
    if (!editable || mutationRef.current || !currentDay) return;
    const epoch = ++requestEpoch.current;
    const context = { kind, dayNumber: currentDay.dayNumber, position, order: selectedOrder, version: itinerary.version };
    setCandidates({ ...context, loading: true, data: null, error: "" });
    try {
      const data = kind === "add"
        ? await getAttractionInsertionCandidates(tripId, currentDay.dayNumber, position)
        : kind === "restaurant" ? await getRestaurantCandidates(tripId, selectedStop.id)
          : await getAttractionCandidates(tripId, selectedStop.id);
      if (requestEpoch.current === epoch) setCandidates({ ...context, loading: false, data, error: "" });
    } catch (err) {
      if (requestEpoch.current !== epoch) return;
      if (err.status === 409) await handleApiError(err);
      else setCandidates({ ...context, loading: false, data: null, error: err.message });
    }
  };

  const mutateItinerary = async (request, { clearSelection = false, candidateFailure = false } = {}) => {
    if (!editable || !acquireMutation()) return;
    setNotice("");
    try {
      applyItinerary(await request());
      setTrip((previous) => ({ ...previous, status: statusAfterEdit(previous.status) }));
      if (clearSelection) setSelectedOrder(null);
    } catch (err) {
      if (candidateFailure && err.status === 400) setCandidates((previous) => ({ ...previous, error: err.message }));
      await handleApiError(err);
    }
    finally { releaseMutation(); }
  };

  const handleCandidate = async (id, alternative = false) => {
    if (!editable || mutationRef.current) return;
    if (!alternative && (candidates.version !== itinerary.version || candidates.dayNumber !== currentDay.dayNumber)) {
      closeCandidates(); return;
    }
    const kind = alternative ? "restaurant" : candidates.kind;
    if (kind !== "add" && !selectedStop?.id) return;
    setReplacingId(id);
    await mutateItinerary(() => kind === "add"
      ? addAttraction(tripId, currentDay.dayNumber, id, candidates.position, itinerary.version)
      : kind === "restaurant" ? replaceRestaurant(tripId, selectedStop.id, id)
        : replaceAttraction(tripId, selectedStop.id, id), { candidateFailure: !alternative && kind === "restaurant" });
    setReplacingId(null);
  };

  const handleDeleteStop = () => {
    if (!editable || !selectedStop || currentDay.stops.length <= 1) return;
    if (!window.confirm(`${displayName(selectedStop)}을(를) 일정에서 삭제할까요?\n삭제하면 새 버전이 만들어지고 이전 일정은 변경 이력에 남습니다.`)) return;
    mutateItinerary(() => deleteItineraryStop(tripId, selectedStop.id), { clearSelection: true });
  };

  const handleReorder = (ids) => {
    if (!currentDay || ids.every((id, index) => id === currentDay.stops[index]?.id)) return;
    mutateItinerary(() => reorderDay(tripId, currentDay.dayNumber, ids, itinerary.version), { clearSelection: true });
  };

  const openHistory = async () => {
    if (busy) return;
    closeCandidates();
    const epoch = requestEpoch.current;
    setHistory({ open: true, loading: true, versions: [], error: "" });
    try {
      const data = await getItineraryVersions(tripId);
      if (requestEpoch.current === epoch) setHistory({ open: true, loading: false, versions: Array.isArray(data) ? data : data.versions ?? [], error: "" });
    } catch (err) {
      if (requestEpoch.current === epoch) setHistory({ open: true, loading: false, versions: [], error: err.message });
    }
  };

  const handlePreviewVersion = async (version) => {
    if (busy) return;
    const epoch = ++requestEpoch.current;
    try {
      const data = await getItineraryVersion(tripId, version);
      if (epoch !== requestEpoch.current) return;
      setPreviewItinerary(data);
      setDayNumber(data.days[0]?.dayNumber ?? 1);
      setSelectedOrder(null);
      setHistory((previous) => ({ ...previous, open: false }));
      setPanel("plan");
      setCandidates(CLOSED_CANDIDATES);
    } catch (err) {
      if (epoch === requestEpoch.current) setHistory((previous) => ({ ...previous, error: err.message }));
    }
  };

  const handleBackToLatest = () => {
    closeCandidates();
    setPreviewItinerary(null);
    setSelectedOrder(null);
  };

  const handleRestoreVersion = async (version) => {
    if (mutationRef.current || !window.confirm(`v${version} 일정으로 복원할까요?\n복원하면 새 버전이 만들어집니다.`) || !acquireMutation()) return;
    setRestoringVersion(version);
    try {
      applyItinerary(await restoreItineraryVersion(tripId, version));
      setPreviewItinerary(null);
      setTrip((previous) => ({ ...previous, status: statusAfterEdit(previous.status) }));
      setSelectedOrder(null);
      setHistory((previous) => ({ ...previous, open: false }));
    } catch (err) { await handleApiError(err); }
    finally { setRestoringVersion(null); releaseMutation(); }
  };

  const handleConfirm = async () => {
    if (previewItinerary || !acquireMutation()) return;
    setConfirming(true); setNotice("");
    try {
      const response = await confirmItinerary(tripId);
      applyItinerary(response.itinerary);
      setTrip((previous) => ({ ...previous, status: response.status }));
    } catch (err) { await handleApiError(err); }
    finally { setConfirming(false); releaseMutation(); }
  };

  const handleAllowRestaurant = async (id) => {
    if (previewItinerary || !acquireMutation()) return;
    setAllowingRestaurant(id); setNotice("");
    try { await allowRestaurantAgain(tripId, id); extras.reload(); }
    catch (err) { setNotice(err.message); if (err.status === 404) extras.reload(); }
    finally { setAllowingRestaurant(null); releaseMutation(); }
  };

  if (error) return <main style={{ padding: 40 }}><p>{error}</p><Link to="/trips">내 여행으로</Link></main>;
  if (!trip || !preference) return <main style={{ padding: 40 }}><p>불러오는 중...</p></main>;

  const days = tripDays(trip);
  const hasItinerary = itinerary != null;
  const canGenerate = trip.status === "READY_TO_GENERATE" || wantsGeneration;
  const showTimeline = currentDay && panel === "plan";
  const openDetail = (order) => {
    if (busy) return;
    closeCandidates(); setSelectedOrder(order); setPanel("plan");
    setHistory((previous) => ({ ...previous, open: false }));
  };

  return (
    <div className="app planner-v2">
      <header className="app-head">
        <Brand />
        <div className="trip"><b>{trip.title}</b><span>{days[0]} — {days[days.length - 1]} · {STATUS_LABELS[trip.status]}</span></div>
        <div className="actions">
          <Link to="/trips">내 여행</Link>
          {(hasItinerary || trip.status === "READY_TO_GENERATE") && <button className="planner-generate" type="button" disabled={busy || !!previewItinerary} onClick={handleRegenerate}>일정 다시 만들기</button>}
          {!hasItinerary && trip.status !== "READY_TO_GENERATE" && <button className="finish planner-generate" type="button" disabled={!canGenerate || busy || !!previewItinerary} onClick={startGeneration}>일정 만들기</button>}
          {hasItinerary && !previewItinerary && <Link to={`/trips/${tripId}/poster`}>포스터 만들기</Link>}
          <i>{user?.nickname?.charAt(0) ?? "?"}</i>
        </div>
      </header>
      <nav className="planner-tools">
        <button type="button" className={panel === "plan" ? "active" : ""} onClick={() => setPanel("plan")}>일정</button>
        <button type="button" className={panel === "budget" ? "active" : ""} disabled={busy || !hasItinerary || !!previewItinerary} onClick={() => { closeCandidates(); setHistory((previous) => ({ ...previous, open: false })); setPanel("budget"); }}>식비</button>
        <button type="button" className={panel === "taste" ? "active" : ""} onClick={() => setPanel("taste")}>파악한 취향</button>
        <button type="button" aria-expanded={!hasItinerary || chatOpen} disabled={!hasItinerary} onClick={() => setChatOpen((open) => !open)}>AI 대화</button>
        <button type="button" disabled={busy || !!previewItinerary} onClick={openConditions}>여행 조건</button>
        <button type="button" disabled={busy} onClick={openHistory}>변경 이력</button>
        <button type="button" disabled={busy || !hasItinerary || !!previewItinerary} className={panel === "excluded" ? "active" : ""} onClick={() => { closeCandidates(); setHistory((previous) => ({ ...previous, open: false })); setPanel("excluded"); }}>다시 추천하지 않는 식당{extras.excluded ? ` ${extras.excluded.length}곳` : ""}</button>
        <button type="button" className="danger-action" disabled={busy || !!previewItinerary} onClick={handleDeleteTrip}>여행 삭제</button>
      </nav>
      {trip.status === "AWAITING_CONFIRMATION" && !previewItinerary && <section className="planner-ready-notice" aria-label="일정 완성 확인"><div><b>일정이 준비됐어요</b><p>먼저 확인하고 마음에 들면 완성을 눌러주세요. 지금도 채팅과 버튼으로 수정할 수 있어요.</p></div><button type="button" disabled={busy || !hasItinerary} onClick={handleConfirm}>{confirming ? "확인 중…" : "완성"}</button></section>}
      {notice && <div className="planner-notice notice-yellow" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="안내 닫기">×</button></div>}
      {previewItinerary && <div className="history-preview-notice planner-preview"><b>v{previewVersion} 과거 버전 · 읽기 전용</b><button type="button" onClick={handleBackToLatest}>최신 일정으로 돌아가기</button></div>}
      <nav className="days">
        {displayedItinerary ? displayedItinerary.days.map((day) => <button key={day.dayNumber} type="button" disabled={busy} className={day.dayNumber === currentDay?.dayNumber ? "active" : ""} onClick={() => selectDay(day.dayNumber)}>DAY {day.dayNumber}<span>{dayZonesLabel(day)}</span></button>)
          : days.map((label, index) => <button key={label} type="button" disabled>DAY {index + 1}<span>{label}</span></button>)}
      </nav>
      <main className={`workspace planner-map-layout${!hasItinerary || chatOpen ? " has-chat" : ""}${showTimeline && selectedStop && !candidates.kind ? " has-place-detail" : ""}`}>
        <ItineraryMap accommodation={displayedItinerary?.accommodation} day={currentDay} selectedOrder={mapSelectedOrder} onShowAll={() => setTimelineSelection(null)} />
        {panel === "budget" && hasItinerary && !history.open ? <BudgetPanel budget={extras.budget} loading={extras.loading} error={extras.budgetError} onRetry={extras.reload} itinerary={itinerary} busy={busy} onOpenMeal={(number, order) => { closeCandidates(); setDayNumber(number); setSelectedOrder(order); setPanel("plan"); }} /> : panel === "excluded" && !history.open ? <ExcludedRestaurants restaurants={extras.excluded} loading={extras.loading} error={extras.excludedError} onRetry={extras.reload} busy={busy} readOnly={!!previewItinerary} removingId={allowingRestaurant} onAllow={handleAllowRestaurant} onClose={() => setPanel("plan")} /> : history.open ? <ItineraryHistory
          versions={history.versions} loading={history.loading} error={history.error}
          currentVersion={itinerary?.version} previewVersion={previewVersion} restoringVersion={restoringVersion}
          onPreview={handlePreviewVersion} onRestore={handleRestoreVersion} onBackToLatest={handleBackToLatest}
          onClose={() => { closeCandidates(); setHistory((previous) => ({ ...previous, open: false })); }}
        /> : showTimeline ? (
          candidates.kind ? (
            candidates.kind === "restaurant" ? <RestaurantCandidates visitDate={currentDay.date} data={candidates.data} loading={candidates.loading} error={candidates.error} replacingId={replacingId} onReplace={handleCandidate} onClose={closeCandidates} />
              : <AttractionCandidates mode={candidates.kind === "add" ? "add" : "replace"} data={candidates.data} loading={candidates.loading} error={candidates.error} replacingId={replacingId} onReplace={handleCandidate} onClose={closeCandidates} />
          ) : selectedStop ? <PlaceDetail
            stop={selectedStop} nextStop={nextStop} readOnly={!!previewItinerary || trip.status === "READY_TO_GENERATE"} busy={busy}
            canDelete={currentDay.stops.length > 1} onDelete={handleDeleteStop}
            warnings={currentDay.warnings}
            visitDate={currentDay.date}
            onBack={() => { setSelectedOrder(null); closeCandidates(); }}
            onOpenCandidates={() => openCandidates("restaurant")}
            onReplaceAlternative={(id) => handleCandidate(id, true)} replacingId={replacingId}
            onOpenAttractionCandidates={() => openCandidates("attraction")}
          /> : <DayTimeline key={`${currentDay.dayNumber}-${displayedItinerary.version}`} day={currentDay}
            accommodation={displayedItinerary.accommodation} onOpenDetail={(stop) => openDetail(stop.order)}
            selectedOrder={mapSelectedOrder} onSelectStop={(stop) => setTimelineSelection({ dayNumber: currentDay.dayNumber, order: stop.order })}
            readOnly={!!previewItinerary || trip.status === "READY_TO_GENERATE"} busy={busy} onReorder={handleReorder} onAdd={(position) => openCandidates("add", position)}
          />
        ) : <PreferencePanel preference={preference} onOpenChat={() => setChatOpen(true)} />}
        <div className="planner-chat-dock" hidden={hasItinerary && !chatOpen}>
        {hasItinerary && <button className="planner-chat-close" type="button" aria-label="AI 대화 닫기" onClick={() => setChatOpen(false)}>×</button>}
        <ChatPanel tripId={tripId} refreshVersion={chatRefreshVersion} initialPrompt={initialPrompt} initialReady={trip.status === "READY_TO_GENERATE"}
          tripStatus={trip.status} disabled={busy} readOnly={!!previewItinerary}
          isOpen={!hasItinerary || chatOpen} onSendStart={acquireMutation} onSendEnd={releaseMutation}
          onTurn={handleTurn} onGenerate={startGeneration} />
        </div>
      </main>
      {conditions && <div className="conditions-backdrop" onClick={(event) => { if (event.target === event.currentTarget && !busy) setConditions(null); }}>
        <section className="conditions-editor setup-card profile-editor" role="dialog" aria-modal="true" aria-labelledby="conditions-title">
          <header><div><small>TRIP PROFILE</small><h2 id="conditions-title">여행 조건 수정</h2><p>여행의 기본 정보를 조정하세요.</p></div><PanelIcon name="luggage" className="profile-header-art"/><button type="button" disabled={busy} onClick={() => setConditions(null)} aria-label="여행 조건 닫기">×</button></header>
          <TripConditionsForm initialValues={conditions} submitLabel="조건 저장하기" onSubmit={saveConditions} variant="planner" onCancel={() => setConditions(null)} />
        </section>
      </div>}
      {generation.status !== "idle" && <GeneratingOverlay key={attempt} error={generation.error} onRetry={startGeneration} onClose={() => setGeneration({ status: "idle", error: null })} />}
    </div>
  );
}

import { useId, useState } from "react";
import useRegions from "../hooks/useRegions";
import { changeRegion, changeBaseCity, toggleDayTrip, validateDestination, shortTrip } from "../utils/regionSelection";
import PanelIcon from "./planner/PanelIcon";
import { tripFormValues } from "../utils/tripEditing";
import { ATTRACTION_SCOPE, RESTAURANT_SCOPE } from "../utils/serviceScope";

import { flightRequestFields, normalizeFlightTime } from "../utils/airportTransfers";
import "../styles/airportTransfers.css";

const errorStyle = { color: "#d64545", fontSize: "0.78rem", margin: "0 0 8px" };

const INTEREST_OPTIONS = [
  { value: "FOOD", label: "현지 음식" },
  { value: "TRADITIONAL", label: "전통 명소" },
  { value: "SHOPPING", label: "쇼핑" },
  { value: "NIGHT_VIEW", label: "야경" },
];

/** 오늘 날짜를 YYYY-MM-DD로 (날짜 선택의 최소값) */
function todayString() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 10);
}

/**
 * 여행 조건 입력 폼
 * - 조건 입력 페이지(새 여행)와 플래너 드로어(조건 수정)에서 함께 사용
 * - onSubmit(payload)는 Promise를 돌려줘야 함 (저장 중 버튼 비활성화, 에러 표시)
 */
export default function TripConditionsForm({
  initialValues,
  submitLabel,
  onSubmit,
  variant = "default",
  onCancel,
}) {
  const [values, setValues] = useState(() => tripFormValues(initialValues));
  const paceHintId = useId();
  const catalogue = useRegions();
  const region = catalogue.regions.find((item) => item.code === values.region);
  const baseCity = region?.cities.find((item) => item.code === values.baseCity);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) =>
    setValues(previous => ({ ...previous, [field]: e.target.value }));

  const toggleInterest = (interest) => {
    const selected = values.interests.includes(interest)
      ? values.interests.filter((i) => i !== interest)
      : [...values.interests, interest];
    setValues({ ...values, interests: selected });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      validateDestination(values, catalogue.regions);
      await onSubmit({
        ...values,
        ...flightRequestFields(values),
        travelers: Number(values.travelers),
        budget: Number(values.budget),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const Fields = variant === "planner" ? "div" : "fieldset";
  const controls = [
        <label key="field-0">
          여행 시작일
          <input
            disabled={loading}
            type="date"
            required
            min={initialValues?.startDate && initialValues.startDate < todayString() ? initialValues.startDate : todayString()}
            value={values.startDate}
            onChange={update("startDate")}
          />
        </label>,
        <label key="field-1">
          여행 종료일
          <input
            disabled={loading}
            type="date"
            required
            min={values.startDate || todayString()}
            value={values.endDate}
            onChange={update("endDate")}
          />
        </label>,
        <label key="field-2">
          인원
          <input
            disabled={loading}
            type="number"
            required
            min={1}
            max={20}
            value={values.travelers}
            onChange={update("travelers")}
          />
        </label>,
        <label key="field-3">
          전체 예산(원)
          <input
            disabled={loading}
            type="number"
            required
            min={0}
            step={10000}
            placeholder="예: 800000"
            value={values.budget}
            onChange={update("budget")}
          />
        </label>,
        <label key="field-4">
          여행 속도
          <select disabled={loading} value={values.travelPace} onChange={update("travelPace")} aria-label="여행 속도" aria-describedby={paceHintId}>
            <option value="RELAXED">여유 · 하루 관광지 3곳 (당일치기 2곳)</option>
            <option value="NORMAL">보통 · 하루 관광지 4곳 (당일치기 3곳)</option>
            <option value="FULL">알차게 · 하루 관광지 5곳 (당일치기 3곳)</option>
          </select>
          <small id={paceHintId}>관광지 수에는 야경 명소도 들어가요. 식당·카페는 따로예요. 첫날·마지막 날은 도착·출발 시간에 따라 줄어요.</small>
        </label>,
        <label key="field-5">
          이동수단
          <select disabled={loading}
            value={values.transportMode}
            onChange={update("transportMode")}
          >
            <option value="PUBLIC_TRANSIT">대중교통</option>
            <option value="RENTAL_CAR">렌트카</option>
          </select>
        </label>,
        <label key="field-6" className="full-span">
          숙소 이름
          <input
            disabled={loading}
            type="text"
            required
            maxLength={255}
            placeholder="예약한 숙소 이름"
            value={values.accommodationName}
            onChange={update("accommodationName")}
          />
        </label>,
        <label key="field-7" className="full-span">
          숙소 주소
          <input
            disabled={loading}
            type="text"
            required
            maxLength={500}
            placeholder="예약 내역의 일본어 또는 영어 주소"
            value={values.accommodationAddress}
            onChange={update("accommodationAddress")}
          />
          <small className="accommodation-scope-note">선택한 숙소 도시와 같은 도시의 정확한 주소를 입력해주세요.</small>
        </label>,
      <label key="field-8">
        음식 알레르기·제외 식품
        <input
            disabled={loading}
          type="text"
          maxLength={500}
          placeholder="예: 갑각류 제외"
          value={values.allergies}
          onChange={update("allergies")}
        />
      </label>,
      <label key="field-9">
        이동 제약
        <textarea
          disabled={loading}
          maxLength={500}
          placeholder="예: 하루 도보 12km 이내, 계단 많은 곳 피하기"
          value={values.mobilityConstraints}
          onChange={update("mobilityConstraints")}
        />
      </label>
  ];
  const flights = <section className="trip-flight-section profile-form-group"><h3><PanelIcon name="TRANSIT"/>공항과 비행기 시각 <span>선택</span></h3><p className="trip-flight-note">일본 현지 시각으로 입력해주세요. 비행기 시각을 입력하면 공항 이동과 숙소에 짐을 맡기고 찾는 흐름을 일정에 반영해요.</p><div className="trip-flight-grid">{[{key:'arrival',label:'도착',time:'비행기 도착 시각'},{key:'departure',label:'출발',time:'비행기 출발 시각'}].map(flight => <div className="trip-flight-pair" key={flight.key}><label>{flight.label} 공항<select aria-label={`${flight.label} 공항`} disabled={loading || !region} value={values[`${flight.key}Airport`]} onChange={update(`${flight.key}Airport`)}><option value="">선택 안 함</option>{region?.airports.map((airport) => <option key={airport.code} value={airport.code}>{airport.label} ({airport.code})</option>)}</select></label><label>{flight.time}<input disabled={loading} type="text" inputMode="numeric" maxLength={5} placeholder="예: 09:30" aria-describedby="flight-time-format" value={values[`${flight.key}FlightTime`]} onChange={update(`${flight.key}FlightTime`)} onBlur={()=>setValues(previous=>({...previous,[`${flight.key}FlightTime`]:normalizeFlightTime(previous[`${flight.key}FlightTime`])}))}/></label></div>)}</div><p className="trip-flight-note">공항만 선택하고 시각은 비워둬도 돼요. 이동 시간은 대표값을 사용한 예상치예요.</p><p className="trip-flight-note" id="flight-time-format">24시간제로 입력해주세요. 예: 09:30 또는 0930</p></section>;
  const regionPicker = <section className="destination-section profile-form-group">
    <h3><PanelIcon name="pin" />여행할 권역</h3>
    {catalogue.loading && <p role="status">권역과 도시를 불러오고 있어요…</p>}
    {catalogue.error && <div role="alert"><p>{catalogue.error}</p><button type="button" onClick={catalogue.reload}>목록 다시 불러오기</button></div>}
    <label>권역<select aria-label="권역" required value={values.region} disabled={loading || catalogue.loading || !!catalogue.error} onChange={(event) => setValues(previous => changeRegion(previous, catalogue.regions.find(item => item.code === event.target.value)))}>
      <option value="">여행할 권역을 골라주세요</option>
      {catalogue.regions.map(item => {
        const cities = item.cities.map(city => city.label).filter(Boolean);
        const examples = cities.slice(0, 3).join(" · ");
        return <option key={item.code} value={item.code}>
          {item.label}{examples && ` — ${examples}${cities.length > 3 ? " 등" : ""}`}
        </option>;
      })}
    </select></label>
  </section>;
  const cityPicker = <label className="base-city-picker">숙소 도시<select aria-label="숙소 도시" required value={values.baseCity} disabled={loading || !region} onChange={event => setValues(previous => changeBaseCity(previous, event.target.value))}>
    <option value="">숙소 도시를 골라주세요</option>
    {region?.cities.map(city => <option key={city.code} value={city.code}>{city.label}</option>)}
  </select></label>;
  const dayTripPicker = <fieldset className="day-trip-picker" disabled={loading || !baseCity}>
    <legend>당일치기 도시 <span>선택 · 최대 3곳</span></legend>
    <p>선택한 순서대로 일정을 준비해요. 역 간 편도 요금은 어른 1인 기준이에요.</p>
    {shortTrip(values.startDate, values.endDate) && <p className="destination-notice">여행이 이틀 이하면 당일치기는 일정에 들어가지 않아요. 첫날과 마지막 날은 숙소 도시에서 보내요.</p>}
    {!baseCity ? <p>숙소 도시를 먼저 골라주세요.</p> : !baseCity.dayTrips?.length ? <p>이 숙소 도시에서 제공하는 당일치기 후보가 없어요.</p> : <div className="day-trip-options">{baseCity.dayTrips.map(trip => {
      const index = values.dayTripCities.indexOf(trip.city);
      return <label key={trip.city} className={index >= 0 ? 'is-selected' : ''}>
        <input type="checkbox" checked={index >= 0} disabled={loading || (index < 0 && values.dayTripCities.length >= 3)} onChange={() => setValues(previous => toggleDayTrip(previous, trip.city))} />
        <span><b>{trip.label}{index >= 0 && <em>{index + 1}순위</em>}</b><small>{trip.route} 약 {trip.minutes}분 · 편도 {trip.fareYen?.toLocaleString()}엔</small><small>{trip.fromStation} → {trip.toStation}</small></span>
      </label>;
    })}</div>}
  </fieldset>;
  const interests = (
      <fieldset className="trip-interest-options">
        <legend>관심사</legend>
        <div className="trip-interest-list">
        {INTEREST_OPTIONS.map((option) => (
          <label key={option.value}>
            <input
            disabled={loading}
              type="checkbox"
              checked={values.interests.includes(option.value)}
              onChange={() => toggleInterest(option.value)}
            />{" "}
            {option.label}
          </label>
        ))}
        </div>
      </fieldset>


  );
  return (
    <form className={'conditions-form setup-form' + (variant === 'planner' ? ' profile-form' : '')} onSubmit={handleSubmit}>
      <Fields className="conditions-fields" {...(variant === "planner" ? {} : { disabled: loading })}>
        <div className={variant === "planner" ? "profile-fields-layout" : "conditions-fields-layout"}>
        {variant === "planner" ? (
          <div className="profile-form-body">
            <div className="profile-scope"><PanelIcon name="pin"/><div><p>{ATTRACTION_SCOPE}</p><p>{RESTAURANT_SCOPE}</p></div></div>
            <section className="profile-form-group"><h3><PanelIcon name="calendar"/>일정과 예산</h3><div className="profile-field-grid">{controls.slice(0, 4)}</div></section>
            <section className="profile-form-group"><h3><PanelIcon name="TRANSIT"/>여행 방식</h3><div className="profile-field-grid travel-method-fields">{controls.slice(4, 6)}</div></section>
            {regionPicker}
            {flights}
            <section className="profile-form-group"><h3><PanelIcon name="bed"/>숙소</h3><div className="profile-field-grid">{cityPicker}{controls.slice(6, 8)}</div></section>
            {dayTripPicker}
            <section className="profile-form-group profile-interests"><h3><PanelIcon name="heart"/>관심사와 참고 사항</h3>{interests}<div className="profile-field-grid">{controls.slice(8)}</div></section>
            {error && <p className="profile-form-error" role="alert">{error}</p>}
          </div>
        ) : (
          <>
            <section id="setup-basics" className="setup-group">
              <h2>일정과 예산</h2>
              <div className="form-grid">{controls.slice(0, 4)}</div>
            </section>
            <section id="setup-destination" className="setup-group">
              <h2>여행지와 숙소</h2>
              {regionPicker}{flights}
              <section className="destination-section"><h3>숙소</h3><div className="form-grid">{cityPicker}{controls.slice(6, 8)}</div></section>
              {dayTripPicker}
            </section>
            <section id="setup-preferences" className="setup-group">
              <h2>여행 취향</h2>
              <div className="form-grid travel-method-fields">{controls.slice(4, 6)}</div>
              {interests}{controls.slice(8)}
            </section>
            <p className="setup-edit-note">저장한 뒤에도 플래너의 ‘여행 조건’에서 수정할 수 있어요.</p>
            {error && <p style={errorStyle} role="alert">{error}</p>}
          </>
        )}
        <div className={variant === "planner" ? "profile-form-footer" : "conditions-submit-row"}>
          {onCancel && <button type="button" className="profile-cancel" onClick={onCancel} disabled={loading}>취소</button>}
          <button className="primary setup-submit" type="submit" disabled={loading || catalogue.loading || !!catalogue.error}>{loading ? "저장 중..." : submitLabel}</button>
        </div>
        </div>
      </Fields>
    </form>
  );
}

import { useState } from "react";
import PanelIcon from "./planner/PanelIcon";
import { tripFormValues } from "../utils/tripEditing";
import { ATTRACTION_SCOPE, RESTAURANT_SCOPE } from "../utils/serviceScope";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) =>
    setValues({ ...values, [field]: e.target.value });

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
      await onSubmit({
        ...values,
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
          <select disabled={loading} value={values.travelPace} onChange={update("travelPace")}>
            <option value="NORMAL">보통 · 하루 4곳</option>
            <option value="RELAXED">여유 · 하루 3곳</option>
            <option value="FULL">알차게 · 하루 5곳</option>
          </select>
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
            placeholder="예: 호텔 그레이서리 신주쿠"
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
            placeholder="일본어 또는 영어 주소 (예: 東京都新宿区歌舞伎町1-19-1)"
            value={values.accommodationAddress}
            onChange={update("accommodationAddress")}
          />
          <small className="accommodation-scope-note">관광지 지원 범위에는 고토(오다이바·도요스)와 스미다(스카이트리 주변)도 포함돼요. 숙소의 정확한 주소를 입력해주세요.</small>
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
  const interests = (
      <fieldset>
        <legend>관심사</legend>
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
            <section className="profile-form-group"><h3><PanelIcon name="TRANSIT"/>여행 방식</h3><div className="profile-field-grid">{controls.slice(4, 6)}</div></section>
            <section className="profile-form-group"><h3><PanelIcon name="bed"/>숙소</h3><div className="profile-field-grid">{controls.slice(6, 8)}</div></section>
            <section className="profile-form-group profile-interests"><h3><PanelIcon name="heart"/>관심사와 참고 사항</h3>{interests}<div className="profile-field-grid">{controls.slice(8)}</div></section>
            {error && <p className="profile-form-error" role="alert">{error}</p>}
          </div>
        ) : (
          <>
            <div className="trip-service-scope"><p>{ATTRACTION_SCOPE}</p><p>{RESTAURANT_SCOPE}</p></div>
            <div className="form-grid">{controls.slice(0, 8)}</div>
            {interests}{controls.slice(8)}
            {error && <p style={errorStyle} role="alert">{error}</p>}
          </>
        )}
        <div className={variant === "planner" ? "profile-form-footer" : "conditions-submit-row"}>
          {onCancel && <button type="button" className="profile-cancel" onClick={onCancel} disabled={loading}>취소</button>}
          <button className="primary setup-submit" type="submit" disabled={loading}>{loading ? "저장 중..." : submitLabel}</button>
        </div>
        </div>
      </Fields>
    </form>
  );
}

import { useState } from "react";
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

  return (
    <form className="conditions-form setup-form" onSubmit={handleSubmit}>
      <div className="trip-service-scope"><p>{ATTRACTION_SCOPE}</p><p>{RESTAURANT_SCOPE}</p></div>
      <fieldset className="conditions-fields" disabled={loading}>
      <div className="form-grid">
        <label>
          여행 시작일
          <input
            type="date"
            required
            min={initialValues?.startDate && initialValues.startDate < todayString() ? initialValues.startDate : todayString()}
            value={values.startDate}
            onChange={update("startDate")}
          />
        </label>
        <label>
          여행 종료일
          <input
            type="date"
            required
            min={values.startDate || todayString()}
            value={values.endDate}
            onChange={update("endDate")}
          />
        </label>
        <label>
          인원
          <input
            type="number"
            required
            min={1}
            max={20}
            value={values.travelers}
            onChange={update("travelers")}
          />
        </label>
        <label>
          전체 예산(원)
          <input
            type="number"
            required
            min={0}
            step={10000}
            placeholder="예: 800000"
            value={values.budget}
            onChange={update("budget")}
          />
        </label>
        <label>
          여행 속도
          <select value={values.travelPace} onChange={update("travelPace")}>
            <option value="NORMAL">보통 · 하루 4곳</option>
            <option value="RELAXED">여유 · 하루 3곳</option>
            <option value="FULL">알차게 · 하루 5곳</option>
          </select>
        </label>
        <label>
          이동수단
          <select
            value={values.transportMode}
            onChange={update("transportMode")}
          >
            <option value="PUBLIC_TRANSIT">대중교통</option>
            <option value="RENTAL_CAR">렌트카</option>
          </select>
        </label>
        <label className="full-span">
          숙소 이름
          <input
            type="text"
            required
            maxLength={255}
            placeholder="예: 호텔 그레이서리 신주쿠"
            value={values.accommodationName}
            onChange={update("accommodationName")}
          />
        </label>
        <label className="full-span">
          숙소 주소
          <input
            type="text"
            required
            maxLength={500}
            placeholder="일본어 또는 영어 주소 (예: 東京都新宿区歌舞伎町1-19-1)"
            value={values.accommodationAddress}
            onChange={update("accommodationAddress")}
          />
          <small className="accommodation-scope-note">관광지 지원 범위에는 고토(오다이바·도요스)와 스미다(스카이트리 주변)도 포함돼요. 숙소의 정확한 주소를 입력해주세요.</small>
        </label>
      </div>

      <fieldset>
        <legend>관심사</legend>
        {INTEREST_OPTIONS.map((option) => (
          <label key={option.value}>
            <input
              type="checkbox"
              checked={values.interests.includes(option.value)}
              onChange={() => toggleInterest(option.value)}
            />{" "}
            {option.label}
          </label>
        ))}
      </fieldset>

      <label>
        음식 알레르기·제외 식품
        <input
          type="text"
          maxLength={500}
          placeholder="예: 갑각류 제외"
          value={values.allergies}
          onChange={update("allergies")}
        />
      </label>
      <label>
        이동 제약
        <textarea
          maxLength={500}
          placeholder="예: 하루 도보 12km 이내, 계단 많은 곳 피하기"
          value={values.mobilityConstraints}
          onChange={update("mobilityConstraints")}
        />
      </label>

      {error && <p style={errorStyle}>{error}</p>}
      <button className="primary setup-submit" type="submit" disabled={loading}>
        {loading ? "저장 중..." : submitLabel}
      </button>
      </fieldset>
    </form>
  );
}

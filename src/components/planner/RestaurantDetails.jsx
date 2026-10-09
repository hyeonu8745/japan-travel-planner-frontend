import AttractionDetails from "./AttractionDetails";
import { getRestaurantDetails, getRestaurantPhoto } from "../../api/restaurants";
import { genreLabel, holidayLabel } from "../../utils/itineraryFormat";

async function loadDetails(id, options) {
  const restaurant = await getRestaurantDetails(id, options);
  const matched = restaurant.googleStatus === "MATCHED" && !!restaurant.google;
  return { ...(matched ? restaurant.google : {}), name: restaurant.name, restaurant, hasGoogle: matched,
    attribution: matched ? restaurant.attribution || "Google Maps" : null, reviewNotice: restaurant.reviewNotice };
}

const value = (text) => text && text !== "-" ? text : "정보 없음";

export default function RestaurantDetails({ restaurantId, fallbackName, visitDate, children, onReplace, readOnly = false, busy = false }) {
  return <AttractionDetails key={restaurantId} attractionId={restaurantId} fallbackName={fallbackName} visitDate={visitDate}
    loadDetails={loadDetails} loadPhoto={getRestaurantPhoto} detailTitle="식당 상세 정보" photoAlt="식당 사진"
    loadingText="식당 정보를 불러오고 있어요. 처음 확인하는 식당은 조금 더 걸릴 수 있어요."
    renderIntro={({ details, onReload: reload }) => {
      const data = details.restaurant, tabelog = data.tabelog ?? {}, google = details.hasGoogle ? data.google : null;
      const features = google?.features;
      const min = features?.priceMinYen, max = features?.priceMaxYen;
      const yen = (amount) => `¥${amount.toLocaleString("ko-KR")}`;
      const googlePrice = min != null && max != null ? `${yen(min)} ~ ${yen(max)}`
        : min != null ? `${yen(min)} 이상` : max != null ? `${yen(max)} 이하` : null;
      return <>
        <h3>{google?.localizedName || data.name || fallbackName}</h3>
        <p className="google-original-name">{genreLabel(data.genre)}{data.address && ` · ${data.address}`}</p>
        <div className="restaurant-detail-ratings">
          <div><span>타베로그</span><b>{tabelog.rating ?? "정보 없음"}</b>{tabelog.reviewCount != null && <small>리뷰 {tabelog.reviewCount.toLocaleString()}개</small>}</div>
          {google && <div><span>Google</span><b>{google.rating ?? "정보 없음"}</b>{google.userRatingCount != null && <small>리뷰 {google.userRatingCount.toLocaleString()}개</small>}</div>}
        </div>
        {google && <p className="data-notice">두 서비스의 평점 기준은 달라 숫자를 직접 비교하기 어려워요. 타베로그는 3.5 이상이면 높은 편이에요.</p>}
        {google?.summary && <p className="google-place-summary">{google.summary}</p>}
        {features?.labels?.length > 0 && <section className="restaurant-features" aria-label="식당 특성">
          <h4>식당 특성</h4>
          <ul>{features.labels.map((label, index) => <li key={index} className={label === "현금만" ? "cash-only" : ""}>
            {label === "현금만" && <span aria-hidden="true">⚠ </span>}{label}
          </li>)}</ul>
        </section>}
        <dl className="restaurant-detail-facts">
          <div><dt>타베로그 점심</dt><dd>{value(tabelog.budgetLunch)}</dd></div>
          <div><dt>타베로그 저녁</dt><dd>{value(tabelog.budgetDinner)}</dd></div>
          {googlePrice && <div><dt>Google 가격대</dt><dd>{googlePrice}<small className="restaurant-price-unit">1인 기준</small></dd></div>}
          <div><dt>정기 휴일</dt><dd>{tabelog.holiday && tabelog.holiday !== "-" ? holidayLabel(tabelog.holiday) : "정보 없음"}</dd></div>
          <div><dt>가까운 역</dt><dd>{value(tabelog.nearestStation)}{tabelog.nearestStation && tabelog.nearestDistance != null && ` · ${tabelog.nearestDistance}m`}</dd></div>
        </dl>
        <p className="data-notice">타베로그 등록 정보는 과거 데이터로 현재와 다를 수 있어요. 영업시간은 방문 전에 확인해주세요.</p>
        {!google && <div className={data.googleStatus === "CLOSED" ? "restaurant-google-warning" : "notice-yellow"} role="status">
          {data.googleMessage && <p>{data.googleMessage}</p>}
          {data.googleStatus === "UNCHECKED" && <button type="button" onClick={reload}>다시 시도</button>}
          {data.googleStatus === "CLOSED" && !readOnly && onReplace && <button type="button" className="tabi-button tabi-button-primary" disabled={busy} onClick={onReplace}>다른 식당으로 교체</button>}
        </div>}
      </>;
    }}>{children}</AttractionDetails>;
}

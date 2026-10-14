import PlaceArtwork from './PlaceArtwork';
import PanelIcon from './PanelIcon';
import '../../styles/excludedDesign.css';

export default function ExcludedRestaurants({ restaurants, loading, error, onRetry, onAllow, busy, readOnly, removingId, onClose }) {
  return <section className="detail excluded-restaurants excluded-panel">
    <header className="excluded-heading"><div><small>YOUR RESTAURANT CHOICES</small><h2>다시 추천하지 않는 식당{restaurants && <span className="excluded-count">{restaurants.length}곳</span>}</h2><p>다른 곳으로 바꾼 식당을 이 여행에서 기억해요.</p></div><button type="button" className="excluded-close" onClick={onClose} aria-label="식당 목록 닫기">×</button></header>
    <div className="excluded-content">
      <div className="excluded-intro"><span><PanelIcon name="food"/></span><p>이 목록의 식당은 교체 후보와 새 일정에서 추천하지 않아요.<br/>다시 가고 싶다면 아래에서 추천을 허용해주세요.</p></div>
      {loading ? <div className="excluded-state" role="status"><PanelIcon name="clock"/><p>목록을 불러오고 있어요…</p></div> : error ? <div className="excluded-state excluded-error" role="alert"><PanelIcon name="info"/><p>{error}</p><button type="button" onClick={onRetry}>다시 불러오기</button></div> : restaurants?.length === 0 ? <div className="excluded-empty"><span className="excluded-empty-icon"><PanelIcon name="food"/><i><PanelIcon name="check"/></i></span><h3>아직 제외한 식당이 없어요</h3><p>일정에서 다른 식당으로 바꾸면<br/>이곳에 모아서 보여드릴게요.</p><button type="button" onClick={onClose}>일정으로 돌아가기 →</button></div> : <ul className="excluded-list">{restaurants?.map(restaurant => <li key={restaurant.restaurantId}><span className="excluded-art"><PlaceArtwork place={restaurant} type="LUNCH"/></span><div className="excluded-copy"><h3>{restaurant.nameKo || restaurant.name}</h3>{restaurant.nameKo && <small>{restaurant.name}</small>}{restaurant.genreLabels?.length > 0 && <div className="excluded-genres">{restaurant.genreLabels.map((genre,index) => <span key={`${genre}:${index}`}>{genre}</span>)}</div>}</div><button className="excluded-allow" type="button" disabled={busy || readOnly || removingId != null} onClick={() => onAllow(restaurant.restaurantId)}><PanelIcon name="history"/>{removingId === restaurant.restaurantId ? '처리 중…' : '다시 추천'}</button></li>)}</ul>}
      <div className="excluded-help"><PanelIcon name="info"/><p>다시 추천을 허용해도 현재 일정은 바뀌지 않아요.<br/>이전 식당으로 돌아가려면 식당 상세의 되돌리기를 사용해주세요.</p></div>
    </div>
  </section>;
}

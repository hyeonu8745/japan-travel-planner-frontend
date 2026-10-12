import PlaceArtwork from './PlaceArtwork';

export default function ExcludedRestaurants({ restaurants, loading, error, onRetry, onAllow, busy, readOnly, removingId, onClose }) {
  return <section className="detail excluded-restaurants"><header><div><small>YOUR CHOICES</small><h2>다시 추천하지 않는 식당 {restaurants ? `${restaurants.length}곳` : ''}</h2><p>다른 곳으로 바꾼 식당은 이 여행에서 다시 추천하지 않아요.</p></div><button type="button" onClick={onClose}>닫기</button></header>
    <div className="body">{loading && <p role="status">목록을 불러오고 있어요…</p>}{error && <div role="alert"><p>{error}</p><button type="button" onClick={onRetry}>다시 불러오기</button></div>}
      {!loading && !error && restaurants?.length === 0 && <p>다시 추천하지 않는 식당이 없어요.</p>}
      <ul>{restaurants?.map((restaurant) => <li key={restaurant.restaurantId}><PlaceArtwork place={restaurant} type="LUNCH"/><div><h3>{restaurant.nameKo || restaurant.name}</h3>{restaurant.nameKo && <small>{restaurant.name}</small>}<p>{restaurant.genreLabels?.join(' · ')}</p></div><button type="button" disabled={busy || readOnly} onClick={() => onAllow(restaurant.restaurantId)}>{removingId === restaurant.restaurantId ? '처리 중…' : '다시 추천'}</button></li>)}</ul>
      <p className="food-budget-note">다시 추천을 허용해도 현재 일정은 바뀌지 않아요. 이전 식당으로 돌아가려면 식당 상세의 되돌리기를 사용해주세요.</p>
    </div></section>;
}

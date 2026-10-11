import { ARTWORK_CATALOGUE } from './artworkCatalogue.js';

const normalize = (value) => String(value ?? '').normalize('NFKC').toLowerCase().replace(/[\s·・\-_/()（）]/g, '');
const food = ARTWORK_CATALOGUE.filter((item) => item.kind === 'food');
const attractions = ARTWORK_CATALOGUE.filter((item) => item.kind === 'attractions');
const foodAliases = new Map(food.flatMap((item) => item.aliases.map((alias) => [normalize(alias), item])));

export function foodArtworkKey(restaurant) {
  const supplied = Array.isArray(restaurant?.genreLabels) ? restaurant.genreLabels.filter(Boolean) : [];
  const labels = supplied.length ? supplied : String(restaurant?.genre ?? '').split(/[,、，;；]/);
  const parts = labels.flatMap((label) => foodAliases.has(normalize(label)) ? [label] : String(label).split(/[,、，;；·・|｜/]/));
  const matches = parts.map((label) => {
    const exact = foodAliases.get(normalize(label));
    const parent = normalize(String(label).replace(/[（(][^）)]*[）)]/g, '')).replace(/^(기타|その他)/, '').replace(/(기타|その他)$/, '');
    return exact ?? foodAliases.get(parent);
  }).filter(Boolean);
  return (matches.find((item) => !item.generic) ?? matches[0])?.key ?? null;
}

// Reviewed venues take precedence over broad labels (e.g. a ninja museum is an experience).
const VENUES = [
  [/^(東京駅|도쿄역|Tokyo Station)$/i, 'station'],
  [/^(Samurai Ninja Museum Asakusa Tokyo|사무라이 닌자 뮤지엄 아사쿠사 도쿄)$/i, 'experience'],
  [/^(Chopsticks Studio Asakusa|찹스틱스 스튜디오 아사쿠사)$/i, 'workshop'],
  [/^(平将門塚|将門塚|다이라노 마사카도즈카|타이라노 마사카도.*|Taira no Masakado.*)$/i, 'memorial'],
  [/^(外苑いちょう並木|神宮外苑いちょう並木|가이엔 은행나무길|메이지.*은행나무.*)$/i, 'ginkgo'],
];
const NAME_CATEGORIES = [
  ['mosque', /모스크|이슬람\s*사원|자미이|ジャーミイ|モスク|mosque|camii/i],
  ['figure-shop', /피규어|フィギュア|figure(?:s)?\b|SOOTANG\s*HOBBY|수탕\s*하비|수탱\s*하비|소탕\s*하비|スータンホビー|ホビーショップ|아미아미|あみあみ|amiami|코토부키야|コトブキヤ|kotobukiya|보크스|ボークス|volks|TAMASHII|타마시.*네이션|라신반|らしんばん|만다라케|まんだらけ|mandarake|스루가야|수루가야|駿河屋/i],
  ['anime', /애니메이트|アニメイト|animate\b|애니메이션|만화.*(?:샵|상점)|アニメショップ/i],
  ['crossing', /스크램블.*교차로|スクランブル交差点|scramble crossing|교차로|交差点/i],
  ['ginkgo', /은행나무|いちょう並木|イチョウ並木|ginkgo/i],
  ['memorial', /마사카도.*즈카|将門塚|묘소|기념비|memorial|grave\b/i],
  ['media-art', /팀랩|チームラボ|teamlab|미디어\s*아트|디지털\s*아트/i],
  ['aquarium', /수족관|水族館|aquarium/i], ['zoo', /동물원|動物園|\bzoo\b/i],
  ['amusement', /놀이공원|테마파크|遊園地|amusement park|theme park|디즈니랜드|ディズニーランド/i],
  ['science', /과학관|천문관|科学館|プラネタリウム|planetarium/i],
  ['art-museum', /미술관|美術館|art museum|갤러리|gallery/i],
  ['bookstore', /서점|책방|書店|bookstore/i], ['arcade', /게임센터|오락실|ゲームセンター|game center/i],
  ['electronics', /전자상가|전기상가|電気街|요도바시|ヨドバシ|yodobashi|빅카메라|ビックカメラ/i],
  ['theater', /가부키|歌舞伎|극장|劇場|theatre|theater/i],
  ['church', /성당|교회|教会|cathedral|church/i],
  ['onsen', /온천|목욕탕|温泉|銭湯|onsen/i], ['ryokan', /료칸|旅館|ryokan/i],
  ['waterfall', /폭포|waterfall|滝$/i], ['lake', /호수|湖$|\blake\b/i],
  ['beach', /해변|海浜|ビーチ|\bbeach\b/i], ['bridge', /교량|대교|브리지|\bbridge\b|橋$/i],
  ['shrine', /신사|神社|神宮|\bshrine\b/i], ['temple', /사찰|寺院|寺$|\btemple\b/i],
  ['garden', /정원|庭園|\bgarden\b/i], ['park', /공원|公園|\bpark\b/i],
  ['tower', /스카이트리|スカイツリー|skytree|도쿄타워|東京タワー|tokyo tower|전망대|展望台/i],
  ['department-store', /백화점|百貨店|쇼핑몰|shopping mall/i],
];
const PRIORITY = ['figure-shop','media-art','tea-ceremony','kimono','workshop','experience','aquarium','zoo','science','art-museum','amusement','ginkgo','flowers','crossing','mosque','church','shrine','temple','castle','garden','tower','department-store','fashion','arcade','electronics','bookstore','historic-town','bridge','waterfall','lake','river','mountain','forest','beach','island','onsen','ryokan','theater','fireworks','festival','brewery','cruise','railway','sports','ski','outdoor','station','anime','market','museum','culture','park','architecture','shopping','waterfront','street','scenic','night','memorial','landmark'];
const orderedAttractions = [...attractions].sort((a,b) => PRIORITY.indexOf(a.key) - PRIORITY.indexOf(b.key));
export function attractionArtworkKey(place) {
  const names = [place?.name, place?.nameKo].filter(Boolean);
  for (const [pattern,key] of VENUES) if (names.some((name) => pattern.test(name.trim()))) return key;
  const named = NAME_CATEGORIES.find(([,pattern]) => pattern.test(names.join(' ')));
  if (named) return named[0];
  const labels = (Array.isArray(place?.labels) ? place.labels : []).map(normalize);
  return orderedAttractions.find((item) => item.aliases.some((alias) => {
    const term = normalize(alias);
    return labels.some((label) => label === term || (term.length >= 2 && label.includes(term)));
  }))?.key ?? null;
}
export function placeArtwork(place, type = 'ATTRACTION') {
  const meal = type !== 'ATTRACTION';
  const key = meal ? foodArtworkKey(place) : attractionArtworkKey(place);
  return `/assets/${meal ? 'food-v2' : 'attractions-v2'}/${key ?? (meal ? 'dining' : 'landmark')}.png`;
}

export const DAY_HEADERS = {
  ASAKUSA_UENO: 'asakusa-ueno', GINZA_TOKYO: 'ginza-tokyo', AKIHABARA_KANDA: 'akihabara-kanda',
  SHINJUKU: 'shinjuku', SHIBUYA_HARAJUKU: 'shibuya-harajuku', ROPPONGI_TOWER: 'roppongi-tower', ODAIBA: 'odaiba',
};
export function dayHeaderArtwork(day) {
  const key = DAY_HEADERS[day?.zone] ?? (day?.zones ?? []).map((zone) => DAY_HEADERS[zone]).find(Boolean);
  return key ? `/assets/regions-v2/${key}.png` : null;
}

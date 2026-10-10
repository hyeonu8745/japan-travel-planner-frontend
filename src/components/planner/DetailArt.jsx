import PanelIcon from "./PanelIcon";

const details = {
  info: "basic-info", reviews: "reviews", calendar: "reservation",
  leaf: "vegetarian", card: "payment", people: "family", coffee: "coffee",
  wine: "wine", bag: "takeout", warning: "warning",
};
const itinerary = {
  clock: "duration", pin: "visits", WALK: "walk", TRANSIT: "transit",
  DRIVE: "drive", food: "restaurant",
};

export default function DetailArt({ name, className = "" }) {
  const asset = details[name] || itinerary[name];
  if (!asset) return <PanelIcon name={name} className={className} />;
  const folder = details[name] ? "details-v1" : "itinerary-v1";
  return <img className={`detail-art-icon ${className}`} src={`/assets/${folder}/${asset}.png`} alt="" aria-hidden="true" />;
}

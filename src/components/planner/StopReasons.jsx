export default function StopReasons({ reasons }) {
  if (!reasons?.length) return null;
  return <ul className="stop-reasons" aria-label="고른 이유">{[...reasons.filter(reason => reason.code === "MUST_SEE"), ...reasons.filter(reason => reason.code !== "MUST_SEE")].slice(0, 3).map((reason, index) => <li key={index} className={["INTEREST", "FOOD_PREFER", "WISH", "MUST_SEE"].includes(reason.code) ? "is-emphasis" : ""}>{reason.label}</li>)}</ul>;
}

import DetailArt from "./DetailArt";
export function ReviewFindings({ findings }) {
  if (!findings?.length) return null;
  return <ul className="review-experiences">{findings.map((finding, index) => <li key={index} className={finding.caution ? "is-caution" : "is-positive"}>
    <b>{finding.label}</b>{finding.evidence && <blockquote>{finding.evidence}</blockquote>}
  </li>)}</ul>;
}

export default function ReviewInsights({ insights, reviews = [], idPrefix }) {
  if (!insights) return null;
  const analyzed = insights.analyzedReviewCount > 0;
  const hasFindings = (insights.findings ?? []).length > 0;
  const findings = analyzed ? (insights.findings ?? []).filter((finding) => Number.isInteger(finding.reviewIndex) && reviews[finding.reviewIndex] && !reviews[finding.reviewIndex].translated) : [];
  return <section className="review-insights" aria-label="한국인 리뷰에서 찾은 경험">
    {analyzed && <><h4><DetailArt name="reviews" />한국인 리뷰에서 찾은 경험 <small>AI 참고</small></h4>
      {!hasFindings && <p className="review-insight-empty">한국인 리뷰 {insights.analyzedReviewCount}개에서 특별히 눈에 띄는 경험은 찾지 못했어요</p>}
      {hasFindings && insights.counts?.length > 0 && <ul className="review-insight-counts">{insights.counts.map((count, index) => <li key={index} className={count.caution ? "is-caution" : "is-positive"}>{count.label} · {count.count}개 리뷰</li>)}</ul>}
      {findings.length > 0 && <ul className="review-insight-evidence">{findings.map((finding, index) => <li key={index} className={finding.caution ? "is-caution" : "is-positive"}>
        <a href={`#${idPrefix}-${finding.reviewIndex}`}>리뷰 {finding.reviewIndex + 1}에 적힌 {finding.label}</a>
        {finding.evidence && <blockquote>{finding.evidence}</blockquote>}
      </li>)}</ul>}
    </>}
    <p className="google-review-notice">{insights.notice}</p>
  </section>;
}

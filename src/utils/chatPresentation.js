// Turn numbered server text into selectable rows without inventing candidate data.
export function chatOptions(content) {
  return String(content ?? '').split('\n').flatMap((line) => {
    const match = line.match(/^\s*(\d+)[.)、]\s*(.+)$/);
    if (!match) return [];
    const text = match[2];
    const bracket = text.match(/^(.*?)\s*[（(](.+)[）)]\s*$/);
    const detail = bracket?.[2] ?? '';
    return [{ number: match[1], text, name: bracket?.[1]?.trim() || text, detail,
      genreLabels: detail ? [detail.split(/[·|｜]/)[0].trim()] : [] }];
  });
}

export function chatMessageTime(createdAt) {
  if (!createdAt) return '';
  const match = String(createdAt).match(/T(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : '';
}

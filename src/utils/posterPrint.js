export async function printPosterPages(pages) {
  const iframe = document.createElement('iframe');
  iframe.title = '여행 포스터 인쇄'; iframe.style.cssText = 'position:fixed;width:1px;height:1px;left:-9999px;border:0';
  document.body.append(iframe);
  const doc = iframe.contentDocument; doc.open();
  doc.write('<!doctype html><html lang="ko"><head><title>TabiMate 여행 포스터</title><style>@page{size:A4 portrait;margin:0}html,body{margin:0;padding:0}.sheet{width:210mm;height:297mm;page-break-after:always;break-after:page}.sheet:last-child{page-break-after:auto;break-after:auto}img{display:block;width:100%;height:100%;object-fit:contain}*{box-sizing:border-box}</style></head><body></body></html>'); doc.close();
  const cleanup = () => iframe.remove();
  try {
    await Promise.all([...pages].sort((a, b) => a.pageNo - b.pageNo).map((page) => new Promise((resolve, reject) => {
      const sheet = doc.createElement('div'); sheet.className = 'sheet'; const img = doc.createElement('img'); img.alt = `${page.pageNo}장`;
      img.onload = resolve; img.onerror = () => reject(new Error('인쇄할 이미지를 불러오지 못했어요. 다시 시도해주세요.'));
      sheet.append(img); doc.body.append(sheet); img.src = page.url;
    })));
    iframe.contentWindow.addEventListener('afterprint', cleanup, { once: true });
    iframe.contentWindow.focus(); iframe.contentWindow.print();
  } catch (error) { cleanup(); throw error; }
}

export interface ParsedIssue {
  title: string;
  issue_type: 'ongoing' | 'limited' | 'oneshot' | 'comment';
  year?: string | null;
  note?: string | null;
  is_noncanon?: number;
}

export interface ParsedReadingOrder {
  title: string;
  slug: string;
  universe_slug: 'marvel' | 'dc' | 'other';
  category_slug: 'events' | 'characters' | 'master' | 'series';
  description: string;
  year_published: string;
  featured_characters: string;
  previous_event_title: string;
  previous_event_slug: string;
  next_event_title: string;
  next_event_slug: string;
  counter: number;
  issues: ParsedIssue[];
  stats: {
    total: number;
    comicIssues: number;
    comments: number;
    limited: number;
    oneshots: number;
    ongoing: number;
  };
}

export function parseReadingOrderHtml(content: string, fileName?: string): ParsedReadingOrder {
  // 1. Tiêu đề (Title)
  let title = '';
  const titleMatch = content.match(/<h[12][^>]*class=["'][^"']*h-custom-headline[^"']*["'][^>]*>[\s\S]*?<span>(?:<strong>)?([\s\S]*?)(?:<\/strong>)?<\/span><\/h[12]>/i);
  if (titleMatch) {
    title = titleMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
  }
  if (!title) {
    const pageTitle = content.match(/<title>([^<|]+)/i);
    title = pageTitle ? pageTitle[1].replace(/Reading Order/i, '').replace(/Comic Book Reading Orders/i, '').replace(/–|-/g, '').trim() : '';
  }
  if (!title && fileName) {
    title = fileName.replace(/Reading Order.*$/i, '').replace(/\.html$/i, '').trim();
  }

  // 2. Slug
  let slug = '';
  const breadcrumbLink = content.match(/href=["']?https?:\/\/comicbookreadingorders\.com\/(?:marvel|dc|other)\/(?:events|characters)?\/([a-z0-9-]+)-reading-order\/?["']/i);
  if (breadcrumbLink) {
    slug = breadcrumbLink[1];
  } else {
    slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  // 3. Vũ trụ (Universe)
  let universe_slug: 'marvel' | 'dc' | 'other' = 'other';
  const canonicalMatch = content.match(/<link rel=["']canonical["'] href=["']https?:\/\/comicbookreadingorders\.com\/(marvel|dc|other)\//i)
    || content.match(/id=["']breadcrumbs["'][\s\S]*?href=["']https?:\/\/comicbookreadingorders\.com\/(marvel|dc|other)\//i)
    || content.match(/href=["']https?:\/\/comicbookreadingorders\.com\/(marvel|dc|other)\/(?:events|characters|series)\//i);

  if (canonicalMatch) {
    universe_slug = canonicalMatch[1].toLowerCase() as any;
  } else if (title.toLowerCase().includes('dc ') || content.includes('DC Events') || content.includes('DC Comics')) {
    universe_slug = 'dc';
  } else if (title.toLowerCase().includes('marvel') || content.includes('Marvel Events') || content.includes('Marvel Comics')) {
    universe_slug = 'marvel';
  }

  // 4. Danh mục (Category)
  let category_slug: 'events' | 'characters' | 'master' | 'series' = 'events';
  if (content.includes('/characters/') || content.includes('Character Reading Orders')) {
    category_slug = 'characters';
  } else if (content.includes('master-reading-order') || title.toLowerCase().includes('master reading order')) {
    category_slug = 'master';
  } else if (universe_slug === 'other') {
    category_slug = 'series';
  }

  // 5. Tóm tắt cốt truyện (Description)
  let description = '';
  const descMatch = content.match(/<p style=text-align:justify>([\s\S]*?)<\/p>/i);
  if (descMatch) {
    description = descMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
  }

  // 6. Thông tin phụ (Metadata)
  let year_published = '';
  const yearMatch = content.match(/<strong>(?:Year Published|Publication Date)<\/strong>:?(?:&nbsp;|\u00a0|\s)*([^<\n\r]+)/i);
  if (yearMatch) year_published = yearMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;|\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

  let featured_characters = '';
  const charMatch = content.match(/<strong>(?:Featured Characters|Characters)<\/strong>:?(?:&nbsp;|\u00a0|\s)*([^<\n\r]+)/i);
  if (charMatch) featured_characters = charMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;|\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

  let previous_event_title = '';
  let previous_event_slug = '';
  const prevMatch = content.match(/<strong>Previous Event<\/strong>:?(?:&nbsp;|\u00a0|\s)*<a[^>]+href=["']?[^"'>]*\/([^/"'>]+)-reading-order\/?["']?[^>]*>(.*?)<\/a>/i);
  if (prevMatch) {
    previous_event_slug = prevMatch[1];
    previous_event_title = prevMatch[2].replace(/<[^>]+>/g, '').trim();
  }

  let next_event_title = '';
  let next_event_slug = '';
  const nextMatch = content.match(/<strong>Next Event<\/strong>:?(?:&nbsp;|\u00a0|\s)*<a[^>]+href=["']?[^"'>]*\/([^/"'>]+)-reading-order\/?["']?[^>]*>(.*?)<\/a>/i);
  if (nextMatch) {
    next_event_slug = nextMatch[1];
    next_event_title = nextMatch[2].replace(/<[^>]+>/g, '').trim();
  }

  // 7. Bộ đếm tập truyện (Counter)
  let counter = 0;
  const countMatch = content.match(/data-x-element-counter='\{"to":"(\d+)"/i);
  if (countMatch) counter = parseInt(countMatch[1], 10);

  // 8. Bóc tách danh sách tập truyện (Issues)
  const issues: ParsedIssue[] = [];
  let panelContent = '';
  
  // Tìm khối panel HTML thực sự (tránh thẻ <style>)
  const panelTagMatch = content.match(/<div[^>]*class=["']?x-tabs-panels["']?[^>]*>/i);
  if (panelTagMatch && panelTagMatch.index !== undefined) {
    panelContent = content.substring(panelTagMatch.index);
  } else {
    // Trường hợp không có x-tabs-panels (như Transformers IDW)
    const secTagMatch = content.match(/<div[^>]*id=["']?x-section-6["']?[^>]*>|<h2[^>]*><span><strong>Reading Order<\/strong><\/span><\/h2>/i);
    if (secTagMatch && secTagMatch.index !== undefined) {
      panelContent = content.substring(secTagMatch.index);
    } else {
      panelContent = content;
    }
  }

  // Cắt ngắn tới thẻ đóng </article> hoặc footer để tránh dính footer/widgets
  const endArticleIdx = panelContent.indexOf('</article>');
  const endFooterIdx = panelContent.indexOf('x-colophon');
  let cutIdx = panelContent.length;
  if (endArticleIdx !== -1) cutIdx = Math.min(cutIdx, endArticleIdx);
  if (endFooterIdx !== -1) cutIdx = Math.min(cutIdx, endFooterIdx);
  const actualSection = panelContent.substring(0, cutIdx);

  const rawLines = actualSection.split(/<br\s*\/?>|<\/p>|<p[^>]*>/gi);
  for (let rawLine of rawLines) {
    let clean = rawLine.trim();
    if (!clean || clean.includes('x-tabs') || clean.includes('Single Issues') || clean.includes('TPBs') || clean.includes('Coming Soon')) continue;
    if (clean.startsWith('</div>') || clean.startsWith('role=') || clean.startsWith('data-x-toggle')) continue;
    if (clean.includes('entry-footer') || clean.includes('x-colophon') || clean.includes('wp-admin') || clean.includes('Amazon Services')) break;

    // Bỏ qua các dòng metadata đầu trang nếu vô tình bị quét
    if (clean.startsWith('Publisher:') || clean.startsWith('Publication Date:') || clean.startsWith('Genre:') || clean.startsWith('Creators:')) continue;
    if (clean.startsWith('Year Published:') || clean.startsWith('Featured Characters:') || clean.startsWith('Characters:') || clean.startsWith('Previous Event:') || clean.startsWith('Next Event:')) continue;
    if (clean.includes('entries are') || clean.includes('is for comments')) continue;

    let is_noncanon = 0;
    let issue_note: string | null = null;
    let issue_type: 'ongoing' | 'limited' | 'oneshot' | 'comment' = 'ongoing';
    let issueYear: string | null = null;
    let titleText = '';

    const blueSpanMatch = clean.match(/<span[^>]*color:\s*#?0000ff[^>]*>(.*?)<\/span>/i);

    if (blueSpanMatch) {
      const commentRaw = blueSpanMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
      const beforeSpanHtml = clean.substring(0, blueSpanMatch.index || 0);
      const beforeSpanText = beforeSpanHtml.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

      // Nếu trước thẻ xanh có tên tập truyện (ví dụ: Ultimate Iron Man #1 (2005) - )
      if (beforeSpanText.length > 2 && /[#\d]/.test(beforeSpanText)) {
        // Tách năm từ tên tập truyện nếu có
        const yMatch = beforeSpanText.match(/\((\d{4})\)/);
        if (yMatch) issueYear = yMatch[1];

        // Làm sạch tên tập
        titleText = beforeSpanText
          .replace(/&amp;/g, '&')
          .replace(/\s+/g, ' ')
          .replace(/[-–:]\s*$/, '')
          .trim()
          .replace(/\(\d{4}\)$/, '')
          .trim();

        // Kiểm tra xem ghi chú có phải non-canon hay không
        if (/non-?canon/i.test(commentRaw) || /not canon/i.test(commentRaw)) {
          is_noncanon = 1;
        } else {
          issue_note = commentRaw;
        }

        // Nhận diện loại tập của phần tên (limited, oneshot, hay ongoing)
        if (beforeSpanHtml.includes('color:#008000') || beforeSpanHtml.includes('color: #008000')) {
          issue_type = 'limited';
        } else if (beforeSpanHtml.includes('color:#ff0000') || beforeSpanHtml.includes('color: #ff0000')) {
          issue_type = 'oneshot';
        } else {
          issue_type = 'ongoing';
        }
      } else {
        // Đây là comment / ghi chú độc lập
        issue_type = 'comment';
        titleText = clean
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    } else {
      // Dòng không có thẻ ghi chú xanh dương
      if (clean.includes('color:#008000') || clean.includes('color: #008000')) {
        issue_type = 'limited';
      } else if (clean.includes('color:#ff0000') || clean.includes('color: #ff0000')) {
        issue_type = 'oneshot';
      }

      const yMatch = clean.match(/\((\d{4})\)/);
      if (yMatch) issueYear = yMatch[1];

      titleText = clean
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      titleText = titleText.replace(/\(\d{4}\)$/, '').trim();
    }

    if (titleText.includes('Amazon Services') || titleText.includes('affiliate advertising')) continue;

    // Tự động dịch các ghi chú phổ biến
    if (issue_note) {
      if (issue_note.includes('Terrible') && issue_note.includes('Recommend to not read')) {
        issue_note = 'Chất lượng rất tệ. Khuyên bạn không nên đọc, bộ này không liên quan gì đến các phần khác.';
      }
    }

    if (issue_type === 'comment') {
      if (titleText.includes('original 1992 event') && titleText.includes('2099')) {
        titleText = 'Đây là thứ tự đọc cho sự kiện gốc năm 1992, sự kiện năm 2019 có thể xem tại [2099](/reading-order/2099).';
      } else if (titleText.includes('2019 event') && titleText.includes('Marvel 2099')) {
        titleText = 'Đây là thứ tự đọc cho sự kiện năm 2019, sự kiện gốc năm 1992 có thể xem tại [Marvel 2099](/reading-order/marvel-2099).';
      } else if (titleText.includes('Marvel Zombies Reading Order')) {
        titleText = 'Bạn có thể đọc [Thứ Tự Đọc Marvel Zombies](/reading-order/marvel-zombies) tại đây. Ultimate Fantastic Four #21-23 chính là điểm khởi nguồn của vũ trụ Marvel Zombies.';
      } else if (titleText.includes('went back to the original numbering')) {
        titleText = 'Ultimate Spider-Man quay trở lại cách đánh số tập gốc từ thời điểm này.';
      } else if (titleText.includes('takes place in backups')) {
        titleText = 'Hầu hết các diễn biến của cốt truyện này nằm ở phần truyện phụ (backup stories) trong các tập sau.';
      }
    }

    if (
      titleText.length > 2 &&
      !titleText.startsWith('http') &&
      !titleText.startsWith('@') &&
      !titleText.includes('Copyright') &&
      !titleText.startsWith('<') &&
      !titleText.startsWith('Skip to')
    ) {
      issues.push({
        title: titleText,
        issue_type,
        year: issueYear,
        note: issue_note,
        is_noncanon
      });
    }
  }

  const comicIssues = issues.filter(i => i.issue_type !== 'comment').length;
  const comments = issues.filter(i => i.issue_type === 'comment').length;
  const limited = issues.filter(i => i.issue_type === 'limited').length;
  const oneshots = issues.filter(i => i.issue_type === 'oneshot').length;
  const ongoing = issues.filter(i => i.issue_type === 'ongoing').length;

  return {
    title,
    slug,
    universe_slug,
    category_slug,
    description,
    year_published,
    featured_characters,
    previous_event_title,
    previous_event_slug,
    next_event_title,
    next_event_slug,
    counter: counter || comicIssues,
    issues,
    stats: {
      total: issues.length,
      comicIssues,
      comments,
      limited,
      oneshots,
      ongoing
    }
  };
}

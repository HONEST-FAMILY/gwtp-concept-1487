(function () {
  var G = window.GW;
  var B = window.GW_BASE;
  var H = window.GW_HOME;
  var RIDGE = window.GW_RIDGE;
  var esc = G.esc;
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STATIONS = [
    { city: '춘천시', name: '춘천', field: '바이오', ico: 'bio' },
    { city: '홍천군', name: '홍천', field: '항체의약품소재', ico: 'antibody' },
    { city: '원주시', name: '원주', field: '디지털헬스케어', ico: 'health' },
    { city: '강릉시', name: '강릉', field: '세라믹', ico: 'semi' },
    { city: '태백시', name: '태백', field: '경석자원', ico: 'rock' },
    { city: '삼척시', name: '삼척', field: '액화수소 −253℃', ico: 'h2' }
  ];
  var FIELDS = [
    { key: 'semi', name: '반도체', ico: 'semi', sectors: ['반도체'], spot: '강릉 세라믹 특화', dept: ['글로벌사업단 반도체육성팀'],
      quotes: ['반도체 부재용 대형 세라믹 제품 제조 지원', '국내 반도체 소재·부품·장비 기업의 아이템 실증 지원과 시장연계형 플랫폼 구축'] },
    { key: 'bio', name: '바이오', ico: 'bio', sectors: ['바이오'], spot: '춘천 바이오 특화, 홍천 항체의약품소재 특화', dept: ['미래사업단 바이오융합팀'],
      quotes: ['천연물소재 전주기 표준화 허브의 기능 정립 및 활성화 기반 마련', '바이오 의약품의 초기단계 개발·사업화를 위한 공간·시설 등의 통합 지원'] },
    { key: 'health', name: '디지털헬스', ico: 'health', sectors: ['디지털헬스·의료기기'], spot: '원주 디지털헬스케어 특화', dept: ['미래사업단 디지털헬스팀'],
      quotes: ['보건의료데이터 기반 실증 및 글로벌 협력 기반 산업 생태계 조성'] },
    { key: 'h2', name: '수소', ico: 'h2', sectors: ['수소·에너지'], spot: '삼척 액화수소 특화', dept: ['글로벌사업단 에너지센터'],
      quotes: ['국내 액화수소 제품의 신뢰성 평가를 위한 센터 설계 및 구축', '수소전기차량 및 수소충전소의 보급 확대·운영'] },
    { key: 'motor', name: '모빌리티', ico: 'motor', sectors: ['모빌리티'], spot: '미래차 전주기 실증, 배터리 팩 재제조', dept: ['미래사업단 스마트모빌리티팀'],
      quotes: ['미래차 전주기 실증 지원 체계 구축을 통한 미래차 산업 중심지 도약', '전기차 배터리 팩 재제조를 위한 센터 구축과 특성화 장비를 이용한 재제조 배터리 안전성 및 신뢰성 확보'] },
    { key: 'ai', name: 'AI', ico: 'ai', sectors: ['ICT·데이터', '정보보호'], spot: '소양강댐 냉수 K-클라우드파크', dept: ['강원디지털혁신센터 DX지원팀'],
      quotes: ['소양강댐의 냉수를 자원으로 한 클라우드데이터센터 7기가 집적단지인 K-클라우드파크를 조성하여 데이터 산업 융합밸리 구성', '지역 주도 AI 대전환을 통한 바이오·헬스케어 산업 경쟁력 강화 및 지속가능 생태계 구축'] }
  ];
  var SECTOR_ICO = { '반도체': 'semi', '바이오': 'bio', '디지털헬스·의료기기': 'health', '수소·에너지': 'h2', '모빌리티': 'motor', 'ICT·데이터': 'ai', '정보보호': 'ai' };
  var BOARDS = {
    live: { label: '모집공고 전체 보기', url: H.boards.recruit },
    notice: { label: '공지사항 전체 보기', url: H.boards.notice },
    bid: { label: '계약공고 전체 보기', url: H.boards.bid },
    jobs: { label: '채용공고 전체 보기', url: H.boards.jobs }
  };
  var FAC_URL = 'https://www.gwtp.or.kr/gwtp/pageview.php?url=sub04c&keyvalue=sub04';

  var state = { city: '', field: '', tab: 'live', q: '' };
  var byCity = G.placesByCity();
  var placeCity = {};
  B.places.forEach(function (p) { placeCity[p.name] = p.city; });
  var recruiting = G.recruitingPlaces();

  function ico(name, cls) {
    return '<svg class="' + cls + '" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>';
  }
  function short(city) { return city.replace(/(시|군)$/, ''); }

  function station(s) {
    var n = (byCity[s.city] || []).length;
    return '<button type="button" class="st" data-city="' + s.city + '" aria-pressed="false" aria-label="' + s.name + ' ' + s.field.replace(' −253℃', '') + ' 특화, 시설 ' + n + '곳, 이 지역으로 거르기">' +
      ico(s.ico, 'ico') +
      '<b>' + s.name + '</b><span class="fld">' + s.field + '</span><span class="cnt">시설 ' + n + '곳</span></button>';
  }

  document.getElementById('west').innerHTML = STATIONS.slice(0, 3).map(station).join('');
  document.getElementById('east').innerHTML = STATIONS.slice(3).map(station).join('');

  var route = document.getElementById('route');
  var svg = route.querySelector('.rail');
  var path = document.getElementById('railPath');
  var lbl = document.getElementById('ridgeLbl');
  var probe = document.createElement('i');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:absolute;left:0;top:0;width:0;visibility:hidden;pointer-events:none';
  route.appendChild(probe);

  function n2(v) { return Math.round(v * 10) / 10; }

  function ridge(x0, x1, base, h) {
    var d = '';
    RIDGE.y.forEach(function (v, i) {
      var t = i / (RIDGE.y.length - 1);
      d += ' L' + n2(x0 + (x1 - x0) * t) + ',' + n2(base - h * v);
    });
    return d;
  }

  function draw() {
    var R = route.getBoundingClientRect();
    if (!R.width) return;
    var icons = route.querySelectorAll('.st .ico');
    var stem = (parseFloat(getComputedStyle(icons[0]).marginBottom) - 4) / 2 || 16;
    probe.style.height = 'var(--ridge-h)';
    var rh = probe.getBoundingClientRect().height || 80;
    var pts = [];
    for (var i = 0; i < icons.length; i++) {
      var b = icons[i].getBoundingClientRect();
      pts.push({ x: b.left + b.width / 2 - R.left, bottom: b.bottom - R.top, rail: b.bottom - R.top + stem * 1.5, w: b.width });
    }
    var sw = pts[0].w / 32;
    svg.setAttribute('width', R.width);
    svg.setAttribute('height', R.height);
    svg.setAttribute('viewBox', '0 0 ' + n2(R.width) + ' ' + n2(R.height));
    path.style.strokeWidth = sw;
    var W = document.getElementById('west').getBoundingClientRect();
    var E = document.getElementById('east').getBoundingClientRect();
    var d = '';
    pts.forEach(function (p) { d += 'M' + n2(p.x) + ',' + n2(p.rail) + ' V' + n2(p.rail - stem); });
    var peakI = RIDGE.y.indexOf(Math.max.apply(null, RIDGE.y));
    var peakT = peakI / (RIDGE.y.length - 1);
    var px, py;
    if (Math.abs(pts[2].rail - pts[3].rail) < 2) {
      var y = pts[0].rail, xa = W.right - R.left, xb = E.left - R.left;
      d += 'M' + n2(pts[0].x) + ',' + n2(y) + ' H' + n2(xa) + ridge(xa, xb, y, rh) + ' H' + n2(pts[5].x);
      px = xa + (xb - xa) * peakT; py = y - rh;
    } else {
      var inset = Math.max(4, (parseFloat(getComputedStyle(route).paddingLeft) || 12) / 2);
      var xR = R.width - inset, xL = inset;
      var base = E.top - R.top - 14;
      d += 'M' + n2(pts[0].x) + ',' + n2(pts[0].rail) + ' H' + n2(xR) + ' V' + n2(base) + ridge(xR, xL, base, rh) + ' V' + n2(pts[3].rail) + ' H' + n2(pts[5].x);
      px = xR + (xL - xR) * peakT; py = base - rh;
    }
    path.setAttribute('d', d);
    lbl.style.left = n2(px) + 'px';
    lbl.style.top = n2(py - 12 - lbl.offsetHeight) + 'px';
    lbl.style.visibility = 'visible';
  }

  var raf = 0;
  function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
  draw();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  window.addEventListener('resize', schedule);
  if (window.ResizeObserver) new ResizeObserver(schedule).observe(route);

  function cityOK(n, city) {
    if (!city) return true;
    if (n.places && n.places.length) return n.places.some(function (p) { return placeCity[p] === city; });
    return G.regionOK(n, city);
  }
  function fieldOf(key) { for (var i = 0; i < FIELDS.length; i++) if (FIELDS[i].key === key) return FIELDS[i]; return null; }
  function fieldOK(n, key) {
    var f = fieldOf(key);
    if (!f) return true;
    return (n.sectors || []).some(function (s) { return f.sectors.indexOf(s) > -1; });
  }
  var LIVE = G.live().sort(G.byDeadline);
  function liveIn(city, key) { return LIVE.filter(function (n) { return cityOK(n, city) && fieldOK(n, key); }); }

  var list = document.getElementById('list');
  var title = document.getElementById('nowTitle');
  var count = document.getElementById('nowCount');
  var chips = document.getElementById('chips');
  var where = document.getElementById('where');
  var allLink = document.getElementById('allLink');
  document.getElementById('liveN').textContent = LIVE.length;

  function dd(n) {
    var st = G.status(n), d = G.dday(n);
    if (st === 'open') return d === 0 ? { t: '오늘 마감', c: 'urgent txt' } : { t: 'D-' + d, c: d <= 7 ? 'urgent' : '' };
    if (st === 'always') return { t: '상시 모집', c: 'txt' };
    if (st === 'unknown') return { t: '마감일 확인', c: 'txt' };
    return { t: '마감', c: 'txt closed' };
  }

  function when(n) {
    var st = G.status(n);
    if (st === 'open') return (n.apply_start ? G.fmtShort(n.apply_start) + ' ~ ' : '') + G.fmtShort(n.apply_end) + '(' + G.weekday(n.apply_end) + ')' + (n.apply_end_time ? ' ' + n.apply_end_time : '') + ' 마감';
    if (st === 'always') return n.apply_note || '연중 상시 접수';
    if (st === 'unknown') return '마감일은 공고문에서 확인';
    return G.fmtShort(n.apply_end) + ' 마감';
  }

  function tag(n) {
    var s = (n.sectors || []).filter(function (x) { return SECTOR_ICO[x]; })[0];
    if (!s) return '<span class="tag">전 분야</span>';
    return '<span class="tag">' + ico(SECTOR_ICO[s], 'ico-s') + esc(s) + '</span>';
  }

  function item(n) {
    var b = dd(n);
    return '<li><a href="' + esc(n.url) + '" target="_blank" rel="noopener">' +
      '<span class="dslot"><span class="dd ' + b.c + '">' + b.t + '</span></span>' +
      '<span class="bd"><span class="tt">' + esc(n.title) + '</span>' +
      '<span class="meta"><span class="when">' + esc(when(n)) + '</span><span class="dept">' + esc(n.dept) + '</span>' + tag(n) + '</span></span></a></li>';
  }

  function boardItem(x) {
    var p = x.date.split('-');
    return '<li class="brow"><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' +
      '<span class="bdate"><b>' + (+p[1]) + '.' + p[2] + '</b><span>' + p[0] + '</span></span>' +
      '<span class="btt">' + esc(x.title) + '</span>' +
      (x.badge ? '<span class="bbadge">' + esc(x.badge) + '</span>' : '') + '</a></li>';
  }

  function renderChips() {
    var base = LIVE.filter(function (n) { return cityOK(n, state.city); });
    var h = '<button type="button" class="chip" data-field="" aria-pressed="' + (!state.field) + '">전체 <span>' + base.length + '</span></button>';
    FIELDS.forEach(function (f) {
      var c = base.filter(function (n) { return fieldOK(n, f.key); }).length;
      h += '<button type="button" class="chip" data-field="' + f.key + '" aria-pressed="' + (state.field === f.key) + '">' + ico(f.ico, 'ico-c') + f.name + ' <span>' + c + '</span></button>';
    });
    chips.innerHTML = h;
  }

  function renderWhere() {
    if (!state.city) { where.innerHTML = '<span class="where-t">전체 시군</span>'; return; }
    where.innerHTML = '<span class="where-t"><b>' + short(state.city) + '</b> 기업이 신청할 수 있는 공고</span><button type="button" class="clear" id="clearCity">지역 해제</button>';
  }

  function renderList() {
    var tabs = document.querySelectorAll('.tabs [role=tab]');
    for (var i = 0; i < tabs.length; i++) {
      var on = tabs[i].getAttribute('data-tab') === state.tab;
      tabs[i].setAttribute('aria-selected', on);
      tabs[i].tabIndex = on ? 0 : -1;
    }
    list.setAttribute('aria-labelledby', 'tab-' + state.tab);
    allLink.textContent = BOARDS[state.tab].label;
    allLink.href = BOARDS[state.tab].url;
    var isLive = state.tab === 'live';
    chips.hidden = !isLive || !!state.q;
    list.className = isLive ? 'list' : 'list board';
    if (!isLive) {
      title.firstChild.nodeValue = { notice: '공지사항 ', bid: '계약공고 ', jobs: '채용공고 ' }[state.tab];
      count.textContent = '최근 ' + H[state.tab].length + '건';
      list.innerHTML = H[state.tab].map(boardItem).join('');
      return;
    }
    if (state.q) {
      var r = G.search(state.q);
      var ns = r.notices.filter(function (n) { return cityOK(n, state.city); });
      title.firstChild.nodeValue = '‘' + state.q + '’ 검색 결과 ';
      count.textContent = '공고 ' + ns.length + '건' + (r.places.length ? ', 시설 ' + r.places.length + '곳' : '');
      list.innerHTML = ns.length ? ns.slice(0, 8).map(item).join('') : '<li class="empty">‘' + esc(state.q) + '’에 맞는 공고가 없습니다. 분야 이름이나 시군 이름으로 찾아보세요.</li>';
      return;
    }
    var rows = liveIn(state.city, state.field);
    var f = fieldOf(state.field);
    title.firstChild.nodeValue = (state.city ? short(state.city) + ' ' : '') + (f ? f.name + ' ' : '') + '지금 접수 중인 공고 ';
    count.textContent = rows.length + '건';
    list.innerHTML = rows.length ? rows.slice(0, 8).map(item).join('') : '<li class="empty">이 조건으로 접수 중인 공고가 없습니다. 분야를 전체로 바꿔 보세요.</li>';
  }

  function renderNotices() { renderChips(); renderWhere(); renderList(); }

  function setTab(t, focus) {
    state.tab = t;
    if (t !== 'live') state.q = '';
    renderList();
    if (focus) document.getElementById('tab-' + t).focus();
  }

  document.querySelector('.tabs').addEventListener('click', function (e) {
    var b = e.target.closest('[role=tab]');
    if (b) setTab(b.getAttribute('data-tab'));
  });
  document.querySelector('.tabs').addEventListener('keydown', function (e) {
    var order = ['live', 'notice', 'bid', 'jobs'];
    var i = order.indexOf(state.tab);
    if (e.key === 'ArrowRight') i = (i + 1) % 4;
    else if (e.key === 'ArrowLeft') i = (i + 3) % 4;
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = 3;
    else return;
    e.preventDefault();
    setTab(order[i], true);
  });
  chips.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    state.field = b.getAttribute('data-field');
    renderChips();
    renderList();
    var nb = chips.querySelector('[data-field="' + state.field + '"]');
    if (nb) nb.focus();
  });
  where.addEventListener('click', function (e) {
    if (e.target.id === 'clearCity') { pickCity(''); route.querySelector('.st').focus(); }
  });

  var input = document.getElementById('q');
  var timer = 0;
  function run() { state.q = input.value.trim(); state.tab = 'live'; renderNotices(); }
  document.getElementById('searchForm').addEventListener('submit', function (e) { e.preventDefault(); run(); });
  input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 220); });

  var pickNote = document.getElementById('pickNote');
  function pickCity(city) {
    state.city = city;
    var sts = route.querySelectorAll('.st');
    for (var i = 0; i < sts.length; i++) {
      var on = sts[i].getAttribute('data-city') === city;
      sts[i].classList.toggle('on', on);
      sts[i].setAttribute('aria-pressed', on);
    }
    route.classList.toggle('has-pick', !!city);
    if (city) {
      var n = liveIn(city, '').length, p = (byCity[city] || []).length;
      pickNote.innerHTML = '<b>' + short(city) + '</b> 선택: 접수 중 공고 ' + n + '건, 입주 시설 ' + p + '곳 <a href="#notice">공고 보기</a><a href="#fac">시설 보기</a>';
    } else pickNote.innerHTML = '';
    pickNote.classList.toggle('on', !!city);
    state.tab = 'live';
    renderNotices();
    facCity = city;
    renderFac();
  }
  route.addEventListener('click', function (e) {
    var b = e.target.closest('.st');
    if (!b) return;
    var c = b.getAttribute('data-city');
    pickCity(state.city === c ? '' : c);
  });

  var bizList = document.getElementById('bizList');
  bizList.innerHTML = FIELDS.map(function (f) {
    var n = LIVE.filter(function (x) { return fieldOK(x, f.key); }).length;
    return '<li class="biz-row">' +
      '<img class="biz-ico" src="main-img/ico-' + f.ico + '.svg" alt="" width="64" height="64">' +
      '<div class="biz-name"><h3>' + f.name + '</h3><p>' + f.spot + '</p><div class="biz-dept">담당 ' + f.dept.join(', ') + '</div></div>' +
      '<div class="biz-q">' + f.quotes.map(function (q) { return '<p>' + q.replace('K-클라우드파크', '<span class="nw">K-클라우드파크</span>') + '</p>'; }).join('') + '</div>' +
      '<div class="biz-side"><div class="biz-n"><b>' + n + '</b><span>건 접수 중</span></div>' +
      '<button type="button" class="btn-line" data-field="' + f.key + '">' + f.name + ' 공고 보기</button></div></li>';
  }).join('');
  bizList.addEventListener('click', function (e) {
    var b = e.target.closest('.btn-line');
    if (!b) return;
    state.field = b.getAttribute('data-field');
    state.tab = 'live';
    state.q = '';
    input.value = '';
    renderNotices();
    document.getElementById('notice').scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
    title.focus({ preventScroll: true });
  });

  var GROUP = { '입주': '입주', '장비': '장비', '지원사업': '지원사업', '정보': '산업정보', '분야': '분야별 센터' };
  var SVC = [
    { name: '지원사업 모집공고', url: H.boards.recruit, group: '공고' },
    { name: '입주 신청 안내', url: 'https://www.gwtp.or.kr/gwtp/pageview.php?url=sub04a&keyvalue=sub04', group: '입주' },
    { name: '장비지원 안내', url: 'https://www.gwtp.or.kr/gwtp/pageview.php?url=sub02c&keyvalue=sub02', group: '장비' }
  ].concat(B.systems.filter(function (s) { return s.name !== '강원연구장비'; }).map(function (s) { return { name: s.name === '입주기업종합지원' ? '입주기업종합지원시스템' : s.name, url: s.url, group: GROUP[s.group] || s.group }; }));
  function host(u) { return u.replace(/^https?:\/\//, '').replace(/\/.*$/, ''); }
  document.getElementById('svcList').innerHTML = '<ul class="svc-list">' + SVC.map(function (s) {
    return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener"><span class="sv-g">' + esc(s.group) + '</span><span class="sv-n">' + esc(s.name) + '</span><span class="sv-h">' + esc(host(s.url)) + '</span></a></li>';
  }).join('') + '</ul>';

  var facCity = '';
  var ORDER = STATIONS.map(function (s) { return s.city; });
  var PLACES = B.places.slice().sort(function (a, b) { return ORDER.indexOf(a.city) - ORDER.indexOf(b.city); });
  var ctabs = document.getElementById('ctabs');
  var facGrid = document.getElementById('facGrid');
  var recN = Object.keys(recruiting).length;
  document.getElementById('facLead').textContent = '춘천에서 삼척까지, 임대공장과 실험실, 창업보육실을 갖춘 시설입니다. 지금 입주 모집 중인 곳은 ' + recN + '곳입니다.';

  function renderCtabs() {
    var h = '<button type="button" class="ctab" data-city="" aria-pressed="' + (!facCity) + '">전체 <span>' + PLACES.length + '</span></button>';
    STATIONS.forEach(function (s) {
      h += '<button type="button" class="ctab" data-city="' + s.city + '" aria-pressed="' + (facCity === s.city) + '">' + s.name + ' <span>' + (byCity[s.city] || []).length + '</span></button>';
    });
    ctabs.innerHTML = h;
  }
  function facItem(p) {
    var rec = recruiting[p.name];
    var fig = p.img ? '<img src="main-img/f-' + p.img + '.jpg" alt="' + esc(p.name) + ' 건물 사진" width="720" height="480" loading="lazy">'
      : '<span class="noimg">' + ico('rock', 'ico-n') + '<span>태백 경석자원 특화</span></span>';
    return '<li class="fc"><div class="fc-ph">' + fig + (rec ? '<a class="rec" href="' + esc(rec.url) + '" target="_blank" rel="noopener">입주 모집 중</a>' : '') + '</div>' +
      '<p class="fc-city">' + short(p.city) + '</p><h3><a href="' + FAC_URL + '" target="_blank" rel="noopener">' + esc(p.name) + '</a></h3>' +
      '<dl><div><dt>면적</dt><dd>' + esc(p.area) + '</dd></div>' + (p.scale ? '<div><dt>규모</dt><dd>' + esc(p.scale) + '</dd></div>' : '') + '<div><dt>용도</dt><dd>' + esc(p.use) + '</dd></div></dl></li>';
  }
  function renderFac() {
    renderCtabs();
    var rows = PLACES.filter(function (p) { return !facCity || p.city === facCity; });
    facGrid.innerHTML = rows.map(facItem).join('');
    facGrid.classList.toggle('few', rows.length < 4);
  }
  ctabs.addEventListener('click', function (e) {
    var b = e.target.closest('.ctab');
    if (!b) return;
    facCity = b.getAttribute('data-city');
    renderFac();
    var nb = ctabs.querySelector('[data-city="' + facCity + '"]');
    if (nb) nb.focus();
  });

  function fmtD(s) { var p = s.split('-'); return p[0] + '.' + p[1] + '.' + p[2]; }
  var press = document.getElementById('press');
  press.innerHTML = B.news.map(function (n, i) {
    return '<a class="pr' + (i === 0 ? ' pr-big' : '') + '" href="' + B.newsUrl + '" target="_blank" rel="noopener">' +
      '<span class="pr-ph"><img src="main-img/news-' + (i + 1) + '.jpg" alt="" width="900" height="600" loading="lazy"></span>' +
      '<span class="pr-tx"><span class="pr-t">' + esc(n.title) + '</span><span class="pr-d">' + fmtD(n.date) + '</span></span></a>';
  }).join('');
  document.getElementById('nlist').innerHTML = H.notice.map(function (x) {
    return '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener"><span class="nt">' + esc(x.title) + '</span><span class="nd">' + fmtD(x.date) + '</span></a></li>';
  }).join('');

  document.getElementById('relList').innerHTML = B.systems.map(function (s) {
    return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a></li>';
  }).join('');

  var gnb = document.getElementById('gnb');
  var mini = document.getElementById('miniForm');
  var mq = document.getElementById('mq');
  var hero = document.querySelector('.hero');
  function stuck() {
    var on = hero.getBoundingClientRect().bottom < 0;
    if (on === gnb.classList.contains('is-stuck')) return;
    gnb.classList.toggle('is-stuck', on);
    var t = on ? 0 : -1;
    mq.tabIndex = t;
    mini.querySelector('button').tabIndex = t;
  }
  window.addEventListener('scroll', stuck, { passive: true });
  stuck();
  mini.addEventListener('submit', function (e) {
    e.preventDefault();
    input.value = mq.value.trim();
    run();
    document.getElementById('notice').scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
    title.focus({ preventScroll: true });
  });

  var menuBtn = document.getElementById('menuBtn');
  var allMenu = document.getElementById('allMenu');
  allMenu.innerHTML = '<div class="wrap">' + document.getElementById('sitemap').innerHTML + '</div>';
  menuBtn.addEventListener('click', function () {
    var open = allMenu.hidden;
    allMenu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? '전체 메뉴 닫기' : '전체 메뉴 열기');
    gnb.classList.toggle('menu-open', open);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !allMenu.hidden) { menuBtn.click(); menuBtn.focus(); }
  });

  var nums = document.querySelectorAll('.num');
  function fmtN(v) { return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function countUp(el) {
    var to = +el.getAttribute('data-to'), t0 = 0;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / 700);
      el.textContent = fmtN(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (!RM && window.IntersectionObserver) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); countUp(en.target); } });
    }, { threshold: 0.6 });
    for (var k = 0; k < nums.length; k++) io.observe(nums[k]);
  }

  renderNotices();
  renderFac();
})();

(function () {
  var GW = window.GW, B = window.GW_BASE, H = window.GW_HOME;
  if (!GW || !B || !H) return;
  var esc = GW.esc;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(id) { return document.getElementById(id); }
  function firstUrl(u, fb) { return String(u || '').split('||')[0] || fb; }
  function md(s) { if (!s) return ''; var p = s.split('-'); return p[0] + '.' + p[1] + '.' + p[2]; }

  var live = GW.live().sort(GW.byDeadline);
  var listUrl = B.listUrl || H.boards.recruit;

  $('liveCount').textContent = live.length;
  $('tabLive').textContent = live.length;
  var asof = new Date();
  $('noticeAsof').textContent = (asof.getMonth() + 1) + '월 ' + asof.getDate() + '일 기준, 마감 빠른 순';

  var cls = { urgent: 0, open: 0, always: 0, unknown: 0 };
  live.forEach(function (n) { var c = GW.badge(n).cls; if (cls[c] != null) cls[c]++; });
  $('nstat').innerHTML =
    '<div><dt>마감 7일 이내</dt><dd>' + cls.urgent + '건</dd></div>' +
    '<div><dt>마감일 있는 공고</dt><dd>' + (cls.urgent + cls.open) + '건</dd></div>' +
    '<div><dt>상시 모집</dt><dd>' + cls.always + '건</dd></div>' +
    '<div><dt>마감일 공고문 확인</dt><dd>' + cls.unknown + '건</dd></div>';

  var boardLabel = { notice: '공지사항', bid: '계약공고', jobs: '채용공고' };
  var state = { tab: 'live', sector: '' };

  var sectorsLive = B.sectors.filter(function (s) { return live.some(function (n) { return (n.sectors || []).indexOf(s) > -1; }); });
  function countOf(s) { return live.filter(function (n) { return (n.sectors || []).indexOf(s) > -1; }).length; }

  function renderFilters() {
    var f = $('filters');
    if (state.tab !== 'live') { f.hidden = true; return; }
    f.hidden = false;
    var html = '<span class="flabel">분야</span><button type="button" class="chip' + (state.sector ? '' : ' is-on') + '" data-s="" aria-pressed="' + (!state.sector) + '">전체 <span>' + live.length + '</span></button>';
    sectorsLive.forEach(function (s) {
      var on = state.sector === s;
      html += '<button type="button" class="chip' + (on ? ' is-on' : '') + '" data-s="' + esc(s) + '" aria-pressed="' + on + '">' + esc(s) + ' <span>' + countOf(s) + '</span></button>';
    });
    f.innerHTML = html;
  }

  function liveRow(n) {
    var b = GW.badge(n);
    var href = firstUrl(n.url, listUrl);
    var sec = (n.sectors || []).filter(function (s) { return s !== '전 분야'; });
    var secText = sec.length ? sec.join(', ') : '전 분야';
    return '<li><a class="row" href="' + esc(href) + '" target="_blank" rel="noopener">' +
      '<span class="dd ' + b.cls + '">' + esc(b.text) + '</span>' +
      '<span class="main"><span class="t">' + esc(n.title) + '</span><span class="s"><b>' + esc(secText) + '</b>' + esc(n.short || '') + '</span></span>' +
      '<span class="due">' + esc(GW.deadlineText(n)) + '<span class="dept">' + esc(n.dept || '') + '</span></span>' +
      '</a></li>';
  }

  function boardRow(it, key) {
    var d = it.date || '';
    var p = d.split('-');
    return '<li><a class="row plain" href="' + esc(firstUrl(it.url, H.boards[key])) + '" target="_blank" rel="noopener">' +
      '<span class="date"><b>' + (+p[1]) + '.' + (+p[2]) + '</b><span>' + p[0] + '</span></span>' +
      '<span class="main"><span class="t">' + esc(it.title) + '</span></span>' +
      '<span class="due">' + boardLabel[key] + '<span class="dept">' + md(d) + ' 게시</span></span>' +
      '</a></li>';
  }

  function renderList() {
    var list = $('nlist'), more = $('nmore'), all = $('noticeAll');
    if (state.tab === 'live') {
      var rows = live.filter(function (n) { return !state.sector || (n.sectors || []).indexOf(state.sector) > -1; });
      var shown = rows.slice(0, 8);
      list.innerHTML = shown.map(liveRow).join('');
      more.innerHTML = (state.sector ? esc(state.sector) + ' 분야 ' : '접수 중 ') + rows.length + '건 가운데 ' + shown.length + '건을 마감 빠른 순으로 보여 드립니다. <a href="' + esc(listUrl) + '" target="_blank" rel="noopener">모집공고 게시판에서 모두 보기</a>';
      all.href = listUrl; all.textContent = '공고 전체 보기';
    } else {
      list.innerHTML = (H[state.tab] || []).map(function (it) { return boardRow(it, state.tab); }).join('');
      more.innerHTML = boardLabel[state.tab] + ' 최근 ' + (H[state.tab] || []).length + '건, ' + md(H.asOf) + ' 게시판 기준. <a href="' + esc(H.boards[state.tab]) + '" target="_blank" rel="noopener">' + boardLabel[state.tab] + ' 게시판에서 모두 보기</a>';
      all.href = H.boards[state.tab]; all.textContent = boardLabel[state.tab] + ' 전체 보기';
    }
  }

  function setTab(t) {
    state.tab = t;
    [].forEach.call(document.querySelectorAll('.tab'), function (b) {
      var on = b.getAttribute('data-tab') === t;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', on);
    });
    renderFilters(); renderList();
  }

  document.querySelector('.tabs').addEventListener('click', function (e) {
    var b = e.target.closest('.tab'); if (!b) return;
    setTab(b.getAttribute('data-tab'));
  });
  $('filters').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    state.sector = b.getAttribute('data-s');
    renderFilters(); renderList();
  });
  renderFilters(); renderList();

  [].forEach.call(document.querySelectorAll('.biz .cnt'), function (a) {
    var s = a.getAttribute('data-filter');
    a.querySelector('b').textContent = countOf(s);
    a.addEventListener('click', function (e) {
      e.preventDefault();
      state.sector = countOf(s) ? s : '';
      setTab('live');
      go($('notice'));
    });
  });

  var groupName = { '입주': '입주기업', '장비': '연구장비', '지원사업': '지원사업', '정보': '산업정보', '분야': '분야별 센터' };
  $('eqLinks').innerHTML = B.systems.map(function (s) {
    var host = s.url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    return '<a class="sys" href="' + esc(s.url) + '" target="_blank" rel="noopener"><span class="g">' + esc(groupName[s.group] || s.group) + '</span><b>' + esc(s.name) + '</b><span class="h">' + esc(host) + '</span></a>';
  }).join('');

  var rec = GW.recruitingPlaces();
  var recNames = Object.keys(rec);
  var byCity = GW.placesByCity();
  var cityOrder = ['춘천시', '강릉시', '원주시', '삼척시', '태백시', '홍천군'];
  var special = { '춘천시': '바이오 특화', '강릉시': '세라믹 특화', '원주시': '디지털헬스케어 특화', '삼척시': '액화수소 특화', '태백시': '경석자원 특화', '홍천군': '항체의약품소재 특화' };
  var pState = { city: '' };
  $('placeSub').innerHTML = '춘천 바이오, 홍천 항체의약품소재, 원주 디지털헬스케어, 강릉 세라믹, 삼척 액화수소, 태백 경석자원. 지금 입주 모집 중인 곳은 <b>' + recNames.length + '곳</b>입니다.';

  function renderCtabs() {
    var html = '<button type="button" class="ctab' + (pState.city ? '' : ' is-on') + '" data-c="" aria-pressed="' + (!pState.city) + '">전체 <span>' + B.places.length + '</span></button>';
    cityOrder.forEach(function (c) {
      var on = pState.city === c;
      html += '<button type="button" class="ctab' + (on ? ' is-on' : '') + '" data-c="' + c + '" aria-pressed="' + on + '">' + c.replace(/(시|군)$/, '') + ' <span>' + (byCity[c] || []).length + '</span></button>';
    });
    $('ctabs').innerHTML = html;
  }

  function placeItem(p) {
    var r = rec[p.name];
    var ph = p.img
      ? '<img src="main-img/' + p.img + '.jpg" alt="' + esc(p.name) + ' 전경">'
      : '<img src="main-img/tb-stone.jpg" alt="태백 경석을 반으로 자른 단면 정물"><span class="nophoto">태백 경석자원 특화</span>';
    var badge = r ? '<a class="rec" href="' + esc(firstUrl(r.url, listUrl)) + '" target="_blank" rel="noopener">입주 모집 중</a>' : '';
    var area = String(p.area || '').split(' · ');
    return '<li class="pl' + (p.img ? '' : ' tb') + '" data-city="' + p.city + '">' +
      '<div class="pimg">' + ph + badge + '</div>' +
      '<div class="ptx"><p class="pcity">' + esc(p.city) + ' ' + esc(special[p.city] || '') + '</p>' +
      '<h3>' + esc(p.name) + '</h3>' +
      '<dl class="pfacts">' +
      '<div><dt>면적</dt><dd>' + area.map(esc).join('<br>') + '</dd></div>' +
      (p.scale ? '<div><dt>규모</dt><dd>' + esc(p.scale) + '</dd></div>' : '') +
      '<div><dt>용도</dt><dd>' + esc(p.use) + '</dd></div>' +
      '</dl></div></li>';
  }

  function renderPlaces() {
    var ps = B.places.filter(function (p) { return !pState.city || p.city === pState.city; });
    var html = ps.map(placeItem).join('');
    html += '<li class="pl ask"><div class="ask-in"><p class="ask-k">입주 문의</p><p class="ask-t">시설별 호실과 임대료는 입주기업종합지원시스템과 대표전화로 안내합니다.</p>' +
      '<p class="ask-tel"><a href="tel:' + B.phone + '">' + B.phone + '</a></p>' +
      '<p class="ask-go"><a href="https://mybiz.gwtp.or.kr/" target="_blank" rel="noopener">입주기업종합지원시스템</a></p></div></li>';
    $('pgrid').innerHTML = html;
  }

  $('ctabs').addEventListener('click', function (e) {
    var b = e.target.closest('.ctab'); if (!b) return;
    pState.city = b.getAttribute('data-c');
    renderCtabs(); renderPlaces();
  });
  renderCtabs(); renderPlaces();

  var feat = 1;
  var news = B.news.map(function (n, i) { return { d: n.date, t: n.title, img: 'main-img/news-' + (i + 1) + '.jpg' }; });
  var f = news[feat];
  var rest = news.filter(function (n, i) { return i !== feat; });
  $('press').innerHTML =
    '<a class="feat" href="' + esc(B.newsUrl) + '" target="_blank" rel="noopener"><span class="fimg"><img src="' + f.img + '" alt=""></span>' +
    '<span class="fk">보도자료</span><span class="ft">' + esc(f.t) + '</span><span class="fd">' + md(f.d) + '</span></a>' +
    '<ul class="plist">' + rest.map(function (n) {
      return '<li><a href="' + esc(B.newsUrl) + '" target="_blank" rel="noopener"><span class="pimg2"><img src="' + n.img + '" alt=""></span><span class="pt"><span class="ptt">' + esc(n.t) + '</span><span class="pd">' + md(n.d) + '</span></span></a></li>';
    }).join('') + '</ul>';

  function blist(arr, key) {
    return arr.map(function (it) {
      return '<li><a href="' + esc(firstUrl(it.url, H.boards[key])) + '" target="_blank" rel="noopener"><span class="bt">' + esc(it.title) + '</span><span class="bd">' + md(it.date) + '</span></a></li>';
    }).join('');
  }
  $('blist').innerHTML = blist(H.notice, 'notice');
  $('rlist').innerHTML = blist(H.recruit, 'recruit');
  $('boardAll').href = H.boards.notice;
  $('recruitAll').href = H.boards.recruit;

  $('footSites').innerHTML = B.systems.map(function (s) { return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a></li>'; }).join('');
  $('footAddr').textContent = B.address;

  function go(el) {
    if (!el) return;
    var y = el.getBoundingClientRect().top + window.pageYOffset - 64;
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }

  [].forEach.call(document.querySelectorAll('.tag'), function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var c = a.getAttribute('data-city');
      var target = document.querySelector(a.getAttribute('href'));
      if (c) {
        pState.city = c; renderCtabs(); renderPlaces();
        target = $('place');
      }
      var item = a.getAttribute('href') === '#biz-semi' ? $('biz-semi') : null;
      if (item) { goItem(item); item.classList.remove('lit'); void item.offsetWidth; item.classList.add('lit'); }
      else go(target);
    });
  });

  var gnb = $('gnb'), hero = document.querySelector('.hero .stage');
  function onScroll() {
    var lim = hero.offsetHeight - 80, y = window.pageYOffset;
    gnb.classList.toggle('is-solid', y > lim);
    gnb.classList.toggle('is-away', y > 8 && y <= lim);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var nums = document.querySelectorAll('[data-count]');
  function fmt(v) { return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function countUp(el) {
    var to = +el.getAttribute('data-count');
    if (reduce) { el.textContent = fmt(to); return; }
    var t0 = null, dur = 1200;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(Math.round(to * e));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { io.unobserve(en.target); countUp(en.target); }
      });
    }, { threshold: 0.6 });
    [].forEach.call(nums, function (n) { io.observe(n); });
  }

  var biz = $('biz'), track = $('bizTrack'), wrap = biz.querySelector('.rail-wrap'), bar = $('railBar');
  var mq = window.matchMedia('(min-width: 1024px)');
  var SPEED = 2.2;
  function setupRail() {
    var land = window.innerHeight >= 560 && window.innerHeight <= window.innerWidth * 0.9;
    var on = mq.matches && !reduce && land;
    biz.classList.toggle('rail', on);
    if (!on) { wrap.style.height = ''; track.style.transform = ''; return; }
    var dist = Math.max(0, track.scrollWidth - track.parentElement.clientWidth);
    biz.dataset.dist = dist;
    wrap.style.height = (dist / SPEED + window.innerHeight) + 'px';
    railScroll();
  }
  function railScroll() {
    if (!biz.classList.contains('rail')) return;
    var dist = +biz.dataset.dist || 0;
    var top = wrap.getBoundingClientRect().top;
    var k = dist ? Math.min(1, Math.max(0, -top * SPEED / dist)) : 0;
    track.style.transform = 'translate3d(' + (-k * dist).toFixed(1) + 'px,0,0)';
    bar.style.transform = 'scaleX(' + Math.max(0.02, k).toFixed(3) + ')';
  }
  function goItem(item) {
    if (!biz.classList.contains('rail')) { go(item); return; }
    var dist = +biz.dataset.dist || 0;
    var pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    var shift = Math.min(dist, Math.max(0, item.offsetLeft - pad));
    var y = wrap.getBoundingClientRect().top + window.pageYOffset + shift / SPEED + 1;
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }
  window.addEventListener('scroll', railScroll, { passive: true });
  window.addEventListener('resize', setupRail);
  window.addEventListener('load', setupRail);
  setupRail();
})();

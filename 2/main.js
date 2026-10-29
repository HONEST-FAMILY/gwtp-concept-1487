(function () {
  var G = window.GW, B = window.GW_BASE, H = window.GW_HOME;
  if (!G || !B || !H) return;
  var doc = document;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function esc(s) { return G.esc(s); }

  var ORDER = ['춘천시', '홍천군', '원주시', '강릉시', '태백시', '삼척시'];
  var CITY = {
    '춘천시': { s: '춘천', sp: '바이오 특화', sec: ['바이오'] },
    '홍천군': { s: '홍천', sp: '항체의약품소재 특화', sec: ['바이오'] },
    '원주시': { s: '원주', sp: '디지털헬스케어 특화', sec: ['디지털헬스·의료기기'] },
    '강릉시': { s: '강릉', sp: '세라믹 특화', sec: ['반도체'] },
    '태백시': { s: '태백', sp: '경석자원 특화', sec: [] },
    '삼척시': { s: '삼척', sp: '액화수소 특화', sec: ['수소·에너지'] }
  };
  var placeCity = {};
  B.places.forEach(function (p) { placeCity[p.name] = p.city; });

  var live = G.live().slice().sort(G.byDeadline);
  var recruit = G.recruitingPlaces();
  var state = { tab: 'live', city: '', sector: '' };

  function citiesOf(n) {
    if (n.places && n.places.length) {
      return ORDER.filter(function (c) { return n.places.some(function (p) { return placeCity[p] === c; }); });
    }
    var regs = (n.regions || []).filter(function (r) { return !/도내 전체|강원 전체|전국|제한 없음|도외/.test(r); });
    if (regs.length) return ORDER.filter(function (c) { return regs.indexOf(c) > -1; });
    return ORDER.filter(function (c) { return CITY[c].sec.some(function (s) { return (n.sectors || []).indexOf(s) > -1; }); });
  }
  function wideOK(n) {
    if (n.places && n.places.length) return false;
    var regs = n.regions || [];
    return !regs.length || regs.some(function (r) { return /도내 전체|강원 전체|전국|제한 없음/.test(r); });
  }

  $$('[data-live]').forEach(function (el) { el.textContent = live.length; });
  var mm = G.today.getMonth() + 1, dd0 = G.today.getDate();
  var asof = doc.querySelector('[data-asof]');
  if (asof) asof.textContent = mm + '월 ' + dd0 + '일 오늘 기준, 마감이 가까운 순서입니다.';
  var asof2 = doc.querySelector('[data-asof-short]');
  if (asof2) asof2.textContent = mm + '월 ' + dd0 + '일 기준 접수 중 공고에서 자동 계산';
  var sc = G.sectorCounts();
  $$('[data-sc]').forEach(function (el) { var v = sc[el.getAttribute('data-sc')]; el.textContent = v == null ? 0 : v; });
  var secChips = doc.querySelector('[data-sector-chips]');
  if (secChips) secChips.innerHTML = B.sectors.filter(function (s) { return sc[s] > 0; }).map(function (s) {
    return '<button type="button" data-sector-btn="' + esc(s) + '" aria-pressed="false">' + esc(s) + '<span class="c">' + sc[s] + '</span></button>';
  }).join('');

  function ddCell(n) {
    var b = G.badge(n), d = G.dday(n);
    if (d === null) return '<span class="dd t">' + esc(b.text) + '</span>';
    if (d === 0) return '<span class="dd u t">오늘 마감</span>';
    return '<span class="' + (d <= 7 ? 'dd u' : 'dd') + '">D-' + d + '</span>';
  }
  function liveRow(n, tag) {
    var url = n.url || B.listUrl;
    return '<li><a href="' + esc(url) + '">' + ddCell(n) +
      '<span><span class="t">' + (tag ? '<span class="bdg">' + esc(tag) + '</span>' : '') + esc(n.title) + '</span>' +
      (n.short ? '<span class="s">' + esc(n.short) + '</span>' : '') + '</span>' +
      '<span class="m"><b>' + esc(G.deadlineText(n)) + '</b>' + esc(n.dept || '') + '</span></a></li>';
  }
  var BOARD = {
    live: { url: H.boards.recruit, label: '모집공고 전체 보기', foot: '마감 7일 이내 공고는 파란 면으로 표시합니다.' },
    notice: { url: H.boards.notice, label: '공지사항 전체 보기', foot: '공지사항 게시판의 최근 5건입니다.' },
    bid: { url: H.boards.bid, label: '계약공고 전체 보기', foot: '계약공고 게시판의 최근 5건입니다.' },
    jobs: { url: H.boards.jobs, label: '채용공고 전체 보기', foot: '채용공고 게시판의 최근 5건입니다.' }
  };
  var NAME = { notice: '공지사항', bid: '계약공고', jobs: '채용공고' };
  function boardRow(it, k) {
    var p = (it.date || '').split('-');
    return '<li><a href="' + esc(it.url) + '"><span class="dd dt2">' + (+p[1]) + '.' + (+p[2]) + '</span>' +
      '<span><span class="t">' + (it.badge ? '<span class="bdg">' + esc(it.badge) + '</span>' : '') + esc(it.title) + '</span>' +
      '<span class="s">' + p[0] + '년 ' + (+p[1]) + '월 ' + (+p[2]) + '일 게시</span></span>' +
      '<span class="m"><b>' + NAME[k] + '</b>강원테크노파크 공고안내</span></a></li>';
  }

  var rows = doc.querySelector('[data-rows]');
  var note = doc.querySelector('[data-note]');
  var noteDefault = note ? note.innerHTML : '';
  function renderRows() {
    if (!rows) return;
    var html = '', k = state.tab;
    if (k !== 'live') {
      html = (H[k] || []).map(function (it) { return boardRow(it, k); }).join('');
      if (note) note.innerHTML = noteDefault;
    } else if (state.sector) {
      var hit = live.filter(function (n) { return (n.sectors || []).indexOf(state.sector) > -1; });
      html = hit.map(function (n) { return liveRow(n); }).join('') || '<li class="empty">이 분야의 접수 중 공고가 지금은 없습니다.</li>';
      if (note) note.innerHTML = '<b>' + esc(state.sector) + '</b> 분야 접수 중 공고 ' + hit.length + '건입니다. <button type="button" class="rg" data-clear>전체 보기</button>';
    } else if (state.city) {
      var c = state.city, rel = live.filter(function (n) { return citiesOf(n).indexOf(c) > -1; });
      var wide = live.filter(function (n) { return rel.indexOf(n) < 0 && wideOK(n); });
      var room = Math.max(8 - rel.length, 3);
      html = rel.map(function (n) { return liveRow(n, CITY[c].s); }).join('');
      if (!rel.length) html += '<li class="empty">' + CITY[c].s + ' 시설과 ' + CITY[c].sp + ' 분야 공고는 지금 접수 중인 것이 없습니다.</li>';
      if (wide.length) html += '<li class="sep">도내 어디서나 신청할 수 있는 공고</li>' + wide.slice(0, room).map(function (n) { return liveRow(n); }).join('');
      if (note) note.innerHTML = '<b>' + CITY[c].s + '</b> 시설 입주와 ' + CITY[c].sp + ' 분야 공고 ' + rel.length + '건을 먼저 보여 줍니다. <button type="button" class="rg" data-clear>전체 보기</button>';
    } else {
      html = live.slice(0, 8).map(function (n) { return liveRow(n); }).join('');
      if (note) note.innerHTML = noteDefault;
    }
    rows.innerHTML = html;
    $$('button[data-city]').forEach(function (b) {
      var v = b.getAttribute('data-city'), grp = b.closest('[data-chips]'), on;
      if (grp && grp.getAttribute('data-chips') === 'fac') on = v === state.city;
      else if (grp) on = v === state.city && !(v === '' && state.sector);
      else on = !!state.city && v === state.city;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    $$('[data-sector-btn]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-sector-btn') === state.sector ? 'true' : 'false'); });
    var bd = BOARD[k], a = doc.querySelector('[data-board]'), f = doc.querySelector('[data-foot-note]');
    if (a) { a.href = bd.url; a.textContent = bd.label; }
    if (f) f.textContent = bd.foot;
    $$('.tabs [role="tab"]').forEach(function (t) {
      var on = t.getAttribute('data-tab') === k;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on) rows.setAttribute('aria-labelledby', t.id);
    });
  }

  function facCard(p) {
    var r = recruit[p.name];
    var badge = r ? '<a class="rec" href="' + esc(r.url || B.listUrl) + '">입주 모집 중</a>' : '';
    var ph = p.img
      ? '<div class="ph"><img src="main-img/' + p.img + '.jpg" alt="' + esc(p.name) + ' 건물" loading="lazy">' + badge + '</div>'
      : '<div class="ph model-crop"><img src="main-img/tb-model.jpg" alt="지형 모형의 태백 부분. 잘린 면에 검은 탄층이 보인다." loading="lazy"><span class="cap">태백 지형 모형</span>' + badge + '</div>';
    var area = String(p.area || '').split(' · ').map(function (x) { return esc(x); }).join('<br>');
    return '<li class="fc" data-city="' + p.city + '">' + ph + '<div class="bd"><h4>' + esc(p.name) + '</h4>' +
      '<p><b>' + area + '</b></p>' + (p.scale ? '<p>' + esc(p.scale) + '</p>' : '') + '<p class="note">' + esc(p.use) + '</p></div></li>';
  }
  var fac = doc.querySelector('[data-fac]');
  if (fac) {
    var by = G.placesByCity(), html = '', recNames = Object.keys(recruit);
    ORDER.forEach(function (c) {
      var list = by[c] || [], rc = list.filter(function (p) { return recruit[p.name]; }).length;
      html += '<li class="ct" data-city="' + c + '"><h3>' + CITY[c].s + '</h3><p class="sp">' + CITY[c].sp + '</p>' +
        G.mapSvg({ areaClass: 'ar' }).replace('data-city="' + c + '"', 'data-city="' + c + '" data-here="1"').replace('aria-label="강원특별자치도 18개 시군 지도"', 'aria-label="강원특별자치도 지도에서 ' + CITY[c].s + '의 위치"') +
        '<p class="n">시설 <b>' + list.length + '</b>곳' + (rc ? '<br>입주 모집 중 <b>' + rc + '</b>곳' : '') + '</p>' +
        '<button type="button" data-city="' + c + '" aria-pressed="false">이 시군만 보기</button></li>';
      html += list.map(facCard).join('');
    });
    var recNotices = live.filter(function (n) { return (n.types || []).indexOf('입주 공간') > -1; });
    html += '<li class="finfo"><h3>지금 입주 모집 중인 시설 ' + recNames.length + '곳</h3><p>' + esc(recNames.join(', ')) + '. 임대 조건과 신청 서류는 각 공고문에 있습니다.</p>' +
      '<ul class="frec">' + recNotices.map(function (n) {
        return '<li><a href="' + esc(n.url || B.listUrl) + '"><b>' + esc(G.badge(n).text) + '</b>' + esc(n.title) + '</a></li>';
      }).join('') + '</ul>' +
      '<div class="acts"><a href="https://www.gwtp.or.kr/gwtp/pageview.php?url=sub04a&amp;keyvalue=sub04">입주안내 보기</a><a href="https://mybiz.gwtp.or.kr/">입주기업종합지원</a></div></li>';
    fac.innerHTML = html;
  }

  var press = doc.querySelector('[data-press]');
  if (press) {
    press.innerHTML = B.news.map(function (n, i) {
      var p = n.date.split('-');
      return '<li><a href="' + esc(B.newsUrl) + '"><div class="ph"><img src="main-img/news-' + (i + 1) + '.jpg" alt="" loading="lazy"></div>' +
        '<span class="d">' + p[0] + '.' + p[1] + '.' + p[2] + '</span><span class="tt">' + esc(n.title) + '</span></a></li>';
    }).join('');
  }
  var ntc = doc.querySelector('[data-ntc]');
  if (ntc) {
    ntc.innerHTML = H.notice.map(function (it) {
      var p = it.date.split('-');
      return '<li><a href="' + esc(it.url) + '"><span class="d">' + p[0] + '.' + p[1] + '.' + p[2] + '</span><span class="tt">' + esc(it.title) + '</span></a></li>';
    }).join('');
  }

  var GROUPS = [['입주', '입주기업'], ['장비', '연구장비'], ['지원사업', '지원사업'], ['정보', '산업 정보'], ['분야', '분야별 센터']];
  function host(u) { try { return new URL(u).host; } catch (e) { return u; } }
  var sys = doc.querySelector('[data-systems]');
  if (sys) {
    var cols = [[0, 1, 2], [3, 4]];
    sys.innerHTML = cols.map(function (ix) {
      return '<div>' + ix.map(function (i) {
        var g = GROUPS[i], items = B.systems.filter(function (s) { return s.group === g[0]; });
        return '<div class="grp"><h3>' + g[1] + '</h3>' + items.map(function (s) {
          return '<a href="' + esc(s.url) + '"><b>' + esc(s.name) + '</b><span>' + esc(host(s.url)) + '</span></a>';
        }).join('') + '</div>';
      }).join('') + '</div>';
    }).join('');
  }
  var fsys = doc.querySelector('[data-fsys]');
  if (fsys) fsys.innerHTML = B.systems.map(function (s) { return '<a href="' + esc(s.url) + '">' + esc(s.name) + '</a>'; }).join('');

  renderRows();

  var go = doc.querySelector('[data-go]');
  function setCity(c, opts) {
    opts = opts || {};
    state.city = state.city === c && !opts.force ? '' : c;
    state.sector = '';
    state.tab = 'live';
    var cur = state.city;
    $$('.pin[data-pin]').forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-pin') === cur); });
    $$('.fgrid > li[data-city]').forEach(function (li) { li.hidden = !!cur && li.getAttribute('data-city') !== cur; });
    if (go) go.innerHTML = cur ? CITY[cur].s + ' 관련 공고와 시설 보기' : '지금 접수 중인 공고 <b>' + live.length + '</b>건';
    if (hint) hint.innerHTML = cur ? '<b>' + CITY[cur].s + ' ' + CITY[cur].sp + '</b>를 골랐습니다. 아래 공고와 입주 시설이 ' + CITY[cur].s + ' 기준으로 바뀌었고, 다시 누르면 전체로 돌아갑니다.' : hintDefault;
    renderRows();
  }
  var hint = doc.querySelector('[data-hint]'), hintDefault = hint ? hint.innerHTML : '';
  function setSector(s) {
    state.sector = s; state.city = ''; state.tab = 'live';
    $$('.pin[data-pin]').forEach(function (p) { p.classList.remove('on'); });
    $$('.fgrid > li[data-city]').forEach(function (li) { li.hidden = false; });
    if (go) go.innerHTML = '지금 접수 중인 공고 <b>' + live.length + '</b>건';
    if (hint) hint.innerHTML = hintDefault;
    renderRows();
  }

  doc.addEventListener('click', function (e) {
    var t = e.target.closest('button, a');
    if (!t) return;
    if (t.hasAttribute('data-clear')) { setCity('', { force: true }); return; }
    if (t.matches('button[data-city]')) {
      var c = t.getAttribute('data-city');
      if (t.closest('.chips') && c === '') { setCity('', { force: true }); return; }
      setCity(c, { force: !!t.closest('.chips') && state.city !== c });
      if (t.classList.contains('rg') && state.city) {
        var f = doc.getElementById('fac');
        if (f) f.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }
      return;
    }
    if (t.matches('a[data-sector]')) { setSector(t.getAttribute('data-sector')); return; }
    if (t.matches('[data-sector-btn]')) {
      var s = t.getAttribute('data-sector-btn');
      if (state.sector === s) setCity('', { force: true }); else setSector(s);
      return;
    }
    if (t.matches('[data-tab]')) { state.tab = t.getAttribute('data-tab'); renderRows(); return; }
    if (t.matches('[data-menu-btn]')) {
      var gnb = doc.querySelector('[data-gnb]'), open = !gnb.classList.contains('open');
      gnb.classList.toggle('open', open);
      t.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
  });
  var tl = doc.querySelector('.tabs');
  if (tl) tl.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var tabs = $$('[role="tab"]', tl), i = tabs.indexOf(doc.activeElement);
    if (i < 0) return;
    var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    state.tab = n.getAttribute('data-tab'); renderRows(); n.focus();
  });

  var gnb = doc.querySelector('[data-gnb]'), ticking = false;
  function onScroll() {
    ticking = false;
    if (gnb) gnb.classList.toggle('slim', window.scrollY > 24);
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, to = +(el.getAttribute('data-count') || el.textContent.replace(/\D/g, '')), t0 = null;
        if (!to) return;
        function step(ts) {
          if (t0 === null) t0 = ts;
          var k = Math.min((ts - t0) / 1100, 1), e2 = 1 - Math.pow(1 - k, 3);
          el.textContent = Math.round(to * e2).toLocaleString('ko-KR');
          if (k < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (el) { io.observe(el); });
  }

  if (!reduce && Element.prototype.animate) {
    $$('.dwg').forEach(function (d) {
      var busy = false;
      function play() {
        if (busy) return;
        busy = true;
        var lds = $$('.ld', d), dts = $$('.dt', d), lbs = $$('.lb', d), last = 0;
        lds.forEach(function (ld, i) {
          var side = ld.getAttribute('data-side'), up = ld.getAttribute('data-up') === '1', h = ld.classList.contains('h');
          var from;
          if (h) from = side === 'R' ? 'inset(-2px 100% -2px 0)' : 'inset(-2px 0 -2px 100%)';
          else if (side === 'R') from = up ? 'inset(100% 100% 0 0)' : 'inset(0 100% 100% 0)';
          else from = up ? 'inset(100% 0 0 100%)' : 'inset(0 0 100% 100%)';
          var to = h ? 'inset(-2px 0 -2px 0)' : 'inset(0 0 0 0)';
          var dl = i * 170;
          dts[i].animate([{ transform: 'scale(0)' }, { transform: 'scale(1.6)' }, { transform: 'scale(1)' }], { duration: 260, delay: dl, easing: 'ease-out', fill: 'backwards' });
          ld.animate([{ clipPath: from }, { clipPath: to }], { duration: 340, delay: dl + 80, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'backwards' });
          var a = lbs[i].animate([{ opacity: 0, transform: 'translate(' + (side === 'R' ? '-8px' : '8px') + ', -50%)' }, { opacity: 1, transform: 'translate(0, -50%)' }], { duration: 260, delay: dl + 360, easing: 'ease-out', fill: 'backwards' });
          last = a;
        });
        if (last) last.onfinish = function () { setTimeout(function () { busy = false; }, 400); };
        else busy = false;
      }
      d.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') play(); });
      d.addEventListener('focusin', play);
    });
  }
})();

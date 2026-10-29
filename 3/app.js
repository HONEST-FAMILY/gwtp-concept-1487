(function () {
  var G = window.GW;
  var RIDGE = window.GW_RIDGE;
  var FAC = 'https://www.gwtp.or.kr/gwtp/pageview.php?url=sub04c&keyvalue=sub04';
  var STATIONS = [
    { city: '춘천시', name: '춘천', field: '바이오', ico: 'bio' },
    { city: '홍천군', name: '홍천', field: '항체의약품소재', ico: 'antibody' },
    { city: '원주시', name: '원주', field: '디지털헬스케어', ico: 'health' },
    { city: '강릉시', name: '강릉', field: '세라믹', ico: 'semi' },
    { city: '태백시', name: '태백', field: '경석자원', ico: 'rock' },
    { city: '삼척시', name: '삼척', field: '액화수소 −253℃', ico: 'h2' }
  ];
  var SECTOR_ICO = { '반도체': 'semi', '바이오': 'bio', '디지털헬스·의료기기': 'health', '수소·에너지': 'h2', '모빌리티': 'motor', 'ICT·데이터': 'ai', '정보보호': 'ai' };
  var esc = G.esc;

  var byCity = G.placesByCity();

  function station(s) {
    var n = (byCity[s.city] || []).length;
    return '<a class="st" href="' + FAC + '" aria-label="' + s.name + ' ' + s.field.replace(' −253℃', '') + ' 특화, 시설 ' + n + '곳">' +
      '<svg class="ico" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><use href="#i-' + s.ico + '"/></svg>' +
      '<b>' + s.name + '</b><span class="fld">' + s.field + '</span><span class="cnt">시설 ' + n + '곳</span></a>';
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

  var list = document.getElementById('list');
  var title = document.getElementById('nowTitle');
  var count = document.getElementById('nowCount');

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
    return '<span class="tag"><svg class="ico-s" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><use href="#i-' + SECTOR_ICO[s] + '"/></svg>' + esc(s) + '</span>';
  }

  function item(n) {
    var b = dd(n);
    return '<li><a href="' + esc(n.url) + '" target="_blank" rel="noopener">' +
      '<span class="dd ' + b.c + '">' + b.t + '</span>' +
      '<span class="tt">' + esc(n.title) + '</span>' +
      '<span class="when">' + esc(when(n)) + '</span>' +
      '<span class="dept">' + esc(n.dept) + '</span>' + tag(n) + '</a></li>';
  }

  function showLive() {
    var live = G.live().sort(G.byDeadline);
    title.firstChild.nodeValue = '지금 접수 중인 공고 ';
    count.textContent = live.length + '건';
    list.innerHTML = live.slice(0, 4).map(item).join('');
  }

  function showSearch(q) {
    var r = G.search(q);
    title.firstChild.nodeValue = '‘' + q + '’ 검색 결과 ';
    count.textContent = '공고 ' + r.notices.length + '건' + (r.places.length ? ', 시설 ' + r.places.length + '곳' : '');
    list.innerHTML = r.notices.length ? r.notices.slice(0, 4).map(item).join('') : '<li class="empty">‘' + esc(q) + '’에 맞는 공고가 없습니다. 분야 이름이나 시군 이름으로 찾아보세요.</li>';
  }

  var input = document.getElementById('q');
  var timer = 0;
  function run() { var q = input.value.trim(); if (q) showSearch(q); else showLive(); }
  document.getElementById('searchForm').addEventListener('submit', function (e) { e.preventDefault(); run(); });
  input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 220); });

  showLive();
})();

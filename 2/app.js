(function () {
  var G = window.GW;
  if (!G) return;
  var live = G.live().slice().sort(G.byDeadline);
  document.querySelectorAll('[data-live]').forEach(function (el) { el.textContent = live.length; });
  var list = document.querySelector('[data-list]');
  if (!list) return;
  var dated = live.filter(function (n) { return G.dday(n) !== null; });
  var pick = dated.concat(live.filter(function (n) { return dated.indexOf(n) < 0; })).slice(0, 4);
  list.innerHTML = pick.map(function (n) {
    var b = G.badge(n), d = G.dday(n);
    var dd = d === null ? b.text : (d === 0 ? '오늘 마감' : 'D-' + d);
    var cls = d === null ? 'dd always' : 'dd';
    var url = n.url || 'https://www.gwtp.or.kr/gwtp/bbsNew_list.php?code=sub01b&keyvalue=sub01';
    return '<li><a href="' + G.esc(url) + '"><span class="' + cls + '">' + G.esc(dd) + '</span>' +
      '<span class="t">' + G.esc(n.title) + '</span>' +
      '<span class="m">' + G.esc(G.deadlineText(n)) + '</span>' +
      '<span class="m">' + G.esc(n.dept || '') + '</span></a></li>';
  }).join('');
})();

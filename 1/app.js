(function () {
  var GW = window.GW;
  if (!GW) return;
  var live = GW.live().sort(GW.byDeadline);
  document.getElementById('liveCount').textContent = live.length;
  var pick = live.filter(function (n) { return GW.status(n) === 'open'; }).slice(0, 3);
  if (pick.length < 3) pick = pick.concat(live.filter(function (n) { return pick.indexOf(n) < 0; }).slice(0, 3 - pick.length));
  document.getElementById('nowList').innerHTML = pick.map(function (n) {
    var b = GW.badge(n);
    var href = String(n.url || '').split('||')[0] || 'https://www.gwtp.or.kr/gwtp/bbsNew_list.php?code=sub01b&keyvalue=sub01';
    return '<li><a href="' + GW.esc(href) + '" target="_blank" rel="noopener">' +
      '<span class="dd ' + b.cls + '">' + GW.esc(b.text) + '</span>' +
      '<span class="t">' + GW.esc(n.title) + '</span>' +
      '<span class="m">' + GW.esc(GW.deadlineText(n)) + '<br>' + GW.esc(n.dept || '') + '</span></a></li>';
  }).join('');
})();

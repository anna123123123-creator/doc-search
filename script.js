(function () {
  'use strict';

  var EXAMPLE_DOC = [
    '退款政策\n本平台支持商品签收后 7 天内无理由退款。退款申请提交后，客服会在 24 小时内审核，审核通过后 3-5 个工作日原路退回。',
    '发货说明\n订单支付成功后，我们会在 24 小时内安排发货。偏远地区可能需要额外 1-2 天。发货后可以在订单详情页查看物流信息。',
    '账号安全\n请不要把账号密码告诉任何人，包括自称是客服的人员。官方客服不会以任何理由索要你的密码或验证码。',
    '会员等级\n累计消费满 500 元升级为白银会员，满 2000 元升级为黄金会员。会员等级越高，享受的折扣和专属客服响应速度也越高。',
    '联系方式\n工作日 9:00-18:00 可以通过在线客服联系我们，节假日响应会有延迟，紧急问题可以发邮件到 support@example.com。',
  ].join('\n\n');

  var docInput = document.getElementById('docInput');
  var queryInput = document.getElementById('queryInput');
  var queryForm = document.getElementById('queryForm');
  var resultList = document.getElementById('resultList');

  function splitParagraphs(text) {
    return text.split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean);
  }

  function tokenize(text) {
    var tokens = [];
    var words = text.match(/[a-zA-Z0-9]+/g);
    if (words) tokens = tokens.concat(words.map(function (w) { return w.toLowerCase(); }));
    var cjkRuns = text.match(/[一-鿿]+/g);
    if (cjkRuns) {
      cjkRuns.forEach(function (run) {
        if (run.length === 1) {
          tokens.push(run);
        } else {
          for (var i = 0; i < run.length - 1; i++) tokens.push(run.slice(i, i + 2));
        }
      });
    }
    return tokens;
  }

  function search(doc, query) {
    var paragraphs = splitParagraphs(doc);
    if (!paragraphs.length || !query.trim()) return [];

    var paraTokenSets = paragraphs.map(function (p) { return new Set(tokenize(p)); });

    var df = {};
    paraTokenSets.forEach(function (set) {
      set.forEach(function (tok) { df[tok] = (df[tok] || 0) + 1; });
    });

    var queryTokens = Array.from(new Set(tokenize(query)));
    var N = paragraphs.length;

    var scored = paragraphs.map(function (p, i) {
      var score = 0;
      var matched = [];
      queryTokens.forEach(function (tok) {
        if (paraTokenSets[i].has(tok)) {
          score += Math.log(1 + N / (df[tok] || 1));
          matched.push(tok);
        }
      });
      return { text: p, score: score, matched: matched };
    });

    return scored.filter(function (s) { return s.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 5);
  }

  function escapeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlight(text, matchedTokens) {
    if (!matchedTokens.length) return escapeHTML(text);
    var sorted = matchedTokens.slice().sort(function (a, b) { return b.length - a.length; });
    var pattern = new RegExp(sorted.map(escapeRegExp).join('|'), 'gi');
    var out = '';
    var lastIndex = 0;
    var match;
    while ((match = pattern.exec(text)) !== null) {
      out += escapeHTML(text.slice(lastIndex, match.index));
      out += '<mark>' + escapeHTML(match[0]) + '</mark>';
      lastIndex = match.index + match[0].length;
      if (match.index === pattern.lastIndex) pattern.lastIndex++;
    }
    out += escapeHTML(text.slice(lastIndex));
    return out;
  }

  function render(results) {
    resultList.innerHTML = '';
    if (!results.length) {
      resultList.innerHTML = '<div class="empty-hint">没有找到相关段落，换个关键词试试。</div>';
      return;
    }
    results.forEach(function (r, i) {
      var item = document.createElement('div');
      item.className = 'result-item';
      var scoreEl = document.createElement('div');
      scoreEl.className = 'score';
      scoreEl.textContent = '相关度 #' + (i + 1) + '  ·  score ' + r.score.toFixed(2);
      var p = document.createElement('p');
      p.innerHTML = highlight(r.text, r.matched);
      item.appendChild(scoreEl);
      item.appendChild(p);
      resultList.appendChild(item);
    });
  }

  function runSearch() {
    var results = search(docInput.value, queryInput.value);
    render(results);
  }

  queryForm.addEventListener('submit', function (e) {
    e.preventDefault();
    runSearch();
  });

  document.getElementById('btnExample').addEventListener('click', function () {
    docInput.value = EXAMPLE_DOC;
    queryInput.value = '怎么申请退款';
    runSearch();
  });

  docInput.value = EXAMPLE_DOC;
  queryInput.value = '怎么申请退款';
  runSearch();
})();

/* Forever API docs: a static, hash-routed page over window.API (written by tools/site.py). */
(function () {
  "use strict";
  var A = window.API;
  var main = document.getElementById("main");
  var STATUS = {
    "verified": ["✓", "verified", "Confirmed in game"],
    "undocumented": ["＋", "game only", "In game, not in Blizzard's docs (Forever-only or legacy)"],
    "not-in-game": ["✕", "not in game", "In Blizzard's docs, not in this client"],
    "unverified": ["?", "unverified", "Not checked in game yet"]
  };
  var FN_KIND = { fC: "built-in", fL: "Lua", "f?": "function" };
  var FLAG_WORDS = {
    IsProtectedFunction: "protected", HasRestrictions: "restricted in some situations",
    SecretReturns: "always secret", SecretWhenInCombat: "secret in combat",
    SecretWhenUnitAuraRestricted: "secret while auras restricted", SecretWhenUnitStatsRestricted: "secret while stats restricted",
    SecretWhenUnitIdentityRestricted: "secret while identity restricted", SecretWhenUnitSpellCastRestricted: "secret while casts restricted",
    SecretWhenUnitPowerRestricted: "secret while power restricted", SecretWhenCooldownsRestricted: "secret while cooldowns restricted",
    SecretInChatMessagingLockdown: "secret in chat lockdown", ConditionalSecret: "secret in some conditions",
    ReturnsNeverSecret: "never secret", SynchronousEvent: "synchronous", UniqueEvent: "unique", MayReturnNothing: "may return nothing"
  };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function enc(s) { return encodeURIComponent(s); }
  function pill(status) { var s = STATUS[status] || STATUS.unverified; return '<span class="pill s-' + esc(status) + '" title="' + esc(s[2]) + '">' + s[0] + " " + s[1] + "</span>"; }
  function keys(o) { return Object.keys(o || {}); }
  function sortStr(a, b) { a = a.toLowerCase(); b = b.toLowerCase(); return a < b ? -1 : a > b ? 1 : 0; }

  // ---------------------------------------------------------------- indexes
  var pages = {};   // page name -> { ns, fns:[], events:[], types:[] }
  var nsPage = {};
  function page(name) { return pages[name] || (pages[name] = { ns: null, fns: [], events: [], types: [] }); }
  keys(A.F).forEach(function (k) { var f = A.F[k]; if (f.sys && f.ns && !nsPage[f.ns]) nsPage[f.ns] = f.sys; });
  keys(A.F).forEach(function (k) {
    var f = A.F[k]; f.key = k;
    var p = f.sys || (f.ns ? (nsPage[f.ns] || f.ns) : null);
    f.page = p;
    if (p) { var pg = page(p); pg.fns.push(k); if (f.ns) pg.ns = pg.ns || f.ns; }
  });
  keys(A.E).forEach(function (k) { var e = A.E[k]; if (e.sys) page(e.sys).events.push(k); });
  keys(A.T).forEach(function (k) { var t = A.T[k]; if (t.sys) page(t.sys).types.push(k); });
  var pageNames = keys(pages).sort(sortStr);

  function count(list, getter) {
    var c = { verified: 0, undocumented: 0, "not-in-game": 0, unverified: 0 };
    list.forEach(function (x) { c[getter(x)] = (c[getter(x)] || 0) + 1; });
    return c;
  }

  // search index
  var SEARCH = [];
  keys(A.F).forEach(function (k) { var f = A.F[k]; SEARCH.push([k.toLowerCase(), "function", k, f.s, f.ui ? 1 : 0]); });
  keys(A.E).forEach(function (k) { SEARCH.push([k.toLowerCase(), "event", k, A.E[k].s, 0]); });
  keys(A.T).forEach(function (k) { var t = A.T[k]; SEARCH.push([k.toLowerCase(), t.k === "Enumeration" ? "enum" : t.k === "Constants" ? "constants" : "type", k, t.s || "", 0]); });
  keys(A.W).forEach(function (k) { SEARCH.push([k.toLowerCase(), "widget", k, A.W[k].err ? "not-in-game" : "verified", 0]); });
  keys(A.C).forEach(function (k) { SEARCH.push([k.toLowerCase(), "cvar", k, "verified", 1]); });
  pageNames.forEach(function (k) { SEARCH.push([k.toLowerCase(), "system", k, "", 0]); });
  function link(kind, key) {
    return { "function": "#/fn/", event: "#/event/", "enum": "#/type/", constants: "#/type/", type: "#/type/",
      widget: "#/widget/", cvar: "#/cvars/", system: "#/system/" }[kind] + enc(key);
  }

  // ---------------------------------------------------------------- pieces
  var GL = window.GLOSSARY || {}, FL = window.FLAGS || {}, GUIDES = window.GUIDES || [];
  function typeLink(t) {
    var base = String(t).replace(/\[\]$/, "");
    var label = esc(t);
    if (A.T[base]) return '<a class="t" href="#/type/' + enc(base) + '">' + label + "</a>";
    if (GL[base]) return '<a class="t gl" href="#/glossary/' + enc(base) + '" title="' + esc(GL[base][0] + (GL[base][1] ? ". " + GL[base][1] : "")) + '">' + label + "</a>";
    return '<span class="t">' + label + "</span>";
  }

  // ------------------------------------------------------------ plain English
  function plainType(t) {
    t = String(t || "?");
    if (/\[\]$/.test(t)) return "a list of " + plainType(t.slice(0, -2)).replace(/^(an?|one of the) /, "");
    if (GL[t]) return GL[t][0];
    var T = A.T[t];
    if (T && T.k === "Enumeration") return 'one of the <a href="#/type/' + enc(t) + '">' + esc(t) + "</a> values (a number)";
    if (T) return 'a <a href="#/type/' + enc(t) + '">' + esc(t) + "</a> table";
    return esc(t);
  }
  function plainParams(list, returning) {
    return (list || []).map(function (a) {
      var bits = "<code>" + esc(a[0]) + "</code>: " + plainType(a[1]);
      if (a[2]) bits += returning ? ", or nothing" : ' <span class="muted">(optional' + (a[3] != null ? ", default " + esc(a[3]) : "") + ")</span>";
      else if (a[3] != null) bits += ' <span class="muted">(default ' + esc(a[3]) + ")</span>";
      return "<li>" + bits + (a[4] ? " — " + esc(a[4]) : "") + "</li>";
    }).join("");
  }
  var VERB = { Get: "Gets", Set: "Sets", Is: "True if", Has: "True if it has", Can: "True if it can", Should: "True if it should",
    Are: "True if", Does: "True if it does", Num: "The number of" };
  function fromName(name) {
    var words = String(name).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2").split(" ");
    var first = words.shift();
    var rest = words.join(" ").toLowerCase().replace(/\bid\b/g, "ID").replace(/\bui\b/g, "UI").replace(/\bguid\b/g, "GUID");
    if (!rest) return null;
    if (first === "Unit") return "The unit's " + rest + ".";
    var verb = VERB[first] || (/(s|sh|ch|x)$/.test(first) ? first + "es" : /[^aeiou]y$/.test(first) ? first.slice(0, -1) + "ies" : first + "s");
    return verb + " " + rest + ".";
  }
  var SAMPLE_WORDS = { unit: '"player"', guid: "your GUID", spell: "a spell from your spellbook", item: "Hearthstone (6948)",
    itemloc: "your first equipped item", map: "your current map", quest: "the first quest in your log", "class": "your class",
    race: "your race", club: "your guild", playerloc: "you", nil: "nil", "b:false": "false" };
  function argText(arg) {
    if (!arg) return "no arguments";
    return String(arg).split(",").map(function (d) {
      if (SAMPLE_WORDS[d]) return SAMPLE_WORDS[d];
      if (/^n:/.test(d)) return d.slice(2);
      if (/^s:/.test(d)) return '"' + d.slice(2) + '"';
      return d;
    }).join(", ");
  }
  function allSecret(r) { return !!(r && r.returns && r.returns.length && r.returns.every(function (v) { return /^secret/.test(v); })); }
  function anySecret(r) { return !!(r && (r.returns || []).some(function (v) { return /^secret/.test(v); })); }
  function refused(r) { return !!(r && (r.forbidden || /forbidden|blocked/.test(r.skipped || ""))); }
  // [tone, sentence]: what an add-on author should take away, from what the game did
  function verdict(f) {
    var o = f.o, c = f.c, fl = f.fl || {};
    if (f.s === "not-in-game") return ["bad", "Not in this client. Don't use it."];
    if (/whole namespace/.test(((o || {}).skipped || ""))) return ["bad", "Not called: other functions in this namespace crashed the client (Forever's housing system is missing). Treat the whole namespace as unusable."];
    if (/crash/.test(((o || {}).skipped || "") + ((c || {}).skipped || ""))) return ["bad", "Crashed the client when called with no arguments. Avoid it until someone tests it with real arguments."];
    if (refused(o)) return ["bad", "Add-ons can't call this: the client refused the probe's call."];
    if (refused(c)) return ["warn", "Works out of combat; blocked in combat. Call it out of combat only."];
    if (o && o.missing) return ["bad", "Missing when the probe called it."];
    if (allSecret(o)) return ["secret", "Always secret, even out of combat. You can hand the value to widgets that accept secrets, but your code can't read, compare or do math on it."];
    if (o && o.n != null) {
      if (!c) return ["ok", "Worked out of combat. Not tried in combat."];
      if (c.error != null) return ["warn", "Works out of combat; errors in combat for add-on code. Call it out of combat only."];
      if (anySecret(c) && !anySecret(o)) return ["secret", "Works out of combat. In combat the result is " + (allSecret(c) ? "" : "partly ") + "secret: show it with a widget that accepts secrets, but don't compare or calculate with it."];
      return ["ok", "Worked in and out of combat with no restrictions seen."];
    }
    if (o && o.skipped) return ["plain", "Not called: " + o.skipped + " on the probe's character. Exists in game."];
    if (o && o.error != null && o.arg && o.arg !== "unit") return ["plain", "Errored with the probe's sample arguments (" + argText(o.arg) + "), so only its existence is confirmed; the error below says why."];
    if (o && /Usage|bad argument|Invalid/.test(o.error || "")) return ["plain", "Needs arguments. The probe called it with none, so only its existence is confirmed; the error below says what it expects."];
    if (o && o.error != null) return ["warn", "Errored when the probe called it with " + argText(o.arg) + "."];
    if (fl.IsProtectedFunction) return ["bad", "Protected, says Blizzard's docs: add-ons can't call it. Not tested in game."];
    if (f.s === "unverified") return ["plain", "Not checked in game yet."];
    return ["plain", "Exists in game. The probe didn't call it (it needs arguments or isn't a getter), so its behaviour is untested."];
  }
  function params(list) {
    return (list || []).map(function (a) {
      var s = esc(a[0]) + ": " + typeLink(a[1]) + (a[2] ? "?" : "");
      if (a[3] != null) s += ' <span class="opt">= ' + esc(a[3]) + "</span>";
      return s;
    }).join(", ");
  }
  function signature(name, args, rets) {
    var s = esc(name) + "(" + params(args) + ")";
    if (rets && rets.length) s += "\n  → " + params(rets);
    return '<div class="sig">' + s + "</div>";
  }
  function flagPills(fl) {
    return keys(fl).filter(function (k) { return fl[k] !== false; }).sort().map(function (k) {
      var word = FLAG_WORDS[k] || (fl[k] === true ? k : k + ": " + fl[k]);
      if (k === "SecretArguments") word = "secret args: " + fl[k];
      var cls = /Secret/.test(k) && k !== "ReturnsNeverSecret" && k !== "SecretArguments" ? "p-secret" : /Protected|Restrict|Requires/.test(k) ? "p-warn" : "p-plain";
      return '<span class="pill ' + cls + '" title="' + esc((FL[k] || k) + " (Blizzard's docs; not checked in game)") + '">' + esc(word) + "</span>";
    }).join("");
  }
  function callCell(r, long) {
    if (!r) return '<span class="muted">—</span>';
    if (r.skipped) return '<span class="pill p-bad">' + esc(r.skipped) + "</span>";
    if (r.forbidden) return '<span class="pill p-bad">protected</span>';
    if (r.missing) return '<span class="pill p-bad">missing</span>';
    if (r.error != null) return long ? '<span class="err">' + esc(r.error) + "</span>" : '<span class="pill p-warn" title="' + esc(r.error) + '">error</span>';
    var rets = r.returns || [];
    if (!long) {
      var sec = rets.filter(function (v) { return /^secret/.test(v); }).length;
      if (rets.length && sec === rets.length) return '<span class="pill p-secret">secret</span>';
      if (sec) return '<span class="pill p-secret">partly secret</span>';
      return '<span class="muted">' + r.n + " value" + (r.n === 1 ? "" : "s") + "</span>";
    }
    if (!r.n) return '<span class="muted">returned nothing</span>';
    return '<span class="ret">' + rets.map(function (v) { return '<code class="' + (/^secret/.test(v) ? "sec" : "") + '">' + esc(v) + "</code>"; }).join("") + "</span>";
  }
  function same(a, b) { return JSON.stringify(a || null) === JSON.stringify(b || null); }

  function fnCard(k) {
    var f = A.F[k];
    var h = '<div class="card" id="' + esc(k) + '"><div class="head"><h3><a href="#/fn/' + enc(k) + '">' + esc(k) + "</a></h3>" + pill(f.s);
    if (f.g) h += '<span class="pill p-plain">' + esc(FN_KIND[f.g.split("!")[0]] || f.g) + "</span>";
    if (f.ui) h += '<span class="pill p-plain">Blizzard UI Lua</span>';
    h += "</div>";
    var v = verdict(f);
    h += '<div class="verdict v-' + v[0] + '"><b>In practice:</b> ' + esc(v[1]) + "</div>";
    if (f.d) h += "<p>" + esc(f.d) + "</p>";
    else {
      var guess = fromName(k.split(".").pop());
      if (guess) h += "<p>" + esc(guess) + ' <span class="note">(explanation, from its name)</span></p>';
    }
    if (f.a || f.r) {
      h += signature(k, f.a, f.r);
      h += '<div class="plain">' + (f.a && f.a.length ? "<div><b>You give</b><ul>" + plainParams(f.a) + "</ul></div>" : "<div><b>You give</b> nothing.</div>") +
        (f.r && f.r.length ? "<div><b>You get back</b><ul>" + plainParams(f.r, true) + "</ul></div>" : "<div><b>You get back</b> nothing.</div>") + "</div>";
    }
    var kv = "";
    if (f.fl) kv += "<div>Blizzard flags</div><div><div class=\"flags\">" + flagPills(f.fl) + '</div><div class="note">From the client docs; the call results below are what the game did.</div></div>';
    if (f.o && f.o.arg) kv += "<div>Called with</div><div>" + esc(argText(f.o.arg)) + ' <span class="note">(sample arguments)</span></div>';
    if (f.o) kv += "<div>Out of combat</div><div>" + callCell(f.o, true) + "</div>";
    if (f.c) kv += "<div>In combat</div><div>" + callCell(f.c, true) + (same(f.c.returns, f.o && f.o.returns) && !f.c.error === !(f.o && f.o.error) ? ' <span class="note">(same)</span>' : "") + "</div>";
    if (f.rep) kv += '<div>Warning</div><div><span class="pill p-warn">replaced by the add-on ' + esc(f.rep) + "</span></div>";
    if (f.w) kv += "<div>Web lead</div><div>" + esc(f.w.text || "") + ' <a href="' + esc(f.w.url || "#") + '">' + esc(f.w.site || "source") + '</a> <span class="note">(unverified)</span></div>';
    if (f.u) kv += "<div>Used by</div><div><code>" + esc(f.u) + "</code></div>";
    if (typeof f.ui === "string") kv += "<div>Defined in</div><div><code>" + esc(f.ui) + "</code></div>";
    if (f.page) kv += '<div>System</div><div><a href="#/system/' + enc(f.page) + '">' + esc(f.page) + "</a>" + (f.file ? ' <span class="note">' + esc(f.file) + "</span>" : "") + "</div>";
    if (kv) h += '<div class="kv">' + kv + "</div>";
    return h + "</div>";
  }

  function eventCard(k) {
    var e = A.E[k];
    var h = '<div class="card" id="' + esc(k) + '"><div class="head"><h3><a href="#/event/' + enc(k) + '">' + esc(k) + "</a></h3>" + pill(e.s);
    if (e.chk === "forbidden" || e.chk === "blocked") h += '<span class="pill p-bad">add-ons may not register</span>';
    h += "</div>";
    if (e.p) h += '<div class="sig">' + esc(k) + "(" + params(e.p) + ')</div><div class="plain"><div><b>Handlers receive</b><ul>' + plainParams(e.p) + "</ul></div></div>";
    else if (e.src === "client-docs") h += '<div class="sig">' + esc(k) + "()</div>";
    if (e.d) h += "<p>" + esc(e.d) + "</p>";
    var kv = "";
    if (e.fl) kv += "<div>Blizzard flags</div><div class=\"flags\">" + flagPills(e.fl) + "</div>";
    if (e.chk) kv += "<div>RegisterEvent</div><div><code>" + esc(e.chk) + "</code></div>";
    if (e.live) kv += "<div>Seen firing</div><div>" + e.live.n + " times, " + e.live.combat + " in combat · argument kinds " +
      keys(e.live.sigs).map(function (s) { return "<code>" + esc(s || "(none)") + "</code>"; }).join(" ") +
      ' <div class="note">n number, s string, b boolean, t table, S secret, - nil</div></div>';
    if (e.u) kv += "<div>Used by</div><div><code>" + esc(e.u) + "</code></div>";
    if (e.sys) kv += '<div>System</div><div><a href="#/system/' + enc(e.sys) + '">' + esc(e.sys) + "</a></div>";
    if (kv) h += '<div class="kv">' + kv + "</div>";
    return h + "</div>";
  }

  function typeCard(k) {
    var t = A.T[k];
    var h = '<div class="card" id="' + esc(k) + '"><div class="head"><h3><a href="#/type/' + enc(k) + '">' + esc(k) + '</a></h3><span class="pill p-plain">' + esc(t.k) + "</span>" + (t.s ? pill(t.s) : "") + "</div>";
    if (t.d) h += "<p>" + esc(t.d) + "</p>";
    var enumish = t.k === "Enumeration" || t.k === "Constants";
    if (t.f && t.f.length) {
      h += '<div class="tablewrap"><table><tr><th>Name</th><th>' + (enumish ? "Value" : "Type") + "</th>" + (enumish ? "" : "<th>Notes</th>") + "</tr>";
      t.f.forEach(function (x) {
        h += '<tr><td class="mono">' + esc(x[0]) + '</td><td class="mono">' + (enumish ? esc(x[3]) : typeLink(x[1]) + (x[2] ? "?" : "")) + "</td>" +
          (enumish ? "" : "<td>" + (x[4] != null ? "default <code>" + esc(x[4]) + "</code> " : "") + esc(x[5] || "") + "</td>") + "</tr>";
      });
      h += "</table></div>";
    }
    if (t.gv) {
      h += '<div class="tablewrap"><table><tr><th>Name</th><th>Value in game</th></tr>';
      t.gv.forEach(function (x) { h += '<tr><td class="mono">' + esc(x[0]) + '</td><td class="mono">' + esc(typeof x[1] === "object" ? JSON.stringify(x[1]) : x[1]) + "</td></tr>"; });
      h += "</table></div>";
    }
    (t.mm || []).forEach(function (m) { h += '<p><span class="pill p-warn">differs</span> <code>' + esc(m[0]) + "</code>: docs say " + esc(m[1]) + ", game has " + esc(m[2] == null ? "nothing" : String(m[2]).replace(/^n:/, "")) + "</p>"; });
    if (t.sys) h += '<div class="kv"><div>System</div><div><a href="#/system/' + enc(t.sys) + '">' + esc(t.sys) + "</a></div></div>";
    return h + "</div>";
  }

  // lists that can be long: render in slices
  function bigList(id, items, rowFn, header, step) {
    step = step || 300;
    var shown = 0;
    var holder = document.getElementById(id);
    function more() {
      var html = items.slice(shown, shown + step).map(rowFn).join("");
      shown += step;
      var tb = holder.querySelector("tbody");
      tb.insertAdjacentHTML("beforeend", html);
      var m = holder.querySelector(".more");
      m.innerHTML = shown < items.length ? "<button>Show more (" + (items.length - shown) + " left)</button>" : "";
      if (m.firstChild) m.firstChild.onclick = more;
    }
    holder.innerHTML = '<div class="tablewrap"><table><thead>' + header + "</thead><tbody></tbody></table></div><div class=\"more\"></div>" +
      (items.length ? "" : '<p class="muted">Nothing matches.</p>');
    more();
  }

  function filterBar(id, opts) {
    var h = '<div class="toolbar" id="' + id + '"><input type="search" placeholder="Filter by name" spellcheck="false">';
    (opts || []).forEach(function (o) { h += '<button class="chip" data-v="' + esc(o[0]) + '">' + esc(o[1]) + "</button>"; });
    return h + "</div>";
  }
  function wireFilter(id, onChange) {
    var bar = document.getElementById(id), input = bar.querySelector("input"), active = null;
    bar.querySelectorAll(".chip").forEach(function (c) {
      c.onclick = function () {
        active = active === c.dataset.v ? null : c.dataset.v;
        bar.querySelectorAll(".chip").forEach(function (x) { x.classList.toggle("on", x.dataset.v === active); });
        onChange(input.value.trim().toLowerCase(), active);
      };
    });
    input.oninput = function () { onChange(input.value.trim().toLowerCase(), active); };
    onChange("", null);
  }
  var STATUS_CHIPS = [["verified", "✓ verified"], ["undocumented", "＋ game only"], ["not-in-game", "✕ not in game"]];

  // ---------------------------------------------------------------- views
  function bar(c) {
    var total = c.verified + c.undocumented + c["not-in-game"] + c.unverified || 1;
    return '<div class="bar">' + [["verified", "var(--ok)"], ["undocumented", "var(--new)"], ["not-in-game", "var(--bad)"], ["unverified", "var(--unk)"]].map(function (x) {
      return '<span style="width:' + (100 * c[x[0]] / total) + "%;background:" + x[1] + '" title="' + c[x[0]] + " " + STATUS[x[0]][1] + '"></span>';
    }).join("") + "</div>";
  }
  function legend() {
    return '<div class="legend">' + keys(STATUS).map(function (s) { return pill(s) + ' <span class="muted">' + esc(STATUS[s][2]) + "</span>"; }).join("") + "</div>";
  }

  function viewHome() {
    var m = A.meta || {};
    var api = keys(A.F).filter(function (k) { return !A.F[k].ui; });
    var cf = count(api, function (k) { return A.F[k].s; });
    var ce = count(keys(A.E), function (k) { return A.E[k].s; });
    var enums = keys(A.T).filter(function (k) { return A.T[k].k === "Enumeration" || A.T[k].k === "Constants"; });
    var ct = count(enums, function (k) { return A.T[k].s; });
    var calls = A.calls || {};
    function stat(n, l, c) { return '<div class="stat"><div class="n">' + n.toLocaleString() + '</div><div class="l">' + l + "</div>" + (c ? bar(c) : "") + "</div>"; }
    var h = "<h1>WoW Forever add-on API</h1>";
    h += '<p class="lede">What this client\'s add-on API really is. Anything marked verified was confirmed by the ApiProbe add-on in game; Blizzard\'s own docs, shipped in the client, supply signatures and descriptions and stay leads until the game agrees.</p>';
    h += '<div class="stats">' + stat(api.length, "client API functions", cf) + stat(keys(A.E).length, "events", ce) + stat(enums.length, "enums and constant groups", ct) +
      stat(keys(A.W).filter(function (k) { return !A.W[k].err; }).length, "widget types") + stat(keys(A.C).length, "CVars and commands") + "</div>";
    h += legend();
    h += "<h2>Where this comes from</h2><table>";
    h += "<tr><td>Game dump</td><td>" + (m.probe ? "ApiProbe " + esc(m.probe) + " on client <code>" + esc(m.key) + "</code>, interface " + esc(m.toc) + ", " + esc(m.locale) : '<span class="pill s-unverified">none yet</span>') + "</td></tr>";
    h += "<tr><td>Getter calls</td><td>out of combat: " + (calls.outside && calls.outside.done ? "done" : "not run") + " · in combat: " + (calls.combat && calls.combat.done ? "done" : "not run") + "</td></tr>";
    h += "<tr><td>Client docs</td><td>Blizzard_APIDocumentationGenerated from client <code>" + esc(A.client) + "</code></td></tr>";
    h += "<tr><td>Events checked with</td><td>" + esc(A.eventCheck || "nothing yet") + "</td></tr>";
    h += "<tr><td>Generated</td><td>" + esc(A.generated) + "</td></tr></table>";
    h += '<h2>Good starting points</h2><ul><li><a href="#/guide/reading">How to read this site</a></li>' +
      '<li><a href="#/guide/secrets">Secret values</a> and <a href="#/guide/combat">combat on Forever</a>, in plain words</li>' +
      '<li><a href="#/restrictions">What changes in combat, what is secret, what is blocked</a></li>' +
      '<li><a href="#/globals">Global functions Blizzard never documented</a></li><li><a href="#/events">Events, with what was seen firing</a></li></ul>';
    if (keys(A.tainted).length) h += '<p class="note">Globals made by other add-ons were left out: ' + keys(A.tainted).sort(sortStr).map(function (k) { return esc(k) + " (" + A.tainted[k] + ")"; }).join(", ") + ".</p>";
    main.innerHTML = h;
  }

  function viewSystems() {
    main.innerHTML = '<h1>Systems</h1><p class="lede">Blizzard groups the API into systems, mostly one per <code>C_</code> namespace. Namespaces Blizzard\'s docs don\'t mention get their own entry.</p>' +
      filterBar("sf") + '<div id="sl"></div>';
    wireFilter("sf", function (q) {
      var names = pageNames.filter(function (n) { return !q || n.toLowerCase().indexOf(q) >= 0 || (pages[n].ns || "").toLowerCase().indexOf(q) >= 0; });
      bigList("sl", names, function (n) {
        var p = pages[n], c = count(p.fns, function (k) { return A.F[k].s; });
        return '<tr><td><a href="#/system/' + enc(n) + '">' + esc(n) + '</a></td><td class="mono">' + esc(p.ns || "") + "</td><td>" + p.fns.length + "</td><td>" + p.events.length +
          '</td><td style="min-width:140px">' + (p.fns.length ? '<div class="stat" style="padding:0;border:0;background:none">' + bar(c) + "</div>" : "") + "</td></tr>";
      }, "<tr><th>System</th><th>Namespace</th><th>Functions</th><th>Events</th><th>Status</th></tr>", 500);
    });
  }

  function viewSystem(name) {
    var p = pages[name];
    if (!p) return notFound(name);
    var h = "<h1>" + esc(name) + "</h1>" + (p.ns ? '<p class="lede">Namespace <code>' + esc(p.ns) + "</code></p>" : "");
    var fns = p.fns.slice().sort(sortStr);
    if (fns.length) {
      h += '<h2>Functions <span class="muted">(' + fns.length + ')</span></h2><div class="tablewrap"><table><tr><th></th><th>Function</th><th>Out of combat</th><th>In combat</th></tr>';
      fns.forEach(function (k) { var f = A.F[k]; h += "<tr><td>" + pill(f.s) + '</td><td class="mono"><a href="#/system/' + enc(name) + "/" + enc(k) + '">' + esc(k) + "</a></td><td>" + callCell(f.o) + "</td><td>" + callCell(f.c) + "</td></tr>"; });
      h += "</table></div>" + fns.map(fnCard).join("");
    }
    if (p.events.length) h += "<h2>Events</h2>" + p.events.sort(sortStr).map(eventCard).join("");
    if (p.types.length) h += "<h2>Types</h2>" + p.types.sort(sortStr).map(typeCard).join("");
    main.innerHTML = h;
  }

  function viewEvents() {
    main.innerHTML = '<h1>Events</h1><p class="lede">Checked with ' + esc(A.eventCheck || "nothing yet") + '. "Seen" counts events that fired while the probe\'s live counter was on.</p>' +
      filterBar("ef", STATUS_CHIPS.concat([["seen", "seen firing"], ["protected", "protected"]])) + '<div id="el"></div>';
    var all = keys(A.E).sort(sortStr);
    wireFilter("ef", function (q, s) {
      var items = all.filter(function (k) {
        var e = A.E[k];
        if (q && k.toLowerCase().indexOf(q) < 0) return false;
        if (s === "seen") return !!e.live;
        if (s === "protected") return e.chk === "forbidden" || e.chk === "blocked";
        return !s || e.s === s;
      });
      bigList("el", items, function (k) {
        var e = A.E[k];
        return "<tr><td>" + pill(e.s) + '</td><td class="mono"><a href="#/event/' + enc(k) + '">' + esc(k) + "</a>" + (e.chk === "forbidden" ? ' <span class="pill p-bad">protected</span>' : "") +
          "</td><td>" + (e.live ? e.live.n : "") + "</td><td>" + (e.sys ? '<a href="#/system/' + enc(e.sys) + '">' + esc(e.sys) + "</a>" : '<span class="muted">' + esc(e.u || "") + "</span>") + "</td></tr>";
      }, "<tr><th></th><th>Event</th><th>Seen</th><th>System</th></tr>");
    });
  }

  function viewTypes() {
    main.innerHTML = '<h1>Enums and structures</h1><p class="lede">Enums and constants are checked against <code>Enum</code> and <code>Constants</code> in game. Structures are table shapes from Blizzard\'s docs.</p>' +
      filterBar("tf", [["Enumeration", "enums"], ["Constants", "constants"], ["Structure", "structures"], ["undocumented", "＋ game only"], ["mismatch", "values differ"]]) + '<div id="tl"></div>';
    var all = keys(A.T).sort(sortStr);
    wireFilter("tf", function (q, s) {
      var items = all.filter(function (k) {
        var t = A.T[k];
        if (q && k.toLowerCase().indexOf(q) < 0) return false;
        if (s === "undocumented") return t.s === "undocumented";
        if (s === "mismatch") return !!t.mm;
        return !s || t.k === s;
      });
      bigList("tl", items, function (k) {
        var t = A.T[k];
        return "<tr><td>" + (t.s ? pill(t.s) : "") + '</td><td class="mono"><a href="#/type/' + enc(k) + '">' + esc(k) + "</a>" + (t.mm ? ' <span class="pill p-warn">values differ</span>' : "") +
          "</td><td>" + esc(t.k) + "</td><td>" + (t.sys ? '<a href="#/system/' + enc(t.sys) + '">' + esc(t.sys) + "</a>" : "") + "</td></tr>";
      }, "<tr><th></th><th>Name</th><th>Kind</th><th>System</th></tr>");
    });
  }

  function viewWidgets() {
    var h = '<h1>Widgets</h1><p class="lede">One object of each type was created in game and its metatable read. Methods with a Blizzard doc show its signature.</p><div class="tablewrap"><table><tr><th>Type</th><th>Methods</th><th>Script handlers</th></tr>';
    keys(A.W).sort(sortStr).forEach(function (k) {
      var w = A.W[k];
      h += w.err ? '<tr><td class="mono">' + esc(k) + '</td><td colspan="2"><span class="pill p-bad">not creatable</span> <span class="err">' + esc(w.err) + "</span></td></tr>"
        : '<tr><td class="mono"><a href="#/widget/' + enc(k) + '">' + esc(k) + "</a></td><td>" + keys(w.m).length + "</td><td>" + (w.sc || []).length + "</td></tr>";
    });
    main.innerHTML = h + "</table></div>";
  }

  function viewWidget(k) {
    var w = A.W[k];
    if (!w) return notFound(k);
    var ms = keys(w.m).sort(sortStr);
    var h = "<h1>" + esc(k) + '</h1><p class="lede">Object type reported: <code>' + esc(w.ot) + "</code> · " + ms.length + " methods</p>";
    h += "<h2>Script handlers</h2><p>" + ((w.sc || []).map(function (s) { return "<code>" + esc(s) + "</code>"; }).join(" ") || '<span class="muted">none found</span>') + "</p>";
    h += "<h2>Methods</h2>" + filterBar("wf", [["doc", "documented"], ["nodoc", "no Blizzard doc"]]) + '<div id="wl"></div>';
    main.innerHTML = h;
    wireFilter("wf", function (q, s) {
      var items = ms.filter(function (m) { return (!q || m.toLowerCase().indexOf(q) >= 0) && (!s || (s === "doc") === !!w.m[m]); });
      bigList("wl", items, function (m) {
        var sys = w.m[m], d = sys && A.O[sys] && A.O[sys][m];
        return '<tr><td class="mono">' + (d ? '<div class="sig" style="margin:0">' + esc(m) + "(" + params(d.a) + ")" + (d.r && d.r.length ? " → " + params(d.r) : "") + "</div>" : esc(m)) +
          (d && d.d ? "<p>" + esc(d.d) + "</p>" : "") + "</td><td>" + (d ? '<div class="flags">' + flagPills(d.fl) + '</div><span class="note">' + esc(sys) + "</span>" : '<span class="pill s-undocumented">＋ no doc</span>') + "</td></tr>";
      }, "<tr><th>Method</th><th>Notes</th></tr>", 400);
    });
  }

  function viewGlobals(ui) {
    var items = keys(A.F).filter(function (k) { var f = A.F[k]; return !f.sys && !f.ns && f.s === "undocumented" && !!f.ui === ui; }).sort(sortStr);
    main.innerHTML = ui
      ? '<h1>Blizzard UI functions</h1><p class="lede">Global functions written in Lua by Blizzard\'s own UI code. They exist in game, but they are UI helpers that can change with any patch, not client API.</p>' + filterBar("gf") + '<div id="gl"></div>'
      : '<h1>Undocumented globals</h1><p class="lede">In the game, in no Blizzard doc file, and not written in Blizzard\'s Lua UI: Forever additions or legacy client API. Signatures come only from what the probe saw; a no-argument call often answers with a <code>Usage:</code> error that names the arguments.</p>' +
        filterBar("gf", [["ok", "answered"], ["usage", "usage error"], ["secret", "secret in combat"]]) + '<div id="gl"></div>';
    wireFilter("gf", function (q, s) {
      var list = items.filter(function (k) {
        var f = A.F[k];
        if (q && k.toLowerCase().indexOf(q) < 0) return false;
        if (s === "ok") return f.o && f.o.n != null;
        if (s === "usage") return f.o && /Usage/.test(f.o.error || "");
        if (s === "secret") return f.c && (f.c.returns || []).some(function (v) { return /^secret/.test(v); });
        return true;
      });
      bigList("gl", list, ui ? function (k) { return '<tr><td class="mono">' + esc(k) + '</td><td class="mono muted">' + esc(typeof A.F[k].ui === "string" ? A.F[k].ui : "") + "</td></tr>"; }
        : function (k) { var f = A.F[k]; return '<tr><td class="mono"><a href="#/fn/' + enc(k) + '">' + esc(k) + "</a></td><td>" + callCell(f.o, true) + "</td><td>" + callCell(f.c) + "</td></tr>"; },
        ui ? "<tr><th>Function</th><th>Defined in</th></tr>" : "<tr><th>Function</th><th>Out of combat</th><th>In combat</th></tr>", 400);
    });
  }

  function viewRestrictions() {
    var c = A.calls || {};
    function phase(p) {
      var r = c[p] || {};
      var on = keys(r.restrictions).filter(function (k) { return r.restrictions[k] === true; });
      return (r.done ? "done" : keys(r).length ? "partial" : "not run") + (r.restrictions ? " · restrictions active: " + (on.join(", ") || "none") : "");
    }
    var fk = keys(A.F).sort(sortStr);
    var diff = fk.filter(function (k) { var f = A.F[k]; return f.o && f.c && !f.o.skipped && !f.c.skipped && JSON.stringify([f.o.n, f.o.returns, !!f.o.error]) !== JSON.stringify([f.c.n, f.c.returns, !!f.c.error]); });
    var always = fk.filter(function (k) { var r = (A.F[k].o || {}).returns; return r && r.length && r.every(function (v) { return /^secret/.test(v); }); });
    var forbidden = fk.filter(function (k) { var f = A.F[k]; return (f.o && (f.o.forbidden || /forbidden|blocked/.test(f.o.skipped || ""))) || (f.c && (f.c.forbidden || /forbidden|blocked/.test(f.c.skipped || ""))); });
    var crash = fk.filter(function (k) { var f = A.F[k]; return /crash/.test(((f.o || {}).skipped || "") + ((f.c || {}).skipped || "")); });
    var pev = keys(A.E).filter(function (k) { return A.E[k].chk === "forbidden" || A.E[k].chk === "blocked"; }).sort(sortStr);
    var h = '<h1>Restrictions seen in game</h1><p class="lede">What the probe saw, not what the docs claim. Out of combat: ' + esc(phase("outside")) + ". In combat: " + esc(phase("combat")) + ".</p>";
    function list(title, items, note) {
      return "<h2>" + title + ' <span class="muted">(' + items.length + ")</span></h2>" + (note ? '<p class="muted">' + note + "</p>" : "") +
        (items.length ? '<div class="cols">' + items.map(function (k) { return '<div><a href="#/fn/' + enc(k) + '">' + esc(k) + "</a></div>"; }).join("") + "</div>" : '<p class="muted">None.</p>');
    }
    function diffTable(title, items, note) {
      return "<h2>" + title + ' <span class="muted">(' + items.length + ")</span></h2>" + (note ? '<p class="muted">' + note + "</p>" : "") +
        '<div class="tablewrap"><table><tr><th>Function</th><th>Out of combat</th><th>In combat</th></tr>' +
        items.map(function (k) { return '<tr><td class="mono"><a href="#/fn/' + enc(k) + '">' + esc(k) + "</a></td><td>" + callCell(A.F[k].o, true) + "</td><td>" + callCell(A.F[k].c, true) + "</td></tr>"; }).join("") + "</table></div>";
    }
    var wentSecret = diff.filter(function (k) { return anySecret(A.F[k].c) && !anySecret(A.F[k].o); });
    var broke = diff.filter(function (k) { return A.F[k].c.error != null && A.F[k].o.error == null; });
    var other = diff.filter(function (k) { return wentSecret.indexOf(k) < 0 && broke.indexOf(k) < 0; });
    h += diffTable("Went secret in combat", wentSecret, "Plain out of combat, secret during the fight. Show these with widgets that accept secrets; don't compute with them in combat.");
    h += diffTable("Errored in combat", broke, "Worked out of combat, refused during the fight.");
    h += diffTable("Returned different data in combat", other, "Not a restriction: the game simply had different things to report during the fight (nameplates, threat, your form).");
    h += list("Secret even out of combat", always, "Every return value was secret on the first, out-of-combat run.");
    h += "<h2>Events add-ons may not register <span class=\"muted\">(" + pev.length + ')</span></h2><div class="cols">' + pev.map(function (k) { return '<div><a href="#/event/' + enc(k) + '">' + esc(k) + "</a></div>"; }).join("") + "</div>";
    h += list("Protected or blocked when called", forbidden, "Calling them raised ADDON_ACTION_FORBIDDEN or ADDON_ACTION_BLOCKED; the probe won't call them again.");
    h += list("Crashed the client", crash, "Never called again (sources/crashers.json).");
    var counts = {};
    fk.forEach(function (k) { var fl = A.F[k].fl || {}; keys(fl).forEach(function (f) { if (fl[f] !== false && /^(Secret|Requires|HasRestrictions|IsProtectedFunction)/.test(f)) counts[f] = (counts[f] || 0) + 1; }); });
    h += '<h2>Flags in Blizzard\'s docs</h2><p class="muted">How many functions carry each flag. Leads only.</p><div class="tablewrap"><table><tr><th>Flag</th><th>Functions</th></tr>' +
      keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).map(function (f) { return '<tr><td class="mono">' + esc(f) + "</td><td>" + counts[f] + "</td></tr>"; }).join("") + "</table></div>";
    main.innerHTML = h;
  }

  function viewCVars(focus) {
    main.innerHTML = '<h1>CVars and console commands</h1><p class="lede">From <code>C_Console.GetAllCommands</code> in game. Defaults only; the probe never reads current values.</p>' + filterBar("cf") + '<div id="cl"></div>';
    var all = keys(A.C).sort(sortStr);
    wireFilter("cf", function (q) {
      var items = all.filter(function (k) { var c = A.C[k]; return !q || k.toLowerCase().indexOf(q) >= 0 || String(c.h || "").toLowerCase().indexOf(q) >= 0; });
      bigList("cl", items, function (k) { var c = A.C[k]; return '<tr id="' + esc(k) + '"><td class="mono">' + esc(k) + '</td><td class="mono">' + esc(c.d == null ? "" : c.d) + "</td><td>" + esc(c.h || "") + "</td></tr>"; },
        "<tr><th>Name</th><th>Default</th><th>Help</th></tr>", 400);
    });
    if (focus) { var input = document.querySelector("#cf input"); input.value = focus; input.oninput(); }
  }

  function viewLua() {
    var h = '<h1>Lua environment</h1><p class="lede">Lua version: <code>' + esc((A.meta || {}).lua) + "</code>. <code>tostring</code> on a built-in function: <code>" + esc((A.meta || {}).fnPrint) +
      "</code>; on a Lua function: <code>" + esc((A.meta || {}).fnPrintLua) + "</code>.</p>";
    h += "<h2>Lower-case global functions</h2><div class=\"cols\">" + A.lua.map(function (k) { return "<div>" + esc(k) + "</div>"; }).join("") + "</div>";
    keys(A.libs).sort().forEach(function (lib) { h += "<h2>" + esc(lib) + '</h2><div class="cols">' + A.libs[lib].map(function (k) { return "<div>" + esc(lib + "." + k) + "</div>"; }).join("") + "</div>"; });
    main.innerHTML = h;
  }

  // ------------------------------------------------------------ background collectors
  function shapeOf(r) {
    if (!r) return "—";
    if (r.skipped) return "skipped";
    if (r.forbidden) return "refused";
    if (r.missing) return "missing";
    if (r.error != null) return "error";
    var rets = r.returns || [];
    if (rets.length && rets.every(function (v) { return /^secret/.test(v); })) return "secret";
    if (rets.some(function (v) { return /^secret/.test(v); })) return "partly secret";
    return "plain";
  }
  function waiting(what) {
    return '<div class="callout">Nothing yet. ' + what + " Import with <code>python tools/apidoc.py import</code> then <code>build</code>.</div>";
  }

  function viewSituations() {
    var w = A.watch;
    var h = "<h1>Situations</h1><p class=\"lede\">Collected in the background by the API watch add-on. The first time it sees a situation it calls the no-argument getters; the first time it sees a kind of unit there, the unit getters. Rows show only what differs from the probe's baseline: the same getter on <code>\"player\"</code>, out of combat in the open world.</p>";
    if (!w) { main.innerHTML = h + waiting("Play with API watch enabled: a dungeon, a boss, a group, some targets."); return; }
    var tr = w.transitions || [];
    h += "<h2>Restriction switches <span class=\"muted\">(" + tr.length + ')</span></h2><p class="muted">Every time <code>C_RestrictedActions.IsAddOnRestrictionActive</code> changed, and where you were.</p>';
    h += '<div class="tablewrap"><table><tr><th>When</th><th>Situation</th><th>Active restrictions</th><th>After event</th></tr>' + tr.map(function (t) {
      return "<tr><td>" + esc(new Date(t.at * 1000).toLocaleString()) + '</td><td class="mono">' + esc(t.situation) + '</td><td class="mono">' + esc(t.on) + '</td><td class="mono">' + esc(t.reason) + "</td></tr>";
    }).join("") + "</table></div>";
    keys(w.situations).sort(sortStr).forEach(function (sit) {
      h += "<h2>" + esc(sit) + "</h2>";
      var runs = w.situations[sit];
      keys(runs).sort(sortStr).forEach(function (label) {
        var r = runs[label], res = r.res || {}, ks = keys(res);
        var changed = ks.filter(function (k) {
          var base = A.F[k] && A.F[k].o;
          var a = shapeOf(base), b = shapeOf(res[k]);
          if (label === "getters") return base && a !== b && b !== "skipped";
          return b !== "skipped" && (b === "secret" || b === "partly secret" || b === "error" || b === "refused") && a !== b;
        }).sort(sortStr);
        h += "<details" + (changed.length ? " open" : "") + "><summary><b>" + esc(label) + "</b>" + (r.token ? " <code>" + esc(r.token) + "</code>" : "") + " · " + ks.length + " calls · " +
          (r.done ? "done" : "partial: " + esc(r.partial || "")) + " · <b>" + changed.length + "</b> differ from the baseline</summary>";
        if (changed.length) {
          h += '<div class="tablewrap"><table><tr><th>Function</th><th>Baseline (player, open world)</th><th>Here</th></tr>' + changed.map(function (k) {
            return '<tr><td class="mono"><a href="#/fn/' + enc(k) + '">' + esc(k) + "</a></td><td>" + callCell(A.F[k] && A.F[k].o, true) + "</td><td>" + callCell(res[k], true) + "</td></tr>";
          }).join("") + "</table></div>";
        }
        h += "</details>";
      });
    });
    main.innerHTML = h;
  }

  function viewTimelines() {
    var t = A.timeline;
    var h = '<h1>Event timelines</h1><p class="lede">Collected in the background by the API timeline add-on: the events that fired in the second before each moment and the four seconds after it, in order. Times are milliseconds from the moment; argument kinds are n number, s string, b boolean, t table, S secret, - nil.</p>';
    if (!t || !keys(t).length) { main.innerHTML = h + waiting("Play with API timeline enabled; it fills in as you log in, zone, fight, loot, visit vendors and so on."); return; }
    keys(t).sort(sortStr).forEach(function (kind) {
      h += "<h2>" + esc(kind) + ' <span class="muted">(' + t[kind].length + " recorded)</span></h2>";
      t[kind].forEach(function (trace, i) {
        var evs = trace.events || [];
        h += "<details" + (i === 0 ? " open" : "") + "><summary>" + esc(new Date(trace.at * 1000).toLocaleString()) + " · " + esc(trace.zoneType || "") + " · " + evs.length + " events" + (trace.truncated ? " (cut short)" : "") + "</summary>";
        h += '<div class="tablewrap"><table><tr><th>ms</th><th>Event</th><th>Arguments</th><th>Unit</th></tr>' + evs.map(function (e) {
          return "<tr" + (e[4] ? ' class="trig"' : "") + '><td class="mono">' + esc(e[0]) + '</td><td class="mono">' + (A.E[e[1]] ? '<a href="#/event/' + enc(e[1]) + '">' + esc(e[1]) + "</a>" : esc(e[1])) +
            '</td><td class="mono">' + esc(e[2] || "") + '</td><td class="mono">' + esc(e[3] || "") + "</td></tr>";
        }).join("") + "</table></div></details>";
      });
    });
    main.innerHTML = h;
  }

  function viewSecrets() {
    var s = A.secrets;
    var h = '<h1>Secrets in widgets</h1><p class="lede">Tested in the background by the API widgets add-on, once per client build: what add-on code may do with a secret value. The secret comes from <code>UnitHealth("player")</code> (a number) and <code>UnitInRange("player")</code> (true/false), which this client always keeps secret. Each widget setter is called twice on a hidden frame: with plain values as a control, then with the secret.</p>';
    if (!s || !keys(s).length) { main.innerHTML = h + waiting("Enable API widgets and log in; it runs by itself after 10 seconds, and again in your next fight."); return; }
    var o = s.outside || {}, c = s.combat || {};
    function cell(v) {
      if (v == null) return '<span class="muted">—</span>';
      if (/^ok/.test(v)) return '<span class="pill s-verified">' + esc(v) + "</span>";
      return '<span class="err">' + esc(v) + "</span>";
    }
    h += '<h2>Lua operations on a secret</h2><div class="tablewrap"><table><tr><th>Operation</th><th>Out of combat</th><th>In combat</th></tr>' +
      keys(o.ops || {}).map(function (k) { return '<tr><td class="mono">' + esc(k) + "</td><td>" + cell((o.ops || {})[k]) + "</td><td>" + cell((c.ops || {})[k]) + "</td></tr>"; }).join("") + "</table></div>";
    var setters = keys(o.setters || {}).sort(sortStr);
    var acc = setters.filter(function (k) { return /^ok/.test(o.setters[k].secret || ""); });
    h += "<h2>Widget setters <span class=\"muted\">(" + acc.length + " of " + setters.length + ' accept a secret)</span></h2>' + filterBar("sx", [["yes", "accepts a secret"], ["no", "refuses"]]) + '<div id="sxl"></div>';
    main.innerHTML = h;
    wireFilter("sx", function (q, f) {
      var items = setters.filter(function (k) {
        var r = o.setters[k], ok = /^ok/.test(r.secret || "");
        return (!q || k.toLowerCase().indexOf(q) >= 0) && (!f || (f === "yes") === ok);
      });
      bigList("sxl", items, function (k) {
        var r = o.setters[k], rc = (c.setters || {})[k] || {};
        var parts = k.split(":"), wt = parts[0], m = parts[1];
        var sys = A.W[wt] && A.W[wt].m && A.W[wt].m[m], d = sys && A.O[sys] && A.O[sys][m];
        var claim = d && d.fl && d.fl.SecretArguments;
        return '<tr><td class="mono"><a href="#/widget/' + enc(wt) + '">' + esc(wt) + "</a>:" + esc(m) + "</td><td>" + cell(r.plain) + "</td><td>" + cell(r.secret) + "</td><td>" + cell(rc.secret) +
          '</td><td class="mono muted">' + esc(claim || "") + "</td></tr>";
      }, "<tr><th>Setter</th><th>Plain control</th><th>Secret, out of combat</th><th>Secret, in combat</th><th>Blizzard's docs say</th></tr>", 400);
    });
  }

  // classic globals Forever dropped or moved (tools/relocated.py)
  var WHERE = { missing: ["Gone on Forever", "p-bad"], shim: ["Still works through a Blizzard shim (to be removed)", "p-warn"],
    present: ["Still there", "s-verified"], unverified: ["Not checked", "p-plain"] };
  function viewRelocated() {
    var rows = A.reloc || [];
    var h = '<h1>Moved from classic</h1><p class="lede">Classic (1.15) globals that Forever dropped or moved, where each one went, and how the call changed. ' +
      "Every old and new name was checked against the in-game dump. Sources: Blizzard's own transition guide and deprecation add-ons in the client, " +
      "our curated list, and a same-name lead.</p>";
    if (A.project) h += '<p class="note">Forever reports <span class="mono">WOW_PROJECT_ID</span> = ' + esc(A.project) +
      ' (<span class="mono">WOW_PROJECT_CAMELOT</span>), neither mainline (1) nor classic (2), but loads Blizzard&#39;s <b>mainline</b> deprecation shims. Add-ons that branch on the project ID take neither branch.</p>';
    h += '<p class="note">For VS Code: the same table is built into the LuaLS definitions in <span class="mono">luals/</span>; gone names are struck through with where they went. For code: <span class="mono">docs/compat.json</span>.</p>';
    h += filterBar("rl", [["missing", "gone"], ["shim", "shimmed"], ["present", "still there"]]) + '<div id="rll"></div>';
    if ((A.unmapped || []).length) h += '<h2>Classic add-on calls with no known home yet <span class="muted">(' + A.unmapped.length + ")</span></h2>" +
      '<p class="note">Globals the scanned classic add-ons call that aren&#39;t in the game and nothing above maps. Some are the add-ons&#39; own helpers.</p><div class="cols">' +
      A.unmapped.map(function (u) { return '<div class="mono">' + esc(u[0]) + ' <span class="muted">' + u[1] + "×</span></div>"; }).join("") + "</div>";
    main.innerHTML = h;
    wireFilter("rl", function (q, f) {
      var items = rows.filter(function (r) {
        var text = (r.o + " " + (r.n || []).map(function (n) { return n[0]; }).join(" ")).toLowerCase();
        return (!q || text.indexOf(q) >= 0) && (!f || r.w === f);
      });
      bigList("rll", items, function (r) {
        var w = WHERE[r.w] || [r.w, "p-plain"];
        var nw = (r.n || []).map(function (n) {
          var link = A.F[n[0]] ? '<a href="#/fn/' + enc(n[0]) + '">' + esc(n[0]) + "</a>" : esc(n[0]);
          return '<div class="mono">' + link + (n[1] === "no" ? ' <span class="pill p-bad">not visible to add-ons</span>' : "") +
            (n[2] || []).map(function (x) { return ' <span class="pill p-warn">' + esc(x) + "</span>"; }).join("") + "</div>";
        }).join("") || '<span class="muted">none</span>';
        var ch = (r.cf ? "<b>" + esc(r.cf.charAt(0).toUpperCase() + r.cf.slice(1)) + ".</b> " : "") + esc(r.c || "") +
          (r.cl ? '<div class="note mono">Classic: ' + esc(r.cl) + "</div>" : "") + (r.u ? '<div class="note">Called ' + esc(r.u) + "</div>" : "");
        return '<tr><td class="mono">' + esc(r.o) + '<div><span class="pill ' + w[1] + '">' + esc(w[0]) + "</span></div></td><td>" + nw + "</td><td>" + ch +
          '</td><td class="muted">' + esc((r.src || []).join(", ")) + "</td></tr>";
      }, "<tr><th>Classic</th><th>Forever</th><th>How it changed</th><th>Source</th></tr>", 300);
    });
  }

  // targeted checks of tester reports (ApiChecks add-on)
  function viewChecks() {
    var c = A.checks;
    var h = '<h1>Reported quirks</h1><p class="lede">Behaviour testers reported on Forever, checked in game by the API checks add-on. ' +
      "Each answer is what the add-on saw; \"not seen yet\" means it hasn't watched that happen.</p>";
    if (!c) { main.innerHTML = h + '<p class="muted">No data yet: enable the API checks add-on, play a while, then run update-docs.bat.</p>'; return; }
    h += '<p class="note">Client ' + esc(c.build) + ", API checks " + esc(c.probe) + ".</p>";
    (c.a || []).forEach(function (x) {
      var md = function (t) { return esc(t).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>"); };
      h += '<div class="card"><div class="head"><h3>' + esc(x[0]) + "</h3></div><p>" + md(x[1]) + "</p>" +
        ((x[2] || []).length ? '<ul class="note">' + x[2].map(function (e) { return "<li>" + md(e) + "</li>"; }).join("") + "</ul>" : "") + "</div>";
    });
    main.innerHTML = h;
  }

  function viewGuide(id) {
    var g = GUIDES.filter(function (x) { return x.id === id; })[0];
    if (!g) return notFound(id);
    main.innerHTML = '<p class="note">Guide · an explanation to help read the docs; its links point at the evidence.</p><h1>' + esc(g.title) + '</h1><div class="prose">' + g.html + "</div>";
  }
  function viewGlossary(focus) {
    var h = "<h1>Glossary</h1><p class=\"lede\">What the type names and flags in Blizzard's signatures mean. Written to help reading; not probe results.</p>" +
      '<h2>Types</h2><div class="tablewrap"><table><tr><th>Type</th><th>Means</th></tr>';
    keys(GL).sort(sortStr).forEach(function (t) { h += '<tr id="' + esc(t) + '"><td class="mono">' + esc(t) + "</td><td>" + esc(GL[t][0]) + (GL[t][1] ? '<div class="note">' + esc(GL[t][1]) + "</div>" : "") + "</td></tr>"; });
    h += '</table></div><h2>Flags</h2><div class="tablewrap"><table><tr><th>Flag</th><th>Means</th></tr>';
    keys(FL).sort(sortStr).forEach(function (t) { h += '<tr id="' + esc(t) + '"><td class="mono">' + esc(t) + "</td><td>" + esc(FL[t]) + "</td></tr>"; });
    main.innerHTML = h + '</table></div><p class="note">Enums and structures have their own pages; signatures link to them directly.</p>';
    if (focus) { var el = document.getElementById(focus); if (el) { el.scrollIntoView(); el.style.outline = "2px solid var(--accent)"; } }
  }

  function single(card, back) { main.innerHTML = (back || "") + card; }
  function notFound(what) { main.innerHTML = "<h1>Not found</h1><p class=\"muted\">" + esc(what) + "</p>"; }

  // ---------------------------------------------------------------- routing
  function route() {
    var parts = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
    var view = parts[0] || "", arg = parts[1], sub = parts[2];
    document.querySelectorAll(".side > a").forEach(function (a) {
      var href = a.getAttribute("href");
      a.classList.toggle("on", href === location.hash || href === "#/" + view || (view === "" && href === "#/"));
    });
    document.querySelectorAll(".syslist a").forEach(function (a) { a.classList.toggle("on", view === "system" && a.dataset.n === arg); });
    document.getElementById("side").classList.remove("open");
    window.scrollTo(0, 0);
    if (view === "") viewHome();
    else if (view === "systems") viewSystems();
    else if (view === "system") { viewSystem(arg); if (sub) { var el = document.getElementById(sub); if (el) el.scrollIntoView(); } }
    else if (view === "fn") A.F[arg] ? single(fnCard(arg), A.F[arg].page ? '<p><a href="#/system/' + enc(A.F[arg].page) + '">← ' + esc(A.F[arg].page) + "</a></p>" : "") : notFound(arg);
    else if (view === "event") A.E[arg] ? single(eventCard(arg), '<p><a href="#/events">← Events</a></p>') : notFound(arg);
    else if (view === "type") A.T[arg] ? single(typeCard(arg), '<p><a href="#/types">← Enums and structures</a></p>') : notFound(arg);
    else if (view === "events") viewEvents();
    else if (view === "types") viewTypes();
    else if (view === "widgets") viewWidgets();
    else if (view === "widget") viewWidget(arg);
    else if (view === "globals") viewGlobals(false);
    else if (view === "ui") viewGlobals(true);
    else if (view === "restrictions") viewRestrictions();
    else if (view === "cvars") viewCVars(arg);
    else if (view === "lua") viewLua();
    else if (view === "situations") viewSituations();
    else if (view === "timelines") viewTimelines();
    else if (view === "secrets") viewSecrets();
    else if (view === "relocated") viewRelocated();
    else if (view === "checks") viewChecks();
    else if (view === "guide") viewGuide(arg);
    else if (view === "glossary") viewGlossary(arg);
    else notFound(location.hash);
  }

  // sidebar system list
  var syslist = document.getElementById("syslist");
  function drawSys(q) {
    syslist.innerHTML = pageNames.filter(function (n) { return !q || n.toLowerCase().indexOf(q) >= 0; }).map(function (n) {
      return '<a href="#/system/' + enc(n) + '" data-n="' + esc(n) + '"><span>' + esc(n) + "</span><small>" + pages[n].fns.length + "</small></a>";
    }).join("");
  }
  drawSys("");
  document.getElementById("sysfilter").oninput = function () { drawSys(this.value.trim().toLowerCase()); };

  // global search
  var q = document.getElementById("q"), results = document.getElementById("results"), sel = -1;
  function search() {
    var s = q.value.trim().toLowerCase();
    if (s.length < 2) { results.hidden = true; return; }
    var hits = [];
    for (var i = 0; i < SEARCH.length; i++) {
      var e = SEARCH[i], at = e[0].indexOf(s);
      if (at < 0) continue;
      var last = e[0].lastIndexOf(".") + 1;
      var score = (e[0] === s ? 0 : e[0].slice(last) === s ? 1 : at === last ? 2 : at === 0 ? 3 : 5) + e[4] * 2 + (e[3] === "not-in-game" ? 1 : 0) + e[0].length / 200;
      hits.push([score, e]);
    }
    hits.sort(function (a, b) { return a[0] - b[0]; });
    sel = -1;
    results.innerHTML = hits.slice(0, 60).map(function (h) {
      var e = h[1];
      return '<a href="' + link(e[1], e[2]) + '"><span class="kind">' + esc(e[1]) + '</span><span class="name">' + esc(e[2]) + "</span>" + (e[3] ? pill(e[3]) : "") + "</a>";
    }).join("") || '<a><span class="muted">No matches</span></a>';
    results.hidden = false;
  }
  q.oninput = search;
  q.onkeydown = function (ev) {
    var items = results.querySelectorAll("a[href]");
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      sel = Math.max(0, Math.min(items.length - 1, sel + (ev.key === "ArrowDown" ? 1 : -1)));
      items.forEach(function (a, i) { a.classList.toggle("on", i === sel); });
      if (items[sel]) items[sel].scrollIntoView({ block: "nearest" });
    } else if (ev.key === "Enter" && items.length) {
      location.hash = items[Math.max(sel, 0)].getAttribute("href");
      results.hidden = true; q.blur();
    } else if (ev.key === "Escape") { results.hidden = true; q.blur(); }
  };
  results.onclick = function () { results.hidden = true; };
  document.addEventListener("click", function (ev) { if (!ev.target.closest(".search")) results.hidden = true; });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "/" && document.activeElement.tagName !== "INPUT") { ev.preventDefault(); q.focus(); q.select(); }
  });

  // theme and menu
  var root = document.documentElement;
  try { var saved = localStorage.getItem("forever-api-theme"); if (saved) root.dataset.theme = saved; } catch (e) { /* storage blocked */ }
  document.getElementById("theme").onclick = function () {
    var dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("forever-api-theme", root.dataset.theme); } catch (e) { /* storage blocked */ }
  };
  document.getElementById("menu").onclick = function () { document.getElementById("side").classList.toggle("open"); };

  window.addEventListener("hashchange", route);
  route();
})();

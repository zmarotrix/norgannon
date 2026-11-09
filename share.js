// Share your finds (share.html): reads the player's NorgannonDBCollector.lua in the browser, shows what's in it,
// and packs it into a "finds" text file to attach on GitHub. Nothing is uploaded from this page.
// File format, read by tools/norgannondb/import_collected.py:  NDBCZ:1:{"contributor":..,"credit":..}:<base64 gzip>
(function () {
  "use strict";
  var FORM = "https://github.com/zmarotrix/NorgannonDBCollector/issues/new?template=share-finds.yml";
  var NAME_RE = /^[A-Za-z0-9 '._-]{1,24}$/;
  var $ = function (id) { return document.getElementById(id); };
  var drop = $("drop"), input = $("file"), summary = $("summary"), problem = $("problem");
  var nameBox = $("credit-name"), showMe = $("credit-yes"), anon = $("credit-no");
  var makeBtn = $("make"), formLink = $("form-link"), step3 = $("step-send");
  var text = null, contributor = null;

  // A small reader for the Lua tables the game writes: enough to count records.
  function parseLua(src) {
    var i = 0, n = src.length;
    function ws() {
      for (;;) {
        while (i < n && /\s/.test(src[i])) i++;
        if (src[i] === "-" && src[i + 1] === "-") { while (i < n && src[i] !== "\n") i++; } else return;
      }
    }
    function str() {
      var q = src[i++], out = "";
      while (i < n && src[i] !== q) { if (src[i] === "\\") { out += src[i + 1]; i += 2; } else out += src[i++]; }
      i++; return out;
    }
    function value() {
      ws();
      var c = src[i];
      if (c === "{") return table();
      if (c === '"' || c === "'") return str();
      var m = /^[^,;}\]\s]+/.exec(src.slice(i, i + 64));
      i += m ? m[0].length : 1;
      var w = m ? m[0] : "";
      if (w === "true") return true;
      if (w === "false") return false;
      if (w === "nil") return null;
      return Number(w);
    }
    function table() {
      i++; var t = {}, k = 1;
      for (;;) {
        ws();
        if (src[i] === "}") { i++; return t; }
        if (src[i] === "[") { i++; var key = value(); ws(); i++; ws(); i++; t[key] = value(); }
        else {
          var m = /^([A-Za-z_]\w*)\s*=/.exec(src.slice(i, i + 80));
          if (m) { i += m[0].length; t[m[1]] = value(); } else { t[k++] = value(); }
        }
        ws(); if (src[i] === "," || src[i] === ";") i++;
      }
    }
    var at = src.search(/(NorgannonDB|AzerothDB)CollectorDB\s*=/);
    if (at < 0) return null;
    i = src.indexOf("=", at) + 1;
    return value();
  }

  function count(t) { return t && typeof t === "object" ? Object.keys(t).length : 0; }
  function fmt(x) { return x.toLocaleString("en-GB"); }
  function show(el, on) { el.hidden = !on; }

  function read(file) {
    show(problem, false); show(summary, false); show(step3, false);
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var sv = null;
      try { sv = parseLua(reader.result); } catch (e) { sv = null; }
      if (!sv || !(sv.npcs || sv.quests || sv.items)) {
        problem.textContent = "That isn't the Collector's file. Look for NorgannonDBCollector.lua in the SavedVariables folder.";
        show(problem, true); text = null; makeBtn.disabled = true; return;
      }
      text = reader.result;
      contributor = (sv.settings && sv.settings.contributor) || null;
      var meta = sv.meta || {};
      $("n-npcs").textContent = fmt(count(sv.npcs));
      $("n-objects").textContent = fmt(count(sv.objects));
      $("n-quests").textContent = fmt(count(sv.quests));
      $("n-items").textContent = fmt(count(sv.items));
      $("n-finds").textContent = fmt(count(sv.mismatches));
      $("n-sessions").textContent = meta.sessions ? fmt(meta.sessions) : "?";
      drop.classList.add("done");
      $("drop-name").textContent = file.name + " (" + Math.round(file.size / 1024) + " KB)";
      show(summary, true); makeBtn.disabled = false;
    };
    reader.readAsText(file);
  }

  function base64(bytes) {
    var out = "", chunk = 0x8000;
    for (var k = 0; k < bytes.length; k += chunk) out += String.fromCharCode.apply(null, bytes.subarray(k, k + chunk));
    return btoa(out);
  }

  function gzip(str) {
    var stream = new Blob([str]).stream().pipeThrough(new CompressionStream("gzip"));
    return new Response(stream).arrayBuffer().then(function (buf) { return new Uint8Array(buf); });
  }

  function credit() {
    if (!showMe.checked) return null;
    var name = nameBox.value.trim();
    return NAME_RE.test(name) ? name : false;
  }

  function syncCredit() {
    nameBox.disabled = !showMe.checked;
    if (showMe.checked) nameBox.focus();
  }
  showMe.addEventListener("change", syncCredit);
  anon.addEventListener("change", syncCredit);
  nameBox.addEventListener("input", function () { showMe.checked = true; });

  makeBtn.addEventListener("click", function () {
    if (!text) return;
    var name = credit();
    if (name === false) {
      problem.textContent = "Pick a leaderboard name of up to 24 letters, numbers or spaces, or stay anonymous.";
      show(problem, true); nameBox.focus(); return;
    }
    show(problem, false);
    var header = { credit: name || null };
    if (contributor) header.contributor = contributor;
    gzip(text).then(function (bytes) {
      var body = "Norgannon Collector finds. Attach this file to your post on GitHub, and please don't edit it.\n" +
        "NDBCZ:1:" + JSON.stringify(header) + ":" + base64(bytes) + "\n";
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
      a.download = "norgannon-finds.txt";
      document.body.appendChild(a); a.click(); a.remove();
      formLink.href = FORM + "&title=" + encodeURIComponent("Finds from " + (name || "an anonymous player"));
      show(step3, true);
      step3.scrollIntoView({ behavior: "smooth", block: "center" });
    }).catch(function () {
      problem.textContent = "This browser can't pack the file. Try a current Chrome, Edge, Firefox or Safari.";
      show(problem, true);
    });
  });

  input.addEventListener("change", function () { read(input.files[0]); });
  ["dragenter", "dragover"].forEach(function (e) {
    drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.add("over"); });
  });
  ["dragleave", "drop"].forEach(function (e) {
    drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.remove("over"); });
  });
  drop.addEventListener("drop", function (ev) { read(ev.dataTransfer.files[0]); });
  syncCredit();
})();

// a link to share.html#other-ways (from Help improve it) opens the folded file route
(function () {
  var d = document.getElementById("other-ways");
  if (d && location.hash === "#other-ways") d.open = true;
})();

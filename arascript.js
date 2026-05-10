$("#planer_klinow").remove();
$("#komut_aktarma").remove();

var konfiguracja = konfiguracjaSwiata();

	/** Aktif köy id: URL'deki village= öncelikli (info_village hedef ekranında game_data farklı olabilir). */
	var twCtxVillageId = (function(){
		var m = /[?&]village=(\d+)/.exec(window.location.href);
		if (m && m[1]) return m[1];
		return game_data.village.id;
	})();

	var dane = {
		predkosc_gry:Number($(konfiguracja).find("config speed").text()),
		predkosc_jednostek:Number($(konfiguracja).find("config unit_speed").text()),
		lucznicy:Number($(konfiguracja).find("game archer").text()),
		rycerz:Number($(konfiguracja).find("game knight").text()),
		linkDoWojska:"/game.php?&village="+twCtxVillageId+"&type=own_home&mode=units&group=0&page=-1&screen=overview_villages",
		linkDoPrzegladuWioski:"/game.php?",
		linkDorozkazu:"/game.php?",
		predkosci:[18,22,18,18,9,10,10,11,30,30,10,35],
		nazwyWojsk:["Mızrakçı","Kılıççı","Baltacı","Okçu","Casus","Hafif Atlı","Atlı Okçu","Ağır Atlı","Koçbaşı","Mancınık","Şövalye","Soylu"]
	};

	var pobieram = true;
	var pobraneGrupy = false;
	var sort_malejaco = true;
	var img_wojsk = image_base + "unit/";
	var minimalna_ilosc_wojsk = [];
	var czasWyjscia = [];
	var omijane=[];
	var id=[];
	var wojska=[];
	var mojeWioski=[];
	var nazwyWiosek = [];
	var pokazWies=[];
	var tabelkaBB=[];
	var obrazki = "spear,sword,axe,archer,spy,light,marcher,heavy,ram,catapult,knight,snob".split(",");
	var aktywneJednostki = ("111"+(dane.rycerz?"10":"0")).split("");
	
	if(!dane.lucznicy){
		dane.predkosci.splice(obrazki.indexOf("marcher"),1);
		dane.nazwyWojsk.splice(obrazki.indexOf("marcher"),1);
		obrazki.splice(obrazki.indexOf("marcher"),1);
		dane.predkosci.splice(obrazki.indexOf("archer"),1);
		dane.nazwyWojsk.splice(obrazki.indexOf("archer"),1);
		obrazki.splice(obrazki.indexOf("archer"),1);
	}
	if(!dane.rycerz){
		dane.predkosci.splice(obrazki.indexOf("knight"),1);
		dane.nazwyWojsk.splice(obrazki.indexOf("knight"),1);
		obrazki.splice(obrazki.indexOf("knight"),1); 
	}
	ciacho = getCookie("atkjed");
	if(ciacho != ""){
		aktywneJednostki = parseInt(ciacho,36).toString(2).split("");
		while(aktywneJednostki.length<dane.predkosci.length) aktywneJednostki.splice(0,0,"0");
	}
	var obecnyCzas = twPlParseServerNow();
	if(game_data.player.sitter != 0){
		dane.linkDoWojska="/game.php?t=" + game_data.player.id + "&village="+twCtxVillageId+"&type=own_home&mode=units&group=0&page=-1&screen=overview_villages";
		dane.linkDoPrzegladuWioski += "t=" + game_data.player.id + "&village="+twCtxVillageId+"&screen=info_village&id=";
		dane.linkDorozkazu += "t=" + game_data.player.id + "&village=";
	}
	else{	
		dane.linkDoPrzegladuWioski += "village="+twCtxVillageId+"&screen=info_village&id=";
		dane.linkDorozkazu += "village=";
	}
	var wszystkieWojska = dane.linkDoWojska;
	var predkosc_swiata = Number((dane.predkosc_gry * dane.predkosc_jednostek).toFixed(5));
	for(i = 0; i < dane.predkosci.length; i++){
		minimalna_ilosc_wojsk[i] = 0;
		dane.predkosci[i] /= predkosc_swiata;
	}
	twPlBootstrapPlaner();
void 0;

/** Sunucu saati: #serverTime / #serverDate yoksa Timing veya yerel saat. */
function twPlParseServerNow(){
	var rawT = ($('#serverTime').html() || $('#serverTime').text() || '').trim();
	var rawD = ($('#serverDate').html() || $('#serverDate').text() || '').trim();
	var t = rawT.match(/\d+/g);
	var d = rawD.match(/\d+/g);
	if (t && t.length >= 3 && d && d.length >= 3) {
		return new Date(parseInt(d[2],10), parseInt(d[1],10)-1, parseInt(d[0],10), parseInt(t[0],10), parseInt(t[1],10), parseInt(t[2],10));
	}
	if (typeof Timing !== 'undefined' && typeof Timing.getCurrentServerTime === 'function') {
		try {
			return new Date(Timing.getCurrentServerTime() * 1000);
		} catch (e2) {}
	}
	return new Date();
}

function twPlToast(msg, isErr){
	if (typeof UI !== 'undefined' && UI.InfoMessage) UI.InfoMessage(msg, 2500, isErr ? 'error' : 'success');
	else window.alert(msg);
}

/** game_data gec guncellenince URL ile bilgi koy sayfasi tespiti */
function twPlIsInfoVillagePage(){
	try {
		if (/[?&]screen=info_village\b/.test(window.location.href || '')) return true;
		if (typeof game_data !== 'undefined' && game_data && game_data.screen === 'info_village') return true;
	} catch (e) {}
	return false;
}

/** Metinden veya ham cel dizgisinden gecerli x|y; olmazsa su anki koy (fallback). */
function twPlSanitizeCoordPair(str, fallbackX, fallbackY){
	var s = String(str != null ? str : '')
		.replace(/\r\n|\r|\n/g, ' ')
		.replace(/\u00a0/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	var m = s.match(/(\d{1,4})\s*\|\s*(\d{1,4})/)
		|| s.match(/(\d{1,4})\s*[·‧•∶:×]\s*(\d{1,4})/);
	if (m) return parseInt(m[1], 10) + '|' + parseInt(m[2], 10);
	var fx = fallbackX != null && fallbackX !== '' ? Number(fallbackX) : NaN;
	var fy = fallbackY != null && fallbackY !== '' ? Number(fallbackY) : NaN;
	if (Number.isFinite(fx) && Number.isFinite(fy)) return fx + '|' + fy;
	return '0|0';
}

function twPlParseCoordText(text){
	var cell = String(text != null ? text : '').trim()
		.replace(/[\u200b\u200c\u200d\ufeff]/g, '');
	var mm = cell.match(/(\d{1,4})\s*\|\s*(\d{1,4})/)
		|| cell.match(/\b(\d{1,4})\s*[·‧•∶:×]\s*(\d{1,4})\b/);
	return mm ? mm[1] + '|' + mm[2] : null;
}

/** Etiketsiz metin/ tablo taramasinda ilk gelen kucuk x|y ciftleri genelde gurultu (or. 19|59); koy kutusu nth/embed haric. */
function twPlRejectNoiseCoordPair(pairStr){
	var mm = twPlParseCoordText(pairStr);
	if (!mm) return true;
	var p = mm.split('|');
	var x = parseInt(p[0], 10), y = parseInt(p[1], 10);
	if (!Number.isFinite(x) || !Number.isFinite(y)) return true;
	return x < 100 && y < 100;
}

/** Koordinat etiketi yakininda ilk x|y (sayfa genelindeki ilk pipe ciftinden guvenli) */
function twPlCoordsFromAnchoredBlockText(cv){
	var t = (cv.innerText || cv.textContent || '').replace(/\s+/g, ' ');
	var reAnchor = /koordinat|coord|coordinates|koordinaten|position|pozycja|lokalizacja/i;
	var am = reAnchor.exec(t);
	if (!am) return null;
	var slice = t.slice(Math.max(0, am.index - 35), Math.min(t.length, am.index + 160));
	var cm = slice.match(/(\d{1,4})\s*\|\s*(\d{1,4})/);
	if (!cm) return null;
	var ap = cm[1] + '|' + cm[2];
	return twPlRejectNoiseCoordPair(ap) ? null : ap;
}

/** Ayni id baska yerde varsa #planer_klinow icindeki hedef kutusu */
function twPlTargetCoordInput(){
	return document.querySelector('#planer_klinow #wspolrzedneCelu');
}

function twPlFillTargetCoordInput(cel){
	var fbX = game_data.village.x, fbY = game_data.village.y;
	if ((fbX == null || fbX === '') && game_data.village.coord) {
		var pc = twPlParseCoordText(game_data.village.coord);
		if (pc) {
			var pq = pc.split('|');
			fbX = pq[0];
			fbY = pq[1];
		}
	}
	if (cel != null && String(cel).trim() !== '' && twPlRejectNoiseCoordPair(String(cel))) cel = null;
	var src = cel != null && String(cel).trim() !== '' ? cel : fbX + '|' + fbY;
	var v = twPlSanitizeCoordPair(src, fbX, fbY);
	var el = twPlTargetCoordInput();
	if (!el) return;
	el.value = v;
	el.defaultValue = v;
	el.setAttribute('value', v);
	try {
		el.dispatchEvent(new Event('input', { bubbles: true }));
	} catch (e3) {}
	var box = document.getElementById('planer_klinow');
	if (box) box.setAttribute('data-twpl-fill', v);
}

/** info_village icerigi / embed script gec gelince kutuyu yakala */
function twPlScheduleInfoVillageCoordRefresh(){
	if (!twPlIsInfoVillagePage() || mobile) return;
	var fbX = game_data.village.x, fbY = game_data.village.y;
	var n = 0;
	function tick(){
		var inp = twPlTargetCoordInput();
		var cv = document.getElementById('content_value');
		var rawParsed = twPlCoordsFromInfoVillage() || (cv && twPlCoordsFromMapLinks(cv));
		var parsed = (rawParsed && !twPlRejectNoiseCoordPair(rawParsed)) ? rawParsed : null;
		if (!inp) return;
		if (parsed) {
			var v = twPlSanitizeCoordPair(parsed, fbX, fbY);
			if (v && v !== '0|0') {
				twPlFillTargetCoordInput(parsed);
				try {
					if (typeof mojeWioski !== 'undefined' && mojeWioski && mojeWioski.length) pokazOdleglosc();
				} catch (e1) {}
				return;
			}
		}
		if (++n < 55) setTimeout(tick, 200);
		else {
			if (!inp.value || !String(inp.value).trim()) twPlFillTargetCoordInput(null);
		}
	}
	setTimeout(tick, 50);
}

/** AJAX ile content_value guncellenince koordinati tekrar yaz */
function twPlWatchContentValueCoords(){
	if (!twPlIsInfoVillagePage() || mobile) return;
	var cv = document.getElementById('content_value');
	if (!cv || typeof MutationObserver === 'undefined') return;
	var deb = null;
	var obs = new MutationObserver(function(){
		if (deb) clearTimeout(deb);
		deb = setTimeout(function(){
			deb = null;
			var parsed = twPlCoordsFromInfoVillage();
			if (!parsed || twPlRejectNoiseCoordPair(parsed)) return;
			twPlFillTargetCoordInput(parsed);
			try {
				if (typeof mojeWioski !== 'undefined' && mojeWioski && mojeWioski.length) pokazOdleglosc();
			} catch (e1) {}
		}, 150);
	});
	obs.observe(cv, { childList: true, subtree: true });
	setTimeout(function(){ try { obs.disconnect(); } catch (e2) {} }, 90000);
}

/** #content_value icindeki tablolar: Koordinat/coord etiketi -> ikinci hucre x|y (sadece .vis degil, ic ice tum tablolar) */
function twPlCoordsFromVisTablesByLabel(){
	var cv = document.getElementById('content_value');
	if (!cv) return null;
	var labelRe = /koordinat|coord|coordinates|koordinaten|position|pozycja|lokalizacja/i;
	var tables = cv.querySelectorAll('table');
	for (var ti = 0; ti < tables.length; ti++) {
		var vis = tables[ti];
		if (!vis.rows) continue;
		for (var r = 0; r < vis.rows.length; r++) {
			var row = vis.rows[r];
			if (row.cells.length < 2) continue;
			var label = (row.cells[0].textContent || '').replace(/\s+/g, ' ').trim();
			if (labelRe.test(label)) {
				var got = twPlParseCoordText(row.cells[1].textContent);
				if (got && !twPlRejectNoiseCoordPair(got)) return got;
			}
		}
	}
	/* vis sinifi olmayan koy kutusu: tek satirda x|y + kisa etiket (satir indeksi skin ile 3 veya 4 olabilir) */
	for (ti = 0; ti < tables.length; ti++) {
		var tbl = tables[ti];
		if (!tbl.rows || tbl.rows.length < 2 || tbl.rows.length > 14) continue;
		var hits = [];
		for (var r2 = 0; r2 < tbl.rows.length; r2++) {
			var row2 = tbl.rows[r2];
			if (row2.cells.length < 2) continue;
			var c0 = (row2.cells[0].textContent || '').replace(/\s+/g, ' ').trim();
			if (c0.length === 0 || c0.length > 55) continue;
			var g = twPlParseCoordText(row2.cells[1].textContent);
			if (!g) continue;
			if (twPlParseCoordText(c0)) continue;
			hits.push(g);
		}
		if (hits.length === 1) {
			if (twPlRejectNoiseCoordPair(hits[0])) return null;
			return hits[0];
		}
	}
	return null;
}

/** showEmbeddedMap bazen content_value disinda (layout script) */
function twPlCoordsFromEmbeddedMapGlobal(){
	try {
		var hay = document.documentElement ? document.documentElement.innerHTML : '';
		if (hay.length > 900000) hay = hay.slice(0, 900000);
		var re = /(?:TWMap\.)?showEmbeddedMap\s*\(\s*[\s\S]*?,\s*\d+\s*,\s*(\d+)\s*,\s*(\d+)/;
		var m = re.exec(hay);
		if (!m) return null;
		var gp = m[1] + '|' + m[2];
		return twPlRejectNoiseCoordPair(gp) ? null : gp;
	} catch (e) {
		return null;
	}
}

/** Koordinat href: ...&x=1&y=2 veya screen=map... */
function twPlCoordsFromMapLinks(scope){
	var root = scope || document.getElementById('content_value') || document;
	var as = root.querySelectorAll ? root.querySelectorAll('a[href*="x="], a[href*="&y="], a[href*="screen=map"]') : [];
	for (var i = 0; i < as.length; i++) {
		var h = as[i].getAttribute('href') || '';
		var mx = /[?&]x=(\d+)/.exec(h);
		var my = /[?&]y=(\d+)/.exec(h);
		if (mx && my) {
			var pair = mx[1] + '|' + my[1];
			if (!twPlRejectNoiseCoordPair(pair)) return pair;
		}
	}
	return null;
}

/** Yeni TW info_village: mini harita script icinde TWMap.showEmbeddedMap(..., x, y, ...) */
function twPlCoordsFromEmbeddedMap(){
	var cv = document.getElementById('content_value');
	if (!cv) return null;
	var chunks = [];
	var scripts = cv.querySelectorAll('script');
	for (var i = 0; i < scripts.length; i++) {
		chunks.push(scripts[i].textContent || '');
	}
	chunks.push(cv.innerHTML || '');
	var hay = chunks.join('\n');
	var re = /(?:TWMap\.)?showEmbeddedMap\s*\(\s*[\s\S]*?,\s*\d+\s*,\s*(\d+)\s*,\s*(\d+)/;
	var m = re.exec(hay);
	if (!m) return null;
	var ep = m[1] + '|' + m[2];
	return twPlRejectNoiseCoordPair(ep) ? null : ep;
}

/** URL id ile game_data.village ayni koy ise (kendi koyun bilgi sayfasi) */
function twPlCoordsFromGameDataIfUrlMatches(){
	if (!twPlIsInfoVillagePage()) return null;
	var m = /[?&]id=(\d+)/.exec(window.location.search);
	if (!m || String(game_data.village.id) !== m[1]) return null;
	if (game_data.village.coord) return twPlParseCoordText(game_data.village.coord);
	var fx = game_data.village.x, fy = game_data.village.y;
	if (fx != null && fy != null) return fx + '|' + fy;
	return null;
}

/**
 * info_village sol ust vis tablosu: "Koordinatlar:" satiri (skin satiri satir sayisini kaydirir).
 * Sabit nth-child yedek; once etiket ile bulunur (TR/EN/DE).
 */
function twPlCoordsFromVillageTableCell(){
	var gotLayout = twPlCoordsFromVisTablesByLabel();
	if (gotLayout) return gotLayout;
	var cv = document.getElementById('content_value');
	if (!cv) return null;
	/* XPath .../table[1]/tbody/tr[3|4]/td[2] — skin satiri satiri kaydirir; :scope = content_value */
	var rowNums = [4, 3, 5, 2, 6];
	var nthBase = '> table > tbody > tr > td:nth-child(1) > table:nth-child(1) > tbody > tr:nth-child(';
	var nthSelectors = [];
	for (var ni = 0; ni < rowNums.length; ni++) {
		nthSelectors.push(':scope ' + nthBase + rowNums[ni] + ') > td:nth-child(2)');
	}
	nthSelectors.push(
		'#content_value > table > tbody > tr > td:nth-child(1) > table:nth-child(1) > tbody > tr:nth-child(4) > td:nth-child(2)',
		'#content_value > table > tbody > tr > td:nth-child(1) > table:nth-child(1) > tbody > tr:nth-child(3) > td:nth-child(2)',
		'#content_value > table > tbody > tr > td:nth-child(1) > table:nth-child(1) > tbody > tr:nth-child(5) > td:nth-child(2)'
	);
	for (var s = 0; s < nthSelectors.length; s++) {
		var sel = nthSelectors[s];
		var el = null;
		try {
			el = sel.indexOf(':scope') === 0 ? cv.querySelector(sel) : document.querySelector(sel);
		} catch (eS) { el = null; }
		if (!el) continue;
		var got = twPlParseCoordText(el.textContent);
		if (got && !twPlRejectNoiseCoordPair(got)) return got;
	}
	return null;
}

/**
 * info_village sayfasinda hedef koy koordinati (x|y).
 * TW arayuzu degisince sabit satir/hucre indeksleri kirilir; once metin icinde arar, sonra tablolari dener.
 */
function twPlCoordsFromInfoVillage(){
	var cv = document.getElementById('content_value');
	if (!cv) return null;

	/* DOM / tablo / link once: global showEmbeddedMap ilk eslesmesi baska koy/harita widget'i yakalayabiliyordu */
	var fromCell = twPlCoordsFromVillageTableCell();
	if (fromCell) return fromCell;

	var fromMap = twPlCoordsFromMapLinks(cv);
	if (fromMap) return fromMap;

	var fromGd = twPlCoordsFromGameDataIfUrlMatches();
	if (fromGd) return fromGd;

	function cellMatch(tbl){
		if (!tbl.rows || tbl.rows.length < 1) return null;
		for (var r = 0; r < Math.min(tbl.rows.length, 15); r++) {
			var row = tbl.rows[r];
			if (row.cells.length < 2) continue;
			var cell = (row.cells[1].textContent || '').trim();
			var mm = twPlParseCoordText(cell);
			if (mm && !twPlRejectNoiseCoordPair(mm)) return mm;
		}
		return null;
	}

	var visList = cv.getElementsByClassName('vis');
	var found = null;
	for (var v = 0; v < visList.length; v++) {
		var root = visList[v];
		if (root.tagName === 'TABLE') {
			found = cellMatch(root);
			if (found) return found;
		} else {
			found = twPlCoordsFromMapLinks(root);
			if (found) return found;
			var innerTables = root.querySelectorAll('table');
			for (var t = 0; t < innerTables.length; t++) {
				found = cellMatch(innerTables[t]);
				if (found) return found;
			}
		}
	}

	var anchoredTxt = twPlCoordsFromAnchoredBlockText(cv);
	if (anchoredTxt) return anchoredTxt;
	var blockText = (cv.innerText || cv.textContent || '').replace(/\s+/g, ' ');
	var m = blockText.match(/(\d{1,4})\s*\|\s*(\d{1,4})/)
		|| blockText.match(/\b(\d{1,4})\s+[·‧•∶:]\s+(\d{1,4})\b/);
	if (m) {
		var btPair = m[1] + '|' + m[2];
		if (!twPlRejectNoiseCoordPair(btPair)) return btPair;
	}
	var outer = document.getElementById('contentContainer');
	var docMap = outer ? twPlCoordsFromMapLinks(outer) : null;
	if (docMap) return docMap;

	var fromEmbed = twPlCoordsFromEmbeddedMap();
	if (fromEmbed) return fromEmbed;
	fromEmbed = twPlCoordsFromEmbeddedMapGlobal();
	if (fromEmbed) return fromEmbed;

	return null;
}

function wypiszMozliwosci(){
	if(pobieram){$("#ladowanie").html("Bekle, veriyi indiriyorum..."); setTimeout(wypiszMozliwosci, 500); return;}
	if($("#wyborWojsk").is(":visible")){zmienStrzalke(); $("#wyborWojsk").hide();$("#lista_wojska").show(); zapiszWybrane();}
	var html=[];
	var htmlTmp =[];
	
	var najwJednostka = -1;
	var celEl = twPlTargetCoordInput();
	var celRaw = celEl ? celEl.value : '';
	var cel = twPlParseCoordText(celRaw);
	if (cel) cel = cel.split('|').map(Number);
	else cel = celRaw.match(/\d+/g);
	var gEl = document.querySelector('#planer_klinow #godzina_wejscia');
	var dEl = document.querySelector('#planer_klinow #data_wejscia');
	var godzinaWejscia = gEl && gEl.value ? gEl.value.match(/\d+/g) : null;
	var dataWejscia = dEl && dEl.value ? dEl.value.match(/\d+/g) : null;
	if (!cel || cel.length < 2) {
		twPlToast('Hedef koordinat gecersiz (ornek: 500|500).', true);
		return;
	}
	if (!dataWejscia || dataWejscia.length < 3 || !godzinaWejscia || godzinaWejscia.length < 3) {
		twPlToast('Tarih ve saat alanlarini kontrol edin (GG.AA.YYYY ve SS:DD:SS).', true);
		return;
	}
	if (!mojeWioski || !mojeWioski.length) {
		twPlToast('Koy asker listesi yok. Sayfayi yenileyip Planlayiciyi tekrar yukleyin veya grup secimini kontrol edin.', true);
		return;
	}
	
	$('#lista_wojska th').each(function (i) {
		if(i>dane.predkosci.length) return;
		if(i && $(this).hasClass( "faded" ))	aktywneJednostki[i-1]="0";
		else if(i) aktywneJednostki[i-1]="1";
	});
	setCookie("atkjed",(parseInt(aktywneJednostki.join(""),2).toString(36)),360);
	var obecnyCzas = twPlParseServerNow();
	var czasWejscia = new Date(dataWejscia[2], dataWejscia[1] - 1, dataWejscia[0], godzinaWejscia[0], godzinaWejscia[1], godzinaWejscia[2]);
	var roznicaSekund=(czasWejscia-obecnyCzas)/1000;
	
	var ilosc_wiosek = 0;
	for(i=0;i<mojeWioski.length;i++){
		if(!pokazWies[i]) continue;
		htmlTmp[i] = "<tr><td><a href="+dane.linkDoPrzegladuWioski+id[i]+">"+nazwyWiosek[i].replace(/\s+/g, "\u00A0")+"</a>";
		najwolniejsza = 0;
		mozliwewojska = "&from=simulator";
		
		for(j=0;j<dane.predkosci.length;j++){
			if(aktywneJednostki[j]=="0" || wojska[i][j]<1){ 
				
				htmlTmp[i] += "<td class='hidden'>"+wojska[i][j]; 
				continue; 
			}
			a = Math.abs(Number(cel[0]) - mojeWioski[i][mojeWioski[i].length-3]);
			b = Math.abs(Number(cel[1]) - mojeWioski[i][mojeWioski[i].length-2]);
			czasPrzejscia = Math.sqrt((a * a) + (b * b)) * dane.predkosci[j]*60;
			
			if(czasPrzejscia<=roznicaSekund){
				if(czasPrzejscia > najwolniejsza){ najwolniejsza = czasPrzejscia; najwJednostka = j;}
				mozliwewojska += "&att_"+obrazki[j]+"="+wojska[i][j];
				htmlTmp[i] += "<td style='background-color: #C3FFA5;'>"+wojska[i][j];
			}
			else {
				htmlTmp[i] += "<td>"+wojska[i][j];
			}
		}
		if(najwolniejsza != 0){
			tmp = new Date(czasWejscia);
			tmp.setSeconds(tmp.getSeconds() - najwolniejsza);	
			czasWyjscia[ilosc_wiosek]=new Date(tmp);
			ddd = tmp.getDate() + "." + (tmp.getMonth()+1) + "\u00A0" + tmp.getHours() + ":" + tmp.getMinutes() + ":" + tmp.getSeconds();
			html[ilosc_wiosek]=htmlTmp[i]+"<td>"+ddd+"<td>"+0+"<td><a href='"+dane.linkDorozkazu+id[i]+"&screen=place&x="+cel[0]+"&y="+cel[1]+mozliwewojska+"'>Gonder</a>";
			tabelkaBB[ilosc_wiosek]="[*]"+dane.nazwyWojsk[najwJednostka]+"[|] "+mojeWioski[i][mojeWioski[i].length-3]+"|"+mojeWioski[i][mojeWioski[i].length-2]+" [|] "+cel[0]+"|"+cel[1]+" [|] "+ddd+" [|] [url=https://"+document.URL.split("/")[2]+dane.linkDorozkazu+id[i]+"&screen=place&x="+cel[0]+"&y="+cel[1]+mozliwewojska+"]Gonder\n";
			ilosc_wiosek++;
		}
		else{
			htmlTmp[i]  = "";
		}
	}
	if(ilosc_wiosek==0) twPlToast('Belirtilen tarihe hicbir emir sigdirmiyorum :( ', true);
	$("#ilosc_mozliwosci").html("<b>"+ilosc_wiosek+"/"+mojeWioski.length+"</b>");

	for(i=0;i<html.length-1;i++){
		min = i;
		for(j=i+1;j<html.length;j++)
			if(czasWyjscia[min]>czasWyjscia[j])
				min = j;

		tmp = html[min];
		html[min] = html[i];
		html[i] = tmp;
		tmp = czasWyjscia[min];
		czasWyjscia[min] = czasWyjscia[i];
		czasWyjscia[i] = tmp;
		tmp = tabelkaBB[min];
		tabelkaBB[min] = tabelkaBB[i];		
		tabelkaBB[i] = tmp;
	}
	tabelkaBB.splice(ilosc_wiosek,tabelkaBB.length-ilosc_wiosek);
	$('#lista_wojska tbody').html(html.join("\n")+(ilosc_wiosek?"<tr><td id='export_bb' colspan="+(dane.predkosci.length+4)+"><a href='#' onclick=\"$('#export_bb').html('<textarea cols=100 rows=2 onclick=\\'this.select()\\'>[table][**]Birim[||]Kaynak[||]Hedef[||]Cikis zamani[||]Emir[/**]\\n'+tabelkaBB.join('')+'[/table]</textarea>');\" ><img src='"+image_base+"igm/export.png' > Plani disari aktar</a>":''));
	$('#lista_wojska tbody tr').each(function(i){
		$(this).addClass(i%2?"row_a":"row_b");
	});
	$("#ladowanie").html("");
	odliczaj();
}

function odliczaj(){
	var obecnyCzas = twPlParseServerNow();
	
	$('#lista_wojska tbody>tr').each(function (i) {
		roznicaSekund = (czasWyjscia[i] - obecnyCzas)/1000;
		if(roznicaSekund>60) $(this).find("td").eq(dane.predkosci.length+2).html(formatujCzas(roznicaSekund));
		else $(this).find("td").eq(dane.predkosci.length+2).html("<font color='red'>"+roznicaSekund+"</font>");
	});
	
	setTimeout(odliczaj, 1000);
}
function formatujCzas(s){
	var h = Math.floor(s / 3600);
	s = s - h * 3600;
	var m = Math.floor(s / 60);
	s = s - m * 60;
	return (h) +":"+ (m<10?"0"+m:m) +":"+ (s<10?"0"+s:s);
}
function zmienGrupe(){
	$("#ladowanie").html("<img src='"+image_base+"throbber.gif' />");
	wojska = [];
	id = [];
	mojeWioski = [];
	nazwyWiosek = [];
	var lg = document.querySelector('#planer_klinow #listGrup');
	if (lg) dane.linkDoWojska = lg.value;
	pobierzDane();
}
function zaznaczWszystko(source) {
	checkboxes = document.getElementsByName('wybierz');
	for(var i=0, n=checkboxes.length;i<n;i++) {
		checkboxes[i].checked = source.checked;
	}
}
function ustaw_min(n){
	el = document.getElementById("wyborWojsk");
	el = el.getElementsByTagName("input");
	for(i=0;i<dane.predkosci.length;i++){
		el[i].value = n;	
		minimalna_ilosc_wojsk[i] = n; 
	}
}
function chowaj_wojska(ktory,ile){
	ile = Number(ile);
	minimalna_ilosc_wojsk[ktory] = ile;
	$("#wyborWojsk tr:has(td)").each(function(i){
		tt=0;
		if($(this).find("td").eq(ktory+1).text()<ile){
			$(this).hide();
			$(this).find("input").prop('checked', false);
		}
		else
			for(j=0;j<minimalna_ilosc_wojsk.length;j++)
				if($(this).find("td").eq(j+1).text()>=minimalna_ilosc_wojsk[j])
					tt++;
		if(tt==dane.predkosci.length){
			$(this).show();
			$(this).find("input").prop('checked', true);
		}
		else{
			$(this).hide();
			$(this).find("input").prop('checked', false);
		} 
	});
}
function sortowanie_przegladu(ktory){
	ktory++;
	var zaznaczone = [];
	var tabela = document.getElementById("wyborWojsk");
	if(x = tabela.rows[1].cells[ktory].getElementsByTagName("img")[!ktory||ktory==(dane.predkosci.length+1)?0:1]){
		x.src = sort_malejaco?image_base+"list-up.png":image_base+"list-down.png";
		sort_malejaco = sort_malejaco?false:true;
	}
	else{
		tabela.rows[1].cells[ktory].innerHTML += "<img src='"+image_base + "list-down.png' >";
		sort_malejaco = true;
	}
	for(i=0;i<tabela.rows[1].cells.length;i++){
		if(i==ktory) continue;
		if(x = tabela.rows[1].cells[i].getElementsByTagName("img")[!i||i==(dane.predkosci.length+1)?0:1])
			x.remove();
	}
	
	$('[name="wybierz"]').each(function(){		zaznaczone.push($(this).is(':checked'));	});
	for(i=2;i<tabela.rows.length-1;i++){
		if(tabela.rows[i].style.display == "none") continue;
		min = i;
		for(j=i+1;j<tabela.rows.length;j++){
			if(tabela.rows[j].style.display == "none") continue;
			if(ktory==0)
				if(tabela.rows[sort_malejaco?j:min].cells[ktory].textContent > tabela.rows[sort_malejaco?min:j].cells[ktory].textContent)
					min = j;	
			if(Number(tabela.rows[sort_malejaco?j:min].cells[ktory].textContent) > Number(tabela.rows[sort_malejaco?min:j].cells[ktory].textContent))
				min = j;	
		}
		tmp = tabela.rows[min].innerHTML;
		tabela.rows[min].innerHTML = tabela.rows[i].innerHTML;
		tabela.rows[i].innerHTML = tmp;
		tmp2 = zaznaczone[i-2];
		zaznaczone[i-2] = zaznaczone[min-2];
		zaznaczone[min-2] = tmp2;
	}
	$('[name="wybierz"]').each(function(i){	$(this).prop('checked', zaznaczone[i]);	});
}
function wybieranieWiosek(){
	var wiersz;
	
	okienko = "<tr><th style=\"cursor:pointer;\" onclick=\"ustaw_min(0); $('#wyborWojsk tr:has(td)').each(function(i){$(this).show();}); \">Minimum\u00A0birlik\u00A0miktari:";
	for(i=0;i<dane.predkosci.length;i++)
		okienko += "<th><input onchange=\"chowaj_wojska("+i+",this.value);\" type='text' value="+minimalna_ilosc_wojsk[i]+" size='1'>";

	okienko += "<th colspan=2><tr><th style=\"cursor:pointer;\" onclick=\"sortowanie_przegladu("+(-1)+");\" ><span class='icon header village' ></span>";
	for(i=0;i<obrazki.length;i++){
		okienko += "<th style=\"cursor:pointer;\" onclick=\"sortowanie_przegladu("+i+");\" ><img src='"+img_wojsk+"unit_"+obrazki[i]+".png'>";
	}
	okienko +="<th style=\"cursor:pointer;\" onclick=\"sortowanie_przegladu("+(obrazki.length)+");\" >Uzaklik<th><input type='checkbox' onClick='zaznaczWszystko(this)'>";
	for(i=0;i<wojska.length;i++){
		ukryty = false;
		komorki = "<a href="+dane.linkDoPrzegladuWioski+id[i]+">"+nazwyWiosek[i].replace(/\s+/g, "\u00A0")+"</a>";
		for(j=0;j<obrazki.length;j++){
			komorki += "<td>"+wojska[i][j];
			if(!ukryty && Number(wojska[i][j]) < Number(minimalna_ilosc_wojsk[j])) ukryty = true;
		}
		if(!ukryty) wiersz = "<tr class='"+(i%2?'row_a':'row_b')+"'><td>"; 
		else wiersz="<tr class='"+(i%2?'row_a':'row_b')+"' style=\"display: none;\"><td>";
		okienko += wiersz + komorki;
		
		okienko += "<td><td><input name='wybierz' type='checkbox' "+(pokazWies[i]?'checked':"disabled")+">";
	}
	$('#wyborWojsk').html(okienko);
	pokazOdleglosc();
}
function pokazOdleglosc(){
	var inp = twPlTargetCoordInput();
	if (!inp) return;
	var normalized = twPlParseCoordText(inp.value);
	if (normalized) inp.value = normalized;
	var parts = normalized ? normalized.split('|') : null;
	var cel = parts && parts.length >= 2 ? [Number(parts[0]), Number(parts[1])] : null;
	if (!cel || !Number.isFinite(cel[0]) || !Number.isFinite(cel[1])) return;
	if (!mojeWioski || !mojeWioski.length) return;
	$("#wyborWojsk tr:has(td) td:nth-child("+(dane.predkosci.length+2)+")").each(function(i){
		a = Math.abs(cel[0] - mojeWioski[i][mojeWioski[i].length-3]);
		b = Math.abs(cel[1] - mojeWioski[i][mojeWioski[i].length-2]);
		$(this).html(Number((Math.sqrt((a * a) + (b * b))).toFixed(1)));
	});
}
function zapiszWybrane(){
	$('#wyborWojsk input:checkbox').each(function (i) {
		if(i) 
			pokazWies[i-1] = $(this).is(':checked'); 
	});
	$('#wyborWojsk').hide();
	$("#lista_wojska").show();
}
function zmienStrzalke(){
	if($("#strzaleczka").hasClass('arr_down')){ 
		$("#strzaleczka").removeClass('arr_down'); 
		$("#strzaleczka").addClass('arr_up'); 
	} 
	else{
		$("#strzaleczka").removeClass('arr_up'); 
		$("#strzaleczka").addClass('arr_down');
	}; 
} 

/** Bookmarklet / dis script bazen content_value dolmadan calisir; info_village masaustu icin DOM hazir olunca bir kez baslat. */
function twPlBootstrapPlaner(){
	function run(){
		rysujPlaner();
		if (twPlIsInfoVillagePage()) komutTiklamaEkle();
		pobierzDane();
	}
	if (mobile || !twPlIsInfoVillagePage()) {
		run();
		return;
	}
	var cv = document.getElementById('content_value');
	if (!cv) {
		run();
		return;
	}
	function contentLooksReady(){
		try {
			return !!(cv.querySelector('table') || cv.querySelector('.vis') || (cv.textContent && cv.textContent.replace(/\s+/g, '').length > 120));
		} catch (eR) {
			return true;
		}
	}
	if (contentLooksReady()) {
		run();
		return;
	}
	var finished = false;
	function finish(){
		if (finished) return;
		finished = true;
		try {
			mo.disconnect();
		} catch (eD) {}
		run();
	}
	var mo = new MutationObserver(function(){
		if (contentLooksReady()) finish();
	});
	mo.observe(cv, { childList: true, subtree: true });
	setTimeout(finish, 7000);
}

function rysujPlaner(){
	var fbX = game_data.village.x, fbY = game_data.village.y;
	var cel = twPlSanitizeCoordPair(fbX + '|' + fbY, fbX, fbY);
	if(twPlIsInfoVillagePage()){
		if(!mobile){
			var cv = document.getElementById('content_value');
			var parsed = twPlCoordsFromInfoVillage() || twPlCoordsFromMapLinks(cv);
			if (parsed && twPlRejectNoiseCoordPair(parsed)) parsed = null;
			if (parsed) {
				cel = twPlSanitizeCoordPair(parsed, fbX, fbY);
			} else {
				var tabela = cv && cv.getElementsByClassName('vis')[0];
				var legacyRaw = '';
				if (tabela && tabela.rows && tabela.rows[2] && tabela.rows[2].cells[1])
					legacyRaw = (tabela.rows[2].cells[1].textContent || '').trim();
				var fromLegacy = legacyRaw ? twPlSanitizeCoordPair(legacyRaw, null, null) : '0|0';
				if (fromLegacy !== '0|0' && !twPlRejectNoiseCoordPair(fromLegacy)) cel = fromLegacy;
			}
			cel = twPlSanitizeCoordPair(cel, fbX, fbY);
		}
		else{
			var mkv = document.getElementsByClassName('mobileKeyValue')[0];
			var mobDiv = mkv && mkv.getElementsByTagName("div")[0];
			var mobMatch = mobDiv && (mobDiv.textContent || '').match(/\b(\d{1,4})\s*\|\s*(\d{1,4})\b/);
			if (mobMatch) cel = mobMatch[1] + '|' + mobMatch[2];
			cel = twPlSanitizeCoordPair(cel, fbX, fbY);
		}
	}
	var pobralemCzas = false;
	if($(".no_ignored_command").length)
		$(".no_ignored_command").each(function(i){
			if(x = $(this).html().match("snob.png") && !pobralemCzas){ 
				czas_wejscia_grubego = $(this).find("td:eq(2)").text().match(/\d+/g);
				obecnyCzas.setSeconds(obecnyCzas.getSeconds()+Number(czas_wejscia_grubego[2])+(60*Number(czas_wejscia_grubego[1]))+(3600*Number(czas_wejscia_grubego[0])));
				pobralemCzas = true;
				return;
			}
		});
	var elem = "<div class='vis vis_item' style='overflow: auto; height: 300px;' id='planer_klinow' data-arascript-rev='2026-05-20' title='arascript guncel'><table width='100%'><tr><td width='300'><table style=\"border-spacing: 3px; border-collapse: separate;\"><tr><th>Hedef<th>Tarih<th>Saat<th>Grup<th><th><tr><td><input size=8 type='text' onchange='pokazOdleglosc();' value='' autocomplete='off' id='wspolrzedneCelu' /><td><input size=8 type='text' value='" + obecnyCzas.getDate()+"."+(obecnyCzas.getMonth()+1)+"."+obecnyCzas.getFullYear() + "' onchange=\"poprawDate(this,'.');\" id='data_wejscia'/><td><input size=8 type='text' value='" + obecnyCzas.getHours()+":"+obecnyCzas.getMinutes()+":"+obecnyCzas.getSeconds() + "' onchange=\"poprawDate(this,':');\" id='godzina_wejscia'/><td><select id='listGrup' onchange=\"zmienGrupe();\"><option value='"+wszystkieWojska+"'>Tumu</select><td onclick=\"zmienStrzalke(); if($('#wyborWojsk').is(':visible')){ $('#wyborWojsk').hide();$('#lista_wojska').show(); zapiszWybrane(); return;}	else{ $('#lista_wojska').hide(); $('#wyborWojsk').show();} \" style=\"cursor:pointer;\"><span id='strzaleczka' class='icon header arr_down' ></span><td><input type='button' class='btn' value='Hesapla' title='Asker listesi yuklenene kadar bekleyin' disabled onclick=\"wypiszMozliwosci();\" id='przycisk'></table><td id='ladowanie'><img src='"+image_base+"throbber.gif' />";
	elem += "<tr><td colspan=2 width='100%'><table style=\"display: none; border-spacing: 3px; border-collapse: separate;\" id='wyborWojsk' width='100%'></table><table style=\"border-spacing: 3px; border-collapse: separate;\" id='lista_wojska' width='100%'><thead><tr><th id='ilosc_mozliwosci'><span class='icon header village' ></span>";

	for(i=0;i<obrazki.length;i++)
		elem += "<th style=\"cursor:pointer;\" class='"+(aktywneJednostki[i]=="0"?"faded":"")+"' onClick=\"if(this.className == 'faded') this.className=''; else this.className='faded';\"><img title='"+dane.nazwyWojsk[i]+"' src='"+img_wojsk+"unit_"+obrazki[i]+".png'>";
	elem += "<th>Cikis\u00A0zamani<th><span class=\'icon header time\'><th><b>Emir</b></thead>";
	elem += "<tbody></table></table></div>";
	$(mobile?"#mobileContent":"#contentContainer").prepend(elem);
	twPlFillTargetCoordInput(cel);
	twPlScheduleInfoVillageCoordRefresh();
	twPlWatchContentValueCoords();
}
function komutTiklamaEkle(){
	var rows = jQuery('#commands_outgoings .command-row');
	if(!rows.length) return;
	var utcDiff;
	if(typeof server_utc_diff !== 'undefined') utcDiff = server_utc_diff;
	else if(typeof Timing !== 'undefined' && Timing.initial_server_time) utcDiff = Timing.initial_server_time - Math.round(Date.now()/1000);
	else utcDiff = 0;
	var html = '<div class="vis vis_item" id="komut_aktarma" style="margin-bottom:5px;padding:5px;">';
	html += '<table class="vis" width="100%"><tr><th colspan="3" style="text-align:left;">Komutlar &mdash; Zamani Aktar</th></tr>';
	rows.each(function(idx){
		var row = jQuery(this);
		var timerSpan = row.find('[data-endtime]');
		if(!timerSpan.length) return;
		var endtime = Number(timerSpan.attr('data-endtime'));
		var d = new Date((endtime + utcDiff) * 1000);
		var tarih = d.getUTCDate()+'.'+(d.getUTCMonth()+1)+'.'+d.getUTCFullYear();
		var saat = ('0'+d.getUTCHours()).slice(-2)+':'+('0'+d.getUTCMinutes()).slice(-2)+':'+('0'+d.getUTCSeconds()).slice(-2);
		var labelParts = [];
		row.find('td').each(function(ci){
			if(ci > 1) return false;
			var t = jQuery(this).text().replace(/\s+/g,' ').trim();
			if(t) labelParts.push(t);
		});
		var label = labelParts.join(' ').substring(0,50) || ('Komut '+(idx+1));
		html += '<tr>';
		html += '<td style="padding:3px 6px;">'+label+'</td>';
		html += '<td style="padding:3px 6px;white-space:nowrap;"><b>'+tarih+' '+saat+'</b></td>';
		html += '<td style="padding:3px 6px;"><input type="button" class="btn komut-aktar-btn" value="Aktar" data-tarih="'+tarih+'" data-saat="'+saat+'" style="padding:1px 8px;font-size:11px;"></td>';
		html += '</tr>';
	});
	html += '</table></div>';
	jQuery('#planer_klinow').after(html);
	jQuery('#komut_aktarma').on('click', '.komut-aktar-btn', function(e){
		e.preventDefault();
		var btn = jQuery(this);
		jQuery('#planer_klinow #data_wejscia').val(btn.data('tarih'));
		jQuery('#planer_klinow #godzina_wejscia').val(btn.data('saat'));
		btn.val('OK').css('background','#5c5');
		setTimeout(function(){ btn.val('Aktar').css('background',''); }, 1200);
		UI.SuccessMessage('Aktarildi: '+btn.data('tarih')+' '+btn.data('saat'));
	});
}
function poprawDate(elem,sep){
	x = elem.value.match(/\d+/g);
	elem.value = x[0] + sep + x[1] + sep + x[2];
}
function pobierzDane(){
	pobieram = true;
	$("#przycisk").prop("disabled", true).attr("title", "Veri indiriliyor...");
	var r;
	r = new XMLHttpRequest();
	r.open('GET', dane.linkDoWojska, true);
	r.timeout = 60000;
	r.onerror = function(){
		$("#ladowanie").html("Ag hatasi");
		twPlToast('Asker listesi istegi basarisiz (ag/CORS). Sayfayi yenileyin.', true);
		pobieram = false;
		$("#przycisk").prop("disabled", false).attr("title", "");
	};
	r.ontimeout = function(){
		$("#ladowanie").html("Zaman asimi");
		twPlToast('Asker listesi 60 sn icinde gelmedi.', true);
		pobieram = false;
		$("#przycisk").prop("disabled", false).attr("title", "");
	};
	function processResponse(){
		if (r.readyState !== 4) return;
		if (r.status !== 200) {
			$("#ladowanie").html("Asker listesi alinamadi (HTTP " + r.status + ").");
			twPlToast('Asker listesi yuklenemedi (HTTP ' + r.status + '). Koy secimini veya oturumu kontrol edin.', true);
			pobieram = false;
			$("#przycisk").prop("disabled", false).attr("title", "");
			return;
		}
		try {
			requestedBody = document.createElement("body");
			requestedBody.innerHTML = r.responseText;
			var tabela = $(requestedBody).find('#units_table').get()[0];
			var grupEl = $(requestedBody).find('.vis_item').get()[0];
			if(!tabela || !grupEl){
				$("#ladowanie").html("Secilen\u00A0grupta\u00A0koy\u00A0yok\u00A0:/ Baska\u00A0bir\u00A0grup\u00A0secin");
				twPlToast('Bu grupta koy yok veya sayfa yapisi degisti (#units_table).', true);
				pobieram = false;
				$("#przycisk").prop("disabled", false).attr("title", "");
				return;
			}
			var grupy = grupEl.getElementsByTagName(mobile?'option':'a');
			for(i=1;i<tabela.rows.length;i++){
				pokazWies[i-1]=true;
				wojska[i-1] = [];
				var toplamAsker = 0;
				for(j=2;j<tabela.rows[i].cells.length-1;j++){
					wojska[i-1].push(tabela.rows[i].cells[j].textContent);
					toplamAsker += Number(wojska[i-1][j-2]);
				}
				if(toplamAsker === 0) pokazWies[i-1]=false;
				var spans = tabela.rows[i].cells[0].getElementsByTagName('span');
				if (!spans || spans.length < 3) continue;
				var did = spans[0].getAttribute("data-id");
				var coordTxt = spans[2].textContent;
				var coordArr = coordTxt.match(/\d+/g);
				if (!did || !coordArr || coordArr.length < 2) continue;
				id.push(did);
				mojeWioski.push(coordArr);
				nazwyWiosek.push(coordTxt);
			}
			wybieranieWiosek();
			if(pobraneGrupy && $('#lista_wojska').is(':visible')) wypiszMozliwosci();
			if(!pobraneGrupy){
				for(i=0;i<grupy.length;i++){
					nazwa = grupy[i].textContent;
					if(mobile && grupy[i].textContent=="wszystkie") continue;
					$("#listGrup").append($('<option>', {
						value: grupy[i].getAttribute(mobile?"value":"href")+"&page=-1",
						text: mobile?nazwa:nazwa.slice(1,nazwa.length-1)
					}));
				}
				
				pobraneGrupy = true;
			}
			
			$("#ladowanie").html("");
			pobieram = false;
			$("#przycisk").prop("disabled", false).attr("title", "");
		} catch (ex) {
			$("#ladowanie").html("Veri hatasi");
			twPlToast('Asker tablosu okunamadi: ' + ex, true);
			pobieram = false;
			$("#przycisk").prop("disabled", false).attr("title", "");
		}
	}
	r.onreadystatechange = processResponse;
	r.send(null);
}

function konfiguracjaSwiata(){
	var dt;
	$.ajax({
		'async':false,
		'url':'/interface.php?func=get_config',
		'dataType':'xml',
		'success':function(data){dt=data;}
	});
	return dt;
}
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
    }
    return "";
}
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toGMTString();
	if(exdays==0) expires="";
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

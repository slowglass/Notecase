
var SlowglassConvertor = function() {
	this.converter = new showdown.Converter({
		omitExtraWLInCodeBlocks: true,
		headerLevelStart: 3,
		strikethrough: true,
		tasklists: true,
		smoothLivePreview: true,
		smartIndentationFix: true
	});
}

SlowglassConvertor.prototype = {
	reFgmtInc: new RegExp(/^@\+\s*([A-Za-z][A-Za-z 0-9]*)\s*$/),
	reFgmtBegin: new RegExp(/^@#\s*([A-Za-z][A-Za-z 0-9]*)\s*$/),
	reFgmtEnd: new RegExp(/^@#\s*$/),
	reHashDot: new RegExp(/^(\s*)#\./, "gm"),
	reCRLF: new RegExp(/(\r\n)/, "gm"),

	_insertFragments: function(inS, fgmts, ignoreKey) {
		var $$=this;
		var updated = false;
		var outS = "";
		$.each(inS.split("\n"), function(i,l) {
			let r = $$.reFgmtInc.exec(l);
			if (r == null) { outS+=l+"\n"; return; }
			let key=r[1];
			if (key == ignoreKey) return;
			updated = true;
			outS += fgmts[key];
		});
		if (updated) return this._insertFragments(outS, fgmts, ignoreKey);
		else return outS;
	},

	insertFragments: function(s, fgmts)	{
		var $$=this;
		$.each(fgmts, function(k,v) {
			fgmts[k]=$$._insertFragments(v, fgmts, k);
		});

		return $$._insertFragments(s, fgmts, null);
	},

	extractFragments: function(inS, fgmts) {
		var $$=this;
		var inFragment = false;
		var fgmt = { in: false };
		var outS = "";
		$.each(inS.split("\n"), function(i,l) {
			if (fgmt.in)
			{
				let r = $$.reFgmtEnd.exec(l);
				if (r == null) { outS+=l+"\n"; fgmt.contents+=l+"\n"; return; }
				fgmts[fgmt.name] = fgmt.contents;
				fgmt = { in: false };
			} else {
				let r = $$.reFgmtBegin.exec(l);
				if (r == null) { outS+=l+"\n"; return; }
				fgmt = { in: true, name: r[1], contents: "" };
			}
		});
		return outS;
	},

	convert: function(s) {
		s = s.replace(this.reHashDot, function(m, p1) { return p1+"1."; });
		s = s.replace(this.reHashDot, function() { return "\n"; });

		var fgmts = {};
		s=this.extractFragments(s, fgmts);
		s=this.insertFragments(s, fgmts);
		s = this.converter.makeHtml(s);

		s = s.split("multiple").join("<a href=\"#\">multiple</a>");
		return s;
	}
}
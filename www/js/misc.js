var Utils = {
	denormalisePath: function(p) { if (p == "$ROOT") return ""; else return p; },
	normalisePath: function(p) { if (p == "") return "$ROOT"; else return p; },
	dirname: function(p) { return p.substring(0, p.lastIndexOf('/')); },
	basename: function(p) { return p.substring(0, p.lastIndexOf('.')); },
	prettyPath: function(p) { return p.replace("/","").replace(/\//g, " > "); }
}
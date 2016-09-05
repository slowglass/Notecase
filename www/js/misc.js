var Utils = {
    root: "",
	denormalisePath: function(p) { if (p == Utils.root) return ""; else return p; },
	normalisePath: function(p) { if (p == "") return Utils.root; else return p; },
	dirname: function(p) { return p.substring(0, p.lastIndexOf('/')); },
	basename: function(p) { return p.substring(0, p.lastIndexOf('.')); },
	prettyPath: function(p) { return p.replace("/","").replace(/\//g, " > "); }
}
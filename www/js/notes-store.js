
var Storage = function() {
	this.put = function(note, status, data) {
	    let clonedNode = jQuery.extend({}, note);
	    if (status != undefined) clonedNode["status"] = status;
	    if (data != undefined) clonedNode["data"] = data;
		let s = JSON.stringify(clonedNode);
		localStorage.setItem(note.id, s);
	}

	this.get = function(k) {
		let s = localStorage.getItem(k);
		return JSON.parse(s);
	}

	this.set = function(id, field, value) {
		let note = this.get(id);
		note[field] = value;
		this.put(note);
	}
};

var NotesStore = function() {
	this.notes = {};
	this.folderContents = {}
	this.folderNames = {}
}

NotesStore.prototype = {
	noteSort: function(v1,v2) {
		let n1 = v1.name.toLowerCase();
     	let n2 = v2.name.toLowerCase();
     	if (n1 < n2) return -1;
     	else if (n1 > n2) return  1;
     	return 0;
	},

	getPath: function(note) {
		let p = note.path_lower;
		return Utils.normalisePath(Utils.dirname(p));
	},

	add: function(note) {
		if (note.name.startsWith(".")) return;
		let id = note.id;
		note.tag = note[".tag"];
		delete note[".tag"];
		this.notes[id] = note;
		this.addPathLink(note);
		if (note.tag == "folder")
			this.folderNames[note.path_lower] = note.name;
	},

	remove: function(id) {
		let note = this.notes[id];
		delete notes[id];
		this.deletePathLink(note)
	},

	addPathLink: function(note) {
		let f = this.getPath(note);
		if (this.folderContents[f] == undefined) this.folderContents[f] = new Set();
		this.folderContents[f].add(note.id);
	},

	deletePathLink: function(note) {
		let f = this.getPath(note);
		this.folderContents[f].delete(id);
	},

	getByFolder: function(path) {
		let list = [];
		let items = this.folderContents[path];
		if (items == undefined) return list;
		items.forEach(function(id) {
			let note=this.notes[id];
			list.push(note);
		}, this);
		list.sort(this.noteSort);
		return list;
	},

	getByPath: function(dir, name) {
	    var noteID = null;
	    let d = dir.toLowerCase();
	    let items = this.folderContents[d];
	    if (items == undefined) return noteID;
	    var p = d + "/" + name.toLowerCase();
	    items.forEach(function(id) {
        	if (this.notes[id].path_lower == p)
        	    noteID = id;
        }, this);
        return noteID;
	},

	getById: function(id) {
		return this.notes[id];
	},



	setContent: function(note, status, data) {
        let clonedNode = jQuery.extend({}, note);
        if (status != undefined) clonedNode["status"] = status;
        if (data != undefined) clonedNode["data"] = data;
        let s = JSON.stringify(clonedNode);
        localStorage.setItem(note.id, s);
    },

    getContent: function(id) {
        let s = localStorage.getItem(id);
        return JSON.parse(s);
    },

    updateContent: function(id, field, value) {
        let note = this.getContent(id);
        note[field] = value;
        this.setContent(note);
    }
}

var SelectorCtrl = function(notecase) {
	this.notecase = notecase;
}

SelectorCtrl.prototype = {
    uuid: 0,
    currentPage: null,
    currentPath: "",
	changePage: function(selector, path, title) {
		$.mobile.changePage("#selector"+selector, { transition: "flip" });
		var newState = jQuery.extend(true, {}, window.history.state);
		newState.path = path;
		newState.selector = selector;
		window.history.replaceState(newState, title);
	},

	$fill: function(anchor) {
		let $a=$(anchor);
		let selector=$a.data("selector");
		let note=$a.data("note");
		let path=Utils.normalisePath(note.path_lower);
		let title=note.path_display;
		this.changePage(selector, path, title);
		this._fill(selector, path, title);
	},

	fill: function(opt) {
		let selector=opt.selector;
		let path=opt.path;
		let title=opt.title;
		this._fill(selector, path, title);
	},

	_fill: function(selector, path, title) {
	    this.currentPage=selector;
	    this.currentPath = path;
		$("#selector"+this.currentPage+" h1").html(Utils.prettyPath(title));
		this.notecase.fillList(selector, path);
	},

	onNewNote: function() {
	    let d=new Date();
	    $("#new-note-name").val(d.getFullYear() + 1 + "-" + d.getMonth() + "-" + d.getMonth());
        $.mobile.changePage( "#new-note", { role: "dialog" } );
	},

    error: function(icon, title, msg) {
        $("#error-dialog .nc-title").text("Error: "+ title);
        $("#error-dialog .nc-message").text(msg);
        $.mobile.changePage( "#error-dialog", { role: "dialog" } );
    },

	onNewNoteCreate: function() {
    	let note = { }
    	var p = Utils.denormalisePath(this.currentPath);
	    var title = $("#new-note-name").val();
	    note.name = title + ".md";
	    this.path_display = p + "/" + note.name;
        this.path_lower = this.path_display.toLowerCase();
        if (this.notecase.getByPath(this.currentPath,note.name) != null)
            return error(null, "Create New Note", "Note already exists");

        note.id = this.uuid++;
        note.status="new";
	    note.path_display = p + "/" + note.name;
	    note.path_lower = note.path_display.toLowerCase();
        note.uuid++;
        note[".tag"] = "file";
        this.notecase.addNote(note);
        this.notecase.fillList(this.currentPage, this.currentPath);
        this.notecase.setContent(note, "new", "# " + title +"\n");
	}
}

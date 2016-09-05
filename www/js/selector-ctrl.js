
var SelectorCtrl = function(notecase) {
	this.notecase = notecase;
}

SelectorCtrl.uuid=101;

SelectorCtrl.prototype = {
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

	onNewNoteCreate: function(event) {
        if (event != undefined) event.preventDefault();

        let md = { };
        var p = this.currentPath;
        var title = $("#new-note-name").val();
        md.name = title + ".md";
        md.path_display = p + "/" + md.name;
        md.path_lower = md.path_display.toLowerCase();
        if (this.notecase.getByPath(md.path_lower) != null)
        {
            if (event != undefined) $("#new-note").dialog("close");
            return this.error(null, "Create New Note", "Note already exists");
        }

        md.id = "NEW:"+SelectorCtrl.uuid++;
        md.rev = NoteMetadata.NO_REV;
        md.cache_status = NoteMetadata.NEW;
        md.cache_integrity = true;
        md[".tag"] = "file";
        this.notecase.fillList(this.currentPage, this.currentPath);
        this.notecase.addNote(md);

        this.notecase.putInCache(md.path_lower, "# " + title +"\n", md.rev, true);
        this.notecase.changeNoteStatus(md.path_lower, NoteMetadata.NEW, true);

        if (event != undefined) $("#new-note").dialog("close");
	}
}

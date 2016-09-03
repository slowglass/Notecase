
var NoteViewCtrl = function(notecase) {
	this.notecase = notecase;
};

NoteViewCtrl.prototype = {
    id: "",
    status: "SAVED",
    mode: "VIEW",
	changePage: function() {
		waitCtrl.setState("off");
		$.mobile.changePage("#noteview");
	},

	populate: function(data) {
		$("#noteview .nc-note-view").html(converter.convert(data)).show();
		$("#noteview .nc-note-edit textarea").html(data);
		$("#noteview .nc-note-edit").hide();
	},

	fetchNote: function(note, anchor) {
		var $$=this;
		let p=Utils.normalisePath(note.path_lower);
		waitCtrl.setState("on");

		$("#noteview h1").html(Utils.prettyPath(note.path_display));
		this.notecase.get(p, function(data) {
			$$.populate(data);
			var cachedNote = $$.notecase.setContent(note, "saved", data);
			$$.changePage();
		});
	},

	$fill: function(anchor) {
		var note;
		note = $(anchor).data("note");
        this.id = note.id;

		let cache = this.notecase.getContent(note.id);
		$("#noteview").data("note", note.id);

		if (cache == undefined || cache.rev != note.rev)
			return this.fetchNote(note, anchor);

		this.populate(cache.data);
		this.changePage();
	},

	setMode: function(mode) {
	    if (mode != undefined) this.mode = mode;
	    if (this.mode == "EDIT") {
    		$("#noteview .nc-note-view").hide();
    		$("#noteview .nc-note-edit").show();
            $("#note-edit").addClass('ui-disabled');
            $("#note-view").removeClass('ui-disabled');
	    } else {
	        $("#noteview .nc-note-view").show();
            $("#noteview .nc-note-edit").hide();
            $("#note-edit").removeClass('ui-disabled');
            $("#note-view").addClass('ui-disabled');
	    }
	},

	setStatus: function(status) {
        if (status != undefined) this.status = status;
        if (this.status == "CHANGED" && this.mode == "VIEW")
            $("#note-upload").removeClass('ui-disabled');
        else
            $("#note-upload").addClass('ui-disabled');
	},
	onEdit: function() {
	    this.setMode("EDIT");
	    this.setStatus();
        let note = this.notecase.getContent(this.id);
        simplemde.value(note.data);
	},
	onView: function() {
	    this.setMode("VIEW");
	    this.setStatus("CHANGED");
	    var data = simplemde.value();
        let note = this.notecase.getContent(this.id);
        this.notecase.setContent(note, "changed", data);
        noteViewCtrl.populate(data);
	},
	onUpload: function() {
	    var $$=this;
		var id = this.id;
    	let note = this.notecase.getContent(id);
    	if (note.status == "saved") {
    	    this.setStatus("SAVED");
    		return;
    	}

        this.setStatus("UPLOADING");
        this.notecase.updateContent(id, "status", "uploading");
        $.mobile.changePage( "#uploading", { role: "dialog" } );
    	this.notecase.put(note,
    	    function() {
    	       $.mobile.changePage( "#noteview" );
    	       $$.notecase.updateContent(id, "status", "saved");
    	       $$.setStatus("SAVED");
    	    },
    		function() {
    			alert("Save Error");
    			$$.notecase.updateContent(id, "status", "changed");
    		});
	}
}

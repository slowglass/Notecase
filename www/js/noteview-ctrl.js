
var NoteViewCtrl = function(notecase) {
	this.notecase = notecase;
};

NoteViewCtrl.VIEW = "VIEW";
NoteViewCtrl.EDIT = "EDIT";
NoteViewCtrl.LOCAL = "LOCAL";
NoteViewCtrl.REMOTE = "REMOTE";

NoteViewCtrl.prototype = {
    path_lower: "",
    status: NoteViewCtrl.REMOTE,
    mode: NoteViewCtrl.VIEW,
	changePage: function() {
		waitCtrl.setState("off");
		$.mobile.changePage("#noteview");
	},


	populate: function(data) {
		$("#noteview .nc-note-view").html(converter.convert(data)).show();
	},

	fetchNote: function(note, anchor) {
		var $$=this;
		let p=Utils.normalisePath(note.path_lower);
		waitCtrl.setState("on");

		$("#noteview h1").html(Utils.prettyPath(note.path_display));
		this.notecase.get(p, function(data) {
			$$.setMode(NoteViewCtrl.VIEW);
			$$.setStatus(NoteViewCtrl.REMOTE);
			$$.populate(data);
			$$.notecase.putInCache(p, data, note.rev, false);
			$$.notecase.changeNoteStatus(p, NoteMetadata.CURRENT, true);
			$$.changePage();
		});
	},

	$fill: function(anchor) {
		var md = $(anchor).data("note");
        this.path_lower = md.path_lower;

		let cache = this.notecase.getFromCache(md.path_lower);
		$("#noteview").data("path", md.path_lower);

		if (cache == undefined || cache.rev != md.rev)
			return this.fetchNote(md, anchor);

        this.setMode(NoteViewCtrl.VIEW);
        if (md.cache_status == NoteMetadata.NEW || md.cache_status == NoteMetadata.LOCAL)
            this.setStatus(NoteViewCtrl.LOCAL);
        else
            this.setStatus(NoteViewCtrl.REMOTE);

		this.populate(cache.data);
		this.changePage();
	},

	setMode: function(mode) {
	    if (mode != undefined) this.mode = mode;
	    if (this.mode == NoteViewCtrl.EDIT) {
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
        if (this.status == NoteViewCtrl.LOCAL && this.mode == NoteViewCtrl.VIEW)
            $("#note-upload").removeClass('ui-disabled');
        else
            $("#note-upload").addClass('ui-disabled');
	},
	onEdit: function() {
	    this.setMode(NoteViewCtrl.EDIT);
	    this.setStatus();
        let note = this.notecase.getFromCache(this.path_lower);
        simplemde.value(note.data);
	},
	onView: function() {
	    this.setMode(NoteViewCtrl.VIEW);
	    this.setStatus(NoteViewCtrl.LOCAL);
	    var data = simplemde.value();
        let md = this.notecase.getByPath(this.path_lower);
        let cache = this.notecase.getFromCache(this.path_lower);
        this.notecase.updateCache(this.path_lower, "data", data);
        this.notecase.updateCache(this.path_lower, "changed", true);
        this.notecase.changeNoteStatus(this.path_lower, NoteMetadata.LOCAL, md.rev == cache.rev);
        noteViewCtrl.populate(data);
	},
	onUp: function() {
	    var p = Utils.dirname(this.path_lower);
	    var md = this.notecase.getByPath(p);
	    selCtrl.fill({selector: 0, path: p, title: Utils.prettyPath(md.path_display)});
	    $.mobile.changePage( "#selector0" );
	},

	onUpload: function() {
	    var $$=this;
		var p = this.path_lower;
    	let cache = this.notecase.getFromCache(p);
    	let md = this.notecase.getByPath(p);

        if (!cache.changed) {
            alert("Error");
    	    callNotDone();
    		return;
    	}

        $.mobile.changePage( "#uploading", { role: "dialog" } );
    	this.notecase.put(p, cache.data, cache.rev,
    	    function(data) {
    	       if (data.path_lower != p) {
    	          data[".tag"] = "file";
    	          $("#noteview h1").html(Utils.prettyPath(data.path_display));
    	          $$.notecase.addNote(data);
    	          $$.notecase.putInCache(data.path_lower, cache.data, data.rev, false);
    	          $$.notecase.changeNoteStatus(data.path_lower, NoteMetadata.CURRENT, true);
    	          $$.notecase.removeFromCache(p);
    	          $$.notecase.changeNoteStatus(p, NoteMetadata.MISSING, true);
    	          if (md.cache_status == NoteMetadata.NEW)
    	            $$.notecase.removeNote(p);
    	       }
    	       $.mobile.changePage( "#noteview" );

    	    },
    		function() {
    		   alert("Save Error");
    	       callNotDone();
    		});
	}
}


/**
    ".tag": "file",
    "name": "Prime_Numbers.txt",
    "id": "id:a4ayc_80_OEAAAAAAAAAXw",
    "client_modified": "2015-05-12T15:50:38Z",
    "server_modified": "2015-05-12T15:50:38Z",
    "rev": "a1c10ce0dd78",
    "size": 7212,
    "path_lower": "/homework/math/prime_numbers.txt",
    "path_display": "/Homework/math/Prime_Numbers.txt",
    "sharing_info": {
        "read_only": true,
        "parent_shared_folder_id": "84528192421",
        "modified_by": "dbid:AAH4f99T0taONIb-OurWxbNQ6ywGRopQngc"
    },
    "property_groups": [
        {
            "template_id": "ptid:1a5n2i6d3OYEAAAAAAAAAYa",
            "fields": [
                {
                    "name": "Security Policy",
                    "value": "Confidential"
                }
            ]
        }
    ],
    "has_explicit_shared_members": false
*/

var Notecase = function() {
	this.token= "3wsLXh8GbvUAAAAAAAAUagzM6j17BZJjTrQXMewcgI5vVD-vR-kA02sMSe7m9CYd";
	this.debug= "";
	this.cursor= null;
	this.notesStore= new NotesStore();
	this.attributes= new Map();
}

Notecase.prototype = {
	errorCallback: function() { alert("Cannot get data"); },

	processFiles: function(data) {
		var $$=this;
		// Error on has_more at the moment.
		if (data.has_more) alert("Error files bigger than intial download");

		cursor = data.cursor;
		$.each(data.entries, function(i,v) {
			$$.addNote(v);
		});
	},

	fillList: function(selector, key) {
		var $$=this;
		var lv=$("#selector" + selector +" .listview");
		var items;
		if (key=="") key="$ROOT";
		items = $$.notesStore.getByFolder(key);
		lv.html("");
		$.each(items, function(i,v) {
		   let li=$("<li class='bf-selector' />");
		   lv.append(li);
		   let name=v.name;

		   if (v.tag != "folder")
		   		name = Utils.basename(v.name);
		   $(li).append(
			'<a href="#" data-direction="reverse">'+
			'<h2>'+name +'</h2>'+
			'</a>');
			li.find("a")
				.data("note", v)
				.data("selector", (selector+1)%2);
		});
		lv.listview('refresh');
	},

	get: function(path, successCB, errorCB) {
		var $$=this;
		if (errorCB==null) errorCB=this.errorCallback;
		$.ajax({
			url: "https://content.dropboxapi.com/2/files/download",
			headers: {
				"Authorization": "Bearer "+ $$.token,
				"Dropbox-API-Arg": '{"path":"'+path+'"}'
			}, 
			type: 'POST',
			processData: false,
			success: successCB,
			error: errorCB
		});
	},

	put: function(note, successCB, errorCB) {
		var $$=this;
		var encodedData = new TextEncoder("utf-8").encode(note.data);
		var params;

		 if (note.rev == undefined)
		    params = {
                "path": note.path_lower,
                "mode": "add",
                "autorename": true
            };
		 else
		    params = {
                "path": note.path_lower,
                "mode": {
                    ".tag": "update",
                    "update": note.rev
                },
                "autorename": true
            };
		if (errorCB==null) errorCB=this.errorCallback;
		$.ajax({
			url: "https://content.dropboxapi.com/2/files/upload",
			headers: {
				"Authorization": "Bearer "+ $$.token,
				"Dropbox-API-Arg": JSON.stringify(params)
			}, 
			contentType: 'application/octet-stream',
			type: 'POST',
			processData: false,
			data: encodedData,
			success: successCB,
			error: errorCB
		});
	},

	getDir: function(successCB, errorCB) {
		var $$=this;
		if (errorCB==null) errorCB=this.errorCallback;
		$.ajax({
			url: "https://api.dropboxapi.com/2/files/list_folder",
			headers: {
				"Authorization": "Bearer "+ $$.token
			}, 
			type: 'POST',
			dataType: 'json',
			contentType: 'application/json',
			processData: false,
			data: '{"path":"","recursive":true}',
			success: successCB,
			error: errorCB
		});
	},


    // Add / Remove notes
	addNote: function(note) { return this.notesStore.add(note); },

    // Search interface
    getByPath: function(d,n) { return this.notesStore.getByPath(d,n); },

	// Storage Interface
	setContent: function(note, status, data) { return this.notesStore.setContent(note, status, data); },
	getContent: function(id) { return this.notesStore.getContent(id); },
	updateContent: function(id, field, value) { return this.notesStore.updateContent(id, field, value); }
}

var WaitCtrl = function() {
	this.state = "off";
	this._toggleCB = function() {
		if (this.state == "off") return;
		$(".nc-download").toggle(25, this._toggleCB);
	}
	this.setState = function(state) {
		if (state=="off") { this.state=state; $(".nc-download").fadeOut(5); return; }
		this.state=state;
		this._toggleCB();
	}
}


var converter = new SlowglassConvertor();
var notecase = new Notecase();
var selCtrl = new SelectorCtrl(notecase);
var noteViewCtrl = new NoteViewCtrl(notecase);
var waitCtrl = new WaitCtrl();
var simplemde;


$(window).on("navigate", function (event, data) {
  var direction = data.state.direction;
  if (direction == 'back') {
  	let s = window.history.state;
  	if (s.selector != undefined)
  		selCtrl.fill({selector: s.selector, path: s.path, title: s.title});
  }
});

$(document).ready(function() {
	simplemde = new SimpleMDE({
		element: $("#noteview textarea")[0],
		status: false,
		toolbar: false
	});
	waitCtrl.setState("on");
	notecase.getDir(function (data) {
		waitCtrl.setState("off");
		notecase.processFiles(data);
		selCtrl.fill({ selector: 0, path: "$ROOT", title: "Notecases Folders"});
		var newState = jQuery.extend(true, {selector: 0, path: "$ROOT", title: "Notecases Folders"}, window.history.state);
		window.history.replaceState(newState, "Notecases Folders");
	});

	
	$('#list-file > a').data('target','file');
	$(document).on('click', 'li.bf-selector a', function() {
		switch ($(this).data("note").tag) {
			case "folder": 
				selCtrl.$fill(this);
				break;;
			case "file": 
				noteViewCtrl.$fill($(this));
				break;;
		} 
	});

	$(document).on("click", "#note-edit", function() { noteViewCtrl.onEdit(); });
	$(document).on("click", "#note-view", function() { noteViewCtrl.onView(); });
	$(document).on("click", "#note-upload", function() { noteViewCtrl.onUpload() });
	$(document).on("click", ".nc-new-note", function() { selCtrl.onNewNote() });
	$(document).on("click", "#new-note .nc-ok", function() { selCtrl.onNewNoteCreate() });
});

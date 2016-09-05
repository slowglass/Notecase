
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
    this.root = { name: "", path_display: "", path_lower: "", tag: "folder" }
	this.token= "3wsLXh8GbvUAAAAAAAAUagzM6j17BZJjTrQXMewcgI5vVD-vR-kA02sMSe7m9CYd";
	this.debug= "";
	this.cursor= null;
	this.notesStore= new NoteMetadata(new NoteCache());
	this.attributes= new Map();
}

Notecase.prototype = {
    _make_listentry: function(lv, selector, key, name) {
        let md = this.notesStore.get_metadata(key);
        if (md == undefined) md=this.root;
        let li=$("<li class='bf-selector' />");
        lv.append(li);
        $(li).append(
            '<a href="#" data-direction="reverse">'+
            '<h2>'+name+'</h2>'+
            '</a>');
        li.find("a")
            .data("note", md)
            .data("selector", (selector+1)%2);
    },
	errorCallback: function() { alert("Cannot get data"); },

	processFiles: function(data) {
		var $$=this;
		// Error on has_more at the moment.
		if (data.has_more) alert("Error files bigger than intial download");

		this.cursor = data.cursor;
		$.each(data.entries, function(i,v) {
		    if ()
		    if (v[".tag"] == "deleted")
		       $$.removeNote(v);
		    else
		       $$.addNote(v);
		});

        localStorage.setItem("NODE_STORE", this.notesStore.serialise());
		localStorage.setItem("CURSOR", JSON.stringify(this.cursor));
	},

	fillList: function(selector, key) {
		var $$=this;
		var lv=$("#selector" + selector +" .listview");
		var items;
		items = $$.notesStore.get_folder_contents(key);
		lv.html("");
		if (key != "")
		    this._make_listentry(lv, selector, Utils.dirname(key), "Parent Folder");
		$.each(items, function(i,v) {
		   let name = (v.tag != "folder")
		    ? (Utils.basename(v.name) +  ((v.cache_integrity ? "" : " [CONFLICT]")))
		    : v.name
		   $$._make_listentry(lv, selector, v.path_lower, name);
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

	put: function(path, data, rev, successCB, errorCB) {
		var $$=this;
		var encodedData = new TextEncoder("utf-8").encode(data);
		var params = {
            "path": path,
            "autorename": true
        };

		 if (rev == NoteMetadata.NO_REV)
		    params.mode = "add";
		 else
		    params.mode = {
		        ".tag": "update",
		        "update": rev
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
			data: '{"path":"","recursive":true, "include_deleted": true, "include_media_info": true}',
			success: successCB,
			error: errorCB
		});
	},


	updateDir: function(successCB, errorCB) {
		var $$=this;
		if (errorCB==null) errorCB=this.errorCallback;
		$.ajax({
			url: "https://api.dropboxapi.com/2/files/list_folder/continue",
			headers: {
				"Authorization": "Bearer "+ $$.token
			},
			type: 'POST',
			dataType: 'json',
			contentType: 'application/json',
			processData: false,
			data: '{"cursor": "'+this.cursor+'"}'  ,
			success: successCB,
			error: errorCB
		});
	},


    // Add / Remove notes
	addNote: function(note) { return this.notesStore.add(note); },
	removeNote: function(note) { return this.notesStore.remove(note); },
    changeNoteStatus: function(key, status, integrity) {
        var md = this.notesStore.get_metadata(key);
        md.cache_status = status;
        md.cache_integrity = integrity;
    },
    // Search interface
    getByPath: function(p) { return this.notesStore.get_metadata(p); },

	// Storage Interface
	putInCache: function(key, data, status, changed) { return this.notesStore.putInCache(key, data, status, changed); },
	getFromCache: function(id) { return this.notesStore.getFromCache(id); },
	updateCache: function(key, field, value) { return this.notesStore.updateCache(key, field, value); },
	removeFromCache: function(id) { return this.notesStore.removeFromCache(id); }
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


function refreshData() {
    waitCtrl.setState("on");
	notecase.updateDir(function (data) {
		waitCtrl.setState("off");
		notecase.processFiles(data);
	});
}

$(document).ready(function() {
	simplemde = new SimpleMDE({
		element: $("#noteview textarea")[0],
		toolbar: [
		    "bold", "italic", "horizontal-rule",
		    "unordered-list", "ordered-list", "horizontal-rule", "quote"]
		/*,	status: false, toolbar: false */
	});

    let c = localStorage.getItem("CURSOR");
    if (c != undefined) notecase.cursor = JSON.parse(c);
    if (notecase.cursor != undefined)
        notecase.notesStore.deserialise(localStorage.getItem("NODE_STORE"));

	waitCtrl.setState("on");
	if (notecase.cursor  == undefined)
        notecase.getDir(function (data) {
            waitCtrl.setState("off");
            notecase.processFiles(data);
            selCtrl.fill({ selector: 0, path: Utils.root, title: "Notecases Folders"});
            var newState = jQuery.extend(true, {selector: 0, path: Utils.root, title: "Notecases Folders"}, window.history.state);
            window.history.replaceState(newState, "Notecases Folders");
        });
    else
        notecase.updateDir(function (data) {
            waitCtrl.setState("off");
            notecase.processFiles(data);
            selCtrl.fill({ selector: 0, path: Utils.root, title: "Notecases Folders"});
            var newState = jQuery.extend(true, {selector: 0, path: Utils.root, title: "Notecases Folders"}, window.history.state);
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
	$(document).on("submit", "#new-note form", function(e) { selCtrl.onNewNoteCreate(e); });
	$(document).on("click", "#note-up", function() { noteViewCtrl.onUp() });

	$(document).on("click", ".nc-refresh", function() { refreshData() });
	$(document).on("click", ".nc-reset", function() {
	    localStorage.clear();
	    navigator.app.exitApp();
	});
});

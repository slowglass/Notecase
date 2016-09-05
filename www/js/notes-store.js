/**
 * Note Cache stores the following information
 * Cache Key: path_lower
 * Cache Data:
 *     data: note contents
 *     rev:  revision of the note that this cache entry is based upon
 *     changed: true/false - true if the note has been edited since download
 */

var NoteCache = function() {
}

NoteCache.NEW = "new";

NoteCache.prototype = {
	_put: function(key, obj) {
		let s = JSON.stringify(obj);
		localStorage.setItem(key, s);
	},
	put: function(key, data, rev, changed) {
		let obj = { data: data, rev: rev, changed: changed };
		this._put(key, obj)
	},
	get: function(key) {
		let s = localStorage.getItem(key);
		return JSON.parse(s);
	},
	update: function(key, field, value) {
		let obj = this.get(key);
		obj[field] = value;
		this._put(key, obj)
	},
    remove: function(key) {
        localStorage.removeItem(key);
    }
}

/**
 * NoteMetadata stores
 * Metadata Key : path_lower
 * Metadata Data:
 *     id: Dropbox id (may be blank) - may not be used
 *     path_lower: redundant - may not be used
 *     path_display
 *     rev: last revision we know of in dropbox
 *          this may well not match the version in the cache
 *          for new notes this will be "NEW"
 *     cache_status: One of
 *          new
 *          missing
 *          current
 *          behind
 *          local
 *     cache_integrity: true/false - false if cache_status is new/local and cache.rev != metadata.rev
 */


var NoteMetadata = function(cache_store) {
    this.cache_store = cache_store;
    this.md_store = {};
    this.folder_map = {};
}

NoteMetadata.NEW = "new";
NoteMetadata.MISSING = "missing";
NoteMetadata.CURRENT = "current";
NoteMetadata.BEHIND = "behind";
NoteMetadata.LOCAL = "local";
NoteMetadata.NO_REV = "no revision";

NoteMetadata.sort_by_name = function(v1,v2) {
    let n1 = v1.name.toLowerCase();
    let n2 = v2.name.toLowerCase();
    if (n1 < n2) return -1;
    else if (n1 > n2) return  1;
    return 0;
};
NoteMetadata.prototype = {
    _md_copy: function(note) {
       return { id: note.id,  rev: note.rev, tag: note[".tag"],
          name: note.name,
          path_lower: note.path_lower, path_display: note.path_display }
    },
    _set_cache_status(md, s, i) {
    	md.cache_status = s;
    	md.cache_integrity = i;
    	return md;
    },
    _check_cache: function(k, md) {
    	var ci = this.cache_store.get(k);
    	if (ci == undefined) return this._set_cache_status(md, NoteMetadata.MISSING, true);
    	if (md.rev == ci.rev)
    	{
    		if (ci.changed) return this._set_cache_status(md, NoteMetadata.LOCAL, true);
    		else return this._set_cache_status(md, NoteMetadata.CURRENT, true);
    	}

    	if (!ci.changed) return this._set_cache_status(md, NoteMetadata.BEHIND, true);

    	if (ci.rev == NoteCache.NEW) return this._set_cache_status(md, NoteMetadata.NEW, false);
    	else return this._set_cache_status(md, NoteMetadata.LOCAL, false);
    },
    _add_path_link(k) {
    	let p = k.substring(0, k.lastIndexOf('/'));
		if (this.folder_map[p] == undefined) this.folder_map[p] = new Set();
		this.folder_map[p].add(k);
    },
    _remove_path_link(k) {
    	let p = k.substring(0, k.lastIndexOf('/'));
		this.folder_map[p].delete(k);
    },
	add: function(note) {
	    if (note.name.startsWith(".")) return;
		let k = note.path_lower
		let md = this.md_store[k];
		let newMd = this._md_copy(note);
		this.md_store[k] = newMd;
		this._check_cache(k, newMd);
        this._add_path_link(k);
	},
	remove: function(note) {
		let k = note.path_lower
		let md = this.md_store[k];
		if (md == undefined) return;
		if (md.cache_integrity)
		{
			this._remove_path_link(k);
			delete this.md_store[k];
			this.cache_store.remove(k);
		}
	},

    serialise: function() {
        var obj = {
            md_store: this.md_store,
        };
        return JSON.stringify(obj);

    },

    deserialise: function(str) {
        var $$=this;
        var obj = JSON.parse(str);
        this.md_store = obj.md_store;
        $.each(this.md_store, function(k) {
            $$._add_path_link(k);
        });
    },
    /********************************************************************
     * MetaData Interface
     *******************************************************************/
    get_metadata: function(k) { return this.md_store[k]; },
    get_folder_contents: function(k) {
		let list = [];
		let items = this.folder_map[k];
		if (items == undefined) return list;
		items.forEach(function(p) {
			let md=this.md_store[p];
			list.push(md);
		}, this);
		list.sort(NoteMetadata.sort_by_name);
		return list;
	},
	/********************************************************************
	 * NoteCache Interface
	 *******************************************************************/
    putInCache:      function(k,d,r,c) { return this.cache_store.put(k,d,r,c); },
    getFromCache:    function(k)       { return this.cache_store.get(k); },
    updateCache:     function(k,f,v)   { return this.cache_store.update(k,f,v); },
    removeFromCache: function(k)       { return this.cache_store.remove(k); }
}

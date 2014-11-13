
(function ($, undefined) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "Editors": {
        "Combo": ComboEditor,
        "Autocomplete": ComboEditor
      }
    }
  });

  function ComboEditor(args) {
    var self = this,
        cache = {};

    this._field = null;
    this._hidden = null;
    this._closed = true;
    this._activated = false;
    this._args = args;
    this._copy = false;

    this.init = function() {
      self._copy = (args.item === undefined || args.item === null);
      self._cache();
      self._field = $(document.createElement("input"))
        .attr({type: "text"}).addClass("editor-text")
        .appendTo(args.container)
        .bind("keydown", self._keyDown)
        .focus().select();
      self._field
        .autocomplete(self._autocompleteConstructor())
        .data("ui-autocomplete")._renderItem = function(ul, item) {
          var re = new RegExp(("{0}").format(self._field.data("ui-autocomplete").term), "i"),
              func = function(match) { return ("<strong><u>{0}</u></strong>").format(match); };
          return $(document.createElement("li"))
            .data("item.autocomplete", item)
            .append($("<a>").html((item.name || "").replace(re, func)))
            .appendTo(ul);
        };
      self._field.bind("keyup blur", function(e) {
        if (!$(this).val()) {
          self._hidden.val("");
        } else {
          cache.gaci[args.column.field] = $(this).val();
        }
      }).bind("blur", function(e) {
        if (self._hidden.val() === "" || self._hidden.val() == "0") {
          if (!(!!args.column.editorOptions.allowNew)) {
            $(this).val("");
          }
        }
      }).bind("mouseup", function(e) {
        // fixing the problem caused by onmouseup event that the selection gets unselected sometimes
        // thanks to http://stackoverflow.com/questions/1269722
        // i love stack overflow :D
        e.preventDefault();
      });
      self._hidden = $(document.createElement("input")).attr("type", "hidden").appendTo(args.container);
      self._closed = true;
      self._activated = false;
    };

    this.destroy = function() {
      self._field.unbind("keydown");
      self._field.unbind("keyup");
      self._field.unbind("blur");
      self._field.unbind("mouseup");
      self._field.remove();
      self._hidden.remove();
      $(args.container).empty();
      self._closed = true;
      self._activated = false;
    };

    this._cache = function() {
      cache.xhr = null;
      cache.gfc = false;
      cache.gac = (cache.gac === undefined) ? {} : cache.gac;
      cache.gaci = (cache.gaci === undefined) ? {} : cache.gaci;
      cache.gaci[args.column.field] = (
        self._copy ||
        args.item[args.column.field] === undefined ||
        args.item[args.column.field] === null
      ) ? "" : args.item[args.column.field].displayName;
    };

    this._keyDown = function(e) {
      switch (e.keyCode) {
        case 38:
        case 40: e.stopPropagation(); break;
        case 37:
        case 39: e.stopImmediatePropagation(); break;
        default: break;
      }
    };

    this._autocompleteConstructor = function() {
      return {
        minLength: 3,
        delay: 200,
        source: function(request, response) {
          var term = request.term,
              src = self._getCacheId(),
              bg = self._field.css("background-color");
          request.SearchSubstring = term;
          delete request.term;
          if (!(src in cache.gac)) {
            cache.gac[src] = {};
          }
          if (term in cache.gac[src]) {
            response(cache.gac[src][term].data);
            return;
          }
          if (cache.xhr !== null) {
            cache.xhr.abort();
          }
          cache.xhr = NGES.Core.Abstract.xhr({
            method: "GET",
            url: args.column.editorOptions.url,
            data: request,
            scope: self,
            timeout: 20000,
            beforeSend: function() {
              self._field.css(
                "background", ("{0} url(/img/spinner-combo-gray.gif) no-repeat center right").format(bg || "")
              );
            },
            always: function() {
              self._field.css("background-image", "none").css("background-color", bg);
            },
            done: function(data) {
              cache.gac[src][term] = data;
              response(data.data);
              cache.xhr = null;
            }
          });
        },
        focus: function(event, ui) {
          return false;
        },
        select: function(event, ui) {
          self._hidden.val(ui.item.id);
          self._field.val(ui.item.name);
          // not selected by hitting enter key
          if (event.which != 13) {
            args.commitChanges();
          }
          return false;
        },
        open: function(event, ui) {
          self._closed = false;
          $(args.grid.getCanvasNode()).unbind("keydown.slickgrid");
          self._hidden.val("");
          self._field.bind("keydown.slickgrid", self._handleKeyDownActivation);
        },
        close: function(event, ui) {
          if (self._hidden.val() !== "") {
            self._closed = true;
            self._activateKeys();
          }
        }
      };
    };

    this._getCacheId = function() {
      return args.column.editorOptions.url;
    };

    this._activateKeys = function() {
      if (!self._activated) {
        $(args.grid.getCanvasNode()).bind("keydown.slickgrid", args.handleKeyDown);
        self._activated = true;
      }
    };

    this._handleKeyDownActivation = function(e) {
      if ($.inArray(e.keyCode, [13, 9]) != -1 && self._closed) {
        self._activateKeys();
      }
    };

    this.focus = function() {
      self._field.focus();
    };

    this.serializeValue = function() {
      return self._copy ? self._field.val() : {
        displayName: self._field.val(),
        hiddenId: self._hidden.val()
      };
    };

    this.applyValue = function(item, state) {
      item[args.column.editorOptions.fields.hidden] = state.hiddenId;
      item[args.column.editorOptions.fields.display] = state.displayName;
    };

    this.loadValue = function(item) {
      var hiddenId, displayName;
      if (item[args.column.field] === undefined || item[args.column.field] === null) {
        hiddenId = "";
        displayName = "";
      } else {
        hiddenId = item[args.column.editorOptions.fields.hidden];
        displayName = item[args.column.editorOptions.fields.display];
      }
      self._field.val(displayName);
      self._hidden.val(hiddenId);
      self._field.select();
    };

    this.isValueChanged = function() {
      return (
        args.item[args.column.field] === undefined ||
        args.item[args.column.field] === null
      ) ? true : (
        args.item[args.column.editorOptions.fields.hidden] != self._hidden.val() ||
        args.item[args.column.editorOptions.fields.display] != self._field.val()
      );
    };

    this.validate = function() {
      return {valid: true, msg: null};
    };

    this.init();
  }
})(jQuery);


(function ($, N) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "Editors": {
        "Dropdown": DropdownEditor
      }
    }
  });

  function DropdownEditor(args) {
    var self = this;

    this.container = null;
    this.dropdown = null;
    this.fields = {id: args.column.field, name: args.column.field};
    this.copy = false;

    this.init = function() {
      if (!("editorOptions" in args.column)) {
        throw new Error("Attribute [editorOptions] is required in Grid config for [Dropdown] editor.");
      }
      self.copy = (args.item === undefined || args.item === null);
      if (args.column.editorOptions.fields) {
        self.fields.id = args.column.editorOptions.fields.id || args.column.field;
        self.fields.name = args.column.editorOptions.fields.name || args.column.field;
      }
      self.container = $(args.container);
      self.dropdown = $(document.createElement("select"))
        .appendTo(args.container)
        .width(self.container.width())
        .height(self.container.height() - 2)
        .css("padding", "0")
        .on("change", function() {
          args.commitChanges();
        })
        .data("defaultValue", (
          (args.item && args.item[self.fields.id]) ? args.item[self.fields.id] : ""
        ));
      N.Widget.Factory.dropdown(
        self.dropdown,
        args.column.editorOptions.configs || {},
        args.column.editorOptions.extras || {}
      );
    };

    this.destroy = function() {
      self.dropdown.off();
      delete self.container;
      delete self.dropdown;
    };

    this.focus = function() {
      self.dropdown.focus();
    };

    this.serializeValue = function() {
      return self.copy ? self.dropdown.find("option:selected").text() : {
        id: self.dropdown.val(),
        name: self.dropdown.find("option:selected").text()
      };
    };

    this.applyValue = function(item, state) {
      item[self.fields.id] = state.id;
      item[self.fields.name] = state.name;
    };

    this.loadValue = function(item) {
      if (typeof item[self.fields.id] != "undefined") {
        self.dropdown.val(item[self.fields.id]);
      }
      self.dropdown.focus();
      self.dropdown.on("keydown.slickgrid", function(e) {
        if (e.keyCode == 38 || e.keyCode == 40) {
          e.stopImmediatePropagation();
        }
      });
    };

    this.isValueChanged = function() {
      return (typeof args.item[self.fields.id] == "undefined") ?
        true : (args.item[self.fields.id] != self.dropdown.val());
    };

    this.validate = function() {
      return {valid: true, msg: null};
    };

    this.init();
  }
})(jQuery, NGES);

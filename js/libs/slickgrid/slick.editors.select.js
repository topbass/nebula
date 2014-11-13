
(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "Editors": {
        "Select": SelectEditor
      }
    }
  });

  function SelectEditor(args) {
    var self = this;

    this.container = null;
    this.select = null;
    this.options = {};
    this["default"] = "";

    this.init = function() {
      if (!("editorOptions" in args.column)) {
        throw new Error("Attribute [editorOptions] is required in Grid config for [Select] editor.");
      }
      self.container = $(args.container);
      self.options = args.column.editorOptions.options || {};
      self["default"] = args.column.editorOptions["default"] || "";
      self.select = $("<select/>").appendTo(args.container)
        .width(self.container.width())
        .height(self.container.height() - 2)
        .css("padding", "0")
        .on("change", function() {
          args.commitChanges();
        });
      $.each(self.options, function(value, text) {
        self.select.append($("<option/>").prop("value", value).text(text));
      });
      if (self["default"]) {
        self.select.val(self["default"]);
      }
    };

    this.destroy = function() {
      self.select.off();
      delete self.container;
      delete self.options;
      delete self.select;
    };

    this.focus = function() {
      self.select.focus();
    };

    this.serializeValue = function() {
      return self.select.val();
    };

    this.applyValue = function(item, state) {
      item[args.column.field] = state;
    };

    this.loadValue = function(item) {
      if (typeof item[args.column.field] != "undefined") {
        self.select.val(item[args.column.field]);
      }
      self.select.focus();
      self.select.on("keydown.slickgrid", function(e) {
        if (e.keyCode == 38 || e.keyCode == 40) {
          e.stopImmediatePropagation();
        }
      });
    };

    this.isValueChanged = function() {
      return (typeof args.item[args.column.field] == "undefined") ?
        true : (args.item[args.column.field] != self.select.val());
    };

    this.validate = function() {
      return {valid: true, msg: null};
    };

    this.init();
  }
})(jQuery);

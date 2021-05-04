

var disDigitize;
var selectFeatClicked = false;
var digitizetb, digitizeEdittb;
var digitizePolygonSelect;
var digitizeLineSelect;
var digitizePointSelect;
var digitizeEditGrafic;
class DigitizeFeature {
  constructor(divId, map, attributeDiv) {
    this.divId = divId;
    this.map = map;
    this.attrDiv = attributeDiv;
    disDigitize = this;
    disDigitize.createDigitizeBtns();
    disDigitize.layerAdded();
    disDigitize.layerRemove();
    disDigitize.initializeDrawTool();
  }

  createDigitizeBtns() {
    var elems = `
      <div class="digitize-btn-container">
        <button id="digitize-feat-select" title="Select Feature" class="digitize-buttons">
          <img src="images/select_feature.png" alt="Select Feature">
        </button>
        <button id="digitize-feat-insert" title="Insert Feature" class="digitize-buttons">
        <i class="fas fa-plus-circle"></i>
        </button>
        <!-- <button id="digitize-feat-update" title="Update Feature" class="digitize-buttons" disabled>
          <i class="fas fa-marker"></i>
        </button> -->
        <button id="digitize-feat-delete" title="Delete Feature" class="digitize-buttons" disabled>
          <i class="fas fa-trash-alt"></i>
        </button>
        <button id="digitize-feat-clear" title="Clear selected Feature" class="digitize-buttons">
          <i class="fas fa-times-circle"></i>
        </button>
      </div>
      <div class="digitize-layer-container"></div>
    `;
    $("#" + disDigitize.divId).append(elems);
    disDigitize.bindButtonsEvents();
  }

  bindButtonsEvents() {
    disDigitize.map.on("click", disDigitize.mapKlik);
    $("#digitize-feat-select").click(disDigitize.selectFeatureKlik)
    $("#digitize-feat-insert").click(disDigitize.insertFeatureKlik)
    // $("#digitize-feat-update").click(disDigitize.updateFeatureKlik)
    $("#digitize-feat-delete").click(disDigitize.deleteFeatureKlik)
    $("#digitize-feat-clear").click(disDigitize.clearFeatureKlik)
  }

  layerAdded() {
    disDigitize.map.on("layer-add-result", function (evt) {
      if (!evt.layer) {
        alertify.error("Couldn't find added layer");
        return;
      }

      var capabilities = evt.layer.capabilities
      if (!capabilities)
        return;

      if (capabilities.indexOf("Create") == -1 ||
        capabilities.indexOf("Update") == -1 ||
        capabilities.indexOf("Delete") == -1)
        return;

      disDigitize.addFeatureLayer(evt.layer);
    });
  }

  layerRemove() {
    disDigitize.map.on("layer-remove", function(evt) {
      var layerid = evt.layer.id;
      $(".digitize-single-layer input[name='digitizeLayers']").each(function(ind) {
        var currentItem = $(this).val();
        if(layerid == currentItem) 
          $(this).parent().remove();
      })
    });
  }

  initializeDrawTool() {
    require([
      "esri/Color",
      "esri/toolbars/draw",
      "esri/toolbars/edit",
      "esri/symbols/SimpleFillSymbol",
      "esri/symbols/SimpleLineSymbol",
      "esri/symbols/SimpleMarkerSymbol"
    ], function (Color, Draw, Edit,
      SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol) {
      digitizetb = new Draw(disDigitize.map);
      digitizetb.on("draw-end", disDigitize.addNewFeatureOnMap);
      digitizeEdittb = new Edit(disDigitize.map);
      digitizeEdittb.on("graphic-move-stop", disDigitize.setEditGraphic)
      digitizeEdittb.on("rotate-stop", disDigitize.setEditGraphic)
      digitizeEdittb.on( "scale-stop", disDigitize.setEditGraphic)
      digitizeEdittb.on( "vertex-move-stop", disDigitize.setEditGraphic)
      digitizePolygonSelect = new SimpleFillSymbol(
        "solid",
        new SimpleLineSymbol("solid", new Color([232, 104, 80]), 2),
        new Color([232, 104, 80, 0.15])
      );
      digitizePointSelect = new SimpleMarkerSymbol(
        "solid", 15, null,
        new Color([238, 69, 0, 0.5])
      );
      digitizeLineSelect = new SimpleLineSymbol(
        "solid",
        new Color([232, 104, 80]), 2)
    });
  }

  addNewFeatureOnMap(evt) {
    disDigitize.map.disableSnapping();
    digitizetb.deactivate();
    console.log(evt);
    var geomtype = disDigitize.getGeometryType(evt.geometry);
    var symbol = disDigitize.getSymbology(geomtype);
    var graf = disDigitize.createGraphic(evt.geometry, symbol);
    disDigitize.map.graphics.add(graf);
    var attrs = disDigitize.getLayerAttributes();
    disDigitize.createAttributeTable(attrs)
  }

  getLayerAttributes() {
    var layer = disDigitize.getSelectedLayer()
    if(!layer)
      return {};
    
    var fields = layer.fields;
    var attr = {}
    fields.forEach(function(afld) {
      attr[afld.name] = null;
    });
    return attr;
  }

  getGeometryType(geom) {
    var geomtype;
    if (geom.rings) {
      geomtype = "polygon"
    } else if (geom.paths) {
      geomtype = "line"
    } else if (geom.x) {
      geomtype = "point"
    }
    return geomtype;
  }

  getSymbology(geomtype) {
    var sym;
    switch(geomtype) {
      case "point":
        sym = digitizePointSelect
        break;
      case "line":
        sym = digitizeLineSelect
        break;
      case "polygon":
        sym = digitizePolygonSelect
        break;
    }
    return sym;
  }

  setEditGraphic(evt) {
    digitizeEditGrafic = evt.graphic.geometry;
  }

  addFeatureLayer(lay) {
    var lyname = lay.name;
    var checked = "checked";
    if ($(".digitize-layer-container .digitize-single-layer").length) {
      checked = "";
    }
    var singleLayer = `
    <div class="digitize-single-layer">
      <input type="radio" name="digitizeLayers" `+ checked + ` value="` + lyname + `">
      <label for="`+ lyname + `">` + lyname + `</label>
    </div>
    `;
    $(".digitize-layer-container").append(singleLayer);
    disDigitize.unbindRadioClicks();
    disDigitize.bindRadioClicks();
  }

  unbindRadioClicks() {
    $(".digitize-single-layer input[name='digitizeLayers']").unbind("click");
  }

  bindRadioClicks() {
    $(".digitize-single-layer input[name='digitizeLayers']").click(function () {
      var layername = $(this).val();
      var layer = disDigitize.map.getLayer(layername);
      var ext = layer.fullExtent;
      if (ext)
        disDigitize.map.setExtent(ext);
    });
  }

  mapKlik(evt) {
    if (!evt.graphic || !selectFeatClicked) {
      return;
    }
    selectFeatClicked = false;
    digitizetb.deactivate();
    $(".digitize-single-layer input[name='digitizeLayers']").prop("disabled", false);
    // disDigitize.map.graphics.clear();
    var selectedLayer = $('.digitize-single-layer input[name="digitizeLayers"]:checked').val();
    var selectedGraficLayer = evt.graphic._graphicsLayer.id;
    if (selectedLayer != selectedGraficLayer)
      return;
    var graf = evt.graphic;
    digitizeEditGrafic = evt.graphic.geometry;
    $(".esriPopup").hide();
    var geomtype;
    if (graf.geometry.rings) {
      // var graphiccreated = disDigitize.createGraphic(graf.geometry, digitizePolygonSelect, graf.attributes)
      geomtype = "polygon"
    } else if (graf.geometry.paths) {
      // var graphiccreated = disDigitize.createGraphic(graf.geometry, digitizeLineSelect, graf.attributes)
      geomtype = "line"
      // disDigitize.enableEditTB("line", graf);
    } else if (graf.geometry.x) {
      // var graphiccreated = disDigitize.createGraphic(graf.geometry, digitizePointSelect, graf.attributes)
      geomtype = "point"
      // disDigitize.enableEditTB("point", graf);
    }
    // disDigitize.map.graphics.add(graphiccreated);
    disDigitize.enableEditTB(geomtype, graf);
    $("#digitize-feat-delete").prop("disabled", false);
    disDigitize.createAttributeTable(graf.attributes);
  }

  enableEditTB(geom, graf) {
    require(["esri/toolbars/edit"], function (Edit) {
      switch (geom) {
        case "point":
          digitizeEdittb.activate(Edit.MOVE | Edit.SCALE, graf);
          break;
        case "line":
          digitizeEdittb.activate(Edit.EDIT_VERTICES | Edit.MOVE | Edit.ROTATE | Edit.SCALE, graf, {
            "allowAddVertices": true,
            "allowDeleteVertices": true
          });
          break;
        case "polygon":
          digitizeEdittb.activate(Edit.EDIT_VERTICES | Edit.MOVE | Edit.ROTATE | Edit.SCALE, graf, {
            "allowAddVertices": true,
            "allowDeleteVertices": true
          });
          break;
      }
    });
  }

  createAttributeTable(attrs) {
    var tobeignored = ["FID", "Shape__Area", "Shape__Length", "AREA"];
    var selectedLayer = $('.digitize-single-layer input[name="digitizeLayers"]:checked').val();
    $("#" + disDigitize.attrDiv).empty();
    $("#" + disDigitize.attrDiv).show();
    var attrHeader = `
    <div class="digitize-attr-header">
      <span>`+ selectedLayer + `</span>
      <div class="digitize-attr-close">
        <i class="fas fa-times"></i>
      </div>
    </div>
    <div class="digitize-attr-body"></div>
    `;
    $("#" + disDigitize.attrDiv).append(attrHeader);
    Object.keys(attrs).forEach(function (akey) {
      if (tobeignored.indexOf(akey) >= 0)
        return;

      var labelStyle = "style='display: none;'"
      if (akey != "OBJECTID")
        labelStyle = "";
      var attributeBody = `
      <label for="`+ akey + `" ` + labelStyle + `>
        <span>`+ akey + ` 
          <span class="required">*</span>
        </span>
        <input type="text" class="input-field" name="`+ akey + `" value="` + attrs[akey] + `" />
      </label>
      `;
      $(".digitize-attr-body").append(attributeBody);
    });
    $(".digitize-attr-body").append(`
    <div class="digitize-attr-btn-container">
      <button id="digitize-attr-update"> 
        <i class="fas fa-spinner fa-spin"></i>
      Save </button>
    </div>
    `);

    $(".digitize-attr-close").unbind("click");
    $("#digitize-attr-update").unbind("click");
    $(".digitize-attr-close").click(function () {
      disDigitize.clearFeatureKlik();
    });
    $("#digitize-attr-update").click(function () {
      disDigitize.updateFeatureAttributes()
    });
  }

  updateFeatureAttributes() {
    $("#digitize-attr-update svg").show();
    if($(".digitize-attr-body label input[name='OBJECTID']").val() == "null")  {
      disDigitize.doApplyEdits("insert");
    } else {
      disDigitize.doApplyEdits("update");
    }
  }

  doApplyEdits(hint) {
    require([
      "esri/graphic"
    ], function (Graphic) {
      var grafic = new Graphic();
      var attributes = disDigitize.getDigitizeAttributes()
      grafic.setAttributes(attributes);
      grafic.setGeometry(digitizeEditGrafic);
      var layer = disDigitize.getSelectedLayer();
      if(hint == "update") {
        var aein = {
          update: [grafic],
          delete: null,
          insert: null
        }
      } else if(hint == "delete") {
        var aein = {
          update: null,
          delete: [grafic],
          insert: null
        }
      } else {
        var aein = {
          update: null,
          delete: null,
          insert: [grafic]
        }
      }
      if (layer) {
        layer.applyEdits(aein.insert, aein.update, aein.delete, function (res) {
          alertify.success("Attributes updated successfully");
          disDigitize.clearFeatureKlik();
          var layer = disDigitize.getSelectedLayer();
          disDigitize.map.removeLayer(layer);
          disDigitize.map.addLayer(layer);
        }, function () {
          alertify.error("Failed to update attributes");
        })
      }
    });
  }

  getSelectedLayer() {
    var selectedLayer = $('.digitize-single-layer input[name="digitizeLayers"]:checked').val();
    var layer = disDigitize.map.getLayer(selectedLayer);
    return layer;
  }

  getDigitizeAttributes() {
    var selectedLayer = $('.digitize-single-layer input[name="digitizeLayers"]:checked').val();
    var layer = disDigitize.map.getLayer(selectedLayer);
    var fields = layer.fields;
    var attr = {}
    $(".digitize-attr-body label input").each(function () {
      var key = $(this).attr("name");
      var val = disDigitize.getAttrVal($(this).val(), key, fields);
      attr[key] = val;
    });
    return attr;
  }

  getAttrVal(val, key, fields) {
    var tobereturned;
    var matchedObj = fields.filter(function (item) {
      return item.name == key;
    });
    switch (matchedObj[0].type) {
      case "esriFieldTypeOID":
        tobereturned = parseInt(val);
        break;
      case "esriFieldTypeString":
        tobereturned = val;
        break;
      case "esriFieldTypeSingle":
        tobereturned = parseFloat(val);
        break;
      case "esriFieldTypeInteger":
        tobereturned = parseInt(val);
        break;
      case "esriFieldTypeDouble":
        tobereturned = parseFloat(val);
        break;
    }
    return tobereturned;
  }

  createGraphic(geom, sym, attr) {
    var grafic;
    require([
      "esri/graphic"
    ], function (Graphic) {
      grafic = new Graphic(geom, sym, attr);
    });
    return grafic;
  }

  selectFeatureKlik() {
    selectFeatClicked = true;
    digitizetb.activate("point");
    $("#digitize-feat-delete").prop("disabled", true);
    $(digitizetb._tooltip).text("Select a feature");
    $(".digitize-single-layer input[name='digitizeLayers']").prop("disabled", true);
  }

  clearFeatureKlik() {
    disDigitize.map.graphics.clear();
    $("#digitize-feat-delete").prop("disabled", true)
    $("#" + disDigitize.attrDiv).hide();
    digitizeEdittb.deactivate();
    digitizetb.deactivate();
  }

  deleteFeatureKlik() {
    disDigitize.doApplyEdits("delete");
  }

  insertFeatureKlik() {
    var layer = disDigitize.getSelectedLayer();
    var layerGeom = layer.geometryType;
    disDigitize.map.enableSnapping()
    switch(layerGeom) {
      case "esriGeometryPolygon":
        digitizetb.activate("polygon")
        break;
      case "esriGeometryPoint":
        digitizetb.activate("point")
        break;
      case "esriGeometryPolyline":
        digitizetb.activate("polyline")
        break;
    }
  }
}
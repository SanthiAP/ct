/**
 * Class to create add data divs and do its functionality
 * @requires JQuery, Font Awesome, AddData.css
 * @author SanthiAP
 * @date   17-04-2021
 */
var dis;
class AddData {
  constructor(divId, map) {
    this.divId = divId;
    this.map = map;
    dis = this;
    this.createInput();
    this.bindOnchange();
  }

  createInput() {
    var inputDiv = `<div class="adddata-overall">
                      <div class="add-data-container">
                        <div class="add-data-file-drop-area">
                          <span class="add-data-fake-btn">Choose files</span>
                          <span class="add-data-file-msg">or drag and drop files here</span>
                          <input id="add-data-file-input" class="add-data-file-input" type="file" accept=".zip, .csv, .kml">
                        </div>
                        <button class="clear-add-data-selection"> Clear </button>
                      </div>
                      <div class="ad-layer-container"></div>
                    </div>`;
    $("#" + this.divId).append(inputDiv);
  }

  bindOnchange() {
    $("#" + this.divId + " input").change(dis.inputOnchange);
    $(".clear-add-data-selection").click(dis.clearOnchange);
  }

  inputOnchange() {
    var selectedFile = $(this)[0].files[0];
    if (!selectedFile)
      return;
    $(".add-data-file-msg").text(selectedFile.name);
    var splitedfilename = $(this)[0].files[0].name.split(".")
    var fileType = splitedfilename[splitedfilename.length - 1];
    splitedfilename.splice(-1, 1);
    var layerName = splitedfilename.join('.');

    var reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = function () {
      switch (fileType) {
        case "csv":
          dis.loadCSV(reader.result, layerName);
          break;
        default:

      }
    }

    reader.onerror = function (error) {
      console.log('Error: ', error);
    }
  }

  clearOnchange() {
    $(".add-data-file-msg").text("or drag and drop files here");
  }

  loadCSV(file, layname) {
    require([
      "esri/layers/CSVLayer",
      "esri/Color",
      "esri/symbols/SimpleMarkerSymbol",
      "esri/renderers/SimpleRenderer",
      "esri/InfoTemplate",
      "esri/config",
      "dojo/domReady!"
    ], function (
      CSVLayer, Color, SimpleMarkerSymbol, SimpleRenderer, InfoTemplate, esriConfig
    ) {

      var csvlayer = new CSVLayer(file, {
        id: layname,
        name: layname
      });
      dis.map.addLayer(csvlayer);
      $(".ad-layer-container").append(`
      <div class="ad-alayer">
        <a href="#">`+ layname +`</a>
        <div class="ad-tools">
          <div class="ad-zoomto">
            <i class="fas fa-eye"></i>
          </div>
          <div class="ad-remove">
            <i class="fas fa-trash"></i>
          </div>
        </div>
      </div>`);

      dis.unbindLayerTools();
      dis.bindLayerTools();
    });
  }

  unbindLayerTools() {
    $(".ad-zoomto").unbind("click");
    $(".ad-remove").unbind("click");
  }

  bindLayerTools() {
    $(".ad-zoomto").click(function() {
      var layerid = $(this).parent().parent().children('a').text();
      var layer = dis.map.getLayer(layerid);
      if(layer.fullExtent)
        dis.map.setExtent(layer.fullExtent);
    });
    $(".ad-remove").click(function () {
      var layerid = $(this).parent().parent().children('a').text();
      var layer = dis.map.getLayer(layerid);
      if(layer) {
        dis.map.removeLayer(layer);
        $(this).parent().parent().remove();
        alertify.success("Layer removed successfully")
      }
    });
  }
}
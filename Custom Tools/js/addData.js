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
                      <div class="ad-various-inputs">
                        <div class="add-data-container">
                          <div class="add-data-file-drop-area">
                            <span class="add-data-fake-btn">Choose files</span>
                            <span class="add-data-file-msg">or drag and drop files here</span>
                            <input id="add-data-file-input" class="add-data-file-input" type="file" accept=".zip, .csv, .kml">
                          </div>
                          <button class="clear-add-data-selection"> Clear </button>
                        </div>
                        <div class="ad-or-container">OR</div>
                        <div class="ad-url-inp-container">
                          <input class="ad-url-input" type="text" value="" placeholder="Enter Layer Url..">
                          <button class="ad-url-add">Add</button>
                        </div>
                      </div>
                      <div class="ad-layer-container"></div>
                    </div>`;
    $("#" + this.divId).append(inputDiv);
  }

  bindOnchange() {
    $("#add-data-file-input").change(dis.inputOnchange);
    $(".clear-add-data-selection").click(dis.clearOnchange);
  }

  inputOnchange() {
    var selectedFile = $(this)[0].files[0];
    if (!selectedFile)
      return;
    $(".add-data-file-msg").text(selectedFile.name);
    var splitedfilename = selectedFile.name.split(".")
    var fileType = splitedfilename[splitedfilename.length - 1];
    splitedfilename.splice(-1, 1);
    var layerName = splitedfilename.join('.');
    $("#add-data-file-input").val("");

    var reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = function (content) {
      switch (fileType) {
        case "csv":
          dis.loadCSV(reader.result, layerName, selectedFile);
          break;
        default:

      }
    }

    reader.onerror = function (error) {
      console.log('Error: ', error);
    }
  }

  clearOnchange() {
    $("#add-data-file-input").val("");
    $(".add-data-file-msg").text("or drag and drop files here");
  }

  loadCSV(file, layname, selectedFile) {
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
      var reader = new FileReader();
      reader.readAsText(selectedFile);
      reader.onload = function (results) {
        var csvContent = results.target.result.split(",");
        if(csvContent.indexOf("latitude") < 0 &&
        csvContent.indexOf("lat") < 0 ) {
          alertify.error("Only point layer can be added using CSV file. There is no latitude, longitude in given file.");
          return;
        }
        var csvlayer = new CSVLayer(file, {
          id: layname,
          name: layname
        });
        var orangeRed = new Color(dis.getRandomColor()); // hex is #ff4500
        var marker = new SimpleMarkerSymbol("solid", 15, null, orangeRed);
        var renderer = new SimpleRenderer(marker);
        csvlayer.setRenderer(renderer);
        dis.map.addLayer(csvlayer);
        $(".ad-layer-container").append(`
          <div class="ad-alayer">
            <div class="ad-layer-name-container">
              <input class="ad-layer-visibility" type="checkbox" name="`+ layname +`" checked>
              <i class="fas fa-spinner fa-spin"></i>
              <a for=`+ layname +` href="#">`+ layname + `</a>
            </div>
            <div class="ad-tools">
              <div class="ad-zoomto" title="View Layer">
                <i class="fas fa-eye"></i>
              </div>
              <div class="ad-remove" title="Remove Layer">
                <i class="fas fa-trash"></i>
              </div>
            </div>
          </div>`);
        dis.unbindLayerTools();
        dis.bindLayerTools();
        $(".ad-layer-name-container input[name='ppr_tennis_courts'").parent().parent().children('.ad-tools').children('.ad-zoomto').trigger("click");
      }

    });
  }

  unbindLayerTools() {
    $(".ad-zoomto").unbind("click");
    $(".ad-remove").unbind("click");
    $(".ad-layer-visibility").unbind("click");
  }

  bindLayerTools() {
    $(".ad-zoomto").click(function () {
      $(".ad-alayer .fa-spinner").show();
      var layerid = $(this).parent().parent().find('a').text();
      var layer = dis.map.getLayer(layerid);
      if (layer && layer.fullExtent) {
        $(".ad-alayer .fa-spinner").hide();
        dis.map.setExtent(layer.fullExtent);
      } else {
        $(".ad-alayer .fa-spinner").hide();
      }
    });
    $(".ad-remove").click(function () {
      $(".ad-alayer .fa-spinner").show();
      var layerid = $(this).parent().parent().find('a').text();
      var layer = dis.map.getLayer(layerid);
      if (layer) {
        dis.map.removeLayer(layer);
        $(this).parent().parent().remove();
        alertify.success("Layer removed successfully")
        $(".ad-alayer .fa-spinner").hide();
      } else {
        $(".ad-alayer .fa-spinner").hide();
      }
    });
    $(".ad-layer-visibility").click(function() {
      $(".ad-alayer .fa-spinner").show();
      var layerid = $(this).parent().children('a').text();
      var layer = dis.map.getLayer(layerid);
      if (layer) {
        if(this.checked) 
          layer.setVisibility(true);
        else 
          layer.setVisibility(false);
        $(".ad-alayer .fa-spinner").hide();
      } else {
        $(".ad-alayer .fa-spinner").hide();
      }
    });
  }

  getRandomColor() {
    var c = '';
    while (c.length < 7) {
      c += (Math.random()).toString(16).substr(-6).substr(-1)
    }
    return '#' + c;
  }
}
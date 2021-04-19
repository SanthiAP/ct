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
                          <button id="ad-url-service" class="ad-url-add">Add</button>
                        </div>
                      </div>
                      <div class="ad-layer-container"></div>
                    </div>`;
    $("#" + this.divId).append(inputDiv);
  }

  bindOnchange() {
    $("#add-data-file-input").change(dis.inputOnchange);
    $(".clear-add-data-selection").click(dis.clearOnchange);
    $("#ad-url-service").click(dis.addbtnOnchange);
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
        case "kml":
          dis.addKMLFile(selectedFile);
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

  addbtnOnchange() {
    if (!($(".ad-url-input").val())) {
      alertify.error("Input cannot be empty.")
      return;
    }
    dis.validateServiceUrl();
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
        if (csvContent.indexOf("latitude") < 0 &&
          csvContent.indexOf("lat") < 0) {
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
        dis.addAddedLayer(layname)
      }
    });
  }

  addAddedLayer(lname) {
    $(".ad-layer-container").append(`
    <div class="ad-alayer">
      <div class="ad-layer-name-container">
        <input class="ad-layer-visibility" type="checkbox" name="`+ lname + `" checked>
        <i class="fas fa-spinner fa-spin"></i>
        <a for=`+ lname + ` href="#">` + lname + `</a>
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
    $(".ad-layer-name-container input[name='" + lname + "'").parent().parent().children('.ad-tools').children('.ad-zoomto').trigger("click");
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
    $(".ad-layer-visibility").click(function () {
      $(".ad-alayer .fa-spinner").show();
      var layerid = $(this).parent().children('a').text();
      var layer = dis.map.getLayer(layerid);
      if (layer) {
        if (this.checked)
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

  validateServiceUrl() {
    require([
      "esri/request"
    ], function (esriRequest) {
      var layerUrl = $(".ad-url-input").val();
      var layersRequest = esriRequest({
        url: layerUrl,
        content: { f: "json" },
        handleAs: "json",
        callbackParamName: "callback"
      });
      layersRequest.then(
        function (response) {
          if (!response) {
            alertify.error("Entered url is not valid")
            return;
          }

          if (response.name) {
            dis.loadServices(response.name);
            return;
          }

          if (response.layers.length) {
            var urlsplit = layerUrl.split("/");
            var serverindex = layerUrl.split("/").indexOf("MapServer");
            var layername = urlsplit[serverindex - 1];
            dis.loadServices(layername);
          }
        }, function (error) {
          alertify.error("Entered url is not valid")
          console.log("Error: ", error.message);
        });
    });
  }

  loadServices(layname) {
    require([
      "esri/layers/FeatureLayer",
      "esri/layers/ArcGISDynamicMapServiceLayer"
    ], function (FeatureLayer, ArcGISDynamicMapServiceLayer) {
      var url = $(".ad-url-input").val();
      if (url.split("/").indexOf("MapServer") >= 0) {
        var layer = new ArcGISDynamicMapServiceLayer(url, {
          id: layname,
          name: layname
        });
      } else if (url.split("/").indexOf("FeatureServer") >= 0) {
        var layer = new FeatureLayer(url, {
          id: layname,
          name: layname
        });
      }
      dis.map.addLayer(layer);
      dis.addAddedLayer(layname)
    });
  }

  addKMLFile(Kmlfile) {
    var fileName = Kmlfile.name;
    var KMLFileName = Kmlfile.name;

    if (sniff("ie")) {
      //filename is full path in IE so extract the file name
      var arr = fileName.split("\\");
      fileName = arr[arr.length - 1];
    }

    if (!fileName ||
      fileName.indexOf(".kml") == -1 ||
      fileName.indexOf(".kmz") == -1) {
      alertify.error("File format is not suppported");
      return;
    }

    if (KMLFileName.indexOf(".kml") !== -1) {
      var file, files;
      var info = {
        ok: false,
        file: null,
        fileName: null,
        fileType: null,
      };

      files = Kmlfile;
      if (files) {
        info.file = file = Kmlfile;
        info.fileName = file.name;
        info.ok = true;
        info.fileType = "KML";
      }
      info.baseFileName = dis.getBaseFileName(info.fileName);
      dis.generatekmllayer(info, function (res) {
        if (res == "error") {
          alertify.error("Failed to add layer");
          return;
        }

      });

    }
  }

  getBaseFileName(fileName) {
    var a,
      baseFileName = fileName;
    if (sniff("ie")) {
      //fileName is full path in IE so extract the file name
      a = baseFileName.split("\\");
      baseFileName = a[a.length - 1];
    }
    a = baseFileName.split(".");
    //Chrome and IE add c:\fakepath to the value - we need to remove it
    baseFileName = a[0].replace("c:\\fakepath\\", "");
    return baseFileName;
  }

  generatekmllayer(fileInfo, callback) {
    require([
      "esri/request",
      "esri/layers/KMLLayer"
    ], function (esriRequest, KMLLayer) {
    var job = {
      map: map,
      sharingUrl: "http://utilitygis.lntecc.com/portal/sharing/rest",
      baseFileName: fileInfo.baseFileName,
      fileName: fileInfo.fileName,
      fileType: fileInfo.fileType,
      generalize: true,
      publishParameters: {},
      numFeatures: 0,
    };
    var reader = new FileReader();
    var handleError = function (pfx, error) {
      callback("error");
    };
    reader.onerror = function (err) {
      callback("error");
    };
    reader.onload = function (event) {
      if (reader.error) {
        callback("error");
        return;
      }
      var v = event.target.result;
      var url = "";
      var id = fileInfo.fileName;
      var layer = new KMLLayer(url, {
        id: id,
        name: fileInfo.fileName,
        linkInfo: {
          visibility: false,
        },
      });
      layer.visible = true;
      delete layer.linkInfo;
      layer._parseKml = function () {
        var self = this;
        this._fireUpdateStart();
        // Send viewFormat as necessary if this kml layer represents a
        // network link i.e., in the constructor options.linkInfo is
        // available and linkInfo has viewFormat property
        this._io = esriRequest(
          {
            url: this.serviceUrl,
            content: {
              /*url: this._url.path + this._getQueryParameters(map),*/
              kmlString: encodeURIComponent(v),
              model: "simple",
              folders: "",
              refresh: this.loaded ? true : undefined,
              outSR: dojoJson.toJson(this._outSR.toJson()),
            },
            callbackParamName: "callback",
            load: function (response) {
              self._io = null;
              self._initLayer(response);
              var Point_labelingInfo = [
                {
                  labelExpressionInfo: {
                    expression: "$feature.name",
                  },
                  labelPlacement: "center-center",
                },
              ];
              var Pline_labelingInfo = [
                {
                  labelExpressionInfo: {
                    expression: "$feature.name",
                  },
                  labelPlacement: "above-along",
                },
              ];
              var Poly_labelingInfo = [
                {
                  labelExpressionInfo: {
                    expression: "$feature.name",
                  },
                  labelPlacement: "always-horizontal",
                },
              ];
              dis.waitForLayer(layer)
                .then(function (lyr) {
                  var num = 0;
                  lyr.name = fileInfo.fileName;
                  lyr.id = fileInfo.fileName;
                  lyr.xtnAddData = true;
                  arrayUtils.forEach(lyr.getLayers(), function (l) {
                    if (l && l.graphics && l.graphics.length > 0) {
                      num += l.graphics.length;
                    }
                    if (l instanceof FeatureLayer) {
                      if (l.geometryType == "esriGeometryPolyline") {
                        l.setLabelingInfo(Pline_labelingInfo);
                      } else if (l.geometryType == "esriGeometryPoint") {
                        l.setLabelingInfo(Point_labelingInfo);
                      } else {
                        l.setLabelingInfo(Poly_labelingInfo);
                      }
                    }
                  });
                  dis.map.addLayer(lyr);
                  callback("success");
                })
                .otherwise(function (err) {
                  callback("error");
                });
            },
            error: function (err) {
              self._io = null;
              err = lang.mixin(new Error(), err);
              err.message = "Unable to load KML: " + (err.message || "");
              self._fireUpdateEnd(err);
              self._errorHandler(err, callback);
              callback("error");
            },
          },
          { usePost: true }
        );
      };
      layer._parseKml();
    };
    try {
      reader.readAsText(fileInfo.file);
    } catch (ex) {
      callback("error");
    }
  });
  }
  waitForLayer(layer) {
    var dfd = new Deferred(),
      handles = [];
    if (layer.loaded) {
      dfd.resolve(layer);
      return dfd;
    }
    if (layer.loadError) {
      dfd.reject(layer.loadError);
      return dfd;
    }
    var clearHandles = function () {
      arrayUtils.forEach(handles, function (h) {
        h.remove();
      });
    };
    handles.push(
      layer.on("load", function (layerLoaded) {
        clearHandles();
        dfd.resolve(layerLoaded.layer);
      })
    );
    handles.push(
      layer.on("error", function (layerError) {
        clearHandles();
        var error = layerError.error;
        try {
          if (
            error.message &&
            error.message.indexOf("Unable to complete") !== -1
          ) {
            console.warn("layerAccessError", error);
            dfd.reject(new Error(i18n.search.layerInaccessible));
          } else {
            dfd.reject(error);
          }
        } catch (ex) {
          dfd.reject(error);
        }
      })
    );
    return dfd;
  }
}
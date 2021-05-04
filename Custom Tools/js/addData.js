/**
 * Class to create add data divs and do its functionality
 * @requires JQuery, Font Awesome, AddData.css, JSZip, alertify
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
                            <span class="add-data-loading">
                              <i class="fas fa-spinner fa-spin"></i>
                            </span>
                            <span class="add-data-file-msg"> or drag and drop files here</span>
                            <input id="add-data-file-input" class="add-data-file-input" type="file" accept=".zip, .csv, .kml, .kmz, .geojson">
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
    $(".add-data-loading").show();
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
        case "kmz":
          dis.addKMLFile(selectedFile);
          break;
        case "zip":
          dis.addShapeFile(selectedFile, "Shapefile");
          break;
        case "geojson":
          dis.addShapeFile(selectedFile, "GeoJSON");
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
        var template = new InfoTemplate(layname, "${*}");
        csvlayer.setInfoTemplate(template);
        var orangeRed = new Color(dis.getRandomColor()); // hex is #ff4500
        var marker = new SimpleMarkerSymbol("solid", 15, null, orangeRed);
        var renderer = new SimpleRenderer(marker);
        csvlayer.setRenderer(renderer);
        dis.addLayerOnMap(csvlayer, layname);
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
    $(".add-data-file-msg").text(" or drag and drop files here");
  }

  unbindLayerTools() {
    $(".ad-zoomto").unbind("click");
    $(".ad-remove").unbind("click");
    $(".ad-layer-visibility").unbind("click");
  }

  bindLayerTools() {
    $(".ad-zoomto").click(function () {
      $(this).parent().parent().find('.fa-spinner').show();
      var layerid = $(this).parent().parent().find('a').text();
      var layer = dis.map.getLayer(layerid);
      
      if (layer) {
        $(this).parent().parent().find('.fa-spinner').hide();
        if(layer.fullExtent) 
          dis.map.setExtent(layer.fullExtent);
        layer.on("load", function() {
          if(layer.fullExtent)
            dis.map.setExtent(layer.fullExtent);
          else {
            alertify.error("Extent not found");
            return;
          }
        })
      } else {
        $(this).parent().parent().find('.fa-spinner').hide();
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
      "esri/InfoTemplate",
      "esri/layers/FeatureLayer",
      "esri/layers/ArcGISDynamicMapServiceLayer"
    ], function (InfoTemplate, FeatureLayer, ArcGISDynamicMapServiceLayer) {
      var url = $(".ad-url-input").val();
      if (url.split("/").indexOf("MapServer") >= 0) {
        var layer = new ArcGISDynamicMapServiceLayer(url, {
          id: layname,
          name: layname,
          infoTemplate: new InfoTemplate(layname, "${*}")
        });
      } else if (url.split("/").indexOf("FeatureServer") >= 0) {
        var layer = new FeatureLayer(url, {
          id: layname,
          name: layname,
          infoTemplate: new InfoTemplate(layname, "${*}")
        });
      }
      dis.addLayerOnMap(layer, layname);
      $(".ad-url-input").val("");
    });
  }

  addKMLFile(Kmlfile) {
    var fileName = Kmlfile.name;
    var KMLFileName = Kmlfile.name;

    if (!fileName ||
      (fileName.indexOf(".kml") == -1 &&
        fileName.indexOf(".kmz") == -1)) {
      alertify.error("File format is not suppported");
      return;
    }

    if (KMLFileName.indexOf(".kml") !== -1) {
      var info = {
        ok: true,
        file: Kmlfile,
        fileName: Kmlfile.name,
        fileType: "kml",
      }
      info.baseFileName = dis.getBaseFileName(info.fileName);
      dis.generatekmllayer(info, function (res) {
        if (res == "error") {
          alertify.error("Failed to load layer");
        }
      });

    } else if (KMLFileName.indexOf(".kmz") !== -1) {
      var kmlFile = dis.getKmlFile(Kmlfile);
      kmlFile.then(function (kmlfile) {
        var info = {
          ok: true,
          file: kmlfile,
          fileName: kmlfile.name,
          fileType: "kml",
        };
        info.baseFileName = dis.getBaseFileName(info.fileName);
        dis.generatekmllayer(info, function (res) {
          if (res == "error") {
            alertify.error("Failed to load layer");
            return;
          }
        });
      });
    }
    else {
      alertify.error("Incorrect Format. Add File as .kml.");
      return;
    }
  }

  getBaseFileName(fileName) {
    var a,
      baseFileName = fileName;
    a = baseFileName.split(".");
    baseFileName = a[0].replace("c:\\fakepath\\", "");
    return baseFileName;
  }

  getKmlFile(kmzFile) {
    var zip = new JSZip();
    return zip.loadAsync(kmzFile).then((zip) => {
      var kmlfile = null;
      zip.forEach((relPath, file) => {
        if (relPath.split(".").pop() === "kml" && kmlfile === null) {
          kmlfile = file.async("blob").then(function (fileData) {
            return new File([fileData], file.name);
          });
        }
      });
      return kmlfile;
    });
  }

  generatekmllayer(fileInfo, callback) {
    require([
      "esri/request",
      "esri/InfoTemplate",
      "esri/layers/KMLLayer",
      "esri/layers/FeatureLayer",
      "dojo/_base/lang",
      "dojo/_base/json",
      "dojo/_base/array"
    ], function (esriRequest, InfoTemplate,  KMLLayer, FeatureLayer,
      lang, dojoJson, arrayUtils) {
      var reader = new FileReader();
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
          id: dis.getBaseFileName(id),
          name: dis.getBaseFileName(id),
          linkInfo: {
            visibility: false,
          },
          infoTemplate: new InfoTemplate(dis.getBaseFileName(id), "${*}")
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
                dis.waitForLayer(layer, function (lyr) {
                  if (lyr == "error") {
                    alertify.error("Failed to load layer");
                    return;
                  }
                  var num = 0;
                  lyr.name = dis.getBaseFileName(fileInfo.fileName);
                  lyr.id = dis.getBaseFileName(fileInfo.fileName);
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
                  dis.addLayerOnMap(lyr, lyr.name);
                  dis.kmlextent(lyr);
                  callback("success");
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

  waitForLayer(layer, callback) {
    require([
      "dojo/Deferred"
    ], function (Deferred) {
      var dfd = new Deferred(),
        handles = [];
      if (layer.loaded) {
        dfd.resolve(layer);
        dfd.then(function (lyr) { callback(lyr) })
          .otherwise(function (err) {
            callback("error");
          });;
        return;
      }
      if (layer.loadError) {
        dfd.reject(layer.loadError);
        dfd.then(function (lyr) { callback(lyr) })
          .otherwise(function (err) {
            callback("error");
          });;
        return;
      }
      var clearHandles = function () {
        handles.forEach(function (h) {
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
      dfd.then(function (lyr) { callback(lyr) })
        .otherwise(function (err) {
          callback("error");
        });;
      return;
    });
  }

  kmlextent(KMLLayerLoaded) {
    var kmlExtent = null,
      layers = KMLLayerLoaded.getLayers();
    layers.forEach(function (lyr) {
      if (lyr.graphics && lyr.graphics.length > 0) {
        var lyrExtent = esri.graphicsExtent(lyr.graphics);
        if (kmlExtent != null) {
          kmlExtent = kmlExtent.union(lyrExtent);
        } else {
          kmlExtent = lyrExtent;
        }
      }
    });
    KMLLayerLoaded.fullExtent = kmlExtent;
    dis.map.setExtent(kmlExtent);
  }

  addLayerOnMap(lyr, lyrname) {
    var allLayerTags = $(".ad-layer-name-container").find('a');
    allLayerTags.each(ind => {
      if (lyrname == $(this).text()) {
        alertify.error("Layer already available");
        return;
      }
    });
    dis.map.addLayer(lyr);
    dis.addAddedLayer(lyrname);
    $(".add-data-loading").hide();
  }

  addShapeFile(zipFile, ftype) {
    require([
      "dojo/Deferred"
    ], function (Deferred) {
      var job = {
        map: dis.map,
        sharingUrl: "https://sanw6iv2krkh1jmj.maps.arcgis.com/sharing/rest",
        baseFileName: dis.getBaseFileName(zipFile.name),
        fileName: zipFile.name,
        fileType: ftype,
        generalize: true,
        publishParameters: {},
        numFeatures: 0
      };
      var fileName = zipFile.name;
      var self = dis, formData = new FormData();
      formData.append("file", zipFile);
      var dfd = new Deferred();
      dfd.resolve(null);
      dfd.then(function (response) {
        if (response && response.publishParameters && response.publishParameters.locationType &&
          response.publishParameters.locationType === "unknown") {
          alertify.error("Something went wrong");
          return;
        }
        return self.generateFeatures(job, formData, function(response) {
          self.addFeatures(job, response.featureCollection);
        alertify.success("Layer added successfully");
        });
      }).otherwise(function (error) {
        alertify.error("Failed to load layer")
        return
      });
    });
  }

  generateFeatures(job, formData, callback) {
    require([
      "esri/request",
      "esri/geometry/scaleUtils",
      "dojo/_base/lang"
    ], function (esriRequest, scaleUtils,
      lang) {
      var url = job.sharingUrl + "/content/features/generate";
      job.publishParameters = job.publishParameters || {};
      var params = lang.mixin(job.publishParameters, {
        name: job.baseFileName,
        targetSR: job.map.spatialReference,
        maxRecordCount: 100000,
        enforceInputFileSizeLimit: true,
        enforceOutputJsonSizeLimit: true
      });
      if (job.generalize) {
        // 1:40,000
        var extent = scaleUtils.getExtentForScale(job.map, 40000);
        var resolution = extent.getWidth() / job.map.width;
        params.generalize = true;
        params.maxAllowableOffset = resolution;
        // 1:4,000
        resolution = resolution / 10;
        var numDecimals = 0;
        while (resolution < 1) {
          resolution = resolution * 10;
          numDecimals++;
        }
        params.reducePrecision = true;
        params.numberOfDigitsAfterDecimal = numDecimals;
      }
      var content = {
        f: "json",
        filetype: job.fileType.toLowerCase(),
        publishParameters: JSON.stringify(params)
      };
      esriRequest({
        url: url,
        content: content,
        form: formData,
        handleAs: "json"
      }).then(function(resp) {callback(resp)});
    });
  }

  addFeatures(job, featureCollection) {
    require([
      "esri/InfoTemplate",
      "esri/layers/FeatureLayer",
      "dojo/_base/array"
    ], function (InfoTemplate, FeatureLayer, array) {
      //var triggerError = null; triggerError.length;
      var fullExtent, layers = [], map = job.map, nLayers = 0;
      if (featureCollection.layers) {
        nLayers = featureCollection.layers.length;
      }
      array.forEach(featureCollection.layers, function (layer) {
        var layername = layer.layerDefinition.name
        var featureLayer = new FeatureLayer(layer, {
          id: layername,
          name: layername,
          outFields: ["*"],
          infoTemplate: new InfoTemplate(layername, "${*}")
        });
        featureLayer.xtnAddData = true;
        if (featureLayer.graphics) {
          job.numFeatures += featureLayer.graphics.length;
        }
        if (nLayers === 0) {
          featureLayer.name = job.baseFileName;
        }
        if (featureLayer.fullExtent) {
          var extentCenter = featureLayer.fullExtent.getCenter();
          if (extentCenter.x && extentCenter.y) {
            if (!fullExtent) {
              fullExtent = featureLayer.fullExtent;
            } else {
              fullExtent = fullExtent.union(featureLayer.fullExtent);
            }
          }
        }
        dis.addLayerOnMap(featureLayer, layername);
        layers.push(featureLayer);
      });
      if (layers.length > 0) {
        // map.addLayers(layers);
        if (fullExtent) {
          map.setExtent(fullExtent.expand(1.25), true);
        }
      }
    });
  }
}
$(document).ready(function () {
  var map, bmFPLayer, bmFPSymbol, bmFPLabel;
  var drawGraphicSymbol;
  var drawPointGraphicLayer, drawLineGraphicLayer, drawPolygonGraphicLayer, drawTextGraphicLayer;
  var drawToolBar, editToolBar;
  var pointDeleteGrafic;
  var lineEditGrafic, polygonEditGrafic, textEditGrafic;
  const nullArray = ["", undefined, null, NaN];
  var bookmarks = {};
  var linePreviewSVG = lineSVG;
  var polygonSymbolConfig = polygonSymbolMapping;
  var smsMapping = {
    "Triangle": "esriSMSTriangle",
    "Circle": "esriSMSCircle",
    "Square": "esriSMSSquare",
    "Cross": "esriSMSCross",
    "Diamond": "esriSMSDiamond",
    "X": "esriSMSX"
  }
  var smsMapping2 = {
    "triangle": "esriSMSTriangle",
    "circle": "esriSMSCircle",
    "square": "esriSMSSquare",
    "cross": "esriSMSCross",
    "diamond": "esriSMSDiamond",
    "x": "esriSMSX"
  }
  var sessionBMData = localStorage.getItem("bm-data");
  var sessionPointGraphicData = localStorage.getItem("point-graphic-data");
  var sessionLineGraphicData = localStorage.getItem("line-graphic-data");
  var sessionPolygonGraphicData = localStorage.getItem("polygon-graphic-data");
  var sessionTextGraphicData = localStorage.getItem("text-graphic-data");
  var titleMapping = {
    "tool-bm": "BookMark",
    "tool-draw": "Draw",
    "tool-adddata": "Add Data",
    "tool-basemap": "Change Basemap",
    "tool-digitize": "Digitize"
  }
  require(["esri/map",
    "esri/Color",
    "esri/graphic",

    "esri/geometry/Extent",
    "esri/geometry/Polygon",
    "esri/geometry/Point",
    "esri/geometry/Multipoint",
    "esri/geometry/Polyline",
    "esri/geometry/geometryEngine",

    "esri/layers/GraphicsLayer",

    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/TextSymbol",
    "esri/symbols/Font",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/PictureFillSymbol",

    "esri/toolbars/draw",
    "esri/toolbars/edit",

    "esri/dijit/Search",
    "esri/dijit/HomeButton",
    "esri/dijit/LocateButton",
    "esri/dijit/BasemapGallery"
  ],
    function (Map,
      Color,
      Graphic,
      Extent, Polygon, Point, Multipoint, Polyline, geometryEngine,
      GraphicsLayer,
      SimpleFillSymbol, TextSymbol, Font, SimpleLineSymbol, PictureMarkerSymbol, SimpleMarkerSymbol, PictureFillSymbol,
      Draw, Edit,
      Search, HomeButton, LocateButton, BasemapGallery
    ) {

      map = new Map("map-div", {
        basemap: "topo",
        center: [78.9629, 20.5937],
        zoom: 5
      });

      var searchWidget = new Search({
        map: map
      },"search-widget");

      var homeButton = new HomeButton({
        theme: "HomeButton",
        map: map,
        extent: null,
        visible: true
      }, "home-widget");
      homeButton.startup();

      var locateButton = new LocateButton({
        map: map
      }, "locate-widget");

      var basemapGallery = new BasemapGallery({
        showArcGISBasemaps: true,
        map: map
      }, "tool-basemap-container");
      basemapGallery.startup();

      map.on("load", mapLoaded);
      map.on("update-start", showPageLoading);
      map.on("update-end", hidePageLoading);

      function showPageLoading() {
        $("#map-loader").show();
      }
      
      function hidePageLoading() {
        $("#map-loader").hide();
      }

      bmFPLayer = new GraphicsLayer({
        "id": "bookmark"
      });

      bmFPLabel = new GraphicsLayer({
        "id": "bookmarkLabel"
      });

      drawPointGraphicLayer = new GraphicsLayer({
        "id": "pointGraphicLayer"
      });

      drawLineGraphicLayer = new GraphicsLayer({
        "id": "lineGraphicLayer"
      });

      drawPolygonGraphicLayer = new GraphicsLayer({
        "id": "polygonGraphicLayer"
      });

      drawTextGraphicLayer = new GraphicsLayer({
        "id": "textGraphicLayer"
      });

      map.addLayers([drawPointGraphicLayer, drawTextGraphicLayer, drawLineGraphicLayer, bmFPLabel, bmFPLayer, drawPolygonGraphicLayer]);

      var pointDeleteHighlight = new SimpleFillSymbol(
        "solid",
        new SimpleLineSymbol("solid", new Color([232, 104, 80]), 4),
        new Color([232, 104, 80, 0.15])
      );
      drawPointGraphicLayer.on("click", function (evt) {
        if ($("#draw-point-container").css("display") == "none") {
          return;
        }
        editToolBar.activate(Edit.MOVE, evt.graphic);
        if (evt.graphic.symbol.type == "picturemarkersymbol")
          $("#delete-draw-points").show();

        if (evt.graphic.symbol.type == "simplemarkersymbol")
          $("#delete-sym-draw-points").show();

        pointDeleteGrafic = evt.graphic;
        map.graphics.add(new Graphic(new Point(evt.graphic.geometry), pointDeleteHighlight));
      });

      drawLineGraphicLayer.on("click", function (evt) {
        if ($("#draw-line-container").css("display") == "none") {
          return;
        }

        lineEditGrafic = evt.graphic;
        $("#delete-draw-line").show();
        activateLineEditTB(lineEditGrafic);
        var sym = lineEditGrafic.symbol;
        $("#line-size").val(sym.width);
        var convertedClr = rgbToHex(sym.color.r, sym.color.g, sym.color.b);
        $("#line-colorSelector div").css("background-color", convertedClr);
        $("#line-style div svg").removeClass('selected-line-symbol');
        $("#line-style div[title='" + linePreviewSVG.slsTitleMapping[sym.style] + "'] svg").addClass('selected-line-symbol');
        setLinePreview("layerKlik")
      });

      drawPolygonGraphicLayer.on("click", function (evt) {
        if ($("#draw-polygon-container").css("display") == "none") {
          return;
        }

        if(polygonEditGrafic) { // to prevent polygon symbol change reverse
          alertify.error("Click on map. Do save or edit the graphic")
          return;
        }

        var polygraf = evt.graphic;
        $("#delete-draw-polygon").show();
        activateLineEditTB(polygraf);
        var sym = polygraf.symbol;
        $("#polygon-line-size").val(sym.outline.width);
        var convertedClr = rgbToHex(sym.outline.color.r, sym.outline.color.g, sym.outline.color.b);
        $("#polygon-outline-colorSelector div").css("background-color", convertedClr);
        $("#polygon-outline-style div svg").removeClass("selected-polygon-outline-symbol");
        $("#polygon-outline-style div[title='" + linePreviewSVG.slsTitleMapping[sym.outline.style] + "'] svg").addClass('selected-polygon-outline-symbol');
        if (!sym.style && sym.url) {
          $("#polygon-style").val("picture");
          $("#polygon-fill-img-preview").empty();
          $("#polygon-fill-img-preview").append('<img src="' + sym.url + '" alt="Fill Image" style="width: 25px; height: 25px;">');
        } else {
          $("#polygon-style").val(polygonSymbolConfig.retrieveMapping[sym.style]);
          $("#polygon-colorSelector div").css("background-color", rgbToHex(sym.color.r, sym.color.g, sym.color.b));
          $("#poly-fill-transp-slider").val(sym.color.a * 100);
          $("#poly-trans-input").val(sym.color.a * 100);
        }
        $("#polygon-style").trigger("change");
        polygonEditGrafic = evt.graphic;
      });

      drawTextGraphicLayer.on("click", function(evt) {
        if ($("#draw-text-container").css("display") == "none") {
          return;
        }

        textEditGrafic = evt.graphic;
        $("#delete-draw-text").show();
        activateTextEditTB(textEditGrafic);
        var sym = textEditGrafic.symbol;
        $("#text-text").val(sym.text);
        var convertedClr = rgbToHex(sym.color.r, sym.color.g, sym.color.b);
        $("#text-colorSelector div").css("background-color", convertedClr);
        $("#text-hori-alignment").val(sym.horizontalAlignment);
        $("#text-vert-alignment").val(sym.verticalAlignment);
        $("#text-angle").val(parseInt(nullArray.indexOf(sym.angle) >= 0 ? 0 : sym.angle));
        if(sym.haloColor) {
          var halocolor = sym.haloColor;
          $("#text-halo-width").val(sym.haloSize);
          $("#text-halo-colorSelector div").css("background-color", rgbToHex(halocolor.r, halocolor.g, halocolor.b));
        }
        var ft = sym.font;
        $("#text-family").val(ft.family);
        $("#text-font-size").val(ft.size);
        $("#text-font-style").val(nullArray.indexOf(ft.style)>=0 ? "none" : ft.style);
        $("#text-font-weight").val(ft.weight);
        $("#text-font-decoration").val(ft.decoration);
        redrawGraphicText()
      })

      function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      }

      function activateTextEditTB(graf) {
        editToolBar.activate(Edit.MOVE | Edit.ROTATE | Edit.SCALE, graf);
      }

      function activateLineEditTB(graf) {
        editToolBar.activate(Edit.EDIT_VERTICES | Edit.MOVE | Edit.ROTATE | Edit.SCALE, graf, {
          "allowAddVertices": true,
          "allowDeleteVertices": true
        });
      }

      map.on("click", function (evt) {
        if (evt.graphic) {
          return;
        }
        $("#delete-draw-points, #delete-sym-draw-points, #delete-draw-line, #delete-draw-polygon").hide();
        editToolBar.deactivate();
        lineEditGrafic = undefined;
        polygonEditGrafic = undefined;
        textEditGrafic = undefined;
      });

      bmFPSymbol = new SimpleFillSymbol(
        "solid",
        new SimpleLineSymbol("solid", new Color([232, 104, 80]), 2),
        new Color([232, 104, 80, 0.15])
      );

      function mapLoaded() {
        drawToolBar = new Draw(map);
        drawToolBar.on("draw-end", addGraphic);
        editToolBar = new Edit(map);
      }

      loadSessionPtGraficData()
      loadSessionLineGraficData()
      loadSessionPolygonGraficData()
      loadSessionTextGraficData()
      loadSessionBMData();
      function loadSessionBMData() {
        if (!sessionBMData) {
          return;
        }

        bookmarks = JSON.parse(sessionBMData);
        Object.keys(bookmarks).forEach(function (bmName) {
          createBookmark(bmName);
        });
        unbindBMEvents();
        bindBMEvents();
      }

      function loadSessionPtGraficData() {
        if (!sessionPointGraphicData) {
          return;
        }

        var allptgrafDets = JSON.parse(sessionPointGraphicData);
        Object.keys(allptgrafDets).forEach(function (apt) {
          var agrfdets = allptgrafDets[apt];
          var geom;
          if (agrfdets.geometry.points) {
            geom = new Multipoint(agrfdets.geometry);
          } else {
            geom = new Point(agrfdets.geometry);
          }

          var symbol = agrfdets.symbol;
          var grafsym;
          if (symbol) {
            if (symbol.type == "picturemarkersymbol") {
              grafsym = new PictureMarkerSymbol(symbol.url, symbol.width, symbol.height);
            }
            if (symbol.type == "simplemarkersymbol") {
              var outlineColor = symbol.outline.color;
              var symColor = symbol.color;
              var symsize = parseInt(symbol.size);
              grafsym = new SimpleMarkerSymbol({
                "color": new Color([symColor.r, symColor.g, symColor.b, symColor.a]),
                // "size": symsize,
                "angle": nullArray.indexOf(symbol.angle) >= 0 ? 0 : symbol.angle,
                "xoffset": 0,
                "yoffset": 0,
                "type": "esriSMS",
                "style": smsMapping2[symbol.style],
                "outline": {
                  "color": new Color([outlineColor.r, outlineColor.g, outlineColor.b, outlineColor.a]),
                  "width": parseInt(2),
                  "type": "esriSLS",
                  "style": "esriSLSSolid"
                }
              });
              grafsym.setSize(symsize);
            }

            if (!symbol.type && symbol.url) {
              grafsym = new PictureMarkerSymbol(symbol);
            }
          }
          drawPointGraphicLayer.add(new Graphic(geom, grafsym));
        });
      }

      function loadSessionLineGraficData() {
        if (!sessionLineGraphicData) {
          return;
        }

        var allptgrafDets = JSON.parse(sessionLineGraphicData);
        Object.keys(allptgrafDets).forEach(function (aline) {
          var agrfdets = allptgrafDets[aline];
          var geom = agrfdets.geometry;
          var sym = agrfdets.symbol;
          var grafsym = new SimpleLineSymbol({
            type: "esriSLS",
            style: linePreviewSVG.slsRetrieveMapping[sym.style]
          });
          grafsym.setWidth(sym.width);
          grafsym.setColor(new Color(sym.color));
          drawLineGraphicLayer.add(new Graphic(new Polyline(geom), grafsym));
        });
      }

      function loadSessionPolygonGraficData() {
        if (!sessionPolygonGraphicData)
          return;

        var allptgrafDets = JSON.parse(sessionPolygonGraphicData);
        Object.keys(allptgrafDets).forEach(function (apolygon) {
          var agrfdets = allptgrafDets[apolygon];
          var geom = agrfdets.geometry;
          var sym = agrfdets.symbol;
          var outline = new SimpleLineSymbol({
            type: "esriSLS",
            style: linePreviewSVG.slsRetrieveMapping[sym.outline.style]
          });
          outline.setWidth(sym.outline.width);
          outline.setColor(new Color(sym.outline.color));
          if (sym.type == "simplefillsymbol") {
            var grafsym = new SimpleFillSymbol({
              "type": "esriSFS",
              "style": polygonSymbolConfig.retrieveMapping[sym.style]
            });
            grafsym.setColor(new Color(sym.color));
            grafsym.setOutline(outline);
          } else {
            var grafsym = new PictureFillSymbol(sym.url, outline, 20, 20);
          }
          drawPolygonGraphicLayer.add(new Graphic(new Polygon(geom), grafsym));
        });
      }

      function loadSessionTextGraficData() {
        if (!sessionTextGraphicData)
        return;

      var allptgrafDets = JSON.parse(sessionTextGraphicData);
      Object.keys(allptgrafDets).forEach(function (atext) {
        var agrfdets = allptgrafDets[atext];
        var geom = agrfdets.geometry;
        var sym = agrfdets.symbol;
        var font = new Font({
          "family" : sym.font.family,
          "style" : sym.font.style,
          "weight" : sym.font.weight,
          "decoration" : sym.font.decoration
        });
        font.setSize(parseInt(sym.font.size)+"px");
        var grafsym = new TextSymbol(sym.text, font, new Color(sym.color));
        grafsym.setAngle(parseInt(nullArray.indexOf(sym.angle) >= 0 ? 0 : sym.angle));
        grafsym.setHorizontalAlignment(sym.verticalAlignment);
        grafsym.setVerticalAlignment(sym.horizontalAlignment);
        
        if(sym.haloSize) {
          grafsym.setHaloColor(new Color(sym.haloColor));
          grafsym.setHaloSize(parseInt(sym.haloSize));
        }
        drawTextGraphicLayer.add(new Graphic(new Point(geom), grafsym));
      });
      }

      function addGraphic(evt) {
        drawToolBar.deactivate();
        switch (evt.geometry.type) {
          case "point":
            if(drawGraphicSymbol.type == "textsymbol") {
              drawTextGraphicLayer.add(new Graphic(evt.geometry, drawGraphicSymbol));
            } else {
              drawPointGraphicLayer.add(new Graphic(evt.geometry, drawGraphicSymbol));
            }
            break;
          case "multipoint":
            var points = evt.geometry.points;
            points.forEach(function (apt) {
              var ptgrf = new Point(apt, evt.geometry.spatialReference);
              drawPointGraphicLayer.add(new Graphic(ptgrf, drawGraphicSymbol));
            });
            break;
          case "polyline":
            drawLineGraphicLayer.add(new Graphic(evt.geometry, drawGraphicSymbol));
            break;
          case "polygon":
            drawPolygonGraphicLayer.add(new Graphic(new Polygon(evt.geometry), drawGraphicSymbol));
            break;
          default:
        }
      }

      $(".upside a").click(function () {
        var clickedElem = $(this);
        $(".upside a").removeClass("active-tool");
        clickedElem.addClass("active-tool");
        openNav();
        $(".all-tool-content .tools-ind-container").css("display", "none");
        var selectedToolId = clickedElem.prop("id");
        $("#" + selectedToolId + "-container").css("display", "block");
        $(".side-nav-header h3").text(titleMapping[selectedToolId]);
      });

      function openNav() {
        $("#map-container").css("width", "70%");
        $("#tools-content-container").css("width", "29%");
        $(".map-single-widgets").css("left", "32.5%");
        $(".single-widget-container").css("left", "calc(36% + 10px - 16.25%)");
        $("#map-loader img").css("left", "33.5%")
      }

      $(".side-nav-header svg").click(function () {
        $(".upside a").removeClass("active-tool");
        closeNav();
      })

      function closeNav() {
        $("#map-container").css("width", "100%");
        $(".map-single-widgets").css("left", "50%");
        $(".single-widget-container").css("left", "calc(36% + 10px)");
        $("#tools-content-container").css("width", "0%");
        $("#map-loader img").css("left", "50%")
      }

      $("#create-bm").click(function () {
        var bmName = $("#bm-name").val();
        if (nullArray.indexOf(bmName) >= 0) {
          alertify.warning("Please enter bookmark name");
          return;
        }

        if (Object.keys(bookmarks).indexOf(bmName) >= 0) {
          alertify.warning("Bookmark name must be unique");
          return;
        }

        bookmarks[bmName] = map.extent;
        setSession_BM();
        removeAllBMFootprint();
        bmCheckBoxChange();
        unbindBMEvents();
        createBookmark(bmName);
        bindBMEvents()
        $("#bm-name").val("");
        alertify.success("Bookmark added successfully");
      });

      function unbindBMEvents() {
        $(".bm-single a").unbind("click");
        $(".bm-delete").unbind("click");
        $(".bm-edit").unbind("click");
        $(".save-edit-bm").unbind("click");
      }

      function bindBMEvents() {
        $(".bm-single a").click(bookmarkClik);
        $(".bm-delete").click(bookmarkDeleteClik);
        $(".bm-edit").click(bookmarkEditClik);
        $(".save-edit-bm").click(bookmarkSaveClik);
      }

      function bookmarkClik() {
        var bmname = $(this).text();
        if (nullArray.indexOf(bmname) >= 0) {
          alertify.error("Sorry! Something went wrong");
          return;
        }

        var bmExt = bookmarks[bmname];
        if (!bmExt) {
          alertify.error("Sorry! Bookmark extent cannot be found");
          return;
        }

        map.setExtent(new Extent(bmExt), true);
      }

      function bookmarkSaveClik() {
        var currElem_a = $(this).closest(".bm-single").find("a");
        var currElem_edit = $(this).closest(".bm-single").find(".bm-edit-items");
        var selectedBMName = currElem_a.text();
        currElem_a.css("display", "block");
        currElem_edit.css("display", "none");
        delete bookmarks[selectedBMName];
        var editedBMname = currElem_edit.find("input").val();
        bookmarks[editedBMname] = map.extent;
        setSession_BM();
        removeAllBMFootprint();
        bmCheckBoxChange();
        currElem_a.text(editedBMname);
        alertify.success("Bookmark edited successfully!");
      }

      function bookmarkEditClik() {
        var currElem_a = $(this).closest(".bm-single").find("a");
        var currElem_edit = $(this).closest(".bm-single").find(".bm-edit-items");
        var selectedBMName = currElem_a.text();
        currElem_a.css("display", "none");
        currElem_edit.css("display", "block");
        currElem_edit.find("input").val(selectedBMName);
      }

      function bookmarkDeleteClik() {
        $(this).parent().parent().remove();
        var bmname = $(this).parent().parent().find("a").text();
        delete bookmarks[bmname];
        setSession_BM();
        removeAllBMFootprint();
        bmCheckBoxChange();
        alertify.success("Bookmark deleted successfully");
      }

      function createBookmark(bmn) {
        $(".bm-content-container").append(`
        <div class="bm-single">
          <a href="#">`+ bmn + `</a>
          <div class="bm-edit-items">
            <input type="text" value="" placeholder="Enter Bookmark name..." class="bm-input bm-name-edit">
            <button class="save-edit-bm">
              <i class="fas fa-save"></i>
            </button>
          </div>
          <div class="bm-edit-tools">
            <div class="bm-edit"><i class="fas fa-edit"></i></div>
            <div class="bm-delete"><i class="fas fa-trash-alt"></i></div>
          </div>
        </div>
      `);
      }

      function setSession_BM() {
        localStorage.setItem("bm-data", JSON.stringify(bookmarks));
      }

      $('#show-all-bm').change(bmCheckBoxChange);
      function bmCheckBoxChange() {
        if ($("#show-all-bm").is(':checked')) {
          showAllBMFootprint();
          return;
        }
        removeAllBMFootprint();
      }

      function showAllBMFootprint() {
        var bmKeys = Object.keys(bookmarks);
        if (!bmKeys.length) {
          return;
        }
        bmKeys.forEach(function (abm) {
          var fpAttr = {
            "BookmarkName": abm
          }
          var fpExt = new Extent(bookmarks[abm]);
          var afp = new Graphic(fpExt, bmFPSymbol, fpAttr);
          bmFPLayer.add(afp);
          var txtSym = new TextSymbol(abm).setColor(
            new Color("black")).setAlign(Font.ALIGN_START).setFont(
              new Font("11pt").setWeight(Font.WEIGHT_BOLD).setFamily("calibri")).
            setHaloColor(new Color("white")).setHaloSize(2);
          var polyCentroid = fpExt.getCenter();
          var lblGraphic = new Graphic(new Point(polyCentroid), txtSym);
          bmFPLabel.add(lblGraphic);
        });
        setBMExtent();
      }

      function setBMExtent() {
        var allFPExts = [];
        Object.keys(bookmarks).forEach(function (abm) {
          allFPExts.push(new Extent(bookmarks[abm]));
        })
        var unionExt = geometryEngine.union(allFPExts);
        var polyGeom = new Polygon(unionExt);
        map.setExtent(polyGeom.getExtent());
      }

      function removeAllBMFootprint() {
        bmFPLayer.clear();
        bmFPLabel.clear();
      }

      $('.draw-mode-toggle').click(function (e) {
        e.preventDefault();

        let $this = $(this);

        if ($this.next().hasClass('show')) {
          $this.next().removeClass('show');
          $this.next().slideUp(350);
        } else {
          $this.parent().parent().find('li .draw-mode-inner').removeClass('show');
          $this.parent().parent().find('li .draw-mode-inner').slideUp(350);
          $this.next().toggleClass('show');
          $this.next().slideToggle(350);
        }
      });

      $('ul.draw-point-tabs li').click(function () {
        var tab_id = $(this).attr('data-tab');

        $('ul.draw-point-tabs li').removeClass('draw-current');
        $('.draw-point-tab-content').removeClass('draw-current');

        $(this).addClass('draw-current');
        $("#" + tab_id).addClass('draw-current');
      });

      var $fileInput = $('.file-input');
      var $droparea = $('.file-drop-area');

      // highlight drag area
      $fileInput.on('dragenter focus click', function () {
        $droparea.addClass('is-active');
      });

      // back to normal state
      $fileInput.on('dragleave blur drop', function () {
        $droparea.removeClass('is-active');
      });

      // change inner text
      $fileInput.on('change', function () {
        var filesCount = $(this)[0].files.length;
        var $textContainer = $(this).prev();

        if (filesCount === 1) {
          // if single file is selected, show file name
          var fileName = $(this).val().split('\\').pop();
          $textContainer.text(fileName);
        } else {
          // otherwise show number of files
          $textContainer.text(filesCount + ' files selected');
        }
      });

      $("#clear-pt-pic-selection").click(function () {
        $(".file-msg").text("or drag and drop files here");
        $("#draw-point-picture").val("");
      });

      $("#draw-sym-point").click(function () {
        createSMS();
        drawToolBar.activate("point");
      });

      $("#draw-point").click(function () {
        var selectedImg = $("#draw-point-picture").val();
        if (nullArray.indexOf(selectedImg) >= 0) {
          alertify.warning("Please give input");
          return;
        }
        createPMS();
        drawToolBar.activate("point");
      });

      $("#draw-sym-multipoint").click(function () {
        createSMS();
        drawToolBar.activate("multipoint");
      });

      $("#draw-multipoint").click(function () {
        var selectedImg = $("#draw-point-picture").val();
        if (nullArray.indexOf(selectedImg) >= 0) {
          alertify.warning("Please give input");
          return;
        }
        createPMS();
        drawToolBar.activate("multipoint");
      });

      function createSMS() {
        var rgb = $("#pt-colorSelector div").css("backgroundColor").replace(/[^\d,]/g, '').split(',');
        var symcolor = [];
        rgb.forEach(function (str) {
          symcolor.push(parseInt(str));
        });
        var symsize = $("#pt-size").val();
        var symangle = $("#pt-angle").val();
        var symstyle = $(".selected-pt-symbol").prop("title");
        drawGraphicSymbol = new SimpleMarkerSymbol({
          "color": symcolor,
          "size": parseInt(symsize),
          "angle": parseInt(symangle),
          "xoffset": 0,
          "yoffset": 0,
          "type": "esriSMS",
          "style": smsMapping[symstyle],
          "outline": {
            "color": symcolor,
            "width": 2,
            "type": "esriSLS",
            "style": "esriSLSSolid"
          }
        });
      }

      function createPMS() {
        // get a reference to the file
        var file = $("#draw-point-picture").prop("files")[0];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function (event) {
          drawGraphicSymbol = new PictureMarkerSymbol(reader.result, 20, 20);
        };
      }

      $("#draw-point-deactivate, #draw-sym-point-deactivate, #draw-line-deactivate, #draw-polygon-deactivate, #draw-text-deactivate").click(function () {
        drawToolBar.deactivate();
      });

      $("#save-draw-points, #save-sym-draw-points").click(function () {
        saveGraficData(drawPointGraphicLayer, "point-graphic-data");
      });

      $("#delete-draw-points, #delete-sym-draw-points").click(function () {
        deleteGraphics(pointDeleteGrafic, drawPointGraphicLayer);
      });

      initiateColorPicker("pt-colorSelector");
      initiateColorPicker("line-colorSelector");
      initiateColorPicker("polygon-colorSelector");
      initiateColorPicker("polygon-outline-colorSelector");
      initiateColorPicker("text-colorSelector");
      initiateColorPicker("text-halo-colorSelector");
      function initiateColorPicker(id) {
        $('#' + id).ColorPicker({
          color: '#0000ff',
          onShow: function (colpkr) {
            $(colpkr).fadeIn(500);
            return false;
          },
          onHide: function (colpkr) {
            $(colpkr).fadeOut(500);
            return false;
          },
          onChange: function (hsb, hex, rgb) {
            switch (id) {
              case "pt-colorSelector":
                ptSelectorChange(hex);
                break;
              case "line-colorSelector":
                lineSelectorChange(hex);
                break;
              case "polygon-colorSelector":
                polygonSelectorChange(hex);
                break;
              case "polygon-outline-colorSelector":
                polygonOutlineSelectorChange(hex);
                break;
              case "text-colorSelector":
                textSelectorChange(hex);
                break;
              case "text-halo-colorSelector":
                textHaloSelectorChange(hex);
                break;
              default:
            }
          }
        });
      }

      function polygonSelectorChange(hex) {
        $('#polygon-colorSelector div').css('backgroundColor', '#' + hex);
        redrawGraphicPolygon();
      }
      
      function polygonOutlineSelectorChange(hex) {
        $('#polygon-outline-colorSelector div').css('backgroundColor', '#' + hex);
        redrawGraphicPolygon();
      }

      function textSelectorChange(hex) {
        $('#text-colorSelector div').css('backgroundColor', '#' + hex);
        redrawGraphicText()
      }

      function textHaloSelectorChange(hex) {
        $('#text-halo-colorSelector div').css('backgroundColor', '#' + hex);
        redrawGraphicText()
      }

      function redrawGraphicPolygon() {
        if (!polygonEditGrafic) {
          return;
        }
        drawPolygonGraphicLayer.remove(polygonEditGrafic);
        createSFS();
        var graf = new Graphic(new Polygon(polygonEditGrafic.geometry), drawGraphicSymbol);
        editToolBar.deactivate();
        polygonEditGrafic = graf;
        drawPolygonGraphicLayer.add(polygonEditGrafic);
        activateLineEditTB(polygonEditGrafic);
      }

      function redrawGraphicText() {
        if (!textEditGrafic) {
          return;
        }
        drawTextGraphicLayer.remove(textEditGrafic);
        createTS();
        var graf = new Graphic(new Point(textEditGrafic.geometry), drawGraphicSymbol);
        editToolBar.deactivate();
        textEditGrafic = graf;
        drawTextGraphicLayer.add(textEditGrafic);
        activateTextEditTB(textEditGrafic);
      }

      function ptSelectorChange(hex) {
        $('#pt-colorSelector div').css('backgroundColor', '#' + hex);
        setPointPreview()
      }

      function lineSelectorChange(hex) {
        $('#line-colorSelector div').css('backgroundColor', '#' + hex);
        setLinePreview();
      }

      function redrawGraphicLine() {
        drawLineGraphicLayer.remove(lineEditGrafic);
        createSLS();
        var graf = new Graphic(new Polyline(lineEditGrafic.geometry), drawGraphicSymbol);
        editToolBar.deactivate();
        lineEditGrafic = graf;
        drawLineGraphicLayer.add(lineEditGrafic);
        activateLineEditTB(lineEditGrafic);
      }

      $("#pt-size, #pt-angle").on("change", setPointPreview)
      $("#pt-size, #pt-angle").on("mousewheel", setPointPreview)

      $("#pt-style div").click(function () {
        $("#pt-style div").removeClass("selected-pt-symbol");
        $(this).addClass("selected-pt-symbol");
        setPointPreview();
      });

      $("#line-style div").click(function () {
        $("#line-style div svg").removeClass("selected-line-symbol");
        $(this).children('svg').addClass("selected-line-symbol");
        setLinePreview();
      });

      $("#pt-style div[title='Circle']").trigger("click");
      function setPointPreview() {
        var selectedStyle = $(".selected-pt-symbol")
        $("#pt-symbol-preview").empty();
        $("#pt-symbol-preview").append(selectedStyle.html());
        $("#pt-symbol-preview svg").css("color", $("#pt-colorSelector div").css("background-color"));
        $("#pt-symbol-preview svg").css("font-size", $("#pt-size").val() + "px");
        $("#pt-symbol-preview svg").css("transform", "rotate(" + $("#pt-angle").val() + "deg)");
        if (selectedStyle.prop("title") == "Diamond") {
          $("#pt-symbol-preview svg").css("transform", "rotate(45deg)");
        }
      }

      $("#line-size").on("change", setLinePreview);
      $('#line-size').on("mousewheel", setLinePreview);
      $("#line-style div[title='Solid'] svg").trigger("click");
      function setLinePreview(hint) {
        var selectedStyle = $(".selected-line-symbol")
        $("#line-symbol-preview").empty();
        $("#line-symbol-preview").append(linePreviewSVG[selectedStyle.parent('div').prop("title")]);
        $("#line-symbol-preview svg path").css("stroke", $("#line-colorSelector div").css("background-color"));
        $("#line-symbol-preview svg path").css("stroke-width", $("#line-size").val());
        if (lineEditGrafic && hint != "layerKlik") {
          redrawGraphicLine();
        }
      }

      $("#draw-line").click(function () {
        drawToolBar.activate("line");
        createSLS();
      });

      $("#draw-polyline").click(function () {
        drawToolBar.activate("polyline");
        createSLS();
      });

      $("#draw-freehand-polyline").click(function () {
        drawToolBar.activate("freehandpolyline");
        createSLS();
      });

      function createSLS() {
        var colr = getSymColor("line-colorSelector");
        var style = $(".selected-line-symbol").parent('div').prop("title");
        drawGraphicSymbol = new SimpleLineSymbol({
          "type": "esriSLS",
          "style": linePreviewSVG.slsMapping[style]
        });
        drawGraphicSymbol.setColor(new Color(colr));
        drawGraphicSymbol.setWidth(parseInt($("#line-size").val()));
      }

      function getSymColor(id) {
        var rgb = $("#" + id + " div").css("backgroundColor").replace(/[^\d,]/g, '').split(',');
        var symcolor = [];
        rgb.forEach(function (str) {
          symcolor.push(parseInt(str));
        });
        return symcolor;
      }

      $("#save-draw-line").click(function () {
        saveGraficData(drawLineGraphicLayer, "line-graphic-data");
        lineEditGrafic = undefined;
        polygonEditGrafic = undefined;
        textEditGrafic = undefined;
      });

      function saveGraficData(lay, sessionKey) {
        var layerGraphics = lay.graphics;
        var stringGraphics = {};
        layerGraphics.forEach(function (agrf, ind) {
          stringGraphics[ind] = {
            "geometry": agrf.geometry,
            "symbol": agrf.symbol
          }
        });

        var graf = JSON.stringify(stringGraphics);
        localStorage.setItem(sessionKey, graf);
        $("#delete-draw-points, #delete-sym-draw-points, #delete-draw-line, #delete-draw-polygon").hide();
        editToolBar.deactivate();
        alertify.success("Graphics stored successfully");
      }
      $("#delete-draw-line").click(function () {
        deleteGraphics(lineEditGrafic, drawLineGraphicLayer);
        lineEditGrafic = undefined;
      });

      function deleteGraphics(graf, lay) {
        if (!graf) {
          alertify.error("Graphic cannot be found");
          return;
        }
        lay.remove(graf);
        graf = undefined;
        map.graphics.clear();
        editToolBar.deactivate();
        $("#delete-draw-points, #delete-sym-draw-points, #delete-draw-line, #delete-draw-polygon, #delete-draw-text").hide();
        alertify.success("Graphics deleted successfully");
      }

      var drawBtnsContainerMap = {
        "draw-point-btn": "draw-point-container",
        "draw-line-btn": "draw-line-container",
        "draw-polyline-btn": "draw-line-container",
        "draw-freehand-polyline-btn": "draw-line-container",
        "draw-polygon-triangle-btn": "draw-polygon-container",
        "draw-polygon-rectangle-btn": "draw-polygon-container",
        "draw-polygon-circle-btn": "draw-polygon-container",
        "draw-polygon-ellipse-btn": "draw-polygon-container",
        "draw-polygon-btn": "draw-polygon-container",
        "draw-freehand-polygon-btn": "draw-polygon-container",
        "draw-text-btn": "draw-text-container"
      }
      var drawLineBtns = {
        "draw-line-btn": "draw-line",
        "draw-polyline-btn": "draw-polyline",
        "draw-freehand-polyline-btn": "draw-freehand-polyline",
        "draw-polygon-triangle-btn": "draw-polygon-triangle",
        "draw-polygon-rectangle-btn": "draw-polygon-rectangle",
        "draw-polygon-circle-btn": "draw-polygon-circle",
        "draw-polygon-ellipse-btn": "draw-polygon-ellipse",
        "draw-polygon-btn": "draw-polygon",
        "draw-freehand-polygon-btn": "draw-freehand-polygon",
      }
      var allineBtns = ["draw-line", "draw-polyline", "draw-freehand-polyline"];
      var alpolygonBtns = ["draw-polygon", "draw-freehand-polygon", "draw-polygon-triangle", "draw-polygon-rectangle", "draw-polygon-circle", "draw-polygon-ellipse"];
      $(".draw-buttons").click(function () {
        $("#draw-buttons-container").hide();
        $(".draw-go-2-back").css("display", "flex");
        $("#draw-options-container").show();
        $("#draw-options-container .draw-mode-inner").hide();
        $("#draw-option-header").text($(this).children("span").text());
        $("#" + drawBtnsContainerMap[$(this).prop("id")]).show();
        makeDrawBtnsVisible($(this).prop("id"));
      });

      function makeDrawBtnsVisible(containerID) {
        allineBtns.forEach(function (aid) {
          $("#" + aid).hide();
        });
        $("#" + drawLineBtns[containerID]).show();
        alpolygonBtns.forEach(function (aid) {
          $("#" + aid).hide();
        });
        $("#" + drawLineBtns[containerID]).show();
      }

      $(".draw-back-btn").click(function () {
        $("#draw-buttons-container").show();
        $(".draw-go-2-back").hide();
        $("#draw-options-container").hide();
        $("#draw-options-container .draw-mode-inner").show();
      });

      $("#polygon-outline-style div").click(function () {
        $("#polygon-outline-style div svg").removeClass("selected-polygon-outline-symbol");
        $(this).children('svg').addClass("selected-polygon-outline-symbol");
        redrawGraphicPolygon();
      });

      $("#polygon-style").on("change", function () {
        var selectedStyle = $("#polygon-style").val();
        if (selectedStyle == "picture") {
          $("#polygon-pic-fill").css("display", "flex");
          $("#polygon-color").hide();
          $("#polygon-opacity").hide();
          if(!($("#draw-polygon-picture").val())) {
            alertify.error("Please provide input image!.");
            return;
          }
        } else if (selectedStyle == "esriSFSSolid") {
          $("#polygon-color").css("display", "flex");
          $("#polygon-opacity").css("display", "flex");
          $("#polygon-pic-fill").hide()
        } else {
          $("#polygon-color").hide();
          $("#polygon-opacity").hide();
          $("#polygon-pic-fill").hide()
        }
        redrawGraphicPolygon();
      });

      $("#poly-fill-transp-slider").change(function () {
        $("#poly-trans-input").val($("#poly-fill-transp-slider").val());
        redrawGraphicPolygon();
      });

      $('#poly-trans-input').change(function () {
        var transp = $('#poly-trans-input').val();
        if (transp > 100) {
          $('#poly-trans-input').val(100)
        }
        $("#poly-fill-transp-slider").val(transp);
      });

      $('#poly-trans-input').keypress(function (e) {
        var transp = $('#poly-trans-input').val();
        var key = e.which;
        if (key == 13)  // the enter key code
        {
          if (transp > 100) {
            $('#poly-trans-input').val(100)
          }
          $("#poly-fill-transp-slider").val(transp);
        }
      });

      $("#draw-polygon-triangle").click(function () {
        createSFS();
        drawToolBar.activate("triangle")
      });

      $("#draw-polygon-rectangle").click(function () {
        createSFS();
        drawToolBar.activate("extent")
      });

      $("#draw-polygon-circle").click(function () {
        createSFS();
        drawToolBar.activate("Circle")
      });

      $("#draw-polygon-ellipse").click(function () {
        createSFS();
        drawToolBar.activate("ellipse")
      });

      $("#draw-polygon").click(function () {
        createSFS();
        drawToolBar.activate("polygon")
      });

      $("#draw-freehand-polygon").click(function () {
        createSFS();
        drawToolBar.activate("freehandpolygon")
      });

      $("#polygon-line-size").on("change", redrawGraphicPolygon);
      $("#polygon-line-size").on("mousewheel", redrawGraphicPolygon);

      function createSFS() {
        var style = $("#polygon-style").val();
        var fillcolr = getSymColor("polygon-colorSelector");
        fillcolr.push(parseInt($("#poly-fill-transp-slider").val()) / 100);
        var sfs;
        var outlineStyle = $(".selected-polygon-outline-symbol").parent('div').prop("title");
        var outlinecolr = getSymColor("polygon-outline-colorSelector");
        var outlinesym = new SimpleLineSymbol({
          "type": "esriSLS",
          "style": linePreviewSVG.slsMapping[outlineStyle]
        });
        outlinesym.setColor(new Color(outlinecolr));
        outlinesym.setWidth(parseInt($("#polygon-line-size").val()));

        if (style == "picture") {
          var file = $("#draw-polygon-picture").prop("files")[0];
          if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function (event) {
              sfs = new PictureFillSymbol(reader.result, outlinesym, 20, 20)
              drawGraphicSymbol = sfs;
              redrawGraphicPolygon();
            };
          } else {
            if (polygonEditGrafic && polygonEditGrafic.symbol.url) {
              sfs = new PictureFillSymbol(polygonEditGrafic.symbol.url, outlinesym, 20, 20)
              drawGraphicSymbol = sfs;
            } else if ($("#polygon-fill-img-preview img").prop("src")) {
              sfs = new PictureFillSymbol($("#polygon-fill-img-preview img").prop("src"), outlinesym, 20, 20)
              drawGraphicSymbol = sfs;
            } else {
              alertify.error("Please provide fill image!.")
            }
          }
        } else {
          sfs = new SimpleFillSymbol({
            "type": "esriSFS",
            "style": $("#polygon-style").val()
          });
          sfs.setColor(new Color(fillcolr));
          sfs.setOutline(outlinesym);
          drawGraphicSymbol = sfs;
        }
      }

      $("#draw-polygon-picture").change(function () {
        var file = $("#draw-polygon-picture").prop("files")[0];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function (event) {
          $("#polygon-fill-img-preview").empty();
          $("#polygon-fill-img-preview").append('<img src="' + reader.result + '" alt="Fill Image" style="width: 25px; height: 25px;">');
          redrawGraphicPolygon();
        };
      });

      $("#save-draw-polygon").click(function () {
        saveGraficData(drawPolygonGraphicLayer, "polygon-graphic-data");
        polygonEditGrafic = undefined;
      });

      $("#delete-draw-polygon").click(function () {
        deleteGraphics(polygonEditGrafic, drawPolygonGraphicLayer);
        polygonEditGrafic = undefined;
      });

      $("#clear-polygon-pic-selection").click(function () {
        $("#draw-polygon-picture").empty();
        $("#draw-polygon-picture").text("or drag and drop files here");
        $("#draw-point-picture").val("");
      });

      $("#draw-text").click(function() {
        createTS();
        drawToolBar.activate("point");
      });

      function createTS() {
        var fontsize = $("#text-font-size").val();
        var fontstyle = $("#text-font-style").val();
        var fontweight = $("#text-font-weight").val();
        var fontfamily = $("#text-family").val();
        var fontdecoration = $("#text-font-decoration").val();
        var font = new Font({
          family: fontfamily,
          style: fontstyle,
          weight: fontweight,
          decoration: fontdecoration
        });
        font.setSize(fontsize+"px");
        var text = $("#text-text").val();
        var textcolor = getSymColor("text-colorSelector");
        var texthorialign = $("#text-hori-alignment").val();
        var textvertalign = $("#text-vert-alignment").val();
        var texthalocolor = getSymColor("text-halo-colorSelector");
        var texthalowidth = $("#text-halo-width").val();
        var textangle = $("#text-angle").val();
        drawGraphicSymbol = new TextSymbol({
          "type" : "esriTS",
          "color" : textcolor,
          "verticalAlignment" : textvertalign,
          "horizontalAlignment" : texthorialign,
          "text" : text
        });
        drawGraphicSymbol.setFont(font);
        drawGraphicSymbol.setAngle(parseInt(textangle));
        if($('#text-halo-apply').is(':checked')) {
          drawGraphicSymbol.setHaloSize(parseInt(texthalowidth));
          drawGraphicSymbol.setHaloColor(new Color(texthalocolor));
        }
      }

      $("#save-draw-text").click(function() {
        saveGraficData(drawTextGraphicLayer, "text-graphic-data");
        $("#delete-draw-text").hide();
        textEditGrafic = undefined;
      });

      $("#delete-draw-text").click(function() {
        deleteGraphics(textEditGrafic, drawTextGraphicLayer);
        textEditGrafic = undefined;
      });

      $("#text-halo-apply").change(function() {
        if(this.checked) {
          $("#text-halo-color").css("display", "block");
          $("#text-halo-width-container").css("display", "block");
        } else {
          $("#text-halo-color").css("display", "none");
          $("#text-halo-width-container").css("display", "none");
        }
      });

      $("#text-text").change(redrawGraphicText);
      $("#text-hori-alignment").change(redrawGraphicText);
      $("#text-vert-alignment").change(redrawGraphicText);
      $("#text-angle").change(redrawGraphicText);
      $("#text-angle").on("mousewheel", redrawGraphicText);
      $("#text-halo-width").change(redrawGraphicText);
      $("#text-halo-width").on("mousewheel", redrawGraphicText);
      $("#text-family").change(redrawGraphicText);
      $("#text-font-size").change(redrawGraphicText);
      $("#text-font-size").on("mousewheel", redrawGraphicText);
      $("#text-font-style").change(redrawGraphicText);
      $("#text-font-weight").change(redrawGraphicText);
      $("#text-font-decoration").change(redrawGraphicText);

      var adddataconst = new AddData("tool-adddata-container", map);

      $(".map-single-widgets").click(function() {
        var containerDisplay = $(".single-widget-container").css("display");
        $(".map-single-widgets").empty();
        if(containerDisplay == "none") {
          $(".single-widget-container").css("display", "flex");
          $(".map-single-widgets").append('<i class="fas fa-chevron-up"></i>')
          $(".map-single-widgets").css("top", "calc(11vh + 44px)");
        } else {
          $(".single-widget-container").hide();
          $(".map-single-widgets").append('<i class="fas fa-chevron-down"></i>')
          $(".map-single-widgets").css("top", "11vh");
        }
      });
    });
});
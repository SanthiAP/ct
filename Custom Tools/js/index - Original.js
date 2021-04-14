$(document).ready(function () {
  var map, bmFPLayer, bmFPSymbol, bmFPLabel;
  var drawGraphicSymbol;
  var drawPointGraphicLayer, drawLineGraphicLayer;
  var drawToolBar, editToolBar;
  var pointDeleteGrafic;
  var lineEditGrafic;
  const nullArray = ["", undefined, null, NaN];
  var bookmarks = {};
  var linePreviewSVG = lineSVG;
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
  // var bmscroll = new PerfectScrollbar(".bm-content-container");
  var titleMapping = {
    "tool-bm": "BookMark",
    "tool-draw": "Draw"
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

    "esri/toolbars/draw",
    "esri/toolbars/edit"
  ],
    function (Map,
      Color,
      Graphic,
      Extent, Polygon, Point, Multipoint, Polyline, geometryEngine,
      GraphicsLayer,
      SimpleFillSymbol, TextSymbol, Font, SimpleLineSymbol, PictureMarkerSymbol, SimpleMarkerSymbol,
      Draw, Edit
    ) {

      map = new Map("map-div", {
        basemap: "topo",
        center: [-122.45, 37.75],
        zoom: 13
      });

      map.on("load", mapLoaded);

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

      map.addLayers([drawPointGraphicLayer, drawLineGraphicLayer, bmFPLabel, bmFPLayer]);

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

      drawLineGraphicLayer.on("click", function(evt) {
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
        $("#line-style div[title='"+ linePreviewSVG.slsTitleMapping[sym.style] +"'] svg").addClass('selected-line-symbol');
        setLinePreview("layerKlik")
      });

      function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
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
        $("#delete-draw-points, #delete-sym-draw-points, #delete-draw-line").hide();
        editToolBar.deactivate();
        lineEditGrafic = undefined;
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

      function addGraphic(evt) {
        drawToolBar.deactivate();
        switch (evt.geometry.type) {
          case "point":
            drawPointGraphicLayer.add(new Graphic(evt.geometry, drawGraphicSymbol));
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
      }

      $(".side-nav-header svg").click(function () {
        $(".upside a").removeClass("active-tool");
        closeNav();
      })

      function closeNav() {
        $("#map-container").css("width", "100%");
        $("#tools-content-container").css("width", "0%");
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

      $("#draw-point-deactivate, #draw-sym-point-deactivate, #draw-line-deactivate, #draw-polygon-deactivate").click(function () {
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
            if (id == "pt-colorSelector") {
              ptSelectorChange(hex)
            } else {
              lineSelectorChange(hex);
            }
          }
        });
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
        lineEditGrafic = graf;
        activateLineEditTB(lineEditGrafic);
        drawLineGraphicLayer.add(graf);
      }

      $("#pt-size, #pt-angle").on("change", setPointPreview)

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

      $("#line-size").on("change",         setLinePreview);
      $("#line-style div[title='Solid'] svg").trigger("click");
      function setLinePreview(hint) {
        var selectedStyle = $(".selected-line-symbol")
        $("#line-symbol-preview").empty();
        $("#line-symbol-preview").append(linePreviewSVG[selectedStyle.parent('div').prop("title")]);
        $("#line-symbol-preview svg path").css("stroke", $("#line-colorSelector div").css("background-color"));
        $("#line-symbol-preview svg path").css("stroke-width", $("#line-size").val());
        if(lineEditGrafic && !hint) {
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
        $("#delete-draw-points, #delete-sym-draw-points, #delete-draw-line").hide();
        editToolBar.deactivate();
        alertify.success("Graphics stored successfully");
      }
      $("#delete-draw-line").click(function() {
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
        $("#delete-draw-points, #delete-sym-draw-points, #delete-draw-line").hide();
        alertify.success("Graphics deleted successfully");
      }
    });
});
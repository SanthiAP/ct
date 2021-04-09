$(document).ready(function () {
  var map, bmFPLayer, bmFPSymbol;
  const nullArray = ["", undefined, null, NaN];
  var bookmarks = {};
  var sessionBMData = localStorage.getItem("bm-data");
  // var bmscroll = new PerfectScrollbar(".bm-content-container");
  var titleMapping = {
    "tool-bm": "BookMark",
    "tool-draw": "Draw"
  }
  require(["esri/map",
  "esri/Color",
  "esri/graphic",

  "esri/geometry/Extent",
  "esri/geometry/geometryEngine",

  "esri/layers/GraphicsLayer",

  "esri/symbols/SimpleFillSymbol",
  "esri/symbols/SimpleLineSymbol"
  ],
    function (Map,
      Color,
      Graphic,
      Extent, geometryEngine,
      GraphicsLayer,
      SimpleFillSymbol, SimpleLineSymbol
      ) {

      map = new Map("map-div", {
        basemap: "topo",
        center: [-122.45, 37.75],
        zoom: 13
      });

      bmFPLayer = new GraphicsLayer({
        "id": "bookmark"
      });
      map.addLayer(bmFPLayer);

      bmFPSymbol = new SimpleFillSymbol(
        "solid",  
        new SimpleLineSymbol("solid", new Color([232,104,80]), 2),
        new Color([232,104,80,0.25])
      );

      loadSessionData();
      function loadSessionData() {
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

        map.setExtent(new Extent(bmExt));
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
      function bmCheckBoxChange () {
        if ($("#show-all-bm").is(':checked')) {
          showAllBMFootprint();
          return;
        }
        removeAllBMFootprint();
      }

      function showAllBMFootprint() {
        Object.keys(bookmarks).forEach(function(abm) {
          var fpAttr = {
            "BookmarkName": abm
          }
          var fpExt = new Extent(bookmarks[abm]);
          var afp = new Graphic(fpExt, bmFPSymbol, fpAttr);
          bmFPLayer.add(afp);
        });
        setBMExtent();
      }

      function setBMExtent() {
        var allFPExts = [];
        var unionExt;
        Object.keys(bookmarks).forEach(function(abm) {
          unionExt = geometryEngine.union([bookmarks[abm], unionExt])
          allFPExts.push(bookmarks[abm]);
        })
        var unionExt = geometryEngine.union(allFPExts);
        map.setExtent(new Extent(unionExt));
      }

      function removeAllBMFootprint() {
        bmFPLayer.clear();
      }
    });
})
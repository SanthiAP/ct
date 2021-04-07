$(document).ready(function () {
  var map;
  var titleMapping = {
    "tool-bm": "BookMark",
    "tool-draw": "Draw"
  }
  require(["esri/map"],
    function (Map) {

      map = new Map("map-div", {
        basemap: "topo",
        center: [-122.45, 37.75],
        zoom: 13
      });

      $(".upside a").click(function() {
        var clickedElem = $(this);
        $(".upside a").removeClass("active-tool");
        clickedElem.addClass("active-tool");
        openNav();
        $(".side-nav-header h3").text(titleMapping[clickedElem.prop("id")]);
      });

      function openNav() {
        $("#map-container").css("width", "70%");
        $("#tools-content-container").css("width", "29%");
      }

      $(".side-nav-header svg").click(function() {
        $(".upside a").removeClass("active-tool");
        closeNav();
      })

      function closeNav() {
        $("#map-container").css("width", "100%");
        $("#tools-content-container").css("width", "0%");
      }
    });
})
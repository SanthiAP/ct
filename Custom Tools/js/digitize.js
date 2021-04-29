var disDigitize;
class DigitizeFeature {
  constructor(divId, map, attributeDiv) {
    this.divId = divId;
    this.map = map;
    this.attrDiv = attributeDiv;
    disDigitize = this;
    disDigitize.createDigitizeBtns();
    disDigitize.layerAdded();
  }

  createDigitizeBtns() {
    var elems = `
      <div class="digitize-btn-container">
        <button id="digitize-feat-select" title="Select Feature">
          <img src="images/select_feature.png" alt="Select Feature">
        <button>
      </div>
    `;
    $("#"+ disDigitize.divId ).append(elems);
  }

  layerAdded() {
    disDigitize.map.on("layer-add-result", function(evt) {
      if(!evt.layer) {
        alertify.error("Couldn't find added layer");
        return;
      }

      var capabilities = evt.layer.capabilities
      if(!capabilities)
        return;

      if(capabilities.indexOf("Create") == -1 ||
      capabilities.indexOf("Update") == -1 ||
      capabilities.indexOf("Delete") == -1 ) 
        return;
      
      console.log(evt.layer)

    });
  }
}
"use strict";
var ActivationType;
(function (ActivationType) {
    ActivationType[ActivationType["Activation"] = 0] = "Activation";
    ActivationType[ActivationType["Partial"] = 1] = "Partial";
    ActivationType[ActivationType["Deactivation"] = 2] = "Deactivation";
    ActivationType[ActivationType["Inactive"] = 3] = "Inactive";
})(ActivationType || (ActivationType = {}));
var AirspaceCategory;
(function (AirspaceCategory) {
    AirspaceCategory[AirspaceCategory["C"] = 0] = "C";
    AirspaceCategory[AirspaceCategory["D"] = 1] = "D";
    AirspaceCategory[AirspaceCategory["E"] = 2] = "E";
    AirspaceCategory[AirspaceCategory["CTR"] = 3] = "CTR";
    AirspaceCategory[AirspaceCategory["R"] = 4] = "R";
    AirspaceCategory[AirspaceCategory["Q"] = 5] = "Q";
})(AirspaceCategory || (AirspaceCategory = {}));
class ColouredText {
    constructor(text, colour, backgroundColour) {
        this.text = text;
        this.colour = colour;
        this.backgroundColour = backgroundColour;
    }
}

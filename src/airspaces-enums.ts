enum ActivationType {
    Activation = 0,
    Partial = 1,
    Deactivation = 2,
    Inactive = 3
}

enum AirspaceCategory {
    C,
    D,
    E,
    CTR,
    R,
    Q
}

class ColouredText {
    constructor(text: string, colour: string, backgroundColour: string) {
        this.text = text;
        this.colour = colour;
        this.backgroundColour = backgroundColour;
    }

    text: string;
    colour: string;
    backgroundColour: string;
}

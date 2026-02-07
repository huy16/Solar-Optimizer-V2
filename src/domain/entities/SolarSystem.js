/**
 * Entity: SolarSystem
 * Represents the physical configuration of the Solar PV System.
 */
export class SolarSystem {
    constructor(
        sizeKw = 0,
        panelSpecs = null,
        inverters = [], // Array of { model, quantity }
        orientation = 'South',
        tilt = 12
    ) {
        this.sizeKw = sizeKw;
        this.panelSpecs = panelSpecs;
        this.inverters = inverters;
        this.orientation = orientation;
        this.tilt = tilt;
    }

    get totalInverterPowerAc() {
        return this.inverters.reduce((sum, item) => sum + (item.model.acPower * item.quantity), 0);
    }
}

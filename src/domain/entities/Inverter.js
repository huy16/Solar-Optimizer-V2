/**
 * Entity: Inverter
 * Represents a Solar Inverter model.
 */
export class Inverter {
    constructor(
        id,
        name,
        acPowerKw,
        maxPvKw = 0
    ) {
        this.id = id;
        this.name = name;
        this.acPowerKw = acPowerKw;
        this.maxPvKw = maxPvKw;
    }
}

/**
 * Entity: Battery (BESS)
 * Represents the Battery Energy Storage System configuration.
 */
export class Battery {
    constructor(
        id,
        name,
        capacityKwh = 0,
        maxPowerKw = 0,
        efficiency = 0.95,
        dod = 0.90
    ) {
        this.id = id;
        this.name = name;
        this.capacityKwh = capacityKwh;
        this.maxPowerKw = maxPowerKw;
        this.efficiency = efficiency;
        this.dod = dod;
    }

    get usableCapacity() {
        return this.capacityKwh * this.dod;
    }
}

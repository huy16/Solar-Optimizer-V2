import { HardwareRepository } from '../../domain/repositories/HardwareRepository';
import { INVERTER_DB, BESS_DB, PANEL_SPECS } from '../sources/HardwareDatabase';

export class HardwareRepositoryImpl extends HardwareRepository {
    getInverters() {
        return INVERTER_DB;
    }
    getBatteries() {
        return BESS_DB;
    }
    getPanelSpecs() {
        return PANEL_SPECS;
    }
}

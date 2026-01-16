import { useState, useCallback } from 'react';
import { BESS_OPTIONS, INVERTER_OPTIONS, INVERTER_DB, BESS_DB } from '../../data/sources/HardwareDatabase';

export const useSolarConfiguration = (initialParams, initialTechParams) => {
    // --- STATE SYSTEM CONFIG ---
    const [inv1Id, setInv1Id] = useState(INVERTER_OPTIONS[0]?.value || '');
    const [inv1Qty, setInv1Qty] = useState(0);
    const [inv2Id, setInv2Id] = useState('');
    const [inv2Qty, setInv2Qty] = useState(0);

    const [selectedBess, setSelectedBess] = useState(BESS_OPTIONS[0]?.value || 'custom');
    const [bessKwh, setBessKwh] = useState(0);
    const [bessMaxPower, setBessMaxPower] = useState(0);
    const [isGridCharge, setIsGridCharge] = useState(false);

    // --- STATE PARAMETERS ---
    const [params, setParams] = useState(initialParams);
    const [techParams, setTechParams] = useState(initialTechParams);
    const [targetKwp, setTargetKwp] = useState(0);


    // Auto Select Inverter
    const handleAutoSelectInverter = useCallback(() => {
        if (targetKwp <= 0) return;
        const targetAC = targetKwp / 1.25; // DC/AC ratio ~ 1.25
        const bestInv = INVERTER_DB.reduce((prev, curr) =>
            Math.abs(curr.acPower - targetAC) < Math.abs(prev.acPower - targetAC) ? curr : prev
        );

        if (bestInv) {
            const qty = Math.ceil(targetAC / bestInv.acPower);
            setInv1Id(bestInv.id);
            setInv1Qty(qty);
            setInv2Id('');
            setInv2Qty(0);
        }
    }, [targetKwp]);

    // Handle BESS Selection
    const handleBessSelect = useCallback((val) => {
        setSelectedBess(val);
        // Fix: Lookup from BESS_DB (full object) not BESS_OPTIONS (dropdown label/value)
        const selectedModel = BESS_DB.find(m => m.id === val);
        if (selectedModel) {
            setBessKwh(selectedModel.capacity);
            setBessMaxPower(selectedModel.maxPower);
        } else if (val === 'custom') {
            // Keep existing values or reset? User might want to type manual
            // setBessKwh(0); setBessMaxPower(0); 
        }
    }, []);

    // Calculate Totals
    const inv1 = INVERTER_DB.find(i => i.id === inv1Id);
    const inv2 = INVERTER_DB.find(i => i.id === inv2Id);
    const totalACPower = (inv1 ? inv1.acPower * inv1Qty : 0) + (inv2 ? inv2.acPower * inv2Qty : 0);

    // Sync inverter max AC to tech params (auto update limit)
    const inverterMaxAcKw = totalACPower > 0 ? totalACPower : (targetKwp / 1.1); // Fallback if no inverter selected

    return {
        inv1Id, setInv1Id,
        inv1Qty, setInv1Qty,
        inv2Id, setInv2Id,
        inv2Qty, setInv2Qty,
        selectedBess, handleBessSelect,
        bessKwh, setBessKwh,
        bessMaxPower, setBessMaxPower,
        isGridCharge, setIsGridCharge,
        params, setParams,
        techParams, setTechParams,
        targetKwp, setTargetKwp,
        handleAutoSelectInverter,
        totalACPower,
        inverterMaxAcKw
    };
};

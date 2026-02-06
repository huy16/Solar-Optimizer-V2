import { useState, useCallback } from 'react';
import { BESS_OPTIONS, INVERTER_OPTIONS, INVERTER_DB, BESS_DB } from '../../data/sources/HardwareDatabase';
import { execute as optimizeSystem } from '../../domain/usecases/OptimizeSystem';
import { execute as calculateEnergy } from '../../domain/usecases/CalculateEnergyGeneration';

// Weather Scenario Configuration
export const WEATHER_SCENARIOS = {
    normal: { label: 'Bình thường', labelEn: 'Normal', icon: '☀️', derate: 1.0 },
    rainy: { label: 'Mưa nhiều', labelEn: 'Rainy Year', icon: '🌦️', derate: 0.85 },
    bad: { label: 'Thời tiết xấu', labelEn: 'Bad Weather', icon: '🌧️', derate: 0.75 },
    extreme: { label: 'Cực đoan', labelEn: 'Extreme', icon: '⛈️', derate: 0.70 }
};

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
    const [bessStrategy, setBessStrategy] = useState('self-consumption'); // 'self-consumption' | 'peak-shaving'
    const [weatherScenario, setWeatherScenario] = useState('normal'); // Weather simulation

    // --- STATE PARAMETERS ---
    const [params, setParams] = useState(initialParams);
    const [techParams, setTechParams] = useState(initialTechParams);
    const [targetKwp, setTargetKwp] = useState(0);


    // Auto Select Inverter
    // Auto Suggest Configuration (Inverter + BESS)
    const handleMagicSuggest = useCallback(() => {
        if (targetKwp <= 0) return;

        // 1. Select Inverter (DC/AC ~ 1.25)
        const targetAC = targetKwp / 1.25;
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

        // 2. Suggest BESS (approx 20% of Solar Capacity, 2h duration)
        // ONLY suggest if currently 'custom' with 0 capacity (initial state)
        if (selectedBess === 'custom' && bessKwh === 0) {
            const suggestedKwh = Math.round(targetKwp * 0.2); // 20% penetration
            setBessKwh(suggestedKwh);
            setBessMaxPower(Math.round(suggestedKwh / 2)); // 2-hour system
        }
    }, [targetKwp, selectedBess, bessKwh]);

    // Handle System Optimization
    const handleOptimize = useCallback((processedData, prices, financialParams) => {
        if (!processedData || processedData.length === 0) return;

        const result = optimizeSystem(processedData, prices, financialParams, techParams);
        if (result && result.best) {
            const { kwp, bessKwh: bestBessKwh, bessKw: bestBessKw } = result.best;

            // Apply recommended Solar size
            setTargetKwp(kwp);

            // Apply recommended BESS size
            setSelectedBess('custom');
            setBessKwh(bestBessKwh);
            setBessMaxPower(bestBessKw);

            // Auto-select inverters for the new Solar size
            const targetAC = kwp / 1.25;
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
            return result.best;
        }
        return null;
    }, [techParams]);

    // Handle BESS-only Optimization (Fixed Solar Size)
    const handleOptimizeBess = useCallback((processedData, prices, financialParams) => {
        if (!processedData || processedData.length === 0) return;

        const result = optimizeSystem(processedData, prices, financialParams, { ...techParams, fixedKwp: targetKwp });
        if (result && result.best) {
            const { bessKwh: bestBessKwh, bessKw: bestBessKw } = result.best;

            // Apply recommended BESS size only
            setSelectedBess('custom');
            setBessKwh(bestBessKwh);
            setBessMaxPower(bestBessKw);
            return result.best;
        }
        return null;
    }, [techParams, targetKwp]);

    // Handle BESS Suggestion based on curtailment
    const handleSuggestBessSize = useCallback((processedData) => {
        if (!processedData || processedData.length === 0 || targetKwp <= 0) return;

        // 1. Run a baseline simulation (0 battery) for current sizing
        const stats = calculateEnergy(targetKwp, processedData, 0, 0, false, false, params, techParams);

        if (!stats || !stats.hourlyBatteryData) return;

        // 2. Identify Waste Energy (Curtailment + Export) that could be battery storage
        const dailyWaste = new Map();
        stats.hourlyBatteryData.forEach(p => {
            // Robust date handling
            const dateObj = (p.date instanceof Date) ? p.date : new Date(p.date || p.timestamp);
            if (isNaN(dateObj.getTime())) return;

            const dateStr = dateObj.toDateString();
            // Use curtailed + exported (total energy that didn't go to self-consumption)
            const waste = (p.curtailed || 0) + (p.exported || 0);
            dailyWaste.set(dateStr, (dailyWaste.get(dateStr) || 0) + waste);
        });

        const dailyValues = Array.from(dailyWaste.values()).sort((a, b) => b - a);
        if (dailyValues.length === 0) return;

        // Take the 75th percentile (to capture significant waste without picking the absolute max day)
        const targetIndex = Math.floor(dailyValues.length * 0.25);
        const suggestedKwh = Math.round(dailyValues[targetIndex]);

        if (suggestedKwh > 0) {
            setSelectedBess('custom');
            setBessKwh(suggestedKwh);
            setBessMaxPower(Math.round(suggestedKwh / 2)); // Default 2h system
        }
    }, [targetKwp, params, techParams]);

    // Handle BESS Selection
    const handleBessSelect = useCallback((val) => {
        setSelectedBess(val);
        if (val === 'none') {
            setBessKwh(0);
            setBessMaxPower(0);
            return;
        }
        const selectedModel = BESS_DB.find(m => m.id === val);
        if (selectedModel) {
            setBessKwh(selectedModel.capacity);
            setBessMaxPower(selectedModel.maxPower);
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
        handleMagicSuggest,
        handleOptimize,
        handleOptimizeBess,
        handleSuggestBessSize,
        bessStrategy, setBessStrategy,
        weatherScenario, setWeatherScenario,
        totalACPower,
        inverterMaxAcKw
    };
};

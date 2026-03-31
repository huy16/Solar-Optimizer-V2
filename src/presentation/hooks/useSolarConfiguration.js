import { useState, useCallback } from 'react';
import { BESS_OPTIONS, INVERTER_OPTIONS, INVERTER_DB, BESS_DB } from '../../data/sources/HardwareDatabase';
import { execute as optimizeSystem } from '../../domain/usecases/OptimizeSystem';
import { execute as suggestSafeCapacity } from '../../domain/usecases/SuggestSafeCapacity';
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

    const [customInv1Power, setCustomInv1Power] = useState(0);
    const [customInv2Power, setCustomInv2Power] = useState(0);

    const [selectedBess, setSelectedBess] = useState(BESS_OPTIONS[0]?.value || 'custom');
    const [bessKwh, setBessKwh] = useState(0);
    const [bessMaxPower, setBessMaxPower] = useState(0);
    const [isGridCharge, setIsGridCharge] = useState(false);
    const [bessStrategy, setBessStrategy] = useState('self-consumption'); // 'self-consumption' | 'peak-shaving'
    const [weatherScenario, setWeatherScenario] = useState('normal'); // Weather simulation
    const [pricingType, setPricingType] = useState('retail_manufacturing'); // Default pricing type
    const [voltageLevelId, setVoltageLevelId] = useState('22kv_110kv'); // Default voltage level

    // --- STATE PARAMETERS ---
    const [params, setParams] = useState(initialParams);
    const [techParams, setTechParams] = useState({
        ...initialTechParams,
        weatherDerate: 1.0,
        bessEff: 0.95, // Single way efficiency? Or round trip? Let's assume Single Way for now 0.95 * 0.95 = ~90% RT. 
        // Actually, let's make it Round Trip in UI (0.9) and calc sqrt for calc? 
        // Plan said "Round-trip Efficiency". Let's store "bessEffRoundTrip" = 0.90.
        bessEffRoundTrip: 0.90,
        bessDod: 0.90,
        oversizingRatio: 1.25 // Default DC/AC Ratio
    });
    const [targetKwp, setTargetKwp] = useState(0);

    // Update Derate when Weather Scenario changes
    const handleWeatherChange = (scenarioKey) => {
        setWeatherScenario(scenarioKey);
        const scenario = WEATHER_SCENARIOS[scenarioKey];
        if (scenario) {
            setTechParams(prev => ({ ...prev, weatherDerate: scenario.derate }));
        }
    };



    // Auto Select Inverter
    // Helper: Auto Select Inverters (Main + Secondary) to match target AC
    const autoSelectInverters = useCallback((targetAC) => {
        if (targetAC <= 0) return;

        const sortedInverters = [...INVERTER_DB].sort((a, b) => b.acPower - a.acPower);
        let bestMain = sortedInverters[0];
        let mainQty = 0;

        for (const inv of sortedInverters) {
            if (targetAC >= inv.acPower) {
                bestMain = inv;
                mainQty = Math.floor(targetAC / inv.acPower);
                break;
            }
        }

        if (mainQty === 0) {
            bestMain = sortedInverters[sortedInverters.length - 1]; // Smallest
            mainQty = 1;
            setInv1Id(bestMain.id);
            setInv1Qty(mainQty);
            setInv2Id('');
            setInv2Qty(0);
            return;
        }

        const remainingAC = targetAC - (bestMain.acPower * mainQty);

        if (remainingAC > 2) { // Add sub-inverter if remaining > 2kW
            let bestSub = null;
            let minDiff = Infinity;

            // Find smallest inverter that covers remainingAC
            for (const inv of sortedInverters) {
                const diff = inv.acPower - remainingAC;
                if (diff >= 0 && diff < minDiff) {
                    minDiff = diff;
                    bestSub = inv;
                }
            }

            if (!bestSub) {
                bestSub = sortedInverters.reduce((prev, curr) =>
                    Math.abs(curr.acPower - remainingAC) < Math.abs(prev.acPower - remainingAC) ? curr : prev
                );
            }

            if (bestSub.id === bestMain.id) {
                mainQty += 1;
                setInv1Id(bestMain.id);
                setInv1Qty(mainQty);
                setInv2Id('');
                setInv2Qty(0);
            } else {
                setInv1Id(bestMain.id);
                setInv1Qty(mainQty);
                setInv2Id(bestSub.id);
                setInv2Qty(1);
            }
        } else {
            setInv1Id(bestMain.id);
            setInv1Qty(mainQty);
            setInv2Id('');
            setInv2Qty(0);
        }
    }, [setInv1Id, setInv1Qty, setInv2Id, setInv2Qty]);

    // Auto Suggest Configuration (Inverter + BESS)
    const handleMagicSuggest = useCallback(() => {
        if (targetKwp <= 0) return;

        // 1. Select Inverter (DC/AC ~ techParams.oversizingRatio || 1.25)
        const ratio = techParams.oversizingRatio || 1.25;
        const targetAC = targetKwp / ratio;
        autoSelectInverters(targetAC);

        // 2. Suggest BESS (approx 20% of Solar Capacity, 2h duration)
        // ONLY suggest if currently 'custom' with 0 capacity (initial state)
        if (selectedBess === 'custom' && bessKwh === 0) {
            const suggestedKwh = Math.round(targetKwp * 0.2); // 20% penetration
            setBessKwh(suggestedKwh);
            setBessMaxPower(Math.round(suggestedKwh / 2)); // 2-hour system
        }
    }, [targetKwp, selectedBess, bessKwh]);

    // Handle Solar-Only Optimization (No BESS)
    const handleOptimizeNoBess = useCallback((processedData, prices, financialParams) => {
        if (!processedData || processedData.length === 0) return;

        // Optimize with BESS forced to 0
        const result = optimizeSystem(processedData, prices, financialParams, { ...techParams, noBess: true });
        if (result && result.best) {
            const { kwp } = result.best;

            // Apply recommended Solar size
            setTargetKwp(kwp);

            // Set BESS to 0
            setSelectedBess('none');
            setBessKwh(0);
            setBessMaxPower(0);

            // Auto-select inverters for the new Solar size
            const targetAC = kwp / (techParams.oversizingRatio || 1.25);
            autoSelectInverters(targetAC);
            return result.best;
        }
        return null;
    }, [techParams]);

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
            const targetAC = kwp / (techParams.oversizingRatio || 1.25);
            autoSelectInverters(targetAC);
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

    // Handle Expert Conservative Sizing Suggestion
    const handleSuggestSafeCapacity = useCallback((processedData) => {
        if (!processedData || processedData.length === 0) return;

        const suggestedKwp = suggestSafeCapacity(processedData, techParams);
        if (suggestedKwp && suggestedKwp > 0) {
            setTargetKwp(suggestedKwp);
            // After setting capacity, auto-select inverters
            const targetAC = suggestedKwp / (techParams.oversizingRatio || 1.25);
            autoSelectInverters(targetAC);
            return suggestedKwp;
        }
    }, []);

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

    const inv1Power = inv1Id === 'custom' ? customInv1Power : (inv1 ? inv1.acPower : 0);
    const inv2Power = inv2Id === 'custom' ? customInv2Power : (inv2 ? inv2.acPower : 0);

    const totalACPower = (inv1Power * inv1Qty) + (inv2Power * inv2Qty);

    // Sync inverter max AC to tech params (auto update limit)
    const inverterMaxAcKw = totalACPower > 0 ? totalACPower : (targetKwp / 1.1); // Fallback if no inverter selected

    return {
        inv1Id, setInv1Id,
        inv1Qty, setInv1Qty,
        inv2Id, setInv2Id,
        inv2Qty, setInv2Qty,
        customInv1Power, setCustomInv1Power,
        customInv2Power, setCustomInv2Power,
        selectedBess, handleBessSelect,
        bessKwh, setBessKwh,
        bessMaxPower, setBessMaxPower,
        isGridCharge, setIsGridCharge,
        params, setParams,
        techParams, setTechParams,
        targetKwp, setTargetKwp,
        handleMagicSuggest,
        handleOptimize,
        handleOptimizeNoBess,
        handleOptimizeBess,
        handleSuggestBessSize,
        handleSuggestSafeCapacity,
        bessStrategy, setBessStrategy,
        weatherScenario, setWeatherScenario,
        handleWeatherChange,
        totalACPower,
        inverterMaxAcKw,
        pricingType, setPricingType,
        voltageLevelId, setVoltageLevelId
    };
};


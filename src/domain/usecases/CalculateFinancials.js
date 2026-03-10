/**
 * Use Case: Calculate Financials
 * Calculates ROI, NPV, IRR, and Cash Flows based on energy stats and financial parameters.
 */

// Helper: PMT
const calculatePMT = (rate, nper, pv) => {
    if (rate === 0) return pv / nper;
    const r = rate / 100 / 12;
    return (pv * r * Math.pow(1 + r, nper)) / (Math.pow(1 + r, nper) - 1);
};

export const execute = (
    capex,
    customStats, // Result from CalculateEnergyGeneration
    prices, // { peak, normal, offPeak, gridInjection }
    params, // { years, degradation, escalation, discountRate, loan: {enable, ratio, rate, term}, tax: {rate, depreciationPeriod}, om, insurance... }
    demandChargeSaving = 0 // Annual demand charge saving from 2-component tariff peak shaving (VNĐ/year)
) => {
    // Determine defaults
    const safeCapex = Number(capex) || 0;
    const safeParams = params || {};
    const years = Number(safeParams.years) || 20;
    const degradation = Number(safeParams.degradation) ?? 0.55;
    const escalation = Number(safeParams.escalation) ?? 2.0;
    const discountRate = Number(safeParams.discountRate) ?? 10.0;
    const omPercent = Number(safeParams.omPercent) ?? 1.0;
    const insuranceRate = Number(safeParams.insuranceRate) ?? 0.5;
    const batteryLife = Number(safeParams.batteryLife) || 10;
    const batteryReplaceCostPct = Number(safeParams.batteryReplaceCostPct) ?? 60;
    const batteryReplaceCost = safeParams.batteryReplaceCost !== undefined ? Number(safeParams.batteryReplaceCost) : undefined;
    const batteryCapex = Number(safeParams.batteryCapex) || 0;
    const inverterLife = Number(safeParams.inverterLife) || 20;
    const inverterReplaceCostPct = Number(safeParams.inverterReplaceCostPct) ?? 10;
    const inverterReplaceCost = safeParams.inverterReplaceCost !== undefined ? Number(safeParams.inverterReplaceCost) : undefined;
    const omSchedule = safeParams.omSchedule || [];
    const loan = safeParams.loan || { enable: false, ratio: 70, rate: 8.0, term: 10 };
    const tax = safeParams.tax || { enable: true, rate: 20, depreciationParam: 20 };

    const majorRepairs = safeParams.majorRepairs || [];
    const carbonPrice = Number(safeParams.carbonPrice) || 0; // USD / tCO2
    const usdExchangeRate = Number(safeParams.usdExchangeRate) || 25000; // VND / USD

    const safeBatteryCapex = Number(batteryCapex) || 0;
    const systemCapexOnly = Math.max(0, safeCapex - safeBatteryCapex);

    // Initial Cash Flow
    let equity = safeCapex;
    let loanAmount = 0;

    const loanEnable = loan && loan.enable;
    const loanRatio = (loan && loan.ratio) ? Number(loan.ratio) : 0;
    const loanRate = (loan && loan.rate) ? Number(loan.rate) : 0;
    const loanTerm = (loan && loan.term) ? Number(loan.term) : 0;

    if (loanEnable) {
        loanAmount = safeCapex * (loanRatio / 100);
        equity = safeCapex - loanAmount;
    }

    let cashFlows = [-equity]; // Year 0
    let cumulativeData = [];
    let cumulative = -equity;
    let paybackYear = null;

    // Linear Depreciation
    const depPeriod = tax && tax.depreciationParam ? Number(tax.depreciationParam) : 20;
    const annualDepreciation = depPeriod > 0 ? safeCapex / depPeriod : 0;

    // Base Savings (Year 1)
    const usedPeak = customStats.usedPeak || 0;
    const usedNormal = customStats.usedNormal || 0;
    const usedOffPeak = customStats.usedOffPeak || 0;
    const totalExported = customStats.totalExported || 0;
    const totalGridCharge = customStats.totalGridCharge || 0;
    const totalDischarged = customStats.totalDischarged || 0;
    const totalUsed = customStats.totalUsed || 0;

    const pricePeak = (prices && prices.peak) ? Number(prices.peak) : 0;
    const priceNormal = (prices && prices.normal) ? Number(prices.normal) : 0;
    const priceOffPeak = (prices && prices.offPeak) ? Number(prices.offPeak) : 0;
    const priceGridInjection = (prices && prices.gridInjection) ? Number(prices.gridInjection) : 0;

    const revenueSavings = (usedPeak * pricePeak) + (usedNormal * priceNormal) + (usedOffPeak * priceOffPeak);
    const revenueExport = totalExported * priceGridInjection;
    const costGridCharge = totalGridCharge * priceOffPeak;

    // Separate BESS discharge portion from solar direct-use for degradation
    // totalUsed = solarDirectUse + bessDischarge, so bessRatio = totalDischarged / totalUsed
    const bessRevenueRatio = (totalUsed > 0 && totalDischarged > 0) ? Math.min(1, totalDischarged / totalUsed) : 0;
    const solarDirectRevenue = revenueSavings * (1 - bessRevenueRatio) + revenueExport;
    const bessDischargeRevenue = revenueSavings * bessRevenueRatio;

    const firstYearOperatingIncome = revenueSavings + revenueExport - costGridCharge;

    const taxEnable = tax && tax.enable;
    const taxRate = (tax && tax.rate) ? Number(tax.rate) : 0;

    // Loop
    let loanBalance = loanAmount;
    cashFlows = [-equity];
    cumulative = -equity;
    let hasGoneNegative = cumulative < 0;
    cumulativeData = [{ year: 0, revenue: 0, om: 0, replace: 0, net: -equity, acc: -equity }];
    paybackYear = null;

    for (let i = 1; i <= years; i++) {
        const degFactor = Math.pow(1 - (degradation || 0) / 100, i - 1);
        const escFactor = Math.pow(1 + (escalation || 0) / 100, i - 1);

        // Solar direct revenue degrades with panel degradation
        // BESS discharge revenue: panel degradation still applies (less solar input → less charge available)
        // The real fix: grid charge revenue should NOT degrade (it's from grid, not solar)
        const solarRevenueDegraded = (solarDirectRevenue + bessDischargeRevenue) * degFactor * escFactor;
        const gridChargeNotDegraded = costGridCharge * escFactor; // Grid charge cost only escalates, no degradation
        // Demand charge saving: escalates with electricity price, but NOT affected by panel degradation
        const demandSavingEscalated = (Number(demandChargeSaving) || 0) * escFactor;
        const carbonRevenue = ((totalUsed + totalExported) * degFactor * (params.co2Factor || 0.816) * (carbonPrice / 1000) * usdExchangeRate) * escFactor;
        const annualRevenue = solarRevenueDegraded - gridChargeNotDegraded + demandSavingEscalated + carbonRevenue;
        const omCost = safeCapex * ((omPercent || 0) / 100) * escFactor;
        const insCost = safeCapex * ((insuranceRate || 0) / 100);
        const scheduledOm = (omSchedule || []).filter(e => Number(e.year) === i).reduce((s, e) => s + (Number(e.amount) || 0), 0);

        let replaceCost = 0;

        // Replacement
        const effectiveBatReplacePct = batteryReplaceCost !== undefined ? batteryReplaceCost : batteryReplaceCostPct;
        if (safeBatteryCapex > 0 && i % (batteryLife || 10) === 0 && i <= years) {
            replaceCost += safeBatteryCapex * ((effectiveBatReplacePct || 0) / 100) * escFactor;
        }
        const effectiveInvReplacePct = inverterReplaceCost !== undefined ? inverterReplaceCost : inverterReplaceCostPct;
        if (i % (inverterLife || 20) === 0 && i <= years) {
            replaceCost += systemCapexOnly * ((effectiveInvReplacePct || 0) / 100) * escFactor;
        }

        // 2. Specific Major Repairs (NHẬP SỐ LẦN)
        (majorRepairs || []).forEach(mr => {
            const yr = Number(mr.year);
            const pct = Number(mr.pct);
            if (yr === i && pct > 0) {
                replaceCost += safeCapex * (pct / 100) * escFactor;
            }
        });

        // Loan
        let interestPaid = 0;
        let principalPaid = 0;
        if (loanEnable && i <= loanTerm && loanBalance > 0 && loanAmount > 0 && (loanTerm * 12) > 0) {
            const r = loanRate / 100 / 12;
            const monthlyPmt = calculatePMT(loanRate, (loanTerm * 12), loanAmount);

            for (let m = 0; m < 12; m++) {
                if (loanBalance <= 0) break;
                const interest = loanBalance * r;
                let principal = monthlyPmt - interest;

                // Final adjustment if balance < principal
                if (loanBalance < principal) {
                    principal = loanBalance;
                }

                interestPaid += interest;
                principalPaid += principal;
                loanBalance -= principal;
            }
        }

        // Tax
        const depValue = (i <= depPeriod) ? annualDepreciation : 0;
        let taxableIncome = annualRevenue - omCost - insCost - depValue - interestPaid;
        if (taxableIncome < 0) taxableIncome = 0;

        const taxPaid = taxEnable ? taxableIncome * (taxRate / 100) : 0;

        // Net Cash Flow
        const debtService = interestPaid + principalPaid;
        const netFlow = annualRevenue - omCost - insCost - scheduledOm - taxPaid - replaceCost - debtService;

        cashFlows.push(netFlow);
        const prevCumulative = cumulative;
        cumulative += netFlow;

        cumulativeData.push({
            year: i,
            net: netFlow,
            acc: cumulative,
            revenue: annualRevenue,
            opex: -(omCost + insCost),
            om: -(omCost + scheduledOm),
            debt: -debtService,
            tax: -taxPaid,
            replace: -replaceCost,
            interest: -interestPaid,
            principal: -principalPaid,
            depreciation: -depValue
        });

        if (cumulative < 0) {
            hasGoneNegative = true;
        }

        if (paybackYear === null && hasGoneNegative && cumulative >= 0) {
            if (netFlow !== 0) {
                paybackYear = (i - 1) + (Math.abs(prevCumulative) / netFlow);
            } else {
                paybackYear = i;
            }
        }
    }

    // NPV & IRR
    const safeDiscountRate = Number(discountRate) || 10;
    let npv = -equity;
    for (let i = 1; i <= years; i++) {
        npv += (cashFlows[i] || 0) / Math.pow(1 + safeDiscountRate / 100, i);
    }

    // IRR Approximation
    let irr = 0;
    let low = -0.99, high = 10.0;
    for (let k = 0; k < 100; k++) {
        const mid = (low + high) / 2;
        let val = 0;
        for (let i = 0; i <= years; i++) {
            val += (cashFlows[i] || 0) / Math.pow(1 + mid, i);
        }
        if (Math.abs(val) < 1) { irr = mid; break; }
        if (val > 0) low = mid; else high = mid;
        irr = mid;
    }

    // LCOE Calculation
    let npvCosts = (Number(equity) || 0) + (Number(loanAmount) || 0); // Initial Capex (Year 0)
    let npvEnergy = 0;

    for (let i = 1; i <= years; i++) {
        const degFactor = Math.pow(1 - (Number(degradation) || 0) / 100, i - 1);
        const escFactor = Math.pow(1 + (Number(escalation) || 0) / 100, i - 1);
        const discountFactor = Math.pow(1 + safeDiscountRate / 100, i);

        // Annual Energy (kWh). We use Net Solar delivered (Used + Exported - Grid Charged)
        // to reflect the true economic cost per useful kWh.
        const netSolarUsed = (Number(customStats.totalUsed) || 0) + (Number(customStats.totalExported) || 0) - (Number(customStats.totalGridCharge) || 0);
        const annualGen = Math.max(0, netSolarUsed) * degFactor;

        // Annual Costs (O&M + Insurance + Replacement)
        const omCost = safeCapex * ((omPercent || 0) / 100) * escFactor;
        const insCost = safeCapex * ((insuranceRate || 0) / 100);
        const scheduledOm = (omSchedule || []).filter(e => Number(e.year) === i).reduce((s, e) => s + (Number(e.amount) || 0), 0);
        let replaceCost = 0;

        // Replacement Logic (Duplicate from Main Loop - ideally refactor but keeping inline for safety)
        const effectiveBatReplacePct = batteryReplaceCost !== undefined ? batteryReplaceCost : batteryReplaceCostPct;
        if (safeBatteryCapex > 0 && i % (batteryLife || 10) === 0 && i < years) {
            replaceCost += safeBatteryCapex * ((effectiveBatReplacePct || 0) / 100) * escFactor;
        }
        const effectiveInvReplacePct2 = inverterReplaceCost !== undefined ? inverterReplaceCost : inverterReplaceCostPct;
        if (i % (inverterLife || 20) === 0 && i < years) {
            replaceCost += systemCapexOnly * ((effectiveInvReplacePct2 || 0) / 100) * escFactor;
        }

        npvCosts += (omCost + insCost + scheduledOm + replaceCost) / discountFactor;
        npvEnergy += annualGen / discountFactor;
    }

    let lcoe = 0;
    if (npvEnergy > 0) {
        lcoe = npvCosts / npvEnergy;
    }
    if (isNaN(lcoe) || !isFinite(lcoe)) lcoe = 0;

    return {
        npv,
        payback: paybackYear || years + 1,
        irr: irr * 100,
        roi: safeCapex > 0 ? (cumulativeData[years] ? (cumulativeData[years].acc + equity) / safeCapex * 100 : 0) : 0,
        cumulativeData,
        firstYearRevenue: firstYearOperatingIncome,
        lcoe: lcoe
    };
};

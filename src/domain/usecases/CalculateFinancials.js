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
    params // { years, degradation, escalation, discountRate, loan: {enable, ratio, rate, term}, tax: {rate, depreciationPeriod}, om, insurance... }
) => {
    // Determine defaults
    const safeCapex = Number(capex) || 0;
    const {
        years = 20,
        degradation = 0.55,
        escalation = 2.0,
        discountRate = 10.0,
        omPercent = 1.0,
        insuranceRate = 0.5,
        batteryLife = 10,
        batteryReplaceCostPct = 60, // % of initial battery capex
        batteryReplaceCost, // Alias from UI
        batteryCapex = 0,
        inverterLife = 10,
        inverterReplaceCostPct = 10, // % of initial system capex (excluding battery)
        loan = { enable: false, ratio: 70, rate: 8.0, term: 10 },
        tax = { enable: true, rate: 20, depreciationParam: 20 } // CIT 20%
    } = params || {};

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

    const pricePeak = (prices && prices.peak) ? Number(prices.peak) : 0;
    const priceNormal = (prices && prices.normal) ? Number(prices.normal) : 0;
    const priceOffPeak = (prices && prices.offPeak) ? Number(prices.offPeak) : 0;
    const priceGridInjection = (prices && prices.gridInjection) ? Number(prices.gridInjection) : 0;

    const revenueSavings = (usedPeak * pricePeak) + (usedNormal * priceNormal) + (usedOffPeak * priceOffPeak);
    const revenueExport = totalExported * priceGridInjection;
    const costGridCharge = totalGridCharge * priceOffPeak;
    const firstYearOperatingIncome = revenueSavings + revenueExport - costGridCharge;

    const taxEnable = tax && tax.enable;
    const taxRate = (tax && tax.rate) ? Number(tax.rate) : 0;

    // Loop
    let loanBalance = loanAmount;
    cashFlows = [-equity];
    cumulative = -equity;
    cumulativeData = [{ year: 0, net: -equity, acc: -equity }];
    paybackYear = null;

    for (let i = 1; i <= years; i++) {
        const degFactor = Math.pow(1 - (degradation || 0) / 100, i - 1);
        const escFactor = Math.pow(1 + (escalation || 0) / 100, i - 1);

        const annualRevenue = firstYearOperatingIncome * degFactor * escFactor;
        const omCost = safeCapex * ((omPercent || 0) / 100) * escFactor;
        const insCost = safeCapex * ((insuranceRate || 0) / 100);

        let replaceCost = 0;

        // Replacement
        const effectiveBatReplacePct = batteryReplaceCost !== undefined ? batteryReplaceCost : batteryReplaceCostPct;
        if (safeBatteryCapex > 0 && i % (batteryLife || 10) === 0 && i < years) {
            replaceCost += safeBatteryCapex * ((effectiveBatReplacePct || 0) / 100) * escFactor;
        }
        if (i % (inverterLife || 10) === 0 && i < years) {
            replaceCost += systemCapexOnly * ((inverterReplaceCostPct || 0) / 100) * escFactor;
        }

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
        const netFlow = annualRevenue - omCost - insCost - taxPaid - replaceCost - debtService;

        cashFlows.push(netFlow);
        const prevCumulative = cumulative;
        cumulative += netFlow;

        cumulativeData.push({
            year: i,
            net: netFlow,
            acc: cumulative,
            revenue: annualRevenue,
            opex: -(omCost + insCost),
            om: -omCost,
            debt: -debtService,
            tax: -taxPaid,
            replace: -replaceCost,
            interest: -interestPaid,
            principal: -principalPaid,
            depreciation: -depValue
        });

        if (paybackYear === null && cumulative >= 0) {
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
    if (equity > 0) {
        let low = -0.9, high = 10.0;
        for (let k = 0; k < 100; k++) {
            const mid = (low + high) / 2;
            let val = -equity;
            for (let i = 1; i <= years; i++) val += (cashFlows[i] || 0) / Math.pow(1 + mid, i);
            if (Math.abs(val) < 1) { irr = mid; break; }
            if (val > 0) low = mid; else high = mid;
            irr = mid;
        }
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
        let replaceCost = 0;

        // Replacement Logic (Duplicate from Main Loop - ideally refactor but keeping inline for safety)
        const effectiveBatReplacePct = batteryReplaceCost !== undefined ? batteryReplaceCost : batteryReplaceCostPct;
        if (safeBatteryCapex > 0 && i % (batteryLife || 10) === 0 && i < years) {
            replaceCost += safeBatteryCapex * ((effectiveBatReplacePct || 0) / 100) * escFactor;
        }
        if (i % (inverterLife || 10) === 0 && i < years) {
            replaceCost += systemCapexOnly * ((inverterReplaceCostPct || 0) / 100) * escFactor;
        }

        npvCosts += (omCost + insCost + replaceCost) / discountFactor;
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
        roi: equity > 0 ? (cumulativeData[years] ? (cumulativeData[years].acc + equity) / equity * 100 : 0) : 0,
        cumulativeData,
        firstYearRevenue: firstYearOperatingIncome,
        lcoe: lcoe
    };
};

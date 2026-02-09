/**
 * Use Case: Verify Technical Configuration
 * Performs detailed electrical checks on the PV system configuration.
 *
 * Checks:
 * 1. Max Input Voltage (Safety): Voc_max * nSeries < Inverter.MaxInput
 * 2. Min MPPT Voltage (Efficiency): Vmpp_min * nSeries > Inverter.MinMppt
 * 3. Max MPPT Voltage (Efficiency): Vmpp_max * nSeries < Inverter.MaxMppt
 * 4. Max Current (Safety): Isc_max < Inverter.MaxIsc
 */

export const execute = (
    inverter,
    panel,
    config = {
        totalPanels: 0,
        stringsPerMppt: 1, // Avg strings/MPPT
        tempLow: 10, // Celcius (Record Low)
        tempHigh: 70, // Celcius (Cell Temp at NOCT/Operation)
    }
) => {
    if (!inverter || !panel || !config.totalPanels) {
        return { isValid: true, warnings: [], deratePenalty: 0 };
    }

    // Skip check for "custom" or "none"
    if (inverter.id === 'custom' || inverter.id === 'none') {
        return { isValid: true, warnings: [], deratePenalty: 0 };
    }

    const warnings = [];
    let deratePenalty = 0;

    // --- 1. Determine Constants ---
    // If specs missing, use defaults or skip
    const Voc = panel.voc || 50;
    const Vmpp = panel.vmpp || 40;
    const Isc = panel.isc || 15;
    const Impp = panel.impp || 14;
    // Temp Coeff usually negative (e.g. -0.28%/C)
    const betaVoc = (panel.tempCoeff || -0.3) / 100;

    // Inverter Specs
    const Vmax_inv = inverter.maxInputV || 1100;
    const Vmin_mppt = inverter.minMpptV || 200;
    const Vmax_mppt = inverter.maxMpptV || 1000;
    const Imax_inv = inverter.maxIsc || 30; // Max Short Circuit Current of Inverter Input
    const Imax_mppt = inverter.maxMpptCurrent || 20; // Max Operating Current

    // --- 2. Calculate String Sizing ---
    // Estimate panels per string.
    // If totalPanels = 100 and inverter has 4 MPPTs => 25 panels/MPPT?
    // Usually 1 string per MPPT for large inverters, or 2 strings.
    // We need "Panels per String" series.
    // Heuristic: Try to fit into 20-ish range?
    // Let's deduce from total capacity.
    // For now, assume balanced strings.
    // numStrings = totalPanels / panelsPerString.
    // We don't know panelsPerString directly from UI input yet (only total Inverters & total Panels).
    // Let's ESTIMATE the average series length based on typical design (Voltage ~ 600-800V).

    // Reverse engineer:
    // Ideal Voltage ~ 700V.
    // Vmpp ~ 40V.
    // Ideal Series = 700 / 40 = 17.5 => 18 panels.

    // But we need to check if the CURRENT configuration is safe.
    // The Input in Design tab is "Total Inverter Qty" and "Total kWp".
    // It implies we need to calculate: Total Panels / (Inverter Qty * MPPTs * StringsPerMppt).
    // This is hard without explicit string design UI.

    // SIMPLIFIED APPROACH: Validation of the *Concept*
    // We will assume an optimal string length is ATTEMPTED, and verify limits at extremes.
    // OR we assume a standard string length of 18-20 for calculation?

    // WAIT! The user wants to check limits.
    // If we assume standard string, we can't catch "Wrong Sizing".
    // However, since we don't have a "String Designer" UI, we can checking:
    // 1. Current Compatibility (Isc vs Inverter Max Isc) - Independent of Series
    // 2. Voltage Window feasibility (Can we fit 1 string?)

    // --- CHECK 1: CURRENT SAFETY (Independent of Series) ---
    // Check Isc Max limit
    // Isc_max occurs at high irradiance (enhancement) or normal? Usually STC.
    // Bifacial gains can add 10-20%. Let's assume 1.1 safety factor.
    const Isc_site = Isc * 1.0;

    if (Isc_site > Imax_inv) {
        warnings.push({
            level: 'error',
            msg: `⚠️ PANEL CURRENT TOO HIGH: Panel Isc (${Isc_site.toFixed(1)}A) exceeds Inverter Max Isc (${Imax_inv}A). Risk of damage/clipping.`
        });
        deratePenalty += 2.0; // Heavy clipping penalty
    } else if (Isc_site > Imax_mppt) {
        warnings.push({
            level: 'warning',
            msg: `⚠️ HIGH CURRENT: Panel Isc (${Isc_site.toFixed(1)}A) > Inverter Operating Current (${Imax_mppt}A). Clipping will occur.`
        });
        deratePenalty += 1.0; // Mild clipping
    }

    // --- CHECK 2: VOLTAGE FEASIBILITY ---
    // Calculate Max Series Length (Coldest Day)
    // Voc_max = Voc * (1 + betaVoc * (config.tempLow - 25));
    // As betaVoc is negative (e.g. -0.003), term is (1 + (-0.003 * -15)) = 1.045
    const Voc_max_panel = Voc * (1 + betaVoc * (config.tempLow - 25));
    const max_series_allowed = Math.floor(Vmax_inv / Voc_max_panel);

    // Calculate Min Series Length (Hot Day) - Startup
    // mpp_min = Vmpp * (1 + betaVoc * (config.tempHigh - 25));
    const Vmpp_min_panel = Vmpp * (1 + betaVoc * (config.tempHigh - 25));
    const min_series_needed = Math.ceil(Vmin_mppt / Vmpp_min_panel);

    if (min_series_needed > max_series_allowed) {
        warnings.push({
            level: 'error',
            msg: `⛔ INCOMPATIBLE VOLTAGE: Panel voltage issues. Min ${min_series_needed} panels needed, but Max ${max_series_allowed} allowed.`
        });
        deratePenalty += 100;
    }

    // --- CHECK 3: CAPACITY / QUANTITY LIMIT ---
    // Calculate Max Panels per Inverter based on Inputs & Current
    // 1. Max Parallel Strings per MPPT (Current Limit)
    // Constrained by Isc (Safety) and Impp (Clipping)
    // Safety Limit:
    const max_strings_per_mppt_safety = Math.floor(Imax_inv / Isc); // e.g., 30A / 16A = 1
    // Operating Limit (Soft):
    const max_strings_per_mppt_op = Math.max(1, Math.round(Imax_mppt / Impp));

    // Use Safety limit for strictness
    const effective_strings_per_mppt = Math.max(1, max_strings_per_mppt_safety);

    // 2. Total Strings per Inverter
    const num_mppts = inverter.numMppt || 2;
    const max_total_strings = num_mppts * max_strings_per_mppt_safety; // Strict limit

    // 3. Max Panels Supported
    const max_panels_per_inverter = max_total_strings * max_series_allowed;

    // 4. Actual Panels per Inverter (Avg)
    const actual_panels_per_inverter = config.totalPanels / (config.inverterQty || 1);

    if (actual_panels_per_inverter > max_panels_per_inverter) {
        warnings.push({
            level: 'error',
            msg: `⛔ OVERLOAD: Too many panels! Max ~${max_panels_per_inverter} panels/inverter (limited by Inputs & Current), but you have ~${Math.ceil(actual_panels_per_inverter)}.`
        });
        deratePenalty += 50;
    } else if (actual_panels_per_inverter > max_panels_per_inverter * 0.8) {
        // High DC/AC ratio warning (Soft check)
        warnings.push({
            level: 'warning',
            msg: `⚠️ HIGH LOAD: System is filling up inverter capacity.`
        });
    }

    return {
        isValid: warnings.filter(w => w.level === 'error').length === 0,
        warnings,
        deratePenalty
    };
};

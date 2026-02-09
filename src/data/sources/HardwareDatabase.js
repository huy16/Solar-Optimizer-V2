
export const PANEL_SPECS = {
    model: 'TCL HSM-ND66-GR620 (N-Type)',
    power: 620, // Wp
    efficiency: 23.0, // %
    tempCoeff: -0.28, // %/C
    dimensions: '2382 x 1134 x 30 mm',
    area: 2.7, // m2
    voc: 48.94, // V (Open Circuit Voltage)
    isc: 16.05, // A (Short Circuit Current)
    vmpp: 40.85, // V (Voltage at Max Power)
    impp: 15.18 // A (Current at Max Power)
};

export const DEFAULT_LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZWE1ODBjIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNCIvPjxwYXRoIGQ9Ik0xMiAydjIiLz48cGF0aCBkPSJNMTIgMjB2MiIvPjxwYXRoIGQ9Ik00LjkzIDQuOTNsMS40MSAxLjQxIi8+PHBhdGggZD0iTTE3LjY2IDE3LjY2bDEuNDEgMS40MSIvPjxwYXRoIGQ9Ik0yIDEyaDIiLz48cGF0aCBkPSJNMjAgMTJoMiIvPjxwYXRoIGQ9Ik02LjM0IDE3LjY2bC0xLjQxIDEuNDEiLz48cGF0aCBkPSJNMTkuMDcgNC45M2wtMS40MSAxLjQxIi8+PC9zdmc+";

export const INVERTER_DB = [
    { id: '12KTL-M5', name: 'SUN2000-12KTL-M5', acPower: 12, maxPv: 18, minMpptV: 200, maxMpptV: 1000, maxInputV: 1100, startV: 200, maxIsc: 30, maxMpptCurrent: 20, numMppt: 2 },
    { id: '15KTL-M5', name: 'SUN2000-15KTL-M5', acPower: 15, maxPv: 22.5, minMpptV: 200, maxMpptV: 1000, maxInputV: 1100, startV: 200, maxIsc: 30, maxMpptCurrent: 20, numMppt: 2 },
    { id: '17KTL-M5', name: 'SUN2000-17KTL-M5', acPower: 17, maxPv: 25.5, minMpptV: 200, maxMpptV: 1000, maxInputV: 1100, startV: 200, maxIsc: 30, maxMpptCurrent: 20, numMppt: 2 },
    { id: '20KTL-M5', name: 'SUN2000-20KTL-M5', acPower: 20, maxPv: 30, minMpptV: 200, maxMpptV: 1000, maxInputV: 1100, startV: 200, maxIsc: 30, maxMpptCurrent: 20, numMppt: 2 },
    { id: '25KTL-M5', name: 'SUN2000-25KTL-M5', acPower: 25, maxPv: 37.5, minMpptV: 200, maxMpptV: 1000, maxInputV: 1100, startV: 200, maxIsc: 30, maxMpptCurrent: 20, numMppt: 2 },
    { id: '30KTL-M3', name: 'SUN2000-30KTL-M3', acPower: 30, maxPv: 45, minMpptV: 200, maxMpptV: 1000, maxInputV: 1100, startV: 200, maxIsc: 40, maxMpptCurrent: 26, numMppt: 4 },
    { id: '40KTL-M3', name: 'SUN2000-40KTL-M3', acPower: 40, maxPv: 60, minMpptV: 200, maxMpptV: 1000, maxInputV: 1100, startV: 200, maxIsc: 40, maxMpptCurrent: 26, numMppt: 4 },
    { id: '50KTL-M3', name: 'SUN2000-50KTL-M3', acPower: 50, maxPv: 75, minMpptV: 200, maxMpptV: 1000, maxInputV: 1100, startV: 200, maxIsc: 40, maxMpptCurrent: 26, numMppt: 4 },
    { id: '100KTL-M2', name: 'SUN2000-100KTL-M2', acPower: 100, maxPv: 150, minMpptV: 200, maxMpptV: 1000, maxInputV: 1100, startV: 200, maxIsc: 40, maxMpptCurrent: 26, numMppt: 10 },
    { id: '150K-MG0', name: 'SUN2000-150K-MG0', acPower: 150, maxPv: 225, minMpptV: 500, maxMpptV: 1500, maxInputV: 1500, startV: 550, maxIsc: 50, maxMpptCurrent: 30, numMppt: 7 },
    { id: '100KTL-M1', name: 'LUNA2000-100KTL-M1 (Smart PCS)', acPower: 100, maxPv: 0, minMpptV: 0, maxMpptV: 0, maxInputV: 0, startV: 0, maxIsc: 0, maxMpptCurrent: 0, numMppt: 0 },
];

export const BESS_DB = [
    { id: 'none', name: 'Không dùng (None)', capacity: 0, maxPower: 0 },
    { id: 'custom', name: 'Tùy chỉnh (Custom)', capacity: 0, maxPower: 0 },
    { id: 'LUNA-97', name: 'Huawei LUNA2000-97KWH-1H1', capacity: 96.8, maxPower: 92, desc: 'Smart String ESS (97kWh)' },
    { id: 'LUNA-129', name: 'Huawei LUNA2000-129KWH-2H1', capacity: 129.0, maxPower: 100, desc: 'Smart String ESS (129kWh)' },
    { id: 'LUNA-161', name: 'Huawei LUNA2000-161KWH-2H1', capacity: 161.3, maxPower: 100, desc: 'Smart String ESS (161kWh)' },
    { id: 'LUNA-200', name: 'Huawei LUNA2000-200KWH-2H1', capacity: 193.5, maxPower: 100, desc: 'Smart String ESS (200kWh)' },
    { id: 'LUNA-215', name: 'Huawei LUNA2000-215-2S12', capacity: 215.0, maxPower: 100, desc: 'Smart String ESS (215kWh)' },
];

export const INVERTER_OPTIONS = INVERTER_DB.map(i => ({ value: i.id, label: i.name }));
export const BESS_OPTIONS = BESS_DB.map(b => ({ value: b.id, label: b.name }));

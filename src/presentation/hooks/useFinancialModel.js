import { useState } from 'react';

export const useFinancialModel = (initialFinParams) => {
    // --- STATE FINANCIAL PARAMS ---
    const [finParams, setFinParams] = useState(initialFinParams);

    // Helpers could be added here if needed, e.g. simple loan payment calc
    // But main heavy calculation is likely done in standard utility functions

    return {
        finParams, setFinParams
    };
};

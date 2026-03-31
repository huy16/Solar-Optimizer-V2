/**
 * EVN Electricity Tariffs based on QĐ 1279/QĐ-BCT (10/05/2025)
 * 9 Categories: 4 Retail + 5 Wholesale
 */

export const EVN_TARIFFS = {
    // ============================================
    // GIÁ BÁN LẺ ĐIỆN (RETAIL ELECTRICITY PRICES)
    // ============================================

    // 1. Giá bán lẻ điện cho các ngành sản xuất
    "retail_manufacturing": {
        label_vi: "Sản xuất",
        label_en: "Manufacturing",
        group: "retail",
        voltage_levels: [
            { id: "110kv_plus", label_vi: "Cấp điện áp từ 110 kV trở lên", label_en: "Voltage ≥ 110kV", prices: { normal: 1811, peak: 3266, off_peak: 1146 } },
            { id: "22kv_110kv", label_vi: "Cấp điện áp từ 22 kV đến dưới 110 kV", label_en: "Voltage 22kV - 110kV", prices: { normal: 1833, peak: 3398, off_peak: 1190 } },
            { id: "6kv_22kv", label_vi: "Cấp điện áp từ 6 kV đến dưới 22 kV", label_en: "Voltage 6kV - 22kV", prices: { normal: 1899, peak: 3508, off_peak: 1234 } },
            { id: "under_6kv", label_vi: "Cấp điện áp dưới 6 kV", label_en: "Voltage < 6kV", prices: { normal: 1987, peak: 3640, off_peak: 1300 } }
        ]
    },

    // 2. Giá bán lẻ điện cho khối hành chính sự nghiệp (Non-TOU)
    "retail_admin": {
        label_vi: "Hành chính sự nghiệp",
        label_en: "Administrative",
        group: "retail",
        voltage_levels: [
            { id: "hospital_school_6kv_plus", label_vi: "BV/Trường học - điện áp từ 6 kV trở lên", label_en: "Hospital/School ≥ 6kV", prices: { normal: 1940, peak: 1940, off_peak: 1940 } },
            { id: "hospital_school_under_6kv", label_vi: "BV/Trường học - điện áp dưới 6 kV", label_en: "Hospital/School < 6kV", prices: { normal: 2072, peak: 2072, off_peak: 2072 } },
            { id: "public_6kv_plus", label_vi: "CSCC/Hành chính - điện áp từ 6 kV trở lên", label_en: "Public/Admin ≥ 6kV", prices: { normal: 2138, peak: 2138, off_peak: 2138 } },
            { id: "public_under_6kv", label_vi: "CSCC/Hành chính - điện áp dưới 6 kV", label_en: "Public/Admin < 6kV", prices: { normal: 2226, peak: 2226, off_peak: 2226 } }
        ]
    },

    // 3. Giá bán lẻ điện cho kinh doanh
    "retail_business": {
        label_vi: "Kinh doanh",
        label_en: "Business",
        group: "retail",
        voltage_levels: [
            { id: "22kv_plus", label_vi: "Cấp điện áp từ 22 kV trở lên", label_en: "Voltage ≥ 22kV", prices: { normal: 2887, peak: 5025, off_peak: 1609 } },
            { id: "6kv_22kv", label_vi: "Cấp điện áp từ 6 kV đến dưới 22 kV", label_en: "Voltage 6kV - 22kV", prices: { normal: 3108, peak: 5202, off_peak: 1829 } },
            { id: "under_6kv", label_vi: "Cấp điện áp dưới 6 kV", label_en: "Voltage < 6kV", prices: { normal: 3152, peak: 5422, off_peak: 1918 } }
        ]
    },

    // 4. Giá bán lẻ điện cho sinh hoạt (6 bậc riêng lẻ)
    "retail_residential": {
        label_vi: "Sinh hoạt",
        label_en: "Residential",
        group: "retail",
        voltage_levels: [
            { id: "tier_1", label_vi: "Bậc 1: 0-50 kWh (1,984đ)", label_en: "Tier 1: 0-50 kWh", prices: { normal: 1984, peak: 1984, off_peak: 1984 } },
            { id: "tier_2", label_vi: "Bậc 2: 51-100 kWh (2,050đ)", label_en: "Tier 2: 51-100 kWh", prices: { normal: 2050, peak: 2050, off_peak: 2050 } },
            { id: "tier_3", label_vi: "Bậc 3: 101-200 kWh (2,380đ)", label_en: "Tier 3: 101-200 kWh", prices: { normal: 2380, peak: 2380, off_peak: 2380 } },
            { id: "tier_4", label_vi: "Bậc 4: 201-300 kWh (2,998đ)", label_en: "Tier 4: 201-300 kWh", prices: { normal: 2998, peak: 2998, off_peak: 2998 } },
            { id: "tier_5", label_vi: "Bậc 5: 301-400 kWh (3,350đ)", label_en: "Tier 5: 301-400 kWh", prices: { normal: 3350, peak: 3350, off_peak: 3350 } },
            { id: "tier_6", label_vi: "Bậc 6: 401+ kWh (3,460đ)", label_en: "Tier 6: 401+ kWh", prices: { normal: 3460, peak: 3460, off_peak: 3460 } },
            { id: "prepaid", label_vi: "Điện kế thẻ trả trước (2,909đ)", label_en: "Prepaid Meter", prices: { normal: 2909, peak: 2909, off_peak: 2909 } }
        ]
    },

    // ============================================
    // GIÁ BÁN BUÔN ĐIỆN (WHOLESALE ELECTRICITY PRICES)
    // ============================================

    // 5. Giá bán buôn điện nông thôn
    "wholesale_rural": {
        label_vi: "Nông thôn",
        label_en: "Rural",
        group: "wholesale",
        voltage_levels: [
            { id: "tier_1", label_vi: "Bậc 1: 0-50 kWh (1,658đ)", label_en: "Tier 1: 0-50 kWh", prices: { normal: 1658, peak: 1658, off_peak: 1658 } },
            { id: "tier_2", label_vi: "Bậc 2: 51-100 kWh (1,724đ)", label_en: "Tier 2: 51-100 kWh", prices: { normal: 1724, peak: 1724, off_peak: 1724 } },
            { id: "tier_3", label_vi: "Bậc 3: 101-200 kWh (1,876đ)", label_en: "Tier 3: 101-200 kWh", prices: { normal: 1876, peak: 1876, off_peak: 1876 } },
            { id: "tier_4", label_vi: "Bậc 4: 201-300 kWh (2,327đ)", label_en: "Tier 4: 201-300 kWh", prices: { normal: 2327, peak: 2327, off_peak: 2327 } },
            { id: "tier_5", label_vi: "Bậc 5: 301-400 kWh (2,635đ)", label_en: "Tier 5: 301-400 kWh", prices: { normal: 2635, peak: 2635, off_peak: 2635 } },
            { id: "tier_6", label_vi: "Bậc 6: 401+ kWh (2,744đ)", label_en: "Tier 6: 401+ kWh", prices: { normal: 2744, peak: 2744, off_peak: 2744 } },
            { id: "other_purposes", label_vi: "Mục đích khác (1,735đ)", label_en: "Other Purposes", prices: { normal: 1735, peak: 1735, off_peak: 1735 } }
        ]
    },

    // 6. Giá bán buôn điện cho khu tập thể, cụm dân cư
    "wholesale_residential_clusters": {
        label_vi: "Khu tập thể, cụm dân cư",
        label_en: "Residential Clusters",
        group: "wholesale",
        voltage_levels: [
            // 6.1.1.1 Thành phố - TBA bên bán
            { id: "city_seller_tier1", label_vi: "TP - TBA bên bán - Bậc 1 (1,853đ)", label_en: "City - Seller - Tier 1", prices: { normal: 1853, peak: 1853, off_peak: 1853 } },
            { id: "city_seller_tier2", label_vi: "TP - TBA bên bán - Bậc 2 (1,919đ)", label_en: "City - Seller - Tier 2", prices: { normal: 1919, peak: 1919, off_peak: 1919 } },
            { id: "city_seller_tier3", label_vi: "TP - TBA bên bán - Bậc 3 (2,172đ)", label_en: "City - Seller - Tier 3", prices: { normal: 2172, peak: 2172, off_peak: 2172 } },
            { id: "city_seller_tier4", label_vi: "TP - TBA bên bán - Bậc 4 (2,750đ)", label_en: "City - Seller - Tier 4", prices: { normal: 2750, peak: 2750, off_peak: 2750 } },
            { id: "city_seller_tier5", label_vi: "TP - TBA bên bán - Bậc 5 (3,102đ)", label_en: "City - Seller - Tier 5", prices: { normal: 3102, peak: 3102, off_peak: 3102 } },
            { id: "city_seller_tier6", label_vi: "TP - TBA bên bán - Bậc 6 (3,206đ)", label_en: "City - Seller - Tier 6", prices: { normal: 3206, peak: 3206, off_peak: 3206 } },
            // 6.1.1.2 Thành phố - TBA bên mua
            { id: "city_buyer_tier1", label_vi: "TP - TBA bên mua - Bậc 1 (1,826đ)", label_en: "City - Buyer - Tier 1", prices: { normal: 1826, peak: 1826, off_peak: 1826 } },
            { id: "city_buyer_tier2", label_vi: "TP - TBA bên mua - Bậc 2 (1,892đ)", label_en: "City - Buyer - Tier 2", prices: { normal: 1892, peak: 1892, off_peak: 1892 } },
            { id: "city_buyer_tier3", label_vi: "TP - TBA bên mua - Bậc 3 (2,109đ)", label_en: "City - Buyer - Tier 3", prices: { normal: 2109, peak: 2109, off_peak: 2109 } },
            { id: "city_buyer_tier4", label_vi: "TP - TBA bên mua - Bậc 4 (2,667đ)", label_en: "City - Buyer - Tier 4", prices: { normal: 2667, peak: 2667, off_peak: 2667 } },
            { id: "city_buyer_tier5", label_vi: "TP - TBA bên mua - Bậc 5 (2,999đ)", label_en: "City - Buyer - Tier 5", prices: { normal: 2999, peak: 2999, off_peak: 2999 } },
            { id: "city_buyer_tier6", label_vi: "TP - TBA bên mua - Bậc 6 (3,134đ)", label_en: "City - Buyer - Tier 6", prices: { normal: 3134, peak: 3134, off_peak: 3134 } },
            // 6.1.2 Thành phố - Mục đích khác
            { id: "city_other", label_vi: "TP/Thị xã - Mục đích khác (1,750đ)", label_en: "City - Other purposes", prices: { normal: 1750, peak: 1750, off_peak: 1750 } },
            // 6.2.1.1 Thị trấn - TBA bên bán
            { id: "town_seller_tier1", label_vi: "Thị trấn - TBA bên bán - Bậc 1 (1,790đ)", label_en: "Town - Seller - Tier 1", prices: { normal: 1790, peak: 1790, off_peak: 1790 } },
            { id: "town_seller_tier2", label_vi: "Thị trấn - TBA bên bán - Bậc 2 (1,856đ)", label_en: "Town - Seller - Tier 2", prices: { normal: 1856, peak: 1856, off_peak: 1856 } },
            { id: "town_seller_tier3", label_vi: "Thị trấn - TBA bên bán - Bậc 3 (2,062đ)", label_en: "Town - Seller - Tier 3", prices: { normal: 2062, peak: 2062, off_peak: 2062 } },
            { id: "town_seller_tier4", label_vi: "Thị trấn - TBA bên bán - Bậc 4 (2,611đ)", label_en: "Town - Seller - Tier 4", prices: { normal: 2611, peak: 2611, off_peak: 2611 } },
            { id: "town_seller_tier5", label_vi: "Thị trấn - TBA bên bán - Bậc 5 (2,937đ)", label_en: "Town - Seller - Tier 5", prices: { normal: 2937, peak: 2937, off_peak: 2937 } },
            { id: "town_seller_tier6", label_vi: "Thị trấn - TBA bên bán - Bậc 6 (3,035đ)", label_en: "Town - Seller - Tier 6", prices: { normal: 3035, peak: 3035, off_peak: 3035 } },
            // 6.2.1.2 Thị trấn - TBA bên mua
            { id: "town_buyer_tier1", label_vi: "Thị trấn - TBA bên mua - Bậc 1 (1,762đ)", label_en: "Town - Buyer - Tier 1", prices: { normal: 1762, peak: 1762, off_peak: 1762 } },
            { id: "town_buyer_tier2", label_vi: "Thị trấn - TBA bên mua - Bậc 2 (1,828đ)", label_en: "Town - Buyer - Tier 2", prices: { normal: 1828, peak: 1828, off_peak: 1828 } },
            { id: "town_buyer_tier3", label_vi: "Thị trấn - TBA bên mua - Bậc 3 (2,017đ)", label_en: "Town - Buyer - Tier 3", prices: { normal: 2017, peak: 2017, off_peak: 2017 } },
            { id: "town_buyer_tier4", label_vi: "Thị trấn - TBA bên mua - Bậc 4 (2,503đ)", label_en: "Town - Buyer - Tier 4", prices: { normal: 2503, peak: 2503, off_peak: 2503 } },
            { id: "town_buyer_tier5", label_vi: "Thị trấn - TBA bên mua - Bậc 5 (2,834đ)", label_en: "Town - Buyer - Tier 5", prices: { normal: 2834, peak: 2834, off_peak: 2834 } },
            { id: "town_buyer_tier6", label_vi: "Thị trấn - TBA bên mua - Bậc 6 (2,929đ)", label_en: "Town - Buyer - Tier 6", prices: { normal: 2929, peak: 2929, off_peak: 2929 } },
            // 6.2.2 Thị trấn - Mục đích khác
            { id: "town_other", label_vi: "Thị trấn/Huyện - Mục đích khác (1,750đ)", label_en: "Town - Other purposes", prices: { normal: 1750, peak: 1750, off_peak: 1750 } }
        ]
    },

    // 7. Giá bán buôn điện cho tổ hợp thương mại - dịch vụ - sinh hoạt
    "wholesale_commercial_service": {
        label_vi: "Tổ hợp TM-DV-SH",
        label_en: "Commercial-Service-Residential",
        group: "wholesale",
        voltage_levels: [
            { id: "residential_tier1", label_vi: "Sinh hoạt - Bậc 1 (1,947đ)", label_en: "Residential - Tier 1", prices: { normal: 1947, peak: 1947, off_peak: 1947 } },
            { id: "residential_tier2", label_vi: "Sinh hoạt - Bậc 2 (2,011đ)", label_en: "Residential - Tier 2", prices: { normal: 2011, peak: 2011, off_peak: 2011 } },
            { id: "residential_tier3", label_vi: "Sinh hoạt - Bậc 3 (2,334đ)", label_en: "Residential - Tier 3", prices: { normal: 2334, peak: 2334, off_peak: 2334 } },
            { id: "residential_tier4", label_vi: "Sinh hoạt - Bậc 4 (2,941đ)", label_en: "Residential - Tier 4", prices: { normal: 2941, peak: 2941, off_peak: 2941 } },
            { id: "residential_tier5", label_vi: "Sinh hoạt - Bậc 5 (3,286đ)", label_en: "Residential - Tier 5", prices: { normal: 3286, peak: 3286, off_peak: 3286 } },
            { id: "residential_tier6", label_vi: "Sinh hoạt - Bậc 6 (3,393đ)", label_en: "Residential - Tier 6", prices: { normal: 3393, peak: 3393, off_peak: 3393 } },
            { id: "other_tou", label_vi: "Mục đích khác (TOU)", label_en: "Other purposes (TOU)", prices: { normal: 2989, peak: 5140, off_peak: 1818 } }
        ]
    },

    // 8. Giá bán buôn điện cho các khu công nghiệp
    "wholesale_industrial_zones": {
        label_vi: "Khu công nghiệp",
        label_en: "Industrial Zones",
        group: "wholesale",
        voltage_levels: [
            { id: "110kv_over_100mva", label_vi: "Thanh cái 110kV - MBA > 100MVA", label_en: "110kV Busbar - Transformer > 100MVA", prices: { normal: 1744, peak: 3197, off_peak: 1117 } },
            { id: "110kv_50_100mva", label_vi: "Thanh cái 110kV - MBA 50-100MVA", label_en: "110kV Busbar - Transformer 50-100MVA", prices: { normal: 1737, peak: 3183, off_peak: 1084 } },
            { id: "110kv_under_50mva", label_vi: "Thanh cái 110kV - MBA < 50MVA", label_en: "110kV Busbar - Transformer < 50MVA", prices: { normal: 1728, peak: 3164, off_peak: 1079 } },
            { id: "medium_22kv_110kv", label_vi: "Trung áp 22kV - 110kV", label_en: "Medium Voltage 22kV - 110kV", prices: { normal: 1800, peak: 3334, off_peak: 1168 } },
            { id: "medium_6kv_22kv", label_vi: "Trung áp 6kV - 22kV", label_en: "Medium Voltage 6kV - 22kV", prices: { normal: 1865, peak: 3441, off_peak: 1210 } }
        ]
    },

    // 9. Giá bán buôn điện cho chợ
    "wholesale_markets": {
        label_vi: "Chợ",
        label_en: "Markets",
        group: "wholesale",
        voltage_levels: [
            { id: "default", label_vi: "Giá bán buôn cho chợ (2,818đ)", label_en: "Market Wholesale", prices: { normal: 2818, peak: 2818, off_peak: 2818 } }
        ]
    }
};

// Legacy mapping for backward compatibility
export const LEGACY_TARIFF_MAP = {
    "manufacturing": "retail_manufacturing",
    "business": "retail_business",
    "admin": "retail_admin"
};

export const getTariff = (key) => {
    const mappedKey = LEGACY_TARIFF_MAP[key] || key;
    return EVN_TARIFFS[mappedKey];
};

const DEFAULT_RATIOS = { normal: 0.60, peak: 0.25, off_peak: 0.15 };

export const calculateBlendedPrice = (customerType, voltageLevel, ratios = DEFAULT_RATIOS) => {
    const tariff = getTariff(customerType);
    if (!tariff) return 2000;
    const level = tariff.voltage_levels.find(v => v.id === voltageLevel) || tariff.voltage_levels[0];
    const p = level.prices;
    return Math.round((p.normal * ratios.normal) + (p.peak * ratios.peak) + (p.off_peak * ratios.off_peak));
};

export const getTariffOptions = (lang = 'vi') => {
    const retail = [];
    const wholesale = [];
    Object.entries(EVN_TARIFFS).forEach(([key, tariff]) => {
        const option = { value: key, label: lang === 'vi' ? tariff.label_vi : tariff.label_en, group: tariff.group };
        if (tariff.group === 'retail') { retail.push(option); } else { wholesale.push(option); }
    });
    return { retail, wholesale };
};

export const getVoltageLevelOptions = (tariffKey, lang = 'vi') => {
    const tariff = EVN_TARIFFS[tariffKey];
    if (!tariff) return [];
    return tariff.voltage_levels.map(v => ({ value: v.id, label: lang === 'vi' ? v.label_vi : v.label_en, prices: v.prices }));
};

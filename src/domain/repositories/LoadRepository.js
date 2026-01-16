/**
 * Interface for Load Data Access
 */
export class LoadRepository {
    /**
     * Parses a load data file
     * @param {File} file 
     * @returns {Promise<Object>} { rawData, processedData, metadata }
     */
    parseLoadFile(file) { throw new Error("Not implemented"); }
}

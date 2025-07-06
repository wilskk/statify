import { ChartOptions, FrequencyTable } from '../types';
import { useResultStore } from '@/stores/useResultStore';

// Helper function to get the appropriate chart title
const getChartTitle = (type: string | null, varName: string): string => {
    switch(type) {
        case 'barCharts': return `Bar Chart for ${varName}`;
        case 'pieCharts': return `Pie Chart for ${varName}`;
        case 'histograms': return `Histogram for ${varName}`;
        default: return `Chart for ${varName}`;
    }
};

// Helper function to get the chart component type name
const getChartComponentType = (type: string | null): string => {
    switch(type) {
        case 'barCharts': return 'Bar';
        case 'pieCharts': return 'Pie';
        case 'histograms': return 'Histogram';
        default: return 'Bar';
    }
};

/**
 * Processes frequency tables and chart options to generate and add charts to the results.
 * @param analyticId - The ID of the parent analysis.
 * @param frequencyTables - The frequency table data from the worker.
 * @param chartOptions - The chart options selected by the user.
 */
export const processAndAddCharts = async (
    analyticId: number,
    frequencyTables: { [variableName: string]: FrequencyTable },
    chartOptions: ChartOptions
) => {
    const { addStatistic } = useResultStore.getState();

    for (const varName in frequencyTables) {
        const table = frequencyTables[varName];
        if (!table || !table.rows || table.rows.length === 0) continue;

        const chartData = {
            labels: table.rows.map(row => row.label),
            datasets: [
                {
                    label: chartOptions.values === 'percentages' ? 'Percentage' : 'Frequency',
                    data: table.rows.map(row => chartOptions.values === 'percentages' ? row.validPercent : row.frequency),
                    // You can add more styling options here later, e.g., colors
                }
            ]
        };

        const chartTitle = getChartTitle(chartOptions.type, table.title || varName);
        const chartComponent = getChartComponentType(chartOptions.type);

        await addStatistic(analyticId, {
            title: chartTitle,
            output_data: JSON.stringify({
                data: chartData,
                options: {
                    // Pass any chart-specific display options here
                    // e.g., showNormalCurveOnHistogram
                    ...(chartOptions.type === 'histograms' && { showNormalCurve: chartOptions.showNormalCurveOnHistogram })
                }
            }),
            components: chartComponent,
            description: `A ${chartComponent} chart showing ${chartOptions.values} for ${table.title || varName}.`
        });
    }
}; 
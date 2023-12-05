export interface GridSettings {
    validFrom?: string;
    gridCapacity0_2: number;
    gridCapacity2_5: number;
    gridCapacity5_10: number;
    gridCapacity10_15: number;
    gridCapacity15_20: number;
    gridCapacity20_25: number;
    gridCapacityAverage: string;

    gridEnergyDay: number;
    gridEnergyNight: number;
    gridEnergyLowWeekends: boolean;
    gridEnergyLowHoliday?: boolean;
}

export type GridSettingsList = GridSettings[];

export interface GridSettingsConfig {
    id: string;
    description: string;
    settings: GridSettings | GridSettingsList;
}

export type GridSettingsConfigMap = { [key: string]: GridSettingsConfig };

export interface GridOptions {
    gridCompany: string;
}

export class PriceFetcherOptions {
    gridOptions?: GridOptions;
    fetchTime?: number; // Seconds in the hour to fetch data

    constructor({gridOptions, fetchTime}: {
        gridOptions?: GridOptions;
        fetchTime?: number
    }) {
        this.gridOptions = gridOptions;
        this.fetchTime = fetchTime;
    }

}
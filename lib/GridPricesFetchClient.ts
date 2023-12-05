import {Device} from "homey";
import {GridPricesApi} from "./GridPricesApi";
import {GridOptions, GridSettingsConfig} from "./types";

const STORE_PREFIX = 'gridprices-';

export class GridPricesFetchClient {

    logger: any;
    gridPrices: GridPricesApi;

    constructor({logger}: {
        logger: any
    }) {
        this.logger = logger;
        this.gridPrices = new GridPricesApi({logger});
    }

    /**
     * Fetch grid prices and store in storage.
     *
     * @param device Homey.device
     * @param options
     */
    async fetchGridPrices(
        device: Device,
        options: GridOptions,
    ): Promise<GridSettingsConfig | undefined> {
        await this.clearStorage(device);
        const allPrices = await this.gridPrices.fetchPrices();
        if (allPrices && allPrices[options.gridCompany] ) {
            const prices = allPrices[options.gridCompany] as GridSettingsConfig;
            if (prices) {
                this.storePricesInStorage(device, prices, options);
            }
        }
        return this.getPrices(device, options);
    }

    /**
     * Get grid prices from storage.
     *
     * @param device
     * @param options
     */
    getPrices(
        device: Device,
        options: GridOptions
    ): GridSettingsConfig | undefined {
        return this.getPricesFromStorage(device, options);
    }

    private cachePrefix() {
        return `${STORE_PREFIX}-`;
    }

    private cacheId(options: GridOptions) {
        return `${this.cachePrefix()}${options.gridCompany}`;
    }

    private async storePricesInStorage(device: Device, prices: GridSettingsConfig, options: GridOptions): Promise<void> {
        const key = this.cacheId(options);
        await device.setStoreValue(key, prices).catch(err => this.logger.error(err));
    }

    private getPricesFromStorage(device: Device, options: GridOptions): GridSettingsConfig | undefined {
        const key = this.cacheId(options);
        return device.getStoreValue(key);
    }

    /**
     * Clear all grid prices in the storage.
     *
     * @param device
     * @private
     */
    async clearStorage(device: Device) {
        const keys = device.getStoreKeys();
        for (const key of keys) {
            if (key.startsWith(STORE_PREFIX)) {
                await device.unsetStoreValue(key).catch(err => this.logger.error(err));
            }
        }
    }

}

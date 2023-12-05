import EventEmitter from "events";

import {Device} from "homey";

import {GridPricesFetchClient} from "./GridPricesFetchClient";
import {GridOptions, GridSettingsConfig, GridPriceFetcherOptions} from "./types";

export class GridPriceFetcher extends EventEmitter {

    private logger: any;
    private pricesFetchClient: GridPricesFetchClient;
    private device: Device;
    private priceFetcherOptions = new GridPriceFetcherOptions({});

    private forcePriceUpdate?: boolean;
    private fetchTimeout?: NodeJS.Timeout;
    private updatePriceTimeout?: NodeJS.Timeout;
    private deleted?: boolean;

    constructor({logger, pricesFetchClient, device}: {
        logger: any,
        pricesFetchClient: GridPricesFetchClient,
        device: Device,
    }) {
        super();
        this.logger = logger;
        this.pricesFetchClient = pricesFetchClient;
        this.device = device;
    }

    start() {
        this.forcePriceUpdate = true;
        this.scheduleFetchData(3);
    }

    stop() {
        this.clearFetchData();
        this.clearUpdatePrice();
    }

    destroy() {
        this.deleted = true;
        this.stop();
    }

    setGridOptions(gridOptions: GridOptions) {
        this.priceFetcherOptions.gridOptions = gridOptions;
    }

    setFetchTime(fetchTime: number) {
        this.priceFetcherOptions.fetchTime = fetchTime;
    }

    private clearFetchData() {
        if (this.fetchTimeout) {
            this.device.homey.clearTimeout(this.fetchTimeout);
            this.fetchTimeout = undefined;
        }
    }

    private scheduleFetchData(seconds?: number) {
        if (this.deleted) {
            return;
        }
        this.clearFetchData();
        if (seconds === undefined) {
            let syncTime = this.priceFetcherOptions.fetchTime!!;
            const now = new Date();
            seconds = syncTime - (now.getMinutes() * 60 + now.getSeconds());
            seconds = seconds <= 0 ? seconds + 3600 : seconds;
            this.logger.verbose(`Grid Price Fetcher: fetch time: ${syncTime}`);
        }
        this.logger.debug(`Grid Price Fetcher: fetch data in ${seconds} seconds`);
        this.fetchTimeout = this.device.homey.setTimeout(this.doFetchData.bind(this), seconds * 1000);
    }

    private async doFetchData() {
        if (this.deleted) {
            return;
        }
        try {
            this.clearFetchData();
            if (this.forcePriceUpdate) {
                this.clearUpdatePrice();
            }

            const {options} = this.getFetchParameters();

            const prices = await this.pricesFetchClient.fetchGridPrices(this.device, options);
            if (prices) {
                this.emit('gridPrices', prices);
                this.logger.verbose(`Grid Price Fetcher: fetched grid prices: ${prices?.id} ${prices?.description}`)
            } else {
                this.logger.warn(`Grid Price Fetcher: no grid prices fetched for ${JSON.stringify(options)}`);
            }
        } catch (err) {
            this.logger.error(err);
        } finally {
            this.scheduleFetchData();
            if (this.forcePriceUpdate) {
                this.forcePriceUpdate = false;
                this.scheduleUpdatePrice(1);
            }
        }
    }

    private clearUpdatePrice() {
        if (this.updatePriceTimeout) {
            this.device.homey.clearTimeout(this.updatePriceTimeout);
            this.updatePriceTimeout = undefined;
        }
    }

    private scheduleUpdatePrice(seconds?: number) {
        if (this.deleted) {
            return;
        }
        this.clearUpdatePrice();
        if (seconds === undefined) {
            const now = new Date();
            const nextMidnight = new Date(now);
            nextMidnight.setDate(now.getDate() + 1);
            nextMidnight.setHours(0, 0, 0, 0);

            seconds = (nextMidnight.getTime() - now.getTime()) / 1000 + 3;
        }
        this.logger.debug(`Grid Price Fetcher: update price in ${seconds} seconds`);
        this.updatePriceTimeout = this.device.homey.setTimeout(this.doUpdatePrice.bind(this), seconds * 1000);
    }

    private async doUpdatePrice() {
        if (this.deleted) {
            return;
        }
        try {
            this.clearUpdatePrice();
            const {options} = this.getFetchParameters();
            const prices = this.pricesFetchClient.getPrices(this.device, options);
            if (prices) {
                await this.onGridPrices(prices);
            }
        } catch (err) {
            this.logger.error(err);
        } finally {
            this.scheduleUpdatePrice();
        }
    }

    private async onGridPrices(prices: GridSettingsConfig) {
        try {
            this.emit('gridPrices', prices);
        } catch (err) {
            this.logger.error(err);
        }
    }

    private getFetchParameters() {
        const options = this.priceFetcherOptions.gridOptions!;
        return {options}
    }
}

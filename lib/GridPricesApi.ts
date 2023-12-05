import {GridSettingsConfigMap} from "./types";

const http = require('http.min');


export class GridPricesApi {

    logger: any;

    constructor({logger}: {
        logger: any
    }) {
        this.logger = logger;
    }

    /**
     * Fetch grid prices from GitHub.
     */
    fetchPrices = async (): Promise<GridSettingsConfigMap> => {
        const uri = 'https://raw.githubusercontent.com/balmli/no.almli.utilitycost/main/data/gridprices.json';
        const out = await http.get({uri, timeout: 30000});
        const response = out.response;
        //console.log(response);

        if (response.statusCode === 404) {
            throw new Error(`Grid prices not found: "${uri}"`);
        } else if (response.statusCode !== 200) {
            throw new Error(`Fetching grid prices failed: ${response.statusCode} ${response.statusMessage}`);
        }

        try {
            const data = JSON.parse(out.data);
            return data as GridSettingsConfigMap;
        } catch (err: any) {
            throw new Error(`Parsing grid prices failed: ${err}`);
        }
    };

}
import Logger from '@balmli/homey-logger';

import {GridPricesApi} from "../lib";

describe('Fetch prices', function () {

    describe('Check fetch prices', function () {
        it('Check fetch prices 1', function (done) {
            const api = new GridPricesApi({
                logger: new Logger({
                    logLevel: 3,
                    prefix: undefined,
                })
            });
            api.fetchPrices()
                .then((prices) => {
                    console.log(prices);
                    done();
                })
                .catch((err) => {
                    console.log('ERROR', err)
                    done();
                });
        });
    });

});

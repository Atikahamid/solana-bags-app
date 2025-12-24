import { fetchTokenDetailBatch, getCreationTimeAndSupplyBatch, getCurrentTokenPriceUsd, getMarketMetricsBatch, getTokenHolderStats, getTokenTradeStats, timeAgo } from "./utils/tokenRelatedUtils";
import Decimal from "decimal.js";
const tokens = [
    {
        mint: "4ikwYoNvoGEwtMbziUyYBTz1zRM6nmxspsfw9G7Bpump",
        marketAddress: "CmvaHpHYXyMikhfw5xyuKWoxQ2pAny9m5hWZiciT9rx2",
    },
    {
        mint: "GaPbGp23pPuY9QBLPUjUEBn2MKEroTe9Q3M3f2Xpump",
        marketAddress: "8oopi6gVFh4FA1mL5Jj35yRetfpmWiUDTfhCv31gkA3v",
    },
    {
        mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
        marketAddress: "5hinZuqbN8Va93CMWSHZJBAUKdgN99FXAD2g3spnHy7N",
    },
];

const mintAddresses = [
    "s8obkxYJYBRZedZnmns1qAN9HrTko5dAP1fr9oxpump",
    "EVJ5xPVNXdjfVKtPYP2V99vCAPDpUVAopSeTcZJ9pump"
];

async function main() {
    // const enrichedTokens = await fetchTokenDetailBatch(tokens);
    // const result = await getCreationTimeAndSupplyBatch(mintAddresses);
    // console.log("result: ", result);

    // const count = await getTokenTradeStats([
    //     "5VwhTtRXBdgwwLG5otSq62jdNDm62VC9J72dhC3rpump",
    //     "7tAWbTqpvcrwUkky36SvXwThBTnbV5uP6nhUbCpMQWtW"
    // ]
    // );

    // console.log("holderCount:", count);
    // console.log(timeAgo("2025-12-13 18:59:00+00"));
    // const price = new Decimal( await getCurrentTokenPriceUsd('23iUeVHjLCeSMkuL45ksq5UCpwJMBnTMdF97YKZVDZU9'));
    // console.log("price: ", price);

    // const result = await getMarketMetricsBatch(['2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv', ]);
    // console.log("result ", result);
}

main();
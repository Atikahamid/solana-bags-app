import { fetchTokenDetailBatch } from "./utils/tokenRelatedUtils";

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

async function main() {
    const enrichedTokens = await fetchTokenDetailBatch(tokens);

    console.log(enrichedTokens);
}

main();
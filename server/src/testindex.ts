import { fetchTokenDetailBatch, getCreationTimeAndSupplyBatch, getTokenHolderCount, timeAgo } from "./utils/tokenRelatedUtils";

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

    const count = await getTokenHolderCount(
        "HFmEXXj6o18osec91NaAkkxWGgJbe3tWE8FPUKGmmoon"
    );

    console.log("holderCount:", count);
    // console.log(timeAgo("2025-12-06 16:00:06.525+00"));
}

main();
import { run } from "hardhat";
import { RarityPayoutTaskArgs } from "../../../../tasks/rarityPayouts";

async function rarityPayout() {
  const args: RarityPayoutTaskArgs = {
    season: "8",
    rarityDataFile: "rnd1",
    rounds: "4",
    totalAmount: "1350000",
    blockNumber: "55253790",
    deployerAddress: "0xb6384935d68e9858f8385ebeed7db84fc93b1420",
    tieBreakerIndex: "0",
  };
  await run("rarityPayout", args);
}

rarityPayout()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.rarityPayout = rarityPayout;

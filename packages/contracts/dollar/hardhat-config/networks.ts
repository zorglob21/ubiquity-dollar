import { HardhatUserConfig } from "hardhat/config";
import { getAlchemyRpc } from "./utils/getAlchemyRpc";
import { warn } from "./utils/warn";
const gasPrice = 60000000000;

export default function networks(
  accounts: { mnemonic: string },
  { MAINNET_PROVIDER_URL, ROPSTEN_PROVIDER_URL, RINKEBY_PROVIDER_URL, UBQ_ADMIN }: EnvironmentVariables
) {
  const forking = {
    url: MAINNET_PROVIDER_URL || getAlchemyRpc("mainnet") || "http://localhost:8545",
    // blockNumber: 13252206,
  } as { url: string; blockNumber?: number };

  if (forking?.blockNumber) {
    warn(`forking blocknumber ${forking?.blockNumber}`);
  }

  return {
    localhost: {
      url: "http://0.0.0.0:8545",
      forking,
      hardfork: "london",
      accounts,
      initialBaseFeePerGas: 0,
    },
    hardhat: {
      forking,
      hardfork: "london",
      accounts,
      initialBaseFeePerGas: 0,
    },
    ropsten: {
      url: ROPSTEN_PROVIDER_URL || getAlchemyRpc("ropsten") || "http://localhost:8545",
      accounts,
      gasPrice,
    },
    rinkeby: {
      url: RINKEBY_PROVIDER_URL || getAlchemyRpc("rinkeby") || "http://localhost:8545",
      accounts,
      gasPrice,
    },
    mainnet: {
      url: MAINNET_PROVIDER_URL || getAlchemyRpc("mainnet") || "http://localhost:8545",
      accounts: UBQ_ADMIN ? [UBQ_ADMIN] : accounts,
      gasPrice,
    },
  } as HardhatUserConfig["networks"];
}

interface EnvironmentVariables {
  MAINNET_PROVIDER_URL?: string | undefined;
  ROPSTEN_PROVIDER_URL?: string | undefined;
  RINKEBY_PROVIDER_URL?: string | undefined;
  API_KEY_ALCHEMY?: string | undefined;
  UBQ_ADMIN?: string | undefined;
}

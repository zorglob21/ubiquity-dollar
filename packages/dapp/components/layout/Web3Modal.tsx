import WalletConnectProvider from "@walletconnect/web3-provider";
import { providers } from "ethers";
import { useCallback, useEffect, useReducer } from "react";
import Web3Modal from "web3modal";
// import { ellipseAddress, getChainData } from "../lib/utilities";

const INFURA_ID = "09d9ad2ad2d441c2aceadad9e2784d57";

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      infuraId: INFURA_ID, // required
    },
  },
};

type StateType = {
  provider?: any;
  web3Provider?: any;
  walletAddress?: null | string;
  chainId?: null | number;
};

type ActionType =
  | {
      type: "SET_WEB3_PROVIDER";
      provider?: StateType["provider"];
      web3Provider?: StateType["web3Provider"];
      walletAddress?: StateType["walletAddress"];
      chainId?: StateType["chainId"];
    }
  | {
      type: "SET_ADDRESS";
      walletAddress?: StateType["walletAddress"];
    }
  | {
      type: "SET_CHAIN_ID";
      chainId?: StateType["chainId"];
    }
  | {
      type: "RESET_WEB3_PROVIDER";
    };

let web3Modal: Web3Modal;
if (typeof window !== "undefined") {
  web3Modal = new Web3Modal({
    network: "mainnet", // optional
    cacheProvider: true,
    providerOptions, // required
  });
}

const initialState: StateType = {
  provider: null,
  web3Provider: null,
  walletAddress: null,
  chainId: null,
};

function reducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case "SET_WEB3_PROVIDER":
      return {
        ...state,
        provider: action.provider,
        web3Provider: action.web3Provider,
        walletAddress: action.walletAddress,
        chainId: action.chainId,
      };
    case "SET_ADDRESS":
      return {
        ...state,
        walletAddress: action.walletAddress,
      };
    case "SET_CHAIN_ID":
      return {
        ...state,
        chainId: action.chainId,
      };
    case "RESET_WEB3_PROVIDER":
      return initialState;
    default:
      throw new Error();
  }
}

export const Home = (): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { provider, web3Provider, walletAddress } = state;

  const connect = useCallback(async function () {
    // This is the initial `provider` that is returned when
    // using web3Modal to connect. Can be MetaMask or WalletConnect.
    const provider = await web3Modal.connect();

    // We plug the initial `provider` into ethers.js and get back
    // a Web3Provider. This will add on methods from ethers.js and
    // event listeners such as `.on()` will be different.
    const web3Provider = new providers.Web3Provider(provider);

    const signer = web3Provider.getSigner();
    const walletAddress = await signer.getAddress();

    const network = await web3Provider.getNetwork();

    dispatch({
      type: "SET_WEB3_PROVIDER",
      provider,
      web3Provider,
      walletAddress,
      chainId: network.chainId,
    });
  }, []);

  const disconnect = useCallback(
    async function () {
      await web3Modal.clearCachedProvider();
      if (provider?.disconnect && typeof provider.disconnect === "function") {
        await provider.disconnect();
      }
      dispatch({
        type: "RESET_WEB3_PROVIDER",
      });
    },
    [provider]
  );

  // Auto connect to the cached provider
  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connect();
    }
  }, [connect]);

  // A `provider` should come with EIP-1193 events. We'll listen for those events
  // here so that when a user switches accounts or networks, we can update the
  // local React state with that new information.
  useEffect(() => {
    if (provider?.on) {
      const handleAccountsChanged = (accounts: string[]) => {
        // eslint-disable-next-line no-console
        console.log("accountsChanged", accounts);
        dispatch({
          type: "SET_ADDRESS",
          walletAddress: accounts[0],
        });
      };

      // https://docs.ethers.io/v5/concepts/best-practices/#best-practices--network-changes
      const handleChainChanged = (_hexChainId: string) => {
        window.location.reload();
      };

      const handleDisconnect = (error: { code: number; message: string }) => {
        // eslint-disable-next-line no-console
        console.log("disconnect", error);
        disconnect();
      };

      provider.on("accountsChanged", handleAccountsChanged);
      provider.on("chainChanged", handleChainChanged);
      provider.on("disconnect", handleDisconnect);

      return () => {
        if (provider.removeListener) {
          provider.removeListener("accountsChanged", handleAccountsChanged);
          provider.removeListener("chainChanged", handleChainChanged);
          provider.removeListener("disconnect", handleDisconnect);
        }
      };
    }
  }, [provider, disconnect]);

  return (
    <div>
      <div>
        {walletAddress && (
          <div>
            <span>{shortenAddress(walletAddress)}</span>
          </div>
        )}
      </div>

      <div>
        {web3Provider ? (
          <button className="button" type="button" onClick={disconnect}>
            Disconnect
          </button>
        ) : (
          <button className="button" type="button" onClick={connect}>
            Connect
          </button>
        )}
      </div>
    </div>
  );
};

export default Home;

function shortenAddress(walletAddress: string) {
  return walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4);
}

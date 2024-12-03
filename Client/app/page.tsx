"use client";
import React, { useState,useMemo,useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

import { RecentContacts } from './components/RecentTransactions';
import Navbar from "./components/ui/Navbar";
import SearchBar from "./components/SearchBar";
import { ethers, Contract } from "ethers";


type Message = {
  id: number;
  text: string;
  sender: "user" | "ai";
};
const PATH_FINDER_API_URL = "https://k8-testnet-pf.routerchain.dev/api";
const erc20_abi = [
  {
    name: "approve",
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    name: "allowance",
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export default function Home() {
  const { data: session } = useSession();
  const [authToken,setAuthToken]=useState<string>();
  const [messages, setMessages] = useState<Message[]>([]);
  const idToken = useMemo(() => (session?.id_token || null), [session]);

  useEffect(() => {
    const fetchAuthorization = async () => {
      if (session) {
        console.log(idToken); // Log the id_token for debugging

        try {
          const response = await fetch("https://sandbox-api.okto.tech/api/v2/authenticate", {
            method: 'POST',
            headers: {
              "X-Api-Key": "e9ff25cc-46f3-4d3b-a37e-991558acf41c"|| '',
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id_token:idToken, // Pass the id_token in the request body
            }),
          });

          const data = await response.json();
          console.log("Authorization Response:", data);
          setAuthToken(data.data.auth_token)

          // Handle the response as needed
        } catch (error) {
          console.error("Error during authorization:", error);
        }
      }
    };

    fetchAuthorization();
  }, [session])

  const callChat = async (messageToSend: string) => {
    try {
      setMessages((prev) => [
        ...prev,
        { id: prev.length + 1, text: messageToSend, sender: "user" },
      ]);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (!data.success) {
        throw new Error(data.error);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: data.fullResponse.choices[0].message.content,
          sender: "ai",
        },
      ]);

      if (data.parsedJson) {
        console.log("Parsed JSON:", data.parsedJson);
      }
    } catch (error) {
      console.error("Error in callChat:", error);
      // Optionally add error handling UI here
    }
  };
  async function handlePay(){
    const response = await fetch("https://sandbox-api.okto.tech/api/v1/transfer/tokens/execute", {
      method: "POST",
      headers: {
        "Authorization": "463b7649-c8b8-4e2f-9f46-a9cad7f8ef22",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        network_name: "SOLANA_DEVNET",
        token_address: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
        quantity: "0.1",
        recipient_address: "5F4QFyBm9ftZPpypvmiTxXKBuEHZyfzpF2xx8h2WDCjg",
      }),
    });
  
    const data = await response.json();
    console.log(data);
  }

  async function handleCrossPay(){
    const endpoint = "v2/quote";
      const quoteUrl = `${PATH_FINDER_API_URL}/${endpoint}`;
      const params = {
        fromTokenAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        toTokenAddress: "0xb452b513552aa0B57c4b1C9372eFEa78024e5936",
        amount: "10000000000000000", // source amount
        fromTokenChainId: "11155111", // Mumbai
        toTokenChainId: "43113", // Fuji
        partnerId: 0, // (Optional) - For any partnership, get your unique partner id - https://app.routernitro.com/partnerId
      };

      const res = await axios.get(quoteUrl, { params });
        console.log(res);
        const provider = new ethers.providers.JsonRpcProvider(
          "https://eth-sepolia.g.alchemy.com/v2/7LHopYRpqnEpAavMFHoWggsnWgle3GBg",
          11155111
        );
        console.log(`provider: ${provider}`);
        const wallet = new ethers.Wallet(
          "ffeb5a425de376aa30a9c3f0293a848e4ed6b46a8deed58be50518079c576e52",
          provider
        );
        console.log(`wallet: ${wallet}`);
        await checkAndSetAllowance({
          wallet,
          tokenAddress: "0x22bAA8b6cdd31a0C5D1035d6e72043f4Ce6aF054", // fromTokenAddress (USDT on Mumbai)
          approvalAddress: res.data.allowanceTo, // quote.allowanceTo in getQuote(params) response from step 1
          amount: ethers.constants.MaxUint256, // amount to approve (infinite approval)
        });

        const trial = await axios.post(
          "https://k8-testnet-pf.routerchain.dev/api/v2/transaction",
          {
            ...res.data,
            senderAddress: "0x07b1DAf7b72dd9E0F6D57e4B9C8cFC00719096f9",
            receiverAddress: "0x5d0655b8D44A7FA3a8fc7ff3846d971397eA21B1",
            refundAddress: "0x07b1DAf7b72dd9E0F6D57e4B9C8cFC00719096f9", // (optional) By default equal to `senderAddress` if not provided
          }
        );
        const txn = trial.data;
        const tx = await wallet.sendTransaction(txn.txn);
        console.log(`Transaction2 mined successfully: ${tx.hash}`);

  }

  interface CheckAndSetAllowanceParams {
    wallet: ethers.Wallet;
    tokenAddress: string;
    approvalAddress: string;
    amount: ethers.BigNumber;
  }
  
  const checkAndSetAllowance = async ({
    wallet,
    tokenAddress,
    approvalAddress,
    amount,
  }: CheckAndSetAllowanceParams): Promise<void> => {
    // Transactions with the native token don't need approval
    if (tokenAddress === ethers.constants.AddressZero) {
      return;
    }
  
    const erc20: Contract = new Contract(tokenAddress, erc20_abi, wallet);
    console.log(`erc20: ${erc20}`);
    try {
      console.log("Hello");
      console.log(await wallet.provider.getGasPrice());
      // const allowance = await erc20.allowance(
      //   await wallet.getAddress(),
      //   approvalAddress
      // );
      const approveTx: ethers.providers.TransactionResponse = await erc20.approve(
        approvalAddress,
        amount,
        {
          gasPrice: await wallet.provider.getGasPrice(),
        }
      );
      console.log(approveTx);
      console.log(`Transaction mined successfully: ${approveTx.hash}`);
    } catch (error) {
      console.log(`Transaction failed with error: ${error}`);
    }
  };

  return (
    <>
      <Navbar />
      <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-violet-50/90 via-violet-100/80 to-violet-200/90 backdrop-blur-sm">
        <main className="flex-1">
          <div className="h-full p-12">
            {session && <RecentContacts />}

            {/* Messages display */}
            <div className="max-w-4xl mx-auto space-y-4 mb-8">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-2xl ${
                    message.sender === "user"
                      ? "bg-violet-500/90 text-white ml-auto max-w-[80%]"
                      : "bg-white/10 backdrop-blur-md border border-white/20 max-w-[80%]"
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>
            <button onClick={handlePay}>pay</button>
            <button onClick={handleCrossPay}>pay2</button>
          </div>
        </main>
        <SearchBar onSendMessage={callChat} />
      </div>
    </>
  );
}

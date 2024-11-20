import { createContext, useContext, useEffect, useState } from "react";

const EthPriceContext = createContext<{ price: string | null } | undefined>(
  undefined
);

export function EthPriceProvider({ children }: { children: React.ReactNode }) {
  const [price, setPrice] = useState<string | null>(null);

  useEffect(() => {
    const ws = new WebSocket("wss://ws-feed.exchange.coinbase.com");

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "subscribe",
          channels: [
            {
              name: "ticker",
              product_ids: ["ETH-USD"],
            },
          ],
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "ticker") {
        setPrice(data.price);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <EthPriceContext.Provider value={{ price }}>
      {children}
    </EthPriceContext.Provider>
  );
}

export function useEthPrice() {
  const context = useContext(EthPriceContext);
  if (!context) {
    throw new Error("useEthPrice must be used within an EthPriceProvider");
  }
  return context;
}

export type NftApiType = {
    address: string;
    name: string;
    minted_at: string;
    image_url: string;
    url: string;
};

export type PriceLevel = {
    name: string;
    greater_than: string;
};

export type TokenApiType = {
    address: string;
    symbol: string;
    name: string;
    description: string;
    price_levels: PriceLevel[];
    price: number;
    volume_24h: number;
    market_cap: number;
    launch_date: string;
    ticker_data: number[];
    image_url: string;
    progress: number;
};

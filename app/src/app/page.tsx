import { getTokensPage } from "@/api";

import { ClientTokenList } from "./ClientTokenList";
export default async function Tokens() {
  const { tokens } = await getTokensPage();

  return <ClientTokenList tokens={tokens} />;
}

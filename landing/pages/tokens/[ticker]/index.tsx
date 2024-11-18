import { useRouter } from "next/router";

export default function Token() {
  const {
    query: { ticker },
  } = useRouter();

  return <div>{ticker}</div>;
}

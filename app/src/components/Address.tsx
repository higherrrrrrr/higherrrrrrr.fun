import Link from "next/link";

export function Address({ text }: { text: string }) {
  return (
    <Link
      href={`/profile/${text}`}
      target="_blank"
      className="text-green-600 cursor-pointer hover:underline"
      title={text}
    >
      {text.slice(0, 6)}...{text.slice(-4)}
    </Link>
  );
}

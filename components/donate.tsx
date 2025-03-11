import Link from "next/link";

export function Donate() {
  return (
    <Link
      href="https://tadjh.com/donate/chatjack"
      target="_blank"
      className="game-text-shadow flex cursor-pointer gap-3 px-4 text-lg underline-offset-4 hover:underline"
    >
      Donate
    </Link>
  );
}

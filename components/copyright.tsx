import Link from "next/link";

export function Copyright() {
  return (
    <div className="flex items-center">
      {`© ${new Date().getFullYear()}`}
      <Link
        href="https://tadjh.com"
        target="_blank"
        className="game-text-shadow flex cursor-pointer gap-3 px-4 text-lg underline-offset-4 hover:underline"
      >
        tadjh.com
      </Link>
    </div>
  );
}

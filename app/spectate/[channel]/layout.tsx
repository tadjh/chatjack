import { SearchProvider } from "@/components/search-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SearchProvider>{children}</SearchProvider>;
}

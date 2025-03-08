import { SearchProvider } from "@/components/search-provider";
import { SpectatorView } from "@/components/spectator-view";

export default async function Page() {
  return (
    <SearchProvider>
      <SpectatorView />
    </SearchProvider>
  );
}

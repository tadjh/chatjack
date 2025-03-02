import { useSearchParams } from "react-router";
import { Canvas, CanvasProps } from "@/components/canvas";

function App() {
  const [searchParams] = useSearchParams();

  const props: CanvasProps = {
    fixedDeck: searchParams.get("deck"),
    debug: searchParams.get("debug"),
    channel: searchParams.get("channel"),
  };

  return <Canvas {...props} />;
}

export default App;

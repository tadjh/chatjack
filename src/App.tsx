import { useSearchParams } from "react-router";
import { Canvas, CanvasProps } from "@/components/canvas";

function App() {
  const [searchParams] = useSearchParams();

  const props: CanvasProps = {
    deck: searchParams.get("deck"),
    debug: searchParams.get("debug"),
    channel: searchParams.get("channel"),
    timer: searchParams.get("timer"),
    fps: searchParams.get("fps"),
  };

  return <Canvas {...props} />;
}

export default App;

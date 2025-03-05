import { Suspense } from "react";
import App from "./app";

export default function Home() {
  return (
    <Suspense>
      <App />
    </Suspense>
  );
}

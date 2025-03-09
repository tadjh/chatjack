import OpenGraphImage from "@/lib/opengraph-image";
export { size, alt, contentType } from "@/lib/opengraph-image";

export default function Image({ params }: { params: { channel: string } }) {
  return OpenGraphImage({
    params,
  });
}

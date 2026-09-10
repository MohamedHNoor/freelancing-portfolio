import { serializeJsonLd, type JsonLd as JsonLdDocument } from "@/lib/structured-data";

/** Renders one JSON-LD document into the page.
 *
 *  The single place this site writes `dangerouslySetInnerHTML` for structured
 *  data, so the `<` escaping in `serializeJsonLd` cannot be forgotten by a
 *  caller. The Metadata API has no field for JSON-LD; a script element in the
 *  body is what the Next.js docs prescribe. */
export function JsonLd({ data }: { data: JsonLdDocument }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

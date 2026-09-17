type JsonLdValue = Record<string, unknown> | Record<string, unknown>[];

export function JsonLd({ data }: { data: JsonLdValue }) {
  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}

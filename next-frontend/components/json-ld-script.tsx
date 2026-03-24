interface JsonLdScriptProps {
  payload: unknown;
}

export function JsonLdScript({ payload }: JsonLdScriptProps) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }} />;
}

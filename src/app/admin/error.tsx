"use client";

import { ErroInesperado } from "@/app/_components/erro-inesperado";

// Safety net for genuinely unexpected errors (bugs), not for expected
// validation/business-rule failures — those are surfaced via redirectComErro
// (see src/lib/redirect-with-error.ts) so they aren't redacted by
// Next.js's default production error handling.
export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErroInesperado reset={reset} />;
}

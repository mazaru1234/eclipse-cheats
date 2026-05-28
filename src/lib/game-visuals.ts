const COVER_GRADIENTS = [
  "linear-gradient(135deg, #1a1520 0%, #3d2f14 55%, #0c0c0f 100%)",
  "linear-gradient(135deg, #0f1419 0%, #1e3a5f 55%, #0c0c0f 100%)",
  "linear-gradient(135deg, #140f19 0%, #4a1942 55%, #0c0c0f 100%)",
  "linear-gradient(135deg, #101410 0%, #1a4d2e 55%, #0c0c0f 100%)",
  "linear-gradient(135deg, #1a1010 0%, #5c1a1a 55%, #0c0c0f 100%)",
];

export function gameGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * (i + 1)) % COVER_GRADIENTS.length;
  return COVER_GRADIENTS[hash];
}

export function gameInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

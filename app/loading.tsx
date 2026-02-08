export default function Loading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background"
      style={{ backgroundColor: "#050505" }}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
    </div>
  );
}

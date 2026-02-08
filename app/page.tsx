import AuthForm from "@/components/auth-form";

export default function Page() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-16">
      <div
        className="absolute inset-0"
        style={{ pointerEvents: "none" }}
        aria-hidden
      >
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gold/[0.04] blur-[140px]" />
        <div className="absolute -bottom-56 -left-56 h-[600px] w-[600px] rounded-full bg-gold/[0.03] blur-[160px]" />
        <div className="absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.015] blur-[200px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(212,175,55,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.4) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(5,5,5,0.6) 100%)",
          }}
        />
      </div>
      <div className="relative z-10 w-full" style={{ pointerEvents: "auto" }}>
        <AuthForm />
      </div>
    </main>
  );
}

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="-mx-4 -mb-24 -mt-6 flex h-[calc(100vh-4rem-4rem)] flex-col lg:-mx-8 lg:-mb-8 lg:-mt-8 lg:h-[calc(100vh-4rem)]">
      {children}
    </div>
  );
}

// app/landing/layout.tsx
export default function LandingLayout({
                                          children,
                                      }: {
    children: React.ReactNode;
}) {
    return (
        <div className="bg-black text-white min-h-screen overflow-y-auto">
            {children}
        </div>
    );
}
import Link from 'next/link';

export default function LandingFooter() {
    const footerLinks = {
        navigasi: [
            { name: 'Fitur', href: '#features' },
            { name: 'Perbandingan', href: '#comparison' },
            { name: 'Testimoni', href: '#testimonials' },
            { name: 'Dokumentasi', href: '#docs' }
        ],
        komunitas: [
            { name: 'Forum', href: '#' },
            { name: 'GitHub', href: '#' },
            { name: 'Discord', href: '#' }
        ],
        bantuan: [
            { name: 'Dokumentasi', href: '#' },
            { name: 'Tutorial', href: '#' },
            { name: 'FAQ', href: '#' }
        ]
    };

    return (
        <footer className="border-t border-border py-16 bg-background">
            <div className="container mx-auto px-4 md:px-8 max-w-6xl">
                <div className="flex flex-wrap">
                    <div className="w-full md:w-1/4 mb-8 md:mb-0 pr-8">
                        <div className="font-bold text-lg mb-4 text-foreground">
                            <span className="bg-primary text-primary-foreground px-2 py-1 rounded-sm">Stat</span>
                            <span>ify</span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Simplified Statistical Analysis berbasis web yang terbuka dan gratis untuk semua.
                        </p>
                    </div>

                    <div className="w-full md:w-3/4 flex flex-wrap justify-between">
                        <div className="w-1/2 md:w-1/3 mb-8 md:mb-0">
                            <h3 className="font-medium text-sm text-foreground mb-4">Navigasi</h3>
                            <nav className="flex flex-col space-y-2">
                                {footerLinks.navigasi.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.href}
                                        className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        <div className="w-1/2 md:w-1/3 mb-8 md:mb-0">
                            <h3 className="font-medium text-sm text-foreground mb-4">Komunitas</h3>
                            <nav className="flex flex-col space-y-2">
                                {footerLinks.komunitas.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.href}
                                        className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        <div className="w-1/2 md:w-1/3">
                            <h3 className="font-medium text-sm text-foreground mb-4">Bantuan</h3>
                            <nav className="flex flex-col space-y-2">
                                {footerLinks.bantuan.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.href}
                                        className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row md:justify-between md:items-center text-xs text-muted-foreground">
                    <p>© {new Date().getFullYear()} Statify. Open Source.</p>
                    <div className="mt-4 md:mt-0">
                        <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200 mr-6">Privasi</Link>
                        <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Ketentuan</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
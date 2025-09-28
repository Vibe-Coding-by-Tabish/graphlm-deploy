"use client"
import { HeaderAuth } from "./auth";
import { usePathname, useRouter } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const onCta = () => {
    if (pathname === '/workspace') router.push('/');
    else router.push('/workspace');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/60 backdrop-blur-sm backdrop-saturate-150">
      <div className="container px-6 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-teal-500">
              <span className="text-sm font-bold text-white">G</span>
            </div>
            <span className="text-xl font-bold text-slate-800">GraphLM</span>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <a href="#" className="text-slate-800 hover:text-blue-600 transition-colors">Home</a>
            <a href="#about" className="text-slate-500 hover:text-slate-800 transition-colors">About</a>
            <a href="#product" className="text-slate-500 hover:text-slate-800 transition-colors">Product</a>
            <a href="#contact" className="text-slate-500 hover:text-slate-800 transition-colors">Contact</a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* <button onClick={onCta} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-400 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 rounded-full">
            {pathname === '/workspace' ? 'Back to Home' : 'Try GraphLM'}
          </button> */}
          <div className="hidden sm:block ">
            <HeaderAuth />
          </div>
          <div className="sm:hidden">
            <HeaderAuth />
          </div>
        </div>
      </div>
    </header>
  );
}

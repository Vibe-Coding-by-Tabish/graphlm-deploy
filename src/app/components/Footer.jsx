export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-100 bg-white">
      <div className="container max-w-6xl mx-auto px-6 py-4">
        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          <div className="flex items-center space-x-4 text-sm text-slate-600">
            <a href="https://www.linkedin.com/in/tabishaliansari/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 transition-colors">Tabish</a>
            <a href="https://www.linkedin.com/in/vaishnavi-pangare/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 transition-colors">Vaishnavi</a>
            <a href="https://www.linkedin.com/in/sushantsunilshinde/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 transition-colors">Sushant</a>
          </div>

          <div className="flex items-center space-x-2 justify-center">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-r from-blue-600 to-teal-400">
              <span className="text-xs font-bold text-white">G</span>
            </div>
            <span className="text-sm text-slate-600 text-center">© {new Date().getFullYear()} GraphLM. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-6">
            <a className="text-sm text-slate-600 hover:text-slate-800 transition-colors" href="#">Privacy Policy</a>
            <a className="text-sm text-slate-600 hover:text-slate-800 transition-colors" href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { NavLink } from 'react-router-dom';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#1B1B18] text-[#F5F1E8] border-t border-[#292824] pt-12 pb-16 mt-auto">
      <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Brand Lockup */}
        <div className="md:col-span-2 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 flex items-center justify-center text-[#E85D3F]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <circle cx="12" cy="12" r="9" className="opacity-25" />
                <path d="M12 7v5l3 3" />
              </svg>
            </div>
            <span className="font-bold text-base tracking-tight font-sans text-white">
              Pulse<span className="text-[#E85D3F]">OS</span>
            </span>
          </div>
          <p className="text-xs text-[#B5B1A8] max-w-sm leading-relaxed">
            A premium student productivity operating system centered around Plan → Focus → Improve.
          </p>
        </div>

        {/* Product Links */}
        <div className="flex flex-col gap-2.5 text-xs">
          <span className="font-bold font-mono text-[#E85D3F] uppercase tracking-wider">
            Product
          </span>
          <NavLink to="/app" className="text-[#B5B1A8] hover:text-white transition-colors">
            Today Dashboard
          </NavLink>
          <NavLink to="/tasks" className="text-[#B5B1A8] hover:text-white transition-colors">
            Tasks Workspace
          </NavLink>
          <NavLink to="/focus" className="text-[#B5B1A8] hover:text-white transition-colors">
            Focus Mode
          </NavLink>
          <NavLink to="/analytics" className="text-[#B5B1A8] hover:text-white transition-colors">
            Productivity Insights
          </NavLink>
        </div>

        {/* Developer Attribution */}
        <div className="flex flex-col gap-2.5 text-xs">
          <span className="font-bold font-mono text-[#E85D3F] uppercase tracking-wider">
            Developer
          </span>
          <span className="text-white font-medium">Neeraj Mishra</span>
          <a
            href="https://github.com/Neeraj-code-beep"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#B5B1A8] hover:text-white transition-colors"
          >
            GitHub Profile
          </a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 border-t border-[#292824] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#77736C]">
        <span>Designed & developed by Neeraj Mishra</span>
        <span>© {currentYear} PulseOS. All rights reserved.</span>
      </div>
    </footer>
  );
};

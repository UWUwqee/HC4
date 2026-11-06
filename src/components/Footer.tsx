import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer-enter w-full shrink-0 border-t border-[#173a37] bg-[#173a37] text-white">
      <div className="px-5 py-2 text-center text-xs leading-4 text-white/75">
        © {new Date().getFullYear()} Delfin Salonga Health Center
      </div>
    </footer>
  );
};

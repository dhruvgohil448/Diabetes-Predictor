import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Brain, Activity } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-[#E2E8F0] sticky top-0 z-50 shadow-sm" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-3 group" data-testid="logo-link">
            <div className="bg-[#2563EB] p-2 rounded-xl group-hover:bg-[#1D4ED8] transition-all duration-200 shadow-md shadow-[#2563EB]/20">
              <Brain className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">Hybrid Diabetes</h1>
              <p className="text-xs text-[#64748B] -mt-1">Prediction System</p>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors duration-200 ${
                isActive('/') ? 'text-[#2563EB]' : 'text-[#64748B] hover:text-[#2563EB]'
              }`}
              data-testid="nav-home"
            >
              Home
            </Link>
            <Link
              to="/predict"
              className={`text-sm font-medium transition-colors duration-200 ${
                isActive('/predict') ? 'text-[#2563EB]' : 'text-[#64748B] hover:text-[#2563EB]'
              }`}
              data-testid="nav-predict"
            >
              Predict
            </Link>
            <a
              href="#about"
              className="text-sm font-medium text-[#64748B] hover:text-[#2563EB] transition-colors duration-200"
              data-testid="nav-about"
            >
              About
            </a>
            <Link
              to="/predict"
              className="bg-[#2563EB] text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-[#1D4ED8] transition-all duration-200 shadow-sm shadow-[#2563EB]/20 hover:shadow-md hover:-translate-y-0.5 flex items-center gap-2"
              data-testid="nav-cta-button"
            >
              <Activity size={16} />
              Start Analysis
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
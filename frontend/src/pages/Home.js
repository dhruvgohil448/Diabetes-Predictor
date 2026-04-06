import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Lightbulb, Shield, ArrowRight, Activity, TrendingUp } from 'lucide-react';
import Navbar from '../components/Navbar';

const Home = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const features = [
    {
      icon: Brain,
      title: 'Neural Network Prediction',
      description: 'Advanced AI model predicts diabetes probability using patient data.',
      color: '#2563EB'
    },
    {
      icon: Lightbulb,
      title: 'Fuzzy Logic Explanation',
      description: 'The system explains why the prediction was made in easy language.',
      color: '#F59E0B'
    },
    {
      icon: Shield,
      title: 'Better Decision Making',
      description: 'Helps users understand risk and take early action.',
      color: '#16A34A'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]" data-testid="home-page">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div {...fadeInUp}>
              <div className="inline-block bg-[#2563EB]/10 rounded-full px-4 py-2 mb-6">
                <span className="text-[#2563EB] text-sm font-semibold flex items-center gap-2">
                  <Activity size={16} />
                  AI-Powered Healthcare
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1E293B] mb-6 leading-tight" data-testid="hero-title">
                Predict Diabetes Risk Using{' '}
                <span className="text-[#2563EB]">AI + Fuzzy Logic</span>
              </h1>
              <p className="text-base font-normal leading-relaxed text-[#64748B] mb-8 max-w-xl" data-testid="hero-subtitle">
                A smart healthcare system that predicts diabetes risk and explains the reason in simple language.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/predict"
                  className="bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded-xl px-6 py-3 font-semibold transition-all duration-200 shadow-sm shadow-[#2563EB]/20 hover:shadow-md hover:-translate-y-0.5 flex items-center gap-2"
                  data-testid="start-prediction-button"
                >
                  Start Prediction
                  <ArrowRight size={18} />
                </Link>
                <a
                  href="#features"
                  className="bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-gray-50 rounded-xl px-6 py-3 font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  data-testid="learn-more-button"
                >
                  Learn More
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-[#E2E8F0]">
                <div>
                  <div className="flex items-center gap-2 text-2xl font-bold text-[#2563EB]">
                    <TrendingUp size={24} />
                    95%
                  </div>
                  <p className="text-sm text-[#64748B] mt-1">Accuracy</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#16A34A]">AI+FL</div>
                  <p className="text-sm text-[#64748B] mt-1">Hybrid System</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#F59E0B]">Fast</div>
                  <p className="text-sm text-[#64748B] mt-1">Results</p>
                </div>
              </div>
            </motion.div>

            {/* Right Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] animate-float">
                <img
                  src="https://images.unsplash.com/photo-1758691462774-f01ed567f2c4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzN8MHwxfHNlYXJjaHwxfHxkb2N0b3IlMjB1c2luZyUyMHRhYmxldCUyMGZ1dHVyaXN0aWN8ZW58MHx8fHwxNzc1NDg2Mjg5fDA&ixlib=rb-4.1.0&q=85"
                  alt="Doctor using futuristic medical technology"
                  className="w-full h-auto"
                  data-testid="hero-image"
                />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-[#E2E8F0]/50 hidden lg:block">
                <div className="flex items-center gap-4">
                  <div className="bg-[#16A34A]/10 p-3 rounded-xl">
                    <Shield className="text-[#16A34A]" size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1E293B]">Secure & Private</p>
                    <p className="text-xs text-[#64748B]">Your data is protected</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#1E293B] mb-4" data-testid="features-title">
              Why Choose Our System?
            </h2>
            <p className="text-base font-normal leading-relaxed text-[#64748B] max-w-2xl mx-auto">
              Combining artificial intelligence with fuzzy logic for accurate and explainable predictions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2E8F0]/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-200"
                  data-testid={`feature-card-${index}`}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <Icon size={28} style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-[#1E293B] mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-base font-normal leading-relaxed text-[#64748B]">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white mb-6" data-testid="cta-title">
              Ready to Check Diabetes Risk?
            </h2>
            <p className="text-base font-normal leading-relaxed text-white/90 mb-8 max-w-2xl mx-auto">
              Get instant AI-powered risk assessment with clear explanations in seconds.
            </p>
            <Link
              to="/predict"
              className="inline-flex items-center gap-2 bg-white text-[#2563EB] hover:bg-gray-50 rounded-xl px-8 py-4 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              data-testid="analyze-patient-data-button"
            >
              Analyze Patient Data
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-[#64748B]">
            © 2024 Hybrid Diabetes Prediction System. Built with AI for better healthcare.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;

import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  Lightbulb,
  Shield,
  ArrowRight,
  Activity,
  TrendingUp,
  Clock3,
} from "lucide-react";
import Navbar from "../components/Navbar";

const Home = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7 },
  };

  const features = [
    {
      icon: Brain,
      title: "Hybrid Neuro-Fuzzy Model",
      description:
        "A PyTorch neural network works together with fuzzy logic rules to improve prediction reliability and reduce false positives.",
      color: "#2563EB",
    },
    {
      icon: Lightbulb,
      title: "Explainable Predictions",
      description:
        "The system clearly highlights which biomarkers such as HbA1c, BMI, triglycerides, or age contributed to the result.",
      color: "#F59E0B",
    },
    {
      icon: Shield,
      title: "Clinical Decision Support",
      description:
        "Designed for early diabetes screening and follow-up support. It helps users take action sooner, but does not replace a doctor.",
      color: "#16A34A",
    },
  ];

  const stats = [
    {
      icon: TrendingUp,
      value: "82–88%",
      label: "Confidence Range",
      description:
        "Typical prediction confidence from the neural network model.",
      color: "#2563EB",
    },
    {
      icon: Activity,
      value: "5",
      label: "Health Indicators",
      description: "HbA1c, BMI, Age, Triglycerides and Urea are used.",
      color: "#16A34A",
    },
    {
      icon: Clock3,
      value: "< 3 sec",
      label: "Average Analysis Time",
      description: "Risk assessment is generated almost instantly.",
      color: "#F59E0B",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]" data-testid="home-page">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-120px] left-[-80px] w-[320px] h-[320px] bg-[#2563EB]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-120px] right-[-80px] w-[320px] h-[320px] bg-[#16A34A]/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* LEFT */}
            <motion.div {...fadeInUp}>
              <div className="inline-flex items-center gap-2 bg-[#2563EB]/10 text-[#2563EB] rounded-full px-4 py-2 mb-6">
                <Activity size={16} />
                <span className="text-sm font-semibold">
                  AI-Powered Diabetes Screening
                </span>
              </div>

              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1E293B] leading-tight mb-6"
                data-testid="hero-title">
                Predict Diabetes Risk Using{" "}
                <span className="text-[#2563EB]">Neuro + Fuzzy AI</span>
              </h1>

              <p
                className="text-lg leading-relaxed text-[#64748B] max-w-2xl mb-8"
                data-testid="hero-subtitle">
                This system combines a PyTorch neural network with fuzzy logic
                to estimate diabetes risk from HbA1c, BMI, age, triglycerides
                and urea levels. It also explains the prediction in simple
                language.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/predict"
                  className="bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded-2xl px-7 py-4 font-semibold transition-all duration-200 shadow-lg shadow-[#2563EB]/20 hover:-translate-y-0.5 flex items-center gap-2"
                  data-testid="start-prediction-button">
                  Start Prediction
                  <ArrowRight size={18} />
                </Link>

                <a
                  href="#features"
                  className="bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-gray-50 rounded-2xl px-7 py-4 font-semibold transition-all duration-200 shadow-sm hover:shadow-md">
                  Learn More
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 pt-8 border-t border-[#E2E8F0]">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + index * 0.12 }}
                      className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/80 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-[#F8FAFC] flex items-center justify-center">
                          <Icon size={22} style={{ color: stat.color }} />
                        </div>

                        <div>
                          <div
                            className="text-2xl font-bold"
                            style={{ color: stat.color }}>
                            {stat.value}
                          </div>
                          <div className="text-sm font-semibold text-[#1E293B]">
                            {stat.label}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-[#64748B] leading-relaxed">
                        {stat.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* RIGHT IMAGE */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative">
              <div className="rounded-3xl overflow-hidden border border-[#E2E8F0]/70 shadow-[0_10px_40px_rgba(0,0,0,0.08)] bg-white">
                <img
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80"
                  alt="Doctor reviewing digital health reports"
                  className="w-full h-full object-cover"
                  data-testid="hero-image"
                />
              </div>

              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 hidden lg:flex bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_8px_30px_rgba(0,0,0,0.08)] px-5 py-4 items-center gap-4">
                <div className="bg-[#16A34A]/10 p-3 rounded-xl">
                  <Shield className="text-[#16A34A]" size={22} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#1E293B]">
                    Private & Secure
                  </p>
                  <p className="text-xs text-[#64748B]">
                    Uploaded reports stay protected
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#1E293B] mb-4"
              data-testid="features-title">
              Why Choose This System?
            </h2>

            <p className="text-[#64748B] max-w-3xl mx-auto text-lg leading-relaxed">
              The model combines neural networks and fuzzy rules to produce more
              understandable and clinically meaningful diabetes predictions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.12 }}
                  className="bg-[#F8FAFC] rounded-3xl p-8 border border-[#E2E8F0]/70 hover:border-[#CBD5E1] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                    style={{
                      backgroundColor: `${feature.color}15`,
                    }}>
                    <Icon size={28} style={{ color: feature.color }} />
                  </div>

                  <h3 className="text-xl font-semibold text-[#1E293B] mb-3">
                    {feature.title}
                  </h3>

                  <p className="text-[#64748B] leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-br from-[#2563EB] to-[#1D4ED8]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}>
            <h2
              className="text-3xl sm:text-4xl font-bold text-white mb-6"
              data-testid="cta-title">
              Ready to Assess Diabetes Risk?
            </h2>

            <p className="text-lg text-white/90 leading-relaxed mb-8 max-w-2xl mx-auto">
              Upload your medical report or enter values manually to receive an
              instant AI-powered assessment with explanations and
              recommendations.
            </p>

            <Link
              to="/predict"
              className="inline-flex items-center gap-2 bg-white text-[#2563EB] hover:bg-gray-100 rounded-2xl px-8 py-4 font-semibold transition-all duration-200 shadow-xl hover:-translate-y-0.5"
              data-testid="analyze-patient-data-button">
              Analyze Patient Data
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#E2E8F0] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-[#64748B]">
            © 2026 Hybrid Diabetes Prediction System • Built with PyTorch, Fuzzy
            Logic and Explainable AI
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;

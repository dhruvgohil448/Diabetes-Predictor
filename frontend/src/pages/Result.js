import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  Activity, 
  Heart, 
  Droplets, 
  User, 
  Download,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import Navbar from '../components/Navbar';
import CircularProgress from '../components/CircularProgress';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

const Result = () => {
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
  const patientDataString = localStorage.getItem('patientData');
  const predictionResultString = localStorage.getItem('predictionResult');

  if (!patientDataString || !predictionResultString) {
    navigate('/predict');
    return;
  }

  const patient = JSON.parse(patientDataString);
  const prediction = JSON.parse(predictionResultString);

  setPatientData(patient);

  const hba1c = parseFloat(patient.HbA1c);
  const bmi = parseFloat(patient.BMI);
  const age = parseFloat(patient.AGE);
  const tg = parseFloat(patient.TG);
  const urea = parseFloat(patient.Urea);

  // Use backend prediction if available
  const probability = prediction.fuzzy_score
  ? Math.round((prediction.fuzzy_score / 10) * 100)
  : prediction.confidence
    ? parseFloat(prediction.confidence)
    : 0;

const risk = prediction.prediction || 'Unknown';

  const reasons = [];

  if (hba1c >= 6.5) reasons.push('HbA1c level is elevated');
  if (bmi >= 30) reasons.push('BMI falls in the obese range');
  if (age >= 45) reasons.push('Age increases diabetes risk');
  if (tg >= 2.3) reasons.push('Triglyceride level is high');
  if (urea >= 7) reasons.push('Urea level is elevated');

  const explanation =
  prediction.explanation ||
  (reasons.length > 0
    ? `The patient has ${risk.toLowerCase()} because ${reasons.join(', ')}.`
    : 'All parameters are within normal ranges.');

  const recommendations =
  prediction.precautions || [];

  if (hba1c >= 6.5) {
    recommendations.push('Monitor blood sugar regularly');
    recommendations.push('Consult an endocrinologist');
  }

  if (bmi >= 30) {
    recommendations.push('Adopt a low-calorie healthy diet');
    recommendations.push('Exercise at least 30 minutes daily');
  }

  if (tg >= 2.3) {
    recommendations.push('Reduce fatty food intake');
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain your current healthy lifestyle');
    recommendations.push('Get regular health checkups');
  }

  setResult({
    probability,
    risk,
    explanation,
    recommendations,
    summary: {
      hba1c,
      bmi,
      age,
      tg,
      urea
    }
  });
}, [navigate]);

  const handleDownloadReport = () => {
    toast.success('Report download feature coming soon!', {
      description: 'PDF generation will be available in the next update.'
    });
  };

  if (!result || !patientData) {
    return null;
  }

  const getRiskColor = (riskLevel) => {
    if (riskLevel === 'Low Risk') return 'text-[#16A34A] bg-[#16A34A]/10';
    if (riskLevel === 'Medium Risk') return 'text-[#F59E0B] bg-[#F59E0B]/10';
    if (riskLevel === 'High Risk') return 'text-[#FB923C] bg-[#FB923C]/10';
    return 'text-[#DC2626] bg-[#DC2626]/10';
  };

  const getRiskIcon = (riskLevel) => {
    if (riskLevel === 'Low Risk' || riskLevel === 'Medium Risk') {
      return <CheckCircle size={20} />;
    }
    return <AlertCircle size={20} />;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]" data-testid="result-page">
      <Navbar />
      <Toaster />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Back Button */}
          <Link 
            to="/predict" 
            className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#2563EB] transition-colors duration-200 mb-6"
            data-testid="back-button"
          >
            <ArrowLeft size={20} />
            Back to Form
          </Link>

          {/* Result Card */}
          <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2E8F0]/50 mb-6">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <CircularProgress percentage={result.probability} size={220} />
              </div>

              <div className="flex-1 text-center lg:text-left">
                <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium mb-4 ${getRiskColor(result.risk)}`} data-testid="risk-badge">
                  {getRiskIcon(result.risk)}
                  {result.risk}
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#1E293B] mb-3" data-testid="result-description">
                  The patient has a {result.risk.toLowerCase()} probability of diabetes.
                </h2>
                <p className="text-base text-[#64748B] leading-relaxed">
                  Based on the provided medical data, our hybrid AI system has analyzed multiple health indicators to generate this risk assessment.
                </p>
              </div>
            </div>
          </div>

          {/* Explanation Section */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2E8F0]/50 mb-6">
            <div className="flex items-start gap-4">
              <div className="bg-[#F59E0B]/10 p-3 rounded-xl flex-shrink-0">
                <Lightbulb className="text-[#F59E0B]" size={24} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold text-[#1E293B] mb-3" data-testid="explanation-title">
                  Why This Result?
                </h3>
                <p className="text-base text-[#64748B] leading-relaxed" data-testid="explanation-text">
                  {result.explanation}
                </p>
              </div>
            </div>
          </div>

          {/* Patient Summary Grid */}
          <div className="mb-6">
            <h3 className="text-xl sm:text-2xl font-semibold text-[#1E293B] mb-4">
              Patient Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.1 }}
    className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2E8F0]/50"
  >
    <div className="flex items-center gap-3 mb-2">
      <div className="bg-[#DC2626]/10 p-2 rounded-lg">
        <Droplets className="text-[#DC2626]" size={20} />
      </div>
      <span className="text-sm text-[#64748B]">HbA1c</span>
    </div>

    <p className="text-2xl font-bold text-[#1E293B]">
      {result.summary.hba1c}
    </p>

    <p className="text-xs text-[#64748B] mt-1">
      {result.summary.hba1c >= 6.5 ? 'High' : 'Normal'}
    </p>
  </motion.div>

  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.2 }}
    className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2E8F0]/50"
  >
    <div className="flex items-center gap-3 mb-2">
      <div className="bg-[#F59E0B]/10 p-2 rounded-lg">
        <Activity className="text-[#F59E0B]" size={20} />
      </div>
      <span className="text-sm text-[#64748B]">BMI</span>
    </div>

    <p className="text-2xl font-bold text-[#1E293B]">
      {result.summary.bmi}
    </p>

    <p className="text-xs text-[#64748B] mt-1">
      {result.summary.bmi >= 30 ? 'Obese' : result.summary.bmi >= 25 ? 'Overweight' : 'Normal'}
    </p>
  </motion.div>

  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.3 }}
    className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2E8F0]/50"
  >
    <div className="flex items-center gap-3 mb-2">
      <div className="bg-[#2563EB]/10 p-2 rounded-lg">
        <Heart className="text-[#2563EB]" size={20} />
      </div>
      <span className="text-sm text-[#64748B]">TG</span>
    </div>

    <p className="text-2xl font-bold text-[#1E293B]">
      {result.summary.tg}
    </p>

    <p className="text-xs text-[#64748B] mt-1">
      {result.summary.tg >= 2.3 ? 'High' : 'Normal'}
    </p>
  </motion.div>

  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.4 }}
    className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2E8F0]/50"
  >
    <div className="flex items-center gap-3 mb-2">
      <div className="bg-[#8B5CF6]/10 p-2 rounded-lg">
        <Activity className="text-[#8B5CF6]" size={20} />
      </div>
      <span className="text-sm text-[#64748B]">Urea</span>
    </div>

    <p className="text-2xl font-bold text-[#1E293B]">
      {result.summary.urea}
    </p>

    <p className="text-xs text-[#64748B] mt-1">
      {result.summary.urea >= 7 ? 'High' : 'Normal'}
    </p>
  </motion.div>

  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.5 }}
    className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2E8F0]/50"
  >
    <div className="flex items-center gap-3 mb-2">
      <div className="bg-[#16A34A]/10 p-2 rounded-lg">
        <User className="text-[#16A34A]" size={20} />
      </div>
      <span className="text-sm text-[#64748B]">Age</span>
    </div>

    <p className="text-2xl font-bold text-[#1E293B]">
      {result.summary.age}
    </p>

    <p className="text-xs text-[#64748B] mt-1">
      years
    </p>
  </motion.div>
</div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2E8F0]/50 mb-6">
            <h3 className="text-xl sm:text-2xl font-semibold text-[#1E293B] mb-6" data-testid="recommendations-title">
              Recommended Next Steps
            </h3>
            <div className="space-y-4">
              {result.recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-start gap-3"
                  data-testid={`recommendation-${index}`}
                >
                  <div className="bg-[#16A34A]/10 p-2 rounded-lg flex-shrink-0 mt-0.5">
                    <CheckCircle className="text-[#16A34A]" size={16} />
                  </div>
                  <p className="text-base text-[#1E293B] leading-relaxed">{rec}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <Link
              to="/predict"
              className="flex-1 min-w-[200px] bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded-xl px-6 py-4 font-semibold transition-all duration-200 shadow-sm shadow-[#2563EB]/20 hover:shadow-md hover:-translate-y-0.5 text-center"
              data-testid="analyze-another-patient-button"
            >
              Analyze Another Patient
            </Link>
            <button
              onClick={handleDownloadReport}
              className="flex-1 min-w-[200px] bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-gray-50 rounded-xl px-6 py-4 font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2"
              data-testid="download-report-button"
            >
              <Download size={20} />
              Download Report
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Result;

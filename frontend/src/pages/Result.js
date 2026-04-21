import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Lightbulb,
  Activity,
  Heart,
  Droplets,
  User,
  Download,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
  Loader2,
} from "lucide-react";
import Navbar from "../components/Navbar";
import CircularProgress from "../components/CircularProgress";
import { toast } from "sonner";
import { Toaster } from "../components/ui/sonner";

const Result = () => {
  const navigate = useNavigate();

  const [patientData, setPatientData] = useState(null);
  const [result, setResult] = useState(null);
  const [uploadedReports, setUploadedReports] = useState([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const patientDataString = localStorage.getItem("patientData");
    const predictionResultString = localStorage.getItem("predictionResult");
    const uploadedReportsString = localStorage.getItem("uploadedReports");

    if (!patientDataString || !predictionResultString) {
      navigate("/predict");
      return;
    }

    const patient = JSON.parse(patientDataString);
    const prediction = JSON.parse(predictionResultString);

    if (uploadedReportsString) {
      setUploadedReports(JSON.parse(uploadedReportsString));
    }

    setPatientData(patient);

    const hba1c = parseFloat(patient.HbA1c);
    const bmi = parseFloat(patient.BMI);
    const age = parseFloat(patient.AGE);
    const tg = parseFloat(patient.TG);
    const urea = parseFloat(patient.Urea);

    const probability = prediction.fuzzy_score
      ? Math.round((prediction.fuzzy_score / 10) * 100)
      : prediction.confidence
        ? parseFloat(prediction.confidence)
        : 0;

    const risk = prediction.prediction || "Unknown Risk";

    const reasons = [];

    if (hba1c >= 6.5) reasons.push("HbA1c level is elevated");
    if (bmi >= 30) reasons.push("BMI falls in the obese range");
    if (age >= 45) reasons.push("Age increases diabetes risk");
    if (tg >= 2.3) reasons.push("Triglyceride level is high");
    if (urea >= 7) reasons.push("Urea level is elevated");

    const explanation =
      prediction.explanation ||
      (reasons.length > 0
        ? `The patient has ${risk.toLowerCase()} because ${reasons.join(", ")}.`
        : "All parameters are within normal ranges.");

    const recommendations = [...(prediction.precautions || [])];

    if (hba1c >= 6.5) {
      recommendations.push("Monitor blood sugar regularly");
      recommendations.push("Consult an endocrinologist");
    }

    if (bmi >= 30) {
      recommendations.push("Adopt a low-calorie healthy diet");
      recommendations.push("Exercise at least 30 minutes daily");
    }

    if (tg >= 2.3) {
      recommendations.push("Reduce fatty food intake");
    }

    if (recommendations.length === 0) {
      recommendations.push("Maintain your current healthy lifestyle");
      recommendations.push("Get regular health checkups");
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
        urea,
      },
    });
  }, [navigate]);

  const handleDownloadReport = async () => {
    try {
      setDownloading(true);

      const reportData = {
        generatedAt: new Date().toLocaleString(),
        patient: patientData,
        result,
        uploadedReports,
      };

      const response = await fetch("http://localhost:5000/download-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `diabetes_report_${Date.now()}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success("Report downloaded successfully!");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  if (!result || !patientData) return null;

  const getRiskColor = (riskLevel) => {
    if (riskLevel === "Low Risk") return "text-[#16A34A] bg-[#16A34A]/10";
    if (riskLevel === "Medium Risk") return "text-[#F59E0B] bg-[#F59E0B]/10";
    if (riskLevel === "High Risk") return "text-[#FB923C] bg-[#FB923C]/10";
    return "text-[#DC2626] bg-[#DC2626]/10";
  };

  const getRiskIcon = (riskLevel) => {
    if (riskLevel === "Low Risk" || riskLevel === "Medium Risk") {
      return <CheckCircle size={20} />;
    }

    return <AlertCircle size={20} />;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <Toaster />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>
          {/* Back */}
          <Link
            to="/predict"
            className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#2563EB] mb-6 transition-colors">
            <ArrowLeft size={18} />
            Back to Form
          </Link>

          {/* Main Result */}
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-8 mb-6">
            <div className="flex flex-col lg:flex-row gap-8 items-center">
              <div className="flex-shrink-0">
                <CircularProgress percentage={result.probability} size={220} />
              </div>

              <div className="flex-1 text-center lg:text-left">
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold mb-4 ${getRiskColor(
                    result.risk,
                  )}`}>
                  {getRiskIcon(result.risk)}
                  {result.risk}
                </div>

                <h1 className="text-3xl font-bold text-[#1E293B] mb-3">
                  {result.probability}% Diabetes Risk Probability
                </h1>

                <p className="text-[#64748B] text-base leading-relaxed">
                  Based on the uploaded medical reports and extracted patient
                  values, the AI system predicts a{" "}
                  <span className="font-semibold text-[#1E293B]">
                    {result.risk.toLowerCase()}
                  </span>{" "}
                  of diabetes.
                </p>
              </div>
            </div>
          </div>

          {/* Uploaded Reports */}
          {uploadedReports.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-[#2563EB]/10 p-3 rounded-2xl">
                  <FileText className="text-[#2563EB]" size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-[#1E293B]">
                    Uploaded Reports
                  </h2>
                  <p className="text-sm text-[#64748B]">
                    Reports used for this prediction
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {uploadedReports.map((report, index) => (
                  <motion.div
                    key={report}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-3">
                    <FileText className="text-[#2563EB]" size={18} />
                    <span className="text-[#1E293B] font-medium">{report}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 md:p-8 mb-6">
            <div className="flex items-start gap-4">
              <div className="bg-[#F59E0B]/10 p-3 rounded-2xl">
                <Lightbulb className="text-[#F59E0B]" size={24} />
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-[#1E293B] mb-3">
                  Why This Result?
                </h2>

                <p className="text-[#64748B] leading-relaxed text-base">
                  {result.explanation}
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-[#1E293B] mb-4">
              Patient Summary
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                {
                  label: "HbA1c",
                  value: result.summary.hba1c,
                  status: result.summary.hba1c >= 6.5 ? "High" : "Normal",
                  icon: <Droplets className="text-[#DC2626]" size={20} />,
                  bg: "bg-[#DC2626]/10",
                },
                {
                  label: "BMI",
                  value: result.summary.bmi,
                  status:
                    result.summary.bmi >= 30
                      ? "Obese"
                      : result.summary.bmi >= 25
                        ? "Overweight"
                        : "Normal",
                  icon: <Activity className="text-[#F59E0B]" size={20} />,
                  bg: "bg-[#F59E0B]/10",
                },
                {
                  label: "TG",
                  value: result.summary.tg,
                  status: result.summary.tg >= 2.3 ? "High" : "Normal",
                  icon: <Heart className="text-[#2563EB]" size={20} />,
                  bg: "bg-[#2563EB]/10",
                },
                {
                  label: "Urea",
                  value: result.summary.urea,
                  status: result.summary.urea >= 7 ? "High" : "Normal",
                  icon: <Activity className="text-[#8B5CF6]" size={20} />,
                  bg: "bg-[#8B5CF6]/10",
                },
                {
                  label: "Age",
                  value: result.summary.age,
                  status: "years",
                  icon: <User className="text-[#16A34A]" size={20} />,
                  bg: "bg-[#16A34A]/10",
                },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`${item.bg} p-2 rounded-xl`}>
                      {item.icon}
                    </div>

                    <span className="text-sm text-[#64748B]">{item.label}</span>
                  </div>

                  <div className="text-2xl font-bold text-[#1E293B]">
                    {item.value}
                  </div>

                  <div className="text-xs text-[#64748B] mt-1">
                    {item.status}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-semibold text-[#1E293B] mb-6">
              Recommended Next Steps
            </h2>

            <div className="space-y-4">
              {result.recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 * index }}
                  className="flex items-start gap-3">
                  <div className="bg-[#16A34A]/10 p-2 rounded-xl mt-0.5">
                    <CheckCircle className="text-[#16A34A]" size={16} />
                  </div>

                  <p className="text-[#1E293B] leading-relaxed">{rec}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4">
            <Link
              to="/predict"
              className="flex-1 min-w-[220px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-2xl px-6 py-4 font-semibold text-center transition-all duration-200 shadow-sm shadow-[#2563EB]/20 hover:shadow-md">
              Analyze Another Patient
            </Link>

            <button
              onClick={handleDownloadReport}
              disabled={downloading}
              className="flex-1 min-w-[220px] bg-white border border-[#E2E8F0] hover:bg-gray-50 text-[#1E293B] rounded-2xl px-6 py-4 font-semibold transition-all duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow-md disabled:opacity-70">
              {downloading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Download Report
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Result;

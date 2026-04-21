import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Info,
  Activity,
  Loader2,
  Upload,
  FileText,
  X,
  Sparkles,
} from "lucide-react";
import Navbar from "../components/Navbar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

const PatientForm = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [formData, setFormData] = useState({
    hba1c: "",
    bmi: "",
    age: "",
    tg: "",
    urea: "",
  });

  const fields = [
    {
      name: "hba1c",
      label: "HbA1c",
      type: "number",
      placeholder: "e.g. 6.5",
      tooltip: "Hemoglobin A1c percentage",
      unit: "%",
      step: "0.1",
    },
    {
      name: "bmi",
      label: "BMI",
      type: "number",
      placeholder: "e.g. 28.4",
      tooltip: "Body Mass Index",
      unit: "kg/m²",
      step: "0.1",
    },
    {
      name: "age",
      label: "Age",
      type: "number",
      placeholder: "e.g. 45",
      tooltip: "Age in years",
      unit: "years",
    },
    {
      name: "tg",
      label: "Triglycerides (TG)",
      type: "number",
      placeholder: "e.g. 2.5",
      tooltip: "Triglyceride level in mmol/L",
      unit: "mmol/L",
      step: "0.1",
    },
    {
      name: "urea",
      label: "Urea",
      type: "number",
      placeholder: "e.g. 5.2",
      tooltip: "Blood urea level in mmol/L",
      unit: "mmol/L",
      step: "0.1",
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);

    if (!files.length) return;

    setUploadedFiles((prev) => [...prev, ...files]);
    setExtracting(true);

    try {
      const form = new FormData();

      files.forEach((file) => {
        form.append("reports", file);
      });

      const response = await fetch("http://localhost:5000/upload-reports", {
        method: "POST",
        body: form,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to extract report values");
      }

      setFormData((prev) => ({
        ...prev,
        hba1c:
          data.extracted?.HbA1c !== null && data.extracted?.HbA1c !== undefined
            ? data.extracted.HbA1c
            : prev.hba1c,
        bmi:
          data.extracted?.BMI !== null && data.extracted?.BMI !== undefined
            ? data.extracted.BMI
            : prev.bmi,
        age:
          data.extracted?.AGE !== null && data.extracted?.AGE !== undefined
            ? data.extracted.AGE
            : prev.age,
        tg:
          data.extracted?.TG !== null && data.extracted?.TG !== undefined
            ? data.extracted.TG
            : prev.tg,
        urea:
          data.extracted?.Urea !== null && data.extracted?.Urea !== undefined
            ? data.extracted.Urea
            : prev.urea,
      }));
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setExtracting(false);
    }
  };

  const removeFile = (indexToRemove) => {
    setUploadedFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.hba1c || formData.hba1c < 3 || formData.hba1c > 16) {
      newErrors.hba1c = "HbA1c must be between 3 and 16";
    }

    if (!formData.bmi || formData.bmi < 15 || formData.bmi > 50) {
      newErrors.bmi = "BMI must be between 15 and 50";
    }

    if (!formData.age || formData.age < 10 || formData.age > 90) {
      newErrors.age = "Age must be between 10 and 90";
    }

    if (!formData.tg || formData.tg < 0 || formData.tg > 14) {
      newErrors.tg = "TG must be between 0 and 14";
    }

    if (!formData.urea || formData.urea < 0 || formData.urea > 20) {
      newErrors.urea = "Urea must be between 0 and 20";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        HbA1c: Number(formData.hba1c),
        BMI: Number(formData.bmi),
        AGE: Number(formData.age),
        TG: Number(formData.tg),
        Urea: Number(formData.urea),
      };

      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Prediction failed");
      }

      localStorage.setItem("patientData", JSON.stringify(payload));
      localStorage.setItem("predictionResult", JSON.stringify(result));
      localStorage.setItem(
        "uploadedReports",
        JSON.stringify(uploadedFiles.map((file) => file.name)),
      );

      navigate("/result");
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]" data-testid="patient-form-page">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>
          {/* Heading */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1E293B] mb-4">
              Upload Reports or Enter Details
            </h1>

            <p className="text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed">
              Upload blood reports, prescriptions or lab reports and let the
              system automatically extract patient values for diabetes risk
              prediction.
            </p>
          </div>

          {/* Upload Card */}
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-[#BFDBFE] hover:border-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] rounded-3xl p-10 text-center transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-[#2563EB]/10 flex items-center justify-center mx-auto mb-4">
                  <Upload className="text-[#2563EB]" size={30} />
                </div>

                <h2 className="text-xl sm:text-2xl font-semibold text-[#1E293B] mb-2">
                  Upload Medical Reports
                </h2>

                <p className="text-[#64748B] mb-2">
                  Drag & drop or click to upload PDF, JPG or PNG files
                </p>

                <p className="text-sm text-[#94A3B8]">
                  Supports blood reports, prescriptions, lab reports and scan
                  reports
                </p>

                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </label>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="text-[#2563EB]" size={20} />
                  <h3 className="text-lg font-semibold text-[#1E293B]">
                    Uploaded Reports
                  </h3>
                </div>

                <div className="space-y-3">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                      <div>
                        <p className="font-medium text-[#1E293B]">
                          {file.name}
                        </p>
                        <p className="text-sm text-[#64748B]">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="w-9 h-9 rounded-full hover:bg-red-50 flex items-center justify-center text-[#94A3B8] hover:text-[#DC2626] transition-all">
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extraction Status */}
            {extracting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-5 flex items-center gap-4">
                <Loader2 className="animate-spin text-[#2563EB]" size={24} />

                <div>
                  <p className="font-semibold text-[#1E293B]">
                    Extracting data from uploaded reports...
                  </p>
                  <p className="text-sm text-[#64748B]">
                    Running OCR and automatically filling patient values.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Patient Values Form */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#E2E8F0] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-[#F59E0B]/10 p-3 rounded-2xl">
                <Sparkles className="text-[#F59E0B]" size={22} />
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-[#1E293B]">
                  Extracted / Manual Patient Values
                </h2>
                <p className="text-sm text-[#64748B]">
                  Review and edit the values before prediction.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-6">
                {fields.map((field, index) => (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
                      {field.label}

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger type="button">
                            <Info size={15} className="text-[#64748B]" />
                          </TooltipTrigger>

                          <TooltipContent>
                            <p className="text-sm">{field.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </label>

                    <div className="relative">
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        step={field.step || "1"}
                        className={`w-full rounded-xl border px-4 py-3 pr-20 outline-none transition-all duration-200 ${
                          errors[field.name]
                            ? "border-[#DC2626] focus:ring-2 focus:ring-[#FECACA]"
                            : "border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#BFDBFE]"
                        }`}
                      />

                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#64748B]">
                        {field.unit}
                      </span>
                    </div>

                    {errors[field.name] && (
                      <p className="text-sm text-[#DC2626]">
                        {errors[field.name]}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Submit */}
              <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
                <button
                  type="submit"
                  disabled={loading || extracting}
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-2xl px-6 py-4 font-semibold transition-all duration-200 flex items-center justify-center gap-3 shadow-sm shadow-[#2563EB]/20 hover:shadow-md">
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Running Prediction...
                    </>
                  ) : (
                    <>
                      <Activity size={20} />
                      Analyze Diabetes Risk
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Prediction Loading Overlay */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl">
                <div className="flex justify-center mb-5">
                  <div className="w-16 h-16 rounded-full bg-[#2563EB]/10 flex items-center justify-center">
                    <Loader2
                      className="animate-spin text-[#2563EB]"
                      size={34}
                    />
                  </div>
                </div>

                <h3 className="text-2xl font-semibold text-[#1E293B] mb-3">
                  Analyzing Patient Data
                </h3>

                <div className="space-y-2 text-[#64748B] text-sm">
                  <p className="animate-pulse">
                    Running Neural Network Analysis...
                  </p>
                  <p
                    className="animate-pulse"
                    style={{ animationDelay: "0.3s" }}>
                    Applying Fuzzy Logic Rules...
                  </p>
                  <p
                    className="animate-pulse"
                    style={{ animationDelay: "0.6s" }}>
                    Generating Recommendations...
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PatientForm;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Info, Activity, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';

const PatientForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
  hba1c: '',
  bmi: '',
  age: '',
  tg: '',
  urea: ''
});

  const fields = [
  {
    name: 'hba1c',
    label: 'HbA1c',
    type: 'number',
    placeholder: 'e.g. 6.5',
    tooltip: 'Hemoglobin A1c percentage',
    unit: '%',
    step: '0.1'
  },
  {
    name: 'bmi',
    label: 'BMI',
    type: 'number',
    placeholder: 'e.g. 28.4',
    tooltip: 'Body Mass Index',
    unit: 'kg/m²',
    step: '0.1'
  },
  {
    name: 'age',
    label: 'Age',
    type: 'number',
    placeholder: 'e.g. 45',
    tooltip: 'Age in years',
    unit: 'years'
  },
  {
    name: 'tg',
    label: 'Triglycerides (TG)',
    type: 'number',
    placeholder: 'e.g. 2.5',
    tooltip: 'Triglyceride level in mmol/L',
    unit: 'mmol/L',
    step: '0.1'
  },
  {
    name: 'urea',
    label: 'Urea',
    type: 'number',
    placeholder: 'e.g. 5.2',
    tooltip: 'Blood urea level in mmol/L',
    unit: 'mmol/L',
    step: '0.1'
  }
];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
  const newErrors = {};

  if (!formData.hba1c || formData.hba1c < 3 || formData.hba1c > 16) {
    newErrors.hba1c = 'HbA1c must be between 3 and 16';
  }

  if (!formData.bmi || formData.bmi < 15 || formData.bmi > 50) {
    newErrors.bmi = 'BMI must be between 15 and 50';
  }

  if (!formData.age || formData.age < 10 || formData.age > 90) {
    newErrors.age = 'Age must be between 10 and 90';
  }

  if (!formData.tg || formData.tg < 0 || formData.tg > 14) {
    newErrors.tg = 'TG must be between 0 and 14';
  }

  if (!formData.urea || formData.urea < 0 || formData.urea > 20) {
    newErrors.urea = 'Urea must be between 0 and 20';
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
      Urea: Number(formData.urea)
    };

    const response = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Prediction failed');
    }

    localStorage.setItem('patientData', JSON.stringify(payload));
    localStorage.setItem('predictionResult', JSON.stringify(result));

    navigate('/result');
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#1E293B] mb-3" data-testid="form-title">
              Enter Patient Details
            </h1>
            <p className="text-base font-normal leading-relaxed text-[#64748B]">
              Provide the following medical details to analyze diabetes risk.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E2E8F0]/50">
            <form onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-6">
                {fields.map((field, index) => (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="space-y-2"
                  >
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
                      {field.label}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger type="button">
                            <Info size={16} className="text-[#64748B]" />
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
                        step={field.step || '1'}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors[field.name] 
                            ? 'border-[#DC2626] focus:ring-[#DC2626]/50' 
                            : 'border-[#E2E8F0] focus:ring-[#60A5FA]/50'
                        } focus:ring-2 focus:border-[#2563EB] outline-none transition-all duration-200`}
                        data-testid={`input-${field.name}`}
                      />
                      {field.unit && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#64748B]">
                          {field.unit}
                        </span>
                      )}
                    </div>
                    {errors[field.name] && (
                      <p className="text-sm text-[#DC2626]" data-testid={`error-${field.name}`}>
                        {errors[field.name]}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded-xl px-6 py-4 font-semibold transition-all duration-200 shadow-sm shadow-[#2563EB]/20 hover:shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  data-testid="analyze-risk-button"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Activity size={20} />
                      Analyze Risk
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Loading Overlay */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              data-testid="loading-overlay"
            >
              <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
                <div className="flex justify-center mb-4">
                  <Loader2 className="animate-spin text-[#2563EB]" size={48} />
                </div>
                <h3 className="text-xl font-semibold text-[#1E293B] mb-2">
                  Analyzing Patient Data
                </h3>
                <div className="space-y-2 text-sm text-[#64748B]">
                  <p className="animate-pulse">Running Neural Network...</p>
                  <p className="animate-pulse" style={{ animationDelay: '0.3s' }}>
                    Applying Fuzzy Logic Rules...
                  </p>
                  <p className="animate-pulse" style={{ animationDelay: '0.6s' }}>
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

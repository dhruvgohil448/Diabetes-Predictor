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
    pregnancies: '',
    glucose: '',
    bloodPressure: '',
    skinThickness: '',
    insulin: '',
    bmi: '',
    diabetesPedigreeFunction: '',
    age: ''
  });

  const fields = [
    {
      name: 'pregnancies',
      label: 'Pregnancies',
      type: 'number',
      placeholder: 'e.g. 2',
      tooltip: 'Number of times pregnant',
      unit: ''
    },
    {
      name: 'glucose',
      label: 'Glucose',
      type: 'number',
      placeholder: 'e.g. 150',
      tooltip: 'Blood sugar level in mg/dL',
      unit: 'mg/dL'
    },
    {
      name: 'bloodPressure',
      label: 'Blood Pressure',
      type: 'number',
      placeholder: 'e.g. 80',
      tooltip: 'Diastolic blood pressure in mmHg',
      unit: 'mmHg'
    },
    {
      name: 'skinThickness',
      label: 'Skin Thickness',
      type: 'number',
      placeholder: 'e.g. 20',
      tooltip: 'Triceps skin fold thickness in mm',
      unit: 'mm'
    },
    {
      name: 'insulin',
      label: 'Insulin',
      type: 'number',
      placeholder: 'e.g. 90',
      tooltip: '2-Hour serum insulin in mu U/ml',
      unit: 'mu U/ml'
    },
    {
      name: 'bmi',
      label: 'BMI',
      type: 'number',
      placeholder: 'e.g. 32.5',
      tooltip: 'Body Mass Index based on height and weight',
      unit: 'kg/m²',
      step: '0.1'
    },
    {
      name: 'diabetesPedigreeFunction',
      label: 'Diabetes Pedigree Function',
      type: 'number',
      placeholder: 'e.g. 0.67',
      tooltip: 'Diabetes pedigree function score',
      unit: '',
      step: '0.01'
    },
    {
      name: 'age',
      label: 'Age',
      type: 'number',
      placeholder: 'e.g. 45',
      tooltip: 'Age in years',
      unit: 'years'
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
    fields.forEach(field => {
      if (!formData[field.name] || formData[field.name] === '') {
        newErrors[field.name] = 'This field is required';
      } else if (parseFloat(formData[field.name]) < 0) {
        newErrors[field.name] = 'Value cannot be negative';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Store form data in localStorage for result page
    localStorage.setItem('patientData', JSON.stringify(formData));
    
    setLoading(false);
    navigate('/result');
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

import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl

class OptimizedDiabetesFuzzy:
    def __init__(self):
        # 1. ANTECEDENTS (Inputs)
        self.hba1c = ctrl.Antecedent(np.arange(3, 16.1, 0.1), 'hba1c')
        self.bmi = ctrl.Antecedent(np.arange(15, 50.1, 0.1), 'bmi')
        self.age = ctrl.Antecedent(np.arange(10, 91, 1), 'age')
        self.tg = ctrl.Antecedent(np.arange(0, 14.1, 0.1), 'tg')
        
        # 2. CONSEQUENT (Output)
        self.diagnosis = ctrl.Consequent(np.arange(0, 10.1, 0.1), 'diagnosis')

        # 3. MEMBERSHIP FUNCTIONS (Gaussian for Neuro-Fuzzy compatibility)
        self.hba1c['L'] = fuzz.gaussmf(self.hba1c.universe, 4.0, 0.8)
        self.hba1c['M'] = fuzz.gaussmf(self.hba1c.universe, 6.0, 0.5)
        self.hba1c['H'] = fuzz.gaussmf(self.hba1c.universe, 9.0, 2.0)

        self.bmi['L'] = fuzz.gaussmf(self.bmi.universe, 20.0, 3.0)
        self.bmi['M'] = fuzz.gaussmf(self.bmi.universe, 27.0, 2.0)
        self.bmi['H'] = fuzz.gaussmf(self.bmi.universe, 35.0, 5.0)
        
        self.age['L'] = fuzz.trapmf(self.age.universe, [10, 10, 25, 35])
        self.age['M'] = fuzz.trimf(self.age.universe, [30, 45, 60])
        self.age['H'] = fuzz.trapmf(self.age.universe, [55, 70, 90, 90])
        
        self.tg['L'] = fuzz.trimf(self.tg.universe, [0, 0, 1.7])
        self.tg['M'] = fuzz.trimf(self.tg.universe, [1.5, 2.3, 4.0])
        self.tg['H'] = fuzz.trapmf(self.tg.universe, [3.5, 6.0, 14, 14])

        self.diagnosis['N'] = fuzz.trimf(self.diagnosis.universe, [0, 0, 5])
        self.diagnosis['P'] = fuzz.trimf(self.diagnosis.universe, [3, 5, 8])
        self.diagnosis['Y'] = fuzz.trimf(self.diagnosis.universe, [6, 10, 10])

        # 4. RULES
        rule1 = ctrl.Rule(self.hba1c['H'], self.diagnosis['Y'])
        rule2 = ctrl.Rule(self.hba1c['L'] & self.bmi['L'], self.diagnosis['N'])
        rule3 = ctrl.Rule(self.hba1c['M'] & self.bmi['H'], self.diagnosis['Y'])
        rule4 = ctrl.Rule(self.hba1c['M'] & self.bmi['M'], self.diagnosis['P'])
        rule5 = ctrl.Rule(self.tg['H'] & self.hba1c['M'], self.diagnosis['Y'])
        rule6 = ctrl.Rule(self.age['H'] & self.hba1c['M'], self.diagnosis['Y'])

        self.diabetes_ctrl = ctrl.ControlSystem([rule1, rule2, rule3, rule4, rule5, rule6])
        self.sys = ctrl.ControlSystemSimulation(self.diabetes_ctrl)

    def compute(self, hba1c_val, bmi_val, age_val, tg_val):
        try:
            self.sys.input['hba1c'] = hba1c_val
            self.sys.input['bmi'] = bmi_val
            self.sys.input['age'] = age_val
            self.sys.input['tg'] = tg_val
            self.sys.compute()
            return self.sys.output['diagnosis']
        except:
            return 5.0 # Return middle score (Pre-diabetic) if input is slightly out of bounds
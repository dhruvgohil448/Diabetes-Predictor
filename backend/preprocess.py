import pandas as pd

# Load the dataset
df = pd.read_csv('Dataset of Diabetes .csv')

# Inspect the first few rows and basic info
print("First 5 rows:")
print(df.head())
print("\nDataset Info:")
print(df.info())
print("\nUnique values in 'CLASS':")
print(df['CLASS'].unique())
print("\nUnique values in 'Gender':")
print(df['Gender'].unique())

# Clean the 'CLASS' column
df['CLASS'] = df['CLASS'].str.strip().str.upper()

# Clean the 'Gender' column
df['Gender'] = df['Gender'].str.strip().str.upper()

# Drop identifiers
df_clean = df.drop(columns=['ID', 'No_Pation'])

# Check unique values again
print("Cleaned CLASS values:", df_clean['CLASS'].unique())
print("Cleaned Gender values:", df_clean['Gender'].unique())

# Descriptive statistics
print("\nDescriptive Statistics:")
print(df_clean.describe())

# Save the cleaned data for the user
df_clean.to_csv('Cleaned_Diabetes_Dataset.csv', index=False)

import matplotlib.pyplot as plt
import seaborn as sns

# Set style
sns.set(style="whitegrid")

# Plot distributions for some key features across classes
features_to_plot = ['HbA1c', 'BMI', 'AGE', 'Urea']
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
axes = axes.flatten()

for i, col in enumerate(features_to_plot):
    sns.boxplot(x='CLASS', y=col, data=df_clean, ax=axes[i], palette='Set2')
    axes[i].set_title(f'Distribution of {col} by Class')

plt.tight_layout()
plt.savefig('feature_distributions.png')

# Correlation Matrix
plt.figure(figsize=(10, 8))
# Need to encode CLASS and Gender temporarily for correlation
corr_df = df_clean.copy()
corr_df['Gender'] = corr_df['Gender'].map({'M': 1, 'F': 0})
corr_df['CLASS'] = corr_df['CLASS'].map({'N': 0, 'P': 1, 'Y': 2})
sns.heatmap(corr_df.corr(), annot=True, cmap='coolwarm', fmt='.2f')
plt.title('Correlation Matrix')
plt.savefig('correlation_matrix.png')
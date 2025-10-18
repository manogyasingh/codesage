import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface CompanyRegistrationProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const CompanyRegistration: React.FC<CompanyRegistrationProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { registerCompany, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    companyId: '',
    companyName: '',
    companyEmail: '',
    adminUserId: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.companyId.trim()) {
      errors.companyId = 'Company ID is required';
    }

    if (!formData.companyName.trim()) {
      errors.companyName = 'Company name is required';
    }

    if (!formData.companyEmail.trim()) {
      errors.companyEmail = 'Company email is required';
    }

    if (!formData.adminUserId.trim()) {
      errors.adminUserId = 'Admin user ID is required';
    }

    if (!formData.adminEmail.trim()) {
      errors.adminEmail = 'Admin email is required';
    }

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (formData.adminPassword.length < 6) {
      errors.adminPassword = 'Password must be at least 6 characters';
    }

    if (formData.adminPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await registerCompany({
        id: formData.companyId,
        name: formData.companyName,
        email: formData.companyEmail,
        adminUserId: formData.adminUserId,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      onSuccess?.();
    } catch (error) {
      // Error is handled by the AuthContext
      console.error('Registration error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Register your company
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create an account to start conducting interviews with CodeSage
          </p>
        </div>
        
        <div className="bg-white shadow-xl rounded-2xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Company Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Company Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="companyId" className="block text-sm font-medium text-gray-700">
                    Company ID *
                  </label>
                  <input
                    id="companyId"
                    name="companyId"
                    type="text"
                    required
                    value={formData.companyId}
                    onChange={handleChange}
                    className={`mt-1 block w-full px-3 py-3 border ${validationErrors.companyId ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm`}
                    placeholder="unique-company-id"
                  />
                  {validationErrors.companyId && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.companyId}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Company Name *
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                    className={`mt-1 block w-full px-3 py-3 border ${validationErrors.companyName ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm`}
                    placeholder="Your Company Name"
                  />
                  {validationErrors.companyName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.companyName}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700">
                  Company Email *
                </label>
                <input
                  id="companyEmail"
                  name="companyEmail"
                  type="email"
                  required
                  value={formData.companyEmail}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-3 border ${validationErrors.companyEmail ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm`}
                  placeholder="company@example.com"
                />
                {validationErrors.companyEmail && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.companyEmail}</p>
                )}
              </div>
            </div>

            {/* Admin User Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Admin User Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`mt-1 block w-full px-3 py-3 border ${validationErrors.firstName ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm`}
                    placeholder="John"
                  />
                  {validationErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`mt-1 block w-full px-3 py-3 border ${validationErrors.lastName ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm`}
                    placeholder="Doe"
                  />
                  {validationErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="adminUserId" className="block text-sm font-medium text-gray-700">
                    Admin User ID *
                  </label>
                  <input
                    id="adminUserId"
                    name="adminUserId"
                    type="text"
                    required
                    value={formData.adminUserId}
                    onChange={handleChange}
                    className={`mt-1 block w-full px-3 py-3 border ${validationErrors.adminUserId ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm`}
                    placeholder="admin-user-id"
                  />
                  {validationErrors.adminUserId && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.adminUserId}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
                    Admin Email *
                  </label>
                  <input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    required
                    value={formData.adminEmail}
                    onChange={handleChange}
                    className={`mt-1 block w-full px-3 py-3 border ${validationErrors.adminEmail ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm`}
                    placeholder="admin@company.com"
                  />
                  {validationErrors.adminEmail && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.adminEmail}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  <input
                    id="adminPassword"
                    name="adminPassword"
                    type="password"
                    required
                    value={formData.adminPassword}
                    onChange={handleChange}
                    className={`mt-1 block w-full px-3 py-3 border ${validationErrors.adminPassword ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm`}
                    placeholder="Minimum 6 characters"
                  />
                  {validationErrors.adminPassword && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.adminPassword}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`mt-1 block w-full px-3 py-3 border ${validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm`}
                    placeholder="Confirm password"
                  />
                  {validationErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  'Create Company Account'
                )}
              </button>
            </div>

            {onSwitchToLogin && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="font-medium text-purple-600 hover:text-purple-500"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
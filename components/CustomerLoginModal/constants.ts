export const INITIAL_FORM_STATE = {
  email: '',
  password: '',
  name: '',
  role: 'USER',
  companyAddress: '',
  deliveryAddress: '',
  phone: ''
};

export const STYLES = {
  modal: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
  container: "bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative",
  closeButton: "absolute top-4 right-4 text-gray-500 hover:text-gray-700",
  submitButton: "w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400",
  errorMessage: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center"
}; 
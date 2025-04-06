interface FormTextAreaProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
}

export const FormTextArea = ({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder, 
  disabled = false, 
  required = true 
}: FormTextAreaProps) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        disabled ? 'bg-gray-100' : ''
      }`}
      placeholder={placeholder}
      rows={3}
      required={required}
    />
  </div>
); 
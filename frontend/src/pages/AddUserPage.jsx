import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Briefcase, Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import useAuthStore from '../store/authStore';
import * as XLSX from 'xlsx';

function AddUserPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Single user form state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('single'); // 'single' or 'bulk'

  // Bulk upload state
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    role: 'student',
    branch: '',
    gender: 'male'
  });

  const branches = [
    { value: "CSE", label: "Computer Science Engineering" },
    { value: "EE", label: "Electrical Engineering" },
    { value: "MNC", label: "Mathematics and Computing" },
    { value: "MECH", label: "Mechanical Engineering" },
    { value: "CHE", label: "Chemical Engineering" },
    { value: "CIVIL", label: "Civil Engineering" },
    { value: "AI", label: "Artificial Intelligence" }
  ];

  const roles = [
    { value: 'student', label: 'Student' },
    { value: 'instructor', label: 'Instructor' },
    { value: 'admin', label: 'Admin' }
  ];

  const genders = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];

  // Check authorization
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="alert alert-error w-96">
          <span>You do not have permission to add users. Only admin can add users.</span>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      setError('Email, password, first name, and last name are required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };


  /* ==================================================================================
     BULK UPLOAD LOGIC
  ================================================================================== */

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file) => {
    const fileType = file.name.split('.').pop().toLowerCase();
    if (fileType !== 'xlsx' && fileType !== 'xls' && fileType !== 'csv') {
      setError('Please upload a valid Excel or CSV file (.xlsx, .xls, .csv)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFile(file);
    setError('');
    setBulkErrors([]);
    parseExcel(file);
  };

  const parseExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON with forced raw strings to avoid date parsing issues if any
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length === 0) {
          setError('The uploaded file is empty.');
          return;
        }

        // Validate required columns
        // Expected keys (allowing some flexibility in casing)
        // email, password, first_name, last_name, role, branch, gender
        const requiredCols = ['email', 'password', 'first_name', 'last_name', 'role'];
        const firstRow = jsonData[0];
        const fileCols = Object.keys(firstRow).map(k => k.toLowerCase());

        const missingCols = requiredCols.filter(col => !fileCols.includes(col.toLowerCase()));

        if (missingCols.length > 0) {
          setError(`Missing required columns: ${missingCols.join(', ')}`);
          return;
        }

        // Normalize keys and basic validation
        const normalizedData = jsonData.map((row, index) => {
          const newRow = {};
          // Map inconsistent headers to standard keys
          Object.keys(row).forEach(key => {
            const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_'); // "First Name" -> "first_name"
            newRow[cleanKey] = row[key];
          });

          // Set defaults
          if (!newRow.role) newRow.role = 'student';
          if (!newRow.gender) newRow.gender = 'other';
          if (!newRow.branch && newRow.role === 'student') newRow.branch = 'CSE'; // Default or null?

          return { ...newRow, _rowNum: index + 2 }; // +2 because index 0 is row 2 in Excel
        }).filter(row => row.email && row.password); // Filter out empty rows

        setParsedData(normalizedData);
        if (normalizedData.length === 0) {
          setError('No valid rows found. Ensure rows have at least Email and Password.');
        }

      } catch (err) {
        console.error("Parse Error:", err);
        setError('Failed to parse file. Please check the format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    // Create a dummy workbook with headers
    const headers = [
      {
        first_name: "John",
        last_name: "Doe",
        email: "john@iitrpr.ac.in",
        password: "password123",
        role: "student",
        branch: "CSE",
        gender: "male"
      },
      {
        first_name: "Jane",
        last_name: "Smith",
        email: "jane@iitrpr.ac.in",
        password: "securepass",
        role: "instructor",
        branch: "EE",
        gender: "female"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users Template");
    XLSX.writeFile(wb, "aims_users_template.xlsx");
  };

  const removeFile = () => {
    setFile(null);
    setParsedData([]);
    setError('');
    setSuccess('');
    setBulkErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBulkSubmit = async () => {
    if (parsedData.length === 0) {
      setError("No data to upload.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setBulkErrors([]);

    let successCount = 0;
    const errors = [];

    // Process sequentially
    for (let i = 0; i < parsedData.length; i++) {
      const user = parsedData[i];
      try {
        setUploadProgress(Math.round(((i + 1) / parsedData.length) * 100));

        await axiosClient.post('/user/create', {
          email: user.email,
          password: user.password,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          branch: user.branch || null,
          gender: user.gender
        });

        successCount++;
      } catch (err) {
        errors.push({
          row: user._rowNum,
          email: user.email,
          message: err.response?.data?.message || err.message
        });
      }
    }

    setLoading(false);

    if (errors.length === 0) {
      setSuccess(`🎉 Successfully added all ${successCount} users!`);
    } else {
      setSuccess(`Completed with issues. Added: ${successCount}. Failed: ${errors.length}.`);
      setBulkErrors(errors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await axiosClient.post('/user/create', {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        branch: formData.branch || null,
        gender: formData.gender
      });

      setSuccess(`User created successfully! ID: ${response.data.data.id}`);

      // Reset form
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        role: 'student',
        branch: '',
        gender: 'male'
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Add New User</h1>
          <p className="text-gray-600">Create a new user account in the system</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`py-2 px-4 font-medium transition-colors ${activeTab === 'single'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => { setActiveTab('single'); setError(''); setSuccess(''); }}
            >
              Single User
            </button>
            <button
              className={`py-2 px-4 font-medium transition-colors ${activeTab === 'bulk'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => { setActiveTab('bulk'); setError(''); setSuccess(''); }}
            >
              Upload (Excel)
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="alert alert-success mb-6">
              <span>{success}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="alert alert-error mb-6">
              <span>{error}</span>
            </div>
          )}

          {/* Bulk Upload Validation Errors */}
          {bulkErrors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-bold text-red-700 flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5" />
                Upload Issues ({bulkErrors.length})
              </h3>
              <div className="max-h-40 overflow-y-auto text-sm text-red-600 space-y-1">
                {bulkErrors.map((err, idx) => (
                  <div key={idx}>
                    Row {err.row} ({err.email}): {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SINGLE USER FORM */}
          {activeTab === 'single' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ... existing form content ... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      First Name
                    </span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="John"
                    className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Last Name */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Last Name</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Role and Gender Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Role */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Role
                    </span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="select select-bordered w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roles.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gender */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Gender</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="select select-bordered w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {genders.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Branch */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Branch (Optional)</span>
                </label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  disabled={formData.role !== "student" && formData.role !== "instructor"}
                  className="select select-bordered w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a branch</option>
                  {branches.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password and Confirm Password Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      className="input input-bordered w-full pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <label className="label">
                    <span className="label-text-alt text-gray-500">Min. 6 characters</span>
                  </label>
                </div>

                {/* Confirm Password */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Confirm Password</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      className="input input-bordered w-full pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* BULK UPLOAD FORM */}
          {activeTab === 'bulk' && (
            <div className="space-y-6">

              <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div>
                  <h3 className="font-bold text-blue-800">Need a template?</h3>
                  <p className="text-sm text-blue-600">Download our Excel template to ensure your data is formatted correctly.</p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="btn btn-sm btn-outline btn-primary gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Template
                </button>
              </div>

              {!file ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
                ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray-50'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">
                    Click to upload or drag and drop
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Excel (.xlsx, .xls) or CSV files up to 5MB
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FileSpreadsheet className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{file.name}</h3>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB • {parsedData.length} records found
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeFile}
                      className="btn btn-circle btn-ghost btn-sm text-gray-500 hover:text-red-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Data Preview */}
                  {parsedData.length > 0 && (
                    <div className="overflow-x-auto border rounded-lg bg-white mb-4">
                      <table className="table table-xs w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Branch</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.slice(0, 5).map((row, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td>{row.first_name} {row.last_name}</td>
                              <td>{row.email}</td>
                              <td>
                                <span className={`badge badge-xs ${row.role === 'admin' ? 'badge-error' :
                                    row.role === 'instructor' ? 'badge-warning' : 'badge-info'
                                  }`}>
                                  {row.role}
                                </span>
                              </td>
                              <td>{row.branch || '-'}</td>
                            </tr>
                          ))}
                          {parsedData.length > 5 && (
                            <tr>
                              <td colSpan="5" className="text-center text-gray-500 bg-gray-50">
                                ...and {parsedData.length - 5} more records
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {loading && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}

                  <button
                    onClick={handleBulkSubmit}
                    disabled={loading || parsedData.length === 0}
                    className="btn btn-primary w-full"
                  >
                    {loading ? `Uploading... ${uploadProgress}%` : `Upload ${parsedData.length} Users`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddUserPage;

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBInput,
  MDBBtn,
} from 'mdb-react-ui-kit';

import logo from '../assets/images/logo.avif';

const RegisterUser = ({ userLabel = 'User' }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    user_type: 'guest',
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();


const validateForm = () => {
  const errors = {};

  // Name validation
  if (!formData.name.trim()) {
    errors.name = "Name is required";
  } else if (formData.name.length < 3) {
    errors.name = "Name must be at least 3 characters";
  }

  // Email validation
  if (!formData.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,6}$/.test(formData.email)) {
    errors.email = "Invalid email format";
  }

  // Password validation
  const strongPasswordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!formData.password.trim()) {
    errors.password = "Password is required";
  } else if (!strongPasswordRegex.test(formData.password)) {
    errors.password =
      "Password must be at least 8 characters, include an uppercase letter, a number, and a special character";
  }

  return errors;
};


  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setSuccessMsg('');

  const errors = validateForm();
  if (Object.keys(errors).length > 0) {
    // Show the first error (or handle multiple)
    setError(Object.values(errors)[0]);
    return;
  }

  setIsSubmitting(true);
  try {
    await axios.post(
      `${import.meta.env.VITE_BASE_URL}/auth/register/`,
      formData
    );
    setSuccessMsg('Registration successful! Awaiting admin approval.');
    setTimeout(() => navigate('/login'), 3000);
  } catch (err) {
    const errorData = err.response?.data;

    if (errorData?.email?.[0]?.toLowerCase().includes('already exists')) {
      setError('A user with this email already exists.');
      setTimeout(() => {
        setFormData({ name: '', email: '', password: '', user_type: 'guest' });
        setError('');
      }, 3000);
    } else if (errorData?.email) {
      setError(errorData.email[0]);
    } else if (errorData?.password) {
      setError(errorData.password[0]);
    } else if (errorData?.name) {
      setError(errorData.name[0]);
    } else {
      setError('Registration failed.');
    }

    setSuccessMsg('');
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <MDBContainer className="my-5 gradient-form">
      <MDBRow>
        <MDBCol col="6" className="mb-5">
          <div className="d-flex flex-column ms-5">
            <div className="text-center">
              <img
                src={logo}
                alt="logo"
                style={{
                  width: '185px',
                  height: 'auto',
                  objectFit: 'contain',
                  imageRendering: 'auto',
                }}
              />
              <h4 className="mt-1 mb-5 pb-1">Create Your VRM Account</h4>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && (
              <div className="alert alert-success">{successMsg}</div>
            )}

            <form onSubmit={handleSubmit}>
              <MDBInput
                wrapperClass="mb-4"
                label="Name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <MDBInput
                wrapperClass="mb-4"
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <div className="position-relative mb-4">
                <MDBInput
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <span
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="position-absolute end-0 top-50 translate-middle-y me-3"
                  style={{ cursor: 'pointer', color: '#6c757d' }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </div>

              <div className="text-center pt-1 mb-5 pb-1">
                <MDBBtn
                  className="mb-4 w-100 gradient-custom-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering...' : 'Register'}
                </MDBBtn>
              </div>
            </form>

            <div className="text-center">
              <p className="text-muted">
                Already have an account?{' '}
                <Link to="/login" className="text-primary">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </MDBCol>

        <MDBCol col="6" className="mb-5">
          <div className="d-flex flex-column justify-content-center gradient-custom-2 h-100 mb-4 text-white p-5">
            <h4 className="mb-4">
              Join us and manage your power intelligently
            </h4>
            <p className="small mb-0">
              Get instant access to VRM services. Your registration will be
              reviewed by the admin.
            </p>
          </div>
        </MDBCol>
      </MDBRow>
    </MDBContainer>
  );
};

export default RegisterUser;

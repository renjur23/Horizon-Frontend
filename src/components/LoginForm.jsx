import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { MDBContainer, MDBRow, MDBCol, MDBInput } from 'mdb-react-ui-kit';

import logo from '../assets/images/logo.avif';
import CustomButton from '../components/CustomButton'; // ✅ Import your custom button

const LoginForm = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

const validateLoginForm = () => {
  const { email, password } = formData;
  if (!email.trim() || !password.trim()) {
    return "Email and password are required.";
  }
  const emailRegex = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,6}$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format.";
  }
  return null;
};


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
     const validationError = validateLoginForm();
      if (validationError) {
        setError(validationError);
        return; 
      }
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/auth/login/`,
        formData
      );
      const { access, refresh, role, name } = res.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user_role', role);
      localStorage.setItem('user_name', name);

      if (role === 'admin') navigate('/admin-dashboard');
      else if (role === 'employee') navigate('/employee-dashboard');
      else navigate('/guest-dashboard');
    } catch {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <MDBContainer className="vh-100 d-flex justify-content-center align-items-center gradient-form">
      <div className="login-box">
        <MDBRow>
          <MDBCol col="12" className="mb-5">
            <div className="d-flex flex-column ms-md-5 ms-2 me-2">
              <div className="text-center">
                <img
                  src={logo}
                  alt="logo"
                  style={{
                    width: '185px',
                    height: 'auto',
                    objectFit: 'contain',
                  }}
                />
                <h4 className="mt-1 mb-5 pb-1">Welcome to VRM</h4>
              </div>

              <p>Please login to your account</p>

              <form onSubmit={handleSubmit}>
                <MDBInput
                  wrapperClass="mb-4"
                  label="Email address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

                <div className="position-relative mb-4">
                  <MDBInput
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
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

                {error && <div className="text-danger mb-3">{error}</div>}

                <div className="text-center pt-1 mb-5 pb-1">
                  <CustomButton
                    type="submit"
                    label="Login"
                    className="mb-4 w-100 gradient-custom-2"
                  />
                  <Link className="text-muted" to="/forgot-password">
                    Forgot password?
                  </Link>
                </div>
              </form>

              <div className="text-center">
                <p className="mb-0">
                  Don't have an account?{' '}
                  <Link
                    to="/register/employee"
                    className="text-primary fw-bold"
                  >
                    Register
                  </Link>
                </p>
              </div>
            </div>
          </MDBCol>
        </MDBRow>
      </div>
    </MDBContainer>
  );
};

export default LoginForm;

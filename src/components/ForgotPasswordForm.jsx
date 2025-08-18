import React, { useState } from 'react';
import { MDBContainer, MDBInput, MDBBtn } from 'mdb-react-ui-kit';
import axios from 'axios';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/auth/request-reset-password/`,
        { email }
      );
      setMsg('✅ Password reset link sent to your email.');
      setEmail(''); // Clear the input field

      // Redirect to login after 3 seconds
      setTimeout(() => {
        setMsg('');
        window.location.href = '/login'; // adjust the path if your login route is different
      }, 3000);
    } catch (err) {
      setMsg('❌ Error: Unable to send reset link. Email may not exist.');
      setTimeout(() => setMsg(''), 4000);
    }
  };

  return (
    <MDBContainer
      className="my-5 p-5 border rounded shadow"
      style={{ maxWidth: '500px' }}
    >
      <h4 className="mb-4 text-center">Forgot Password</h4>
      {msg && <div className="alert alert-info">{msg}</div>}
      <form onSubmit={handleSubmit}>
        <MDBInput
          label="Enter your registered email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-4"
        />
        <MDBBtn type="submit" className="w-100">
          Send Reset Link
        </MDBBtn>
      </form>
    </MDBContainer>
  );
};

export default ForgotPasswordForm;

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MDBContainer, MDBInput, MDBBtn } from 'mdb-react-ui-kit';
import axios from 'axios';

const ResetPasswordForm = () => {
  const { uidb64, token } = useParams();
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${
          import.meta.env.VITE_BASE_URL
        }/auth/reset-password/${uidb64}/${token}/`,
        { password }
      );
      setMsg('✅ Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setMsg('❌ Reset link is invalid or expired.');
    }
  };

  return (
    <MDBContainer
      className="my-5 p-5 border rounded shadow"
      style={{ maxWidth: '500px' }}
    >
      <h4 className="mb-4 text-center">Reset Your Password</h4>
      {msg && <div className="alert alert-info">{msg}</div>}
      <form onSubmit={handleSubmit}>
        <MDBInput
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-4"
        />
        <MDBBtn type="submit" className="w-100">
          Reset Password
        </MDBBtn>
      </form>
    </MDBContainer>
  );
};

export default ResetPasswordForm;

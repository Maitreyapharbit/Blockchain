import React, { useState } from 'react';
import styled from 'styled-components';
import { FaEye, FaEyeSlash, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { useSupabase } from '../contexts/SupabaseContext';
import toast from 'react-hot-toast';

const AuthContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const AuthCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
`;

const AuthTitle = styled.h1`
  text-align: center;
  color: #1f2937;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const AuthSubtitle = styled.p`
  text-align: center;
  color: #6b7280;
  font-size: 16px;
  margin-bottom: 32px;
`;

const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    color: #374151;
    background: #f3f4f6;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 16px;
  background: ${props => props.variant === 'primary' ? '#3b82f6' : '#10b981'};
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    background: ${props => props.variant === 'primary' ? '#2563eb' : '#059669'};
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-decoration: underline;
  margin-top: 16px;
  
  &:hover {
    color: #2563eb;
  }
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const AuthComponent = () => {
  const { signIn, signUp } = useSupabase();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await signIn(email, password);
        if (error) throw error;
        toast.success('Signed in successfully!');
      } else {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        const { data, error } = await signUp(email, password, {
          full_name: email.split('@')[0]
        });
        if (error) throw error;
        toast.success('Account created! Please check your email to verify your account.');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message || 'An error occurred');
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <AuthContainer>
      <AuthCard>
        <AuthTitle>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </AuthTitle>
        <AuthSubtitle>
          {isLogin 
            ? 'Sign in to access shipment tracking' 
            : 'Sign up to start tracking shipments'
          }
        </AuthSubtitle>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <AuthForm onSubmit={handleSubmit}>
          <InputGroup>
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </InputGroup>

          <InputGroup>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <PasswordToggle
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </PasswordToggle>
          </InputGroup>

          {!isLogin && (
            <InputGroup>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </InputGroup>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                {isLogin ? <FaSignInAlt /> : <FaUserPlus />}
                {isLogin ? 'Sign In' : 'Create Account'}
              </>
            )}
          </Button>
        </AuthForm>

        <ToggleButton onClick={toggleMode}>
          {isLogin 
            ? "Don't have an account? Sign up" 
            : "Already have an account? Sign in"
          }
        </ToggleButton>
      </AuthCard>
    </AuthContainer>
  );
};

export default AuthComponent;
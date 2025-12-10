import React from 'react';
import styled from 'styled-components';
import AuthComponent from './AuthComponent';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const Container = styled.div`
  width: 100%;
  max-width: 520px;
`;

const AuthModal = ({ onClose }) => {
  return (
    <Overlay onClick={onClose}>
      <Container onClick={(e) => e.stopPropagation()}>
        <AuthComponent />
      </Container>
    </Overlay>
  );
};

export default AuthModal;

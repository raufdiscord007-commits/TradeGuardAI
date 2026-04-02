import React from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../Components/Memberstack/Login';
import Navbar from '../Components/Landing/Navbar';

const LoginPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="page-wrapper">
      <Navbar />
      <section className="main_form_wrapper" style={{ paddingTop: 'clamp(4rem, 5.5vw, 5.5rem)' }}>
        <div className="padding-global">
          <div className="container-large">
            <div className="padding-full-height">
              <Login onClose={() => navigate('/')} showCloseButton={false} />
            </div>
          </div>
        </div>
        <div className="form_main_image_wrapper">
          <img src="https://cdn.prod.website-files.com/69284f1f4a41d1c19de618ec/6936fdd48b68a024e65f6fa0_Page%201.jpg" loading="lazy" alt="" className="form_main_image" />
        </div>
        <div className="form_main_blur"></div>
      </section>
    </div>
  );
};

export default LoginPage;

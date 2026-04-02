import React from 'react';
import ForgotPassword from '../Components/Memberstack/ForgotPassword';
import Navbar from '../Components/Landing/Navbar';

const ForgotPasswordPage = () => {
  return (
    <div className="page-wrapper">
      <Navbar />
      <section className="main_form_wrapper" style={{ paddingTop: 'clamp(4rem, 5.5vw, 5.5rem)' }}>
        <div className="padding-global">
          <div className="container-large">
            <div className="padding-section-large">
              <ForgotPassword onClose={() => window.history.back()} />
            </div>
          </div>
        </div>
        <div className="form_main_image_wrapper">
          <img 
            src="/images/Page-1.jpg" 
            loading="lazy" 
            sizes="240px" 
            srcSet="/images/Page-1-p-500.jpg 500w, /images/Page-1-p-800.jpg 800w, /images/Page-1.jpg 1000w" 
            alt="" 
            className="form_main_image" 
          />
        </div>
        <div className="form_main_blur"></div>
      </section>
    </div>
  );
};

export default ForgotPasswordPage;

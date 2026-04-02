import React from 'react';

const AccessDenied = ({ onClose }) => {
  return (
    <div className="main_form_component is-flex">
      <div className="main_form_block">
        <div className="main_form">
          <div className="main_form_header">
            <h1 className="heading-style-h3">Access Denied</h1>
            <div className="text-size-regular">
              A site membership is required to access this page. If you have an account already click below.
            </div>
          </div>
          <a href="#" className="button is-full-width w-button">
            Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;

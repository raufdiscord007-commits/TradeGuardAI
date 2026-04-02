import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileCTA() {
  const navigate = useNavigate();
  const { subscription } = useAuth();
  
  const currentPlanTier = subscription?.planTier || 'FREE';
  const isPaidPlan = currentPlanTier !== 'FREE';

  const handleCTAClick = (e) => {
    e.preventDefault();
    
    if (isPaidPlan) {
      navigate('/predictions');
    } else {
      navigate('/pricing');
    }
  };

  return (
    <div className="dashboard_main_cta_wrapper" style={{ position: 'sticky', top: '1.5rem' }}>
      <div className="card_main_wrapper is-blue">
        <div className="card_main_header">
          <div className="text-size-xlarge text-weight-semibold">
            {isPaidPlan ? 'Ready to Make Your Next Move?' : 'Elevate Your Trading Game'}
          </div>
          <div className="text-size-regular">
            {isPaidPlan 
              ? 'Access real-time AI-driven market insights and stay ahead of every price swing with our advanced prediction engine.'
              : 'Get instant access to powerful AI predictions, sophisticated chart analysis, and expert-level insights with our Pro membership.'
            }
          </div>
          <div className="card_main_button_wrapper">
            <a href="#" onClick={handleCTAClick} className="button is-secondary w-button">
              {isPaidPlan ? 'Start Predicting Now' : 'Explore Premium Plans'}
            </a>
          </div>
        </div>
        <div className="card_cta_image_wrapper">
          <img 
            src="https://cdn.prod.website-files.com/69284f1f4a41d1c19de618ec/69804758ea94642ffa6ead06_Screenshot%202026-02-01%20234054.png" 
            loading="lazy" 
            alt="AI Dashboard Preview" 
            className="card_cta_image"
          />
        </div>
      </div>
    </div>
  );
}

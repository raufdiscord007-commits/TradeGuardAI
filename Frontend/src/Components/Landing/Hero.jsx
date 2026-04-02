import React from 'react';
import { Link } from 'react-router-dom';
import Portfolio from '../../pages/Portfolio';

const Hero = () => {
  return (
    <section className="hero_main_wrapper">
      <div className="padding-global">
        <div className="w-layout-blockcontainer container-large w-container">
          <div className="hero_main_padding">
            <div className="hero_main_component">
              <div data-wf--content-wrapper--variant="centered" className="content_main_wrapper w-variant-632fa105-5af7-a0a0-9e76-6b2de864aacc">
                <div className="content_main_header w-variant-632fa105-5af7-a0a0-9e76-6b2de864aacc">
                  <div className="tag_main_wrapper">
                    <div className="text-size-small">AI-Powered Market Edge</div>
                  </div>
                  <div className="content_main_flex w-variant-632fa105-5af7-a0a0-9e76-6b2de864aacc">
                    <h1>Navigate the Crypto Market with AI Precision.</h1>
                    <div className="text-size-medium text-color-secondary">
                      Stop guessing. Start predicting. TradeGuard AI analyzes millions of data points to
                      forecast whether crypto prices will go UP or DOWN with proven accuracy.
                    </div>
                  </div>
                </div>
                <div className="content_main_buttons">
                  <Link to="/app" className="button w-button">
                    Get Started
                  </Link>
                  <Link to="/contact" className="button is-secondary w-button">
                    Contact Us
                  </Link>
                </div>
              </div>
              <div 
                className="hero_main_image_wrapper" 
                style={{ 
                  overflow: 'hidden', 
                  borderRadius: '16px', 
                  maxWidth: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color--border-primary, #e5e5e7)',
                  backgroundColor: 'white',
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
                  minHeight: '400px'
                }}
              >
                {/* THIS IS YOUR LIVE PORTFOLIO COMPONENT! */}
                <Portfolio />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
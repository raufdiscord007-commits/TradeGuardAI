import React from 'react';

const LogoSection = () => {
  const logos = [
    '/images/coinbase.svg',
    '/images/spotify.svg',
    '/images/contentful.svg',
    '/images/dropbox.svg',
    '/images/slack.svg',
    '/images/zoom.svg',
  ];

  const LogoRow = ({ addId }) => (
    <div className="logo_wrap" data-w-id={addId ? "745c5ab0-0124-791c-7ab5-d000b98af80a" : undefined}>
      {logos.map((logo, index) => (
        <div key={index} className="logo_white-images">
          <img loading="lazy" src={logo} alt="" className="logo_white-img" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="logo_main_wrapper">
      <div className="logo_white-grid is-full">
        <div className="logo_white-heading padding-global">
          <div className="logo_white-proud">
            <h2 className="heading-style-h2">Trusted by our valued clients</h2>
          </div>
          <div className="logo_white-text">
            <p className="text-size-medium text-color-secondary">
              Over 50 companies trust our platform for job postings and brand exposure
            </p>
          </div>
        </div>
        <div className="logo_white-wrap">
          <LogoRow addId />
          <LogoRow />
          <LogoRow />
        </div>
      </div>
    </div>
  );
};

export default LogoSection;

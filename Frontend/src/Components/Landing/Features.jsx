import React from 'react';
import { Link } from 'react-router-dom';

const Features = () => {
  const features = [
    {
      icon: 'https://cdn.prod.website-files.com/69284f1f4a41d1c19de618ec/694277642c2356adec891370_Icon%20(2).svg',
      title: 'AI-Powered Predictions',
      description: 'Advanced deep learning models analyze market patterns and provide instant "Bullish" or "Bearish" signals with confidence scores.',
    },
    {
      icon: 'https://cdn.prod.website-files.com/69284f1f4a41d1c19de618ec/694277642c2356adec891370_Icon%20(2).svg',
      title: 'Real-Time Market Data',
      description: 'Live price updates, order books, and market trades from Binance. Track thousands of cryptocurrencies with lightning-fast data feeds.',
    },
    {
      icon: 'https://cdn.prod.website-files.com/69284f1f4a41d1c19de618ec/694277642c2356adec891370_Icon%20(2).svg',
      title: 'Advanced Charting Tools',
      description: 'Professional-grade candlestick charts, technical indicators, and customizable timeframes for comprehensive market analysis.',
    },
  ];

  return (
    <section className="feature_main_wrapper">
      <div className="padding-global">
        <div className="w-layout-blockcontainer container-large w-container">
          <div className="padding-section-medium">
            <div className="feature_main_component">
              <div data-wf--content-wrapper--variant="centered" className="content_main_wrapper w-variant-632fa105-5af7-a0a0-9e76-6b2de864aacc">
                <div className="content_main_header w-variant-632fa105-5af7-a0a0-9e76-6b2de864aacc">
                  <div className="content_main_flex w-variant-632fa105-5af7-a0a0-9e76-6b2de864aacc">
                    <h2>Why Traders Choose TradeGuard AI</h2>
                    <div className="text-size-medium text-color-secondary">
                      Powered by cutting-edge TensorFlow &amp; Keras deep learning models,
                      <br />
                      we deliver the competitive edge you need in cryptocurrency trading.
                    </div>
                  </div>
                </div>
              </div>
              <div className="feature_main_grid">
                {features.map((feature, index) => (
                  <div key={index} className="feature_main_card card_main_wrapper">
                    <div className="feature_main_header">
                      <div className="feature_main_icon_wrapper">
                        <img src={feature.icon} loading="lazy" alt="" className="feature_main_icon" />
                      </div>
                      <div className="feature_main_content">
                        <h3 className="heading-style-h3">{feature.title}</h3>
                        <div className="text-size-regular text-color-secondary">{feature.description}</div>
                      </div>
                    </div>
                    <Link to="/features" className="button is-secondary is-icon w-inline-block">
                      <div>Show more</div>
                      <img src="/images/Icon-1.svg" loading="lazy" alt="" />
                    </Link>
                  </div>
                ))}
              </div>
              <Link to="/features" className="button w-button">
                See all features
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;

import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import Features from './Features';
import Pricing from './Pricing';
import FAQ from './FAQ';
import Footer from './Footer';

const LandingPage = () => {
  useEffect(() => {
    // Load Google Fonts
    if (window.WebFont) {
      window.WebFont.load({
        google: {
          families: ['Roboto:100,200,300,regular,500,600,700,800,900,200italic,300italic'],
        },
      });
    }
  }, []);

  return (
    <div className="page-wrapper">
      {/* Global Styles */}
      <div className="global-styles w-embed">
        <style dangerouslySetInnerHTML={{
          __html: `
          /* Make text look crisper and more legible in all browsers */
          body {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }
          /* Focus state style for keyboard navigation for the focusable elements */
          *[tabindex]:focus-visible,
          input[type="file"]:focus-visible {
            outline: 0.125rem solid #4d65ff;
            outline-offset: 0.125rem;
          }
          /* Set color style to inherit */
          .inherit-color * {
            color: inherit;
          }
          /* Get rid of top margin on first element in any rich text element */
          .w-richtext > :not(div):first-child, .w-richtext > div:first-child > :first-child {
            margin-top: 0 !important;
          }
          /* Get rid of bottom margin on last element in any rich text element */
          .w-richtext>:last-child, .w-richtext ol li:last-child, .w-richtext ul li:last-child {
            margin-bottom: 0 !important;
          }
          /* Make sure containers never lose their center alignment */
          .container-medium,.container-small, .container-large {
            margin-right: auto !important;
            margin-left: auto !important;
          }
          /* Apply "..." after 3 lines of text */
          .text-style-3lines {
            display: -webkit-box;
            overflow: hidden;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
          }
          /* Apply "..." after 2 lines of text */
          .text-style-2lines {
            display: -webkit-box;
            overflow: hidden;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
          /* These classes are never overwritten */
          .hide {
            display: none !important;
          }
          @media screen and (max-width: 991px) {
            .hide, .hide-tablet {
              display: none !important;
            }
          }
          @media screen and (max-width: 767px) {
            .hide-mobile-landscape{
              display: none !important;
            }
          }
          @media screen and (max-width: 479px) {
            .hide-mobile{
              display: none !important;
            }
          }
          .margin-0 {
            margin: 0rem !important;
          }
          .padding-0 {
            padding: 0rem !important;
          }
          .spacing-clean {
            padding: 0rem !important;
            margin: 0rem !important;
          }
          .margin-top {
            margin-right: 0rem !important;
            margin-bottom: 0rem !important;
            margin-left: 0rem !important;
          }
          .padding-top {
            padding-right: 0rem !important;
            padding-bottom: 0rem !important;
            padding-left: 0rem !important;
          }
          .margin-right {
            margin-top: 0rem !important;
            margin-bottom: 0rem !important;
            margin-left: 0rem !important;
          }
          .padding-right {
            padding-top: 0rem !important;
            padding-bottom: 0rem !important;
            padding-left: 0rem !important;
          }
          .margin-bottom {
            margin-top: 0rem !important;
            margin-right: 0rem !important;
            margin-left: 0rem !important;
          }
          .padding-bottom {
            padding-top: 0rem !important;
            padding-right: 0rem !important;
            padding-left: 0rem !important;
          }
          .margin-left {
            margin-top: 0rem !important;
            margin-right: 0rem !important;
            margin-bottom: 0rem !important;
          }
          .padding-left {
            padding-top: 0rem !important;
            padding-right: 0rem !important;
            padding-bottom: 0rem !important;
          }
          .margin-horizontal {
            margin-top: 0rem !important;
            margin-bottom: 0rem !important;
          }
          .padding-horizontal {
            padding-top: 0rem !important;
            padding-bottom: 0rem !important;
          }
          .margin-vertical {
            margin-right: 0rem !important;
            margin-left: 0rem !important;
          }
          .padding-vertical {
            padding-right: 0rem !important;
            padding-left: 0rem !important;
          }
          @media (max-width: 1199px) {
            .card_main_wrapper.is-small.is-hide {
              display: none;
            }
            .dashboard_main_header {
              grid-template-columns: repeat(3, 1fr);
            }
            .main-wrapper.is-dashboard {
              display: grid;
              grid-template-columns: minmax(0, 230px) 1fr;
            }
          }
          .main_app_nav_link.is-active {
            box-sizing: border-box;
            -moz-box-sizing: border-box;
            -webkit-box-sizing: border-box;
            border-bottom: 3px solid var(--base-color-brand--color-primary);
          }
        `
        }} />
      </div>

      <Navbar />
      <div className="main-wrapper">
        <Hero />
        <Features />
        <Pricing />
        <FAQ />
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;

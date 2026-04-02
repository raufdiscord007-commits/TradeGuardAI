import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <div className="footer_main_wrapper">
      <div className="container-large">
        <div className="footer_wrap_component">
          <div className="footer_top">
            <div className="footer_links-wrap">
              <div className="footer_title">Job seekers</div>
              <Link to="/jobs" className="footer_link">
                Find jobs
              </Link>
              <Link to="/resume" className="footer_link">
                Upload resume
              </Link>
              <Link to="/alerts" className="footer_link">
                Job alerts
              </Link>
              <Link to="/resources" className="footer_link">
                Career resources
              </Link>
              <Link to="/support" className="footer_link">
                Support &amp; help
              </Link>
            </div>
            <div className="footer_links-wrap">
              <div className="footer_title">Employers</div>
              <Link to="/post-job" className="footer_link">
                Post a job
              </Link>
              <Link to="/talent" className="footer_link">
                Find talent
              </Link>
              <Link to="/solutions" className="footer_link">
                Hiring solutions
              </Link>
              <Link to="/employer-support" className="footer_link">
                Employer support
              </Link>
            </div>
            <div className="footer_links-wrap">
              <div className="footer_title">Company</div>
              <Link to="/about" className="footer_link">
                About us
              </Link>
              <Link to="/success" className="footer_link">
                Success stories
              </Link>
              <Link to="/mission" className="footer_link">
                Our mission
              </Link>
              <Link to="/blog" className="footer_link">
                Blog
                <br />
              </Link>
            </div>
            <div className="footer_links-wrap hide-tablet">
              <div className="footer_title">Community</div>
              <Link to="/announcements" className="footer_link">
                Announcements
              </Link>
              <Link to="/podcast" className="footer_link">
                Business podcast
              </Link>
              <Link to="/discussions" className="footer_link">
                Career discussions
              </Link>
            </div>
            <div className="footer_links-wrap">
              <div className="footer_title">Support</div>
              <Link to="/help" className="footer_link">
                Help center
              </Link>
              <Link to="/faq" className="footer_link">
                FAQs
              </Link>
              <Link to="/contact" className="footer_link">
                Contact us
              </Link>
            </div>
          </div>
          <div className="footer_bottom">
            <div className="footer_brand">
              <div className="text-size-small text-align-center">TradeguardAI</div>
            </div>
            <div className="footer_bottom-mid">
              <Link to="/terms" className="footer_link">
                Terms
              </Link>
              <Link to="/sitemap" className="footer_link">
                Site map
              </Link>
              <Link to="/privacy" className="footer_link">
                Privacy
              </Link>
              <Link to="/legal" className="footer_link">
                Legal
              </Link>
              <Link to="/cookies" className="footer_link">
                Cookies
              </Link>
            </div>
            <div className="text-size-small text-align-center">© 2025 TradeGuardAI. All rights reserved.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;

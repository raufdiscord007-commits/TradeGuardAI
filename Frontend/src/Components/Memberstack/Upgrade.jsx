import React from 'react';

const Upgrade = ({ onClose }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle upgrade logic here
    console.log('Upgrade clicked');
  };

  return (
    <div className="main_form_component is-flex">
      <div className="main_form is-large">
        <div className="upgrade_top-wrap">
          <img loading="lazy" src="/images/Vector-2.svg" alt="" className="upgrade_top-icon" />
          <div className="upgrade_title-wrap">
            <h1 className="text-size-medium">Upgrade to premium</h1>
            <div className="text-size-small text-color-secondary text-align-center">
              To access this feature, you must upgrade your plan.
            </div>
          </div>
        </div>
        <div className="upgrade_form-block">
          <form onSubmit={handleSubmit} className="upgrade_form">
            <div className="upgrade_checkitem-wrap">
              <div className="upgrade_checkitem">
                <img loading="lazy" src="/images/check-mark.png" alt="" className="upgrade_tick-icon" />
                <div className="upgrade_checklist-txt">Job Insight</div>
              </div>
              <div className="upgrade_checkitem">
                <img loading="lazy" src="/images/check-mark.png" alt="" className="upgrade_tick-icon" />
                <div className="upgrade_checklist-txt">Top job suggestions</div>
              </div>
              <div className="upgrade_checkitem">
                <img loading="lazy" src="/images/check-mark.png" alt="" className="upgrade_tick-icon" />
                <div className="upgrade_checklist-txt">Insights on companies</div>
              </div>
              <div className="upgrade_checkitem">
                <img loading="lazy" src="/images/check-mark.png" alt="" className="upgrade_tick-icon" />
                <div className="upgrade_checklist-txt">Insights on resumes</div>
              </div>
            </div>
            <button type="submit" className="button w-button">
              Upgrade right now
            </button>
          </form>
        </div>
        {onClose && (
          <div className="main_form_close_button" onClick={onClose}>
            <img src="https://cdn.prod.website-files.com/69284f1f4a41d1c19de618ec/696807b39a055f53b4271712_close_black_24dp.svg" loading="lazy" alt="Close" className="main_form_close_icon" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Upgrade;

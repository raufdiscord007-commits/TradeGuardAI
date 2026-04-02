import React from 'react';

const FAQ = () => {
  const faqs = [
    {
      question: 'How accurate are the AI predictions?',
      answer:
        "Our deep learning models are trained on extensive historical data and achieve high accuracy rates. However, cryptocurrency markets are inherently volatile, and no prediction system is 100% accurate. We recommend using our signals as part of a comprehensive trading strategy.",
    },
    {
      question: 'Can I access a free trial?',
      answer:
        'Yes! We offer a 7-day free trial of TradeGuard AI with full access to all features. Experience real-time market analysis, AI predictions, and advanced charting tools with no credit card required.',
    },
    {
      question: 'Which cryptocurrencies are supported?',
      answer:
        'TradeGuard AI supports all major cryptocurrencies available on Binance, including Bitcoin (BTC), Ethereum (ETH), and thousands of altcoins. Real-time data feeds ensure you never miss market opportunities.',
    },
    {
      question: 'Can I modify my subscription later?',
      answer:
        'Absolutely! You can upgrade or downgrade your TradeGuard AI subscription at any time. Changes take effect immediately, and billing is prorated accordingly.',
    },
    {
      question: "What's the cancellation policy?",
      answer:
        'You can cancel your subscription anytime from your account settings. Your access continues until the end of your current billing period, with no hidden fees or penalties.',
    },
    {
      question: 'Is my data and trading information secure?',
      answer: 'Security is our top priority. We use industry-standard encryption, never store API secret keys, and implement read-only API access for maximum safety. Your trading data is private and secure.',
    },
  ];

  return (
    <div className="faq_main_wrapper">
      <div className="padding-global">
        <div className="container-large">
          <div className="padding-section-medium">
            <div className="faq_wrap">
              <div className="faq_title-wrap">
                <h2 className="heading-style-h2">Frequently asked questions</h2>
                <p className="text-size-medium text-color-secondary">
                  Everything you need to know about TradeGuard AI and our cryptocurrency trading platform.
                </p>
              </div>
              <div className="faq_grid">
                {faqs.map((faq, index) => (
                  <div key={index} id={`w-node-_003c9579-a609-2412-26c3-8e5b93c3061${index === 0 ? '1' : index === 1 ? '6' : index === 2 ? 'b' : index === 3 ? '0' : index === 4 ? '5' : 'a'}-3978b161`} className="faq_card">
                    <div className="faq_question-title center">{faq.question}</div>
                    <div className="text-size-regular is-color">{faq.answer}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;

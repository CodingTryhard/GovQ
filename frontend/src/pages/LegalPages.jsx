import React from 'react';

export const PrivacyPolicy = () => (
  <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
    <h1 className="text-3xl font-extrabold mb-6 text-slate-800">Privacy Policy</h1>
    <div className="prose text-slate-600 space-y-4">
      <p>Last updated: June 2026</p>
      <p>GovQ ("we", "us", or "our") operates the GovQ Token Booking System. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.</p>
      <h2 className="text-xl font-bold text-slate-800 mt-6">Information Collection and Use</h2>
      <p>We collect several different types of information for various purposes to provide and improve our Service to you. The types of data collected include Personal Data such as Email address, First name and last name, and Phone number.</p>
      <h2 className="text-xl font-bold text-slate-800 mt-6">Use of Data</h2>
      <p>We use the collected data to provide customer care and support, provide analysis or valuable information so that we can improve the Service, monitor the usage of the Service, and detect, prevent and address technical issues.</p>
    </div>
  </div>
);

export const TermsConditions = () => (
  <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
    <h1 className="text-3xl font-extrabold mb-6 text-slate-800">Terms & Conditions</h1>
    <div className="prose text-slate-600 space-y-4">
      <p>Last updated: June 2026</p>
      <p>Please read these terms and conditions carefully before using Our Service.</p>
      <h2 className="text-xl font-bold text-slate-800 mt-6">Booking Rules</h2>
      <p>Tokens booked via our service are non-transferable. You must arrive at the designated counter on time. Failure to show up may result in the forfeiture of your booking fee.</p>
      <h2 className="text-xl font-bold text-slate-800 mt-6">Payments</h2>
      <p>All token booking fees are collected securely via Razorpay. We do not store your credit card details or UPI PINs.</p>
    </div>
  </div>
);

export const RefundPolicy = () => (
  <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
    <h1 className="text-3xl font-extrabold mb-6 text-slate-800">Cancellation & Refund Policy</h1>
    <div className="prose text-slate-600 space-y-4">
      <p>Last updated: June 2026</p>
      <h2 className="text-xl font-bold text-slate-800 mt-6">Cancellations</h2>
      <p>You can cancel your token booking up to 24 hours before your scheduled slot. Cancellations within 24 hours will not be eligible for a refund.</p>
      <h2 className="text-xl font-bold text-slate-800 mt-6">Refunds</h2>
      <p>If you cancel your booking in accordance with our cancellation policy, your refund will be processed within 5-7 business days to the original payment method.</p>
    </div>
  </div>
);

export const ContactUs = () => (
  <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
    <h1 className="text-3xl font-extrabold mb-6 text-slate-800">Contact Us</h1>
    <div className="prose text-slate-600 space-y-4">
      <p>If you have any questions about our policies, please contact us:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>By email: support@govq-booking.test</li>
        <li>By visiting this page on our website: /contact</li>
        <li>By phone number: +91 98765 43210</li>
      </ul>
      <p className="mt-8 font-bold">GovQ HQ<br/>123 Admin Block, New Delhi, India 110001</p>
    </div>
  </div>
);

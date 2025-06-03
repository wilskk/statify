import React from "react";

export const ContactSupport = () => {
  return (
    <div className="space-y-4">
      <p>Our support team is available to help you with any questions or issues you may encounter.</p>
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
        </div>
        <div>
          <h3 className="font-medium">Email Support</h3>
          <a href="mailto:support@statify.com" className="text-blue-600 hover:underline">support@statify.com</a>
          <p className="text-sm text-gray-500">Response time: Usually within 24 hours</p>
        </div>
      </div>
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
          </svg>
        </div>
        <div>
          <h3 className="font-medium">Live Chat</h3>
          <p>Available Monday-Friday, 9am-5pm ET</p>
          <button className="mt-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200 transition">Start Chat</button>
        </div>
      </div>
    </div>
  );
};

export default ContactSupport; 
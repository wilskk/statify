import React from "react";

export const FAQ = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-medium">Q: How do I reset my password?</h3>
        <p>Go to your account settings and click &quot;Reset Password&quot;. You&apos;ll receive an email with instructions to create a new password.</p>
      </div>
      <div className="space-y-2">
        <h3 className="font-medium">Q: Can I invite team members?</h3>
        <p>Yes, you can invite team members from the Team section. Each member can be assigned different permission levels.</p>
      </div>
      <div className="space-y-2">
        <h3 className="font-medium">Q: What file formats are supported for import?</h3>
        <p>Statify supports CSV, Excel (.xlsx), JSON, and direct database connections through our connectors.</p>
      </div>
      <div className="space-y-2">
        <h3 className="font-medium">Q: Is my data secure?</h3>
        <p>Yes, we use industry-standard encryption and security measures. Your data is stored securely and never shared.</p>
      </div>
    </div>
  );
};

export default FAQ; 
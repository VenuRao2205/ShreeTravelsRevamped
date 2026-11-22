// Policy text carried over unchanged from the previous Shree Travels website.
export type Section = { title: string; items?: string[]; text?: string };

export const privacy = {
  intro:
    "Shree Travels is committed to ensuring that your privacy is protected. Should we ask you to provide certain information by which you can be identified when using this website, then you can be assured that it will only be used in accordance with this privacy statement. Shree Travels may change this policy from time to time by updating this page. You should check this page from time to time to ensure that you are happy with any changes. This policy is effective from 16th of May, 2024.",
  sections: [
    {
      title: "What we collect",
      items: [
        "Name and contact information",
        "Contact information including email address, mobile number and permanent address proof",
        "Demographic information such as postcode, preferences and interests",
        "Other information relevant to customer surveys and/or offers",
        "Identity proof (for security reasons)",
      ],
    },
    {
      title: "Pricing Policy",
      items: [
        "Shree Travels and the User consider the pricing section inside contact us section for booking.",
        "The pricing are subject to change in future based on market conditions and fuel costs.",
      ],
    },
    {
      title: "Security",
      items: [
        "We are committed to ensuring that your information is secure.",
        "We have put in place suitable physical, electronic and managerial procedures to safeguard and secure the information we collect online.",
        "All payment transactions are encrypted and processed through secure payment gateways.",
      ],
    },
    {
      title: "Links to other websites",
      text: "Our website may contain links to other websites of interest. However, once you have used these links to leave our site, you should note that we do not have any control over that other website. Therefore, we cannot be responsible for the protection and privacy of any information which you provide whilst visiting such sites and such sites are not governed by this privacy statement. You should exercise caution and look at the privacy statement applicable to the website in question.",
    },
  ] as Section[],
  note: "Note: In general, you can visit our website without telling us who you are or revealing any personal information about yourself. We only collect information when you voluntarily provide it to us through our contact forms or booking services.",
};

export const terms = {
  intro:
    "Please read these terms and conditions carefully before using our services. By booking our services, you agree to be bound by these terms.",
  clauses: [
    { title: "Payment Terms", text: "The customer shall pay the car rental fare as per the applicable rates and payment schedules mentioned on the website of Shree Travels at the time of booking. The customer shall also pay parking charges, toll-charges, service tax, state tax and any other fee or levy presently payable or imposed hereinafter under applicable law/s for availing the car rental services." },
    { title: "Payment Terms", text: "The payment has to be transferred to the Shree Travels account for the transaction to be completed. The client will have the responsibility to confirm the transaction with Shree Travels and send all relevant details and proof to confirm the same." },
    { title: "Payment Terms", text: "The billing shall be done after the completion of the transaction and the bill shall be sent through email. The client shall pay the amount communicated on email through the payment gateway and shall send us the confirmation of the transaction separately through email to shreetravelsngp@yahoo.com." },
    { title: "Payment Terms", text: "In case of a payment made before the commencement of a booking, the amount shall be treated as advance / part payment and the final amount nett of the advance paid shall be cleared by the client as per the amount intimated to the client on email." },
    { title: "Operating Hours", text: "The transaction / payment has to be made within the office hours of 0930 to 1900 hrs on a monday to saturday basis excluding public holidays for the vehicle to be dispatched. alternatively, for other hours / days, the client has the option to come to our 24x7 operations office and complete the physical swiping of the credit card and make the payment and confirm the booking." },
    { title: "Liability Disclaimer", text: "The Customer agrees and acknowledges that the use of the services offered by Shree Travels is at the sole risk of the Customer. Shree Travels disclaims all representations and warranties of any kind, whether express or implied as to condition, suitability, quality, merchantability and fitness of the services offered by Shree Travels. The liability of Shree Travels is excluded to the fullest extent permitted by law." },
    { title: "Pricing Policy", text: "The pricing rates are subject to revision in petroleum product in the future." },
  ],
  notice:
    "These terms and conditions are subject to change without prior notice. It is the customer's responsibility to review these terms periodically. Continued use of our services after any modifications constitutes acceptance of the updated terms and conditions.",
};

export const cancellation = {
  intro:
    "Please review our cancellation and refund policies carefully before making a booking. These policies are designed to ensure fair treatment for all parties involved.",
  // Numbered 1 to 7: point 1 refers to "point 3" (special cases), so numbering must stay as is.
  points: [
    { title: "24-Hour Cancellation Policy", text: "The customer agrees and acknowledges that refund shall be processed if the cancellation request is received before 24 hour of scheduled pickup. (Refer point 3 for special cases)" },
    { title: "Cancellation Process", text: "The Cancellation can be done over the phone or by email. All cancellation to be made against the booking ID provided at the time of booking the cab." },
    { title: "Special Occasions", text: "No cancellations are entertained in any case for those products/Service that Shree travels marketing team has obtained on special occasions like Dussehra, Pongal, Diwali, New year etc. These are limited occasion offers and therefore cancellations are not possible." },
    { title: "Force Majeure", text: "Shree travels will not be responsible for any cancellation/delay of service in case of any natural calamity, agitation, Strike or Road Jam/traffic etc. Hence no refund would be made." },
    { title: "", text: "The customer agrees and acknowledges that no refund shall be processed if the cancellation request is received within 24 hours of scheduled pickup." },
    { title: "", text: "Shree travels might change driver & cab details prior to boarding the taxi in case of vehicle breakdown or other genuine reasons at Driver's end. No Cancellation request shall be entertained in such cases." },
    { title: "", text: "Shree travels reserves the right to cancel/change the booking of vehicle at any point of time." },
  ],
  refund:
    'If you are eligible for refunds based on the "Cancellation and Returns" policy above, then the refund will be remitted back to you in 5-7 working days.',
};

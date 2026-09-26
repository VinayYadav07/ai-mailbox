// testing ke liye kuch fake mails

const ONE_HOUR = 60 * 60 * 1000;

function makeBody(lines) {
  return lines.map((line) => `<p>${line}</p>`).join("");
}

export function getDemoMails(myEmail) {
  const now = Date.now();

  const inboxMails = [
    {
      from: "rahul.sharma@acmecorp.in",
      subject: "Sales dashboard - need your review",
      lines: [
        "Hi,",
        "Review dashboard and share feedback by Friday. Join Monday's meeting at 11 am where we will finalise the Q3 numbers with the client.",
        "Thanks,<br>Rahul",
      ],
      hoursAgo: 1,
    },
    {
      from: "it.ops@acmecorp.in",
      subject: "URGENT: Payment gateway down in production",
      lines: [
        "Team,",
        "The payment gateway has been down since 9:40 am and customers cannot check out. Please investigate immediately and send an RCA by today 6 pm.",
        "Also join the war-room call at 12 pm.",
        "IT Ops",
      ],
      hoursAgo: 0.5,
    },
    {
      from: "priya.nair@finance.acmecorp.in",
      subject: "Gentle reminder: invoice approval pending",
      lines: [
        "Hi,",
        "Just following up on my email from last week. Could you please approve invoice INV-2291 by 30 Sep? The vendor is waiting for the payment.",
        "Let me know if anything is unclear.",
        "Regards,<br>Priya",
      ],
      hoursAgo: 20,
    },
    {
      from: "hr@acmecorp.in",
      subject: "Team offsite - confirm your attendance",
      lines: [
        "Hello everyone,",
        "We are planning a team offsite next week at Lonavala. Please confirm your attendance and share your T-shirt size by Wednesday.",
        "Cheers,<br>HR Team",
      ],
      hoursAgo: 30,
    },
    {
      from: "newsletter@techweekly.io",
      subject: "This week in React: Server Components deep dive",
      lines: [
        "Your weekly digest is here! Read about React Server Components, the new Vite release and 10 CSS tricks.",
        "You are receiving this newsletter because you subscribed. Unsubscribe anytime.",
      ],
      hoursAgo: 40,
    },
    {
      from: "ankit.verma@acmecorp.in",
      subject: "Lunch on Saturday?",
      lines: [
        "Hey!",
        "A few of us are going for lunch on Saturday near Andheri. Want to join? Let me know by tomorrow.",
        "Ankit",
      ],
      hoursAgo: 5,
    },
  ];

  const mails = inboxMails.map((mail) => ({
    from: mail.from,
    to: myEmail,
    subject: mail.subject,
    body: makeBody(mail.lines),
    receiverRead: false,
    senderRead: true,
    demo: true,
    createdAt: now - mail.hoursAgo * ONE_HOUR,
  }));

  // ek sent mail jiska reply nahi aaya, follow-ups page ke liye
  mails.push({
    from: myEmail,
    to: "vendor.support@cloudhost.com",
    subject: "Server migration quote",
    body: makeBody([
      "Hi,",
      "Could you please share the quote for migrating our 3 servers to your cloud plan? We need it to finalise the budget this month.",
      "Thanks",
    ]),
    receiverRead: false,
    senderRead: true,
    demo: true,
    createdAt: now - 72 * ONE_HOUR,
  });

  return mails;
}

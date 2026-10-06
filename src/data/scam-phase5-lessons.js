// Everwise - Scam Protection track
// Phase 12: Protecting Your Personal Information
//
// The phase is built around one question the learner carries throughout:
//   "Why do they need this information?"
//
// Passwords are taught with a single running metaphor — a key — so 5.2
// through 5.6 feel like one continuous idea rather than six separate topics.

const PRIVACY_HABITS = [
  "Slow down",
  "Think before you share",
  "Ask why someone needs your information",
  "Share only what's necessary",
];

export const scamPhase5Lessons = [
  // ============================================================
  // LESSON 5.1
  // ============================================================
  {
    id: "scam-info-is-valuable",
    track: "scam",
    phase: 12,
    order: 1,
    lessonNumber: "5.1",
    title: "Your Information Is Valuable",
    pathTitle: "Your Information",
    badge: "Privacy Aware",
    xp: 20,
    goals: [
      "Understand why scammers want your personal information.",
      "Ask why information is needed before sharing it."
    ],
    blocks: [
      {
        type: "reading",
        heading: "Your Information Is Valuable",
        question: "Why would someone want my personal information?",
        objective:
          "Learn that personal information has value, and sharing too much can make it easier for scammers to target you.",
        warningSigns: PRIVACY_HABITS,
        reminderTitle: "Review privacy habits",
        text: "Your name, address, birthday, phone number, and account details can help identify you. Banks, clinics, and other services may need some of this information. Scammers can also use it to impersonate you or make a request seem familiar.\n\nBefore sharing, check who is asking, why they need it, and whether the request fits the situation. For unexpected requests, contact the organization through a route you already trust. Share only what is needed."
      },
      {
        type: "tiered",
        title: "What's personal?",
        scenario: "A website offering a free newsletter asks for your full home address and phone number.",
        question:
          "Which response best protects your information?",
        options: [
          {
            text: "Check who runs the site and why it needs these details before sharing.",
            tier: "best",
            feedback:
              "Addresses and phone numbers are personal information. Before sharing them, make sure you know why they're being requested."
          },
          {
            text: "Leave optional address and phone fields blank.",
            tier: "safe",
            feedback:
              "A newsletter may only need an email address. Leave unnecessary details out while you check the request."
          },
          {
            text: "Enter every detail because the form asks for it.",
            tier: "unsafe",
            feedback:
              "A form does not prove that every request is necessary. Check the site and the purpose before sharing."
          }
        ]
      },
      {
        type: "tiered",
        title: "Asking \"why?\"",
        scenario:
          "Someone calls unexpectedly and asks, \"Can you please confirm your date of birth for me?\"",
        question: "Which response is the best?",
        options: [
          {
            text: "End the call and verify the request using a number you already trust before sharing.",
            tier: "best",
            feedback:
              "A caller can invent a convincing explanation. A trusted contact route helps you check who is really asking."
          },
          {
            text: "Tell them you'll call the organization back using an official phone number.",
            tier: "safe",
            feedback: "Calling a trusted number helps you verify the request independently."
          },
          {
            text: "Give your birthday because they asked politely.",
            tier: "unsafe",
            feedback:
              "Your birthday is used to verify your identity at banks and doctors. It's worth protecting."
          }
        ]
      },
      {
        type: "tiered",
        title: "Less is more",
        scenario:
          "You're filling out an online form. One question asks for information that doesn't seem related to what you're doing.",
        question: "Which response is the best?",
        options: [
          {
            text: "Skip the question unless it's clearly required and makes sense.",
            tier: "best",
            feedback:
              "Some forms ask for optional information. If you don't understand why it's needed, it's okay not to provide it."
          },
          {
            text: "Think about whether the information is really necessary.",
            tier: "safe",
            feedback: "Pause to understand the purpose before sharing information."
          },
          {
            text: "Fill in every blank because it's on the form.",
            tier: "unsafe",
            feedback:
              "A blank on a form is not an obligation. Many are optional."
          }
        ]
      },
      {
        type: "tiered",
        title: "Connect previous lessons",
        scenario:
          "You receive an email that appears to be from your bank. It asks you to confirm your phone number, address, and birthday by clicking a link.",
        question: "Which response is safe?",
        options: [
          {
            text: "Contact your bank using its official phone number or website instead of the email link.",
            tier: "best",
            feedback:
              "Even if a message looks convincing, verify it before sharing personal information."
          },
          {
            text: "Verify whether the request is real before sharing any information.",
            tier: "safe",
            feedback: "Check the request through a contact route you already trust."
          },
          {
            text: "Click the link and provide the information because the email looks official.",
            tier: "unsafe",
            feedback:
              "Banks may legitimately update records, but this email does not verify the request. Open the official app or contact the bank through a trusted number."
          }
        ]
      },
      {
        type: "confidence",
        question: "How confident do you feel deciding when to share personal information?",
        practice: [
          {
            scenario: "A stranger at an event asks where you live.",
            question: "Which response is the best?",
            options: [
              {
                text: "Only share personal information if you're comfortable and there's a good reason.",
                tier: "best",
                feedback: "Your comfort is a perfectly good reason to decline."
              },
              {
                text: "It's okay to politely decline.",
                tier: "safe",
                feedback: "You can give a general answer or decline without explaining."
              },
              {
                text: "Tell them your full address because they seem friendly.",
                tier: "unsafe",
                feedback: "Friendliness is not a reason to share your address."
              }
            ]
          },
          {
            scenario: "You opened a service you trust to set up two-step verification. It asks for a phone number for security codes.",
            question: "Which response is the best?",
            options: [
              {
                text: "Think about whether the request makes sense before sharing it.",
                tier: "best",
                feedback:
                  "Some services use phone numbers for sign-in codes. Check that you are using the official service and review its explanation."
              },
              {
                text: "Read why the website is asking for the information.",
                tier: "safe",
                feedback: "Check why the number is needed and whether another verification method is available."
              },
              {
                text: "Share it automatically without reading anything.",
                tier: "unsafe",
                feedback: "Even reasonable requests deserve a glance."
              }
            ]
          }
        ]
      },
      {
        type: "memory",
        links: [
          {
            lesson: "Lesson 1.4 — Stop, Verify, Then Decide",
            note: "Before sharing personal information, verify who is asking and why."
          },
          {
            lesson: "Lesson 2.5 — Always Verify",
            note: "Unexpected requests for personal information should always be confirmed independently."
          }
        ]
      },
      {
        type: "finalboss",
        title: "The new patient form",
        setup:
          "You visit a new medical clinic for your first appointment. While filling out the paperwork, you notice one page asking for your Social Security number, driver's license number, the name of your bank, and your bank account number. You expected to provide contact and insurance details.",
        messages: [
          {
            from: "Example conversation · Reception desk",
            body: "Just fill out everything on every page."
          }
        ],
        question: "What should you do?",
        options: [
          {
            text: "Ask the receptionist why the banking information is needed, and only provide information that's necessary for your care.",
            tier: "best",
            feedback:
              "A clinic may need some personal information. Ask which fields are required, why they are needed, and how they will be protected before sharing."
          },
          {
            text: "Skip the question until someone explains why it's required.",
            tier: "safe",
            feedback:
              "Leaving it blank and asking is completely reasonable."
          },
          {
            text: "Fill out every blank because it came from a medical office.",
            tier: "unsafe",
            feedback:
              "Being at a clinic does not make every field necessary. Ask about the banking request and other sensitive details before completing them."
          }
        ],
        spotted: ["A request that doesn't match the situation"]
      }
    ],
    quiz: [],
    complete: {
      title: "Lesson complete!",
      subtitle: "You completed Your Information Is Valuable.",
      habit: "Before you share, ask: \"Why do they need this information?\"",
      warningSign: "A request for information the situation doesn't call for.",
      skills: [
        "Recognized valuable personal information",
        "Questioned an unnecessary request",
        "Protected your privacy politely"
      ],
      next: "Your Password Is Your House Key"
    }
  },

  // ============================================================
  // LESSON 5.2
  // ============================================================
  {
    id: "scam-password-house-key",
    track: "scam",
    phase: 12,
    order: 2,
    lessonNumber: "5.2",
    title: "Your Password Is Your House Key",
    pathTitle: "Password = Key",
    badge: "Key Keeper",
    xp: 20,
    goals: [
      "Understand what a password protects.",
      "Recognize any request for your password as a warning sign."
    ],
    blocks: [
      {
        type: "reading",
        heading: "Your Password Is Your House Key",
        question: "Why are passwords so important?",
        objective:
          "Learn that your password is like the key to your home — it protects what belongs to you and shouldn't be shared.",
        warningSigns: PRIVACY_HABITS,
        reminderTitle: "Review privacy habits",
        text: "A password helps protect access to your email, bank account, and photos, much like a key protects your home. Someone who gets it may be able to enter your account.\n\nKeep it private. Do not send it in a message or read it to an unexpected caller. Enter it only in the official app or website you intended to use. If a request worries you, contact the service through a trusted route."
      },
      {
        type: "tiered",
        title: "Understanding the key",
        scenario: "Someone says, \"A password is just a word. It isn't very important.\"",
        question: "Which response is the best?",
        options: [
          {
            text: "A password protects access to my accounts, just like a key protects my home.",
            tier: "best",
            feedback: "A password isn't just a word — it's protection for your personal information."
          },
          {
            text: "Losing a password can let someone into my account.",
            tier: "safe",
            feedback: "Someone who knows your password may be able to access your account."
          },
          {
            text: "Passwords aren't important because I can always make a new one.",
            tier: "unsafe",
            feedback:
              "By the time you make a new one, someone may already have been inside."
          }
        ]
      },
      {
        type: "tiered",
        title: "Recognizing a red flag",
        scenario:
          "You receive an email that says, \"To keep your account active, reply with your password.\"",
        question: "Which response is the best?",
        options: [
          {
            text: "Never reply with your password.",
            tier: "best",
            feedback:
              "Do not send your password by email or text, or read it to a caller. Use the official sign-in page yourself."
          },
          {
            text: "Contact the company through its official website or phone number if you're unsure.",
            tier: "safe",
            feedback: "Contact the service independently to check an unexpected request."
          },
          {
            text: "Reply because the email sounds professional.",
            tier: "unsafe",
            feedback:
              "A request to reply with your password is a warning sign, even when the message looks professional."
          }
        ]
      },
      {
        type: "tiered",
        title: "Sharing with others",
        scenario:
          "A neighbor offers to help you order something online and asks, \"What's your password? I'll log in for you.\"",
        question: "Which response is the best?",
        options: [
          {
            text: "Keep your password private and log in yourself if possible.",
            tier: "best",
            feedback:
              "You can accept help without saying your password aloud. Type it yourself and stay in control of the account."
          },
          {
            text: "Ask them to explain the steps while you sign in privately.",
            tier: "safe",
            feedback:
              "A trusted helper can guide you without learning your password. If you already shared it, change it through the official service."
          },
          {
            text: "Tell them your password because they're your neighbor.",
            tier: "unsafe",
            feedback:
              "Even with people you trust, typing it yourself is simpler and safer."
          }
        ]
      },
      {
        type: "tiered",
        title: "Connect previous lessons",
        scenario:
          "Someone calls claiming to be from your bank. They know your name and address, then ask, \"Can you confirm your online banking password?\"",
        question: "Which response is safe?",
        options: [
          {
            text: "Refuse to share your password and contact your bank using its official phone number.",
            tier: "best",
            feedback:
              "Knowing your name or address doesn't prove someone works for your bank. Your password is still private."
          },
          {
            text: "Hang up and verify the call independently.",
            tier: "safe",
            feedback: "End the call and use a trusted bank number to check the request."
          },
          {
            text: "Share the password because they already knew your personal information.",
            tier: "unsafe",
            feedback:
              "Knowing some details about you is easy. It's often how the call is made believable in the first place."
          }
        ]
      },
      {
        type: "confidence",
        question: "How confident do you feel keeping your passwords private?",
        practice: [
          {
            scenario:
              "A website asks you to enter your password after you chose to sign in.",
            question: "Which response is the best?",
            options: [
              {
                text: "This is normal if it's the official website you intended to visit.",
                tier: "best",
                feedback:
                  "Entering your password on the official site you chose is normal. The important part is making sure you're on the correct website first."
              },
              {
                text: "Make sure you're on the correct website before typing it.",
                tier: "safe",
                feedback: "Exactly the check that matters."
              },
              {
                text: "Never type your password anywhere.",
                tier: "unsafe",
                feedback:
                  "You may need to enter a password to sign in. Check the official app or site first; do not tell it to someone else."
              }
            ]
          },
          {
            scenario:
              "A caller says, \"For security purposes, please tell me your password.\"",
            question: "Which response is the best?",
            options: [
              {
                text: "Keep the password private and verify through the official service.",
                tier: "best",
                feedback: "Saying a request is for security does not prove it is safe. Do not disclose the password."
              },
              {
                text: "End the call and contact the company yourself if you're concerned.",
                tier: "safe",
                feedback: "Simple and effective."
              },
              {
                text: "Give them the password because they mentioned security.",
                tier: "unsafe",
                feedback:
                  "Mentioning security is not the same as providing it."
              }
            ]
          }
        ]
      },
      {
        type: "memory",
        links: [
          {
            lesson: "Lesson 2.3 — Rushing Is a Warning",
            note: "Even if someone pressures you, don't rush into sharing private information."
          },
          {
            lesson: "Lesson 5.1 — Your Information Is Valuable",
            note: "A password is one of your most valuable pieces of information, because it unlocks your accounts."
          }
        ]
      },
      {
        type: "finalboss",
        title: "\"We need your password\"",
        setup:
          "You receive a phone call from someone claiming to work for your email provider. They already know your full name, email address, and phone number. They sound calm and professional, and they never ask for money.",
        messages: [
          {
            from: "Example call transcript · \"Email Support\"",
            body:
              "We're fixing a security problem on your account. Before we continue, I just need you to confirm your password."
          }
        ],
        question: "What should you do?",
        options: [
          {
            text: "Refuse to share your password, end the call, and contact your email provider using its official website or phone number if you're concerned.",
            tier: "best",
            feedback:
              "This was a test of your most important habit. Even if someone sounds professional — or already knows information about you — you should never hand them the key to your digital life."
          },
          {
            text: "Remember that knowing some of your personal information doesn't prove someone is legitimate.",
            tier: "safe",
            feedback: "Personal details can be obtained elsewhere. Verify who is asking through a trusted route."
          },
          {
            text: "Tell them your password because they're helping secure your account.",
            tier: "unsafe",
            feedback:
              "A request for your password is a warning sign even without pressure or a demand for money. End the call and contact the provider yourself."
          }
        ],
        spotted: [
          "Unexpected contact",
          "A request for your password",
          "Personal details used to build trust"
        ]
      }
    ],
    quiz: [],
    complete: {
      title: "Lesson complete!",
      subtitle: "You completed Your Password Is Your House Key.",
      habit: "Treat your password like your house key — keep it private.",
      warningSign: "Anyone asking you to tell them your password.",
      skills: [
        "Understood what a password protects",
        "Recognized a password request as a warning sign",
        "Refused politely and verified independently"
      ],
      next: "Don't Make It Easy to Guess"
    }
  },

  // ============================================================
  // LESSON 5.3
  // ============================================================
  {
    id: "scam-hard-to-guess",
    track: "scam",
    phase: 12,
    order: 3,
    lessonNumber: "5.3",
    title: "Don't Make It Easy to Guess",
    pathTitle: "Hard to Guess",
    badge: "Strong Password",
    xp: 20,
    goals: [
      "Avoid personal information in passwords.",
      "Recognize what makes a password harder to guess."
    ],
    blocks: [
      {
        type: "reading",
        heading: "Don't Make It Easy to Guess",
        question: "What makes a password safe?",
        objective:
          "Learn that a good password is difficult for other people to guess, even if they know you well.",
        warningSigns: PRIVACY_HABITS,
        reminderTitle: "Review privacy habits",
        text: "Names, birthdays, pet names, and short number patterns are easy to guess. Adding a familiar year or symbol does not fix a predictable password. Aim for at least 16 characters when the service allows it, and use a different password for each account.\n\nA trusted password manager can create a long, random password. Another option is a long phrase of several unrelated, randomly chosen words. The passwords shown in this lesson are public examples; never use them for your own accounts."
      },
      {
        type: "tiered",
        title: "Spot the weak password",
        scenario: "Maria was born in 1952 and creates this password: Maria1952",
        question: "What makes this password weak?",
        options: [
          {
            text: "It uses personal information someone might guess.",
            tier: "best",
            feedback: "Birth years and names are often easy to discover or guess."
          },
          {
            text: "It includes her name.",
            tier: "safe",
            feedback: "That's half the problem — the birth year is the other half."
          },
          {
            text: "It has numbers, so it's automatically secure.",
            tier: "unsafe",
            feedback:
              "Numbers help only when they aren't predictable. A birth year is very predictable."
          }
        ]
      },
      {
        type: "tiered",
        title: "Which password is safer?",
        scenario: "Compare these practice passwords. They are public examples, not passwords to use.",
        question: "Which would usually be harder for someone to guess?",
        options: [
          {
            text: "BlueChair!River29Maple",
            tier: "best",
            feedback:
              "This is the longest option shown. For your own account, generate a new long, random password rather than copying an example."
          },
          {
            text: "Maple$Train88Garden",
            tier: "safe",
            feedback: "This is less predictable than a name and number pattern. Length, randomness, and using it on only one account all matter."
          },
          {
            text: "John123",
            tier: "unsafe",
            feedback: "Short, a common name, and a predictable number sequence."
          }
        ]
      },
      {
        type: "tiered",
        title: "Think like a scammer",
        scenario:
          "You regularly post pictures of your dog, Buddy, on social media.",
        question: "Which password should you avoid?",
        options: [
          {
            text: "Buddy2026",
            tier: "best",
            feedback:
              "If someone knows your pet's name, they'll often try it as part of a password."
          },
          {
            text: "Buddy123",
            tier: "safe",
            feedback:
              "Also a poor choice for the same reason — you spotted the pattern."
          },
          {
            text: "GreenLamp!River84",
            tier: "unsafe",
            feedback:
              "This is not the weakest example here. For real accounts, create a fresh, long, random password instead of using any public example."
          }
        ]
      },
      {
        type: "tiered",
        title: "Connect previous lessons",
        scenario:
          "Someone knows your birthday, your hometown, and your favorite sports team.",
        question: "Which password would be the safest?",
        options: [
          {
            text: "Cloud!Pencil74Garden",
            tier: "best",
            feedback:
              "This is the longest option and avoids personal details. Use a newly generated password for your own account."
          },
          {
            text: "River$Coffee82",
            tier: "safe",
            feedback: "Avoiding personal details helps, but this option is shorter. Aim for a long, random password used only once."
          },
          {
            text: "Chicago1960",
            tier: "unsafe",
            feedback:
              "Hometown plus a birth year — both things the person already knows."
          }
        ]
      },
      {
        type: "confidence",
        question:
          "How confident do you feel choosing passwords that are difficult to guess?",
        practice: [
          {
            scenario: "Which password should you avoid?",
            question: "Choose the weakest option.",
            options: [
              {
                text: "Lucky123",
                tier: "best",
                feedback:
                  "Short, a common word, and a predictable number sequence."
              },
              {
                text: "Sarah1980",
                tier: "safe",
                feedback: "Also weak — a name plus a year."
              },
              {
                text: "Mountain!Apple92",
                tier: "unsafe",
                feedback: "This is harder to guess than the two predictable choices, but a real password should be longer, random, unique, and not copied from this lesson."
              }
            ]
          },
          {
            scenario:
              "A friend says, \"I always use my birthday because I'll never forget it.\"",
            question: "Which response is the best?",
            options: [
              {
                text: "Birthdays are easy for other people to guess.",
                tier: "best",
                feedback: "Birthdays appear on social media, forms, and public records."
              },
              {
                text: "A password shouldn't contain obvious personal information.",
                tier: "safe",
                feedback: "Use a long, random password with no obvious personal details."
              },
              {
                text: "Birthdays make excellent passwords.",
                tier: "unsafe",
                feedback: "They're among the first things anyone would try."
              }
            ]
          }
        ]
      },
      {
        type: "memory",
        links: [
          {
            lesson: "Lesson 5.1 — Your Information Is Valuable",
            note: "Your personal information has value. Don't use it as your password."
          },
          {
            lesson: "Lesson 5.2 — Your Password Is Your House Key",
            note: "A strong key is harder to copy. A strong password is harder to guess."
          }
        ]
      },
      {
        type: "finalboss",
        title: "\"Let's guess your password\"",
        setup:
          "You're creating a password for a new online account. You think about using Linda1965 because it's easy to remember. Then you realize someone could already know your first name, your birth year, and where you live.",
        question: "What should you do?",
        options: [
          {
            text: "Create a password that doesn't use your personal information and is much harder for someone else to guess.",
            tier: "best",
            feedback:
              "You checked whether someone else could guess it. A password manager can help create and save a new, long, random password."
          },
          {
            text: "Choose a longer password with unrelated words instead.",
            tier: "safe",
            feedback: "Choose several unrelated, randomly selected words, and do not reuse the phrase on another account."
          },
          {
            text: "Use your name and birth year because you'll remember them.",
            tier: "unsafe",
            feedback:
              "Memorable to you also means memorable — and guessable — to anyone who knows you."
          }
        ],
        spotted: []
      }
    ],
    quiz: [],
    complete: {
      title: "Lesson complete!",
      subtitle: "You completed Don't Make It Easy to Guess.",
      habit: "Choose passwords that are hard for others to guess — not just easy for you to remember.",
      warningSign: "A password that says something about you.",
      skills: [
        "Identified weak passwords",
        "Avoided personal information",
        "Chose less predictable passwords"
      ],
      next: "One Password Isn't Enough"
    }
  },

  // ============================================================
  // LESSON 5.4
  // ============================================================
  {
    id: "scam-one-password-not-enough",
    track: "scam",
    phase: 12,
    order: 4,
    lessonNumber: "5.4",
    title: "One Password Isn't Enough",
    pathTitle: "One Key Per Door",
    badge: "Unique Keys",
    xp: 20,
    goals: [
      "Understand why reusing passwords is risky.",
      "Prioritize your email account for a unique password."
    ],
    blocks: [
      {
        type: "reading",
        heading: "One Password Isn't Enough",
        question: "Why can't I just use the same password everywhere?",
        objective:
          "Learn why every important account should have its own unique password.",
        warningSigns: PRIVACY_HABITS,
        reminderTitle: "Review privacy habits",
        text: "If you use the same password for several accounts, a leak at one service can put the others at risk. Someone can try the stolen password on your email, banking, and shopping accounts.\n\nGive each account a different password. Start with email, banking, and other sensitive accounts, then work through the rest. A password manager can help. If a password is exposed, replace it everywhere you used it through each service’s official app or website."
      },
      {
        type: "tiered",
        title: "The house key",
        scenario:
          "Jim uses the exact same password for his email, bank account, and shopping websites.",
        question: "What is the biggest problem?",
        options: [
          {
            text: "If one account is compromised, the others may also be at risk.",
            tier: "best",
            feedback: "Reusing passwords gives someone one key that can open many doors."
          },
          {
            text: "Someone only needs to learn one password.",
            tier: "safe",
            feedback: "A stolen password can be tried on every account where it was reused."
          },
          {
            text: "Using one password makes his accounts faster.",
            tier: "unsafe",
            feedback: "The concern is that one stolen password may open several accounts."
          }
        ]
      },
      {
        type: "tiered",
        title: "Which account matters most?",
        scenario:
          "If you could only create one unique password today, which account should be your highest priority?",
        question: "Choose the most important account to protect.",
        options: [
          {
            text: "Your email account.",
            tier: "best",
            feedback:
              "Your email often helps you reset passwords for your other accounts, making it one of your most important accounts to protect."
          },
          {
            text: "Your bank account.",
            tier: "safe",
            feedback:
              "Banking is also a high priority. Email often receives reset links for other accounts, so protect both with unique passwords."
          },
          {
            text: "A website where you read the news.",
            tier: "unsafe",
            feedback: "A news account may still hold payment or personal details. Give every account a unique password, starting with the most sensitive."
          }
        ]
      },
      {
        type: "tiered",
        title: "Thinking ahead",
        scenario:
          "A shopping website you use announces that customer passwords were stolen.",
        question: "Which response is the best?",
        options: [
          {
            text: "Change your password there, and change it anywhere else you used the same password.",
            tier: "best",
            feedback:
              "If the same password was used elsewhere, changing only one account isn't enough."
          },
          {
            text: "Review your other important accounts for password reuse.",
            tier: "safe",
            feedback: "Check for reuse and replace every copy of the exposed password."
          },
          {
            text: "Do nothing because it wasn't your bank.",
            tier: "unsafe",
            feedback:
              "If that password also opens your bank, the shopping site was the doorway."
          }
        ]
      },
      {
        type: "tiered",
        title: "Connect previous lessons",
        scenario:
          "You create a long, difficult password. Now you're thinking about using it for every account.",
        question: "Which response is safe?",
        options: [
          {
            text: "Use different passwords for your important accounts.",
            tier: "best",
            feedback:
              "A strong password is helpful — but it becomes much safer when it protects only one account."
          },
          {
            text: "Give especially important accounts their own unique password.",
            tier: "safe",
            feedback: "A good realistic starting point."
          },
          {
            text: "Reuse the same strong password everywhere.",
            tier: "unsafe",
            feedback:
              "Strength doesn't help if the password is stolen from one site and tried on all the others."
          }
        ]
      },
      {
        type: "confidence",
        question:
          "How confident do you feel using different passwords for important accounts?",
        practice: [
          {
            scenario:
              "A friend says, \"I use the same password everywhere because it's easier.\"",
            question: "Which response is the best?",
            options: [
              {
                text: "One stolen password could unlock many accounts.",
                tier: "best",
                feedback: "The single strongest reason not to reuse."
              },
              {
                text: "Important accounts should have different passwords.",
                tier: "safe",
                feedback: "Start with sensitive accounts and work toward a different password for every account."
              },
              {
                text: "That's the safest approach.",
                tier: "unsafe",
                feedback: "Reusing a password may feel easier, but one leak can put several accounts at risk."
              }
            ]
          },
          {
            scenario: "One of your old online accounts has a security problem.",
            question: "Which response is the best?",
            options: [
              {
                text: "Change the password anywhere else you reused it.",
                tier: "best",
                feedback: "The old account matters because of what it shares."
              },
              {
                text: "Review your important accounts.",
                tier: "safe",
                feedback: "Check which accounts shared the password and secure each one."
              },
              {
                text: "Ignore it because you don't use that website often.",
                tier: "unsafe",
                feedback:
                  "How often you use it doesn't matter — the password does."
              }
            ]
          }
        ]
      },
      {
        type: "memory",
        links: [
          {
            lesson: "Lesson 5.2 — Your Password Is Your House Key",
            note: "Today you learned that every important account deserves its own key."
          },
          {
            lesson: "Lesson 5.3 — Don't Make It Easy to Guess",
            note: "A strong password is even stronger when it's only used once."
          }
        ]
      },
      {
        type: "finalboss",
        title: "The security alert",
        setup:
          "An email says an online store had a password leak. You open the store’s official website yourself and confirm the notice. You used that password for the store, your email, and your photo storage account.",
        messages: [
          {
            from: "Email · Online store",
            body:
              "We recently discovered a security incident that may have exposed customer passwords. We recommend changing your password as soon as possible."
          }
        ],
        question: "What should you do?",
        options: [
          {
            text: "Change the password for the shopping website and every other account where you used that same password, starting with your email.",
            tier: "best",
            feedback:
              "The exposed password puts every account where it was reused at risk. Email is a priority because it often receives password-reset links for other services."
          },
          {
            text: "Create a new, unique password for each important account.",
            tier: "safe",
            feedback: "Create a different password for each affected account and review its security settings."
          },
          {
            text: "Change only the shopping website password because that's where the problem happened.",
            tier: "unsafe",
            feedback:
              "The breach happened there, but the danger travels to every account sharing that password."
          }
        ],
        spotted: []
      }
    ],
    quiz: [],
    complete: {
      title: "Lesson complete!",
      subtitle: "You completed One Password Isn't Enough.",
      habit: "Every important account deserves its own password.",
      warningSign: "One key that opens every door.",
      skills: [
        "Understood password reuse",
        "Prioritized email security",
        "Responded correctly to a breach notice"
      ],
      next: "Your Digital Keychain"
    }
  },

  // ============================================================
  // LESSON 5.5
  // ============================================================
  {
    id: "scam-password-manager",
    track: "scam",
    phase: 12,
    order: 5,
    lessonNumber: "5.5",
    title: "Your Digital Keychain",
    pathTitle: "Password Managers",
    badge: "Keychain Keeper",
    xp: 20,
    goals: [
      "Understand what a password manager does.",
      "Protect the password or device passcode that unlocks your password manager."
    ],
    blocks: [
      {
        type: "reading",
        heading: "Your Digital Keychain",
        question: "How can I remember lots of different passwords?",
        objective:
          "Learn how a password manager can safely help you remember unique passwords without memorizing each one.",
        warningSigns: PRIVACY_HABITS,
        reminderTitle: "Review privacy habits",
        text: "A password manager creates and stores different passwords so you do not have to memorize them all. Some unlock with a master password; others use your device passcode, Face ID, or Touch ID. Protect the way you unlock it and keep its recovery options current.\n\nOn iPhone and iPad with iOS or iPadOS 18 or later, open the Passwords app. On versions 15–17, open Settings, then Passwords. Use a trusted tool you chose yourself, not one promoted by an unexpected message."
      },
      {
        type: "tiered",
        title: "Understanding password managers",
        scenario: "A friend says, \"I can't remember twenty different passwords.\"",
        question: "What could help?",
        options: [
          {
            text: "A password manager can securely remember them for you.",
            tier: "best",
            feedback:
              "Password managers make it much easier to use different passwords without memorizing them all."
          },
          {
            text: "Keep a written backup in a private, secure place.",
            tier: "unsafe",
            feedback:
              "A securely stored backup can help with recovery. Avoid passwords on display or in an unprotected note that others can access."
          },
          {
            text: "Using one password everywhere.",
            tier: "unsafe",
            feedback: "Reusing one password can put several accounts at risk. A manager makes unique passwords easier to use."
          }
        ]
      },
      {
        type: "tiered",
        title: "The master password",
        scenario: "A password manager asks you to create one master password.",
        question: "Why is this password important?",
        options: [
          {
            text: "It protects access to all the passwords stored inside.",
            tier: "best",
            feedback: "Your master password protects your digital keychain."
          },
          {
            text: "It should be strong and memorable.",
            tier: "safe",
            feedback:
              "For a manager that uses a master password, choose one that is long, unique, and hard to guess. Follow its recovery guidance too."
          },
          {
            text: "It should be the same password you already use everywhere else.",
            tier: "unsafe",
            feedback:
              "A reused master password could expose the passwords stored inside. Choose a unique one and protect recovery access."
          }
        ]
      },
      {
        type: "tiered",
        title: "Everyday use",
        scenario: "You're creating a new online account.",
        question: "Which response is the best?",
        options: [
          {
            text: "Let the password manager create and save a unique password.",
            tier: "best",
            feedback:
              "Password managers help make strong security habits much easier."
          },
          {
            text: "Save the new password in the password manager.",
            tier: "safe",
            feedback: "Check that the new password is saved for the correct account."
          },
          {
            text: "Reuse your old password because you'll remember it.",
            tier: "unsafe",
            feedback:
              "A manager can save a new password, so you do not need to reuse an old one."
          }
        ]
      },
      {
        type: "tiered",
        title: "Connect previous lessons",
        scenario: "You now have unique passwords for every important account.",
        question: "How can you realistically keep track of them?",
        options: [
          {
            text: "Store them securely in a password manager.",
            tier: "best",
            feedback:
              "You solved the biggest problem with unique passwords: remembering them."
          },
          {
            text: "Protect the master password or device passcode that unlocks them.",
            tier: "safe",
            feedback: "The unlock method and recovery options protect access to your saved passwords."
          },
          {
            text: "Change every password back to the same one.",
            tier: "unsafe",
            feedback: "Using one password again would expose several accounts if that password leaked."
          }
        ]
      },
      {
        type: "confidence",
        question: "How confident do you feel using a password manager?",
        practice: [
          {
            scenario: "You create a new online account.",
            question: "Which response is the best?",
            options: [
              {
                text: "Save the password in your password manager.",
                tier: "best",
                feedback: "Check that it is saved for the correct site so you can find it later."
              },
              {
                text: "Let it generate a strong password if available.",
                tier: "safe",
                feedback: "A long, randomly generated password helps avoid predictable personal details. Save it before you need it again."
              },
              {
                text: "Reuse an old password.",
                tier: "unsafe",
                feedback: "Generate and save a unique password instead of reusing one."
              }
            ]
          },
          {
            scenario: "Someone asks, \"Why not just memorize everything?\"",
            question: "Which response is the best?",
            options: [
              {
                text: "A password manager helps you safely use different passwords without memorizing them all.",
                tier: "best",
                feedback: "The manager stores different passwords so you can find and use them when needed."
              },
              {
                text: "It reduces the temptation to reuse passwords.",
                tier: "safe",
                feedback: "Which is the real security benefit."
              },
              {
                text: "Everyone can easily remember dozens of strong passwords.",
                tier: "unsafe",
                feedback:
                  "Remembering many strong passwords can be difficult. A manager helps you use unique ones without memorizing them all."
              }
            ]
          }
        ]
      },
      {
        type: "memory",
        links: [
          {
            lesson: "Lesson 5.3 — Don't Make It Easy to Guess",
            note: "Password managers help you create passwords that are difficult to guess."
          },
          {
            lesson: "Lesson 5.4 — One Password Isn't Enough",
            note: "They make it practical to have a different password for every important account."
          }
        ]
      },
      {
        type: "finalboss",
        title: "Setting up a new account",
        setup:
          "You're creating an account for a new online service. The website asks you to create a password. You remember that weak passwords are easy to guess, reusing passwords is risky, and it's hard to remember dozens of unique ones.",
        question: "What should you do?",
        options: [
          {
            text: "Create a new, unique password and save it in your password manager.",
            tier: "best",
            feedback:
              "This brought together everything you've learned about passwords: one that's hard to guess, used for only one account, and safely stored for later."
          },
          {
            text: "Use a strong password that isn't based on personal information.",
            tier: "safe",
            feedback: "Use a long, random password, keep it unique, and save it securely."
          },
          {
            text: "Reuse your email password because you'll remember it.",
            tier: "unsafe",
            feedback:
              "Protect your email with a unique password. It often receives password-reset links for other accounts."
          }
        ],
        spotted: []
      }
    ],
    quiz: [],
    complete: {
      title: "Lesson complete!",
      subtitle: "You completed Your Digital Keychain.",
      habit: "Let your password manager remember your passwords — so you don't have to.",
      warningSign: "Reusing a password because it's easier to recall.",
      skills: [
        "Learned what a password manager is",
        "Protected access to saved passwords",
        "Built a practical password system"
      ],
      next: "A Second Lock on Your Account"
    }
  },

  // ============================================================
  // LESSON 5.6
  // ============================================================
  {
    id: "scam-two-step",
    track: "scam",
    phase: 12,
    order: 6,
    lessonNumber: "5.6",
    title: "A Second Lock on Your Account",
    pathTitle: "Two-Step Codes",
    badge: "Double Locked",
    xp: 20,
    goals: [
      "Understand how two-step verification protects you.",
      "Never share a verification code with anyone."
    ],
    blocks: [
      {
        type: "reading",
        heading: "A Second Lock on Your Account",
        question: "Why do some accounts ask for a code after I enter my password?",
        objective:
          "Learn how two-step verification adds another layer of protection to your accounts.",
        warningSigns: PRIVACY_HABITS,
        reminderTitle: "Review privacy habits",
        text: "Two-step verification adds another check when you sign in. Depending on the service, you may use a code, an authenticator app, a security key, or an approval on a trusted device. This makes a stolen password less useful on its own.\n\nOnly enter a sign-in code in the official app or site for an action you started. Do not share it with a caller or approve an unexpected sign-in. Keep recovery details current so you can regain access if you lose your device."
      },
      {
        type: "tiered",
        title: "Why two locks?",
        scenario:
          "You opened your email provider’s official sign-in page. After your password, it asks for a six-digit code sent to your phone.",
        question: "Why is the website asking for the code?",
        options: [
          {
            text: "To make sure it's really you.",
            tier: "best",
            feedback:
              "The extra code helps protect your account, even if someone learns your password."
          },
          {
            text: "To add another layer of security.",
            tier: "safe",
            feedback: "The second step adds protection beyond your password."
          },
          {
            text: "Because your password stopped working.",
            tier: "unsafe",
            feedback:
              "Your password worked fine — this is the second step, not a problem."
          }
        ]
      },
      {
        type: "tiered",
        title: "The secret code",
        scenario:
          "You receive a text message with a verification code. Seconds later someone calls saying, \"I'm from customer support. Please read me that code.\"",
        question: "Which response is the best?",
        options: [
          {
            text: "Never share the verification code.",
            tier: "best",
            feedback:
              "Keep sign-in and password-reset codes private. Do not read them to an unexpected caller, even someone claiming to be support."
          },
          {
            text: "End the call if you didn't request help.",
            tier: "safe",
            feedback: "Hanging up ends it immediately."
          },
          {
            text: "Read them the code because they already know your name.",
            tier: "unsafe",
            feedback:
              "Sharing the code could let someone complete a sign-in or reset. Its arrival does not prove who requested it."
          }
        ]
      },
      {
        type: "tiered",
        title: "Recognizing a warning sign",
        scenario: "You receive a verification code even though you weren't trying to log in.",
        question: "What should you do?",
        options: [
          {
            text: "Don't share the code and check whether someone may be trying to access your account.",
            tier: "best",
            feedback:
              "An unexpected code can have several causes, including an attempted sign-in. Do not share it; check account activity through the official service."
          },
          {
            text: "Open the official service yourself and review its security settings.",
            tier: "safe",
            feedback: "If you find unfamiliar activity or a compromised password, secure the account and update its recovery details."
          },
          {
            text: "Send the code to anyone who asks for it.",
            tier: "unsafe",
            feedback: "The code may give another person access. Keep it private and check through a trusted route."
          }
        ]
      },
      {
        type: "tiered",
        title: "Putting it together",
        scenario:
          "Someone somehow learns your password. Your account uses two-step verification.",
        question: "Why is your account still better protected?",
        options: [
          {
            text: "They would also need your verification code or trusted device.",
            tier: "best",
            feedback:
              "Two-step verification doesn't replace your password — it strengthens it."
          },
          {
            text: "The second step makes it much harder to sign in.",
            tier: "safe",
            feedback: "The extra check makes unauthorized access harder, but you still need to verify requests."
          },
          {
            text: "Your password no longer matters.",
            tier: "unsafe",
            feedback:
              "It still matters. The second lock is an addition, not a replacement."
          }
        ]
      },
      {
        type: "confidence",
        question: "How confident do you feel using two-step verification?",
        practice: [
          {
            scenario: "Your bank offers two-step verification.",
            question: "Which response is the best?",
            options: [
              {
                text: "Turn it on if it's available.",
                tier: "best",
                feedback: "It's one of the most effective protections available."
              },
              {
                text: "Learn how it works before using it.",
                tier: "safe",
                feedback: "Learn how sign-in and recovery work, then enable the protection through the official account settings."
              },
              {
                text: "Ignore it because passwords are enough.",
                tier: "unsafe",
                feedback: "Passwords alone can be stolen. The second lock helps."
              }
            ]
          },
          {
            scenario:
              "A friend asks, \"Can you text me the verification code you just received?\"",
            question: "Which response is the best?",
            options: [
              {
                text: "No. Verification codes should never be shared.",
                tier: "best",
                feedback: "Not with anyone — including people you know."
              },
              {
                text: "Contact your friend through a trusted route without sending the code.",
                tier: "safe",
                feedback:
                  "Their account may be compromised. Verify the message separately and keep the sign-in code private."
              },
              {
                text: "Send the code because they're your friend.",
                tier: "unsafe",
                feedback:
                  "A real friend has no use for your code. Someone using their account does."
              }
            ]
          }
        ]
      },
      {
        type: "memory",
        links: [
          {
            lesson: "Lesson 5.2 — Your Password Is Your House Key",
            note: "Two-step verification adds a second lock after your password."
          },
          {
            lesson: "Lesson 5.5 — Your Digital Keychain",
            note: "Even with a password manager, two-step gives important accounts more protection."
          }
        ]
      },
      {
        type: "finalboss",
        title: "\"I just need the code\"",
        setup:
          "You receive a text message with a six-digit verification code. Immediately afterward, your phone rings. The caller sounds calm and already knows your name.",
        messages: [
          {
            from: "Text · Automated",
            body: "Your verification code is 481 293. Do not share this code with anyone."
          },
          {
            from: "Example call transcript · \"Support\"",
            body:
              "Don't worry. Our system accidentally sent you a code. Could you please read it to me so I can cancel it?"
          }
        ],
        question: "What should you do?",
        options: [
          {
            text: "Do not share the code. End the call. If you're concerned, contact the company using its official phone number or website.",
            tier: "best",
            feedback:
              "The code was protecting your account. By refusing to share it, you kept the second lock exactly where it belongs."
          },
          {
            text: "Remember that verification codes are only meant for you.",
            tier: "safe",
            feedback: "The message says not to share it. Only use it for an action you started on the official service."
          },
          {
            text: "Read the code because they sounded professional.",
            tier: "unsafe",
            feedback:
              "The code may be for a sign-in or account reset; the timing alone does not prove the caller’s story. Keep it private and check through the official service."
          }
        ],
        spotted: [
          "Unexpected contact",
          "A request for a verification code",
          "Suspicious timing"
        ]
      }
    ],
    quiz: [],
    complete: {
      title: "Lesson complete!",
      subtitle: "You completed A Second Lock on Your Account.",
      habit: "Verification codes are for you — and only you.",
      warningSign: "Anyone asking you to read out a code.",
      skills: [
        "Understood two-step verification",
        "Protected a verification code",
        "Recognized suspicious timing"
      ],
      next: "If Something Goes Wrong"
    }
  },

  // ============================================================
  // LESSON 5.7
  // ============================================================
  {
    id: "scam-if-something-goes-wrong",
    track: "scam",
    phase: 12,
    order: 7,
    lessonNumber: "5.7",
    title: "If Something Goes Wrong",
    pathTitle: "If It Goes Wrong",
    badge: "Calm Responder",
    xp: 20,
    goals: [
      "Know the first steps after a mistake or a compromised account.",
      "Act quickly without panicking."
    ],
    blocks: [
      {
        type: "reading",
        heading: "If Something Goes Wrong",
        question: "What should I do if I think I've made a mistake?",
        objective:
          "Learn what to do if you think one of your accounts has been compromised or you've shared information by mistake.",
        warningSigns: PRIVACY_HABITS,
        reminderTitle: "Review privacy habits",
        text: "Mistakes and account break-ins can happen. If you shared a password, open the official service yourself on a device you trust and change it promptly. If you cannot sign in, use the provider’s official recovery steps. If money is at risk, contact your bank through a trusted number right away.\n\nReplace the password anywhere you reused it. Sign out other sessions, review recovery details and unfamiliar activity, and enable two-step verification if available. Your provider can guide you through these steps; you do not need to handle it alone."
      },
      {
        type: "tiered",
        title: "First things first",
        scenario: "You accidentally entered your password on a fake website.",
        question: "What should you do first?",
        options: [
          {
            text: "Open the official service on a trusted device and change the password promptly.",
            tier: "best",
            feedback: "If you cannot sign in, use the provider’s official recovery process. Change the same password anywhere else you used it."
          },
          {
            text: "Stop using that password on any other accounts.",
            tier: "safe",
            feedback: "Important too — anywhere it was reused is now at risk."
          },
          {
            text: "Wait a few weeks to see what happens.",
            tier: "unsafe",
            feedback:
              "Waiting gives whoever has it time to use it."
          }
        ]
      },
      {
        type: "tiered",
        title: "Staying calm",
        scenario: "You realize you clicked a suspicious email link.",
        question: "Which response is the best?",
        options: [
          {
            text: "Close the suspicious page. Do not enter information or open downloads; check what happened.",
            tier: "best",
            feedback: "If you entered a password, change it through the official service. If something downloaded or installed, get help checking the device."
          },
          {
            text: "Contact the organization directly if needed.",
            tier: "safe",
            feedback: "Using contact details you look up yourself."
          },
          {
            text: "Panic because nothing can be done.",
            tier: "unsafe",
            feedback:
              "There are steps you can take. Clicking alone does not confirm harm; the right response depends on what you entered, downloaded, or installed."
          }
        ]
      },
      {
        type: "tiered",
        title: "Contacting the right people",
        scenario: "You think someone may have accessed your bank account.",
        question: "Which response is the best?",
        options: [
          {
            text: "Call your bank using the phone number on your bank card or official website.",
            tier: "best",
            feedback:
              "Always contact important organizations yourself using trusted contact information."
          },
          {
            text: "Follow the bank's instructions after contacting them.",
            tier: "safe",
            feedback: "Once you've reached the real bank, they'll guide you."
          },
          {
            text: "Reply to the suspicious message for help.",
            tier: "unsafe",
            feedback:
              "That reaches the people who caused the problem."
          }
        ]
      },
      {
        type: "tiered",
        title: "Bringing it all together",
        scenario:
          "You accidentally shared your password with someone pretending to be customer support.",
        question: "Which response is safe?",
        options: [
          {
            text: "Open the official service, change the password, sign out other sessions, and review account activity.",
            tier: "best",
            feedback:
              "Act promptly through a trusted route. Check recovery settings and replace the password wherever it was reused."
          },
          {
            text: "Contact the company through its official website or phone number if needed.",
            tier: "safe",
            feedback: "If you cannot sign in, follow the provider’s official recovery instructions."
          },
          {
            text: "Assume everything is fine because they sounded trustworthy.",
            tier: "unsafe",
            feedback:
              "A convincing voice does not verify the caller. Secure the account through the official service now."
          }
        ]
      },
      {
        type: "confidence",
        question:
          "How confident do you feel responding if one of your accounts is at risk?",
        practice: [
          {
            scenario: "You open a service’s official security settings and see a warning that your password may have been exposed.",
            question: "Which response is the best?",
            options: [
              {
                text: "Change your password immediately.",
                tier: "best",
                feedback: "Change it through the official service and check for unfamiliar activity."
              },
              {
                text: "Change it anywhere else you reused it.",
                tier: "safe",
                feedback: "The essential follow-up."
              },
              {
                text: "Ignore the message.",
                tier: "unsafe",
                feedback: "Breach notices are worth acting on."
              }
            ]
          },
          {
            scenario: "You see a login notification from a city you do not recognize.",
            question: "Which response is the best?",
            options: [
              {
                text: "Secure your account and change your password if you don't recognize the login.",
                tier: "best",
                feedback: "Locations can be approximate. Check the device, time, and account activity through the official service; secure it if the sign-in was not yours."
              },
              {
                text: "Review recent account activity.",
                tier: "safe",
                feedback: "Activity records can help, but may not show everything. Follow the provider’s security guidance if you remain unsure."
              },
              {
                text: "Assume it's a computer error.",
                tier: "unsafe",
                feedback: "It could be an inaccurate location, but check the device and activity before dismissing it."
              }
            ]
          }
        ]
      },
      {
        type: "memory",
        links: [
          {
            lesson: "Lesson 1.1 — The Pause Button",
            note: "Even after a mistake, slowing down helps you make good decisions."
          },
          {
            lesson: "Lesson 5.6 — A Second Lock on Your Account",
            note: "Two-step verification can protect your account even if your password is exposed."
          }
        ]
      },
      {
        type: "finalboss",
        title: "\"Something doesn't look right\"",
        setup:
          "One morning, you receive an email saying your email account was accessed from a device you don't recognize. You weren't traveling, and you don't recognize the location.",
        messages: [
          {
            from: "Email · Your email provider",
            body:
              "New sign-in detected: Windows device, location approximately 400 miles from your usual sign-in area. If this wasn't you, secure your account."
          }
        ],
        question: "What should you do?",
        options: [
          {
            text: "Open the official service yourself, review the sign-in, and secure the account if it was not yours. Use official recovery if you cannot sign in.",
            tier: "best",
            feedback:
              "Check the device and activity through the official service. For unauthorized access, change the password, sign out other sessions, and check recovery details."
          },
          {
            text: "Check that your recovery phone number and email address are still correct.",
            tier: "safe",
            feedback:
              "Make sure recovery details still belong to you. Remove unfamiliar ones using the provider’s security guidance."
          },
          {
            text: "Ignore the message because it might go away on its own.",
            tier: "unsafe",
            feedback:
              "An alert is worth checking through the official app or known website. Do not use a suspicious link or assume the location alone proves a break-in."
          }
        ],
        spotted: ["Unfamiliar account access", "A situation needing quick action"]
      }
    ],
    quiz: [],
    complete: {
      title: "Lesson complete!",
      subtitle: "You completed If Something Goes Wrong.",
      habit: "If something doesn't look right, stay calm and act quickly.",
      warningSign: "Account activity you don't recognize.",
      skills: [
        "Responded calmly to a security concern",
        "Secured a compromised account",
        "Contacted organizations safely"
      ],
      learned: [
        "Ask why anyone needs your information.",
        "Your password is your house key — keep it private.",
        "Make passwords hard to guess, and use a different one for each account.",
        "A password manager makes that practical.",
        "Two-step verification adds a second lock.",
        "Mistakes happen. Responding quickly is what protects you."
      ],
      next: "Phase 13: Smart Communication"
    }
  }
];

export default scamPhase5Lessons;

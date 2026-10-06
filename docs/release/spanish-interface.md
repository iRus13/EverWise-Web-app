# Spanish interface — 28 September 2026

This change applies to the redesigned React web app and its Capacitor iOS wrapper (`com.everwise.app`). It does not modify or publish the separate Swift App Store app (`com.everwise.digitalliteracy`).

English and Español are selectable from Welcome, Log In and Settings. The choice persists on the device and updates the document language. Display labels are translated without changing stored onboarding answers, account identifiers, subscription identifiers or StoreKit prices.

Coverage includes welcome, core onboarding questions and choices, Home, primary navigation, account forms, Settings, core Scam Checker controls and subscription plan descriptions. Untranslated strings fall back to English. Course lesson/assessment content, AI-generated results, legal documents, and some uncommon operational messages remain English. The language control discloses the course/AI limitation. This is an interface localization, not a fully translated curriculum.

Validation: existing 1,954 UI tests passed; four localization tests passed. One later navigation test timed out while a new iPad simulator was booting, then the complete 13-test navigation file passed in isolation. Production web build and unsigned simulator Xcode build succeeded. Inspected Spanish welcome, onboarding choices, Home, Settings and paywall in the browser. Installed and launched the wrapper on iPad Pro 11-inch (M5), and inspected its native-rendered welcome layout. Targeted device family is iPhone and iPad. This does not establish iPad availability for the existing App Store release.

No App Store submission, production deployment or paid purchase was performed.

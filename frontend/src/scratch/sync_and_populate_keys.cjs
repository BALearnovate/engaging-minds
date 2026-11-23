const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..');
const localesDir = path.join(srcDir, 'i18n', 'locales');

const enPath = path.join(localesDir, 'en.json');
const daPath = path.join(localesDir, 'da.json');
const fiPath = path.join(localesDir, 'fi.json');
const svPath = path.join(localesDir, 'sv.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const da = JSON.parse(fs.readFileSync(daPath, 'utf8'));
const fi = JSON.parse(fs.readFileSync(fiPath, 'utf8'));
const sv = JSON.parse(fs.readFileSync(svPath, 'utf8'));

// Helper to set nested key
function setNested(obj, keyPath, val) {
  const parts = keyPath.split('.');
  let curr = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!curr[p] || typeof curr[p] !== 'object') {
      curr[p] = {};
    }
    curr = curr[p];
  }
  curr[parts[parts.length - 1]] = val;
}

function getNested(obj, keyPath) {
  const parts = keyPath.split('.');
  let curr = obj;
  for (const p of parts) {
    if (curr && typeof curr === 'object' && p in curr) {
      curr = curr[p];
    } else {
      return undefined;
    }
  }
  return typeof curr === 'string' ? curr : undefined;
}

// Map of translations for keys
const translations = {
  // topbar
  'topbar.erasmus': { en: '🇪🇺 Erasmus+', da: '🇪🇺 Erasmus+', fi: '🇪🇺 Erasmus+', sv: '🇪🇺 Erasmus+' },
  'topbar.platformTitle': { en: 'Engaging Minds Platform', da: 'Engaging Minds-platform', fi: 'Engaging Minds Platform -alusta', sv: 'Engaging Minds Platform-plattform' },

  // subjects
  'subjects.science': { en: 'Science', da: 'Naturfag', fi: 'Tiede', sv: 'Naturvetenskap' },
  'subjects.mathematics': { en: 'Mathematics', da: 'Matematik', fi: 'Matematiikka', sv: 'Matematik' },
  'subjects.english': { en: 'English', da: 'Engelsk', fi: 'Englanti', sv: 'Engelska' },
  'subjects.history': { en: 'History', da: 'Historie', fi: 'Historia', sv: 'Historia' },
  'subjects.computerScience': { en: 'Computer Science', da: 'Datalogi', fi: 'Tietojenkäsittelytiede', sv: 'Datalogi' },
  'subjects.geography': { en: 'Geography', da: 'Geografi', fi: 'Maantieto', sv: 'Geografi' },
  'subjects.french': { en: 'French', da: 'Fransk', fi: 'Ranska', sv: 'Franska' },
  'subjects.spanish': { en: 'Spanish', da: 'Spansk', fi: 'Espanja', sv: 'Spanska' },
  'subjects.arts': { en: 'Arts', da: 'Billedkunst', fi: 'Kuvataide', sv: 'Bildkonst' },
  'subjects.designTechnology': { en: 'Design Technology', da: 'Design & Teknologi', fi: 'Käsityö ja muotoilu', sv: 'Design & Teknik' },

  // years
  'years.year1': { en: 'Year 1', da: '1. Årgang', fi: '1. Vuosiluokka', sv: 'Årskurs 1' },
  'years.year2': { en: 'Year 2', da: '2. Årgang', fi: '2. Vuosiluokka', sv: 'Årskurs 2' },
  'years.year3': { en: 'Year 3', da: '3. Årgang', fi: '3. Vuosiluokka', sv: 'Årskurs 3' },
  'years.year4': { en: 'Year 4', da: '4. Årgang', fi: '4. Vuosiluokka', sv: 'Årskurs 4' },
  'years.year5': { en: 'Year 5', da: '5. Årgang', fi: '5. Vuosiluokka', sv: 'Årskurs 5' },
  'years.year6': { en: 'Year 6', da: '6. Årgang', fi: '6. Vuosiluokka', sv: 'Årskurs 6' },
  'years.year7': { en: 'Year 7', da: '7. Årgang', fi: '7. Vuosiluokka', sv: 'Årskurs 7' },
  'years.year8': { en: 'Year 8', da: '8. Årgang', fi: '8. Vuosiluokka', sv: 'Årskurs 8' },
  'years.year9': { en: 'Year 9', da: '9. Årgang', fi: '9. Vuosiluokka', sv: 'Årskurs 9' },
  'years.year10': { en: 'Year 10', da: '10. Årgang', fi: '10. Vuosiluokka', sv: 'Årskurs 10' },
  'years.year11': { en: 'Year 11', da: '11. Årgang', fi: '11. Vuosiluokka', sv: 'Årskurs 11' },

  // activityTypes
  'activityTypes.multipleChoice': { en: 'Multiple Choice', da: 'Multiple Choice', fi: 'Monivalinta', sv: 'Flerval' },
  'activityTypes.fillInBlanks': { en: 'Fill in the Blanks', da: 'Udfyld hullerne', fi: 'Täytä aukot', sv: 'Fyll i luckorna' },
  'activityTypes.flashcards': { en: 'Flashcards', da: 'Flashcards / Vendekort', fi: 'Muistikortit', sv: 'Flashcards' },
  'activityTypes.trueFalse': { en: 'True / False', da: 'Sandt / Falsk', fi: 'Oikein / Väärin', sv: 'Sant / Falskt' },
  'activityTypes.sequenceOrdering': { en: 'Sequence Ordering', da: 'Rækkefølge', fi: 'Järjestäminen', sv: 'Sekvensordning' },
  'activityTypes.dragAndDrop': { en: 'Drag & Drop', da: 'Træk & Slip', fi: 'Raahaa ja pudota', sv: 'Dra och släpp' },
  'activityTypes.findHotspots': { en: 'Find Multiple Hotspots', da: 'Find Hotspots', fi: 'Etsi hotspotit', sv: 'Hitta hotspots' },
  'activityTypes.clockDiagram': { en: '24-Hour Clock Diagram', da: '24-Timers Urdiagram', fi: '24-tunnin kellokaavio', sv: '24-timmars klockdiagram' },
  'activityTypes.openResponse': { en: 'Open Response / Reflection', da: 'Åbent svar / Refleksion', fi: 'Avoin vastaus / Pohdinta', sv: 'Öppet svar / Reflektion' },

  // nav
  'nav.studentDashboardAndProgress': { en: 'My Dashboard', da: 'Mit Kontrolpanel', fi: 'Oma Näkymä', sv: 'Min Panel' },
  'nav.liveActivity': { en: 'Live Activity', da: 'Live Aktivitet', fi: 'Live-aktiviteetti', sv: 'Live-aktivitet' },

  // register
  'register.invalidJoinCodeError': { en: 'That code doesn’t seem right. Please try again or check with your teacher!', da: 'Koden ser ikke ud til at være rigtig. Prøv venligst igen eller spørg din lærer!', fi: 'Koodi ei vaikuta oikealta. Yritä uudelleen tai tarkista opettajaltasi!', sv: 'Koden verkar inte stämma. Försök igen eller fråga din lärare!' },
  'register.enterJoinCodeError': { en: 'Please enter a valid join code!', da: 'Indtast venligst en gyldig tilmeldingskode!', fi: 'Syötä voimassa oleva liittymiskoodi!', sv: 'Ange en giltig anslutningskod!' },
  'register.pinLengthError': { en: 'Please enter a 4-digit PIN', da: 'Indtast venligst en 4-cifret PIN-kode', fi: 'Syötä 4-numeroinen PIN-koodi', sv: 'Ange en 4-siffrig PIN-kod' },
  'register.improvingRetentionText': { en: 'Improving Student Retention through Best Practices. A two-year Erasmus+ collaboration developing evidence-based strategies to help students stay motivated, engaged, and connected to their learning journey.', da: 'Forbedring af fastholdelse af elever gennem bedste praksis. Et toårigt Erasmus+-samarbejde, der udvikler evidensbaserede strategier til at hjælpe eleverne med at forblive motiverede, engagerede og forbundne til deres læringsrejse.', fi: 'Opiskelijoiden sitoutumisen ja pysyvyyden parantaminen parhaiden käytäntöjen avulla. Kaksivuotinen Erasmus+-yhteistyöhanke, jossa kehitetään näyttöön perustuvia strategioita oppilaiden motivaation, sitoutumisen ja oppimispolun tukemiseksi.', sv: 'Förbättrad studentretention genom bästa praxis. Ett tvåårigt Erasmus+-samarbete som utvecklar evidensbaserade strategier för att hjälpa elever att hålla sig motiverade, engagerade och anslutna till sin läranderesa.' },
  'register.verifyEmailTitle': { en: 'Verify your email address', da: 'Bekræft din e-mailadresse', fi: 'Vahvista sähköpostiosoitteesi', sv: 'Bekräfta din e-postadress' },
  'register.verifyEmailSubtitle': { en: 'We sent a 6-digit verification code to', da: 'Vi har sendt en 6-cifret bekræftelseskode til', fi: 'Olemme lähettäneet 6-numeroisen vahvistuskoodin osoitteeseen', sv: 'Vi har skickat en 6-siffrig verifieringskod till' },
  'register.enterOtpCode': { en: 'Enter 6-digit verification code', da: 'Indtast 6-cifret bekræftelseskode', fi: 'Syötä 6-numeroinen vahvistuskoodi', sv: 'Ange 6-siffrig verifieringskod' },
  'register.resendCodeIn': { en: 'Resend code in {{seconds}}s', da: 'Genindsend kode om {{seconds}}s', fi: 'Lähetä koodi uudelleen {{seconds}}s kuluttua', sv: 'Skicka kod igen om {{seconds}}s' },
  'register.resendCode': { en: 'Resend Code', da: 'Genindsend kode', fi: 'Lähetä koodi uudelleen', sv: 'Skicka kod igen' },
  'register.backToRegistration': { en: '← Back to registration', da: '← Tilbage til registrering', fi: '← Takaisin rekisteröitymiseen', sv: '← Tillbaka till registreringen' },
  'register.verifying': { en: 'Verifying...', da: 'Bekræfter...', fi: 'Vahvistetaan...', sv: 'Verifierar...' },
  'register.continue': { en: 'Continue', da: 'Fortsæt', fi: 'Jatka', sv: 'Fortsätt' },
  'register.incorrectCode': { en: 'Please enter correct code', da: 'Indtast venligst korrekt kode', fi: 'Syötä oikea koodi', sv: 'Ange korrekt kod' },
  'register.nameRequired': { en: 'First name and last name are required', da: 'Fornavn og efternavn er påkrævet', fi: 'Etunimi ja sukunimi vaaditaan', sv: 'Förnamn och efternamn krävs' },
  'register.schoolRequired': { en: 'School / Organization is required', da: 'Skole / Organisation er påkrævet', fi: 'Koulu / Organisaatio vaaditaan', sv: 'Skola / Organisation krävs' },
  'register.passwordMismatch': { en: 'Passwords do not match', da: 'Adgangskoderne matcher ikke', fi: 'Salasanat eivät täsmää', sv: 'Lösenorden matchar inte' },
  'register.passwordTooShort': { en: 'Password must be at least 6 characters', da: 'Adgangskoden skal være på mindst 6 tegn', fi: 'Salasanan on oltava vähintään 6 merkkiä', sv: 'Lösenordet måste vara minst 6 tecken' },

  // login
  'login.pinLengthError': { en: 'Please enter a 4-digit PIN', da: 'Indtast venligst en 4-cifret PIN-kode', fi: 'Syötä 4-numeroinen PIN-koodi', sv: 'Ange en 4-siffrig PIN-kod' },
  'login.invalidCodeOrPinError': { en: 'That code or PIN doesn’t seem right. Please try again or check with your teacher!', da: 'Koden eller PIN-koden ser ikke ud til at være rigtig. Prøv venligst igen eller spørg din lærer!', fi: 'Koodi tai PIN ei vaikuta oikealta. Yritä uudelleen tai tarkista opettajaltasi!', sv: 'Koden eller PIN-koden verkar inte stämma. Försök igen eller fråga din lärare!' },
  'login.enterStudentIdError': { en: 'Please enter your Student ID or Class Code!', da: 'Indtast venligst dit elev-ID eller klassekode!', fi: 'Syötä oppilastunnuksesi tai luokkakoodisi!', sv: 'Ange ditt elev-ID eller klasskod!' },
  'login.enterPinError': { en: 'Please enter your 4-digit PIN!', da: 'Indtast venligst din 4-cifrede PIN-kode!', fi: 'Syötä 4-numeroinen PIN-koodisi!', sv: 'Ange din 4-siffriga PIN-kod!' },
  'login.forgotPasswordTitle': { en: 'Reset Your Password', da: 'Nulstil din adgangskode', fi: 'Nollaa salasanasi', sv: 'Återställ ditt lösenord' },
  'login.resetPasswordTitle': { en: 'Set New Password', da: 'Vælg ny adgangskode', fi: 'Aseta uusi salasana', sv: 'Välj nytt lösenord' },
  'login.forgotPasswordSub': { en: 'Enter your registered educator email address to receive a 6-digit verification code.', da: 'Indtast din registrerede underviser-e-mail for at modtage en 6-cifret bekræftelseskode.', fi: 'Syötä rekisteröity opettajasähköpostisi saadaksesi 6-numeroisen vahvistuskoodin.', sv: 'Ange din registrerade e-postadress för att få en 6-siffrig verifieringskod.' },
  'login.forgotPasswordStep2Sub': { en: 'Enter the 6-digit code sent to your email and set your new password.', da: 'Indtast den 6-cifrede kode sendt til din e-mail og vælg din nye adgangskode.', fi: 'Syötä sähköpostiisi lähetetty 6-numeroinen koodi ja aseta uusi salasana.', sv: 'Ange den 6-siffriga koden som skickats till din e-post och välj ett nytt lösenord.' },
  'login.sendCode': { en: 'SEND RESET CODE →', da: 'SEND NULSTILLINGSKODE →', fi: 'LÄHETÄ NOLLAUSKOODI →', sv: 'SKICKA ÅTERSTÄLLNINGSKOD →' },
  'login.sendingCode': { en: 'SENDING CODE...', da: 'SENDER KODE...', fi: 'LÄHETETÄÄN KOODIA...', sv: 'SKICKAR KOD...' },
  'login.resetCodeLabel': { en: 'VERIFICATION CODE (6 DIGITS):', da: 'BEKRÆFTELSESKODE (6 CIFRE):', fi: 'VAHVISTUSKOODI (6 NUMEROA):', sv: 'VERIFIERINGSKOD (6 SIFFROR):' },
  'login.newPasswordLabel': { en: 'New Password:', da: 'Ny adgangskode:', fi: 'Uusi salasana:', sv: 'Nytt lösenord:' },
  'login.newPasswordPlaceholder': { en: 'Enter new password', da: 'Indtast ny adgangskode', fi: 'Syötä uusi salasana', sv: 'Ange nytt lösenord' },
  'login.resendIn': { en: 'Resend code in {{seconds}}s', da: 'Genindsend kode om {{seconds}}s', fi: 'Lähetä koodi uudelleen {{seconds}}s kuluttua', sv: 'Skicka kod igen om {{seconds}}s' },
  'login.resendCode': { en: 'Resend Code', da: 'Genindsend kode', fi: 'Lähetä koodi uudelleen', sv: 'Skicka kod igen' },
  'login.resettingPassword': { en: 'RESETTING PASSWORD...', da: 'NULSTILLER ADGANGSKODE...', fi: 'NOLLATAAN SALASANAA...', sv: 'ÅTERSTÄLLER LÖSENORD...' },
  'login.resetPasswordButton': { en: 'RESET PASSWORD', da: 'NULSTIL ADGANGSKODE', fi: 'NOLLAA SALASANA', sv: 'ÅTERSTÄLL LÖSENORD' },
  'login.backToLogin': { en: '← Back to login', da: '← Tilbage til login', fi: '← Takaisin kirjautumiseen', sv: '← Tillbaka till inloggning' },
  'login.codeSentNotice': { en: 'A 6-digit verification code has been sent to {{email}}.', da: 'En 6-cifret bekræftelseskode er blevet sendt til {{email}}.', fi: '6-numeroinen vahvistuskoodi on lähetetty osoitteeseen {{email}}.', sv: 'En 6-siffrig verifieringskod har skickats till {{email}}.' },
  'login.emailRequired': { en: 'Email is required', da: 'E-mail er påkrævet', fi: 'Sähköposti vaaditaan', sv: 'E-post krävs' },
  'login.invalidCodeError': { en: 'Please enter the 6-digit code', da: 'Indtast venligst den 6-cifrede kode', fi: 'Syötä 6-numeroinen koodi', sv: 'Ange den 6-siffriga koden' },
  'login.passwordResetSuccess': { en: 'Your password has been reset successfully! You can now sign in with your new password.', da: 'Din adgangskode er blevet nulstillet! Du kan nu logge ind med din nye adgangskode.', fi: 'Salasanasi on nollattu onnistuneesti! Voit nyt kirjautua sisään uudella salasanallasi.', sv: 'Ditt lösenord har återställts! Du kan nu logga in med ditt nya lösenord.' },
  'login.clear': { en: 'CLEAR', da: 'RYD', fi: 'TYHJENNÄ', sv: 'RENSA' },
  'login.studentIdRequired': { en: 'Please enter your Student ID or Code', da: 'Indtast venligst dit elev-ID eller kode', fi: 'Syötä oppilastunnuksesi tai koodisi', sv: 'Ange ditt elev-ID eller kod' },
  'login.pin4DigitsRequired': { en: 'PIN must be exactly 4 numeric digits', da: 'PIN skal være nøjagtigt 4 cifre', fi: 'PIN-koodin on oltava täsmälleen 4 numeroa', sv: 'PIN-koden måste vara exakt 4 siffror' },
  'login.pinsDoNotMatch': { en: 'PINs do not match', da: 'PIN-koderne matcher ikke', fi: 'PIN-koodit eivät täsmää', sv: 'PIN-koderna matchar inte' },
  'login.pinResetSuccess': { en: '🎉 PIN reset successfully! Please sign in with your new 4-digit PIN.', da: '🎉 PIN-kode nulstillet! Log ind med din nye 4-cifrede PIN-kode.', fi: '🎉 PIN-koodi nollattu! Kirjaudu sisään uudella 4-numeroisella PIN-koodillasi.', sv: '🎉 PIN-koden har återställts! Logga in med din nya 4-siffriga PIN-kod.' },
  'login.forgotPinTag': { en: 'FORGOT STUDENT PIN', da: 'GLEMT ELEV-PIN', fi: 'UNOHDUTKO OPPILAAN PIN-KOODIN', sv: 'GLÖMT ELEV-PIN' },
  'login.resetStudentPinTitle': { en: 'Reset Your 4-Digit PIN', da: 'Nulstil din 4-cifrede PIN', fi: 'Nollaa 4-numeroinen PIN-koodisi', sv: 'Återställ din 4-siffriga PIN-kod' },
  'login.resetStudentPinSub': { en: 'Enter your Student ID and choose a new 4-digit PIN to update your account.', da: 'Indtast dit elev-ID og vælg en ny 4-cifret PIN for at opdatere din konto.', fi: 'Syötä oppilastunnuksesi ja valitse uusi 4-numeroinen PIN päivittääksesi tilisi.', sv: 'Ange ditt elev-ID och välj en ny 4-siffrig PIN för att uppdatera ditt konto.' },
  'login.studentIdModalLabel': { en: 'STUDENT ID / LOGIN CODE', da: 'ELEV-ID / LOGIN-KODE', fi: 'OPPILAATUNNUS / KIRJAUTUMISKOODI', sv: 'ELEV-ID / INLOGGNINGSKOD' },
  'login.studentIdModalPlaceholder': { en: 'e.g. STU123 or STU-ILSE', da: 'f.eks. ELEV123 eller ELEV-ILSE', fi: 'esim. OPP123 tai OPP-ILSE', sv: 't.ex. ELEV123 eller ELEV-ILSE' },
  'login.newPinModalLabel': { en: 'NEW 4-DIGIT PIN', da: 'NY 4-CIFRET PIN', fi: 'UUSI 4-NUMEROINEN PIN', sv: 'NY 4-SIFFRIG PIN' },
  'login.newPinModalPlaceholder': { en: 'Enter new 4-digit PIN', da: 'Indtast ny 4-cifret PIN', fi: 'Syötä uusi 4-numeroinen PIN', sv: 'Ange ny 4-siffrig PIN' },
  'login.confirmPinModalLabel': { en: 'CONFIRM NEW 4-DIGIT PIN', da: 'BEKRÆFT NY 4-CIFRET PIN', fi: 'VAHVISTA UUSI 4-NUMEROINEN PIN', sv: 'BEKRÄFTA NY 4-SIFFRIG PIN' },
  'login.confirmPinModalPlaceholder': { en: 'Re-enter new 4-digit PIN', da: 'Genindtast ny 4-cifret PIN', fi: 'Syötä uusi 4-numeroinen PIN uudelleen', sv: 'Ange ny 4-siffrig PIN igen' },
  'login.resettingPinBtn': { en: 'RESETTING PIN...', da: 'NULSTILLER PIN...', fi: 'NOLLATAAN PIN-KOODIA...', sv: 'ÅTERSTÄLLER PIN...' },
  'login.resetPinBtn': { en: 'RESET PIN →', da: 'NULSTIL PIN →', fi: 'NOLLAA PIN →', sv: 'ÅTERSTÄLL PIN →' },

  // classroomSetup
  'classroomSetup.yourclasses': { en: 'Your Classes', da: 'Dine Klasser', fi: 'Omat Luokkasi', sv: 'Dina Klasser' },
  'classroomSetup.uploadCsvBtn': { en: '📁 Upload CSV File', da: '📁 Upload CSV-fil', fi: '📁 Lataa CSV-tiedosto', sv: '📁 Ladda upp CSV-fil' },
  'classroomSetup.orPasteNotice': { en: 'or paste CSV rows directly into the text box below:', da: 'eller indsæt CSV-rækker direkte i tekstfeltet nedenfor:', fi: 'tai liitä CSV-rivejä suoraan alla olevaan tekstikenttään:', sv: 'eller klistra in CSV-rader direkt i textrutan nedan:' },
  'classroomSetup.noClassroomsFound': { en: 'No classrooms found.', da: 'Ingen klasser fundet.', fi: 'Luokkahuoneita ei löytynyt.', sv: 'Inga klassrum hittades.' },
  'classroomSetup.selectClassroomPlaceholder': { en: '-- Select Classroom --', da: '-- Vælg klasse --', fi: '-- Valitse luokkahuone --', sv: '-- Välj klassrum --' },

  // teacherHome
  'teacherHome.activitySessionFormat': { en: 'Activity "{{title}}" session - {{time}}', da: 'Aktivitet "{{title}}" session - {{time}}', fi: 'Aktiviteetti "{{title}}" -istunto - {{time}}', sv: 'Aktivitet "{{title}}" session - {{time}}' },
  'teacherHome.viewActivity': { en: 'View Activity', da: 'Vis aktivitet', fi: 'Näytä aktiviteetti', sv: 'Visa aktivitet' },
  'teacherHome.engagementScore': { en: '{{score}}% Engagement', da: '{{score}}% Engagement', fi: '{{score}}% Sitoutuminen', sv: '{{score}}% Engagemang' },

  // liveDashboard
  'liveDashboard.clickToViewHelp': { en: 'Click to view individual students needing help', da: 'Klik for at se elever, der har brug for hjælp', fi: 'Napsauta nähdäksesi apua tarvitsevat oppilaat', sv: 'Klicka för att se elever som behöver hjälp' },
  'liveDashboard.dismissHelpTip': { en: 'Student requested help. Click to resolve.', da: 'Eleven bad om hjælp. Klik for at løse.', fi: 'Oppilas pyysi apua. Napsauta kuitataksesi.', sv: 'Elev bad om hjälp. Klicka för att lösa.' },

  // common
  'common.expandSidebar': { en: 'Expand sidebar', da: 'Udvid sidepanel', fi: 'Laajenna sivupalkki', sv: 'Expandera sidofält' },
  'common.collapseSidebar': { en: 'Collapse sidebar', da: 'Fold sidepanel sammen', fi: 'Pienennä sivupalkki', sv: 'Dölj sidofält' },

  // studentPortal
  'studentPortal.welcomeStudent': { en: 'Welcome {{name}} !', da: 'Velkommen {{name}} !', fi: 'Tervetuloa {{name}} !', sv: 'Välkommen {{name}} !' },
  'studentPortal.academicXpPoints': { en: 'Your Total Points', da: 'Dine samlede point', fi: 'Pisteesi yhteensä', sv: 'Dina totala poäng' },
  'studentPortal.studyStreak': { en: '🔥 5-Day Study Streak', da: '🔥 5-Dages studiestribe', fi: '🔥 5 päivän opiskeluputki', sv: '🔥 5 dagars studie-streak' },
  'studentPortal.selectedActivityProgress': { en: 'SELECTED ACTIVITY PROGRESS', da: 'VALGT AKTIVITETSFREMGANG', fi: 'VALITUN AKTIVITEETIN EDISTYMINEN', sv: 'VALD AKTIVITETSFRAMSTEG' },
  'studentPortal.pctComplete': { en: '{{pct}}% Complete', da: '{{pct}}% Fuldført', fi: '{{pct}}% Valmis', sv: '{{pct}}% Slutförd' },
  'studentPortal.pctCompleted': { en: '{{pct}}% Completed', da: '{{pct}}% Fuldført', fi: '{{pct}}% Valmis', sv: '{{pct}}% Slutförd' },
  'studentPortal.activityCompletion': { en: 'Activity Completion', da: 'Aktivitetsfuldførelse', fi: 'Aktiviteetin suoritus', sv: 'Slutförande av aktivitet' },
  'studentPortal.activityLogsAndHistory': { en: 'Activity Logs & History', da: 'Aktivitetslogge & Historik', fi: 'Aktiviteettilokit ja historia', sv: 'Aktivitetsloggar & Historik' },
  'studentPortal.assignedActivities': { en: 'Assigned activities', da: 'Tildelte aktiviteter', fi: 'Määrätyt aktiviteetit', sv: 'Tilldelade aktiviteter' },
  'studentPortal.clickActivityToView': { en: '💡 Click any activity to view its progress on left', da: '💡 Klik på en aktivitet for at se dens fremgang til venstre', fi: '💡 Napsauta mitä tahansa aktiviteettia nähdäksesi sen edistymisen vasemmalla', sv: '💡 Klicka på en aktivitet för att se dess framsteg till vänster' },
  'studentPortal.refreshActivities': { en: '🔄 Refresh Activities', da: '🔄 Opdater aktiviteter', fi: '🔄 Päivitä aktiviteetit', sv: '🔄 Uppdatera aktiviteter' },
  'studentPortal.refreshing': { en: '🔄 Refreshing...', da: '🔄 Opdaterer...', fi: '🔄 Päivitetään...', sv: '🔄 Uppdaterar...' },
  'studentPortal.loadingActivities': { en: '⏳ Loading assigned activities from database...', da: '⏳ Indlæser tildelte aktiviteter...', fi: '⏳ Ladataan määrättyjä aktiviteetteja...', sv: '⏳ Laddar tilldelade aktiviteter...' },
  'studentPortal.noAssignedActivities': { en: 'No activities currently assigned to your classroom.', da: 'Ingen aktiviteter tildelt din klasse i øjeblikket.', fi: 'Luokallesi ei ole tällä hetkellä määrätty aktiviteetteja.', sv: 'Inga aktiviteter tilldelade din klass för närvarande.' },
  'studentPortal.selected': { en: 'Selected ✓', da: 'Valgt ✓', fi: 'Valittu ✓', sv: 'Vald ✓' },
  'studentPortal.select': { en: 'Select →', da: 'Vælg →', fi: 'Valitse →', sv: 'Välj →' },
  'studentPortal.needHelpWithTask': { en: 'Need help with a classroom task? Ask your AI Learning Assistant.', da: 'Brug for hjælp til en opgave? Spørg din AI-læringsassistent.', fi: 'Tarvitsetko apua tehtävässä? Kysy AI-oppimisapuriltasi.', sv: 'Behöver du hjälp med en uppgift? Fråga din AI-lärassistent.' },
  'studentPortal.askAiAssistant': { en: '🤖 ASK AI ASSISTANT', da: '🤖 SPØRG AI-ASSISTENT', fi: '🤖 KYSY AI-APURILTA', sv: '🤖 FRÅGA AI-ASSISTENT' },
  'studentPortal.tutorTitle': { en: 'EMBOT AI Tutor Guidance', da: 'EMBOT AI Tutor-vejledning', fi: 'EMBOT AI -tuutorin ohjaus', sv: 'EMBOT AI-handledning' },
  'studentPortal.tutorHint': { en: 'AI Hint: Read the question carefully, review each option or task step, and select your best answer!', da: 'AI-vink: Læs spørgsmålet grundigt, gennemgå svarmulighederne og vælg det bedste svar!', fi: 'AI-vihje: Lue kysymys huolellisesti, käy läpi vaihtoehdot ja valitse paras vastaus!', sv: 'AI-tips: Läs frågan noggrant, granska alternativen och välj ditt bästa svar!' },
  'studentPortal.tutorGotIt': { en: 'Got it! Thanks EMBOT', da: 'Forstået! Tak EMBOT', fi: 'Selvä! Kiitos EMBOT', sv: 'Fattat! Tack EMBOT' },
  'studentPortal.gotIt': { en: 'Got it! 👍', da: 'Forstået! 👍', fi: 'Selvä! 👍', sv: 'Fattat! 👍' },
  'studentPortal.noLiveActivityTitle': { en: 'No Live Activity', da: 'Ingen live-aktivitet', fi: 'Ei live-aktiviteettia', sv: 'Ingen live-aktivitet' },
  'studentPortal.noLiveActivityNotice': { en: 'No live activity is currently running for your classroom.', da: 'Ingen live-aktivitet kører for din klasse i øjeblikket.', fi: 'Luokallesi ei ole tällä hetkellä käynnissä live-aktiviteettia.', sv: 'Ingen live-aktivitet pågår för din klass för närvarande.' },
  'studentPortal.backToAssigned': { en: '← Back to My Assigned Activities', da: '← Tilbage til mine tildelte aktiviteter', fi: '← Takaisin määrättyihin aktiviteetteihin', sv: '← Tillbaka till mina tilldelade aktiviteter' },
  'studentPortal.playing': { en: '📖 Playing:', da: '📖 Spiller:', fi: '📖 Suoritetaan:', sv: '📖 Spelar:' },
  'studentPortal.activityCompletedAlert': { en: '🎉 Activity completed successfully! Great work!', da: '🎉 Aktivitet fuldført! Godt arbejdet!', fi: '🎉 Aktiviteetti suoritettu onnistuneesti! Hienoa työtä!', sv: '🎉 Aktiviteten slutförd! Bra jobbat!' },
  'studentPortal.exitActivityFirst': { en: 'Please exit the current live activity first before switching tabs.', da: 'Afslut venligst den igangværende live-aktivitet, før du skifter fane.', fi: 'Poistu nykyisestä live-aktiviteetista ennen välilehden vaihtamista.', sv: 'Lämna den pågående live-aktiviteten innan du byter flik.' },
  'studentPortal.teacherDeskCheckInTitle': { en: 'In-Person Desk Check-In', da: 'Personligt tjek ved bordet', fi: 'Henkilökohtainen tarkistus', sv: 'Personlig kontroll vid bänken' },
  'studentPortal.teacherFocusTitle': { en: 'Focus Reminder', da: 'Fokuspåmindelse', fi: 'Keskittymismuistutus', sv: 'Fokuspåminnelse' },
  'studentPortal.comingToHelpMessage': { en: 'I am coming to your desk to help you.', da: 'Jeg kommer hen til dit bord for at hjælpe dig.', fi: 'Tulen pulpettisi luo auttamaan sinua.', sv: 'Jag kommer till din bänk för att hjälpa dig.' },
  'studentPortal.focusActivityMessage': { en: 'Focus on your activity.', da: 'Fokuser på din aktivitet.', fi: 'Keskity aktiviteettiisi.', sv: 'Fokusera på din aktivitet.' },
  'studentPortal.teacherSupportBadge': { en: '📍 TEACHER SUPPORT', da: '📍 LÆRERSTØTTE', fi: '📍 OPETTAJAN TUKI', sv: '📍 LÄRARSTÖD' },
  'studentPortal.teacherGuidanceBadge': { en: '💬 TEACHER GUIDANCE', da: '💬 LÆRERVEJLEDNING', fi: '💬 OPETTAJAN OHJAUS', sv: '💬 LÄRAGUIDNING' },
  'studentPortal.triDimensionAnalytics': { en: 'STUDENT 3-DIMENSION ANALYTICS', da: 'ELEVENS 3-DIMENSIONELLE ANALYSE', fi: 'OPPILAAN KOLMIULATTEINEN ANALYTIIKKA', sv: 'ELEVENS TREDIMENSIONELLA ANALYS' },
  'studentPortal.progressLabel': { en: 'Progress', da: 'Fremgang', fi: 'Edistyminen', sv: 'Framsteg' },
  'studentPortal.engagementLabel': { en: 'Engagement', da: 'Engagement', fi: 'Sitoutuminen', sv: 'Engagemang' },
  'studentPortal.correctnessLabel': { en: 'Correctness', da: 'Korrekthed', fi: 'Oikeellisuus', sv: 'Korrekthet' },
  'studentPortal.timeSpentLabel': { en: 'Time spent', da: 'Brugt tid', fi: 'Käytetty aika', sv: 'Använd tid' },
  'studentPortal.statusLabel': { en: 'Status', da: 'Status', fi: 'Tila', sv: 'Status' },
  'studentPortal.helpSent': { en: '🙋 Help Request Sent to Teacher!', da: '🙋 Hjælpeanmodning sendt til lærer!', fi: '🙋 Avunpyyntö lähetetty opettajalle!', sv: '🙋 Hjälpbegäran skickad till läraren!' },
  'studentPortal.askHelpTeacher': { en: '🙋 Ask Teacher for Help', da: '🙋 Spørg læreren om hjælp', fi: '🙋 Pyydä opettajalta apua', sv: '🙋 Be läraren om hjälp' },
  'studentPortal.helpRequested': { en: '✋ HELP REQUESTED', da: '✋ HJÆLP ANMODET', fi: '✋ APUA PYYDETTY', sv: '✋ HJÄLP BEGÄRD' },
  'studentPortal.askAiTutor': { en: '🤖 Ask EMBOT AI Tutor', da: '🤖 Spørg EMBOT AI Tutor', fi: '🤖 Kysy EMBOT AI -tuutorilta', sv: '🤖 Fråga EMBOT AI Tutor' },
  'studentPortal.tutorTeacherNote': { en: 'Teacher Note:', da: 'Lærernote:', fi: 'Opettajan huomautus:', sv: 'Läraranteckning:' },
  'studentPortal.submitAnswer': { en: 'Submit Answer', da: 'Indsend svar', fi: 'Lähetä vastaus', sv: 'Skicka svar' },
  'studentPortal.dashboardTitle': { en: 'Student Progress Dashboard', da: 'Elevens Kontrolpanel for Fremgang', fi: 'Oppilaan Edistymisnäkymä', sv: 'Elevens Framstegspanel' },
  'studentPortal.exitConfirmTitle': { en: 'Exit Live Activity?', da: 'Afslut live-aktivitet?', fi: 'Poistutaanko live-aktiviteetista?', sv: 'Lämna live-aktivitet?' },
  'studentPortal.exitConfirmSub': { en: 'Are you sure you want to leave this active classroom session?', da: 'Er du sikker på, at du vil forlade denne aktive klassesession?', fi: 'Oletko varma, että haluat poistua tästä aktiivisesta luokkasessiosta?', sv: 'Är du säker på att du vill lämna denna aktiva klassrumssession?' },
  'studentPortal.exitConfirmMessage': { en: 'Your progress up to this step will be saved in your classroom history.', da: 'Dine fremskridt indtil dette trin gemmes i din klassehistorik.', fi: 'Edistymisesi tähän vaiheeseen asti tallennetaan luokkahistoriaasi.', sv: 'Dina framsteg upp till detta steg sparas i din klasshistorik.' },
  'studentPortal.exitConfirmBadge': { en: '⚠️ CONFIRM EXIT', da: '⚠️ BEKRÆFT AFSLUTNING', fi: '⚠️ VAHVISTA POISTUMINEN', sv: '⚠️ BEKRÄFTA AVSLUT' },
  'studentPortal.exitConfirmBtn': { en: 'Yes, Exit Activity', da: 'Ja, afslut aktivitet', fi: 'Kyllä, poistu aktiviteetista', sv: 'Ja, lämna aktivitet' },
  'studentPortal.exitConfirmCancel': { en: 'Cancel & Stay Here', da: 'Annuller & bliv her', fi: 'Peruuta & jää tähän', sv: 'Avbryt & stanna kvar' },
  'studentPortal.exitSummaryTitle': { en: 'Session Exited', da: 'Session afsluttet', fi: 'Istunto päätetty', sv: 'Sessionen avslutad' },
  'studentPortal.exitSummaryBadge': { en: 'SESSION SUMMARY', da: 'SESSIONSRESUMÉ', fi: 'ISTUNNON YHTEENVETO', sv: 'SESSIONSRECAP' },
  'studentPortal.completionSummaryTitle': { en: 'Activity Completed! 🎉', da: 'Aktivitet fuldført! 🎉', fi: 'Aktiviteetti suoritettu! 🎉', sv: 'Aktiviteten slutförd! 🎉' },
  'studentPortal.completionSummaryBadge': { en: 'GREAT WORK!', da: 'GODT ARBEJDET!', fi: 'HIENOA TYÖTÄ!', sv: 'BRA JOBBAT!' },
  'studentPortal.summaryProgress': { en: 'Final Progress', da: 'Endelig fremgang', fi: 'Lopullinen edistyminen', sv: 'Slutligt framsteg' },
  'studentPortal.summaryTimeSpent': { en: 'Time Spent', da: 'Brugt tid', fi: 'Käytetty aika', sv: 'Använd tid' },
  'studentPortal.returnToDashboard': { en: 'Return to Student Dashboard →', da: 'Vend tilbage til elevpanel →', fi: 'Palaa oppilasnäkymään →', sv: 'Återgå till elevpanelen →' },

  // clockDiagram
  'clockDiagram.badge': { en: '24-HOUR RADIAL SCHEDULE', da: '24-TIMERS SKEMA', fi: '24-TUNNIN AIKATAULU', sv: '24-TIMMARSSCHEMA' },
  'clockDiagram.defaultTitle': { en: '24-Hour Daily Schedule', da: '24-Timers Dagsplan', fi: '24-tunnin päiväohjelma', sv: '24-timmars dagschema' },
  'clockDiagram.defaultInstructions': { en: 'Explore or allocate activities across the 24-hour radial clock dial.', da: 'Udforsk eller tildel aktiviteter på uret.', fi: 'Tutki tai määritä aktiviteetteja kelloon.', sv: 'Utforska eller tilldela aktiviteter på klockan.' },
  'clockDiagram.centerLabel': { en: '24-HOUR DIAL', da: '24-TIMERS SKIVE', fi: '24-TUNNIN KELLOTAULU', sv: '24-TIMMARSUR' },
  'clockDiagram.centerSublabel': { en: 'Interactive Clock', da: 'Interaktivt Ur', fi: 'Interaktiivinen kello', sv: 'Interaktiv klocka' },
  'clockDiagram.addActivityTooltip': { en: 'Click slot to edit activity', da: 'Klik for at redigere aktivitet', fi: 'Napsauta muokataksesi aktiviteettia', sv: 'Klicka för att redigera aktivitet' },
  'clockDiagram.selectedSlot': { en: 'SELECTED TIME SLOT', da: 'VALGT TIDSUM', fi: 'VALITTU AIKAVÄLI', sv: 'VALD TIDSINDEVALL' },
  'clockDiagram.modalTitle': { en: 'Configure Time Slot', da: 'Konfigurer tidsrum', fi: 'Määritä aikaväli', sv: 'Konfigurera tidsintervall' },
  'clockDiagram.modalLabel': { en: 'ACTIVITY / EVENT TITLE', da: 'AKTIVITET / BEGIVENHEDSTITEL', fi: 'AKTIVITEETTI / TAPAHTUMA', sv: 'AKTIVITET / HÄNDELSETITEL' },
  'clockDiagram.quickSelect': { en: 'QUICK PRESET CATEGORIES', da: 'HURTIGE KATEGORIER', fi: 'PIKAKATEGORIAT', sv: 'SNABBKATEGORIER' },
  'clockDiagram.saveSchedule': { en: 'SAVE SCHEDULE ENTRY', da: 'GEM SKEMA', fi: 'TALLENNA MERKINTÄ', sv: 'SPARA SCHEMAPOST' },
  'clockDiagram.scheduleSaved': { en: '✓ Schedule Saved!', da: '✓ Skema gemt!', fi: '✓ Aikataulu tallennettu!', sv: '✓ Schema sparat!' },
  'clockDiagram.quizEvaluated': { en: '✓ Clock Dial Activity Checked!', da: '✓ Uraktivitet tjekket!', fi: '✓ Kellotehtävä tarkistettu!', sv: '✓ Klockaktivitet kontrollerad!' },

  // activityCreation
  'activityCreation.increaseTimer': { en: 'Increase timer (+1 min)', da: 'Øg timer (+1 min)', fi: 'Lisää aikaa (+1 min)', sv: 'Öka timer (+1 min)' },
  'activityCreation.decreaseTimer': { en: 'Decrease timer (-1 min)', da: 'Reducer timer (-1 min)', fi: 'Vähennä aikaa (-1 min)', sv: 'Minska timer (-1 min)' },
  'activityCreation.alreadyPublished': { en: 'Activity Already Published', da: 'Aktivitet allerede udgivet', fi: 'Aktiviteetti on jo julkaistu', sv: 'Aktiviteten är redan publicerad' },
  'activityCreation.joinCodeLabel': { en: 'Join Code:', da: 'Tilmeldingskode:', fi: 'Liittymiskoodi:', sv: 'Anslutningskod:' },
  'activityCreation.assignedToLabel': { en: 'Assigned to:', da: 'Tildelt til:', fi: 'Määrätty:', sv: 'Tilldelad:' },
  'activityCreation.dismiss': { en: 'Dismiss', da: 'Luk', fi: 'Sulje', sv: 'Stäng' },
  'activityCreation.copyJoinCode': { en: 'Copy Join Code 📋', da: 'Kopiér tilmeldingskode 📋', fi: 'Kopioi liittymiskoodi 📋', sv: 'Kopiera anslutningskod 📋' },
  'activityCreation.copiedCodeNotice': { en: '📋 Copied share code "{{code}}" to clipboard!', da: '📋 Kopierede delingskode "{{code}}" til udklipsholder!', fi: '📋 Kopioitu jakokoodi "{{code}}" leikepöydälle!', sv: '📋 Kopierade delningskod "{{code}}" till urklipp!' }
};

let setKeysCount = 0;

for (const [keyPath, langMap] of Object.entries(translations)) {
  for (const lang of ['en', 'da', 'fi', 'sv']) {
    const targetObj = lang === 'en' ? en : lang === 'da' ? da : lang === 'fi' ? fi : sv;
    setNested(targetObj, keyPath, langMap[lang]);
  }
  setKeysCount++;
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(daPath, JSON.stringify(da, null, 2), 'utf8');
fs.writeFileSync(fiPath, JSON.stringify(fi, null, 2), 'utf8');
fs.writeFileSync(svPath, JSON.stringify(sv, null, 2), 'utf8');

console.log(`Successfully populated ${setKeysCount} translation key sets across en.json, da.json, fi.json, and sv.json.`);

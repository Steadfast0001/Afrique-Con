import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    nav: {
      home: "Home",
      findTrips: "Find Trips",
      myTrips: "My Trips",
      staffConsole: "Staff Console",
      signIn: "Sign In",
      register: "Register",
      signOut: "Sign Out"
    },
    home: {
      heroBadge: "Cameroon's #1 Bus Booking Platform",
      heroTitle1: "Travel smarter,",
      heroTitle2: "arrive easier.",
      heroSubtext: "Book inter-city and cross-border bus tickets online. Choose your seat, pay with Mobile Money, and travel in Silver or Gold comfort.",
      searchCardTitle: "Search Trips",
      selectCity: "Select city",
      from: "From",
      to: "To",
      travelDate: "Travel Date",
      searchTripsBtn: "Search Trips",
      popularRoutes: "Popular Routes",
      popularRoutesSub: "Most booked trips this week",
      tripsCount: "trips",
      crossBorder: "Cross Border",
      whyChooseUs: "Why Passengers Choose TransitFlow",
      whyChooseUsSub: "We offer the most reliable transit service across major hubs.",
      feature1Title: "Cross-Border Routes",
      feature1Desc: "Direct daily connections from Bamenda to Enugu with border manifest clearance assistance.",
      feature2Title: "Mobile Payments",
      feature2Desc: "Simulated integration with CamPay Sandbox for instant MTN MoMo and Orange Money tickets.",
      feature3Title: "VIP Class Buses",
      feature3Desc: "Upgrade to Gold VIP+ for reclining premium seats, AC, charging outlets, and onboard snacks."
    },
    search: {
      title: "All Available Trips",
      tripsFound: "trips found",
      allDates: "All dates",
      anyCity: "Any city",
      from: "From",
      to: "To",
      date: "Date",
      searchBtn: "Search",
      noTrips: "No trips found for this route.",
      noTripsSub: "Try different cities or leave the date blank.",
      bookNow: "Book Now",
      seatsLeft: "seats left",
      departure: "Departure",
      arrival: "Arrival",
      crossBorder: "Cross-Border",
      duration: "Duration"
    },
    book: {
      tripNotFound: "Trip schedule not found.",
      goHome: "Go Home",
      step1: "Select Seats",
      step2: "Passenger Details",
      step3: "Payment",
      seatsAssigned: "Seats Assigned",
      booked: "Booked",
      available: "Available",
      selected: "Selected",
      vipUpgradeTitle: "Upgrade to VIP?",
      vipUpgradeDesc: "Upgrade to Gold VIP+ class for reclining leather seats, individual power outlets, AC, and premium snacks for just a 150% fare multiplier.",
      keepClass: "Keep Silver Class",
      upgradeClass: "Upgrade to Gold VIP+",
      proceedDetails: "Proceed to Details",
      contactDetails: "Contact Details",
      contactEmail: "Contact Email",
      contactPhone: "Contact Phone",
      passengerNum: "Passenger #",
      fullName: "Full Name",
      passportNum: "Passport Number (Required for Cross-Border)",
      passportNumber: "Passport Number",
      proceedPayment: "Proceed to Payment",
      goBack: "Go Back",
      summary: "Trip Summary",
      tripDetails: "Trip Details",
      class: "Class",
      pricePerSeat: "Price per seat",
      totalFare: "Total Fare",
      paymentMethod: "Payment Method",
      momo: "MTN MoMo or Orange Money",
      cash: "Cash at Counter",
      phoneLabel: "Mobile Money Phone Number",
      paymentSuccessMsg: "Your payment was processed successfully. Print your E-Ticket below for boarding check-in.",
      campayCheckout: "CamPay Checkout",
      paymentPending: "Processing Payment...",
      momoPrompt: "A Mobile Money push prompt has been sent to your phone. Please check your phone, enter your PIN code to authorize the sandbox transaction.",
      cancelBtn: "Cancel",
      paymentSuccess: "Payment Successful!",
      paymentSuccessSub: "Simulated sandbox transaction completed successfully.",
      viewTicketBtn: "View Ticket",
      paymentFailed: "Payment Failed!",
      retryBtn: "Retry Checkout",
      confirmBooking: "Confirm Booking",
      errors: {
        emailRequired: "Contact email is required.",
        nameRequired: "Full name is required.",
        passportRequired: "Passport number is required for cross-border routes."
      }
    },
    ticket: {
      notFound: "Ticket record not found.",
      goHome: "Go Home",
      confirmed: "Booking Confirmed!",
      confirmedSub: "Your payment was processed successfully. Print your E-Ticket below for boarding check-in.",
      boardingPass: "BOARDING PASS / E-TICKET",
      bookingRef: "Booking Ref",
      departureStation: "Departure Station",
      arrivalStation: "Arrival Station",
      passengerName: "Passenger Name",
      contactEmail: "Contact Email",
      seatsAssigned: "Seats Assigned",
      busClass: "Bus Class",
      travelDoc: "Travel Document / Passport",
      date: "Date",
      departureTime: "Departure Time",
      gatePlatform: "Gate / Platform",
      boardingStatus: "Boarding Status",
      paidConfirmed: "Paid • Confirmed",
      totalFare: "Total Fare Charged",
      settledVia: "Settled via",
      bookAnother: "Book Another Trip",
      printTicket: "Print E-Ticket"
    },
    myTrips: {
      signInPrompt: "Sign in to view your trips",
      signInSub: "Access your booking history and download tickets.",
      signInBtn: "Sign In",
      registerBtn: "Register",
      bookingsCount: "booking",
      bookingsCountPlural: "bookings",
      welcomeBack: "Welcome back",
      bookNewTrip: "Book New Trip",
      noTrips: "You don't have any booked trips yet.",
      startBooking: "Start booking now",
      view: "View",
      cancel: "Cancel",
      cancelConfirm: "Are you sure you want to cancel this booking and request a refund?",
      seat: "Seat",
      ref: "Ref"
    },
    auth: {
      welcomeBack: "Welcome back",
      createAccount: "Create your account",
      resetPassword: "Reset password",
      logInSub: "Log in to your account",
      signUpSub: "Sign up to get started",
      resetSub: "Enter your email to receive a reset link",
      googleBtn: "Continue with Google",
      or: "OR",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      forgotPasswordLink: "Forgot password?",
      signInBtn: "Sign In",
      registerBtn: "Register",
      resetBtn: "Send Reset Link",
      haveAccount: "Already have an account? Sign In",
      noAccount: "Don't have an account? Register",
      passwordLengthErr: "Password must be at least 6 characters.",
      passwordMatchErr: "Passwords do not match.",
      resetSent: "If an account exists, a reset link will be sent to your email."
    },
    bot: {
      welcome: "Hello! I am TransitBot, your virtual assistant. How can I help you today?",
      chatTitle: "TransitBot",
      statusOnline: "Virtual Assistant",
      inputPlaceholder: "Ask a question...",
      quickReplies: {
        q1: "How do I book a ticket?",
        r1: "To book a ticket, go to the Home page, select your departure and arrival stations, choose a date, and click \"Search Trips\". Then select your seat, enter passenger details, and confirm simulated payment.",
        q2: "What is the refund policy?",
        r2: "You can cancel any \"Pending\" ticket from the \"My Trips\" page. Cancellations will immediately process a refund back to your mock wallet.",
        q3: "How to contact support?",
        r3: "If you have an issue, please log in and submit a support ticket in the Support Desk or contact us at +237 6 77 12 34 56.",
        q4: "Check fleet status",
        r4: "Our operations team keeps the fleet status updated! Standard VIP classes are currently active and running on scheduled domestic & cross-border routes."
      },
      defaultReply: "Thank you for your message! Our operators are online in the Operations Console. For instant support, please use one of our quick reply buttons or submit a support ticket.",
      supportOptions: "Support Options",
      liveChat: "Live Agent Chat",
      liveChatDesc: "Chat live with our support agents right now",
      whatsappChat: "WhatsApp Support",
      whatsappChatDesc: "Connect with us directly on WhatsApp",
      needHelp: "Help & Support"
    }
  },
  fr: {
    nav: {
      home: "Accueil",
      findTrips: "Trouver des trajets",
      myTrips: "Mes Voyages",
      staffConsole: "Console Personnel",
      signIn: "Se connecter",
      register: "S'inscrire",
      signOut: "Se déconnecter"
    },
    home: {
      heroBadge: "Plateforme de réservation de bus N°1 du Cameroun",
      heroTitle1: "Voyagez plus malin,",
      heroTitle2: "arrivez plus serein.",
      heroSubtext: "Réservez vos billets de bus interurbains et transfrontaliers en ligne. Choisissez votre siège, payez par Mobile Money et voyagez dans le confort Silver ou Gold.",
      searchCardTitle: "Rechercher des trajets",
      selectCity: "Sélectionner une ville",
      from: "De",
      to: "À",
      travelDate: "Date de voyage",
      searchTripsBtn: "Rechercher des trajets",
      popularRoutes: "Trajets populaires",
      popularRoutesSub: "Les trajets les plus réservés cette semaine",
      tripsCount: "trajets",
      crossBorder: "Transfrontalier",
      whyChooseUs: "Pourquoi les passagers choisissent TransitFlow",
      whyChooseUsSub: "Nous offrons le service de transport le plus fiable entre les principaux hubs.",
      feature1Title: "Lignes Transfrontalières",
      feature1Desc: "Liaisons quotidiennes directes de Bamenda à Enugu avec assistance pour le dédouanement des manifestes aux frontières.",
      feature2Title: "Paiements Mobiles",
      feature2Desc: "Intégration simulée avec le bac à sable CamPay pour des billets MTN MoMo et Orange Money instantanés.",
      feature3Title: "Bus de Classe VIP",
      feature3Desc: "Passez en classe Gold VIP+ pour des sièges en cuir inclinables haut de gamme, la climatisation, des prises de recharge et des collations à bord."
    },
    search: {
      title: "Tous les trajets disponibles",
      tripsFound: "trajets trouvés",
      allDates: "Toutes les dates",
      anyCity: "Toutes les villes",
      from: "De",
      to: "À",
      date: "Date",
      searchBtn: "Rechercher",
      noTrips: "Aucun trajet trouvé pour cet itinéraire.",
      noTripsSub: "Essayez d'autres villes ou laissez la date vide.",
      bookNow: "Réserver",
      seatsLeft: "places restantes",
      departure: "Départ",
      arrival: "Arrivée",
      crossBorder: "Transfrontalier",
      duration: "Durée"
    },
    book: {
      tripNotFound: "Programme de voyage introuvable.",
      goHome: "Accueil",
      step1: "Sélectionner les places",
      step2: "Détails du passager",
      step3: "Paiement",
      seatsAssigned: "Places attribuées",
      booked: "Réservé",
      available: "Disponible",
      selected: "Sélectionné",
      vipUpgradeTitle: "Passer en VIP ?",
      vipUpgradeDesc: "Passez en classe Gold VIP+ pour des sièges en cuir inclinables, des prises de courant individuelles, la climatisation et des collations premium pour seulement 150 % du tarif.",
      keepClass: "Rester en classe Silver",
      upgradeClass: "Passer en Gold VIP+",
      proceedDetails: "Continuer vers les détails",
      contactDetails: "Coordonnées",
      contactEmail: "E-mail de contact",
      contactPhone: "Téléphone de contact",
      passengerNum: "Passager n°",
      fullName: "Nom complet",
      passportNum: "Numéro de passeport (requis pour le transfrontalier)",
      passportNumber: "Numéro de passeport",
      proceedPayment: "Continuer vers le paiement",
      goBack: "Retour",
      summary: "Résumé du trajet",
      tripDetails: "Détails du voyage",
      class: "Classe",
      pricePerSeat: "Prix par place",
      totalFare: "Tarif total",
      paymentMethod: "Mode de paiement",
      momo: "MTN MoMo ou Orange Money",
      cash: "Espèces au guichet",
      phoneLabel: "Numéro Mobile Money",
      paymentSuccessMsg: "Votre paiement a été traité avec succès. Imprimez votre e-ticket ci-dessous pour l'enregistrement.",
      campayCheckout: "Paiement CamPay",
      paymentPending: "Traitement du paiement en cours...",
      momoPrompt: "Une demande de paiement Mobile Money a été envoyée sur votre téléphone. Veuillez vérifier votre téléphone, entrer votre code PIN pour autoriser la transaction.",
      cancelBtn: "Annuler",
      paymentSuccess: "Paiement réussi !",
      paymentSuccessSub: "La transaction simulée du bac à sable s'est terminée avec succès.",
      viewTicketBtn: "Voir le billet",
      paymentFailed: "Échec du paiement !",
      retryBtn: "Réessayer le paiement",
      confirmBooking: "Confirmer la réservation",
      errors: {
        emailRequired: "L'e-mail de contact est requis.",
        nameRequired: "Le nom complet est requis.",
        passportRequired: "Le numéro de passeport est requis pour les trajets transfrontaliers."
      }
    },
    ticket: {
      notFound: "Enregistrement de billet introuvable.",
      goHome: "Accueil",
      confirmed: "Réservation confirmée !",
      confirmedSub: "Votre paiement a été traité avec succès. Imprimez votre e-ticket ci-dessous pour l'enregistrement à l'embarquement.",
      boardingPass: "CARTE D'EMBARQUEMENT / E-BILLET",
      bookingRef: "Réf. Réservation",
      departureStation: "Station de départ",
      arrivalStation: "Station d'arrivée",
      passengerName: "Nom du passager",
      contactEmail: "E-mail de contact",
      seatsAssigned: "Places attribuées",
      busClass: "Classe du bus",
      travelDoc: "Document de voyage / Passeport",
      date: "Date",
      departureTime: "Heure de départ",
      gatePlatform: "Porte / Quai",
      boardingStatus: "Statut d'embarquement",
      paidConfirmed: "Payé • Confirmé",
      totalFare: "Tarif total facturé",
      settledVia: "Réglé via",
      bookAnother: "Réserver un autre trajet",
      printTicket: "Imprimer l'e-ticket"
    },
    myTrips: {
      signInPrompt: "Connectez-vous pour voir vos trajets",
      signInSub: "Accédez à votre historique de réservation et téléchargez vos billets.",
      signInBtn: "Se connecter",
      registerBtn: "S'inscrire",
      bookingsCount: "réservation",
      bookingsCountPlural: "réservations",
      welcomeBack: "Bon retour",
      bookNewTrip: "Réserver un nouveau trajet",
      noTrips: "Vous n'avez pas encore de voyages réservés.",
      startBooking: "Commencer à réserver maintenant",
      view: "Voir",
      cancel: "Annuler",
      cancelConfirm: "Êtes-vous sûr de vouloir annuler cette réservation et demander un remboursement ?",
      seat: "Place",
      ref: "Réf"
    },
    auth: {
      welcomeBack: "Bon retour",
      createAccount: "Créez votre compte",
      resetPassword: "Réinitialiser le mot de passe",
      logInSub: "Connectez-vous à votre compte",
      signUpSub: "Inscrivez-vous pour commencer",
      resetSub: "Entrez votre e-mail pour recevoir un lien de réinitialisation",
      googleBtn: "Continuer avec Google",
      or: "OU",
      email: "E-mail",
      password: "Mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      forgotPasswordLink: "Mot de passe oublié ?",
      signInBtn: "Se connecter",
      registerBtn: "S'inscrire",
      resetBtn: "Envoyer le lien de réinitialisation",
      haveAccount: "Vous avez déjà un compte ? Se connecter",
      noAccount: "Vous n'avez pas de compte ? S'inscrire",
      passwordLengthErr: "Le mot de passe doit contenir au moins 6 caractères.",
      passwordMatchErr: "Les mots de passe ne correspondent pas.",
      resetSent: "Si un compte existe, un lien de réinitialisation sera envoyé à votre adresse e-mail."
    },
    bot: {
      welcome: "Bonjour ! Je suis TransitBot, votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?",
      chatTitle: "TransitBot",
      statusOnline: "Assistant virtuel",
      inputPlaceholder: "Poser une question...",
      quickReplies: {
        q1: "Comment réserver un billet ?",
        r1: "Pour réserver un billet, allez sur la page d'accueil, sélectionnez vos stations de départ et d'arrivée, choisissez une date et cliquez sur « Rechercher des trajets ». Sélectionnez ensuite votre place, entrez les détails du passager et confirmez le paiement simulé.",
        q2: "Quelle est la politique de remboursement ?",
        r2: "Vous pouvez annuler tout billet « En attente » depuis la page « Mes voyages ». Les annulations traiteront immédiatement un remboursement sur votre compte fictif.",
        q3: "Comment contacter l'assistance ?",
        r3: "Si vous rencontrez un problème, veuillez vous connecter et soumettre un ticket d'assistance dans le centre d'assistance ou contactez-nous au +237 6 77 12 34 56.",
        q4: "Vérifier le statut de la flotte",
        r4: "Notre équipe d'exploitation maintient le statut de la flotte à jour ! Les classes VIP standard sont actuellement actives et fonctionnent sur les lignes intérieures et transfrontalières régulières."
      },
      defaultReply: "Merci pour votre message ! Nos opérateurs sont en ligne dans la console d'exploitation. Pour une assistance instantanée, veuillez utiliser l'un de nos boutons de réponse rapide ou soumettre un ticket d'assistance.",
      supportOptions: "Options d'assistance",
      liveChat: "Chat en direct avec agent",
      liveChatDesc: "Discutez en direct avec nos agents d'assistance",
      whatsappChat: "Assistance WhatsApp",
      whatsappChatDesc: "Connectez-vous directement sur WhatsApp",
      needHelp: "Aide & Support"
    }
  },
  pcm: {
    nav: {
      home: "Home",
      findTrips: "Find Waka",
      myTrips: "My Waka Dem",
      staffConsole: "Staff Place",
      signIn: "Enter",
      register: "Join",
      signOut: "Comot"
    },
    home: {
      heroBadge: "Cameroun e Number 1 Waka Booking Place",
      heroTitle1: "Waka sense-ly,",
      heroTitle2: "reach fine.",
      heroSubtext: "Book ticket for phone for waka inside or outside town. Choose your seat, pay with MoMo or Orange, travel fine inside Silver or Gold bus.",
      searchCardTitle: "Find Waka",
      selectCity: "Choose town",
      from: "Comot place",
      to: "Reach place",
      travelDate: "Waka Day",
      searchTripsBtn: "Find Waka",
      popularRoutes: "Waka dem wey pipo like",
      popularRoutesSub: "Waka dem wey pipo book pass dis week",
      tripsCount: "waka dem",
      crossBorder: "Outside Country",
      whyChooseUs: "Why passenger dem like TransitFlow",
      whyChooseUsSub: "We dey try for make your waka clean and safe.",
      feature1Title: "Waka for outside country",
      feature1Desc: "Daily waka from Bamenda to Enugu, we help clear border paper dem.",
      feature2Title: "Pay with phone",
      feature2Desc: "Pay quick-quick with MTN MoMo or Orange Money for phone.",
      feature3Title: "VIP Bus dem",
      feature3Desc: "Gold VIP+ get soft seat dem, AC, charging place, and small chop."
    },
    search: {
      title: "All Waka dem wey dey",
      tripsFound: "waka dem found",
      allDates: "All day dem",
      anyCity: "Any town",
      from: "Comot place",
      to: "Reach place",
      date: "Day",
      searchBtn: "Find",
      noTrips: "No waka dey for dis side.",
      noTripsSub: "Try choose other town or clear the waka day.",
      bookNow: "Book Waka Now",
      seatsLeft: "seat dem left",
      departure: "Time for comot",
      arrival: "Reach time",
      crossBorder: "Outside Country",
      duration: "Time for road"
    },
    book: {
      tripNotFound: "We no find dis waka schedule.",
      goHome: "Go Home",
      step1: "Choose Seat dem",
      step2: "Passenger details",
      step3: "Pay Money",
      seatsAssigned: "Seat dem",
      booked: "Taken",
      available: "Open",
      selected: "My own",
      vipUpgradeTitle: "Enter VIP?",
      vipUpgradeDesc: "Enter Gold VIP+ for get soft leather seat, charging place, AC, and small chop for road for small add-on money (1.5x price).",
      keepClass: "Stay inside Silver",
      upgradeClass: "Upgrade to Gold VIP+",
      proceedDetails: "Write passenger details",
      contactDetails: "How to call you",
      contactEmail: "Your Email",
      contactPhone: "Your Phone number",
      passengerNum: "Passenger number ",
      fullName: "Correct Name",
      passportNum: "Passport Number (Needed for Outside Country)",
      passportNumber: "Passport number",
      proceedPayment: "Go to Pay Money",
      goBack: "Go Back",
      summary: "Waka Summary",
      tripDetails: "Waka Details",
      class: "Bus Class",
      pricePerSeat: "Money for one seat",
      totalFare: "Total Money",
      paymentMethod: "How you want pay",
      momo: "MTN MoMo or Orange Money",
      cash: "Cash for counter",
      phoneLabel: "Mobile Money Phone Number",
      paymentSuccessMsg: "Your money done enter fine-fine. Print your Waka Paper below for check-in.",
      campayCheckout: "CamPay Pay Place",
      paymentPending: "Payment dey load...",
      momoPrompt: "We done send confirm message for your phone. Enter your MoMo PIN code to pay.",
      cancelBtn: "Cancel",
      paymentSuccess: "Money Done Enter!",
      paymentSuccessSub: "Simulated sandbox transaction completed successfully.",
      viewTicketBtn: "See Ticket",
      paymentFailed: "Money No Enter!",
      retryBtn: "Try Pay Again",
      confirmBooking: "Confirm Waka Booking",
      errors: {
        emailRequired: "Email must dey.",
        nameRequired: "Correct name must dey.",
        passportRequired: "Passport number must dey for waka wey dey cross country."
      }
    },
    ticket: {
      notFound: "We no find dis Waka Paper.",
      goHome: "Go Home",
      confirmed: "Waka Done Confirm!",
      confirmedSub: "Your money done enter fine-fine. Print your Waka Paper below for boarding check-in.",
      boardingPass: "WAKA PAPER / BOARDING PASS",
      bookingRef: "Waka Ref",
      departureStation: "Comot Station",
      arrivalStation: "Reach Station",
      passengerName: "Passenger Name",
      contactEmail: "Your Email",
      seatsAssigned: "Seat dem",
      busClass: "Bus Class",
      travelDoc: "Travel Document / Passport",
      date: "Day",
      departureTime: "Comot Time",
      gatePlatform: "Platform",
      boardingStatus: "Waka Status",
      paidConfirmed: "Paid • Confirmed",
      totalFare: "Total Money Paid",
      settledVia: "Paid with",
      bookAnother: "Book Another Waka",
      printTicket: "Print Waka Paper"
    },
    myTrips: {
      signInPrompt: "Log in for see your waka dem",
      signInSub: "See all your waka ticket dem and print dem.",
      signInBtn: "Log In",
      registerBtn: "Join",
      bookingsCount: "waka",
      bookingsCountPlural: "waka dem",
      welcomeBack: "Aba, welcome back",
      bookNewTrip: "Book New Waka",
      noTrips: "You never book any waka yet.",
      startBooking: "Start book waka now",
      view: "See",
      cancel: "Cancel",
      cancelConfirm: "You sure say you want cancel this waka and collect your money back?",
      seat: "Seat",
      ref: "Ref"
    },
    auth: {
      welcomeBack: "Aba, welcome back",
      createAccount: "Create your account",
      resetPassword: "Change password",
      logInSub: "Enter inside your account",
      signUpSub: "Sign up to start",
      resetSub: "Write your email to change password",
      googleBtn: "Continue with Google",
      or: "OR",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      forgotPasswordLink: "You forget password?",
      signInBtn: "Log In",
      registerBtn: "Join",
      resetBtn: "Send Link",
      haveAccount: "You get account? Enter inside",
      noAccount: "You no get account? Join us",
      passwordLengthErr: "Password must reach 6 characters.",
      passwordMatchErr: "Password dem no match.",
      resetSent: "If your email dey our side, we go send you link."
    },
    bot: {
      welcome: "Aba! I be TransitBot, your helper virtual assistant. How I fit help you today?",
      chatTitle: "TransitBot",
      statusOnline: "Virtual Assistant",
      inputPlaceholder: "Ask me question...",
      quickReplies: {
        q1: "How to book waka ticket?",
        r1: "To book waka ticket, go Home page, choose where you dey comot and where you dey go, pick day, click \"Find Waka\". Choose your seat, write passenger details, and pay with phone.",
        q2: "How I fit get my refund?",
        r2: "You fit cancel any booking from the \"My Waka Dem\" page. We go pay your money back for your wallet immediately.",
        q3: "How to contact support?",
        r3: "If you get issue, log in and send support ticket for Support Desk or call us for +237 6 77 12 34 56.",
        q4: "Check bus status",
        r4: "Our driver dem and bus dem dey active for road! Silver and Gold VIP bus dem dey run daily."
      },
      defaultReply: "Mbolo! Thank you for the message. For quick support, click the helper buttons or write support ticket.",
      supportOptions: "Support Options",
      liveChat: "Live Agent Chat",
      liveChatDesc: "Talk direct with our people now",
      whatsappChat: "WhatsApp Support",
      whatsappChatDesc: "Message us quick-quick for WhatsApp",
      needHelp: "Help & Support"
    }
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('transitflow_lang');
    return saved && translations[saved] ? saved : 'en';
  });

  const setLanguage = (lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem('transitflow_lang', lang);
    }
  };

  const t = (keyPath) => {
    const keys = keyPath.split('.');
    let translationObj = translations[language];

    for (const key of keys) {
      if (translationObj && translationObj[key] !== undefined) {
        translationObj = translationObj[key];
      } else {
        // Fallback to English
        let fallback = translations['en'];
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) {
            fallback = fallback[fk];
          } else {
            return keyPath; // Return key path if fallback is not found either
          }
        }
        return fallback;
      }
    }

    return translationObj;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

import { landingPath } from "../../../../constants/landingRoutes";

export const SITE = {
    name: "Homeo Centrum",
    tagline: "Easy Homeopathy | Easy Practice | Easy Remedy Hunting",
    phone: "+91-973 059 6019",
    email: "nigahomeocentrum@gmail.com",
    emailAlt: "jamdarnikhil@gmail.com",
    supportEmail: "support@Homeocentrum.com",
    address: "NIGA Homeopathy, Near Gurumauli Sadhana Mandir, Bagewadi, Akluj, Maharashtra, INDIA, 413101",
    hours: "Monday to Saturday, 9 AM to 6 PM IST",
    hoursShort: "Mon to Sat : 9 AM to 6 PM",
    copyright: "Homeo Centrum",
    poweredBy: "MeshBA Solutions",
    mapEmbed:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3797.0068151672504!2d74.99762617402966!3d17.88513488827767!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc474f95411a14f%3A0x966e71d6ff33ef2!2sHomeo%20Centrum!5e0!3m2!1sen!2sin!4v1684499132997!5m2!1sen!2sin",
    website: "https://homeocentrum.com",
};

/** Set `url` when official profile links are available; icons stay visible without `#` placeholders. */
export const SOCIAL_LINKS = [
    { id: "facebook", icon: "ri-facebook-fill", label: "Facebook", url: "" },
    { id: "twitter", icon: "ri-twitter-fill", label: "Twitter", url: "" },
    { id: "linkedin", icon: "ri-linkedin-fill", label: "LinkedIn", url: "" },
    { id: "instagram", icon: "ri-instagram-fill", label: "Instagram", url: "" },
    { id: "google", icon: "ri-google-fill", label: "Google", url: "" },
];

export const HERO = {
    title: "The better way to practice homeopathy with",
    highlight: "Homeo Centrum",
    subtitle:
        "Homeo Centrum is a fully responsive, cloud based homeopathic health management system built for beginner and master practitioners.",
};

export const HERO_SLIDES = [
    {
        title: "Easy Homeopathy",
        subtitle: "Efficient and Certain way of practicing Homeopathy.",
        cta: { label: "Our Company", path: landingPath("about") },
    },
    {
        title: "Easy Practice",
        subtitle: "World class homeopathic health management system",
        cta: { label: "Testimonials", path: `${landingPath()}#reviews` },
    },
    {
        title: "Easy Remedy Hunting",
        subtitle: "With over 10 years of experience helping businesses to find comprehensive solutions.",
        cta: { label: "Our Company", path: landingPath("about") },
    },
];

export const WHY_CHOOSE = {
    title: "Why Choosing Homeo Centrum",
    description:
        "Homeo Centrum is the perfect cloud based tool for accurate prescription finding systems. It assists both beginner and master homeopathic practitioners to treat any simple to complicated cases, of any pathology in an easy way.",
    items: [
        {
            icon: "ri-time-line",
            title: "Time Minimization",
            text: "It minimizes the time period of case taking & finds predictable possibilities of patient's information in keyword format to the practitioner.",
        },
        {
            icon: "ri-stack-line",
            title: "Homeopathic Evolutionary",
            text: "First time ever in homeopathic history, Homeo Centrum displays a timeframe of evolutionary development of a patient's condition.",
        },
        {
            icon: "ri-layers-line",
            title: "Layer Differentiation",
            text: "It also differentiates the layer wise problem of the patient so it augments the vision on the totality concept of homeopathy.",
        },
    ],
};

export const HOME_SERVICES = [
    {
        icon: "ri-stethoscope-line",
        title: "Case Taking Module",
        text: "Assists practitioners to explore detailed case history with keywords for unbiased symptom collection and exact rubric hunting.",
    },
    {
        icon: "ri-bar-chart-grouped-line",
        title: "Repertorization",
        text: "Graphical remedy score system suggesting final remedial lists with multi-lingual rubric search support.",
    },
    {
        icon: "ri-heart-pulse-line",
        title: "Diagnosis Master",
        text: "Links diagnostic symptoms with structured repertorial rubrics for beginner and experienced homeopaths.",
    },
    {
        icon: "ri-book-open-line",
        title: "Materia Medica",
        text: "Structured materia medica and therapeutics to support final remedy shade selection after repertorization.",
    },
];

export const COUNTERS = [
    { end: 100, suffix: "+", label: "Experienced Consultants" },
    { end: 100, suffix: "%", label: "Satisfied Customers" },
    { end: 20, suffix: "+", label: "Years Experience", decimal: 0 },
    { end: 7, suffix: "+", label: "Clinical Modules", decimal: 0 },
];

export const TESTIMONIALS = [
    {
        name: "Jenifer Hearly",
        location: "Newyork",
        text: "Fortune has helped us to just have a better handle on everything in our business – to actually make decisions and move forward to grow.",
    },
    {
        name: "Mitchel Harward",
        location: "San Fransisco",
        text: "They bring a wealth of knowledge as well as a personal touch so often missing from other firms, helped us to just have better handle on everything.",
    },
    {
        name: "Beally Russel",
        location: "Newyork",
        text: "It involves an examination of operations which allows their team discuss the art of the possible. They bring a wealth of knowledge, we believe fortune.",
    },
];

export const FEATURE_MODULES = [
    {
        title: "Case Taking Module",
        text: "It assists beginner homeopaths to explore detailed case history by asking the keywords which helps to ask patients their symptoms without unbiased way. It helps in hunting the exact rubric that we are searching for.",
    },
    {
        title: "Repertorization Module",
        text: "Graphical score system of remedies which suggest a few final remedial lists instead of more confusing filtered remedial lists. Team of Homeo Centrum have specially developed this repertorial score system in a skillful way as no homeopath needs to look for multiple choices of various remedies, only few remedies need to be differentiated for final remedy selection. Also Homeo centrum repertory is embedded with a multi-lingual system. Each word used by different languages in this program will easily search for the exact rubric.",
    },
    {
        title: "Diagnosis Master",
        text: "At Many occasions inexperienced homeopaths get difficulty in learning basic symptoms of a particular disease and their connection with homeopathic rubric system. Homeo Centrum will assist them to link the gap between patient's diagnostic symptoms with structured repertorial rubrics.",
    },
    {
        title: "Timeline presentation of patient's details",
        text: "First time ever in homeopathic history Homeo Centrum succeeded in presenting symptomatology of patients in evolutionary, layerwise and time framed way in just with one click.",
    },
    {
        title: "Materia Medica and Therapeutics",
        text: "In most cases unstructured dynamic materia medica information is in upper hand as compared to structured mere rubric score which helps for final shade selection of the case after repertorization remedial score.",
    },
    {
        title: "Deep Analytics",
        text: "Any unresponded cases will be explored with this module just in one click. Also with the help of deep analytics we can get the symptomatology at all levels of the patients from whom we can not collect the symptoms of any sort.",
    },
];

export const ABOUT_CONTENT = {
    quote: '"Efficient and Certain way of practicing Homeopathy."',
    intro:
        "We have built an enviable reputation in the consumer goods, heavy industry, high-tech, manufacturing, medical, recreational vehicle, and transportation sectors. multidisciplinary team of engineering experts.",
    bullets: [
        "Homeo Centrum is the perfect cloud based tool for accurate prescription finding systems. It assists both beginner and master homeopathic practitioners to treat any simple to complicated cases, of any pathology in an easy way.",
        "It minimizes the time period of case taking and finds the predictable possibilities of the patient's information in keyword format in just one click which will give a bird eye view to the practitioner. First time ever in homeopathic history.",
        "Homeo Centrum displays a timeframe of evolutionary development of a patient's condition. It also differentiates the layer wise problem of the patient so it augments the vision on the totality concept of homeopathy.",
    ],
    footerNote: "Easy Homeopathy | Easy Practice | Easy Remedy Hunting",
    aboutHome: {
        title: "About Homeo Centrum",
        text: "We have built an enviable reputation in the consumer goods, heavy industry, high-tech, manufacturing, medical, recreational vehicle, and our transportation sectors. multidisciplinary team of experts.",
    },
    whatWeDo: {
        title: "What We Do",
        text: "We are experts in this field with over 100 years experience. What that means is you are going to get right solution. please find our services.",
        items: [
            "Case Taking Module",
            "Repertorization",
            "Diagnosis Master",
            "Materia Medica",
            "Deep Analytics",
            "Timeline Presentation",
        ],
    },
};

export const FOOTER_SERVICES = [
    "Case Taking Module",
    "Repertorization",
    "Diagnosis Master",
    "Materia Medica",
    "Deep Analytics",
    "Timeline Presentation",
];

export const LATEST_PROJECTS = [
    { title: "Latest Technology", category: "Consulting", image: null },
    { title: "Audit & Assurance", category: "Financial", image: null },
    { title: "Business Growth", category: "Growth", image: null },
    { title: "Transportation Service", category: "Marketing", image: null },
];

export const ENQUIRY_SUBJECTS = [
    { value: "0", label: "Enquiry About" },
    { value: "1", label: "Enquiry Team" },
    { value: "2", label: "Enquiry service" },
];

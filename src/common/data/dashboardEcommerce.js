import avatar1 from "../../assets/images/users/avatar-1.jpg";
import avatar2 from "../../assets/images/users/avatar-2.jpg";
import avatar3 from "../../assets/images/users/avatar-3.jpg";
import avatar4 from "../../assets/images/users/avatar-4.jpg";
import avatar6 from "../../assets/images/users/avatar-6.jpg";

const ecomWidgets = [
    {
        id: 1,
        cardColor: "success",
        label: "Total Revenue",
        badge: "ri-arrow-right-up-line",
        badgeClass: "success",
        percentage: "+12.6",
        counter: "8.42",
        link: "from last month",
        bgcolor: "success",
        icon: "mdi mdi-currency-rupee",
        decimals: 2,
        prefix: "₹",
        suffix: "L"
    },
    {
        id: 2,
        cardColor: "info",
        label: "Appointments",
        badge: "ri-arrow-right-up-line",
        badgeClass: "success",
        percentage: "+8.4",
        counter: "1284",
        link: "from last month",
        bgcolor: "info",
        icon: "ri-calendar-check-line",
        decimals: 0,
        prefix: "",
        separator: ",",
        suffix: ""
    },
    {
        id: 3,
        cardColor: "primary",
        label: "Patients",
        badge: "ri-arrow-right-up-line",
        badgeClass: "success",
        percentage: "+15.2",
        counter: "3856",
        link: "from last month",
        bgcolor: "primary",
        icon: "ri-group-line",
        decimals: 0,
        prefix: "",
        separator: ",",
        suffix: ""
    },
    {
        id: 4,
        cardColor: "warning",
        label: "Pending Payments",
        badge: "ri-arrow-right-down-line",
        badgeClass: "danger",
        percentage: "-6.8",
        counter: "48.6",
        link: "from last month",
        bgcolor: "warning",
        icon: "bx bx-wallet",
        decimals: 1,
        prefix: "₹",
        suffix: "K"
    },
];

const bestSellingProducts = [
    {
        id: 1,
        img: avatar1,
        label: "Aarav Patil",
        date: "Follow-up",
        time: "10:30 AM",
        doctor: "Dr. N. Gaurav",
        type: "Follow-up",
        status: "Confirmed",
        statusClass: "success",
    },
    {
        id: 2,
        img: avatar2,
        label: "Ananya Shah",
        date: "Consultation",
        time: "11:00 AM",
        doctor: "Dr. Priya Kulkarni",
        type: "Consultation",
        status: "Completed",
        statusClass: "info",
    },
    {
        id: 3,
        img: avatar3,
        label: "Rohan Deshmukh",
        date: "Follow-up",
        time: "11:30 AM",
        doctor: "Dr. Amit Rao",
        type: "Follow-up",
        status: "Waiting",
        statusClass: "warning",
    },
    {
        id: 4,
        img: avatar4,
        label: "Sneha Joshi",
        date: "Consultation",
        time: "12:00 PM",
        doctor: "Dr. Priya Kulkarni",
        type: "Consultation",
        status: "Confirmed",
        statusClass: "success",
    },
    {
        id: 5,
        img: avatar6,
        label: "Vedant More",
        date: "Follow-up",
        time: "12:30 PM",
        doctor: "Dr. Snehal Patil",
        type: "Follow-up",
        status: "Cancelled",
        statusClass: "danger",
    },
];

const topSellers = [
    {
        id: 1,
        img: avatar1,
        label: "Dr. N. Gaurav",
        name: "Homeopathy",
        product: "Homeopathy",
        stock: 486,
        amount: "₹2.18L",
        percentage: 92,
    },
    {
        id: 2,
        img: avatar2,
        label: "Dr. Priya Kulkarni",
        name: "Homeopathy",
        product: "Homeopathy",
        stock: 412,
        amount: "₹1.86L",
        percentage: 88,
    },
    {
        id: 3,
        img: avatar3,
        label: "Dr. Amit Rao",
        name: "Homeopathy",
        product: "Homeopathy",
        stock: 328,
        amount: "₹1.42L",
        percentage: 84,
    },
    {
        id: 4,
        img: avatar4,
        label: "Dr. Snehal Patil",
        name: "Homeopathy",
        product: "Homeopathy",
        stock: 276,
        amount: "₹1.18L",
        percentage: 79,
    },
    {
        id: 5,
        img: avatar6,
        label: "Dr. Rahul Joshi",
        name: "Homeopathy",
        product: "Homeopathy",
        stock: 214,
        amount: "₹92.4K",
        percentage: 76,
    },
];

const recentOrders = [
    {
        id: 1,
        orderId: "#PZ10245",
        img: avatar1,
        name: "Aarav Patil",
        product: "Follow-up",
        amount: 32,
        vendor: "Dr. N. Gaurav",
        status: "Active",
        statusClass: "success",
        rating: "03 Sep 2026",
        votes: "",
    },
    {
        id: 2,
        orderId: "#PZ10244",
        img: avatar2,
        name: "Ananya Shah",
        product: "Consultation",
        amount: 28,
        vendor: "Dr. Priya Kulkarni",
        status: "Active",
        statusClass: "success",
        rating: "03 Sep 2026",
        votes: "",
    },
    {
        id: 3,
        orderId: "#PZ10243",
        img: avatar3,
        name: "Rohan Deshmukh",
        product: "Follow-up",
        amount: 41,
        vendor: "Dr. Amit Rao",
        status: "Waiting",
        statusClass: "warning",
        rating: "03 Sep 2026",
        votes: "",
    },
    {
        id: 4,
        orderId: "#PZ10242",
        img: avatar4,
        name: "Sneha Joshi",
        product: "Consultation",
        amount: 35,
        vendor: "Dr. N. Gaurav",
        status: "Active",
        statusClass: "success",
        rating: "02 Sep 2026",
        votes: "",
    },
    {
        id: 5,
        orderId: "#PZ10241",
        img: avatar6,
        name: "Vedant More",
        product: "Follow-up",
        amount: 24,
        vendor: "Dr. Snehal Patil",
        status: "Completed",
        statusClass: "success",
        rating: "02 Sep 2026",
        votes: "",
    },
];

const topCategories = [
    { id: 1, category: "Walk-in", total: "28.5%" },
    { id: 2, category: "Website", total: "24.8%" },
    { id: 3, category: "Referral", total: "21.6%" },
    { id: 4, category: "Mobile App", total: "16.4%" },
    { id: 5, category: "Other", total: "8.7%" },
];

// Revenue Chart Data (unchanged structure)
const allRevenueData = [
    {
        name: "Orders",
        type: "area",
        data: [34, 65, 46, 68, 49, 61, 42, 44, 78, 52, 63, 67],
    },
    {
        name: "Earnings",
        type: "bar",
        data: [
            89.25, 98.58, 68.74, 108.87, 77.54, 84.03, 51.24, 28.57, 92.57, 42.36,
            88.51, 36.57,
        ],
    },
    {
        name: "Refunds",
        type: "line",
        data: [8, 12, 7, 17, 21, 11, 5, 9, 7, 29, 12, 35],
    },
];

const monthRevenueData = [
    {
        name: "Orders",
        type: "area",
        data: [54, 85, 66, 18, 29, 31, 12, 14, 38, 72, 33, 27],
    },
    {
        name: "Earnings",
        type: "bar",
        data: [
            89.25, 98.58, 68.74, 108.87, 77.54, 84.03, 51.24, 28.57, 92.57, 42.36,
            88.51, 36.57,
        ],
    },
    {
        name: "Refunds",
        type: "line",
        data: [18, 22, 27, 37, 41, 21, 15, 19, 27, 19, 22, 45],
    },
];

const halfYearRevenueData = [
    {
        name: "Orders",
        type: "area",
        data: [34, 65, 46, 68, 49, 61, 42, 44, 78, 52, 63, 67],
    },
    {
        name: "Earnings",
        type: "bar",
        data: [
            89.25, 98.58, 68.74, 108.87, 77.54, 84.03, 51.24, 28.57, 92.57, 42.36,
            88.51, 36.57,
        ],
    },
    {
        name: "Refunds",
        type: "line",
        data: [8, 22, 87, 47, 41, 31, 5, 9, 47, 49, 32, 55],
    },
];

const yearRevenueData = [
    {
        name: "Orders",
        type: "area",
        data: [14, 35, 26, 38, 29, 31, 22, 24, 58, 32, 33, 77],
    },
    {
        name: "Earnings",
        type: "bar",
        data: [
            99.25, 88.58, 78.74, 118.87, 87.54, 94.03, 61.24, 58.57, 102.57, 62.36,
            48.51, 66.57,
        ],
    },
    {
        name: "Refunds",
        type: "line",
        data: [58, 42, 47, 57, 71, 21, 15, 69, 17, 39, 52, 55],
    },
];

export { ecomWidgets, bestSellingProducts, topSellers, recentOrders, topCategories, allRevenueData, monthRevenueData, halfYearRevenueData, yearRevenueData };
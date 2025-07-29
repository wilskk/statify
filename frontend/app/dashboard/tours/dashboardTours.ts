// Dashboard tours configuration
// Defines the onboarding tours for the dashboard interface

export interface TourStep {
  icon: React.ReactNode | string | null;
  title: string;
  content: React.ReactNode | string;
  selector: string;
  side: "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showControls?: boolean;
  pointerPadding?: number;
  pointerRadius?: number;
  nextRoute?: string;
  prevRoute?: string;
}

export interface TourDefinition {
  tour: string;
  steps: TourStep[];
}

// Dashboard main tour steps
export const dashboardTours: TourDefinition[] = [
  {
    tour: "dashboard-welcome",
    steps: [
      {
        icon: "👋",
        title: "Selamat Datang di Dashboard Statify",
        content: "Selamat datang di dashboard utama Statify! Mari kita mulai dengan melihat fitur-fitur utama.",
        selector: "#dashboard-header",
        side: "bottom",
        showControls: true,
        pointerPadding: 5,
      },
      {
        icon: "📊",
        title: "Area Konten Utama",
        content: "Ini adalah area utama untuk menampilkan konten dan hasil analisis data Anda.",
        selector: "#dashboard-content",
        side: "top",
        showControls: true,
        pointerPadding: 5,
      },
      {
        icon: "🧭",
        title: "Navigasi dan Modal",
        content: "Gunakan menu dan tombol di sekitar interface untuk mengakses berbagai fitur analisis.",
        selector: "#dashboard-nav",
        side: "bottom",
        showControls: true,
        pointerPadding: 5,
      },
      {
        icon: "⚙️",
        title: "Pengaturan dan Bantuan",
        content: "Akses pengaturan aplikasi dan fitur bantuan melalui menu yang tersedia.",
        selector: "#dashboard-footer",
        side: "top",
        showControls: true,
        pointerPadding: 5,
      }
    ]
  }
];

// Helper function to get dashboard tours
export const getDashboardTour = (tourName: string): TourDefinition | undefined => {
  return dashboardTours.find(tour => tour.tour === tourName);
};

// Helper function to get all dashboard tours
export const getAllDashboardTours = (): TourDefinition[] => {
  return dashboardTours;
};

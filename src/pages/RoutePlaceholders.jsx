const PlaceholderPage = ({ title }) => (
  <section className="page-placeholder">
    <div className="page-placeholder-inner">
      <p className="page-kicker mono">{title}</p>
      <div className="page-divider" />
    </div>
  </section>
);

export const DashboardPlaceholder = () => <PlaceholderPage title="Dashboard" />;
export const TasksPlaceholder = () => <PlaceholderPage title="Tasks" />;
export const AnalyticsPlaceholder = () => <PlaceholderPage title="Analytics" />;
export const ProfilePlaceholder = () => <PlaceholderPage title="Profile" />;

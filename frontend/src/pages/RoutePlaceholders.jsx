const PlaceholderPage = ({ title }) => (
  <section className="page-placeholder">
    <div className="page-placeholder-inner">
      <p className="page-kicker">{title}</p>
      <h1 className="page-placeholder-title">{title} locked</h1>
      <p className="page-placeholder-copy">
        This route is reserved. Current execution happens on the dashboard.
      </p>
      <div className="page-divider" />
    </div>
  </section>
);

export const DashboardPlaceholder = () => <PlaceholderPage title="Dashboard" />;
export const TasksPlaceholder = () => <PlaceholderPage title="Tasks" />;
export const AnalyticsPlaceholder = () => <PlaceholderPage title="Analytics" />;
export const ProfilePlaceholder = () => <PlaceholderPage title="Profile" />;

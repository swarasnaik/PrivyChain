function Permissions() {
  return (
    <section className="dashboard">
      <h2>Permission Management</h2>
      <p>Review how your data access permissions could be managed.</p>
      <article className="feature-card">
        <h3>College Portal</h3>
        <p>Requested information: Student credential</p>
        <span className="demo-note">Demo request — no transaction submitted</span>
      </article>
      <article className="feature-card">
        <h3>Recruitment Platform</h3>
        <p>Requested information: Certificate</p>
        <span className="demo-note">Demo request — no transaction submitted</span>
      </article>
    </section>
  );
}

export default Permissions;